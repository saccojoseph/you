export function YouMark({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M28 30 17 23M37 28l10-11M37 37l11 10M27 37 17 45" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="32" cy="33" r="8" fill="currentColor" />
      <circle cx="15" cy="22" r="4" fill="currentColor" />
      <circle cx="49" cy="15" r="4" fill="currentColor" />
      <circle cx="50" cy="49" r="4" fill="currentColor" />
      <circle cx="15" cy="47" r="4" fill="currentColor" />
    </svg>
  );
}
