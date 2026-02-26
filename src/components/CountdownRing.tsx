'use client';

interface CountdownRingProps {
  remaining: number;
  period: number;
  size?: number;
}

export default function CountdownRing({ remaining, period, size = 40 }: CountdownRingProps) {
  const fraction = remaining / period;
  const radius = (size - 4) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - fraction);

  let color = 'var(--success)';
  if (remaining <= 5) color = 'var(--danger)';
  else if (remaining <= 10) color = 'var(--warning)';

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--border)"
        strokeWidth={3}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.3s linear, stroke 0.3s' }}
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill="var(--text)"
        fontSize={size * 0.3}
        fontWeight={600}
        style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}
      >
        {remaining}
      </text>
    </svg>
  );
}
