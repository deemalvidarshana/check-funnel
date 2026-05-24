import { useState } from "react";
import AuthHeroPanel from "../../components/auth/AuthHeroPanel";
import AuthToggle from "../../components/auth/AuthToggle";
import LoginForm from "../../components/auth/LoginForm";
import SocialLoginButtons from "../../components/auth/SocialLoginButtons";

export default function Login() {
  const [mode, setMode] = useState("login");

  return (
    <main className="h-screen bg-slate-100 overflow-hidden">
      <div className="flex h-full">
        <AuthHeroPanel />

        <section className="w-full lg:w-[46%] xl:w-[44%] bg-white h-full overflow-y-auto">
          <div className="min-h-full flex items-center justify-center px-5 sm:px-8 lg:px-10 py-6">
            <div className="w-full max-w-md">
              <div className="text-center mb-5">
                <h1 className="text-3xl font-extrabold tracking-tight text-[#0f3d91]">
                  Check Funnel
                </h1>
                <p className="text-sm text-slate-500 mt-2">
                  Reporting system access portal
                </p>
              </div>

              <AuthToggle mode={mode} setMode={setMode} />

              <div className="mt-5">
                <LoginForm mode={mode} setMode={setMode} />
              </div>

              <div className="mt-4">
                <SocialLoginButtons />
              </div>

              <footer className="mt-5 pt-4 border-t border-slate-200 text-center">
                <p className="text-xs text-slate-400">
                  © 2026 Check Funnel. All rights reserved.
                </p>

                <div className="flex items-center justify-center gap-5 mt-3">
                  <a
                    href="#"
                    className="text-xs text-slate-400 hover:text-slate-700 transition"
                  >
                    Privacy Policy
                  </a>
                  <a
                    href="#"
                    className="text-xs text-slate-400 hover:text-slate-700 transition"
                  >
                    Security
                  </a>
                </div>
              </footer>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
