import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/lib/admin-logger';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, ChevronDown, ChevronUp, User } from 'lucide-react';
import { toast } from 'sonner';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types';
import type { OrderStatus } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface OrderWithProfile {
  id: string;
  user_id: string;
  status: string;
  total: number;
  discount: number;
  coupon_code: string | null;
  items: any[];
  created_at: string;
  profile?: { full_name: string; email: string; phone: string } | null;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<OrderWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');

  const load = async () => {
    const [{ data: ordersData }, { data: profiles }] = await Promise.all([
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name, email, phone'),
    ]);
    const profileMap = new Map((profiles || []).map(p => [p.id, p]));
    const enriched = (ordersData || []).map(o => ({
      ...o,
      profile: profileMap.get(o.user_id) || null,
    }));
    setOrders(enriched as OrderWithProfile[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (error) { toast.error('Erro ao atualizar status'); return; }
    await logAdminAction('update_status', 'order', orderId, { status: newStatus });
    toast.success(`Status atualizado para ${ORDER_STATUS_LABELS[newStatus as OrderStatus] || newStatus}`);
    load();
  };

  const filtered = orders.filter(o => {
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
    const matchSearch = search === '' ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.profile?.email?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Pedidos</h1>
        <p className="text-sm text-muted-foreground">{orders.length} pedidos</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por ID ou cliente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-secondary" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px] bg-secondary"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass rounded-xl p-5 animate-pulse"><div className="h-12 bg-secondary rounded" /></div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm py-10 text-center">Nenhum pedido encontrado.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(o => {
            const status = o.status as OrderStatus;
            const isExpanded = expandedId === o.id;
            return (
              <div key={o.id} className="glass rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : o.id)}
                  className="w-full p-5 flex items-center justify-between text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">#{o.id.slice(0, 8)}</p>
                      <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md ${ORDER_STATUS_COLORS[status] || 'bg-secondary'}`}>
                        {ORDER_STATUS_LABELS[status] || o.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {o.profile?.full_name || 'Cliente'} · {new Date(o.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-display font-bold">R$ {o.total?.toFixed(2).replace('.', ',')}</p>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 space-y-4 border-t border-border/30 pt-4">
                        {/* Customer info */}
                        {o.profile && (
                          <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                            <User className="w-4 h-4 mt-0.5 text-muted-foreground" />
                            <div className="text-sm">
                              <p className="font-medium">{o.profile.full_name}</p>
                              <p className="text-muted-foreground text-xs">{o.profile.email} · {o.profile.phone}</p>
                            </div>
                          </div>
                        )}

                        {/* Items */}
                        <div className="space-y-1.5">
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

                        {/* Status change */}
                        <div className="flex items-center gap-3">
                          <Label className="text-xs text-muted-foreground">Alterar status:</Label>
                          <Select value={o.status} onValueChange={v => updateStatus(o.id, v)}>
                            <SelectTrigger className="w-[160px] bg-secondary h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => (
                                <SelectItem key={k} value={k}>{v}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={className}>{children}</span>;
}
