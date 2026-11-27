import AnalysisTopic, { topicMetadata } from '../../../../../components/siaya/AnalysisTopic';
import { PendingTenYear } from '../../../../../components/siaya/AnalysisTrends';
import { PendingBurden } from '../../../../../components/siaya/Layers';
import { PendingBySource } from '../../../../../components/siaya/AnalysisCalc';

export const metadata = topicMetadata('pending-bills');

export default function Page() {
  return (
    <AnalysisTopic slug="pending-bills">
      <PendingTenYear />
      <PendingBySource />
      <PendingBurden />
    </AnalysisTopic>
  );
}
