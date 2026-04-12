import { useNavigate } from "react-router-dom";

export default function SeoAnalyticsCard() {
  const navigate = useNavigate();

  return (
    <section
      onClick={() => navigate("/seo")}
      className="bg-slate-100 rounded-2xl p-8 border border-white/50 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_35px_70px_-15px_rgba(25,28,29,0.12)]"
    >
      <h3 className="text-xl font-bold mb-8 text-slate-900">SEO Analytics</h3>

      <div className="space-y-8">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-slate-500">Organic Traffic</span>
            <span className="text-green-500">↗</span>
          </div>
          <div className="w-full bg-white/70 h-2 rounded-full overflow-hidden">
            <div className="bg-blue-900 h-full w-[85%] rounded-full"></div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-slate-500">Keyword Rankings</span>
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            </div>
          </div>

          <div className="flex items-end gap-1 h-8">
            <div className="flex-1 bg-blue-900/20 h-3 rounded-t-sm"></div>
            <div className="flex-1 bg-blue-900/40 h-5 rounded-t-sm"></div>
            <div className="flex-1 bg-blue-900/60 h-8 rounded-t-sm"></div>
            <div className="flex-1 bg-blue-900/80 h-6 rounded-t-sm"></div>
            <div className="flex-1 bg-blue-900 h-7 rounded-t-sm"></div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-slate-500">Backlink Profile</span>
            <span className="text-xs font-bold text-blue-900">Strong</span>
          </div>

          <div className="w-full h-12 flex gap-1 items-center">
            <div className="h-full w-2 bg-blue-900/10 rounded-full"></div>
            <div className="h-full w-2 bg-blue-900/20 rounded-full"></div>
            <div className="h-full w-2 bg-blue-900/40 rounded-full"></div>
            <div className="h-full w-2 bg-blue-900/60 rounded-full"></div>
            <div className="h-full w-2 bg-blue-900/80 rounded-full"></div>
            <div className="h-full w-2 bg-blue-900 rounded-full"></div>
          </div>
        </div>
      </div>
    </section>
  );
}