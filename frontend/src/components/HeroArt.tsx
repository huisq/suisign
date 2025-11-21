export default function HeroArt(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 520 220" width="520" height="220" {...props}>
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7c8cff" />
          <stop offset="100%" stopColor="#67e8f9" />
        </linearGradient>
      </defs>
      <g opacity=".85">
        <rect x="28" y="20" rx="16" ry="16" width="460" height="160"
              fill="url(#sg)" opacity=".15" />
        <rect x="46" y="40" rx="10" ry="10" width="220" height="16"
              fill="#fff" opacity=".18" />
        <rect x="46" y="66" rx="6" ry="6" width="300" height="10"
              fill="#fff" opacity=".12" />
        <rect x="46" y="86" rx="6" ry="6" width="260" height="10"
              fill="#fff" opacity=".12" />
        <rect x="46" y="120" rx="12" ry="12" width="160" height="36"
              fill="#fff" opacity=".22" />
        <rect x="216" y="120" rx="12" ry="12" width="160" height="36"
              fill="#fff" opacity=".14" />
        <circle cx="420" cy="62" r="11" fill="#22c55e" />
        <path d="M415 62 l4 4 l7 -8" stroke="white" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
