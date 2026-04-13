import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

export default function AdminUsers() {
  const [users, setUsers] = useState<Profile[]>([]);

  useEffect(() => {
    supabase.from('profiles').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setUsers(data || []));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Usuários</h1>
        <p className="text-sm text-muted-foreground">{users.length} usuários</p>
      </div>

      <div className="space-y-3">
        {users.map(u => (
          <div key={u.id} className="glass rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-display font-bold text-sm">
              {u.full_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{u.full_name}</p>
              <p className="text-xs text-muted-foreground">{u.email} · {u.phone}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(u.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
