import { CreateFlow } from "@/components/CreateFlow";

export default function Home() {
  return (
    <main className="page page--narrow">
      <header className="hero">
        <h1 className="hero__title">Deckforge</h1>
        <p className="hero__subtitle">Describe your idea. Get a polished presentation in a minute, then make it yours.</p>
      </header>
      <CreateFlow />
    </main>
  );
}
