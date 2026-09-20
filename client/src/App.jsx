import { useEffect, useState } from 'react';
import AppRoutes from './routes/AppRoutes.jsx';
import ScrollToTop from './components/common/ScrollToTop.jsx';
import IntroLoader from './components/common/IntroLoader.jsx';
import { getStored, setStored } from './utils/storage.js';

export default function App() {
  const [introDone, setIntroDone] = useState(() => getStored('rps-intro', 'session') === 'done');

  useEffect(() => {
    if (introDone) return undefined;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => {
      setIntroDone(true);
      setStored('rps-intro', 'done', 'session');
      document.body.style.overflow = '';
    }, 1950);
    return () => { clearTimeout(t); document.body.style.overflow = ''; };
  }, [introDone]);

  return (
    <>
      <IntroLoader done={introDone} />
      <ScrollToTop />
      <AppRoutes />
    </>
  );
}
