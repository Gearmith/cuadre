export default function Loading() {
  const bar = "animate-pulse rounded-field bg-surface-2";
  return (
    <div aria-busy="true" className="flex flex-col gap-8">
      <div className={`${bar} h-9 w-44`} />
      <div className="h-56 animate-pulse rounded-note bg-surface-2 md:h-64" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-36 animate-pulse rounded-note bg-surface-2" />
        ))}
      </div>
      <div className="overflow-hidden rounded-panel border border-line bg-surface">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-0">
            <div className={`${bar} size-10 rounded-full`} />
            <div className={`${bar} h-4 flex-1`} />
            <div className={`${bar} h-5 w-24`} />
          </div>
        ))}
      </div>
    </div>
  );
}
