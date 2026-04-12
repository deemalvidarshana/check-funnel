export default function AuthToggle({ mode, setMode }) {
  return (
    <div className="rounded-full bg-slate-100 p-1.5 flex w-full shadow-inner">
      <button
        type="button"
        onClick={() => setMode("login")}
        className={`flex-1 rounded-full py-3 text-sm font-semibold transition-all duration-300 ${
          mode === "login"
            ? "bg-white text-slate-900 shadow-sm"
            : "text-slate-500 hover:text-slate-800"
        }`}
      >
        Log In
      </button>

      <button
        type="button"
        onClick={() => setMode("register")}
        className={`flex-1 rounded-full py-3 text-sm font-semibold transition-all duration-300 ${
          mode === "register"
            ? "bg-white text-slate-900 shadow-sm"
            : "text-slate-500 hover:text-slate-800"
        }`}
      >
        Register
      </button>
    </div>
  );
}