'use client';

import { useSettings } from '@/lib/settings-context';

const COLORS = ['#ff0000', '#00ff00', '#0066ff', '#ffff00', '#ff00ff', '#00ffff', '#ff6600', '#ff0066'];

export default function Garland() {
  const { christmasMode } = useSettings();

  if (!christmasMode) return null;

  const bulbs = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    color: COLORS[i % COLORS.length],
    delay: i * 0.1,
  }));

  return (
    <div className="fixed top-16 left-0 right-0 h-8 pointer-events-none z-40 overflow-hidden">
      {/* Wire */}
      <svg className="absolute w-full h-full" viewBox="0 0 1000 30" preserveAspectRatio="none">
        <path
          d="M0,5 Q50,25 100,5 Q150,25 200,5 Q250,25 300,5 Q350,25 400,5 Q450,25 500,5 Q550,25 600,5 Q650,25 700,5 Q750,25 800,5 Q850,25 900,5 Q950,25 1000,5"
          fill="none"
          stroke="#1a472a"
          strokeWidth="3"
        />
      </svg>
      
      {/* Bulbs */}
      <div className="flex justify-around items-start pt-1">
        {bulbs.map((bulb) => (
          <div
            key={bulb.id}
            className="relative animate-glow"
            style={{
              animationDelay: `${bulb.delay}s`,
            }}
          >
            <div
              className="w-3 h-4 rounded-full"
              style={{
                background: `radial-gradient(circle at 30% 30%, white, ${bulb.color})`,
                boxShadow: `0 0 10px ${bulb.color}, 0 0 20px ${bulb.color}`,
              }}
            />
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-green-800 rounded-sm" />
          </div>
        ))}
      </div>
    </div>
  );
}
