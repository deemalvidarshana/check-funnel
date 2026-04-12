import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
      <h2 className="text-4xl font-bold text-slate-800 mb-3">404</h2>
      <p className="text-slate-500 mb-6">Page not found.</p>
      <Link
        to="/dashboard"
        className="rounded-lg bg-slate-900 text-white px-5 py-3"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}