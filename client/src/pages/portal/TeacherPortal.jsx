import { GraduationCap, Users, BookOpen } from 'lucide-react';
import { FullPageLoader } from '../../components/common/Loader.jsx';
import { ErrorState, EmptyState } from '../../components/common/StateViews.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { initials } from '../../utils/format.js';

export default function TeacherPortal() {
  const { data: profile, loading: loadingProfile, error: profileError } = useFetch('/teacher/profile');
  const { data: classesData, loading: loadingClasses, error: classesError, refetch } = useFetch('/teacher/classes');
  const classes = classesData?.classes || [];

  if (loadingProfile || loadingClasses) return <FullPageLoader label="Loading your portal…" />;
  if (profileError) {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <GraduationCap size={40} className="mx-auto text-muted" />
        <h2 className="mt-4 font-display text-2xl font-semibold">Profile not yet linked</h2>
        <p className="mt-2 text-sm text-muted">{profileError}</p>
      </div>
    );
  }
  if (classesError) return <ErrorState message={classesError} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <div className="card flex flex-wrap items-center gap-5 bg-gradient-to-r from-brand-800 to-navy-950 p-6 text-white sm:p-8" style={{ border: 'none' }}>
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-accent-400 font-display text-2xl font-bold text-navy-950">{initials(profile?.name)}</span>
        <div className="flex-1">
          <h2 className="font-display text-2xl font-semibold">{profile?.name}</h2>
          <p className="text-white/70">{profile?.designation}{profile?.department ? ` · ${profile.department}` : ''}</p>
        </div>
        <div className="flex gap-6 text-center">
          <div><p className="font-display text-2xl font-bold text-accent-300">{classes.length}</p><p className="text-[11px] font-bold uppercase tracking-wider text-white/60">Assigned Classes</p></div>
        </div>
      </div>

      <h3 className="font-display text-lg font-semibold">Your Classes</h3>
      {classes.length === 0 ? (
        <EmptyState icon={BookOpen} title="No classes assigned yet" message="Please contact the school office if you believe this is a mistake." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c) => (
            <div key={c._id} className="card p-5">
              <p className="font-display text-lg font-semibold">{c.name} ({c.section})</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted"><Users size={14} /> {c.level}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
