import React from 'react';

const CalendarTable = ({ data, onAiEdit, getStatusColor, editingIndex }) => {
  return (
    <table className="w-full text-left text-sm border-collapse">
      <thead className="bg-slate-50/80 sticky top-0 z-10 shadow-sm">
        <tr>
          <th className="px-6 py-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider border-b border-r border-slate-100">Date</th>
          <th className="px-6 py-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider border-b border-r border-slate-100">Type</th>
          <th className="px-6 py-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider border-b border-r border-slate-100">Pillar</th>
          <th className="px-6 py-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider border-b border-r border-slate-100">Visual Copy</th>
          <th className="px-6 py-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider border-b border-r border-slate-100">Caption</th>
          <th className="px-6 py-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider border-b border-r border-slate-100">Status</th>
          <th className="px-6 py-4 font-bold text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-100 text-center">AI Edit</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {data.map((row, i) => (
          <tr 
            key={i} 
            className={`transition-all group align-top ${editingIndex === i ? 'bg-blue-50/80 ring-2 ring-inset ring-[#003870]/20 z-20 relative' : 'hover:bg-slate-50/80'}`}
          >
            <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-700 border-r border-slate-100">{row.date}</td>
            <td className="px-6 py-4 whitespace-nowrap border-r border-slate-100">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${editingIndex === i ? 'bg-white text-[#003870]' : 'bg-slate-100 text-slate-700'}`}>
                <span className="material-symbols-outlined text-[14px]">
                  {row.contentType === 'Video' || row.contentType === 'Reel' ? 'play_circle' : row.contentType === 'Carousel' ? 'view_carousel' : 'image'}
                </span>
                {row.contentType}
              </span>
            </td>
            <td className="px-6 py-4 font-bold text-[#003870] min-w-[150px] whitespace-pre-wrap leading-tight border-r border-slate-100">{row.pillar}</td>
            <td className="px-6 py-4 text-slate-800 font-semibold min-w-[250px] whitespace-pre-wrap leading-relaxed break-words border-r border-slate-100">{row.visualCopy}</td>
            <td className="px-6 py-4 text-slate-500 font-medium min-w-[350px] whitespace-pre-wrap leading-relaxed break-words border-r border-slate-100">{row.caption}</td>
            <td className="px-6 py-4 whitespace-nowrap border-r border-slate-100">
              <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-extrabold border uppercase tracking-widest ${getStatusColor(row.status)}`}>
                {row.status}
              </span>
            </td>
            <td className="px-6 py-4 text-center">
              <button 
                onClick={(e) => onAiEdit(i, e)}
                className={`p-2 rounded-xl transition-all shadow-sm group-hover:scale-110 ${editingIndex === i ? 'bg-[#003870] text-white' : 'bg-slate-50 text-[#003870] hover:bg-[#003870] hover:text-white'}`}
                title="Edit with AI"
              >
                <span className="material-symbols-outlined text-[20px] block">auto_fix_high</span>
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default CalendarTable;
