import React from 'react';

/**
 * TowerIcon — SVG skyscraper silhouette colored per tier.
 * Uses a horizontal-stripe pattern clipped to the building shape.
 * @param {string}  color  — hex or CSS color for the tier
 * @param {number}  size   — width in px; height is automatically 3× size
 * @param {string}  id     — unique id suffix (use tier id to avoid SVG collisions)
 */
const TowerIcon = ({ color = '#9ca3af', size = 48, id = 'default', hasStar = false }) => {
  const clipId = `clip-tw-${id}`;
  const patternId = `pat-tw-${id}`;
  const glowId = `glow-tw-${id}`;
  const starId = `star-tw-${id}`;

  // Center is now 60 for a 120 viewBox
  const bodyPath = `
    M 60 15
    L 64 21 L 70 36 L 74 52 L 76 70 L 77 90
    L 78 110 L 79 126 L 80 131
    L 82 133 L 82 147 L 83 148 L 86 150 L 86 157
    L 88 159 L 90 160 L 90 180
    L 30 180 L 30 160 L 32 159 L 34 157
    L 34 150 L 37 148 L 38 147 L 38 133
    L 40 131 L 41 126 L 42 110 L 43 90
    L 44 70 L 46 52 L 50 36 L 56 21 L 60 15
    Z
  `;

  // 5-pointed star centered at 60, 95
  const starPath = `
    M 60 30
    L 68 55 L 95 55 L 73 72 L 82 100 L 60 82 L 38 100 L 47 72 L 25 55 L 52 55
    Z
  `;

  return (
    <svg
      width={size}
      height={size * 1.5}
      viewBox="-60 -40 240 280"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', flexShrink: 0, overflow: 'visible' }}
    >
      <defs>
        {/* Drop-glow filter */}
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Horizontal stripe pattern */}
        <pattern
          id={patternId}
          x="0" y="0"
          width="120" height="8"
          patternUnits="userSpaceOnUse"
        >
          <rect width="120" height="5" fill={color} opacity="1" />
          <rect y="5" width="120" height="3" fill={color} opacity="0.4" />
        </pattern>

        {/* Building clip */}
        <clipPath id={clipId}>
          <path d={bodyPath} />
        </clipPath>
      </defs>

      {/* Background Star - Double size and Solid */}
      {hasStar && (
        <path
          d={`
            M 60 -25
            L 85 60 L 180 60 L 110 110 L 140 200 L 60 145 L -20 200 L 10 110 L -60 60 L 35 60
            Z
          `}
          fill={color}
          opacity="0.75"
        />
      )}

      {/* Spire / antenna */}
      <line
        x1="60" y1="1" x2="60" y2="16"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        filter={`url(#${glowId})`}
      />

      {/* Building body */}
      <rect
        x="0" y="15"
        width="120" height="165"
        fill={`url(#${patternId})`}
        clipPath={`url(#${clipId})`}
      />

      {/* Outer edge highlight */}
      <path
        d={bodyPath}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        opacity="0.8"
        filter={`url(#${glowId})`}
      />
    </svg>
  );
};

export default TowerIcon;
