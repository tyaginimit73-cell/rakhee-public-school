import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { FullPageLoader } from '../../components/common/Loader.jsx';
import { ErrorState, EmptyState } from '../../components/common/StateViews.jsx';
import { Select } from '../../components/common/Field.jsx';
import { useFetch } from '../../hooks/useFetch.js';

export default function TeacherStudents() {
  const { data: classesData, loading: loadingClasses, error: classesError, refetch } = useFetch('/teacher/classes');
  const classes = classesData?.classes || [];
  const [classId, setClassId] = useState('');

  useEffect(() => {
    if (classes.length && !classes.some((c) => c._id === classId)) setClassId(classes[0]._id);
  }, [classes, classId]);

  const { data: studentsData, loading: loadingStudents, error: studentsError } =
    useFetch(classId ? `/teacher/classes/${classId}/students` : null);
  const students = studentsData?.students || [];

  if (loadingClasses) return <FullPageLoader label="Loading your classes…" />;
  if (classesError) return <ErrorState message={classesError} onRetry={refetch} />;
  if (!classes.length) {
    return <EmptyState icon={Users} title="No classes assigned yet" message="Please contact the school office if you believe this is a mistake." />;
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold">Students</h1>
        <Select value={classId} onChange={(e) => setClassId(e.target.value)} className="w-auto min-w-[200px]">
          {classes.map((c) => <option key={c._id} value={c._id}>{c.name} ({c.section})</option>)}
        </Select>
      </div>

      {loadingStudents ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-14" />)}</div>
      ) : studentsError ? (
        <ErrorState message={studentsError} />
      ) : students.length === 0 ? (
        <EmptyState icon={Users} title="No students in this class" message="No active students are enrolled in this class yet." />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Roll No</th><th>Name</th><th>Gender</th><th>Guardian Phone</th></tr></thead>
            <tbody>
              {students.map((s) => (
                <tr key={s._id}>
                  <td className="font-bold">{s.rollNumber}</td>
                  <td>{s.firstName} {s.lastName}</td>
                  <td>{s.gender}</td>
                  <td>{s.phone || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
