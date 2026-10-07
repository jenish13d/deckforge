import { SiteHeader } from "@/components/SiteHeader";
import { LeaveWaitlist } from "@/components/LeaveWaitlist";

export const metadata = { title: "Leave the list", robots: { index: false } };

export default async function LeavePage(props: PageProps<"/pro/leave">) {
  const { token } = await props.searchParams;
  return (
    <>
      <SiteHeader />
      <main id="main" className="page page--auth">
        <LeaveWaitlist token={typeof token === "string" ? token : ""} />
      </main>
    </>
  );
}
