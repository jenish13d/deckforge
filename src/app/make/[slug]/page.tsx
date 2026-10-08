import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { UseCaseView } from "@/components/UseCaseView";
import { guideLinks } from "@/lib/search-pages";
import { SITE } from "@/lib/site";
import { USE_CASES, findUseCase } from "@/lib/use-cases";

export const dynamicParams = false;

export function generateStaticParams() {
  return USE_CASES.map((u) => ({ slug: u.slug }));
}

export async function generateMetadata(props: PageProps<"/make/[slug]">): Promise<Metadata> {
  const useCase = findUseCase((await props.params).slug);
  if (!useCase) return {};
  const path = `/make/${useCase.slug}`;
  return {
    title: useCase.title,
    description: useCase.description,
    alternates: { canonical: path },
    openGraph: { title: `${useCase.title} · ${SITE.name}`, description: useCase.description, url: path, type: "website" },
  };
}

export default async function UseCasePage(props: PageProps<"/make/[slug]">) {
  const useCase = findUseCase((await props.params).slug);
  if (!useCase) notFound();
  const path = `/make/${useCase.slug}`;
  return <UseCaseView useCase={useCase} path={path} related={guideLinks().filter((l) => l.href !== path)} />;
}
