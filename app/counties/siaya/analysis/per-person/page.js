import AnalysisTopic, { topicMetadata } from '../../../../../components/siaya/AnalysisTopic';
import { PerPerson, BesideServices, ClimateFinance } from '../../../../../components/siaya/AnalysisCalc';

export const metadata = topicMetadata('per-person');

export default function Page() {
  return (
    <AnalysisTopic slug="per-person" abbrs={['PCRA', 'FLLoCA']}>
      <PerPerson />
      <BesideServices />
      <ClimateFinance />
    </AnalysisTopic>
  );
}
