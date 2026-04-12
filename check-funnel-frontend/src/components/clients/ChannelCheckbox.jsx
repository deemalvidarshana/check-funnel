export default function ChannelCheckbox({
  label,
  checked,
  onChange,
}) {
  return (
    <label className="flex cursor-pointer select-none items-center gap-2 rounded-full border border-[#c2c6d3]/40 px-5 py-2 transition-colors hover:bg-[#f3f4f5]">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-[#c2c6d3] text-[#003870] focus:ring-[#003870]"
      />
      <span className="text-sm font-semibold text-[#191c1d]">{label}</span>
    </label>
  );
}