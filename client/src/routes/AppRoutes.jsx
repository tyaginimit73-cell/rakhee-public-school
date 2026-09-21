import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout.jsx';
import AdminLayout from '../layouts/AdminLayout.jsx';
import PortalLayout from '../layouts/PortalLayout.jsx';
import ProtectedRoute from '../components/common/ProtectedRoute.jsx';
import { FullPageLoader } from '../components/common/Loader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { GraduationCap, CalendarCheck, Users as UsersIcon, BookOpen } from 'lucide-react';

// Public pages (eager: home, lazy: rest for code-splitting)
import Home from '../pages/public/Home.jsx';
const About = lazy(() => import('../pages/public/About.jsx'));
const Academics = lazy(() => import('../pages/public/Academics.jsx'));
const Admissions = lazy(() => import('../pages/public/Admissions.jsx'));
const Apply = lazy(() => import('../pages/public/Apply.jsx'));
const TrackApplication = lazy(() => import('../pages/public/TrackApplication.jsx'));
const Campus = lazy(() => import('../pages/public/Campus.jsx'));
const Gallery = lazy(() => import('../pages/public/Gallery.jsx'));
const Events = lazy(() => import('../pages/public/Events.jsx'));
const Notices = lazy(() => import('../pages/public/Notices.jsx'));
const Results = lazy(() => import('../pages/public/Results.jsx'));
const Teachers = lazy(() => import('../pages/public/Teachers.jsx'));
const Contact = lazy(() => import('../pages/public/Contact.jsx'));
const Login = lazy(() => import('../pages/public/Login.jsx'));
const AdminLogin = lazy(() => import('../pages/public/Login.jsx'));
const { NotFound, Forbidden, ServerError } = { NotFound: lazy(() => import('../pages/public/ErrorPages.jsx').then((m) => ({ default: m.NotFound }))),
  Forbidden: lazy(() => import('../pages/public/ErrorPages.jsx').then((m) => ({ default: m.Forbidden }))),
  ServerError: lazy(() => import('../pages/public/ErrorPages.jsx').then((m) => ({ default: m.ServerError }))) };
const PrivacyPolicy = lazy(() => import('../pages/public/Legal.jsx').then((m) => ({ default: m.PrivacyPolicy })));
const Terms = lazy(() => import('../pages/public/Legal.jsx').then((m) => ({ default: m.Terms })));

// Portal — the old single generic dashboard is replaced by 4 role-specific
// portals below. PortalDashboard.jsx itself is left in place on disk,
// unused, rather than deleted — its display logic now lives in the shared
// StudentInfoPanel component instead (see components/portal/), so nothing
// was lost, just relocated; the old file can be removed later if wanted.
const ParentPortal = lazy(() => import('../pages/portal/ParentPortal.jsx'));
const StudentPortal = lazy(() => import('../pages/portal/StudentPortal.jsx'));
const TeacherPortal = lazy(() => import('../pages/portal/TeacherPortal.jsx'));
const TeacherAttendance = lazy(() => import('../pages/portal/TeacherAttendance.jsx'));
const TeacherStudents = lazy(() => import('../pages/portal/TeacherStudents.jsx'));

// Admin
const Dashboard = lazy(() => import('../pages/admin/Dashboard.jsx'));
const Students = lazy(() => import('../pages/admin/Students.jsx'));
const AdminTeachers = lazy(() => import('../pages/admin/Teachers.jsx'));
const Classes = lazy(() => import('../pages/admin/Classes.jsx'));
const AdminAdmissions = lazy(() => import('../pages/admin/Admissions.jsx'));
const Attendance = lazy(() => import('../pages/admin/Attendance.jsx'));
const AdminResults = lazy(() => import('../pages/admin/Results.jsx'));
const Fees = lazy(() => import('../pages/admin/Fees.jsx'));
const AdminNotices = lazy(() => import('../pages/admin/Notices.jsx'));
const AdminEvents = lazy(() => import('../pages/admin/Events.jsx'));
const AdminGallery = lazy(() => import('../pages/admin/Gallery.jsx'));
const Documents = lazy(() => import('../pages/admin/Documents.jsx'));
const Enquiries = lazy(() => import('../pages/admin/Enquiries.jsx'));
const Messages = lazy(() => import('../pages/admin/Messages.jsx'));
const Settings = lazy(() => import('../pages/admin/Settings.jsx'));
const Users = lazy(() => import('../pages/admin/Users.jsx'));

const L = (el) => <Suspense fallback={<FullPageLoader />}>{el}</Suspense>;

const ROLE_HOME = { admin: '/admin', teacher: '/teacher', student: '/student', parent: '/parent' };
// The old generic /portal URL is kept working (bookmarks, old links) by
// sending each role on to its new dedicated portal, rather than removing
// the route outright.
function LegacyPortalRedirect() {
  const { user } = useAuth();
  return <Navigate to={ROLE_HOME[user?.role] || '/login'} replace />;
}

const PARENT_NAV = [{ to: '/parent', label: 'My Children', icon: UsersIcon, end: true }];
const STUDENT_NAV = [{ to: '/student', label: 'My Portal', icon: GraduationCap, end: true }];
const TEACHER_NAV = [
  { to: '/teacher', label: 'Overview', icon: GraduationCap, end: true },
  { to: '/teacher/attendance', label: 'Attendance', icon: CalendarCheck },
  { to: '/teacher/students', label: 'Students', icon: BookOpen },
];

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public website */}
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="about" element={L(<About />)} />
        <Route path="academics" element={L(<Academics />)} />
        <Route path="admissions" element={L(<Admissions />)} />
        <Route path="admissions/apply" element={L(<Apply />)} />
        <Route path="admissions/track" element={L(<TrackApplication />)} />
        <Route path="campus" element={L(<Campus />)} />
        <Route path="gallery" element={L(<Gallery />)} />
        <Route path="events" element={L(<Events />)} />
        <Route path="notices" element={L(<Notices />)} />
        <Route path="results" element={L(<Results />)} />
        <Route path="teachers" element={L(<Teachers />)} />
        <Route path="contact" element={L(<Contact />)} />
        <Route path="privacy-policy" element={L(<PrivacyPolicy />)} />
        <Route path="terms" element={L(<Terms />)} />
        <Route path="403" element={L(<Forbidden />)} />
        <Route path="500" element={L(<ServerError />)} />
        <Route path="*" element={L(<NotFound />)} />
      </Route>

      <Route path="login" element={L(<Login />)} />
      <Route path="admin/login" element={L(<AdminLogin adminOnly />)} />

      {/* Old generic portal URL → redirect to the right role-specific one */}
      <Route path="portal" element={<ProtectedRoute roles={['parent', 'student', 'teacher']}><LegacyPortalRedirect /></ProtectedRoute>} />

      {/* Parent portal */}
      <Route path="parent" element={<ProtectedRoute roles={['parent']}><PortalLayout nav={PARENT_NAV} title="Parent Portal" /></ProtectedRoute>}>
        <Route index element={L(<ParentPortal />)} />
      </Route>

      {/* Student portal */}
      <Route path="student" element={<ProtectedRoute roles={['student']}><PortalLayout nav={STUDENT_NAV} title="Student Portal" /></ProtectedRoute>}>
        <Route index element={L(<StudentPortal />)} />
      </Route>

      {/* Teacher portal */}
      <Route path="teacher" element={<ProtectedRoute roles={['teacher']}><PortalLayout nav={TEACHER_NAV} title="Teacher Portal" /></ProtectedRoute>}>
        <Route index element={L(<TeacherPortal />)} />
        <Route path="attendance" element={L(<TeacherAttendance />)} />
        <Route path="students" element={L(<TeacherStudents />)} />
      </Route>

      {/* Admin dashboard */}
      <Route path="admin" element={<ProtectedRoute roles={['admin']}><AdminLayout /></ProtectedRoute>}>
        <Route index element={L(<Dashboard />)} />
        <Route path="students" element={L(<Students />)} />
        <Route path="teachers" element={L(<AdminTeachers />)} />
        <Route path="classes" element={L(<Classes />)} />
        <Route path="admissions" element={L(<AdminAdmissions />)} />
        <Route path="attendance" element={L(<Attendance />)} />
        <Route path="results" element={L(<AdminResults />)} />
        <Route path="fees" element={L(<Fees />)} />
        <Route path="notices" element={L(<AdminNotices />)} />
        <Route path="events" element={L(<AdminEvents />)} />
        <Route path="gallery" element={L(<AdminGallery />)} />
        <Route path="documents" element={L(<Documents />)} />
        <Route path="enquiries" element={L(<Enquiries />)} />
        <Route path="messages" element={L(<Messages />)} />
        <Route path="settings" element={L(<Settings />)} />
        <Route path="users" element={L(<Users />)} />
      </Route>
    </Routes>
  );
}
