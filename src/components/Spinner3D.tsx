/** Three little slides turning in 3D: the loader for every step where the AI is working. */
export function Spinner3D({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <span className={`spinner3d ${className}`} style={{ "--s": `${size}px` } as React.CSSProperties} aria-hidden="true">
      <span className="spinner3d__ring">
        <span className="spinner3d__slide" style={{ "--k": 0 } as React.CSSProperties} />
        <span className="spinner3d__slide" style={{ "--k": 1 } as React.CSSProperties} />
        <span className="spinner3d__slide" style={{ "--k": 2 } as React.CSSProperties} />
      </span>
    </span>
  );
}
