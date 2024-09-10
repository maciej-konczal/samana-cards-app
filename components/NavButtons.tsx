import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function NavButtons() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex gap-2">
      {user && (
        <>
          <Link
            href="/dashboard"
            className="h-8 flex items-center justify-center rounded-md no-underline text-sm font-medium px-4"
          >
            Dashboard
          </Link>
          <Link
            href="/card-sets"
            className="h-8 flex items-center justify-center rounded-md no-underline text-sm font-medium px-4"
          >
            Card Sets
          </Link>
          <Link
            href="/create-set"
            className="h-8 flex items-center justify-center rounded-md no-underline text-sm font-medium px-4"
          >
            Create Set
          </Link>
          <Link
            href="/practice"
            className="h-8 flex items-center justify-center rounded-md no-underline text-sm font-medium px-4"
          >
            Practice
          </Link>
        </>
      )}
    </div>
  );
}
