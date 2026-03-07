interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

function Skeleton({ className = "", width, height }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height }}
      role="status"
      aria-label="Loading..."
    />
  );
}

function SkeletonCard() {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 space-y-3">
      <Skeleton height="20px" width="60%" />
      <Skeleton height="14px" width="90%" />
      <Skeleton height="14px" width="75%" />
      <Skeleton height="40px" width="100%" className="mt-4" />
    </div>
  );
}

export { Skeleton, SkeletonCard };
export default Skeleton;
