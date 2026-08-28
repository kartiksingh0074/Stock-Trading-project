import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Trophy } from "lucide-react";
import { getLeaderboard } from "@/lib/actions/leaderboard.actions";

const MEDAL_COLORS = ["text-yellow-400", "text-gray-400", "text-orange-500"];

export default async function LeaderboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/sign-in");
  }

  const entries = await getLeaderboard();

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
        <p className="text-gray-500">
          Ranked by portfolio value (cost basis — cash + invested amount, updated after each trade,
          not live intraday market value).
        </p>
      </div>

      <div className="bg-gray-800 rounded-lg divide-y divide-gray-700">
        {entries.length === 0 ? (
          <p className="text-gray-400 text-sm p-6">No traders yet.</p>
        ) : (
          entries.map((entry, index) => (
            <div
              key={entry.id}
              className={`flex items-center justify-between p-4 ${
                entry.isCurrentUser ? "bg-yellow-500/5" : ""
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-8 text-center">
                  {index < 3 ? (
                    <Trophy className={`h-5 w-5 mx-auto ${MEDAL_COLORS[index]}`} />
                  ) : (
                    <span className="text-gray-500 font-medium">{index + 1}</span>
                  )}
                </div>
                <p className={`font-medium ${entry.isCurrentUser ? "text-yellow-500" : "text-gray-100"}`}>
                  {entry.name}
                  {entry.isCurrentUser && <span className="text-xs text-gray-400 ml-2">(you)</span>}
                </p>
              </div>
              <p className="font-semibold text-gray-100">${entry.netWorth.toFixed(2)}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
