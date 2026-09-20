import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, ClipboardList, FileText, CalendarDays, Wallet, MessageCircleQuestion, ArrowRight, CheckCircle2, BadgeCheck } from 'lucide-react';
import PageHero from '../../components/common/PageHero.jsx';
import SectionHeading from '../../components/common/SectionHeading.jsx';
import EnquiryForm from '../../components/forms/EnquiryForm.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { usePageMeta } from '../../hooks/usePageMeta.js';

const STEPS = [
  { n: 1, title: 'Apply Online', text: 'Fill the multi-step online application form in about 5 minutes.' },
  { n: 2, title: 'Document Verification', text: 'Our office verifies submitted details and documents.' },
  { n: 3, title: 'Interaction', text: 'A friendly interaction with the student and parents.' },
  { n: 4, title: 'Confirmation', text: 'Receive your admission confirmation and complete fee formalities.' },
];

const DOCUMENTS = ['Birth certificate (photocopy)', 'Previous school Transfer Certificate (Class 2 onwards)', 'Recent passport-size photographs (4)', 'Aadhaar card of student & parents (photocopy)', 'Previous class report card', 'Address proof'];

const FAQS = [
  { q: 'When do admissions open?', a: 'Admissions for the new session open in advance and are announced on the notice board and this website. Apply early as seats are limited.' },
  { q: 'What is the age criteria for Nursery?', a: 'Children should generally be 3+ years as on 31 March of the admission year. Please contact the office for class-wise criteria.' },
  { q: 'Can I track my application?', a: 'Yes. After applying online you receive an Application ID. Use it on the Track Application page anytime.' },
  { q: 'Is hostel facility available?', a: 'Yes, the school provides a safe and supervised hostel facility for out-station students. Please contact the office for boarding details.' },
];

export default function Admissions() {
  usePageMeta('Admissions', 'How to apply for admission to Rakhee Public School — process, required documents and FAQs.');
  const { settings } = useSettings();
  return (
    <>
      <PageHero title="Admissions" subtitle="Join the Rakhee Public School family — a straightforward, transparent admission process." crumbs={[{ label: 'Admissions' }]} />

      <section className="section">
        <div className="container-x grid items-start gap-10 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <SectionHeading center={false} eyebrow="Overview" title="Your journey starts here" />
            <p className="mt-5 text-lg leading-relaxed text-muted">
              We welcome applications from families across SohanJani Tagan, Muzaffarnagar and nearby areas for classes Nursery to Class 10.
              Admissions are granted on a first-come, first-served basis subject to eligibility and seat availability.
            </p>
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              {STEPS.map(({ n, title, text }) => (
                <motion.div key={n} className="card p-5" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: n * 0.06 }}>
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-400 font-display text-lg font-bold text-navy-950">{n}</span>
                  <h3 className="mt-3 font-bold">{title}</h3>
                  <p className="mt-1 text-sm text-muted">{text}</p>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="card overflow-hidden">
              <div className="bg-gradient-to-br from-brand-800 to-navy-950 p-6 text-white">
                <GraduationCap size={26} className="text-accent-400" />
                <h3 className="mt-3 font-display text-2xl font-semibold">{settings.admissionOpen ? 'Admissions Open' : 'Admissions Closed'}</h3>
                <p className="mt-1 text-sm text-white/70">{settings.admissionOpen ? 'Apply online in 5 minutes and track your application.' : 'Online applications are currently closed. Please contact the office.'}</p>
              </div>
              <div className="space-y-3 p-6">
                {settings.admissionOpen ? (
                  <Link to="/admissions/apply" className="btn-accent w-full">Apply Online <ArrowRight size={16} /></Link>
                ) : (
                  <Link to="/contact" className="btn-primary w-full">Contact Office</Link>
                )}
                <Link to="/admissions/track" className="btn-outline w-full"><ClipboardList size={15} /> Track Application</Link>
                <p className="rounded-xl bg-line/40 p-3 text-xs leading-relaxed text-muted">{settings.feesNote}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section bg-line/30 dark:bg-navy-900/40">
        <div className="container-x grid gap-8 lg:grid-cols-3">
          <motion.div className="card p-7" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <FileText size={24} className="text-brand-600 dark:text-brand-300" />
            <h3 className="mt-3 font-display text-xl font-semibold">Required Documents</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              {DOCUMENTS.map((docu) => <li key={docu} className="flex gap-2"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-500" />{docu}</li>)}
            </ul>
          </motion.div>
          <motion.div className="card p-7" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 }}>
            <BadgeCheck size={24} className="text-brand-600 dark:text-brand-300" />
            <h3 className="mt-3 font-display text-xl font-semibold">Eligibility</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              <li className="flex gap-2"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-500" />Nursery: 3+ years as on 31 March</li>
              <li className="flex gap-2"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-500" />Class 1: 6+ years as on 31 March</li>
              <li className="flex gap-2"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-500" />Class 2–10: TC & report card from previous school</li>
              <li className="flex gap-2"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-500" />All classes subject to seat availability</li>
            </ul>
            <div className="mt-5 flex items-start gap-2 rounded-xl bg-line/40 p-3 text-xs text-muted">
              <CalendarDays size={14} className="mt-0.5 shrink-0" /> Important dates are published on the Notice Board regularly.
            </div>
          </motion.div>
          <motion.div className="card p-7" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.16 }}>
            <Wallet size={24} className="text-brand-600 dark:text-brand-300" />
            <h3 className="mt-3 font-display text-xl font-semibold">Fee Information</h3>
            <p className="mt-4 text-sm leading-relaxed text-muted">The school follows an affordable, transparent fee structure with no hidden charges. Term-wise payment options are available.</p>
            <p className="mt-3 rounded-xl bg-line/40 p-3 text-xs leading-relaxed text-muted">{settings.feesNote}</p>
            <Link to="/contact" className="btn-outline btn-sm mt-4">Request Fee Structure <ArrowRight size={14} /></Link>
          </motion.div>
        </div>
      </section>

      <section className="section">
        <div className="container-x grid items-start gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading center={false} eyebrow="FAQs" title="Common questions" />
            <div className="mt-8 space-y-4">
              {FAQS.map(({ q, a }) => (
                <details key={q} className="card group p-5 open:shadow-lift transition-shadow">
                  <summary className="flex cursor-pointer list-none items-center gap-3 font-bold marker:hidden">
                    <MessageCircleQuestion size={18} className="shrink-0 text-accent-500" />{q}
                  </summary>
                  <p className="mt-3 pl-8 text-sm leading-relaxed text-muted">{a}</p>
                </details>
              ))}
            </div>
          </div>
          <div>
            <SectionHeading center={false} eyebrow="Quick Enquiry" title="Have a question? Request a callback" />
            <EnquiryForm className="mt-8" />
          </div>
        </div>
      </section>
    </>
  );
}
