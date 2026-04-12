export default function DashboardHeader() {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
          Precision <span className="italic font-light">Intelligence</span>
        </h1>
        <p className="text-slate-500 font-medium text-lg mt-2">
          Welcome back, Alex. Your marketing landscape is evolving.
        </p>
      </div>
    </div>
  );
}