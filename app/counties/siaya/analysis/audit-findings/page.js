import AnalysisTopic, { topicMetadata } from '../../../../../components/siaya/AnalysisTopic';
import { AuditRecurrence } from '../../../../../components/siaya/AnalysisCalc';

export const metadata = topicMetadata('audit-findings');

export default function Page() {
  return (
    <AnalysisTopic slug="audit-findings">
      <AuditRecurrence />
    </AnalysisTopic>
  );
}
