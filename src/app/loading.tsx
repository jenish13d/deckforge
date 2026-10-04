/** Shown while a page loads after a click (appears only if it takes a moment). */
export default function Loading() {
  return (
    <div className="route-loading" role="status" aria-label="Loading">
      <span className="route-loading__spinner" />
    </div>
  );
}
