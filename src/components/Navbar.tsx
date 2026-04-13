import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Menu, X, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const isAdmin = profile?.email === 'admin@stormpods.com'; // simple check, can be enhanced with roles table

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="font-display text-xl font-bold tracking-tight">
          Storm<span className="text-muted-foreground">Pods</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/products" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Produtos
          </Link>
          {user ? (
            <>
              <Link to="/cart" className="relative">
                <ShoppingCart className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Link>
              {isAdmin && (
                <Link to="/admin">
                  <LayoutDashboard className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                </Link>
              )}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{profile?.full_name?.split(' ')[0]}</span>
                <Button variant="ghost" size="icon" onClick={() => { signOut(); navigate('/'); }}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : (
            <Button variant="hero" size="sm" onClick={() => navigate('/auth')}>
              Entrar
            </Button>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-border/30"
          >
            <div className="container py-4 flex flex-col gap-3">
              <Link to="/products" onClick={() => setMenuOpen(false)} className="text-sm py-2">Produtos</Link>
              {user ? (
                <>
                  <Link to="/cart" onClick={() => setMenuOpen(false)} className="text-sm py-2 flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4" /> Carrinho ({totalItems})
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setMenuOpen(false)} className="text-sm py-2 flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4" /> Admin
                    </Link>
                  )}
                  <button onClick={() => { signOut(); navigate('/'); setMenuOpen(false); }} className="text-sm py-2 text-left text-muted-foreground">
                    Sair
                  </button>
                </>
              ) : (
                <Button variant="hero" size="sm" onClick={() => { navigate('/auth'); setMenuOpen(false); }}>
                  Entrar
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
