import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { AdminLog } from '@/types';
import { ScrollText } from 'lucide-react';

const ACTION_LABELS: Record<string, string> = {
  create: 'Criou',
  update: 'Atualizou',
  delete: 'Removeu',
  toggle_active: 'Alterou status',
  update_status: 'Alterou status',
  promote_admin: 'Promoveu a admin',
  remove_admin: 'Removeu admin',
};

const ENTITY_LABELS: Record<string, string> = {
  product: 'Produto',
  order: 'Pedido',
  coupon: 'Cupom',
  category: 'Categoria',
  user: 'Usuário',
  settings: 'Configurações',
};

export default function AdminLogs() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('admin_logs').select('*').order('created_at', { ascending: false }).limit(100)
      .then(({ data }) => { setLogs((data || []) as AdminLog[]); setLoading(false); });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Logs de Atividade</h1>
        <p className="text-sm text-muted-foreground">Últimas 100 ações administrativas</p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="glass rounded-lg p-3 animate-pulse"><div className="h-6 bg-secondary rounded" /></div>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-10">
          <ScrollText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm">Nenhuma atividade registrada.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map(log => (
            <div key={log.id} className="glass rounded-lg p-3 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium">{ACTION_LABELS[log.action] || log.action}</span>
                  {' '}
                  <span className="text-muted-foreground">{ENTITY_LABELS[log.entity_type] || log.entity_type}</span>
                  {log.details && (log.details as any).name && (
                    <span className="text-muted-foreground"> · {(log.details as any).name}</span>
                  )}
                  {log.details && (log.details as any).code && (
                    <span className="text-muted-foreground"> · {(log.details as any).code}</span>
                  )}
                  {log.details && (log.details as any).status && (
                    <span className="text-muted-foreground"> · {(log.details as any).status}</span>
                  )}
                </p>
              </div>
              <p className="text-xs text-muted-foreground flex-shrink-0">
                {new Date(log.created_at).toLocaleString('pt-BR')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
