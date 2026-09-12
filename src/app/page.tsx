import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";

export default async function Home() {
  const session = await auth();
  if (session?.user.kind === "customer") redirect("/portal");
  if (session?.user.kind === "staff") redirect("/dashboard");
  redirect("/sign-in");
}
