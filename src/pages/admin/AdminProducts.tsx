import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/lib/admin-logger';
import type { Product, Category } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, X, Upload, Search } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [form, setForm] = useState({
    name: '', description: '', price: '', stock: '', image_url: '', active: true, category_id: '',
  });
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from('products').select('*, category:categories(*)').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').eq('active', true).order('name'),
    ]);
    setProducts((prods || []) as Product[]);
    setCategories((cats || []) as Category[]);
  };

  useEffect(() => { load(); }, []);

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === 'all' || p.category_id === filterCategory;
    return matchSearch && matchCat;
  });

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', description: '', price: '', stock: '10', image_url: '', active: true, category_id: '' });
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description || '',
      price: p.price.toString(),
      stock: p.stock.toString(),
      image_url: p.image_url || '',
      active: p.active,
      category_id: p.category_id || '',
    });
    setShowForm(true);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `products/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('product-images').upload(path, file);
    if (error) { toast.error('Erro ao fazer upload'); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
    setForm(f => ({ ...f, image_url: urlData.publicUrl }));
    setUploading(false);
    toast.success('Imagem enviada!');
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Nome é obrigatório'); return; }
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: parseFloat(form.price) || 0,
      stock: parseInt(form.stock) || 0,
      image_url: form.image_url || null,
      active: form.active,
      category_id: form.category_id || null,
    };

    if (editing) {
      await supabase.from('products').update(payload).eq('id', editing.id);
      await logAdminAction('update', 'product', editing.id, { name: payload.name });
      toast.success('Produto atualizado');
    } else {
      await supabase.from('products').insert(payload);
      await logAdminAction('create', 'product', undefined, { name: payload.name });
      toast.success('Produto criado');
    }
    setShowForm(false);
    load();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm('Remover este produto?')) return;
    await supabase.from('products').delete().eq('id', id);
    await logAdminAction('delete', 'product', id, { name });
    toast.success('Produto removido');
    load();
  };

  const toggleActive = async (p: Product) => {
    await supabase.from('products').update({ active: !p.active }).eq('id', p.id);
    await logAdminAction('toggle_active', 'product', p.id, { active: !p.active });
    toast.success(p.active ? 'Produto desativado' : 'Produto ativado');
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Produtos</h1>
          <p className="text-sm text-muted-foreground">{products.length} produtos</p>
        </div>
        <Button variant="hero" size="sm" onClick={openNew} className="gap-1.5">
          <Plus className="w-4 h-4" /> Novo Produto
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar produto..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-secondary" />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px] bg-secondary">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          >
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="glass rounded-xl p-6 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display font-semibold">{editing ? 'Editar Produto' : 'Novo Produto'}</h2>
                <button onClick={() => setShowForm(false)}><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Nome</Label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="bg-secondary" />
                </div>
                <div className="space-y-1">
                  <Label>Descrição</Label>
                  <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="bg-secondary" rows={3} />
                </div>
                <div className="space-y-1">
                  <Label>Categoria</Label>
                  <Select value={form.category_id || 'none'} onValueChange={v => setForm(f => ({ ...f, category_id: v === 'none' ? '' : v }))}>
                    <SelectTrigger className="bg-secondary"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem categoria</SelectItem>
                      {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Preço (R$)</Label>
                    <Input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="bg-secondary" />
                  </div>
                  <div className="space-y-1">
                    <Label>Estoque</Label>
                    <Input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} className="bg-secondary" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Produto ativo</Label>
                  <Switch checked={form.active} onCheckedChange={v => setForm(f => ({ ...f, active: v }))} />
                </div>
                <div className="space-y-1">
                  <Label>Imagem</Label>
                  {form.image_url && <img src={form.image_url} alt="" className="w-full h-32 object-cover rounded-lg mb-2" />}
                  <label className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg cursor-pointer hover:bg-accent transition-colors text-sm">
                    <Upload className="w-4 h-4" />
                    {uploading ? 'Enviando...' : 'Fazer upload'}
                    <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                  </label>
                </div>
              </div>
              <Button variant="hero" className="w-full" onClick={handleSave}>
                {editing ? 'Salvar alterações' : 'Criar produto'}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product list */}
      <div className="grid gap-3">
        {filtered.map(p => (
          <div key={p.id} className={`glass rounded-xl p-4 flex items-center gap-4 ${!p.active ? 'opacity-50' : ''}`}>
            <div className="w-14 h-14 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">N/A</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-sm truncate">{p.name}</h3>
                {!p.active && <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/20 text-destructive">Inativo</span>}
              </div>
              <p className="text-xs text-muted-foreground">
                R$ {p.price.toFixed(2).replace('.', ',')} · Estoque: {p.stock}
                {p.category && ` · ${p.category.name}`}
              </p>
            </div>
            <div className="flex gap-1">
              <Switch checked={p.active} onCheckedChange={() => toggleActive(p)} />
              <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id, p.name)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-10">Nenhum produto encontrado.</p>
        )}
      </div>
    </div>
  );
}
