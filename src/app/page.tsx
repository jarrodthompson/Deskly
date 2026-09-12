import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { LandingPage } from "@/components/marketing/landing-page";

export default async function Home() {
  const session = await auth();
  if (session?.user.kind === "customer") redirect("/portal");
  if (session?.user.kind === "staff") redirect("/dashboard");
  return <LandingPage />;
}
