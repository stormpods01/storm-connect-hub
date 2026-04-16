import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types';
import type { OrderStatus } from '@/types';
import { ShoppingBag, Package, Clock, ChevronDown, ChevronUp, RotateCcw, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface OrderDisplay {
  id: string;
  status: string;
  total: number;
  discount: number;
  coupon_code: string | null;
  items: any[];
  created_at: string;
  updated_at: string;
}

const STATUS_STEPS: OrderStatus[] = ['pending', 'processing', 'shipped', 'completed'];

function StatusTimeline({ status }: { status: OrderStatus }) {
  const currentIndex = STATUS_STEPS.indexOf(status);
  const isCancelled = status === 'cancelled';

  if (isCancelled) {
    return (
      <div className="flex items-center gap-2 mt-3">
        <div className="w-5 h-5 rounded-full bg-destructive/20 flex items-center justify-center">
          <span className="text-destructive text-xs font-bold">✕</span>
        </div>
        <span className="text-xs text-destructive font-medium">Pedido cancelado</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 mt-3">
      {STATUS_STEPS.map((step, i) => {
        const isActive = i <= currentIndex;
        return (
          <div key={step} className="flex items-center gap-1">
            <div className="flex flex-col items-center">
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                {i + 1}
              </div>
              <span className="text-[9px] text-muted-foreground mt-0.5 whitespace-nowrap">
                {ORDER_STATUS_LABELS[step]}
              </span>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div
                className={`w-6 h-0.5 mb-3 ${
                  i < currentIndex ? 'bg-primary' : 'bg-secondary'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders((data || []) as OrderDisplay[]);
        setLoading(false);
      });
  }, [user]);

  const reorder = async (order: OrderDisplay) => {
    const items = order.items as any[];
    for (const item of items) {
      await addToCart(item.product_id);
    }
    toast.success('Itens adicionados ao carrinho!');
    navigate('/cart');
  };

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold mb-1">Meus Pedidos</h1>
            <p className="text-muted-foreground text-sm">
              {orders.length > 0
                ? `${orders.length} ${orders.length === 1 ? 'pedido' : 'pedidos'} realizados`
                : 'Acompanhe seus pedidos'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/products')} className="gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5" />
            Comprar mais
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border/50 bg-card p-5 animate-pulse">
                <div className="h-20 bg-secondary rounded" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="font-display font-semibold text-lg mb-1">Nenhum pedido ainda</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Quando você fizer seu primeiro pedido, ele aparecerá aqui.
            </p>
            <Button variant="hero" onClick={() => navigate('/products')}>
              Explorar produtos
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => {
              const status = o.status as OrderStatus;
              const isExpanded = expandedOrder === o.id;
              const items = o.items as any[];
              const totalItems = items.reduce((a: number, i: any) => a + (i.quantity || 1), 0);

              return (
                <motion.div
                  key={o.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-border/50 bg-card overflow-hidden"
                >
                  {/* Header — always visible */}
                  <button
                    onClick={() => setExpandedOrder(isExpanded ? null : o.id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                        <Package className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          Pedido #{o.id.slice(0, 8)}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {new Date(o.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                          <span>•</span>
                          <span>
                            {totalItems} {totalItems === 1 ? 'item' : 'itens'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span
                          className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md font-medium ${
                            ORDER_STATUS_COLORS[status] || 'bg-secondary'
                          }`}
                        >
                          {ORDER_STATUS_LABELS[status] || o.status}
                        </span>
                        <p className="font-display font-bold text-sm mt-1">
                          R$ {o.total?.toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {/* Expanded details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-3 border-t border-border/30 pt-3">
                          {/* Status timeline */}
                          <StatusTimeline status={status} />

                          {/* Items */}
                          <div className="space-y-2 mt-3">
                            {items.map((item: any, idx: number) => (
                              <div
                                key={idx}
                                className="flex items-center gap-3 py-1.5"
                              >
                                <div className="w-10 h-10 rounded-md bg-secondary overflow-hidden flex-shrink-0">
                                  {item.image_url ? (
                                    <img
                                      src={item.image_url}
                                      alt=""
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-muted" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {item.product_name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {item.quantity}x R${' '}
                                    {item.price?.toFixed(2).replace('.', ',')}
                                  </p>
                                </div>
                                <span className="text-sm font-medium whitespace-nowrap">
                                  R${' '}
                                  {(item.price * item.quantity)
                                    .toFixed(2)
                                    .replace('.', ',')}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Price breakdown */}
                          <div className="border-t border-border/30 pt-2 space-y-1 text-sm">
                            {o.discount > 0 && (
                              <div className="flex justify-between text-success">
                                <span>
                                  Desconto{' '}
                                  {o.coupon_code && `(${o.coupon_code})`}
                                </span>
                                <span>
                                  -R$ {o.discount.toFixed(2).replace('.', ',')}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between font-bold">
                              <span>Total</span>
                              <span>
                                R$ {o.total?.toFixed(2).replace('.', ',')}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 pt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => reorder(o)}
                              className="gap-1.5 text-xs"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Pedir novamente
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
