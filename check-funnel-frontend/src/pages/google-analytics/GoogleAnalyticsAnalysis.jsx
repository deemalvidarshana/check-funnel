import { useCallback, useEffect, useState } from "react";
import { getClients } from "../../api/client";
import { getGoogleAnalyticsInsights } from "../../api/googleAnalytics";
import GoogleAnalyticsAudiencePanels from "../../components/google-analytics/GoogleAnalyticsAudiencePanels";
import GoogleAnalyticsChannelPanels from "../../components/google-analytics/GoogleAnalyticsChannelPanels";
import {
  GoogleAnalyticsClientDropdown,
  GoogleAnalyticsJourneyTypeDropdown,
  GoogleAnalyticsMonthPicker,
} from "../../components/google-analytics/GoogleAnalyticsFilters";
import GoogleAnalyticsJourneys from "../../components/google-analytics/GoogleAnalyticsJourneys";
import GoogleAnalyticsInquiryLandingPages from "../../components/google-analytics/GoogleAnalyticsInquiryLandingPages";
import GoogleAnalyticsLeadLandingPages from "../../components/google-analytics/GoogleAnalyticsLeadLandingPages";
import GoogleAnalyticsMetricCards from "../../components/google-analytics/GoogleAnalyticsMetricCards";
import GoogleAnalyticsProductPerformance from "../../components/google-analytics/GoogleAnalyticsProductPerformance";
import GoogleAnalyticsTrendChart from "../../components/google-analytics/GoogleAnalyticsTrendChart";
import { googleAnalyticsErrorMessage } from "../../utils/googleAnalyticsFormatters";

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function DashboardState({ loading = false, error = false, children }) {
  return (
    <section className="mt-8 flex min-h-[55vh] items-center justify-center rounded-[28px] border border-[#c2c6d3]/20 bg-white p-8 text-center">
      <div className="flex max-w-lg flex-col items-center">
        <div
          className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${error ? "bg-red-50 text-red-600" : "bg-[#e8f0fe] text-[#1a73e8]"}`}
        >
          {loading ? (
            <span className="h-8 w-8 animate-spin rounded-full border-4 border-[#1a73e8]/20 border-t-[#1a73e8]" />
          ) : error ? (
            "!"
          ) : (
            <span className="text-2xl font-black">G</span>
          )}
        </div>
        <p className="text-sm font-bold leading-6 text-[#424751]">{children}</p>
      </div>
    </section>
  );
}

export default function GoogleAnalyticsAnalysis() {
  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);
  const [journeyType, setJourneyType] = useState("ecommerce");
  const [data, setData] = useState(null);
  const [trendData, setTrendData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [trendLoading, setTrendLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getClients()
      .then((result) => {
        if (!active) return;
        const loadedClients = Array.isArray(result) ? result : [];
        setClients(loadedClients);
        const configuredClient = loadedClients.find(
          (client) => client.googleAnalyticsPropertyId,
        );
        if (configuredClient) setSelectedClient(String(configuredClient.id));
      })
      .catch((requestError) =>
        setError(googleAnalyticsErrorMessage(requestError)),
      )
      .finally(() => active && setClientsLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const loadInsights = useCallback(async () => {
    if (selectedClient === "all") {
      setData(null);
      setTrendData(null);
      setError("");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await getGoogleAnalyticsInsights(
        selectedClient,
        selectedMonth,
      );
      setData(result);
      setTrendData(result);
    } catch (requestError) {
      setData(null);
      setTrendData(null);
      setError(googleAnalyticsErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [selectedClient, selectedMonth]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  const applyTrendRange = useCallback(
    async (range) => {
      if (selectedClient === "all") return;
      setTrendLoading(true);
      try {
        const result = await getGoogleAnalyticsInsights(
          selectedClient,
          selectedMonth,
          range,
        );
        setTrendData(result);
        return result;
      } finally {
        setTrendLoading(false);
      }
    },
    [selectedClient, selectedMonth],
  );

  const currency = data?.property?.currencyCode || "USD";
  const activeTrendData = trendData || data;
  const description =
    journeyType === "lead-generation"
      ? "Website traffic and lead performance for the selected client."
      : journeyType === "enquiry-generation"
        ? "Website traffic and enquiries for the selected client."
        : "Website traffic and ecommerce performance for the selected client.";
  const trendRows =
    journeyType === "lead-generation"
      ? activeTrendData?.leadDaily
      : journeyType === "enquiry-generation"
        ? activeTrendData?.inquiryDaily
        : activeTrendData?.ecommerceDaily;
  const previousTrendRows =
    journeyType === "lead-generation"
      ? activeTrendData?.previousLeadDaily
      : journeyType === "enquiry-generation"
        ? activeTrendData?.previousInquiryDaily
        : activeTrendData?.previousEcommerceDaily;

  return (
    <main className="min-h-full w-full bg-[#f8f9fa]">
      <div className="mx-auto max-w-[1800px]">
        <header className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
          <div className="min-w-0">
            <h1 className="text-3xl tracking-tight text-[#191c1d] min-[420px]:text-4xl xl:text-[40px] 2xl:text-5xl">
              <span className="font-extrabold">Website Journey </span>
              <span className="font-medium">Analytics</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#424751] min-[420px]:text-base sm:text-lg sm:leading-7">
              {description}
            </p>
          </div>
          <div className="flex w-full min-w-0 flex-col gap-2 xl:w-auto xl:items-end">
            <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap xl:justify-end">
              <GoogleAnalyticsClientDropdown
                clients={clients}
                value={selectedClient}
                onChange={setSelectedClient}
                loading={clientsLoading}
              />
              <GoogleAnalyticsJourneyTypeDropdown
                value={journeyType}
                onChange={setJourneyType}
              />
            </div>
            <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center xl:justify-end">
              <GoogleAnalyticsMonthPicker
                value={selectedMonth}
                onChange={setSelectedMonth}
              />
              <button
                type="button"
                onClick={loadInsights}
                disabled={selectedClient === "all" || loading}
                className="flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#003870_0%,#014f99_100%)] px-5 text-sm font-bold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                ↻ {loading ? "Syncing..." : "Sync live data"}
              </button>
            </div>
            {data && !loading && (
              <p className="text-[11px] font-bold text-[#727782] xl:text-right">
                {data.property.name} · Synced{" "}
                {new Date(data.syncedAt).toLocaleString()} ·{" "}
                {data.property.timeZone}
              </p>
            )}
          </div>
        </header>

        {(clientsLoading || loading) && (
          <DashboardState loading>
            Loading the connected GA4 property and preparing its website journey
            report.
          </DashboardState>
        )}
        {!clientsLoading && !loading && error && (
          <DashboardState error>{error}</DashboardState>
        )}
        {!clientsLoading && !loading && !error && selectedClient === "all" && (
          <DashboardState>
            Select a client with a mapped GA4 property to load its website
            analytics.
          </DashboardState>
        )}
        {!clientsLoading && !loading && !error && data && (
          <>
            <GoogleAnalyticsMetricCards
              metrics={data.metrics}
              currency={currency}
              journeyType={journeyType}
            />
            <GoogleAnalyticsTrendChart
              key={journeyType}
              rows={trendRows}
              previousRows={previousTrendRows}
              period={activeTrendData.period}
              comparisonPeriod={activeTrendData.comparisonPeriod}
              currency={currency}
              journeyType={journeyType}
              loading={trendLoading}
              onApplyRange={applyTrendRange}
            />
            <GoogleAnalyticsChannelPanels
              channels={data.channels}
              ecommerceSources={data.ecommerceSources}
              leadChannels={data.leadChannels}
              leadSources={data.leadSources}
              inquiryChannels={data.inquiryChannels}
              inquirySources={data.inquirySources}
              currency={currency}
              journeyType={journeyType}
            />
            <GoogleAnalyticsJourneys
              purchaseJourney={data.purchaseJourney}
              leadJourney={data.leadJourney}
              inquiryJourney={data.inquiryJourney}
              tracking={data.tracking}
              journeyType={journeyType}
            />
            {journeyType === "enquiry-generation" && (
              <GoogleAnalyticsInquiryLandingPages
                rows={data.inquiryLandingPages}
              />
            )}
            {journeyType === "lead-generation" && (
              <GoogleAnalyticsLeadLandingPages rows={data.leadLandingPages} />
            )}
            {journeyType === "ecommerce" && (
              <GoogleAnalyticsProductPerformance
                rows={data.productPerformance}
                currency={currency}
              />
            )}
            <GoogleAnalyticsAudiencePanels
              lifecycle={data.lifecycle}
              devices={data.devices}
              topPages={data.topPages}
              currency={currency}
              journeyType={journeyType}
            />
          </>
        )}
      </div>
    </main>
  );
}
