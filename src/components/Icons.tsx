type IconName = 'arrow' | 'bag' | 'search' | 'menu' | 'close' | 'snow' | 'bowl' | 'stack' | 'up' | 'check'

const paths: Record<IconName, React.ReactNode> = {
  arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
  bag: <><path d="m5 8-1 12h16L19 8H5Z" /><path d="M9 9V7a3 3 0 0 1 6 0v2" /></>,
  search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.8 4.8" /></>,
  menu: <path d="M3 7h18M3 12h18M3 17h18" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  snow: <><path d="M12 2v20M3.4 7l17.2 10M3.4 17 20.6 7M8.9 4.2 12 7l3.1-2.8M8.9 19.8 12 17l3.1 2.8M3.8 10.8l3.6-1.5L7 5.5m10 13-.4-3.8 3.6-1.5M7 18.5l.4-3.8-3.6-1.5M20.2 10.8l-3.6-1.5.4-3.8" /></>,
  bowl: <><path d="M2 12h20c-.8 5-4 7.5-10 7.5S2.8 17 2 12Zm6 9h8M6 7c-1-2 2-2.5 1-5m5 5c-1-2 2-2.5 1-5m5 5c-1-2 2-2.5 1-5" /></>,
  stack: <><path d="m2.5 8 9.5-5 9.5 5-9.5 5-9.5-5Zm0 4 9.5 5 9.5-5m-19 4 9.5 5 9.5-5" /></>,
  up: <path d="M6 18 18 6M7 6h11v11" />,
  check: <path d="m4 12 5 5L20 6" />
}
export function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}
export function Mark() {
  return <svg className="brand-mark" width="42" height="39" viewBox="0 0 48 42" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 22h42M6 22c1 8 7 13 18 13s17-5 18-13M9 17c1.8-6.8 7.5-10.6 15-10.6S37.2 10.2 39 17M6 17.5h36M24 6.4V3m-3.5 0h7M18 38h12" /></svg>
}
