import DashboardHeader from "../../components/dashboard/DashboardHeader";
import SocialAnalyticsCard from "../../components/dashboard/SocialAnalyticsCard";
import ReportBuilderCard from "../../components/dashboard/ReportBuilderCard";
import SeoAnalyticsCard from "../../components/dashboard/SeoAnalyticsCard";
import CompetitorAnalyticsCard from "../../components/dashboard/CompetitorAnalyticsCard";
import StrategicInsightsCard from "../../components/dashboard/StrategicInsightsCard";
import PlatformHealthCard from "../../components/dashboard/PlatformHealthCard";
import UpgradeCard from "../../components/dashboard/UpgradeCard";
import DashboardFooter from "../../components/layout/DashboardFooter";

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <DashboardHeader />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8 space-y-8">
          <SocialAnalyticsCard />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ReportBuilderCard />
            <SeoAnalyticsCard />
          </div>

          <CompetitorAnalyticsCard />
        </div>

        <div className="xl:col-span-4 space-y-8">
          <StrategicInsightsCard />
          <PlatformHealthCard />
          <UpgradeCard />
        </div>
      </div>

      <DashboardFooter />
    </div>
  );
}