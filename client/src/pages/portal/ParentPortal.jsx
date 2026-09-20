import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { FullPageLoader } from '../../components/common/Loader.jsx';
import { ErrorState, EmptyState } from '../../components/common/StateViews.jsx';
import { Select } from '../../components/common/Field.jsx';
import StudentInfoPanel from '../../components/portal/StudentInfoPanel.jsx';
import { useFetch } from '../../hooks/useFetch.js';

export default function ParentPortal() {
  const { data: childrenData, loading: loadingChildren, error: childrenError, refetch: refetchChildren } = useFetch('/parent/children');
  const children = childrenData?.children || [];
  const [selectedId, setSelectedId] = useState('');

  // Default to the first (often only) child once the list loads, and stay
  // in sync if it changes (e.g. a newly-linked child appears after the
  // admin adds one and the parent refreshes).
  useEffect(() => {
    if (children.length && !children.some((c) => c._id === selectedId)) {
      setSelectedId(children[0]._id);
    }
  }, [children, selectedId]);

  const { data: overview, loading: loadingOverview, error: overviewError, refetch: refetchOverview } =
    useFetch(selectedId ? `/parent/children/${selectedId}` : null);

  if (loadingChildren) return <FullPageLoader label="Loading your portal…" />;
  if (childrenError) return <ErrorState message={childrenError} onRetry={refetchChildren} />;

  if (!children.length) {
    return (
      <EmptyState
        icon={Users}
        title="No children linked yet"
        message="Please contact the school office to link your account to your child's student record."
      />
    );
  }

  return (
    <div className="space-y-6">
      {children.length > 1 && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-muted">Children:</span>
          <Select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="w-auto min-w-[220px]">
            {children.map((c) => (
              <option key={c._id} value={c._id}>{c.firstName} {c.lastName} — {c.class?.name} {c.class?.section}</option>
            ))}
          </Select>
        </div>
      )}

      {loadingOverview && <FullPageLoader label="Loading student info…" />}
      {overviewError && <ErrorState message={overviewError} onRetry={refetchOverview} />}
      {!loadingOverview && !overviewError && overview && <StudentInfoPanel data={overview} />}
    </div>
  );
}
