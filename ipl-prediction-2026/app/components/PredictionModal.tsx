"use client";

import { useState, useEffect } from "react";
import { Match } from "@/lib/supabase";
import { Button } from "./Button";
import { TeamBadge } from "./TeamBadge";
import { getTeamConfig } from "@/app/lib/teams";

interface PredictionModalProps {
  isOpen: boolean;
  match: Match | null;
  onClose: () => void;
  onVote: (team: string) => Promise<void>;
}

export function PredictionModal({ isOpen, match, onClose, onVote }: PredictionModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedTeam(null);
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  if (!isOpen || !match) return null;

  const team1 = getTeamConfig(match.team_1);
  const team2 = getTeamConfig(match.team_2);
  const selectedConfig = selectedTeam ? getTeamConfig(selectedTeam) : null;

  const handleVote = async () => {
    if (!selectedTeam) return;
    setLoading(true);
    try {
      await onVote(selectedTeam);
      setSelectedTeam(null);
    } catch (e) {
      console.error("Vote failed:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 transition-all duration-300"
        style={{
          background: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          opacity: visible ? 1 : 0,
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 top-1/2 -translate-y-1/2 z-50 w-full sm:w-[440px] max-h-[90vh] overflow-y-auto no-scrollbar"
        style={{
          transition: "opacity 0.35s cubic-bezier(0.16,1,0.3,1), transform 0.35s cubic-bezier(0.16,1,0.3,1)",
          opacity: visible ? 1 : 0,
          transform: `translate(-50%, calc(-50% + ${visible ? "0px" : "30px"}))`,
        }}
      >
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "#0D1A2D",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: selectedConfig
              ? `0 24px 80px rgba(0,0,0,0.6), 0 0 60px ${selectedConfig.color}20`
              : "0 24px 80px rgba(0,0,0,0.6)",
            transition: "box-shadow 0.4s ease",
          }}
        >
          {/* Header */}
          <div
            className="px-6 py-4 flex justify-between items-center border-b border-white/[0.07]"
            style={{
              background: selectedConfig
                ? `linear-gradient(135deg, ${selectedConfig.color}15, transparent)`
                : "rgba(255,255,255,0.02)",
              transition: "background 0.4s ease",
            }}
          >
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest">Make Your Call</p>
              <h2 className="text-xl font-display font-bold text-white mt-0.5">
                {match.team_1} <span className="text-gray-500 font-normal">vs</span> {match.team_2}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/[0.07] flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/[0.14] transition-smooth"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            <p className="text-sm text-gray-400 text-center mb-6">
              Who wins? 🤔 Pick a side — then see if you can <span className="text-white font-semibold">outsmart the AI</span>
            </p>

            {/* Team Selection */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[match.team_1, match.team_2].map((team) => {
                const cfg = getTeamConfig(team);
                const isSelected = selectedTeam === team;
                return (
                  <button
                    key={team}
                    onClick={() => setSelectedTeam(team)}
                    className="relative p-5 rounded-xl overflow-hidden transition-all duration-300 text-center"
                    style={{
                      background: isSelected
                        ? `linear-gradient(135deg, ${cfg.color}22, ${cfg.color}0A)`
                        : "rgba(255,255,255,0.04)",
                      border: isSelected
                        ? `2px solid ${cfg.color}80`
                        : "2px solid rgba(255,255,255,0.07)",
                      boxShadow: isSelected
                        ? `0 0 30px ${cfg.color}30, inset 0 1px 0 ${cfg.color}20`
                        : "none",
                      transform: isSelected ? "scale(1.02)" : "scale(1)",
                    }}
                  >
                    {/* Selected checkmark */}
                    {isSelected && (
                      <div
                        className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: cfg.color, color: "#000" }}
                      >
                        ✓
                      </div>
                    )}

                    <div className="flex justify-center mb-3">
                      <TeamBadge team={team} size="md" />
                    </div>

                    <div className="font-display font-black text-xl" style={{ color: isSelected ? cfg.color : "#F9FAFB" }}>
                      {team}
                    </div>

                    <div className="text-xs mt-2" style={{ color: isSelected ? `${cfg.color}CC` : "rgba(156,163,175,0.8)" }}>
                      AI odds: {team === match.team_1 ? match.team_1_probability : match.team_2_probability}%
                    </div>

                    {/* Probability bar */}
                    <div className="mt-3 h-1 rounded-full bg-white/[0.08] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${team === match.team_1 ? match.team_1_probability : match.team_2_probability}%`,
                          background: cfg.color,
                          opacity: isSelected ? 1 : 0.4,
                        }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Match Info */}
            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-5 text-xs text-gray-500">
              <span>📍 {match.venue}, {match.city}</span>
              <span>
                {new Date(match.match_date).toLocaleString("en-IN", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="ghost" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleVote}
                disabled={!selectedTeam}
                loading={loading}
                size="lg"
                className="flex-[2] font-display font-bold tracking-wide"
                style={
                  selectedConfig
                    ? ({
                        "--tw-shadow": `0 4px 20px ${selectedConfig.color}40`,
                        background: `linear-gradient(135deg, ${selectedConfig.color}, ${selectedConfig.color}CC)`,
                        color: "#000",
                      } as React.CSSProperties)
                    : {}
                }
              >
                {loading ? "Locking in..." : selectedTeam ? `🏏 PREDICT ${selectedTeam}` : "Pick a Team"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
