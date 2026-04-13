import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2, ArrowRight, ShoppingCart } from 'lucide-react';
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

  const handleCheckout = async () => {
    if (!user || !profile) return;
    setSubmitting(true);

    const orderItems = items.map(i => ({
      product_id: i.product_id,
      product_name: i.product.name,
      quantity: i.quantity,
      price: i.product.price,
    }));

    // Save order
    const { error } = await supabase.from('orders').insert({
      user_id: user.id,
      status: 'pending',
      total: totalPrice,
      items: orderItems,
    });

    if (error) {
      toast.error('Erro ao finalizar pedido');
      setSubmitting(false);
      return;
    }

    // Build WhatsApp message
    const itemsList = orderItems.map(i => `• ${i.product_name} (x${i.quantity}) - R$ ${(i.price * i.quantity).toFixed(2).replace('.', ',')}`).join('\n');
    const msg = encodeURIComponent(
      `🛒 *Novo Pedido - StormPods*\n\n` +
      `👤 *Cliente:* ${profile.full_name}\n` +
      `📱 *Telefone:* ${profile.phone}\n` +
      `📧 *Email:* ${profile.email || user.email}\n\n` +
      `📦 *Produtos:*\n${itemsList}\n\n` +
      `💰 *Total:* R$ ${totalPrice.toFixed(2).replace('.', ',')}`
    );

    // Clear cart
    await clearCart();
    toast.success('Pedido realizado com sucesso!');

    // Open WhatsApp
    window.open(`https://wa.me/?text=${msg}`, '_blank');

    navigate('/products');
    setSubmitting(false);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center gap-4">
        <ShoppingCart className="w-16 h-16 text-muted-foreground" />
        <h2 className="font-display text-xl font-semibold">Seu carrinho está vazio</h2>
        <p className="text-sm text-muted-foreground">Explore nossos produtos e encontre algo incrível</p>
        <Button variant="hero" onClick={() => navigate('/products')}>
          Ver produtos
        </Button>
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
                  {item.product.image_url ? (
                    <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">N/A</div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{item.product.name}</h3>
                  <p className="text-sm font-display font-bold mt-1">
                    R$ {(item.product.price * item.quantity).toFixed(2).replace('.', ',')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-accent transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-accent transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Summary */}
        <div className="glass rounded-xl p-6 mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total</span>
            <span className="font-display text-2xl font-bold">
              R$ {totalPrice.toFixed(2).replace('.', ',')}
            </span>
          </div>
          <Button
            variant="hero"
            className="w-full gap-2"
            onClick={handleCheckout}
            disabled={submitting}
          >
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
