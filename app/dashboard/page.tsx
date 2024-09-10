import DeployButton from "@/components/DeployButton";
import AuthButton from "@/components/AuthButton";
import { createClient } from "@/utils/supabase/server";
import CardSets from "@/components/card-sets/CardSets";
import Header from "@/components/Header";
import { redirect } from "next/navigation";
import UserStatistics from "@/components/dashboard/UserStatistics";

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-20 items-center">
      <div className="flex-1 flex flex-col gap-20 max-w-4xl px-3">
        <main className="flex-1 flex flex-col gap-6">
          <UserStatistics />
        </main>
      </div>
    </div>
  );
}
