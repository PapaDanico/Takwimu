import SiayaRelated from '../../../components/SiayaRelated';

// Every Siaya page ends with the Related block and the grouped list of Siaya pages (owner decision U6, 21 Nov 2026).
export default function SiayaLayout({ children }) {
  return <>{children}<SiayaRelated /></>;
}
