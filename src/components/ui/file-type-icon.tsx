import * as React from 'react';

import { getFileExtension } from '@/lib/file-format';

const EXT_COLOR: Record<string, string> = {
  pdf: '#DC2626',
  doc: '#0062FF',
  docx: '#0062FF',
  jpg: '#0062FF',
  jpeg: '#0062FF',
  png: '#9D00FF',
  rar: '#9D00FF',
  ppt: '#FF9D00',
  pptx: '#FF9D00',
  svg: '#FF9D00',
  webp: '#DC2626',
  csv: '#059669',
  xls: '#059669',
  xlsx: '#059669',
  zip: '#FACC15',
};

const DEFAULT_COLOR = '#64748B';
const MAX_LABEL = 4;

export interface FileTypeIconProps {
  name?: string | null;
  className?: string;
  size?: number;
}

export function FileTypeIcon({ name, className, size = 40 }: FileTypeIconProps) {
  const ext = getFileExtension(name);
  const color = EXT_COLOR[ext] ?? DEFAULT_COLOR;
  const label = (ext || 'file').slice(0, MAX_LABEL).toUpperCase();
  const fontSize = label.length >= 4 ? 8 : 9;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M21.6667 1.66675H8.75C7.75544 1.66675 6.80161 2.05306 6.09835 2.74069C5.39509 3.42832 5 4.36095 5 5.33341V34.6668C5 35.6392 5.39509 36.5718 6.09835 37.2595C6.80161 37.9471 7.75544 38.3334 8.75 38.3334H31.25C32.2446 38.3334 33.1984 37.9471 33.9016 37.2595C34.6049 36.5718 35 35.6392 35 34.6668V15.0001L21.6667 1.66675Z"
        fill={color}
      />
      <path
        d="M21.666 1.66675V13.0001C21.666 14.1047 22.5614 15.0001 23.666 15.0001H34.9993"
        fill="#FCFCFC"
        fillOpacity="0.7"
      />
      <text
        x="20"
        y="32"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize={fontSize}
        fontWeight="700"
        letterSpacing="0.2"
        fill="#FCFCFC"
      >
        {label}
      </text>
    </svg>
  );
}
