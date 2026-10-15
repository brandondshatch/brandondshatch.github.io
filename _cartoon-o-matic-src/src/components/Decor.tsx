// Original decorative illustrations, drawn in SVG. No borrowed artwork.

export function Anvil({ size = 48, className = '' }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size * 0.7} viewBox="0 0 100 70" aria-hidden="true">
      <path
        d="M8 10 H70 C82 10 92 14 96 22 C88 22 80 24 74 28 L70 34 H58 L62 46 H74 L78 60 H22 L26 46 H38 L42 34 H30 C18 34 10 24 8 10 Z"
        fill="#2a2522"
        stroke="#120d0a"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M14 14 H66" stroke="#6d655e" strokeWidth="3" strokeLinecap="round" />
      <text x="50" y="27" textAnchor="middle" fontFamily="Limelight, serif" fontSize="11" fill="#c9a24a">
        ACME
      </text>
    </svg>
  );
}

export function Crate({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <rect x="6" y="10" width="88" height="82" rx="3" fill="#c98a4b" stroke="#1b1410" strokeWidth="4" />
      <path d="M6 30 H94 M6 72 H94" stroke="#1b1410" strokeWidth="4" />
      <path d="M10 34 L90 68 M90 34 L10 68" stroke="#8c5a2b" strokeWidth="5" />
      <rect x="22" y="40" width="56" height="22" fill="#f3e6c8" stroke="#1b1410" strokeWidth="3" />
      <text x="50" y="57" textAnchor="middle" fontFamily="Limelight, serif" fontSize="17" fill="#b3202a">
        ACME
      </text>
      <text x="50" y="23" textAnchor="middle" fontFamily="'Courier Prime', monospace" fontSize="9" fill="#1b1410">
        THIS SIDE UP
      </text>
      <text x="50" y="86" textAnchor="middle" fontFamily="'Courier Prime', monospace" fontSize="8" fill="#1b1410">
        FRAGILE · EXPLOSIVE
      </text>
    </svg>
  );
}

export function Bolt({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.4} viewBox="0 0 20 28" aria-hidden="true">
      <path d="M12 0 L2 16 H9 L6 28 L18 10 H11 Z" fill="#f2c14e" stroke="#1b1410" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function Gear({ size = 60, teeth = 10, className = '' }: { size?: number; teeth?: number; className?: string }) {
  const pts: string[] = [];
  const R = 46;
  const r = 37;
  for (let i = 0; i < teeth * 2; i++) {
    const a0 = (i / (teeth * 2)) * Math.PI * 2;
    const a1 = ((i + 1) / (teeth * 2)) * Math.PI * 2;
    const rad = i % 2 === 0 ? R : r;
    pts.push(`${50 + rad * Math.cos(a0)},${50 + rad * Math.sin(a0)}`);
    pts.push(`${50 + rad * Math.cos(a1)},${50 + rad * Math.sin(a1)}`);
  }
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <polygon points={pts.join(' ')} fill="#c9a24a" stroke="#1b1410" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="50" cy="50" r="14" fill="#f3e6c8" stroke="#1b1410" strokeWidth="3" />
      <circle cx="50" cy="50" r="5" fill="#1b1410" />
    </svg>
  );
}

/** Concentric iris rings in the spirit of a 1940s cartoon title card. */
export function Rings() {
  const rings = ['#b3202a', '#f3e6c8', '#1f4e9e', '#f3e6c8', '#b3202a', '#f3e6c8', '#c9a24a'];
  return (
    <svg className="rings" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {rings.map((c, i) => (
        <circle key={i} cx="500" cy="500" r={500 - i * 46} fill={c} />
      ))}
    </svg>
  );
}

export function Sunburst() {
  const rays = 28;
  return (
    <svg className="sunburst" viewBox="-500 -500 1000 1000" aria-hidden="true">
      {Array.from({ length: rays }, (_, i) => {
        const a0 = (i / rays) * Math.PI * 2;
        const a1 = ((i + 0.5) / rays) * Math.PI * 2;
        return (
          <path
            key={i}
            d={`M0 0 L${Math.cos(a0) * 700} ${Math.sin(a0) * 700} L${Math.cos(a1) * 700} ${Math.sin(a1) * 700} Z`}
            fill="rgba(201,162,74,0.16)"
          />
        );
      })}
    </svg>
  );
}

export function Bulbs({ count = 22 }: { count?: number }) {
  return (
    <div className="bulbs" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="bulb" style={{ animationDelay: `${(i % 3) * 0.33}s` }} />
      ))}
    </div>
  );
}
