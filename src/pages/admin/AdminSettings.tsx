import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function AdminSettings() {
  const [aiPrompt, setAiPrompt] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('settings').select('*').single().then(({ data }) => {
      if (data) {
        setAiPrompt(data.ai_prompt || '');
        setWhatsappNumber(data.whatsapp_number || '');
      }
      setLoading(false);
    });
  }, []);

  const save = async () => {
    const { data: existing } = await supabase.from('settings').select('id').single();
    if (existing) {
      await supabase.from('settings').update({ ai_prompt: aiPrompt, whatsapp_number: whatsappNumber }).eq('id', existing.id);
    } else {
      await supabase.from('settings').insert({ ai_prompt: aiPrompt, whatsapp_number: whatsappNumber });
    }
    toast.success('Configurações salvas!');
  };

  if (loading) return <div className="text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="font-display text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground">Gerencie configurações do sistema</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Número do WhatsApp (com código do país)</Label>
          <Input
            value={whatsappNumber}
            onChange={e => setWhatsappNumber(e.target.value)}
            placeholder="5511999999999"
            className="bg-secondary"
          />
          <p className="text-xs text-muted-foreground">Ex: 5511999999999 (sem +, espaços ou traços)</p>
        </div>

        <div className="space-y-2">
          <Label>Prompt do Chat IA</Label>
          <Textarea
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
            rows={8}
            className="bg-secondary"
            placeholder="Você é um assistente de vendas da StormPods..."
          />
          <p className="text-xs text-muted-foreground">Este prompt será usado como instrução do assistente de IA no chat</p>
        </div>

        <Button variant="hero" onClick={save}>Salvar configurações</Button>
      </div>
    </div>
  );
}
