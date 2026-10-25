export function CBTFlagIcon({ className = 'h-4 w-4' }: { readonly className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M6 3.2a.8.8 0 0 1 .8-.8h9.4a.9.9 0 0 1 .74 1.42L14.7 7.6l2.24 3.78a.9.9 0 0 1-.74 1.42H7.6V20.2a.8.8 0 0 1-1.6 0V3.2Z"
      />
    </svg>
  );
}
