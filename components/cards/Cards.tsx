import { createClient } from "@/utils/supabase/server";
import Card from "./Card";

export default async function Cards({ card_set_id }: { card_set_id: string }) {
  const supabase = createClient();
  const { data: cards } = await supabase
    .from("cards")
    .select(`id, text, translations (id, text, language_id)`)
    .eq("card_set", card_set_id);

  const { data: languages } = await supabase
    .from("languages")
    .select(`id, name, iso_2`);

  const languageMap = languages?.reduce((acc, lang) => {
    acc[lang.id] = { name: lang.name, iso_2: lang.iso_2 };
    return acc;
  }, {} as Record<string, { name: string; iso_2: string }>);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards?.map((card) => (
        <Card key={card.id} card={card} languageMap={languageMap} />
      ))}
    </div>
  );
}
