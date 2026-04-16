import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const tools = [
  {
    type: "function",
    function: {
      name: "list_products",
      description:
        "Lista produtos disponíveis, opcionalmente filtrando por nome ou categoria. Use quando o cliente perguntar sobre produtos, preços ou disponibilidade.",
      parameters: {
        type: "object",
        properties: {
          search: {
            type: "string",
            description: "Texto para buscar no nome ou descrição do produto",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_stock",
      description: "Verifica o estoque de um produto específico pelo ID.",
      parameters: {
        type: "object",
        properties: {
          product_id: { type: "string", description: "ID do produto" },
        },
        required: ["product_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_to_cart",
      description:
        "Adiciona um produto ao carrinho do cliente. Só use quando o cliente pedir explicitamente para adicionar.",
      parameters: {
        type: "object",
        properties: {
          product_id: { type: "string", description: "ID do produto" },
          quantity: {
            type: "number",
            description: "Quantidade a adicionar (padrão 1)",
          },
        },
        required: ["product_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "view_cart",
      description: "Mostra o carrinho atual do cliente com todos os itens.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_order_history",
      description: "Mostra o histórico de pedidos do cliente.",
      parameters: { type: "object", properties: {} },
    },
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { messages, user_id } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Messages array required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch settings + products for context
    const [{ data: settings }, { data: products }] = await Promise.all([
      supabase.from("settings").select("ai_prompt").single(),
      supabase
        .from("products")
        .select("id, name, description, price, stock, image_url, category:categories(name)")
        .eq("active", true)
        .order("name")
        .limit(100),
    ]);

    const systemPrompt =
      settings?.ai_prompt ||
      "Você é um assistente de vendas da StormPods. Ajude os clientes.";

    const productList =
      products
        ?.map(
          (p: any) =>
            `- [${p.id}] ${p.name}: €${p.price} (${p.stock > 0 ? `${p.stock} em estoque` : "ESGOTADO"})${p.description ? ` — ${p.description}` : ""}${p.category?.name ? ` [${p.category.name}]` : ""}`
        )
        .join("\n") || "Nenhum produto cadastrado.";

    const fullSystemPrompt = `${systemPrompt}

CATÁLOGO DE PRODUTOS:
${productList}

INSTRUÇÕES:
- Quando o cliente perguntar sobre produtos, use a ferramenta list_products para buscar informação atualizada.
- Quando o cliente quiser adicionar ao carrinho, use add_to_cart com o product_id correto.
- Se o cliente quiser ver o carrinho, use view_cart.
- Se perguntar sobre pedidos, use get_order_history.
- Sempre seja prestativo, simpático e profissional.
- Responda em português.
- Use formatação markdown para melhor legibilidade.
- Quando listar produtos, inclua preço e disponibilidade.
- Se um produto está esgotado, informe o cliente e sugira alternativas.`;

    // Call AI with tools
    let aiMessages: any[] = [
      { role: "system", content: fullSystemPrompt },
      ...messages.slice(-15),
    ];

    let finalReply = "";
    let actions: any[] = [];
    let maxIterations = 5;

    while (maxIterations-- > 0) {
      const response = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: aiMessages,
            tools,
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(
            JSON.stringify({
              error:
                "Muitas requisições. Tente novamente em alguns segundos.",
            }),
            {
              status: 429,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: "Créditos de IA esgotados." }),
            {
              status: 402,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        const t = await response.text();
        console.error("AI gateway error:", response.status, t);
        throw new Error("AI gateway error");
      }

      const data = await response.json();
      const choice = data.choices?.[0];

      if (!choice) {
        finalReply = "Desculpe, não consegui responder.";
        break;
      }

      // If there are tool calls, execute them
      if (choice.finish_reason === "tool_calls" || choice.message?.tool_calls?.length) {
        aiMessages.push(choice.message);

        for (const toolCall of choice.message.tool_calls || []) {
          const fnName = toolCall.function.name;
          let args: any = {};
          try {
            args = JSON.parse(toolCall.function.arguments || "{}");
          } catch {}

          let toolResult = "";

          switch (fnName) {
            case "list_products": {
              let query = supabase
                .from("products")
                .select("id, name, description, price, stock, image_url, category:categories(name)")
                .eq("active", true);

              if (args.search) {
                query = query.or(
                  `name.ilike.%${args.search}%,description.ilike.%${args.search}%`
                );
              }

              const { data: prods } = await query.order("name").limit(20);
              if (!prods?.length) {
                toolResult = "Nenhum produto encontrado.";
              } else {
                toolResult = prods
                  .map(
                    (p: any) =>
                      `[${p.id}] ${p.name} — €${p.price} — ${p.stock > 0 ? `${p.stock} em estoque` : "ESGOTADO"}${p.description ? ` — ${p.description}` : ""}`
                  )
                  .join("\n");
              }
              break;
            }

            case "check_stock": {
              const { data: prod } = await supabase
                .from("products")
                .select("name, stock, price")
                .eq("id", args.product_id)
                .single();
              if (prod) {
                toolResult = `${prod.name}: ${prod.stock} unidades em estoque. Preço: €${prod.price}`;
              } else {
                toolResult = "Produto não encontrado.";
              }
              break;
            }

            case "add_to_cart": {
              if (!user_id) {
                toolResult =
                  "ERRO: Cliente não está logado. Peça para ele fazer login primeiro.";
                actions.push({
                  type: "login_required",
                  message: "Faça login para adicionar ao carrinho",
                });
                break;
              }

              const quantity = args.quantity || 1;

              // Check stock
              const { data: prod } = await supabase
                .from("products")
                .select("id, name, stock, price")
                .eq("id", args.product_id)
                .single();

              if (!prod) {
                toolResult = "Produto não encontrado.";
                break;
              }

              if (prod.stock < quantity) {
                toolResult = `Estoque insuficiente para ${prod.name}. Disponível: ${prod.stock} unidades.`;
                break;
              }

              // Check if already in cart
              const { data: existing } = await supabase
                .from("cart_items")
                .select("id, quantity")
                .eq("user_id", user_id)
                .eq("product_id", args.product_id)
                .maybeSingle();

              if (existing) {
                const newQty = existing.quantity + quantity;
                if (newQty > prod.stock) {
                  toolResult = `Limite de estoque atingido. Já tem ${existing.quantity} no carrinho e só há ${prod.stock} disponíveis.`;
                  break;
                }
                await supabase
                  .from("cart_items")
                  .update({ quantity: newQty })
                  .eq("id", existing.id);
                toolResult = `Atualizado: ${prod.name} — agora ${newQty}x no carrinho.`;
              } else {
                await supabase.from("cart_items").insert({
                  user_id,
                  product_id: args.product_id,
                  quantity,
                });
                toolResult = `Adicionado ao carrinho: ${quantity}x ${prod.name} (€${prod.price} cada)`;
              }

              actions.push({
                type: "cart_updated",
                product_name: prod.name,
                quantity,
              });
              break;
            }

            case "view_cart": {
              if (!user_id) {
                toolResult =
                  "ERRO: Cliente não está logado.";
                break;
              }

              const { data: cartItems } = await supabase
                .from("cart_items")
                .select("quantity, product:products(name, price, image_url)")
                .eq("user_id", user_id);

              if (!cartItems?.length) {
                toolResult = "Carrinho está vazio.";
              } else {
                const total = cartItems.reduce(
                  (sum: number, i: any) =>
                    sum + i.quantity * (i.product?.price || 0),
                  0
                );
                toolResult =
                  cartItems
                    .map(
                      (i: any) =>
                        `- ${i.quantity}x ${i.product?.name} — €${(i.product?.price * i.quantity).toFixed(2)}`
                    )
                    .join("\n") + `\n\nTotal: €${total.toFixed(2)}`;
              }
              break;
            }

            case "get_order_history": {
              if (!user_id) {
                toolResult =
                  "ERRO: Cliente não está logado.";
                break;
              }

              const { data: orders } = await supabase
                .from("orders")
                .select("id, status, total, items, created_at")
                .eq("user_id", user_id)
                .order("created_at", { ascending: false })
                .limit(5);

              if (!orders?.length) {
                toolResult = "Nenhum pedido encontrado.";
              } else {
                const statusLabels: Record<string, string> = {
                  pending: "Pendente",
                  processing: "Processando",
                  shipped: "Enviado",
                  completed: "Concluído",
                  cancelled: "Cancelado",
                };
                toolResult = orders
                  .map((o: any) => {
                    const items = (o.items as any[])
                      .map((i: any) => `${i.quantity}x ${i.product_name}`)
                      .join(", ");
                    return `Pedido #${o.id.slice(0, 8)} — ${statusLabels[o.status] || o.status} — €${o.total?.toFixed(2)} — ${items} — ${new Date(o.created_at).toLocaleDateString("pt-BR")}`;
                  })
                  .join("\n");
              }
              break;
            }

            default:
              toolResult = "Ferramenta não reconhecida.";
          }

          aiMessages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: toolResult,
          });
        }

        // Continue the loop so the model can respond with the tool results
        continue;
      }

      // No tool calls — we have a final response
      finalReply = choice.message?.content || "Desculpe, não consegui responder.";
      break;
    }

    return new Response(
      JSON.stringify({ reply: finalReply, actions }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("ai-chat error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Erro desconhecido",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
