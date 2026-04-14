import { useAuth } from '@/contexts/AuthContext';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Users, ShoppingBag, Package, BarChart3, Settings, ArrowLeft, Tag, FolderOpen, ScrollText } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminLayout() {
  const { user, loading, isAdmin, adminLoading } = useAuth();
  const location = useLocation();

  if (loading || adminLoading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
  if (!user || !isAdmin) return <Navigate to="/" replace />;

  const links = [
    { to: '/admin', icon: BarChart3, label: 'Dashboard', exact: true },
    { to: '/admin/products', icon: Package, label: 'Produtos', exact: false },
    { to: '/admin/categories', icon: FolderOpen, label: 'Categorias', exact: false },
    { to: '/admin/orders', icon: ShoppingBag, label: 'Pedidos', exact: false },
    { to: '/admin/users', icon: Users, label: 'Usuários', exact: false },
    { to: '/admin/coupons', icon: Tag, label: 'Cupons', exact: false },
    { to: '/admin/logs', icon: ScrollText, label: 'Logs', exact: false },
    { to: '/admin/settings', icon: Settings, label: 'Configurações', exact: false },
  ];

  const isActive = (path: string, exact: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen pt-16 flex">
      <aside className="fixed left-0 top-16 bottom-0 w-60 glass border-r border-border/30 p-4 hidden lg:block">
        <div className="space-y-1">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive(l.to, l.exact) ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <l.icon className="w-4 h-4" />
              {l.label}
            </Link>
          ))}
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <Link to="/" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-3 h-3" /> Voltar à loja
          </Link>
        </div>
      </aside>

      <div className="lg:hidden fixed top-16 left-0 right-0 z-40 glass border-b border-border/30 overflow-x-auto">
        <div className="flex px-4 py-2 gap-2">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
                isActive(l.to, l.exact) ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              <l.icon className="w-3 h-3" />
              {l.label}
            </Link>
          ))}
        </div>
      </div>

      <main className="flex-1 lg:ml-60 p-6 lg:p-8 mt-12 lg:mt-0">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
