import { useEffect, useRef, useState } from 'react';

function DropdownChevron({ open }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 text-[#727782] transition-transform ${open ? 'rotate-180' : ''}`}
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function monthLabel(value) {
  const [year, month] = value.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

export function MonthPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => Number(value.split('-')[0]));
  const ref = useRef(null);
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  useEffect(() => { const close = (event) => ref.current && !ref.current.contains(event.target) && setOpen(false); document.addEventListener('mousedown', close); return () => document.removeEventListener('mousedown', close); }, []);
  const months = Array.from({ length: 12 }, (_, index) => ({ label: new Date(viewYear,index,1).toLocaleDateString('en-GB',{month:'short'}), value:`${viewYear}-${String(index+1).padStart(2,'0')}` }));
  return <div className="relative w-full sm:w-auto" ref={ref}><button type="button" onClick={()=>{setViewYear(Number(value.split('-')[0]));setOpen(v=>!v);}} className="inline-flex h-11 w-full items-center justify-between gap-2 rounded-full border border-[#c2c6d3]/20 bg-[#f3f4f5]/50 px-4 text-sm font-bold text-[#003870] transition hover:bg-[#f3f4f5] sm:w-48 sm:gap-3 sm:px-5 xl:w-40 2xl:w-48"><span className="truncate">{monthLabel(value)}</span><DropdownChevron open={open} /></button>{open&&<div className="absolute left-0 right-auto top-full z-50 mt-3 w-[calc(100vw-2rem)] max-w-72 rounded-3xl border border-[#c2c6d3]/30 bg-white p-4 shadow-2xl sm:left-auto sm:right-0"><div className="mb-4 flex items-center justify-between"><button onClick={()=>setViewYear(y=>y-1)} className="h-9 w-9 rounded-full hover:bg-[#f3f4f5]">‹</button><b className="text-lg">{viewYear}</b><button onClick={()=>setViewYear(y=>y+1)} className="h-9 w-9 rounded-full hover:bg-[#f3f4f5]">›</button></div><div className="grid grid-cols-3 gap-2">{months.map(month=><button key={month.value} onClick={()=>{onChange(month.value);setOpen(false);}} className={`h-11 min-w-0 rounded-2xl text-sm font-bold ${month.value===value?'bg-[#003870] text-white':month.value===currentMonth?'bg-[#003870]/10 text-[#003870]':'text-[#424751] hover:bg-[#f3f4f5]'}`}>{month.label}</button>)}</div></div>}</div>;
}

export function ClientDropdown({ clients, value, onChange, loading }) {
  const [open,setOpen]=useState(false); const ref=useRef(null);
  useEffect(()=>{const close=e=>ref.current&&!ref.current.contains(e.target)&&setOpen(false);document.addEventListener('mousedown',close);return()=>document.removeEventListener('mousedown',close);},[]);
  const options=[{value:'all',label:'All Clients'},...clients.map(client=>({value:String(client.id),label:client.name}))];
  const label=loading?'Loading clients...':options.find(option=>option.value===value)?.label||'All Clients';
  return <div className="relative w-full sm:w-64 xl:w-56 2xl:w-64" ref={ref}><button disabled={loading} onClick={()=>setOpen(v=>!v)} className="flex h-11 w-full min-w-0 items-center gap-2 rounded-full border border-[#c2c6d3]/20 bg-[#f3f4f5]/50 px-4 text-sm font-bold text-[#003870] hover:bg-[#f3f4f5] disabled:opacity-60 sm:gap-3 sm:px-5"><span className="min-w-0 flex-1 truncate text-left">{label}</span><DropdownChevron open={open} /></button>{open&&!loading&&<div className="absolute left-auto right-0 top-full z-50 mt-2 max-h-[min(18rem,55vh)] w-[calc(100vw-2rem)] max-w-64 overflow-x-hidden overflow-y-auto rounded-2xl border border-[#c2c6d3]/20 bg-white py-1 shadow-xl">{options.map(option=><button key={option.value} onClick={()=>{onChange(option.value);setOpen(false);}} className={`flex w-full min-w-0 overflow-hidden px-4 py-3 text-left text-sm font-bold hover:bg-[#f3f4f5] ${value===option.value?'bg-[#003870]/5 text-[#003870]':'text-[#727782]'}`}><span className="min-w-0 flex-1 truncate" title={option.label}>{option.label}</span></button>)}</div>}</div>;
}
