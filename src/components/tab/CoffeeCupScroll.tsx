export function CoffeeCupScroll() {
  return (
    <svg width="28" height="32" viewBox="0 0 28 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <clipPath id="cup-clip">
          <path d="M5 8 L23 8 L21 26 Q21 28 19 28 L9 28 Q7 28 7 26 Z" />
        </clipPath>
      </defs>
      {/* cup outline */}
      <path
        d="M5 8 L23 8 L21 26 Q21 28 19 28 L9 28 Q7 28 7 26 Z"
        stroke="var(--crimson)"
        strokeWidth="1.4"
        strokeLinejoin="round"
        fill="none"
      />
      {/* handle */}
      <path
        d="M23 12 Q27 12 27 16 Q27 20 23 20"
        stroke="var(--crimson)"
        strokeWidth="1.4"
        fill="none"
      />
      {/* liquid fill */}
      <g clipPath="url(#cup-clip)">
        <rect x="5" y="8" width="18" height="20" fill="var(--crimson)" opacity="0.85">
          <animate
            attributeName="y"
            values="28;10;10;28;28"
            keyTimes="0;0.45;0.55;0.95;1"
            dur="3.2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="height"
            values="0;18;18;0;0"
            keyTimes="0;0.45;0.55;0.95;1"
            dur="3.2s"
            repeatCount="indefinite"
          />
        </rect>
      </g>
      {/* steam */}
      <path d="M11 4 Q12 2 11 0" stroke="var(--crimson)" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      <path d="M16 4 Q17 2 16 0" stroke="var(--crimson)" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}
