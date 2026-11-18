/** Marca: una libreta con dos renglones, el de abajo más corto. */
export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden>
      <rect x="4" y="3" width="20" height="22" rx="3" className="fill-navy" />
      <rect x="4" y="3" width="4" height="22" rx="2" className="fill-on-navy" opacity="0.18" />
      <rect x="11" y="10" width="9" height="2" rx="1" className="fill-on-navy" />
      <rect x="11" y="15" width="6" height="2" rx="1" className="fill-on-navy" opacity="0.7" />
    </svg>
  );
}
