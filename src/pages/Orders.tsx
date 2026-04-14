import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types';
import type { OrderStatus } from '@/types';
import { ShoppingBag } from 'lucide-react';

interface OrderDisplay {
  id: string;
  status: string;
  total: number;
  discount: number;
  coupon_code: string | null;
  items: any[];
  created_at: string;
}

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<OrderDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => { setOrders((data || []) as OrderDisplay[]); setLoading(false); });
  }, [user]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container max-w-2xl">
        <h1 className="font-display text-3xl font-bold mb-2">Meus Pedidos</h1>
        <p className="text-muted-foreground text-sm mb-8">Acompanhe seus pedidos</p>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass rounded-xl p-5 animate-pulse"><div className="h-16 bg-secondary rounded" /></div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Você ainda não fez nenhum pedido.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(o => {
              const status = o.status as OrderStatus;
              return (
                <motion.div
                  key={o.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-xl p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-sm">Pedido #{o.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString('pt-BR')}</p>
                    </div>
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-md ${ORDER_STATUS_COLORS[status] || 'bg-secondary'}`}>
                      {ORDER_STATUS_LABELS[status] || o.status}
                    </span>
                  </div>
                  <div className="space-y-1.5 border-t border-border/30 pt-3">
                    {(o.items as any[]).map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{item.product_name} x{item.quantity}</span>
                        <span>R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                      </div>
                    ))}
                    {o.discount > 0 && (
                      <div className="flex justify-between text-sm text-success">
                        <span>Desconto {o.coupon_code && `(${o.coupon_code})`}</span>
                        <span>-R$ {o.discount.toFixed(2).replace('.', ',')}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold pt-2 border-t border-border/30">
                      <span>Total</span>
                      <span>R$ {o.total?.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
