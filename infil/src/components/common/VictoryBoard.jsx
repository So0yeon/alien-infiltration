import React from "react";
import { tally } from "../../lib/gameLogic";

// 상단 고정: 임무 1~5 현황 + 현재 스코어
export function MissionBoard({ results = [], totalRounds = 5, currentRound }) {
  const byRound = {};
  results.forEach((r) => (byRound[r.round] = r));
  const { win, lose } = tally(results);

  return (
    <div className="bg-panel/90 backdrop-blur rounded-xl2 border border-brand/10 shadow-card px-4 py-3 sm:px-6 sm:py-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 sm:gap-3">
          {Array.from({ length: totalRounds }, (_, i) => i + 1).map((n) => {
            const r = byRound[n];
            const active = n === currentRound;
            const face = r ? (r.result === "success" ? "✅" : "❌") : active ? "🛰️" : "·";
            const ring = r
              ? r.result === "success"
                ? "border-good bg-good/10"
                : "border-bad bg-bad/10"
              : active
              ? "border-brand bg-brand/10 animate-pulse"
              : "border-ink/10 bg-ink/5";
            return (
              <div key={n} className="text-center">
                <div
                  className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl border-2 ${ring} flex items-center justify-center text-2xl sm:text-3xl`}
                >
                  {face}
                </div>
                <div className="text-[10px] sm:text-xs font-bold text-ink/40 mt-1">임무 {n}</div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-3 sm:gap-5">
          <Score label="인간팀" value={win} color="text-good" sub="성공" />
          <div className="text-ink/20 text-2xl font-light">:</div>
          <Score label="침투자팀" value={lose} color="text-bad" sub="실패" />
        </div>
      </div>
    </div>
  );
}

function Score({ label, value, color, sub }) {
  return (
    <div className="text-center">
      <div className={`text-3xl sm:text-4xl font-black ${color}`}>{value}</div>
      <div className="text-[10px] sm:text-xs font-bold text-ink/40">
        {label} · {sub} 3
      </div>
    </div>
  );
}

// 라운드별 탐사대 명단 기록 (애들이 추리하는 핵심 단서)
export function TeamHistory({ results = [] }) {
  if (results.length === 0) return null;
  return (
    <div className="bg-panel rounded-xl2 border border-brand/10 shadow-card p-4 sm:p-6">
      <p className="text-xs font-bold tracking-[0.2em] text-brand/60 uppercase mb-3">탐사대 기록</p>
      <div className="space-y-3">
        {results.map((r) => (
          <div key={r.round} className="flex items-start gap-3">
            <span
              className={`shrink-0 mt-0.5 px-2.5 py-1 rounded-lg text-sm font-bold ${
                r.result === "success" ? "bg-good/15 text-[#1f8a3b]" : "bg-bad/15 text-[#c0354a]"
              }`}
            >
              {r.round}차 {r.result === "success" ? "성공" : "실패"}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {r.team.map((num) => (
                <span
                  key={num}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center font-bold text-ink/70 text-base"
                >
                  {num}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
