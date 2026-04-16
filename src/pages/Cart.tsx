import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, ShoppingCart, CheckCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useState, useMemo } from 'react';
import CheckoutSteps from '@/components/checkout/CheckoutSteps';
import CartItemsList from '@/components/checkout/CartItemsList';
import CouponSection from '@/components/checkout/CouponSection';
import CustomerInfoStep from '@/components/checkout/CustomerInfoStep';
import OrderReviewStep from '@/components/checkout/OrderReviewStep';

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, clearCart, totalPrice } = useCart();
  const { profile, user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; type: string; value: number } | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // Customer data state
  const [customerData, setCustomerData] = useState({
    fullName: profile?.full_name || '',
    email: profile?.email || user?.email || '',
    phone: profile?.phone || '',
    address: '',
    notes: '',
  });

  // Sync profile data when it loads
  useMemo(() => {
    if (profile) {
      setCustomerData((prev) => ({
        ...prev,
        fullName: prev.fullName || profile.full_name || '',
        email: prev.email || profile.email || user?.email || '',
        phone: prev.phone || profile.phone || '',
      }));
    }
  }, [profile, user?.email]);

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

    setAppliedCoupon({ code: data.code, type: data.type, value: Number(data.value) });
    toast.success('Cupom aplicado com sucesso!');
    setApplyingCoupon(false);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const validateStep = (currentStep: number): boolean => {
    if (currentStep === 0 && items.length === 0) {
      toast.error('Seu carrinho está vazio');
      return false;
    }
    if (currentStep === 1) {
      if (!customerData.fullName.trim()) {
        toast.error('Preencha seu nome completo');
        return false;
      }
      if (!customerData.email.trim()) {
        toast.error('Preencha seu email');
        return false;
      }
      if (!customerData.phone.trim()) {
        toast.error('Preencha seu telefone');
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, 2));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const handleCheckout = async () => {
    if (!user || !profile) {
      toast.error('Faça login para finalizar o pedido');
      return;
    }
    setSubmitting(true);

    const orderItems = items.map((i) => ({
      product_id: i.product_id,
      product_name: i.product!.name,
      quantity: i.quantity,
      price: i.product!.price,
      image_url: i.product!.image_url,
    }));

    const { error } = await supabase.from('orders').insert({
      user_id: user.id,
      status: 'pending',
      total: finalPrice,
      discount,
      coupon_code: appliedCoupon?.code || null,
      items: orderItems,
    });

    if (error) {
      toast.error('Erro ao finalizar pedido. Tente novamente.');
      setSubmitting(false);
      return;
    }

    // Build WhatsApp message
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

    const itemsList = orderItems
      .map(
        (i) =>
          `   ${i.quantity}x ${i.product_name}\n      Unidade: ${i.price.toFixed(2).replace('.', ',')}€\n      Subtotal: ${(i.price * i.quantity).toFixed(2).replace('.', ',')}€`
      )
      .join('\n\n');

    const totalItems = orderItems.reduce((acc, i) => acc + i.quantity, 0);

    const couponLine = appliedCoupon
      ? `\n*Cupom aplicado:* ${appliedCoupon.code} (${appliedCoupon.type === 'percentage' ? `-${appliedCoupon.value}%` : `-${appliedCoupon.value.toFixed(2).replace('.', ',')}€`})`
      : '';

    const discountLine =
      discount > 0 ? `\n*Desconto:* -${discount.toFixed(2).replace('.', ',')}€` : '';

    const addressLine = customerData.address
      ? `\n*Endereço:* ${customerData.address}`
      : '';

    const notesLine = customerData.notes
      ? `\n*Observações:* ${customerData.notes}`
      : '';

    const msg = encodeURIComponent(
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `      *NOVO PEDIDO - STORMPODS*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `*Data:* ${formattedDate} às ${formattedTime}\n\n` +
        `*DADOS DO CLIENTE*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `*Nome:* ${customerData.fullName}\n` +
        `*Telefone:* ${customerData.phone || 'Não informado'}\n` +
        `*Email:* ${customerData.email}` +
        `${addressLine}` +
        `${notesLine}\n\n` +
        `*PRODUTOS (${totalItems} ${totalItems === 1 ? 'item' : 'itens'})*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `${itemsList}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `*RESUMO DO PEDIDO*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `*Subtotal:* ${totalPrice.toFixed(2).replace('.', ',')}€` +
        `${couponLine}` +
        `${discountLine}\n\n` +
        `*TOTAL A PAGAR:* ${finalPrice.toFixed(2).replace('.', ',')}€\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Obrigado pela preferência!\n` +
        `━━━━━━━━━━━━━━━━━━━━━━`
    );

    await clearCart();
    setOrderCompleted(true);
    toast.success('Pedido realizado com sucesso!');

    // Small delay to show success state before opening WhatsApp
    setTimeout(() => {
      window.open(`https://wa.me/351926026900?text=${msg}`, '_blank');
    }, 1500);
  };

  // Order completed screen
  if (orderCompleted) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center gap-6 px-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.6 }}
        >
          <CheckCircle className="w-20 h-20 text-success" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center space-y-2"
        >
          <h2 className="font-display text-2xl font-bold">Pedido Confirmado!</h2>
          <p className="text-muted-foreground text-sm max-w-md">
            Seu pedido foi registrado com sucesso. Você será redirecionado ao WhatsApp para concluir o atendimento.
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex gap-3"
        >
          <Button variant="outline" onClick={() => navigate('/orders')}>
            Ver meus pedidos
          </Button>
          <Button variant="hero" onClick={() => navigate('/products')}>
            Continuar comprando
          </Button>
        </motion.div>
      </div>
    );
  }

  // Empty cart
  if (items.length === 0 && step === 0) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center gap-4 px-4">
        <ShoppingCart className="w-16 h-16 text-muted-foreground" />
        <h2 className="font-display text-xl font-semibold">Seu carrinho está vazio</h2>
        <p className="text-sm text-muted-foreground text-center">
          Explore nossos produtos e encontre algo incrível
        </p>
        <Button variant="hero" onClick={() => navigate('/products')}>
          Ver produtos
        </Button>
      </div>
    );
  }

  const stepVariants = {
    enter: { opacity: 0, x: 30 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container max-w-2xl px-4">
        <h1 className="font-display text-3xl font-bold mb-2 text-center">Finalizar Pedido</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          {step === 0 && 'Revise os itens do seu carrinho'}
          {step === 1 && 'Confirme suas informações de contato'}
          {step === 2 && 'Revise tudo antes de confirmar'}
        </p>

        <CheckoutSteps currentStep={step} />

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            {step === 0 && (
              <>
                <CartItemsList
                  items={items}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeFromCart}
                />
                <CouponSection
                  couponCode={couponCode}
                  onCouponCodeChange={setCouponCode}
                  appliedCoupon={appliedCoupon}
                  onApply={applyCoupon}
                  onRemove={removeCoupon}
                  applying={applyingCoupon}
                />

                {/* Quick price summary */}
                <div className="rounded-xl border border-border/50 bg-card p-4 mt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex items-center justify-between text-sm text-success mt-1">
                      <span>Desconto</span>
                      <span>-R$ {discount.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/30">
                    <span className="text-muted-foreground font-medium">Total</span>
                    <span className="font-display text-2xl font-bold">
                      R$ {finalPrice.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              </>
            )}

            {step === 1 && (
              <CustomerInfoStep data={customerData} onChange={setCustomerData} />
            )}

            {step === 2 && (
              <OrderReviewStep
                items={items}
                customerData={customerData}
                subtotal={totalPrice}
                discount={discount}
                finalPrice={finalPrice}
                appliedCoupon={appliedCoupon}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <Button variant="outline" onClick={prevStep} className="gap-2 flex-1">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          )}

          {step < 2 ? (
            <Button variant="hero" onClick={nextStep} className="gap-2 flex-1">
              Continuar
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="hero"
              onClick={handleCheckout}
              disabled={submitting}
              className="gap-2 flex-1"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  Confirmar Pedido
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          )}
        </div>

        {step === 2 && (
          <p className="text-[11px] text-muted-foreground text-center mt-3">
            Ao confirmar, seu pedido será registrado e você será redirecionado ao WhatsApp para concluir o atendimento.
          </p>
        )}
      </div>
    </div>
  );
}
