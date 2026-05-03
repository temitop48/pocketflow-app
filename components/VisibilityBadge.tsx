import { getVisibilityLabel } from "@/lib/visibility";

export default function VisibilityBadge({
  value,
}: {
  value: number | null | undefined;
}) {
  const label = getVisibilityLabel(value);

  const className =
    value === 0
      ? "bg-gray-100 text-gray-800"
      : value === 1
      ? "bg-green-100 text-green-700"
      : value === 2
      ? "bg-blue-100 text-blue-700"
      : "bg-red-100 text-red-700";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${className}`}>
      {label}
    </span>
  );
}