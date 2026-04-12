import { useNavigate } from "react-router-dom";

export default function ReportBuilderCard() {
  const navigate = useNavigate();

  return (
    <section
      onClick={() => navigate("/reports")}
      className="bg-white rounded-2xl p-8 shadow-[0_30px_60px_-15px_rgba(25,28,29,0.06)] flex flex-col cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_35px_70px_-15px_rgba(25,28,29,0.12)]"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-slate-900">Report Builder</h3>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            navigate("/reports");
          }}
          className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-blue-100 transition-colors"
        >
          💬
        </button>
      </div>

      <div className="flex-grow flex flex-col items-center justify-center py-4">
        <div className="relative w-40 h-40">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="70" fill="transparent" stroke="#e2e8f0" strokeWidth="12" />
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="transparent"
              stroke="#014f99"
              strokeWidth="12"
              strokeDasharray="440"
              strokeDashoffset="110"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-4xl text-blue-900">
            📊
          </div>
        </div>

        <p className="mt-6 text-sm text-slate-500 font-medium text-center">
          Quarterly Analysis Generation
        </p>
      </div>
    </section>
  );
}