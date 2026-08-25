import { useCallback, useEffect, useState } from 'react';
import { getClients } from '../../api/client';
import { getPaidAdsInsights } from '../../api/paidAds';
import CampaignRankingTable from '../../components/paid-ads/CampaignRankingTable';
import CreativePerformance from '../../components/paid-ads/CreativePerformance';
import AudienceAnalytics from '../../components/paid-ads/AudienceAnalytics';
import { ClientDropdown, MonthPicker } from '../../components/paid-ads/PaidAdsFilters';
import PaidAdsMetricCards from '../../components/paid-ads/PaidAdsMetricCards';
import PaidAdsPerformanceChart from '../../components/paid-ads/PaidAdsPerformanceChart';
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
  const [data, setData] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
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
    }
    catch (requestError) { setData(null); setPerformanceData(null); setError(paidAdsErrorMessage(requestError)); }
    finally { setLoading(false); }
  },[selectedClient,selectedMonth]);

  useEffect(()=>{loadInsights();},[loadInsights]);

  const applyPerformanceRange = useCallback(async (range) => {
    if (selectedClient === 'all') return;
    setComparisonLoading(true);
    try {
      const result = await getPaidAdsInsights(selectedClient, selectedMonth, range);
      setPerformanceData(result);
    } finally {
      setComparisonLoading(false);
    }
  }, [selectedClient, selectedMonth]);

  return <main className="min-h-full w-full bg-[#f8f9fa]"><div className="mx-auto max-w-[1800px]">
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between"><div className="shrink-0"><h1 className="text-4xl tracking-tight text-[#191c1d] sm:text-5xl"><span className="font-extrabold">Paid Ads </span><span className="font-medium">Analytics</span></h1><p className="mt-3 max-w-2xl text-base leading-7 text-[#424751] sm:text-lg">Live Meta Marketing API performance for the selected client and month.</p></div><div className="flex flex-wrap items-center gap-3 lg:justify-end"><MonthPicker value={selectedMonth} onChange={setSelectedMonth}/><ClientDropdown clients={clients} value={selectedClient} onChange={setSelectedClient} loading={clientsLoading}/><button onClick={loadInsights} disabled={selectedClient==='all'||loading} className="flex h-11 items-center gap-2 rounded-full bg-[linear-gradient(135deg,#003870_0%,#014f99_100%)] px-6 text-sm font-bold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-50">↻ {loading?'Syncing...':'Sync Live Data'}</button></div></div>
    {(clientsLoading || (selectedClient!=='all'&&loading))&&<DashboardState type="loading"/>}
    {!clientsLoading&&selectedClient==='all'&&<DashboardState message="Select a client to load live Meta Ads data from its saved credentials."/>}
    {!clientsLoading&&selectedClient!=='all'&&!loading&&error&&<DashboardState type="error" message={error}/>} 
    {!clientsLoading&&selectedClient!=='all'&&!loading&&data&&<><div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#c2c6d3]/30 bg-white px-5 py-3 text-xs font-bold text-[#727782]"><span>{data.client.name} · {data.account.name} · {data.account.currency}</span><span>Synced {new Date(data.syncedAt).toLocaleString()}</span></div><PaidAdsMetricCards totals={data.totals} currency={data.account.currency}/><PaidAdsPerformanceChart data={performanceData || data} onApplyRange={applyPerformanceRange} loading={comparisonLoading}/><CampaignRankingTable campaigns={data.campaigns} totals={data.totals} currency={data.account.currency}/><CreativePerformance creatives={data.creatives} currency={data.account.currency}/><AudienceAnalytics audience={data.audience} daily={data.daily} previousDaily={data.previousDaily}/></>}
  </div></main>;
}
