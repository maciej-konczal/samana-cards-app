import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Cards from "@/components/cards/Cards";

export default async function Page({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  return (
    <div>
      <p>Card Set: {params.id}</p>
      <Cards card_set_id={params.id} />
    </div>
  );
}
