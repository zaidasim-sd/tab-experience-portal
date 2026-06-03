type Props = {
  /** color of the wave shape (the color filling the top) */
  top: string;
  /** color of the area beneath (used as svg bg) */
  bottom: string;
  /** vary the curve for organic-feel uniqueness */
  variant?: 1 | 2 | 3 | 4;
  height?: number;
};

const paths: Record<number, string> = {
  1: "M0,40 C180,90 360,0 540,30 C720,60 900,110 1080,80 C1260,50 1380,20 1440,40 L1440,0 L0,0 Z",
  2: "M0,30 C200,80 380,10 600,50 C820,90 1000,30 1200,60 C1320,80 1400,70 1440,55 L1440,0 L0,0 Z",
  3: "M0,55 C160,15 340,85 520,60 C700,35 880,95 1080,65 C1280,35 1380,75 1440,45 L1440,0 L0,0 Z",
  4: "M0,45 C220,5 420,95 640,55 C860,15 1020,75 1240,50 C1340,38 1400,55 1440,60 L1440,0 L0,0 Z",
};

export function WaveDivider({ top, bottom, variant = 1, height = 100 }: Props) {
  return (
    <div style={{ background: bottom, lineHeight: 0 }}>
      <svg
        viewBox="0 0 1440 100"
        width="100%"
        height={height}
        preserveAspectRatio="none"
        style={{ display: "block" }}
        aria-hidden
      >
        <path d={paths[variant]} fill={top} />
      </svg>
    </div>
  );
}
