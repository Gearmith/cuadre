/** Marca: un billete verde con su roseta dorada. */
export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect x="2" y="7" width="28" height="18" rx="4" fill="#0f3d36" />
      <rect x="4.5" y="9.5" width="23" height="13" rx="2.5" fill="none" stroke="#e7a93b" strokeOpacity="0.55" />
      <circle cx="21" cy="16" r="4.2" fill="none" stroke="#e7a93b" strokeWidth="1.6" />
      <circle cx="21" cy="16" r="1.6" fill="#e7a93b" />
      <rect x="7.5" y="13" width="7" height="1.8" rx="0.9" fill="#f1ead6" />
      <rect x="7.5" y="17.2" width="4.5" height="1.8" rx="0.9" fill="#f1ead6" opacity="0.7" />
    </svg>
  );
}
