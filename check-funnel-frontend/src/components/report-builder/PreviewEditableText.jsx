export default function PreviewEditableText({
  value,
  onCommit,
  className = "",
  multiline = false,
}) {
  const commit = (event) => {
    const nextValue = event.currentTarget.textContent?.trim() || "";
    onCommit(nextValue || value);
  };

  return (
    <span
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      title="Click to edit this report text"
      onBlur={commit}
      onKeyDown={(event) => {
        if (!multiline && event.key === "Enter") {
          event.preventDefault();
          event.currentTarget.blur();
        }
        if (event.key === "Escape") {
          event.preventDefault();
          event.currentTarget.textContent = value;
          event.currentTarget.blur();
        }
      }}
      className={`cursor-text rounded-sm outline-none transition hover:bg-blue-50/80 focus:bg-white focus:ring-2 focus:ring-blue-400/70 ${className}`}
    >
      {value}
    </span>
  );
}
