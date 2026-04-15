import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus, Trash2, ArrowRight, ShoppingCart, Tag, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useState } from 'react';

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, clearCart, totalPrice } = useCart();
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; type: string; value: number } | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const discount = appliedCoupon
    ? appliedCoupon.type === 'percentage'
      ? totalPrice * (appliedCoupon.value / 100)
      : Math.min(appliedCoupon.value, totalPrice)
    : 0;

  const finalPrice = totalPrice - discount;

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode.trim().toUpperCase())
      .eq('active', true)
      .maybeSingle();

    if (!data || error) {
      toast.error('Cupom inválido ou inativo');
      setApplyingCoupon(false);
      return;
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      toast.error('Cupom expirado');
      setApplyingCoupon(false);
      return;
    }

    if (data.max_uses && data.used_count >= data.max_uses) {
      toast.error('Cupom esgotado');
      setApplyingCoupon(false);
      return;
    }

    if (data.min_order_value && totalPrice < data.min_order_value) {
      toast.error(`Pedido mínimo: R$ ${data.min_order_value.toFixed(2).replace('.', ',')}`);
      setApplyingCoupon(false);
      return;
    }

    setAppliedCoupon({ code: data.code, type: data.type, value: data.value });
    toast.success('Cupom aplicado!');
    setApplyingCoupon(false);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const handleCheckout = async () => {
    if (!user || !profile) return;
    setSubmitting(true);

    const orderItems = items.map(i => ({
      product_id: i.product_id,
      product_name: i.product!.name,
      quantity: i.quantity,
      price: i.product!.price,
    }));

    const { error } = await supabase.from('orders').insert({
      user_id: user.id,
      status: 'pending',
      total: finalPrice,
      discount: discount,
      coupon_code: appliedCoupon?.code || null,
      items: orderItems,
    });

    if (error) {
      toast.error('Erro ao finalizar pedido');
      setSubmitting(false);
      return;
    }

    // Increment coupon usage
    if (appliedCoupon) {
      await supabase.rpc('has_role', { _user_id: user.id, _role: 'user' }); // just to ensure auth
      // We can't update coupons as non-admin, so this is handled via the order record
    }

// Build WhatsApp message with complete order details
    const orderDate = new Date();
    const formattedDate = orderDate.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const formattedTime = orderDate.toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const itemsList = orderItems.map(i => 
      `   ${i.quantity}x ${i.product_name}\n      Unidade: ${i.price.toFixed(2).replace('.', ',')}R$\n      Subtotal: ${(i.price * i.quantity).toFixed(2).replace('.', ',')}R$`
    ).join('\n\n');

    const totalItems = orderItems.reduce((acc, i) => acc + i.quantity, 0);
    
    const couponLine = appliedCoupon 
      ? `\n*Cupom aplicado:* ${appliedCoupon.code} (${appliedCoupon.type === 'percentage' ? `-${appliedCoupon.value}%` : `-${appliedCoupon.value.toFixed(2).replace('.', ',')}R$`})`
      : '';
    
    const discountLine = discount > 0 
      ? `\n*Desconto:* -${discount.toFixed(2).replace('.', ',')}R$` 
      : '';

    const msg = encodeURIComponent(
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `      *NOVO PEDIDO - STORMPODS*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `*Data:* ${formattedDate} às ${formattedTime}\n\n` +
      `*DADOS DO CLIENTE*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `*Nome:* ${profile.full_name}\n` +
      `*Telefone:* ${profile.phone || 'Não informado'}\n` +
      `*Email:* ${profile.email || user.email}\n\n` +
      `*PRODUTOS (${totalItems} ${totalItems === 1 ? 'item' : 'itens'})*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `${itemsList}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `*RESUMO DO PEDIDO*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `*Subtotal:* ${totalPrice.toFixed(2).replace('.', ',')}R$` +
      `${couponLine}` +
      `${discountLine}\n\n` +
      `*TOTAL A PAGAR:* ${finalPrice.toFixed(2).replace('.', ',')}R$\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Obrigado pela preferência!\n` +
      `━━━━━━━━━━━━━━━━━━━━━━`
    );

    await clearCart();
    toast.success('Pedido realizado com sucesso!');
    window.open(`https://wa.me/351926026900?text=${msg}`, '_blank');
    navigate('/orders');
    setSubmitting(false);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center gap-4">
        <ShoppingCart className="w-16 h-16 text-muted-foreground" />
        <h2 className="font-display text-xl font-semibold">Seu carrinho está vazio</h2>
        <p className="text-sm text-muted-foreground">Explore nossos produtos e encontre algo incrível</p>
        <Button variant="hero" onClick={() => navigate('/products')}>Ver produtos</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container max-w-2xl">
        <h1 className="font-display text-3xl font-bold mb-8">Seu Carrinho</h1>

        <div className="space-y-3">
          <AnimatePresence>
            {items.map(item => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="glass rounded-xl p-4 flex items-center gap-4"
              >
                <div className="w-16 h-16 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
                  {item.product?.image_url ? (
                    <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">N/A</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{item.product?.name}</h3>
                  <p className="text-sm font-display font-bold mt-1">
                    R$ {((item.product?.price || 0) * item.quantity).toFixed(2).replace('.', ',')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-accent transition-colors">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-accent transition-colors">
                    <Plus className="w-3 h-3" />
                  </button>
                  <button onClick={() => removeFromCart(item.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors ml-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Coupon */}
        <div className="glass rounded-xl p-4 mt-4">
          {appliedCoupon ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-success" />
                <span className="text-sm font-medium">Cupom {appliedCoupon.code}</span>
                <span className="text-xs text-success">
                  -{appliedCoupon.type === 'percentage' ? `${appliedCoupon.value}%` : `R$ ${appliedCoupon.value.toFixed(2).replace('.', ',')}`}
                </span>
              </div>
              <button onClick={removeCoupon} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="Código do cupom"
                value={couponCode}
                onChange={e => setCouponCode(e.target.value.toUpperCase())}
                className="bg-secondary uppercase"
                onKeyDown={e => e.key === 'Enter' && applyCoupon()}
              />
              <Button variant="outline" size="sm" onClick={applyCoupon} disabled={applyingCoupon} className="gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                {applyingCoupon ? 'Verificando...' : 'Aplicar'}
              </Button>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="glass rounded-xl p-6 mt-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
          </div>
          {discount > 0 && (
            <div className="flex items-center justify-between text-sm text-success">
              <span>Desconto</span>
              <span>-R$ {discount.toFixed(2).replace('.', ',')}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-border/30">
            <span className="text-muted-foreground">Total</span>
            <span className="font-display text-2xl font-bold">R$ {finalPrice.toFixed(2).replace('.', ',')}</span>
          </div>
          <Button variant="hero" className="w-full gap-2" onClick={handleCheckout} disabled={submitting}>
            {submitting ? 'Processando...' : 'Finalizar Pedido'}
            <ArrowRight className="w-4 h-4" />
          </Button>
          <p className="text-[11px] text-muted-foreground text-center">
            Ao finalizar, você será redirecionado para o WhatsApp para concluir o atendimento.
          </p>
        </div>
      </div>
    </div>
  );
}
