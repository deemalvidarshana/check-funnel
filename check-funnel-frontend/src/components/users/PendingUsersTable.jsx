const PendingUsersTable = ({ users = [], onApprove, onReject }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <section className="w-full">
      <div className="bg-slate-50/50 rounded-2xl p-6 lg:p-8 flex flex-col shadow-sm border border-slate-200/50 transition-all duration-300">
        <div className="flex items-center justify-between mb-8">
          <div className="animate-in fade-in slide-in-from-left-6 duration-700 fill-mode-both">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Pending Users</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">New registration requests awaiting administrative approval</p>
          </div>
          <div className="bg-blue-100 text-blue-900 px-4 py-1.5 rounded-full text-[10px] font-extrabold shadow-sm border border-blue-200 uppercase tracking-widest animate-pulse">
            {users.length} Awaiting Approval
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-separate border-spacing-y-3">
            <thead>
              <tr className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">
                <th className="px-4 pb-2 w-16">Profile</th>
                <th className="px-4 pb-2 text-center">Name</th>
                <th className="px-4 pb-2 text-center hidden md:table-cell">Email</th>
                <th className="px-4 pb-2 text-center">Role</th>
                <th className="px-4 pb-2 text-center hidden sm:table-cell">Request Date</th>
                <th className="px-4 pb-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium">
              {users.map((user, index) => (
                <tr 
                  key={user.id} 
                  style={{ animationDelay: `${index * 120}ms` }}
                  className="bg-white hover:bg-white rounded-2xl transition-all duration-300 group border border-[#c2c6d3]/60 hover:border-[#0f3d91]/30 shadow-[0_10px_30px_rgba(25,28,29,0.03)] hover:shadow-[0_200px_50px_rgba(25,28,29,0.06)] hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
                >
                  <td className="px-4 py-4 rounded-l-2xl">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 shadow-sm transition-all group-hover:bg-blue-50 group-hover:text-blue-900 group-hover:border-blue-100 mx-auto">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col items-center">
                      <span className="font-bold text-slate-900 block uppercase tracking-tight">{user.fullName}</span>
                      <span className="md:hidden text-[10px] text-slate-400 truncate block mt-0.5">{user.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-500 hidden md:table-cell text-center">{user.email}</td>
                  <td className="px-4 py-4 text-center">
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200/50 uppercase tracking-tighter">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-4 hidden sm:table-cell">
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs font-bold text-slate-600 tracking-tight">{formatDate(user.createdAt)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 rounded-r-2xl text-center">
                    <div className="flex items-center justify-center gap-2 sm:gap-3">
                      <button 
                        onClick={() => onApprove(user)}
                        className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-[linear-gradient(135deg,#003870_0%,#014f99_100%)] text-white text-[10px] font-extrabold uppercase tracking-widest hover:shadow-lg transition-all shadow-[0_4px_10px_-2px_rgba(0,56,112,0.3)] hover:-translate-y-0.5 active:translate-y-0"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => onReject(user)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default PendingUsersTable;
