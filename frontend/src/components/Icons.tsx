interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

const base = (size: number, sw: number, children: React.ReactNode, extra?: string) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    className={extra}>
    {children}
  </svg>
);

export function HomeIcon({ size = 20, strokeWidth = 1.9, className }: IconProps) {
  return base(size, strokeWidth, <><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></>, className);
}
export function HomeFilledIcon({ size = 20, className }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"/><rect x="9" y="12" width="6" height="9" fill="white" rx="1"/></svg>;
}

export function ListIcon({ size = 20, strokeWidth = 1.9, className }: IconProps) {
  return base(size, strokeWidth, <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3.5" cy="6" r="1.2" fill="currentColor" stroke="none"/><circle cx="3.5" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="3.5" cy="18" r="1.2" fill="currentColor" stroke="none"/></>, className);
}
export function ListFilledIcon({ size = 20, className }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}><rect x="7" y="5" width="14" height="2" rx="1"/><rect x="7" y="11" width="14" height="2" rx="1"/><rect x="7" y="17" width="14" height="2" rx="1"/><circle cx="3.5" cy="6" r="1.5"/><circle cx="3.5" cy="12" r="1.5"/><circle cx="3.5" cy="18" r="1.5"/></svg>;
}

export function TargetIcon({ size = 20, strokeWidth = 1.9, className }: IconProps) {
  return base(size, strokeWidth, <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/></>, className);
}
export function TargetFilledIcon({ size = 20, className }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="5" fill="white"/><circle cx="12" cy="12" r="2"/></svg>;
}

export function BarChartIcon({ size = 20, strokeWidth = 1.9, className }: IconProps) {
  return base(size, strokeWidth, <><rect x="18" y="3" width="3" height="18" rx="1.5"/><rect x="12" y="8" width="3" height="13" rx="1.5"/><rect x="6" y="13" width="3" height="8" rx="1.5"/></>, className);
}
export function BarChartFilledIcon({ size = 20, className }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}><rect x="18" y="3" width="3" height="18" rx="1.5"/><rect x="12" y="8" width="3" height="13" rx="1.5"/><rect x="6" y="13" width="3" height="8" rx="1.5"/></svg>;
}

export function GearIcon({ size = 20, strokeWidth = 1.9, className }: IconProps) {
  return base(size, strokeWidth, <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>, className);
}
export function GearFilledIcon({ size = 20, className }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/><circle cx="12" cy="12" r="3" fill="white"/></svg>;
}

export function CheckIcon({ size = 16, strokeWidth = 2.2, className }: IconProps) {
  return base(size, strokeWidth, <polyline points="20 6 9 17 4 12"/>, className);
}
export function PlusIcon({ size = 18, strokeWidth = 2, className }: IconProps) {
  return base(size, strokeWidth, <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>, className);
}
export function ArrowLeftIcon({ size = 18, strokeWidth = 2, className }: IconProps) {
  return base(size, strokeWidth, <><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>, className);
}
export function ChevronRightIcon({ size = 16, strokeWidth = 2, className }: IconProps) {
  return base(size, strokeWidth, <polyline points="9 18 15 12 9 6"/>, className);
}
export function ChevronDownIcon({ size = 16, strokeWidth = 2, className }: IconProps) {
  return base(size, strokeWidth, <polyline points="6 9 12 15 18 9"/>, className);
}
export function EyeIcon({ size = 18, strokeWidth = 1.9, className }: IconProps) {
  return base(size, strokeWidth, <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>, className);
}
export function EyeOffIcon({ size = 18, strokeWidth = 1.9, className }: IconProps) {
  return base(size, strokeWidth, <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>, className);
}
export function MoonIcon({ size = 18, strokeWidth = 1.9, className }: IconProps) {
  return base(size, strokeWidth, <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>, className);
}
export function SunIcon({ size = 18, strokeWidth = 1.9, className }: IconProps) {
  return base(size, strokeWidth, <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>, className);
}
export function EditIcon({ size = 16, strokeWidth = 1.9, className }: IconProps) {
  return base(size, strokeWidth, <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>, className);
}
export function ClockIcon({ size = 12, strokeWidth = 1.9, className }: IconProps) {
  return base(size, strokeWidth, <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>, className);
}
export function FlameIcon({ size = 16, strokeWidth = 1.9, className }: IconProps) {
  return base(size, strokeWidth, <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 01-7 7 7 7 0 01-4.5-12.5"/>, className);
}
export function TrophyIcon({ size = 16, strokeWidth = 1.9, className }: IconProps) {
  return base(size, strokeWidth, <><path d="M6 9H4.5a2.5 2.5 0 010-5H6"/><path d="M18 9h1.5a2.5 2.5 0 000-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0012 0V2z"/></>, className);
}
export function UndoIcon({ size = 14, strokeWidth = 2, className }: IconProps) {
  return base(size, strokeWidth, <><path d="M3 7h10a5 5 0 010 10H3"/><polyline points="7 3 3 7 7 11"/></>, className);
}
export function BellIcon({ size = 18, strokeWidth = 1.9, className }: IconProps) {
  return base(size, strokeWidth, <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>, className);
}
export function CalendarIcon({ size = 16, strokeWidth = 1.9, className }: IconProps) {
  return base(size, strokeWidth, <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>, className);
}
export function RocketIcon({ size = 16, strokeWidth = 1.9, className }: IconProps) {
  return base(size, strokeWidth, <><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></>, className);
}
export function XIcon({ size = 16, strokeWidth = 2, className }: IconProps) {
  return base(size, strokeWidth, <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>, className);
}
