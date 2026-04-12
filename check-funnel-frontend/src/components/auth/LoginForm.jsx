import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser } from "../../api/auth";

// ---------------- Icon Components ----------------
function MailIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m22 8-8.97 5.7a2 2 0 0 1-2.06 0L2 8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="10" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21a8 8 0 0 0-16 0" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ---------------- Toast Component ----------------
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const borderColor = type === "success" ? "border-[#0f3d91]" : "border-red-500";
  const iconColor = type === "success" ? "text-[#0f3d91]" : "text-red-500";

  return (
    <div className={`fixed top-6 right-6 z-[300] flex items-center gap-3 px-4 py-3 rounded-xl bg-white border-l-4 ${borderColor} shadow-xl animate-in slide-in-from-top-4 duration-300`}>
       <div className={`${iconColor}`}>
         {type === "success" ? (
           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
           </svg>
         ) : (
           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
           </svg>
         )}
       </div>
       <p className="text-sm font-semibold text-slate-700 tracking-tight">{message}</p>
    </div>
  );
}

// ---------------- Input Field Component ----------------
function InputField({ id, name, type, label, placeholder, icon, rightText }) {
  const isPassword = type === "password" || name?.toLowerCase().includes("password");
  const [show, setShow] = useState(false);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</label>
        {rightText && (
          <a href="#" className="text-xs font-semibold text-indigo-600 hover:text-slate-900 transition">{rightText}</a>
        )}
      </div>
      <div className="relative">
        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
        <input 
          id={id} 
          name={name} 
          type={isPassword ? (show ? "text" : "password") : type} 
          placeholder={placeholder} 
          className="w-full h-14 rounded-[22px] border border-slate-200 bg-slate-50 pl-14 pr-12 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100" 
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-900 transition-colors p-1"
          >
            {show ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------- Main Component ----------------
export default function LoginForm({ mode, setMode }) {
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
      if (mode === "register") {
        if (data.password !== data.confirmPassword) {
          setToast({ message: "Passwords do not match!", type: "error" });
          return;
        }
        await registerUser(data);
        setToast({ message: "Registration Successful! Switching back to Login...", type: "success" });
        
        // Auto-redirection after successful signup
        setTimeout(() => {
          if (setMode) setMode("login");
        }, 2000);

      } else {
        const response = await loginUser({ email: data.email, password: data.password });
        if (response.access_token) {
          localStorage.setItem("token", response.access_token);
          if (response.user) {
            localStorage.setItem("user", JSON.stringify(response.user));
          }
          setToast({ message: "Login Successful! Welcome back.", type: "success" });
          setTimeout(() => navigate("/dashboard"), 1000);
        }
      }
    } catch (error) {
      console.error("Authentication error:", error);
      const msg = error.response?.data?.message || "Authentication failed";
      setToast({ message: msg, type: "error" });
    }
  };

  const isRegister = mode === "register";

  return (
    <>
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      <form key={mode} onSubmit={handleSubmit} className="space-y-5">
        {isRegister && (
          <InputField id="fullName" name="fullName" type="text" label="Full Name" placeholder="Enter your full name" icon={<UserIcon />} />
        )}

        <InputField id="email" name="email" type="email" label="Email Address" placeholder="name@company.com" icon={<MailIcon />} />

        <InputField id="password" name="password" type="password" label="Password" placeholder="Enter your password" icon={<LockIcon />} rightText={!isRegister ? "Forgot password?" : ""} />

        {isRegister && (
          <InputField id="confirmPassword" name="confirmPassword" type="password" label="Confirm Password" placeholder="Re-enter your password" icon={<LockIcon />} />
        )}

        {!isRegister ? (
          <div className="flex items-center gap-3 pt-1">
            <input id="remember" type="checkbox" className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
            <label htmlFor="remember" className="text-sm text-slate-500 select-none cursor-pointer">Stay signed in for 30 days</label>
          </div>
        ) : (
          <div className="flex items-start gap-3 pt-1">
            <input id="terms" type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
            <label htmlFor="terms" className="text-sm leading-6 text-slate-500 select-none cursor-pointer">I agree to the terms and guidelines.</label>
          </div>
        )}

        <button type="submit" className="w-full h-14 rounded-full bg-gradient-to-r from-slate-950 via-blue-900 to-cyan-600 text-white font-semibold text-sm shadow-lg shadow-blue-900/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98]">
          {isRegister ? "Create Account" : "Sign In"}
        </button>
      </form>
    </>
  );
}
