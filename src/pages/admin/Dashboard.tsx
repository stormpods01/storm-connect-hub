import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, ShoppingBag, Package, TrendingUp, Tag, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types';
import type { OrderStatus } from '@/types';

interface Stats {
  users: number;
  orders: number;
  products: number;
  revenue: number;
  activeProducts: number;
  activeCoupons: number;
}

interface RecentOrder {
  id: string;
  status: string;
  total: number;
  created_at: string;
  profile?: { full_name: string } | null;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ users: 0, orders: 0, products: 0, revenue: 0, activeProducts: 0, activeCoupons: 0 });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [ordersByStatus, setOrdersByStatus] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [
        { count: users },
        { count: orders },
        { count: products },
        { count: activeProducts },
        { count: activeCoupons },
        { data: allOrders },
        { data: recentRaw },
        { data: profiles },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('active', true),
        supabase.from('coupons').select('*', { count: 'exact', head: true }).eq('active', true),
        supabase.from('orders').select('total, status'),
        supabase.from('orders').select('id, status, total, created_at, user_id').order('created_at', { ascending: false }).limit(8),
        supabase.from('profiles').select('id, full_name'),
      ]);

      const profileMap = new Map((profiles || []).map(p => [p.id, p.full_name]));
      const revenue = (allOrders || []).reduce((s, o: any) => s + (o.total || 0), 0);
      const statusCount: Record<string, number> = {};
      (allOrders || []).forEach((o: any) => { statusCount[o.status] = (statusCount[o.status] || 0) + 1; });

      const recentWithNames = (recentRaw || []).map((o: any) => ({
        ...o,
        profile: { full_name: profileMap.get(o.user_id) || 'Cliente' },
      }));

      setStats({
        users: users || 0,
        orders: orders || 0,
        products: products || 0,
        revenue,
        activeProducts: activeProducts || 0,
        activeCoupons: activeCoupons || 0,
      });
      setRecentOrders((recent || []) as RecentOrder[]);
      setOrdersByStatus(statusCount);
      setLoading(false);
    };
    load();
  }, []);

  const cards = [
    { icon: Users, label: 'Usuários', value: stats.users },
    { icon: ShoppingBag, label: 'Pedidos', value: stats.orders },
    { icon: Package, label: 'Produtos Ativos', value: `${stats.activeProducts}/${stats.products}` },
    { icon: TrendingUp, label: 'Receita Total', value: `R$ ${stats.revenue.toFixed(2).replace('.', ',')}` },
    { icon: Tag, label: 'Cupons Ativos', value: stats.activeCoupons },
  ];

  if (loading) {
    return (
      <div className="space-y-8">
        <div><h1 className="font-display text-2xl font-bold">Dashboard</h1></div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass rounded-xl p-5 animate-pulse"><div className="h-16 bg-secondary rounded" /></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral do seu negócio</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((c, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass rounded-xl p-5"
          >
            <c.icon className="w-5 h-5 text-muted-foreground mb-3" />
            <p className="text-2xl font-display font-bold">{c.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Order Status Distribution */}
      <div className="glass rounded-xl p-6">
        <h2 className="font-display font-semibold mb-4">Pedidos por Status</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {(['pending', 'processing', 'shipped', 'completed', 'cancelled'] as OrderStatus[]).map(status => (
            <div key={status} className="text-center p-3 rounded-lg bg-secondary/50">
              <p className="text-2xl font-display font-bold">{ordersByStatus[status] || 0}</p>
              <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md ${ORDER_STATUS_COLORS[status]}`}>
                {ORDER_STATUS_LABELS[status]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="glass rounded-xl p-6">
        <h2 className="font-display font-semibold mb-4">Pedidos Recentes</h2>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum pedido ainda.</p>
        ) : (
          <div className="space-y-3">
            {recentOrders.map(o => {
              const status = o.status as OrderStatus;
              return (
                <div key={o.id} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
                  <div>
                    <p className="text-sm font-medium">#{o.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">
                      {(o as any).profile?.full_name || 'Cliente'} · {new Date(o.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md ${ORDER_STATUS_COLORS[status] || 'bg-secondary'}`}>
                      {ORDER_STATUS_LABELS[status] || o.status}
                    </span>
                    <p className="text-sm font-display font-bold">R$ {o.total?.toFixed(2).replace('.', ',')}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
