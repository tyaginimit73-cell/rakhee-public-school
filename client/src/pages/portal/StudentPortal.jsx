import { FullPageLoader } from '../../components/common/Loader.jsx';
import { ErrorState } from '../../components/common/StateViews.jsx';
import StudentInfoPanel from '../../components/portal/StudentInfoPanel.jsx';
import { useFetch } from '../../hooks/useFetch.js';

export default function StudentPortal() {
  const { data, loading, error, refetch } = useFetch('/student/overview');
  if (loading) return <FullPageLoader label="Loading your portal…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  return <StudentInfoPanel data={data} />;
}
