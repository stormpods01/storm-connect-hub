import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('orders').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setOrders(data || []));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Pedidos</h1>
        <p className="text-sm text-muted-foreground">{orders.length} pedidos</p>
      </div>

      {orders.length === 0 ? (
        <p className="text-muted-foreground text-sm py-10 text-center">Nenhum pedido realizado ainda.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((o: any) => (
            <div key={o.id} className="glass rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-sm">Pedido #{o.id.slice(0, 8)}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                <span className="text-xs uppercase tracking-wider px-2 py-1 rounded-md bg-secondary font-medium">
                  {o.status}
                </span>
              </div>
              {o.items && (
                <div className="space-y-1.5 border-t border-border/30 pt-3">
                  {(o.items as any[]).map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{item.product_name} x{item.quantity}</span>
                      <span>R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-bold pt-2 border-t border-border/30">
                    <span>Total</span>
                    <span>R$ {o.total?.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
