function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 48 48">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.6 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12S17.4 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5Z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4c-7.7 0-14.3 4.3-17.7 10.7Z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 10-2 13.5-5.2l-6.2-5.2c-2.1 1.6-4.7 2.4-7.3 2.4-5.2 0-9.6-3.3-11.2-8l-6.5 5C9.6 39.5 16.3 44 24 44Z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4 5.6l6.2 5.2C36.9 38.4 44 33 44 24c0-1.2-.1-2.3-.4-3.5Z"
      />
    </svg>
  );
}

function SSOIcon() {
  return (
    <svg
      className="w-5 h-5 text-slate-700"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M8 9h8M8 15h5" strokeLinecap="round" />
    </svg>
  );
}

export default function SocialLoginButtons() {
  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200"></div>
        </div>

        <div className="relative flex justify-center">
          <span className="bg-white px-4 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Or continue with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className="h-12 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 transition flex items-center justify-center gap-2.5"
        >
          <GoogleIcon />
          <span className="text-sm font-semibold text-slate-700">Google</span>
        </button>

        <button
          type="button"
          className="h-12 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 transition flex items-center justify-center gap-2.5"
        >
          <SSOIcon />
          <span className="text-sm font-semibold text-slate-700">SSO</span>
        </button>
      </div>
    </div>
  );
}