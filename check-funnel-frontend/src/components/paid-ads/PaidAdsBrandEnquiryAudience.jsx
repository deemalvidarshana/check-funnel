import { formatPaidAdsMoney, formatPaidAdsNumber } from '../../utils/paidAdsFormatters';

const colors=['#f59e0b','#10b981','#2563eb','#8b5cf6','#06b6d4','#64748b'];

function merge(rows,labelForKey) {
  const grouped=new Map();
  rows.forEach(row=>{const key=labelForKey(row.key);const current=grouped.get(key)||{key,leads:0,messages:0,reach:0,spend:0};current.leads+=Number(row.leads||0);current.messages+=Number(row.messagingConversations||0);current.reach+=Number(row.reach||0);current.spend+=Number(row.spend||0);grouped.set(key,current);});
  return [...grouped.values()].sort((a,b)=>b.leads-a.leads||b.messages-a.messages||b.reach-a.reach).slice(0,6);
}

function Card({title,rows,currency}) {
  const max=Math.max(1,...rows.map(row=>Math.max(row.leads,row.messages)));
  return <article className="rounded-2xl border border-[#c2c6d3]/25 p-4"><h3 className="text-sm font-extrabold text-[#273548]">{title}</h3><p className="mt-0.5 text-[10px] font-semibold text-[#8a9099]">Leads and messages reported separately</p><div className="mt-5 space-y-4">{rows.map((row,index)=><div key={row.key}><div className="flex items-center justify-between gap-3 text-[10px]"><span className="min-w-0 truncate font-bold text-[#59606b]" title={row.key}>{row.key}</span><span className="shrink-0 font-extrabold text-[#273548]">L {formatPaidAdsNumber(row.leads)} · M {formatPaidAdsNumber(row.messages)}</span></div><div className="mt-1.5 flex h-2 overflow-hidden rounded-full bg-[#edf0f4]"><div className="h-full" style={{width:`${(row.leads/max)*50}%`,backgroundColor:colors[index%colors.length]}}/><div className="h-full opacity-55" style={{width:`${(row.messages/max)*50}%`,backgroundColor:colors[index%colors.length]}}/></div><div className="mt-1 flex justify-between text-[9px] font-semibold text-[#9aa0a9]"><span>Reach {formatPaidAdsNumber(row.reach)}</span><span>{formatPaidAdsMoney(row.spend,currency)} spend</span></div></div>)}{!rows.length&&<p className="py-8 text-center text-xs font-semibold text-[#8a9099]">No audience data.</p>}</div></article>;
}

export default function PaidAdsBrandEnquiryAudience({audience={},currency}) {
  let regions;try{regions=new Intl.DisplayNames(['en'],{type:'region'});}catch{regions=null;}
  const age=merge(audience.age||[],key=>['55-64','65+'].includes(key)?'55+':key);
  const gender=merge(audience.gender||[],key=>key==='female'?'Female':key==='male'?'Male':'Other');
  const countries=merge(audience.countries||[],key=>key==='unknown'?'Unknown':regions?.of(String(key).toUpperCase())||key);
  const devices=merge(audience.devices||[],key=>key.includes('tablet')||key==='ipad'?'Tablet':key.includes('smartphone')||['iphone','ipod'].includes(key)?'Mobile':key==='desktop'?'Desktop':'Other');
  return <section className="mt-6 rounded-3xl border border-[#c2c6d3]/30 bg-white p-5 shadow-sm sm:p-6"><div><h2 className="text-lg font-extrabold text-[#191c1d]">Enquiry audience quality</h2><p className="mt-1 text-xs font-semibold text-[#727782]">Find the audiences producing leads and messaging conversations—not generic conversions.</p></div><div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Card title="Age group" rows={age} currency={currency}/><Card title="Gender" rows={gender} currency={currency}/><Card title="Top locations" rows={countries} currency={currency}/><Card title="Device" rows={devices} currency={currency}/></div></section>;
}
