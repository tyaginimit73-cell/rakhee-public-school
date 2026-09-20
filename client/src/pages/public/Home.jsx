import Hero from '../../components/home/Hero.jsx';
import TrustStats from '../../components/home/TrustStats.jsx';
import Marquee from '../../components/common/Marquee.jsx';
import AboutPreview from '../../components/home/AboutPreview.jsx';
import WhyChoose from '../../components/home/WhyChoose.jsx';
import AcademicsPreview from '../../components/home/AcademicsPreview.jsx';
import NoticesEvents from '../../components/home/NoticesEvents.jsx';
import Testimonials from '../../components/home/Testimonials.jsx';
import CTASection from '../../components/home/CTASection.jsx';

export default function Home() {
  return (
    <>
      <Hero />
      <TrustStats />
      <Marquee />
      <AboutPreview />
      <WhyChoose />
      <AcademicsPreview />
      <NoticesEvents />
      <Testimonials />
      <CTASection />
    </>
  );
}
