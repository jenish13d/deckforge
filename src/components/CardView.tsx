"use client";

import { useLayoutEffect, useRef } from "react";

import { imageSrc, showsImage, type CardContent } from "@/lib/cards";

/**
 * Shrinks a card's text (via the --fit CSS variable) until it fits the slide, so
 * long content never gets cut off on screen, when presenting or in PDFs.
 */
function useFitText(content: CardContent) {
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const card = ref.current;
    const inner = card?.querySelector<HTMLElement>(".card__inner");
    if (!card || !inner) return;
    const fit = () => {
      card.style.setProperty("--fit", "1");
      let scale = 1;
      for (let i = 0; i < 10 && inner.scrollHeight > inner.clientHeight + 1 && scale > 0.5; i++) {
        scale = Math.max(0.5, scale * Math.min(0.95, Math.sqrt(inner.clientHeight / inner.scrollHeight)));
        card.style.setProperty("--fit", scale.toFixed(3));
      }
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(card);
    void document.fonts?.ready.then(fit);
    return () => observer.disconnect();
  }, [content]);
  return ref;
}

/**
 * Renders one slide. `index` (its position in the deck) alternates the photo side
 * and, in themes with several backgrounds, the background colour.
 */
export function CardView({ content, index = 0 }: { content: CardContent; index?: number }) {
  const { layout, eyebrow, icon, title, subtitle, items, stats, quote, quoteAuthor, table } = content;
  const photo = showsImage(content) ? content.image : null;
  const ref = useFitText(content);

  const fullBleed = Boolean(photo) && (layout === "title" || layout === "section");
  const classes = [
    "card",
    `card--${layout}`,
    photo && "card--with-image",
    fullBleed && "card--full-bleed",
    photo && !fullBleed && index % 2 === 1 && "card--image-left",
  ]
    .filter(Boolean)
    .join(" ");

  const isList = layout === "bullets" || layout === "columns" || layout === "timeline";
  const listClass = [
    "card__items",
    `card__items--${layout}`,
    // Without a photo there's room to spread out: a timeline runs across, long lists use two columns.
    layout === "timeline" && !photo && items.length <= 4 && "card__items--row",
    layout === "timeline" && (photo || items.length > 4) && "card__items--boxed",
    layout === "bullets" && !photo && items.length >= 4 && "card__items--grid card__items--boxed",
  ]
    .filter(Boolean)
    .join(" ");
  const heroStat = layout === "stats" && stats.length === 1;

  const subtitleEl = subtitle ? <p className="card__subtitle">{subtitle}</p> : null;
  const hasBody =
    Boolean(subtitle) ||
    layout === "quote" ||
    (isList && items.length > 0) ||
    (layout === "stats" && stats.length > 0) ||
    (layout === "table" && table.rows.length > 0) ||
    layout === "title" ||
    layout === "section";

  return (
    <article ref={ref} className={classes} data-variant={index % 3}>
      <div className="card__inner">
        <header className="card__head">
          {icon && <div className="card__icon" aria-hidden="true">{icon}</div>}
          {eyebrow && <p className="card__eyebrow">{eyebrow}</p>}
          {layout !== "quote" && <h2 className="card__title">{title}</h2>}
        </header>

        {hasBody && (
          <div className="card__body">
            {layout === "quote" ? (
              <>
                <blockquote className="card__quote">“{quote || title}”</blockquote>
                {quoteAuthor && <p className="card__author">— {quoteAuthor}</p>}
                {quote && title && <p className="card__subtitle">{title}</p>}
              </>
            ) : (
              !heroStat && subtitleEl
            )}

            {isList && items.length > 0 && (
              <ol className={listClass}>
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
              <div className={heroStat ? "card__stats card__stats--hero" : "card__stats"}>
                {stats.map((stat, i) => (
                  <div key={i} className="card__stat">
                    <span className="card__stat-value">{stat.value}</span>
                    <span className="card__stat-label">{stat.label}</span>
                  </div>
                ))}
              </div>
            )}
            {heroStat && subtitleEl}

            {layout === "table" && table.rows.length > 0 && (
              <table className="card__table">
                <thead>
                  <tr>
                    {table.columns.map((c, i) => (
                      <th key={i} scope="col">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row, r) => (
                    <tr key={r}>
                      {row.map((cell, i) => (
                        <td key={i}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
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
