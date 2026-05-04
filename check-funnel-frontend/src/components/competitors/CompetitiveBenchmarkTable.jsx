import React from 'react';

export default function CompetitiveBenchmarkTable({ data, activeTab }) {
  const platform = activeTab?.toLowerCase();
  const isAudienceBased = platform === 'instagram' || platform === 'facebook';

  return (
    <div className="bg-white rounded-3xl border border-[#c2c6d3]/30 p-6 shadow-sm overflow-hidden flex flex-col h-full">
      <h2 className="text-lg font-bold text-[#191c1d] mb-4">Competitive Benchmark</h2>
      
      <div className="overflow-x-auto w-full flex-1">
        <table className="w-full min-w-[500px] text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-bold text-[#727782] uppercase tracking-wider">
              <th className="pb-3 px-2 font-semibold">Brand</th>
              <th className="pb-3 px-2 font-semibold">Followers</th>
              <th className="pb-3 px-2 font-semibold">
                {isAudienceBased ? 'Avg Eng./Post' : 'Avg Views/Post'}
              </th>
              <th className="pb-3 px-2 font-semibold">
                {isAudienceBased ? 'Top Post Eng.' : 'Top Post Views'}
              </th>
              <th className="pb-3 px-2 font-semibold text-center">Posts/Week</th>
              <th className="pb-3 px-2 font-semibold text-center">Rank</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.map((row, index) => (
              <tr key={index} className={`transition-colors hover:bg-slate-50/50 ${row.isMain ? 'bg-blue-50/30' : ''}`}>
                <td className={`py-3 px-2 text-sm font-bold ${row.isMain ? 'text-[#0f3d91]' : 'text-[#191c1d]'}`}>
                  {row.brand}
                </td>
                <td className={`py-3 px-2 text-sm font-semibold ${row.isMain ? 'text-[#0f3d91]' : 'text-slate-600'}`}>
                  {row.followers}
                </td>
                <td className={`py-3 px-2 text-sm font-semibold ${row.isMain ? 'text-[#0f3d91]' : 'text-slate-600'}`}>
                  {row.avgValue}
                </td>
                <td className={`py-3 px-2 text-sm font-semibold ${row.isMain ? 'text-[#0f3d91]' : 'text-slate-600'}`}>
                  {row.topValue}
                </td>
                <td className={`py-3 px-2 text-sm font-semibold text-center ${row.isMain ? 'text-[#0f3d91]' : 'text-slate-600'}`}>
                  {row.postsPerWeek}
                </td>
                <td className={`py-3 px-2 text-sm font-bold text-center ${row.isMain ? 'text-[#0f3d91]' : 'text-blue-600'}`}>
                  {row.rank}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
