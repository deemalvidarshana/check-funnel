import { PlusIcon } from "./ClientIcons";

export default function ClientEmptyCard({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-full min-h-[430px] w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[#c2c6d3] bg-[#f3f4f5]/50 p-6 text-center shadow-[0_20px_50px_rgba(25,28,29,0.04)] transition hover:-translate-y-1 hover:border-[#003870]/40 hover:bg-[#f3f4f5] cursor-pointer"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#ffffff] shadow-sm">
        <span className="text-[#003870]">
          <PlusIcon />
        </span>
      </div>

      <h3 className="mt-6 text-2xl font-bold text-[#191c1d]">
        Initialize Partner
      </h3>

      <p className="mt-3 max-w-[240px] text-sm leading-7 text-[#424751]">
        Start a new high-performance marketing journey for a Check Funnel
        partner.
      </p>

      <div className="mt-8 flex h-11 w-11 items-center justify-center rounded-full border border-[#c2c6d3] text-[#727782]">
        <PlusIcon />
      </div>
    </button>
  );
}