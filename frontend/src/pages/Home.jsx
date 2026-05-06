import HeroSection from '../components/HeroSection'
import FeaturesSection from '../components/FeaturesSection'
import CoursesSection from '../components/CoursesSection'
import CertificationsAndCalc from '../components/CertificationsAndCalc'
import MethodologySection from '../components/MethodologySection'
import ContactAndFooter from '../components/ContactAndFooter'

const Home = () => (
  <main className="home-page">
    <HeroSection />
    <FeaturesSection />
    <CoursesSection />
    <CertificationsAndCalc />
    <MethodologySection />
    <ContactAndFooter />
  </main>
)

export default Home