import React from 'react';

interface WaveDividerProps {
  topColor: string;     // color of section ABOVE
  bottomColor: string;  // color of section BELOW
  direction?: 'up' | 'down';  // wave peak direction
  height?: number;      // default 80
}

export const WaveDivider = ({
  topColor,
  bottomColor,
  direction = 'down',
  height = 80
}: WaveDividerProps) => {
  return (
    <div style={{ marginTop: -2, marginBottom: -2, lineHeight: 0, position: 'relative', zIndex: 5 }}>
      <svg
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        style={{ width: '100%', height, display: 'block' }}
      >
        <path
          d={
            direction === 'down'
              ? 'M0,0 C360,80 1080,0 1440,60 L1440,80 L0,80 Z'
              : 'M0,80 C360,0 1080,80 1440,20 L1440,0 L0,0 Z'
          }
          fill={bottomColor}
        />
        <rect width="1440" height="2" fill={topColor} /> {/* seam cover */}
      </svg>
    </div>
  );
};
