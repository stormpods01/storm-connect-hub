import { Package, User, Tag, Receipt } from 'lucide-react';
import type { CartItem, Product } from '@/types';

interface OrderReviewStepProps {
  items: (CartItem & { product: Product })[];
  customerData: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    notes: string;
  };
  subtotal: number;
  discount: number;
  finalPrice: number;
  appliedCoupon: { code: string; type: string; value: number } | null;
}

export default function OrderReviewStep({
  items,
  customerData,
  subtotal,
  discount,
  finalPrice,
  appliedCoupon,
}: OrderReviewStepProps) {
  const fmt = (v: number) => v.toFixed(2).replace('.', ',');

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-lg font-semibold mb-1">Revise seu pedido</h2>
        <p className="text-sm text-muted-foreground">
          Confira todos os detalhes antes de confirmar.
        </p>
      </div>

      {/* Customer info summary */}
      <div className="rounded-xl border border-border/50 bg-card p-4 space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Dados do cliente</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground text-xs">Nome</span>
            <p className="font-medium">{customerData.fullName}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Telefone</span>
            <p className="font-medium">{customerData.phone || 'Não informado'}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Email</span>
            <p className="font-medium">{customerData.email}</p>
          </div>
          {customerData.address && (
            <div>
              <span className="text-muted-foreground text-xs">Endereço</span>
              <p className="font-medium">{customerData.address}</p>
            </div>
          )}
        </div>
        {customerData.notes && (
          <div className="pt-2 border-t border-border/30">
            <span className="text-muted-foreground text-xs">Observações</span>
            <p className="text-sm">{customerData.notes}</p>
          </div>
        )}
      </div>

      {/* Items summary */}
      <div className="rounded-xl border border-border/50 bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Produtos ({items.reduce((a, i) => a + i.quantity, 0)} itens)
          </span>
        </div>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-md bg-secondary overflow-hidden flex-shrink-0">
                  {item.product?.image_url ? (
                    <img src={item.product.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{item.product?.name}</p>
                  <p className="text-xs text-muted-foreground">{item.quantity}x R$ {fmt(item.product?.price || 0)}</p>
                </div>
              </div>
              <span className="text-sm font-semibold whitespace-nowrap ml-2">
                R$ {fmt((item.product?.price || 0) * item.quantity)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Price breakdown */}
      <div className="rounded-xl border border-border/50 bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Receipt className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Resumo financeiro</span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>R$ {fmt(subtotal)}</span>
          </div>
          {appliedCoupon && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1">
                <Tag className="w-3 h-3" />
                Cupom {appliedCoupon.code}
              </span>
              <span className="text-success font-medium">
                -{appliedCoupon.type === 'percentage'
                  ? `${appliedCoupon.value}%`
                  : `R$ ${fmt(appliedCoupon.value)}`}
              </span>
            </div>
          )}
          {discount > 0 && (
            <div className="flex justify-between text-success">
              <span>Desconto</span>
              <span>-R$ {fmt(discount)}</span>
            </div>
          )}
          <div className="flex justify-between pt-3 border-t border-border/30">
            <span className="font-semibold">Total a pagar</span>
            <span className="font-display text-xl font-bold">R$ {fmt(finalPrice)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
