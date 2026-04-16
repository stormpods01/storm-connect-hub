import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, ShoppingCart, Package, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_ACTIONS = [
  { label: 'Ver produtos', icon: Package, prompt: 'Quais produtos vocês têm disponíveis?' },
  { label: 'Meu carrinho', icon: ShoppingCart, prompt: 'Mostra meu carrinho' },
  { label: 'Meus pedidos', icon: Package, prompt: 'Quero ver meus pedidos' },
  { label: 'Recomendação', icon: Sparkles, prompt: 'Me recomende um produto' },
];

export default function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const cart = useCart();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          messages: newMessages,
          user_id: user?.id || null,
        },
      });

      if (error) throw error;

      const reply = data?.reply || 'Desculpe, não consegui processar sua mensagem.';
      setMessages([...newMessages, { role: 'assistant', content: reply }]);

      // Handle actions returned by AI
      if (data?.actions?.length) {
        for (const action of data.actions) {
          if (action.type === 'cart_updated') {
            toast.success(`${action.product_name} adicionado ao carrinho!`);
            // Refresh cart context
            // The cart will auto-refresh via its useEffect
          }
          if (action.type === 'login_required') {
            toast.error('Faça login para usar essa funcionalidade');
          }
        }
      }
    } catch (err: any) {
      const errorMsg = err?.message?.includes('429')
        ? 'Muitas mensagens enviadas. Aguarde um momento.'
        : err?.message?.includes('402')
          ? 'Serviço temporariamente indisponível.'
          : 'Erro ao conectar com o assistente. Tente novamente.';
      setMessages([...newMessages, { role: 'assistant', content: errorMsg }]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-105"
        aria-label={open ? 'Fechar chat' : 'Abrir chat'}
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
      </button>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] h-[540px] rounded-2xl flex flex-col overflow-hidden border border-border/50 bg-card shadow-2xl"
          >
            {/* Header */}
            <div className="p-4 border-b border-border/30 bg-card">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-sm">Assistente StormPods</h3>
                  <p className="text-[11px] text-muted-foreground">
                    {loading ? 'Digitando...' : 'Online • Posso adicionar itens ao carrinho'}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="space-y-4 pt-4">
                  <div className="text-center">
                    <Sparkles className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                    <p className="text-sm font-medium mb-1">Olá! Sou o assistente StormPods</p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Posso ajudá-lo a encontrar produtos, adicionar ao carrinho e acompanhar pedidos.
                    </p>
                  </div>

                  {/* Quick actions */}
                  <div className="grid grid-cols-2 gap-2">
                    {QUICK_ACTIONS.map((action) => (
                      <button
                        key={action.label}
                        onClick={() => sendMessage(action.prompt)}
                        className="flex items-center gap-2 p-2.5 rounded-lg border border-border/50 bg-secondary/50 hover:bg-secondary transition-colors text-left"
                      >
                        <action.icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs font-medium">{action.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                      m.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-secondary text-foreground rounded-bl-md'
                    }`}
                  >
                    {m.role === 'assistant' ? (
                      <div className="prose prose-sm prose-invert max-w-none [&_p]:mb-1.5 [&_ul]:mb-1.5 [&_li]:mb-0.5">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    ) : (
                      m.content
                    )}
                  </div>
                </motion.div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3 flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border/30 bg-card">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
                  placeholder={user ? 'Digite sua mensagem...' : 'Faça login para interagir...'}
                  className="flex-1 bg-secondary rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={loading || !input.trim()}
                  className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 transition-opacity"
                  aria-label="Enviar"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
