/** Same mark as the public BrandLogo, with stable gradient ids for React. */
export function DeskMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 260 260"
      width={size}
      height={size}
      fill="none"
      className="shrink-0 select-none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="desk-mark-main" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0a58ca" />
          <stop offset="55%" stopColor="#053888" />
          <stop offset="100%" stopColor="#032054" />
        </linearGradient>
        <linearGradient id="desk-mark-swoosh" x1="0%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#38b6ff" />
          <stop offset="50%" stopColor="#0077ff" />
          <stop offset="100%" stopColor="#053888" />
        </linearGradient>
      </defs>
      <g transform="translate(130, 145)">
        <polygon points="0,-125 -95,-82 0,-42 95,-82" fill="url(#desk-mark-main)" />
        <path d="M -52,-60 L 0,-38 L 52,-60 L 42,-42 C 20,-52 -20,-52 -42,-42 Z" fill="#042a6b" />
        <path d="M -62,-48 C -98,-10 -92,58 -45,88 C -75,52 -78,-8 -44,-40 Z" fill="url(#desk-mark-swoosh)" />
        <path d="M 55,-32 C 38,-50 12,-58 -14,-53 C -54,-46 -80,-8 -73,32 C -66,72 -28,99 12,92 C 52,85 82,52 84,8 L 84,-4 L 8,-4 L 8,24 L 50,24 C 44,47 23,63 -2,61 C -29,59 -48,36 -46,8 C -44,-20 -20,-38 8,-34 C 22,-32 34,-25 42,-15 L 63,-35 Z" fill="url(#desk-mark-main)" />
        <path d="M -18,-52 C -55,-42 -76,-4 -66,35 C -58,64 -34,84 -5,90 C -38,76 -54,44 -50,8 C -46,-24 -22,-44 6,-47 Z" fill="url(#desk-mark-swoosh)" opacity="0.85" />
      </g>
    </svg>
  );
}
