// Infinite trust marquee — gold accents on deep navy
const WORDS = [
  'Academic Excellence', 'Safe & Caring Campus', 'Holistic Development',
  'Experienced Faculty', 'Sports & Yoga', 'Modern Learning',
  'Values & Discipline', 'Arts & Culture', 'Board-Ready Preparation',
];

export default function Marquee() {
  const row = [...WORDS, ...WORDS];
  return (
    <section className="relative overflow-hidden border-y border-white/5 bg-navy-950 py-4" aria-label="School highlights">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-navy-950 to-transparent" aria-hidden />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-navy-950 to-transparent" aria-hidden />
      <div className="marquee-track flex w-max animate-marquee items-center gap-8">
        {row.map((w, i) => (
          <span key={i} className="flex items-center gap-8 text-xs font-bold uppercase tracking-[0.22em] text-white/50">
            {w}
            <span className="text-accent-400" aria-hidden>✦</span>
          </span>
        ))}
      </div>
    </section>
  );
}
