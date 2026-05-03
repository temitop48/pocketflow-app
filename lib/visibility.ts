export type VisibilityMode = 0 | 1 | 2;

export const visibilityLabels: Record<VisibilityMode, string> = {
  0: "Private",
  1: "Public",
  2: "Shared",
};

export function getVisibilityLabel(value: number | null | undefined) {
  if (value === 0 || value === 1 || value === 2) {
    return visibilityLabels[value];
  }

  return "Unknown";
}