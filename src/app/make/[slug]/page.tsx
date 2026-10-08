import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { UseCaseView } from "@/components/UseCaseView";
import { pageMetadata } from "@/lib/seo";
import { USE_CASES, findUseCase } from "@/lib/use-cases";

export const dynamicParams = false;

export function generateStaticParams() {
  return USE_CASES.map((u) => ({ slug: u.slug }));
}

export async function generateMetadata(props: PageProps<"/make/[slug]">): Promise<Metadata> {
  const useCase = findUseCase((await props.params).slug);
  if (!useCase) return {};
  return pageMetadata({ title: useCase.title, description: useCase.description, path: `/make/${useCase.slug}` });
}

export default async function UseCasePage(props: PageProps<"/make/[slug]">) {
  const useCase = findUseCase((await props.params).slug);
  if (!useCase) notFound();
  return <UseCaseView useCase={useCase} path={`/make/${useCase.slug}`} />;
}
