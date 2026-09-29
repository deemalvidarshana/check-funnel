import PreviewEditableText from "./PreviewEditableText";

function parseChartValue(input, fallback = 0) {
  const normalized = String(input || "")
    .trim()
    .toUpperCase()
    .replaceAll(",", "");
  const match = normalized.match(/-?\d+(?:\.\d+)?/);
  if (!match) return Number(fallback || 0);
  const number = Number(match[0]);
  if (!Number.isFinite(number)) return Number(fallback || 0);
  const suffix = normalized.slice((match.index || 0) + match[0].length).trim();
  const multiplier = suffix.startsWith("B")
    ? 1_000_000_000
    : suffix.startsWith("M")
      ? 1_000_000
      : suffix.startsWith("K")
        ? 1_000
        : 1;
  return number * multiplier;
}

export default function EditableChartValue({
  value,
  format,
  onChange,
  className = "",
}) {
  return (
    <PreviewEditableText
      value={format(value)}
      onCommit={(input) => onChange(parseChartValue(input, value))}
      className={className}
    />
  );
}
