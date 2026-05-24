import { useNavigate } from "react-router-dom";

export default function SocialAnalyticsCard() {
  const navigate = useNavigate();

  return (
    <section
      onClick={() => navigate("/clients")}
      className="bg-white rounded-2xl p-8 shadow-[0_30px_60px_-15px_rgba(25,28,29,0.06)] relative overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_35px_70px_-15px_rgba(25,28,29,0.12)]"
    >
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
        <div>
          <h3 className="text-2xl font-bold mb-1 text-slate-900">
            Social Media Analytics
          </h3>
          <p className="text-sm text-slate-500">
            Cross-platform engagement trends
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <span className="px-3 py-1 bg-blue-900/10 text-blue-900 text-xs font-bold rounded-full">
            Facebook
          </span>
          <span className="px-3 py-1 bg-indigo-600/10 text-indigo-600 text-xs font-bold rounded-full">
            Instagram
          </span>
          <span className="px-3 py-1 bg-sky-400/10 text-sky-500 text-xs font-bold rounded-full">
            TikTok
          </span>
        </div>
      </div>

      <div className="h-64 relative">
        <svg
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
          viewBox="0 0 1000 240"
        >
          <path
            d="M0 180 Q 100 120 200 150 T 400 60 T 600 90 T 800 40 T 1000 70"
            fill="none"
            stroke="#4553c1"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M0 200 Q 120 180 240 100 T 480 140 T 720 50 T 1000 20"
            fill="none"
            stroke="#003870"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.85"
          />
          <path
            d="M0 150 Q 150 160 300 120 T 600 180 T 900 110 T 1000 130"
            fill="none"
            stroke="#a8c8ff"
            strokeWidth="4"
            strokeDasharray="8 4"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </section>
  );
}
