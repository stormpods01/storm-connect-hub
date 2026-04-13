import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, Shield, Headphones } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/30 to-background" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-foreground/[0.02] blur-3xl" />

        <div className="container relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block text-xs font-medium tracking-widest uppercase text-muted-foreground mb-4 px-4 py-1.5 glass rounded-full">
              Novos Pods Disponíveis
            </span>
            <h1 className="font-display text-5xl sm:text-7xl font-bold leading-[1.05] mb-6 max-w-3xl mx-auto">
              Sua experiência.
              <br />
              <span className="text-gradient">Outro nível.</span>
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto mb-8 text-base sm:text-lg">
              Descubra nossa coleção exclusiva de pods com qualidade premium e design incomparável.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button variant="hero" size="lg" onClick={() => navigate('/products')} className="gap-2">
                Explorar Produtos <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="w-5 h-8 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-1">
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1 h-2 rounded-full bg-muted-foreground/50"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 border-t border-border/30">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: 'Performance', desc: 'Tecnologia de ponta para sabor e vapor intensos.' },
              { icon: Shield, title: 'Qualidade', desc: 'Materiais premium com rigoroso controle de qualidade.' },
              { icon: Headphones, title: 'Suporte 24/7', desc: 'Atendimento personalizado via WhatsApp e chat.' },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="glass rounded-xl p-6 hover-lift"
              >
                <f.icon className="w-8 h-8 mb-4 text-foreground" />
                <h3 className="font-display font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-border/30">
        <div className="container text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">Pronto para experimentar?</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Monte seu pedido e receba atendimento exclusivo.
            </p>
            <Button variant="hero" size="lg" onClick={() => navigate('/products')} className="gap-2">
              Começar Agora <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8">
        <div className="container flex items-center justify-between">
          <span className="font-display text-sm font-semibold">StormPods</span>
          <span className="text-xs text-muted-foreground">© {new Date().getFullYear()} Todos os direitos reservados</span>
        </div>
      </footer>
    </div>
  );
}
