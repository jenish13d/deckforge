import { imageSrc, showsImage, type CardContent } from "@/lib/cards";

/** Renders one card. Works in server and client components. */
export function CardView({ content }: { content: CardContent }) {
  const { layout, icon, title, subtitle, items, stats, quote, quoteAuthor } = content;
  const photo = showsImage(content) ? content.image : null;

  return (
    <article className={`card card--${layout}${photo ? " card--with-image" : ""}`}>
      <div className="card__inner">
        {icon && <div className="card__icon" aria-hidden="true">{icon}</div>}

        {layout === "quote" ? (
          <>
            <blockquote className="card__quote">“{quote || title}”</blockquote>
            {quoteAuthor && <p className="card__author">— {quoteAuthor}</p>}
            {quote && title && <p className="card__subtitle">{title}</p>}
          </>
        ) : (
          <>
            <h2 className="card__title">{title}</h2>
            {subtitle && <p className="card__subtitle">{subtitle}</p>}
          </>
        )}

        {(layout === "bullets" || layout === "columns" || layout === "timeline") && items.length > 0 && (
          <ol className={`card__items card__items--${layout}`}>
            {items.map((item, i) => (
              <li key={i} className="card__item">
                {layout === "timeline" && <span className="card__step">{i + 1}</span>}
                <div>
                  {item.heading && <strong className="card__item-heading">{item.heading}</strong>}
                  {item.text && <span className="card__item-text">{item.text}</span>}
                </div>
              </li>
            ))}
          </ol>
        )}

        {layout === "stats" && stats.length > 0 && (
          <div className="card__stats">
            {stats.map((stat, i) => (
              <div key={i} className="card__stat">
                <span className="card__stat-value">{stat.value}</span>
                <span className="card__stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {photo && (
        <figure className="card__media">
          {/* eslint-disable-next-line @next/next/no-img-element -- served by our image route for exports */}
          <img src={imageSrc(photo.url)} alt={photo.alt} crossOrigin="anonymous" />
          {photo.credit && (
            <figcaption className="card__credit">
              Photo: {photo.creditUrl ? <a href={photo.creditUrl} target="_blank" rel="noreferrer">{photo.credit}</a> : photo.credit}
            </figcaption>
          )}
        </figure>
      )}
    </article>
  );
}

export function CardPlaceholder({ title, failed, note }: { title: string; failed?: boolean; note?: string }) {
  return (
    <article className={`card card--placeholder${failed ? " card--failed" : ""}`}>
      <div className="card__inner">
        <h2 className="card__title">{title}</h2>
        <p className="card__subtitle">{failed ? "This card couldn't be written. Try regenerating it." : note || "Writing…"}</p>
        {!failed && (
          <div className="skeleton" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        )}
      </div>
    </article>
  );
}
