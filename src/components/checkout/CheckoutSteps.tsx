import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  label: string;
  description: string;
}

const steps: Step[] = [
  { label: 'Carrinho', description: 'Revise seus itens' },
  { label: 'Dados', description: 'Confirme suas informações' },
  { label: 'Resumo', description: 'Revise o pedido' },
];

interface CheckoutStepsProps {
  currentStep: number;
}

export default function CheckoutSteps({ currentStep }: CheckoutStepsProps) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <div key={step.label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 border-2',
                  isCompleted && 'bg-primary text-primary-foreground border-primary',
                  isCurrent && 'border-primary text-primary bg-primary/10',
                  !isCompleted && !isCurrent && 'border-border text-muted-foreground bg-secondary'
                )}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
              </div>
              <span
                className={cn(
                  'text-xs mt-1.5 font-medium whitespace-nowrap',
                  isCurrent ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
              <span className="text-[10px] text-muted-foreground hidden sm:block">
                {step.description}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'w-12 sm:w-20 h-0.5 mx-2 mt-[-18px] transition-colors duration-300',
                  index < currentStep ? 'bg-primary' : 'bg-border'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
