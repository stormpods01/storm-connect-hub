import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, ShoppingBag, Package, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface Stats {
  users: number;
  orders: number;
  products: number;
  revenue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ users: 0, orders: 0, products: 0, revenue: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const [{ count: users }, { count: orders }, { count: products }, { data: ordersData }] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5),
      ]);
      const revenue = (ordersData || []).reduce((s: number, o: any) => s + (o.total || 0), 0);
      setStats({ users: users || 0, orders: orders || 0, products: products || 0, revenue });
      setRecentOrders(ordersData || []);
    };
    load();
  }, []);

  const cards = [
    { icon: Users, label: 'Usuários', value: stats.users, color: 'text-foreground' },
    { icon: ShoppingBag, label: 'Pedidos', value: stats.orders, color: 'text-foreground' },
    { icon: Package, label: 'Produtos', value: stats.products, color: 'text-foreground' },
    { icon: TrendingUp, label: 'Receita Potencial', value: `R$ ${stats.revenue.toFixed(2).replace('.', ',')}`, color: 'text-foreground' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral do seu negócio</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass rounded-xl p-5"
          >
            <c.icon className="w-5 h-5 text-muted-foreground mb-3" />
            <p className="text-2xl font-display font-bold">{c.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="glass rounded-xl p-6">
        <h2 className="font-display font-semibold mb-4">Pedidos Recentes</h2>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum pedido ainda.</p>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((o: any) => (
              <div key={o.id} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
                <div>
                  <p className="text-sm font-medium">Pedido #{o.id.slice(0, 8)}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-display font-bold">R$ {o.total?.toFixed(2).replace('.', ',')}</p>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{o.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
