import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

// Fallback mock data when Supabase is not configured
function getMockMatches() {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  return [
    {
      id: "mock-1",
      match_number: 1,
      team_1: "CSK",
      team_2: "RCB",
      venue: "MA Chidambaram Stadium",
      city: "Chennai",
      match_date: new Date(now + 2 * day).toISOString(),
      vote_start_time: new Date(now - 1 * 60 * 60 * 1000).toISOString(),
      vote_end_time: new Date(now + 2 * day - 30 * 60 * 1000).toISOString(),
      team_1_probability: 65,
      team_2_probability: 35,
      winner: null,
      status: "upcoming",
      initial_count_team_1: 7000,
      initial_count_team_2: 3000,
    },
    {
      id: "mock-2",
      match_number: 2,
      team_1: "MI",
      team_2: "DC",
      venue: "Arun Jaitley Stadium",
      city: "Delhi",
      match_date: new Date(now + 3 * day).toISOString(),
      vote_start_time: new Date(now - 1 * 60 * 60 * 1000).toISOString(),
      vote_end_time: new Date(now + 3 * day - 30 * 60 * 1000).toISOString(),
      team_1_probability: 60,
      team_2_probability: 40,
      winner: null,
      status: "upcoming",
      initial_count_team_1: 6500,
      initial_count_team_2: 3500,
    },
    {
      id: "mock-3",
      match_number: 3,
      team_1: "KKR",
      team_2: "SRH",
      venue: "Eden Gardens",
      city: "Kolkata",
      match_date: new Date(now + 4 * day).toISOString(),
      vote_start_time: new Date(now - 1 * 60 * 60 * 1000).toISOString(),
      vote_end_time: new Date(now + 4 * day - 30 * 60 * 1000).toISOString(),
      team_1_probability: 55,
      team_2_probability: 45,
      winner: null,
      status: "upcoming",
      initial_count_team_1: 5500,
      initial_count_team_2: 4500,
    },
  ];
}

export async function GET() {
  // Return mock data when Supabase is not configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ success: true, matches: getMockMatches() });
  }

  try {
    const { data: matches, error } = await supabase
      .from("matches")
      .select("*")
      .order("match_date", { ascending: true })
      .limit(10);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    // If all DB matches are in the past (stale seed data), refresh them with future dates
    const liveMatches = matches || [];
    const allStale = liveMatches.every(
      (m) => new Date(m.match_date).getTime() < now
    );

    if (allStale && liveMatches.length > 0) {
      const updates = liveMatches.map((m, i) => ({
        ...m,
        match_date: new Date(now + (i + 2) * day).toISOString(),
        vote_start_time: new Date(now - 60 * 60 * 1000).toISOString(),
        vote_end_time: new Date(now + (i + 2) * day - 30 * 60 * 1000).toISOString(),
        status: "upcoming" as const,
        winner: null,
      }));

      // Persist the refreshed dates back to DB
      for (const u of updates) {
        await supabase
          .from("matches")
          .update({
            match_date: u.match_date,
            vote_start_time: u.vote_start_time,
            vote_end_time: u.vote_end_time,
            status: u.status,
            winner: u.winner,
          })
          .eq("id", u.id);
      }

      return NextResponse.json({ success: true, matches: updates });
    }

    return NextResponse.json({
      success: true,
      matches: liveMatches,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
