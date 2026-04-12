const UserDirectoryTable = ({ users = [], onDelete, onEdit }) => {
  return (
    <section className="w-full">
      <div className="bg-white rounded-2xl p-6 lg:p-8 flex flex-col shadow-sm border border-slate-100 transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div className="animate-in fade-in slide-in-from-left-6 duration-700 fill-mode-both">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Registered Users</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Manage existing platform accounts and permissions</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-slate-50 rounded-full px-4 py-2 border border-slate-200/50 flex items-center gap-2 cursor-pointer hover:bg-slate-100 transition-colors">
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="text-xs font-bold text-slate-600">All Roles</span>
              <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
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
                <th className="px-4 pb-2 text-center">Status</th>
                <th className="px-4 pb-2 text-center hidden lg:table-cell">Processed By</th>
                <th className="px-4 pb-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium">
              {users.map((user, index) => (
                <tr 
                  key={user.id} 
                  style={{ animationDelay: `${index * 100}ms` }}
                  className="bg-white hover:bg-white rounded-2xl transition-all duration-300 group border border-[#c2c6d3]/60 hover:border-[#0f3d91]/30 shadow-[0_10px_30px_rgba(25,28,29,0.03)] hover:shadow-[0_20px_50px_rgba(25,28,29,0.06)] hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
                >
                  <td className="px-4 py-4 rounded-l-2xl">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-100 mx-auto">
                      <img 
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || 'User')}&background=0f3d91&color=fff`} 
                        alt={user.fullName} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col items-center">
                      <span className="font-bold text-slate-900 group-hover:text-blue-900 transition-colors uppercase tracking-tight">{user.fullName}</span>
                      <span className="block md:hidden text-[10px] text-slate-400 mt-0.5 truncate max-w-[120px]">{user.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-500 hidden md:table-cell text-center">{user.email}</td>
                  <td className="px-4 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${
                      user.role === 'admin' 
                        ? 'bg-blue-900 text-white' 
                        : 'bg-blue-50 text-blue-900 border border-blue-100'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${user.status === 'approved' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                      <span className={`text-[10px] font-bold tracking-tight uppercase ${user.status === 'approved' ? 'text-emerald-700' : 'text-red-700'}`}>
                        {user.status === 'approved' ? 'Approved' : 'Rejected'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center hidden lg:table-cell">
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Processed by</span>
                      <span className="text-[11px] font-bold text-slate-700 truncate max-w-[140px]">{user.processedByEmail || 'System'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 rounded-r-2xl text-center">
                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                      <button 
                        onClick={() => onEdit(user)}
                        className="p-2 text-slate-400 hover:text-blue-900 hover:bg-blue-50 rounded-xl transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => onDelete(user.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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

export default UserDirectoryTable;
