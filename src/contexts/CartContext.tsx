import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import type { CartItem, Product } from '@/types';
import { toast } from 'sonner';

interface CartContextType {
  items: (CartItem & { product: Product })[];
  loading: boolean;
  addToCart: (productId: string) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<(CartItem & { product: Product })[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) { setItems([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from('cart_items')
      .select('*, product:products(*)')
      .eq('user_id', user.id);
    setItems((data || []) as (CartItem & { product: Product })[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addToCart = async (productId: string) => {
    if (!user) { toast.error('Faça login para adicionar ao carrinho'); return; }
    const existing = items.find(i => i.product_id === productId);
    if (existing) {
      await updateQuantity(existing.id, existing.quantity + 1);
      return;
    }
    await supabase.from('cart_items').insert({ user_id: user.id, product_id: productId, quantity: 1 });
    toast.success('Produto adicionado!');
    fetchCart();
  };

  const removeFromCart = async (itemId: string) => {
    await supabase.from('cart_items').delete().eq('id', itemId);
    toast.success('Item removido');
    fetchCart();
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) { await removeFromCart(itemId); return; }
    await supabase.from('cart_items').update({ quantity }).eq('id', itemId);
    fetchCart();
  };

  const clearCart = async () => {
    if (!user) return;
    await supabase.from('cart_items').delete().eq('user_id', user.id);
    setItems([]);
  };

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.quantity * (i.product?.price || 0), 0);

  return (
    <CartContext.Provider value={{ items, loading, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
