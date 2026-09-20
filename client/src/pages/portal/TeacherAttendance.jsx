import { FullPageLoader } from '../../components/common/Loader.jsx';
import { ErrorState } from '../../components/common/StateViews.jsx';
import AttendanceMarker from '../../components/admin/AttendanceMarker.jsx';
import { useFetch } from '../../hooks/useFetch.js';

export default function TeacherAttendance() {
  const { data, loading, error, refetch } = useFetch('/teacher/classes');
  if (loading) return <FullPageLoader label="Loading your classes…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  return (
    <div>
      <h1 className="mb-5 font-display text-2xl font-semibold">Mark Attendance</h1>
      <AttendanceMarker classes={data?.classes || []} emptyClassesMessage="You have no assigned classes yet — please contact the school office." />
    </div>
  );
}
