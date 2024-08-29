import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

export default async function CardSets() {
  const supabase = createClient();
  const { data: sets } = await supabase.from("card_sets").select();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {sets?.map((set) => (
        <Link key={set.id} href={`/card-set/${set.id}`} className="block">
          <div className="bg-white shadow-md rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2 text-gray-800">
                {set.name}
              </h3>
              <p className="text-gray-600 mb-4">
                {set.description || "No description available"}
              </p>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>{set.cards_count || 0} cards</span>
                <span>
                  Created: {new Date(set.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
