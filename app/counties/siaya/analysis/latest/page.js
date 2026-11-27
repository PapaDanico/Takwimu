import AnalysisTopic, { topicMetadata } from '../../../../../components/siaya/AnalysisTopic';
import { LatestYear } from '../../../../../components/siaya/AnalysisTrends';

export const metadata = topicMetadata('latest');

export default function Page() {
  return (
    <AnalysisTopic slug="latest">
      <LatestYear />
    </AnalysisTopic>
  );
}
