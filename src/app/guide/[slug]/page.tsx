import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { UseCaseView } from "@/components/UseCaseView";
import { SEARCH_PAGES, findSearchPage, guideLinks } from "@/lib/search-pages";
import { SITE } from "@/lib/site";

// Landing pages for what people search for. They are served at the top level (/ai-ppt-maker, ...)
// through rewrites in next.config.ts, so any other address is still a real 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return SEARCH_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/guide/[slug]">): Promise<Metadata> {
  const page = findSearchPage((await props.params).slug);
  if (!page) return {};
  const path = `/${page.slug}`;
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: path },
    openGraph: { title: `${page.title} · ${SITE.name}`, description: page.description, url: path, type: "website" },
  };
}

export default async function SearchPage(props: PageProps<"/guide/[slug]">) {
  const page = findSearchPage((await props.params).slug);
  if (!page) notFound();
  const path = `/${page.slug}`;
  return <UseCaseView useCase={page} path={path} related={guideLinks().filter((l) => l.href !== path)} />;
}
