import AnalysisTopic, { topicMetadata } from '../../../../../components/siaya/AnalysisTopic';
import { Transfers, OsrComposition } from '../../../../../components/siaya/AnalysisCalc';

export const metadata = topicMetadata('revenue');

export default function Page() {
  return (
    <AnalysisTopic slug="revenue" abbrs={['FIF', 'A-i-A']}>
      <Transfers />
      <OsrComposition />
    </AnalysisTopic>
  );
}
