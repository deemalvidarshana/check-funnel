import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PaidAdsAnalysis from '../paid-ads/PaidAdsAnalysis';
import NotFound from '../not-found/NotFound';

const validAnalysisTypes = new Set(['all', 'ecommerce', 'brand-enquiry']);

export default function PublicPaidAdsReport() {
  const { shareToken, month, analysisType } = useParams();
  const navigate = useNavigate();
  const validMonth = /^\d{4}-(0[1-9]|1[0-2])$/.test(month || '');
  const validAnalysisType = validAnalysisTypes.has(analysisType);

  const handleMonthChange = useCallback((nextMonth) => {
    navigate(`/public-paid-ads/${encodeURIComponent(shareToken)}/${nextMonth}/${analysisType}`, { replace: true });
  }, [analysisType, navigate, shareToken]);

  if (!shareToken || !validMonth || !validAnalysisType) return <NotFound />;

  return <div className="min-h-screen min-w-0 bg-[#f8f9fa] p-4 sm:p-6 lg:p-6 xl:p-8 2xl:p-10">
    <PaidAdsAnalysis
      publicShareToken={shareToken}
      initialMonth={month}
      initialAnalysisType={analysisType}
      onPublicMonthChange={handleMonthChange}
    />
  </div>;
}
