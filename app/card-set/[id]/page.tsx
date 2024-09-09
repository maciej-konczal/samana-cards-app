import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Cards from "@/components/cards/Cards";
import UnderlinedTextExtractor from "@/components/extractors/UnderlinedTextExtractor";

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
      <h1 className="text-2xl font-bold mb-4">Underlined Text Extractor</h1>
      <UnderlinedTextExtractor card_set_id={params.id} />
    </div>
  );
}
