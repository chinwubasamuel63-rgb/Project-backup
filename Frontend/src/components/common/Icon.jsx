import { ICONS } from "./data/Icon";

export function Icon({ name, size = 18, style }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={style}
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  );
}
