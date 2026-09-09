import { useCallback, useEffect, useState } from 'react';
import { getClients } from '../../api/client';
import { getPaidAdsInsights } from '../../api/paidAds';
import CampaignRankingTable from '../../components/paid-ads/CampaignRankingTable';
import CreativePerformance from '../../components/paid-ads/CreativePerformance';
import AudienceAnalytics from '../../components/paid-ads/AudienceAnalytics';
import { AnalysisTypeDropdown, ClientDropdown, MonthPicker } from '../../components/paid-ads/PaidAdsFilters';
import PaidAdsMetricCards from '../../components/paid-ads/PaidAdsMetricCards';
import PaidAdsPerformanceChart from '../../components/paid-ads/PaidAdsPerformanceChart';
import PaidAdsEcommerceMetricCards from '../../components/paid-ads/PaidAdsEcommerceMetricCards';
import PaidAdsEcommerceTrend from '../../components/paid-ads/PaidAdsEcommerceTrend';
import PaidAdsEcommerceFunnel from '../../components/paid-ads/PaidAdsEcommerceFunnel';
import PaidAdsEcommerceCampaigns from '../../components/paid-ads/PaidAdsEcommerceCampaigns';
import PaidAdsEcommerceAudience from '../../components/paid-ads/PaidAdsEcommerceAudience';
import PaidAdsBrandEnquiryMetricCards from '../../components/paid-ads/PaidAdsBrandEnquiryMetricCards';
import PaidAdsBrandEnquiryTrend from '../../components/paid-ads/PaidAdsBrandEnquiryTrend';
import PaidAdsBrandEnquiryJourney from '../../components/paid-ads/PaidAdsBrandEnquiryJourney';
import PaidAdsBrandEnquiryCampaigns from '../../components/paid-ads/PaidAdsBrandEnquiryCampaigns';
import PaidAdsBrandEnquiryAudience from '../../components/paid-ads/PaidAdsBrandEnquiryAudience';
import { paidAdsErrorMessage } from '../../utils/paidAdsFormatters';

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function DashboardState({ type, message }) {
  if (type === 'loading') {
    return <section className="mt-6 flex min-h-[60vh] w-full items-center justify-center"><div className="flex flex-col items-center text-center"><div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#003870]/20 border-t-[#003870]"/><h3 className="mb-1 text-lg font-bold text-[#191c1d]">Loading dashboard...</h3><p className="max-w-xs text-sm font-medium text-[#727782]">Preparing your paid ads performance overview.</p></div></section>;
  }
  return <div className="mt-10 flex min-h-72 flex-col items-center justify-center rounded-3xl border border-[#c2c6d3]/30 bg-white p-10 text-center"><div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${type==='error'?'bg-red-50 text-red-600':'bg-[#003870]/5 text-[#003870]'}`}>{type==='loading'?<span className="h-7 w-7 animate-spin rounded-full border-4 border-[#003870]/20 border-t-[#003870]"/>:type==='error'?'!':'↗'}</div><p className="max-w-lg text-sm font-bold text-[#424751]">{message}</p></div>;
}

export default function PaidAdsAnalysis() {
  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);
  const [analysisType, setAnalysisType] = useState('all');
  const [data, setData] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [conversionData, setConversionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active=true;
    getClients().then(result=>{
      if (!active) return;
      const loadedClients = Array.isArray(result) ? result : [];
      setClients(loadedClients);

      // "All Clients" cannot be combined safely because Meta ad accounts can use
      // different currencies. Open the dashboard on the first fully configured
      // client instead, so saved credentials immediately produce useful data.
      const configuredClient = loadedClients.find(client => client.metaAdAccountId && client.facebookApiKey);
      if (configuredClient) {
        setSelectedClient(current => current === 'all' ? String(configuredClient.id) : current);
      }
    }).catch(error=>setError(paidAdsErrorMessage(error))).finally(()=>active&&setClientsLoading(false));
    return()=>{active=false;};
  },[]);

  const loadInsights = useCallback(async () => {
    if (selectedClient==='all') { setData(null); setError(''); return; }
    setLoading(true); setError('');
    try {
      const result = await getPaidAdsInsights(selectedClient, selectedMonth);
      setData(result);
      setPerformanceData(result);
      setConversionData(result);
    }
    catch (requestError) { setData(null); setPerformanceData(null); setConversionData(null); setError(paidAdsErrorMessage(requestError)); }
    finally { setLoading(false); }
  },[selectedClient,selectedMonth]);

  useEffect(()=>{loadInsights();},[loadInsights]);

  const applyPerformanceRange = useCallback(async (range) => {
    if (selectedClient === 'all') return;
    setComparisonLoading(true);
    try {
      const result = await getPaidAdsInsights(selectedClient, selectedMonth, range);
      setPerformanceData(result);
      return result;
    } finally {
      setComparisonLoading(false);
    }
  }, [selectedClient, selectedMonth]);

  const applyConversionRange = useCallback(async (range) => {
    if (selectedClient === 'all') return;
    const result = await getPaidAdsInsights(selectedClient, selectedMonth, range);
    setConversionData(result);
    return result;
  }, [selectedClient, selectedMonth]);

  const dashboardSubtitle = analysisType === 'ecommerce'
    ? 'Paid media revenue and purchase performance for the selected client.'
    : analysisType === 'brand-enquiry'
      ? 'Brand awareness, engagement and enquiry performance for the selected client.'
      : 'Live Meta Marketing API performance for the selected client and month.';

  const renderDashboard = () => {
    if (analysisType === 'ecommerce') {
      return <><PaidAdsEcommerceMetricCards totals={data.totals} currency={data.account.currency}/><PaidAdsEcommerceTrend key={`ecommerce-trend-${selectedClient}-${selectedMonth}`} data={performanceData || data} clientId={selectedClient} selectedMonth={selectedMonth} onApplyRange={applyPerformanceRange} loading={comparisonLoading}/><PaidAdsEcommerceFunnel totals={(performanceData || data).totals} currency={data.account.currency} period={(performanceData || data).period} comparisonPeriod={(performanceData || data).comparisonPeriod} onApplyRange={applyPerformanceRange} loading={comparisonLoading}/><PaidAdsEcommerceCampaigns campaigns={data.campaigns} currency={data.account.currency}/><CreativePerformance key="ecommerce" creatives={data.creatives} currency={data.account.currency} mode="ecommerce"/><PaidAdsEcommerceAudience audience={data.audience} currency={data.account.currency}/></>;
    }
    if (analysisType === 'brand-enquiry') {
      return <><PaidAdsBrandEnquiryMetricCards totals={data.totals} currency={data.account.currency} campaigns={data.campaigns}/><PaidAdsBrandEnquiryTrend key={`brand-trend-${selectedClient}-${selectedMonth}`} data={performanceData || data} clientId={selectedClient} selectedMonth={selectedMonth} onApplyRange={applyPerformanceRange} loading={comparisonLoading}/><PaidAdsBrandEnquiryJourney campaigns={data.campaigns} totals={data.totals} currency={data.account.currency}/><PaidAdsBrandEnquiryCampaigns campaigns={data.campaigns} currency={data.account.currency}/><CreativePerformance key="brand-enquiry" creatives={data.creatives} currency={data.account.currency} mode="brand-enquiry"/><PaidAdsBrandEnquiryAudience audience={data.audience} currency={data.account.currency}/></>;
    }
    return <><PaidAdsMetricCards totals={data.totals} currency={data.account.currency}/><PaidAdsPerformanceChart key={`all-trend-${selectedClient}-${selectedMonth}`} data={performanceData || data} clientId={selectedClient} selectedMonth={selectedMonth} onApplyRange={applyPerformanceRange} loading={comparisonLoading}/><CampaignRankingTable campaigns={data.campaigns} totals={data.totals} currency={data.account.currency}/><CreativePerformance key="all" creatives={data.creatives} currency={data.account.currency}/><AudienceAnalytics audience={data.audience} conversionData={conversionData || data} onApplyConversionRange={applyConversionRange}/></>;
  };

  return <main className="min-h-full w-full bg-[#f8f9fa]"><div className="mx-auto max-w-[1800px]">
    <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start"><div className="min-w-0"><h1 className="text-3xl tracking-tight text-[#191c1d] min-[420px]:text-4xl xl:text-[40px] 2xl:text-5xl"><span className="font-extrabold">Paid Ads </span><span className="font-medium">Analytics</span></h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#424751] min-[420px]:text-base sm:text-lg sm:leading-7">{dashboardSubtitle}</p></div><div className="flex w-full min-w-0 flex-col items-start gap-3 xl:w-auto xl:items-end"><div className="flex w-full min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center xl:w-auto xl:flex-nowrap xl:justify-end"><ClientDropdown clients={clients} value={selectedClient} onChange={setSelectedClient} loading={clientsLoading}/><AnalysisTypeDropdown value={analysisType} onChange={setAnalysisType}/></div><div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center xl:justify-end"><MonthPicker value={selectedMonth} onChange={setSelectedMonth}/><button onClick={loadInsights} disabled={selectedClient==='all'||loading} className="flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#003870_0%,#014f99_100%)] px-5 text-sm font-bold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">↻ {loading?'Syncing...':'Sync Live Data'}</button></div>{data&&!loading&&<p className="text-xs font-bold text-[#727782] xl:text-right">Synced {new Date(data.syncedAt).toLocaleString()}</p>}</div></div>
    {(clientsLoading || (selectedClient!=='all'&&loading))&&<DashboardState type="loading"/>}
    {!clientsLoading&&selectedClient==='all'&&<DashboardState message="Select a client to load live Meta Ads data from its saved credentials."/>}
    {!clientsLoading&&selectedClient!=='all'&&!loading&&error&&<DashboardState type="error" message={error}/>} 
    {!clientsLoading&&selectedClient!=='all'&&!loading&&data&&renderDashboard()}
  </div></main>;
}
