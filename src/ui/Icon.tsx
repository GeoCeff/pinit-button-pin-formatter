const paths = {
  studio: 'M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1ZM3 8h18M8 8v13',
  sliders: 'M4 7h6m4 0h6M4 17h10m4 0h2M10 4v6m4 4v6',
  plus: 'M12 5v14M5 12h14',
  upload: 'M12 16V4m-4 4 4-4 4 4M5 15v4a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-4',
  folder: 'M3 7V5a1 1 0 0 1 1-1h5l2 3h9a1 1 0 0 1 1 1v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z',
  save: 'M5 3h12l4 4v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a2 2 0 0 1 2-2Zm2 0v6h10V3M7 21v-8h10v8',
  download: 'M12 3v12m-4-4 4 4 4-4M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4',
  image: 'M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm-1 13 5-5 5 5 3-3 5 5M16 7h.01',
  trash: 'M3 6h18M9 6V3h6v3M5 6l1 14a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1l1-14M10 10v7m4-7v7',
  left: 'm14 6-6 6 6 6',
  right: 'm10 6 6 6-6 6',
  check: 'm5 12 4 4L19 6',
  close: 'm6 6 12 12M6 18 18 6',
  link: 'm9 15 6-6M7 14l-2 2a3 3 0 0 0 4 4l4-4a3 3 0 0 0 0-4M17 10l2-2a3 3 0 0 0-4-4l-4 4a3 3 0 0 0 0 4',
  shield: 'm12 3 8 3v5c0 5-5 9-8 10-3-1-8-5-8-10V6l8-3Zm-4 9 3 3 5-6',
  stack: 'm12 3 10 5-10 5L2 8l10-5ZM2 12l10 5 10-5M2 16l10 5 10-5',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm10-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
  dropper: 'm14 4 6 6M6 15l9-9 3 3-9 9H6v-3Zm9-9 3-3a2.1 2.1 0 0 1 3 3l-3 3M6 18l-3 3',
  center: 'M12 2v4m0 12v4M2 12h4m12 0h4M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z',
  help: 'M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2-3 4m.1 3h.01M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z',
} as const

export function Icon({ name, size = 18, className }: {
  name: keyof typeof paths
  size?: number
  className?: string
}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className={className}><path d={paths[name]} /></svg>
}
