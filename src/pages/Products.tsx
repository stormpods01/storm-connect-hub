import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Product, Category } from '@/types';
import ProductCard from '@/components/ProductCard';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    Promise.all([
      supabase.from('products').select('*, category:categories(*)').eq('active', true).order('created_at', { ascending: false }),
      supabase.from('categories').select('*').eq('active', true).order('name'),
    ]).then(([{ data: prods }, { data: cats }]) => {
      setProducts((prods || []) as Product[]);
      setCategories((cats || []) as Category[]);
      setLoading(false);
    });
  }, []);

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === 'all' || p.category_id === selectedCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">Nossos Produtos</h1>
          <p className="text-muted-foreground text-sm mb-6">Encontre o pod perfeito para você</p>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 bg-secondary border-border"
              />
            </div>
            {categories.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
                    selectedCategory === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Todos
                </button>
                {categories.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
                      selectedCategory === c.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="glass rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-square bg-secondary" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-secondary rounded w-3/4" />
                  <div className="h-6 bg-secondary rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            {products.length === 0 ? 'Nenhum produto cadastrado ainda.' : 'Nenhum produto encontrado.'}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
