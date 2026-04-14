import { motion } from 'framer-motion';
import type { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const { addToCart } = useCart();
  const lowStock = product.stock > 0 && product.stock <= 5;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="group glass rounded-xl overflow-hidden transition-all duration-300 hover:border-foreground/20"
    >
      <div className="relative aspect-square bg-secondary overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
            Sem imagem
          </div>
        )}
        {product.category && (
          <span className="absolute top-3 right-3 bg-secondary/80 backdrop-blur-sm text-[10px] font-medium uppercase tracking-wider px-2 py-1 rounded-md">
            {product.category.name}
          </span>
        )}
        {lowStock && (
          <span className="absolute top-3 left-3 bg-destructive text-destructive-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md">
            Últimas unidades
          </span>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <span className="text-sm font-medium text-muted-foreground">Esgotado</span>
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        <h3 className="font-display font-semibold text-sm leading-tight line-clamp-2">{product.name}</h3>
        {product.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
        )}
        <div className="flex items-center justify-between pt-1">
          <span className="font-display font-bold text-lg">
            R$ {product.price.toFixed(2).replace('.', ',')}
          </span>
          <Button
            variant="hero"
            size="sm"
            onClick={() => addToCart(product.id)}
            disabled={product.stock === 0}
            className="gap-1.5"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Adicionar</span>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
