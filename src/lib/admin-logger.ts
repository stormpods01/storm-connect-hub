import { supabase } from '@/lib/supabase';

export async function logAdminAction(
  action: string,
  entityType: string,
  entityId?: string,
  details?: Record<string, any>
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('admin_logs').insert({
    user_id: user.id,
    action,
    entity_type: entityType,
    entity_id: entityId || null,
    details: details || {},
  });
}
