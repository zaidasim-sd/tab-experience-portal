type Props = { size?: number; color?: string; className?: string };

export function TabLogo({ size = 44, color = "var(--crimson)", className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="tab. logo"
    >
      <circle cx="50" cy="50" r="48" stroke={color} strokeWidth="2" fill="none" />
      <text
        x="50"
        y="62"
        textAnchor="middle"
        fontFamily="Playfair Display, serif"
        fontStyle="italic"
        fontWeight="600"
        fontSize="38"
        fill={color}
      >
        tab.
      </text>
    </svg>
  );
}
