import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/lib/admin-logger';
import type { Profile } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Shield, ShieldOff, User } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface UserWithRole extends Profile {
  isAdmin: boolean;
}

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('user_roles').select('user_id, role'),
    ]);

    const adminIds = new Set((roles || []).filter(r => r.role === 'admin').map(r => r.user_id));
    const usersWithRole = (profiles || []).map(p => ({
      ...p,
      isAdmin: adminIds.has(p.id),
    }));
    setUsers(usersWithRole);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleAdmin = async (userId: string, currentlyAdmin: boolean, userName: string) => {
    if (userId === currentUser?.id) {
      toast.error('Você não pode alterar suas próprias permissões');
      return;
    }

    if (currentlyAdmin) {
      const { error } = await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', 'admin');
      if (error) { toast.error('Erro ao remover permissão'); return; }
      await logAdminAction('remove_admin', 'user', userId, { name: userName });
      toast.success(`${userName} não é mais admin`);
    } else {
      const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: 'admin' });
      if (error) { toast.error('Erro ao promover usuário'); return; }
      await logAdminAction('promote_admin', 'user', userId, { name: userName });
      toast.success(`${userName} agora é admin`);
    }
    load();
  };

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.includes(search)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Usuários</h1>
        <p className="text-sm text-muted-foreground">{users.length} usuários</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome, email ou telefone..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-secondary" />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass rounded-xl p-4 animate-pulse"><div className="h-10 bg-secondary rounded" /></div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(u => (
            <div key={u.id} className="glass rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-display font-bold text-sm flex-shrink-0">
                {u.full_name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">{u.full_name}</p>
                  {u.isAdmin && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Admin
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{u.email} · {u.phone}</p>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {new Date(u.created_at).toLocaleDateString('pt-BR')}
                </p>
                {u.id !== currentUser?.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleAdmin(u.id, u.isAdmin, u.full_name)}
                    className="gap-1.5 text-xs"
                  >
                    {u.isAdmin ? (
                      <><ShieldOff className="w-3.5 h-3.5" /> Remover Admin</>
                    ) : (
                      <><Shield className="w-3.5 h-3.5" /> Promover</>
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-10">Nenhum usuário encontrado.</p>
          )}
        </div>
      )}
    </div>
  );
}
