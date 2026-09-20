import { Outlet } from 'react-router-dom';
import Navbar from '../components/navbar/Navbar.jsx';
import Footer from '../components/footer/Footer.jsx';
import ScrollProgress from '../components/common/ScrollProgress.jsx';
import BackToTop from '../components/common/BackToTop.jsx';

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollProgress />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
