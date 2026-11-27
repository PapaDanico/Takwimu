import AnalysisTopic, { topicMetadata } from '../../../../../components/siaya/AnalysisTopic';
import { SpentTenYear, Unspent, Growth } from '../../../../../components/siaya/AnalysisTrends';
import { WageBill, DevShare, DeptAbsorption } from '../../../../../components/siaya/Layers';
import { PrintedRecalculated } from '../../../../../components/siaya/AnalysisCalc';

export const metadata = topicMetadata('spending');

export default function Page() {
  return (
    <AnalysisTopic slug="spending">
      <SpentTenYear />
      <Unspent />
      <Growth />
      <PrintedRecalculated />
      <WageBill />
      <DevShare />
      <DeptAbsorption />
    </AnalysisTopic>
  );
}
