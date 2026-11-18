export default function Loading() {
  const bar = "animate-pulse rounded-field bg-surface-2";
  return (
    <div aria-busy="true" className="flex flex-col gap-6">
      <div className={`${bar} h-8 w-40`} />
      <div className="rounded-panel border border-line bg-surface p-5">
        <div className={`${bar} h-4 w-28`} />
        <div className={`${bar} mt-3 h-11 w-64`} />
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className={`${bar} h-12`} />
          <div className={`${bar} h-12`} />
        </div>
      </div>
      <div className="overflow-hidden rounded-panel border border-line bg-surface">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-0">
            <div className={`${bar} size-10 rounded-full`} />
            <div className={`${bar} h-4 flex-1`} />
            <div className={`${bar} h-4 w-20`} />
          </div>
        ))}
      </div>
    </div>
  );
}
