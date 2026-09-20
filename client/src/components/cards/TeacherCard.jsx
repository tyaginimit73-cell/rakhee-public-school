import { motion } from 'framer-motion';
import { GraduationCap, BookOpen, Award } from 'lucide-react';
import { initials } from '../../utils/format.js';

export default function TeacherCard({ teacher }) {
  return (
    <motion.article className="card group overflow-hidden text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
      initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }}>
      <div className="relative bg-gradient-to-br from-brand-700 via-navy-900 to-navy-950 px-6 pb-14 pt-8">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #dbac33 0, transparent 50%)' }} aria-hidden />
        {teacher.photo ? (
          <img src={teacher.photo} alt={teacher.name} className="relative mx-auto h-24 w-24 rounded-full border-4 border-accent-400/70 object-cover shadow-lift" />
        ) : (
          <div className="relative mx-auto grid h-24 w-24 place-items-center rounded-full border-4 border-accent-400/70 bg-white/10 font-display text-2xl font-bold text-accent-300 shadow-lift">
            {initials(teacher.name)}
          </div>
        )}
      </div>
      <div className="-mt-7 px-6 pb-6">
        <div className="card relative mx-auto p-5">
          <h3 className="font-display text-lg font-semibold text-ink">{teacher.name}</h3>
          <p className="text-sm font-semibold text-accent-600">{teacher.designation}</p>
          <div className="mt-3 space-y-1.5 text-sm text-muted">
            <p className="flex items-center justify-center gap-1.5"><GraduationCap size={14} className="text-brand-500" />{teacher.qualification}</p>
            <p className="flex items-center justify-center gap-1.5"><BookOpen size={14} className="text-brand-500" />{teacher.subjects?.join(', ') || teacher.department}</p>
            <p className="flex items-center justify-center gap-1.5"><Award size={14} className="text-brand-500" />{teacher.experienceYears}+ years experience</p>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
