import { Link } from "react-router-dom";

export default function InitializePartnerCard({ clientId }) {
  const targetPath = clientId ? `/competitors/${clientId}` : "/competitors";

  return (
    <div className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#003870_0%,#014f99_100%)] p-8 text-white shadow-lg">
      <div className="absolute right-[-60px] top-[-60px] h-32 w-32 rounded-full bg-white/10 blur-2xl" />

      <div className="relative z-10">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
          <span className="text-2xl font-bold">+</span>
        </div>

        <h3 className="mb-2 text-xl font-bold">Competitor Dashboard</h3>
        <p className="mb-8 text-sm leading-7 text-blue-100">
          Review competitor performance insights and benchmark this client
          against their market.
        </p>

        <Link to={targetPath} className="flex w-full items-center justify-center gap-2 rounded-full bg-white py-3 font-bold text-[#003870] transition hover:bg-blue-50">
          <span>Connect Now</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  );
}
