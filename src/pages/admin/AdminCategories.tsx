import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/lib/admin-logger';
import type { Category } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, X, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

function slugify(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', description: '', active: true });

  const load = async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    setCategories((data || []) as Category[]);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', slug: '', description: '', active: true });
    setShowForm(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({ name: c.name, slug: c.slug, description: c.description || '', active: c.active });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Nome é obrigatório'); return; }
    const slug = form.slug.trim() || slugify(form.name);
    const payload = {
      name: form.name.trim(),
      slug,
      description: form.description.trim() || null,
      active: form.active,
    };

    if (editing) {
      const { error } = await supabase.from('categories').update(payload).eq('id', editing.id);
      if (error) { toast.error(error.message.includes('unique') ? 'Slug já existe' : 'Erro ao atualizar'); return; }
      await logAdminAction('update', 'category', editing.id, { name: payload.name });
      toast.success('Categoria atualizada');
    } else {
      const { error } = await supabase.from('categories').insert(payload);
      if (error) { toast.error(error.message.includes('unique') ? 'Slug já existe' : 'Erro ao criar'); return; }
      await logAdminAction('create', 'category', undefined, { name: payload.name });
      toast.success('Categoria criada');
    }
    setShowForm(false);
    load();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm('Remover esta categoria? Produtos vinculados ficarão sem categoria.')) return;
    await supabase.from('categories').delete().eq('id', id);
    await logAdminAction('delete', 'category', id, { name });
    toast.success('Categoria removida');
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Categorias</h1>
          <p className="text-sm text-muted-foreground">{categories.length} categorias</p>
        </div>
        <Button variant="hero" size="sm" onClick={openNew} className="gap-1.5">
          <Plus className="w-4 h-4" /> Nova Categoria
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          >
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="glass rounded-xl p-6 w-full max-w-md space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display font-semibold">{editing ? 'Editar Categoria' : 'Nova Categoria'}</h2>
                <button onClick={() => setShowForm(false)}><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Nome</Label>
                  <Input value={form.name} onChange={e => { setForm(f => ({ ...f, name: e.target.value, slug: slugify(e.target.value) })); }} className="bg-secondary" />
                </div>
                <div className="space-y-1">
                  <Label>Slug</Label>
                  <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} className="bg-secondary" placeholder="auto-gerado" />
                </div>
                <div className="space-y-1">
                  <Label>Descrição</Label>
                  <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="bg-secondary" />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Ativa</Label>
                  <Switch checked={form.active} onCheckedChange={v => setForm(f => ({ ...f, active: v }))} />
                </div>
              </div>
              <Button variant="hero" className="w-full" onClick={handleSave}>
                {editing ? 'Salvar' : 'Criar categoria'}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-3">
        {categories.map(c => (
          <div key={c.id} className={`glass rounded-xl p-4 flex items-center gap-4 ${!c.active ? 'opacity-50' : ''}`}>
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-sm">{c.name}</h3>
                {!c.active && <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/20 text-destructive">Inativa</span>}
              </div>
              <p className="text-xs text-muted-foreground">/{c.slug}{c.description && ` · ${c.description}`}</p>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id, c.name)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="text-center py-10">
            <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">Nenhuma categoria criada ainda.</p>
          </div>
        )}
      </div>
    </div>
  );
}
