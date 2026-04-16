import { User, Mail, Phone, MapPin, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface CustomerData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
}

interface CustomerInfoStepProps {
  data: CustomerData;
  onChange: (data: CustomerData) => void;
}

export default function CustomerInfoStep({ data, onChange }: CustomerInfoStepProps) {
  const update = (field: keyof CustomerData, value: string) =>
    onChange({ ...data, [field]: value });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-lg font-semibold mb-1">Confirme seus dados</h2>
        <p className="text-sm text-muted-foreground">
          Verifique se suas informações estão corretas para que possamos atendê-lo da melhor forma.
        </p>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" /> Nome completo
          </label>
          <Input
            value={data.fullName}
            onChange={(e) => update('fullName', e.target.value)}
            className="bg-secondary"
            placeholder="Seu nome completo"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Email
            </label>
            <Input
              value={data.email}
              onChange={(e) => update('email', e.target.value)}
              className="bg-secondary"
              type="email"
              placeholder="seu@email.com"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> Telefone
            </label>
            <Input
              value={data.phone}
              onChange={(e) => update('phone', e.target.value)}
              className="bg-secondary"
              placeholder="+351 XXX XXX XXX"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> Endereço de entrega (opcional)
          </label>
          <Input
            value={data.address}
            onChange={(e) => update('address', e.target.value)}
            className="bg-secondary"
            placeholder="Rua, número, cidade..."
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" /> Observações (opcional)
          </label>
          <Textarea
            value={data.notes}
            onChange={(e) => update('notes', e.target.value)}
            className="bg-secondary resize-none"
            placeholder="Alguma observação sobre o pedido?"
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}
