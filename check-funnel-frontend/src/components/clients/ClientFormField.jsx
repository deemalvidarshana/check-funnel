export default function ClientFormField({
  label,
  type = "text",
  placeholder = "",
  value,
  onChange,
  textarea = false,
  rows = 3,
}) {
  return (
    <div>
      <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-wider text-[#727782]">
        {label}
      </label>

      {textarea ? (
        <textarea
          rows={rows}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full resize-none rounded-2xl border-none bg-[#f8f9fa] px-4 py-3 font-body outline-none ring-1 ring-[#c2c6d3]/40 transition-all placeholder:text-[#727782]/50 focus:ring-2 focus:ring-[#a8c8ff]"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full rounded-2xl border-none bg-[#f8f9fa] px-4 py-3 font-body outline-none ring-1 ring-[#c2c6d3]/40 transition-all placeholder:text-[#727782]/50 focus:ring-2 focus:ring-[#a8c8ff]"
        />
      )}
    </div>
  );
}