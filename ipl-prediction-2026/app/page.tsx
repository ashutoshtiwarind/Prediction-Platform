import { Suspense } from "react";
import dynamic from "next/dynamic";
import { Match } from "@/lib/supabase";

// Skip SSR for the interactive match list — useRouter requires the
// client-side router context which isn't available during server rendering.
const HomeClient = dynamic(() => import("./components/HomeClient"), {
  ssr: false,
  loading: () => (
    <div className="text-center py-12">
      <div className="inline-block w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-500 mt-3">Loading matches...</p>
    </div>
  ),
});

async function getMatches(): Promise<Match[]> {
  try {
    // Server-side fetch — works in both local dev and Vercel
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/matches`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.matches || [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const matches = await getMatches();

  return (
    <div>
      {/* Hero Section */}
      <section className="text-center mb-12 py-8">
        <div className="inline-block bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
          IPL 2026
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight">
          Beat The AI
        </h1>
        <p className="text-xl text-gray-600 mb-2">
          Your cricket knowledge &gt; Algorithms
        </p>
        <p className="text-gray-500 max-w-lg mx-auto">
          Predict IPL match winners. See if you outpick our AI. Climb the
          leaderboard. Zero money, pure bragging rights.
        </p>

        {/* Stats bar */}
        <div className="flex justify-center gap-8 mt-8">
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">2.1L+</p>
            <p className="text-sm text-gray-500">Predictions Made</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">74%</p>
            <p className="text-sm text-gray-500">Humans Beat AI</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">74</p>
            <p className="text-sm text-gray-500">Matches This Season</p>
          </div>
        </div>
      </section>

      {/* Matches Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Upcoming Matches</h2>
        <HomeClient initialMatches={matches} />
      </section>

      {/* How it works */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              step: "1",
              title: "Pick Your Winner",
              desc: "Choose which team you think will win today's match.",
            },
            {
              step: "2",
              title: "See AI's Pick",
              desc: "Our AI also makes a prediction using historical data.",
            },
            {
              step: "3",
              title: "Score Points",
              desc: "Correct picks earn +10 pts. Beating the AI earns +5 bonus.",
            },
          ].map((item) => (
            <div key={item.step} className="bg-white rounded-lg p-6 shadow-sm">
              <div className="w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-lg mb-4">
                {item.step}
              </div>
              <h3 className="font-bold text-lg mb-2">{item.title}</h3>
              <p className="text-gray-600 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">FAQ</h2>
        <div className="space-y-4">
          {[
            {
              q: "Is this a betting platform?",
              a: "No. Zero money involved. Pure bragging rights.",
            },
            {
              q: "How does scoring work?",
              a: "Correct prediction: +10 points. Picking the underdog who wins: +15 points.",
            },
            {
              q: "Is my data safe?",
              a: "Yes. Encrypted, never sold. GDPR-compliant.",
            },
          ].map((item) => (
            <div key={item.q} className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-semibold mb-2">{item.q}</h3>
              <p className="text-gray-600 text-sm">{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
