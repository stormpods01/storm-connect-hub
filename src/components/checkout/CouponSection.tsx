import { Tag, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CouponSectionProps {
  couponCode: string;
  onCouponCodeChange: (code: string) => void;
  appliedCoupon: { code: string; type: string; value: number } | null;
  onApply: () => void;
  onRemove: () => void;
  applying: boolean;
}

export default function CouponSection({
  couponCode,
  onCouponCodeChange,
  appliedCoupon,
  onApply,
  onRemove,
  applying,
}: CouponSectionProps) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-4 mt-4">
      <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Cupom de desconto</p>
      {appliedCoupon ? (
        <div className="flex items-center justify-between bg-success/10 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-success" />
            <span className="text-sm font-semibold">{appliedCoupon.code}</span>
            <span className="text-xs text-success font-medium">
              -{appliedCoupon.type === 'percentage'
                ? `${appliedCoupon.value}%`
                : `R$ ${appliedCoupon.value.toFixed(2).replace('.', ',')}`}
            </span>
          </div>
          <button
            onClick={onRemove}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Remover cupom"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            placeholder="Digite o código"
            value={couponCode}
            onChange={(e) => onCouponCodeChange(e.target.value.toUpperCase())}
            className="bg-secondary uppercase text-sm"
            onKeyDown={(e) => e.key === 'Enter' && onApply()}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={onApply}
            disabled={applying || !couponCode.trim()}
            className="gap-1.5 shrink-0"
          >
            <Tag className="w-3.5 h-3.5" />
            {applying ? 'Verificando...' : 'Aplicar'}
          </Button>
        </div>
      )}
    </div>
  );
}
