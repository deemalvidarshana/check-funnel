export default function DashboardFooter() {
  return (
    <footer className="pt-8 border-t border-slate-200">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-sm text-slate-500">© 2024 Check Funnel. All rights reserved.</p>

        <div className="flex gap-8 flex-wrap justify-center">
          <a href="#" className="text-sm text-slate-500 hover:text-blue-900 transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="text-sm text-slate-500 hover:text-blue-900 transition-colors">
            Terms of Service
          </a>
          <a href="#" className="text-sm text-slate-500 hover:text-blue-900 transition-colors">
            Cookie Settings
          </a>
        </div>
      </div>
    </footer>
  );
}