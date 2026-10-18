import Link from "next/link";

import { LeaveWaitlist } from "@/components/LeaveWaitlist";
import { Logo } from "@/components/Logo";
import { SITE } from "@/lib/site";

export const metadata = { title: "Leave the list", robots: { index: false } };

export default async function LeaveLaunchListPage(props: PageProps<"/launch/leave">) {
  const { token } = await props.searchParams;
  return (
    <>
      <header className="site-header">
        <Link href="/" className="site-header__brand" aria-label={`${SITE.name} home`}><Logo /></Link>
      </header>
      <main id="main" className="page page--auth">
        <LeaveWaitlist list="launch" token={typeof token === "string" ? token : ""} />
      </main>
    </>
  );
}
