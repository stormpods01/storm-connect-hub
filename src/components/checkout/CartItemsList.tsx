import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import type { CartItem, Product } from '@/types';

interface CartItemsListProps {
  items: (CartItem & { product: Product })[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
}

export default function CartItemsList({ items, onUpdateQuantity, onRemove }: CartItemsListProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <ShoppingBag className="w-5 h-5 text-muted-foreground" />
        <h2 className="font-display text-lg font-semibold">
          {items.length} {items.length === 1 ? 'item' : 'itens'} no carrinho
        </h2>
      </div>

      <AnimatePresence>
        {items.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -50, height: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-xl border border-border/50 bg-card p-4 flex items-center gap-4"
          >
            <div className="w-20 h-20 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
              {item.product?.image_url ? (
                <img
                  src={item.product.image_url}
                  alt={item.product.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                  Sem imagem
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm truncate">{item.product?.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {item.product?.description || 'Sem descrição'}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-muted-foreground">
                  Unidade: R$ {(item.product?.price || 0).toFixed(2).replace('.', ',')}
                </span>
                <span className="text-sm font-display font-bold">
                  R$ {((item.product?.price || 0) * item.quantity).toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                  className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-accent transition-colors"
                  aria-label="Diminuir quantidade"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-sm font-semibold w-8 text-center">{item.quantity}</span>
                <button
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-accent transition-colors"
                  aria-label="Aumentar quantidade"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(item.id)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 text-xs gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Remover
              </Button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
