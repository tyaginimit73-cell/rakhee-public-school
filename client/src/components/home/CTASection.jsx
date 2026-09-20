import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, Phone, ArrowRight } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext.jsx';

export default function CTASection() {
  const { settings } = useSettings();
  if (!settings.admissionOpen) return null;
  return (
    <section className="section">
      <div className="container-x">
        <motion.div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-800 via-navy-900 to-navy-950 px-8 py-12 text-center shadow-lift sm:px-16"
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #dbac33 0, transparent 45%)' }} aria-hidden />
          <div className="relative">
            <h2 className="heading-2 text-white">Give your child the <span className="text-gradient-gold">Rakhee advantage</span></h2>
            <p className="mx-auto mt-4 max-w-xl text-white/70">Admissions are open for the new session. Seats are limited — start your child's journey with us today.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/admissions/apply" className="btn-accent"><GraduationCap size={17} /> Apply for Admission</Link>
              <Link to="/contact" className="btn-white"><Phone size={15} /> Talk to Us <ArrowRight size={15} /></Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
