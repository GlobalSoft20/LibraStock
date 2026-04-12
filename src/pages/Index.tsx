import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Users, Lightbulb, Handshake, Target, ArrowRight, Library, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import heroImage from '@/assets/hero-students.jpg';

const values = [
  { icon: Lightbulb, title: 'Innovation', description: 'Embracing new ideas and creative solutions to advance learning and discovery.' },
  { icon: Handshake, title: 'Collaboration', description: 'Working together as a community to achieve shared educational goals.' },
  { icon: Target, title: 'Excellence', description: 'Striving for the highest standards in academics and personal growth.' },
  { icon: BookOpen, title: 'Knowledge', description: 'Fostering a culture of continuous learning and intellectual curiosity.' },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.15 } } };
const item = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const Index = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 p-3 rounded-full bg-card shadow-lg border border-border hover:bg-secondary transition-colors"
      >
        {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
      </button>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Students at GS Kintobo" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/60 to-transparent" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-sm text-primary-foreground px-4 py-2 rounded-full text-sm font-medium mb-6"
          >
            <Library className="w-4 h-4" />
            GS KINTOBO Library Management System
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl md:text-6xl font-heading font-bold text-primary-foreground mb-6 leading-tight"
          >
            Empowering Minds, Building Futures
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-8"
          >
            A modern library management system designed to nurture curiosity, foster collaboration, and support academic excellence.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
            <Link to="/login">
              <Button size="lg" className="gradient-primary text-primary-foreground text-lg px-8 py-6 rounded-xl hover:opacity-90 transition-opacity">
                Enter Library <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-secondary/30">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">Our School Values</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Guided by principles that shape future leaders and lifelong learners.</p>
          </motion.div>
          <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <motion.div key={value.title} variants={item} className="bg-card rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all border border-border group">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <value.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-heading font-semibold text-card-foreground mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 gradient-primary">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '10,000+', label: 'Books Available' },
              { value: '2,500+', label: 'Active Students' },
              { value: '500+', label: 'Daily Borrows' },
              { value: '98%', label: 'Return Rate' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl md:text-4xl font-heading font-bold text-primary-foreground">{stat.value}</p>
                <p className="text-primary-foreground/70 mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-card border-t border-border">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-muted-foreground text-sm">© {new Date().getFullYear()} LibraSync. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
