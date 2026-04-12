import { useNavigate } from "react-router-dom";

export default function CompetitorAnalyticsCard() {
  const navigate = useNavigate();

  return (
    <section
      onClick={() => navigate("/competitors")}
      className="bg-white rounded-2xl p-8 shadow-[0_30px_60px_-15px_rgba(25,28,29,0.06)] cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_35px_70px_-15px_rgba(25,28,29,0.12)]"
    >
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 mb-8">
        <h3 className="text-2xl font-bold text-slate-900">
          Competitor Analytics
        </h3>

        <div
          className="flex gap-4 flex-wrap"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-900"></div>
            <span className="text-xs font-bold text-slate-500">
              AnalytixHub
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
            <span className="text-xs font-bold text-slate-500">
              MarketoFlow
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-300"></div>
            <span className="text-xs font-bold text-slate-500">
              GrowthHub
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="flex flex-col items-center">
          <p className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-widest">
            Sentiment
          </p>

          <div className="w-full aspect-square relative max-w-[180px]">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#d5e3ff"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#003870"
                strokeWidth="8"
                strokeDasharray="251"
                strokeDashoffset="60"
                strokeLinecap="round"
              />
            </svg>

            <div className="absolute inset-0 flex items-center justify-center text-blue-900 text-2xl">
              😊
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <p className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-widest">
            Share of Voice
          </p>

          <div className="w-full aspect-square flex items-end gap-2 px-4 max-w-[180px]">
            <div className="flex-1 bg-blue-900/20 h-[40%] rounded-t-lg"></div>
            <div className="flex-1 bg-indigo-600/80 h-[85%] rounded-t-lg"></div>
            <div className="flex-1 bg-blue-900 h-[60%] rounded-t-lg"></div>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <p className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-widest">
            Reach
          </p>

          <div className="w-full aspect-square relative flex items-center justify-center max-w-[180px]">
            <div className="absolute w-full h-full border-2 border-dashed border-slate-300 rounded-full"></div>
            <div className="w-[80%] h-[80%] bg-blue-900/10 rounded-full flex items-center justify-center">
              <div className="w-[50%] h-[50%] bg-blue-900/40 rounded-full flex items-center justify-center">
                <div className="w-[20%] h-[20%] bg-blue-900 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}