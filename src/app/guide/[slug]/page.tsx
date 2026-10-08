import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { UseCaseView } from "@/components/UseCaseView";
import { pageMetadata } from "@/lib/seo";
import { SEARCH_PAGES, findSearchPage } from "@/lib/search-pages";

// Landing pages for what people search for. They are served at the top level (/ai-ppt-maker, ...)
// through rewrites in next.config.ts, so any other address is still a real 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return SEARCH_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/guide/[slug]">): Promise<Metadata> {
  const page = findSearchPage((await props.params).slug);
  if (!page) return {};
  return pageMetadata({ title: page.title, description: page.description, path: `/${page.slug}` });
}

export default async function SearchPage(props: PageProps<"/guide/[slug]">) {
  const page = findSearchPage((await props.params).slug);
  if (!page) notFound();
  return <UseCaseView useCase={page} path={`/${page.slug}`} />;
}
