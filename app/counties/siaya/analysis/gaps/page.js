import AnalysisTopic, { topicMetadata } from '../../../../../components/siaya/AnalysisTopic';
import { GapList } from '../../../../../components/siaya/AnalysisCalc';

export const metadata = topicMetadata('gaps');

export default function Page() {
  return (
    <AnalysisTopic slug="gaps">
      <GapList />
    </AnalysisTopic>
  );
}
