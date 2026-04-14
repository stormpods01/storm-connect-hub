import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/lib/admin-logger';
import type { Coupon } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, X, Tag, Percent, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: '', type: 'percentage' as 'percentage' | 'fixed', value: '', min_order_value: '0',
    max_uses: '', active: true, expires_at: '',
  });

  const load = async () => {
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
    setCoupons((data || []) as Coupon[]);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ code: '', type: 'percentage', value: '', min_order_value: '0', max_uses: '', active: true, expires_at: '' });
    setShowForm(true);
  };

  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({
      code: c.code,
      type: c.type,
      value: c.value.toString(),
      min_order_value: c.min_order_value?.toString() || '0',
      max_uses: c.max_uses?.toString() || '',
      active: c.active,
      expires_at: c.expires_at ? c.expires_at.slice(0, 16) : '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.code.trim()) { toast.error('Código é obrigatório'); return; }
    if (!form.value || parseFloat(form.value) <= 0) { toast.error('Valor deve ser maior que zero'); return; }

    const payload = {
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value: parseFloat(form.value),
      min_order_value: parseFloat(form.min_order_value) || 0,
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      active: form.active,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
    };

    if (editing) {
      const { error } = await supabase.from('coupons').update(payload).eq('id', editing.id);
      if (error) { toast.error(error.message.includes('unique') ? 'Código já existe' : 'Erro ao atualizar'); return; }
      await logAdminAction('update', 'coupon', editing.id, { code: payload.code });
      toast.success('Cupom atualizado');
    } else {
      const { error } = await supabase.from('coupons').insert(payload);
      if (error) { toast.error(error.message.includes('unique') ? 'Código já existe' : 'Erro ao criar'); return; }
      await logAdminAction('create', 'coupon', undefined, { code: payload.code });
      toast.success('Cupom criado');
    }
    setShowForm(false);
    load();
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm('Remover este cupom?')) return;
    await supabase.from('coupons').delete().eq('id', id);
    await logAdminAction('delete', 'coupon', id, { code });
    toast.success('Cupom removido');
    load();
  };

  const toggleActive = async (c: Coupon) => {
    await supabase.from('coupons').update({ active: !c.active }).eq('id', c.id);
    await logAdminAction('toggle_active', 'coupon', c.id, { active: !c.active });
    toast.success(c.active ? 'Cupom desativado' : 'Cupom ativado');
    load();
  };

  const isExpired = (c: Coupon) => c.expires_at && new Date(c.expires_at) < new Date();
  const isMaxedOut = (c: Coupon) => c.max_uses !== null && c.used_count >= c.max_uses;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Cupons</h1>
          <p className="text-sm text-muted-foreground">{coupons.length} cupons</p>
        </div>
        <Button variant="hero" size="sm" onClick={openNew} className="gap-1.5">
          <Plus className="w-4 h-4" /> Novo Cupom
        </Button>
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          >
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="glass rounded-xl p-6 w-full max-w-md space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display font-semibold">{editing ? 'Editar Cupom' : 'Novo Cupom'}</h2>
                <button onClick={() => setShowForm(false)}><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Código</Label>
                  <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="PROMO10" className="bg-secondary uppercase" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Tipo</Label>
                    <Select value={form.type} onValueChange={(v: 'percentage' | 'fixed') => setForm(f => ({ ...f, type: v }))}>
                      <SelectTrigger className="bg-secondary"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentual (%)</SelectItem>
                        <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Valor</Label>
                    <Input type="number" step="0.01" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} className="bg-secondary" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Pedido mínimo (R$)</Label>
                    <Input type="number" step="0.01" value={form.min_order_value} onChange={e => setForm(f => ({ ...f, min_order_value: e.target.value }))} className="bg-secondary" />
                  </div>
                  <div className="space-y-1">
                    <Label>Limite de usos</Label>
                    <Input type="number" value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))} placeholder="Ilimitado" className="bg-secondary" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Validade</Label>
                  <Input type="datetime-local" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} className="bg-secondary" />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Ativo</Label>
                  <Switch checked={form.active} onCheckedChange={v => setForm(f => ({ ...f, active: v }))} />
                </div>
              </div>
              <Button variant="hero" className="w-full" onClick={handleSave}>
                {editing ? 'Salvar alterações' : 'Criar cupom'}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Coupon list */}
      <div className="grid gap-3">
        {coupons.map(c => (
          <div key={c.id} className={`glass rounded-xl p-4 flex items-center gap-4 ${!c.active || isExpired(c) || isMaxedOut(c) ? 'opacity-50' : ''}`}>
            <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
              {c.type === 'percentage' ? <Percent className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-mono font-bold text-sm">{c.code}</h3>
                {!c.active && <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/20 text-destructive">Inativo</span>}
                {isExpired(c) && <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/20 text-destructive">Expirado</span>}
                {isMaxedOut(c) && <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">Esgotado</span>}
              </div>
              <p className="text-xs text-muted-foreground">
                {c.type === 'percentage' ? `${c.value}%` : `R$ ${c.value.toFixed(2).replace('.', ',')}`}
                {c.min_order_value > 0 && ` · Min: R$ ${c.min_order_value.toFixed(2).replace('.', ',')}`}
                {c.max_uses && ` · ${c.used_count}/${c.max_uses} usos`}
                {c.expires_at && ` · Expira: ${new Date(c.expires_at).toLocaleDateString('pt-BR')}`}
              </p>
            </div>
            <div className="flex gap-1">
              <Switch checked={c.active} onCheckedChange={() => toggleActive(c)} />
              <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id, c.code)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
          </div>
        ))}
        {coupons.length === 0 && (
          <div className="text-center py-10">
            <Tag className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">Nenhum cupom criado ainda.</p>
          </div>
        )}
      </div>
    </div>
  );
}
