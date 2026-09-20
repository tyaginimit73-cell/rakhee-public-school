import PageHero from '../../components/common/PageHero.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';

function Shell({ title, children }) {
  return (
    <>
      <PageHero title={title} crumbs={[{ label: title }]} />
      <section className="section">
        <div className="container-x max-w-3xl space-y-6 text-muted leading-relaxed">{children}</div>
      </section>
    </>
  );
}

export function PrivacyPolicy() {
  const { settings } = useSettings();
  return (
    <Shell title="Privacy Policy">
      <p>{settings.site.schoolName} respects the privacy of students, parents and visitors. Information submitted through this website — such as admission applications, enquiries and contact forms — is used solely for school communication and administrative purposes.</p>
      <p>We do not sell or share personal information with third parties except where required by law. Data is stored securely and access is restricted to authorized school staff.</p>
      <p>For any privacy-related questions, please contact the school office at {settings.site.email}.</p>
    </Shell>
  );
}

export function Terms() {
  const { settings } = useSettings();
  return (
    <Shell title="Terms & Conditions">
      <p>By using the {settings.site.schoolName} website you agree to these terms. Content on this website is for general information about the school and may be updated without notice.</p>
      <p>Online admission applications are subject to verification of documents and school admission policies. Submitting an application does not guarantee admission.</p>
      <p>Fee amounts, dates and policies displayed online are indicative; the official school office record prevails in case of any difference.</p>
    </Shell>
  );
}
