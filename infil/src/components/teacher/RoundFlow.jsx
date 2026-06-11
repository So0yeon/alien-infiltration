import React, { useEffect, useMemo, useState } from "react";
import { Card, Button, Eyebrow, Pill } from "../common/ui";
import { useVotes, useSubmissions } from "../../lib/hooks";
import {
  beginRound,
  openVote,
  closeVote,
  startMission,
  revealMission,
  proceedAfterResult,
} from "../../lib/api";

export default function RoundFlow({ room, players }) {
  const [votes] = useVotes(room.id, room.round);
  const [subs] = useSubmissions(room.id, room.round);
  const [busy, setBusy] = useState(false);

  const run = async (fn) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  switch (room.phase) {
    case "role_reveal":
      return (
        <Stage emoji="🔍" title="역할 확인 중" sub="학생들이 각자 기기에서 정체를 확인합니다">
          <p className="text-ink/50 mb-6">
            연구원 {room.total_players - room.alien_count}명 · 침투자 {room.alien_count}명이 배정됐어요.
            모두 확인했으면 첫 임무를 시작하세요.
          </p>
          <Button size="xl" disabled={busy} onClick={() => run(() => beginRound(room.id, 1))}>
            1차 임무 시작
          </Button>
        </Stage>
      );

    case "mission_select":
      return <MissionSelect room={room} players={players} busy={busy} run={run} />;

    case "voting":
      return <Voting room={room} players={players} votes={votes} busy={busy} run={run} />;

    case "vote_result":
      return <VoteResult room={room} busy={busy} run={run} />;

    case "mission_run":
      return <MissionRun room={room} subs={subs} busy={busy} run={run} />;

    case "mission_result":
      return <MissionResult room={room} busy={busy} run={run} />;

    default:
      return null;
  }
}

function Stage({ emoji, title, sub, children }) {
  return (
    <Card glow className="text-center py-10 animate-fade-up">
      <div className="text-5xl mb-3">{emoji}</div>
      <Eyebrow>{sub}</Eyebrow>
      <h2 className="text-2xl sm:text-3xl font-black mt-2 mb-4">{title}</h2>
      {children}
    </Card>
  );
}

// ---------- 임무팀 선발 ----------
function MissionSelect({ room, players, busy, run }) {
  const needed = room.mission_sizes[room.round - 1] || 0;
  const [picked, setPicked] = useState([]);

  useEffect(() => {
    setPicked([]);
  }, [room.round]);

  const toggle = (n) =>
    setPicked((cur) =>
      cur.includes(n) ? cur.filter((x) => x !== n) : cur.length < needed ? [...cur, n] : cur
    );

  const nums = useMemo(() => players.map((p) => p.number).sort((a, b) => a - b), [players]);
  const ready = picked.length === needed && needed > 0;

  return (
    <div className="animate-fade-up">
      <Card>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <Eyebrow>ROUND {room.round} · EXPEDITION</Eyebrow>
            <h2 className="text-2xl font-black mt-1">탐사대 선발</h2>
          </div>
          <Pill tone={ready ? "good" : "brand"}>
            {picked.length} / {needed}명 선택
          </Pill>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-8 gap-2.5">
          {nums.map((n) => {
            const on = picked.includes(n);
            return (
              <button
                key={n}
                onClick={() => toggle(n)}
                className={`aspect-square rounded-2xl font-black text-xl border-2 transition-all active:scale-95 ${
                  on
                    ? "bg-brand text-white border-brand shadow-card"
                    : "bg-white text-ink/70 border-ink/10 hover:border-brand/40"
                }`}
              >
                {n}
              </button>
            );
          })}
        </div>

        <Button
          size="xl"
          disabled={!ready || busy}
          onClick={() => run(() => openVote(room.id, room.round, picked))}
          className="w-full mt-6"
        >
          {ready ? "이 탐사대로 투표 시작" : `${needed}명을 선택하세요`}
        </Button>
      </Card>
    </div>
  );
}

// ---------- 승인 투표 (실시간 집계) ----------
function Voting({ room, players, votes, busy, run }) {
  const approve = votes.filter((v) => v.choice === "approve").length;
  const reject = votes.filter((v) => v.choice === "reject").length;
  const voted = approve + reject;
  const total = players.length;

  return (
    <div className="animate-fade-up space-y-5">
      <Card>
        <Eyebrow>ROUND {room.round} · VOTE</Eyebrow>
        <h2 className="text-2xl font-black mt-1 mb-4">이 탐사대를 보낼까요?</h2>
        <div className="flex flex-wrap gap-2">
          {room.mission_team.map((n) => (
            <span key={n} className="w-12 h-12 rounded-xl bg-accent/20 text-[#9a6a14] flex items-center justify-center font-black text-lg">
              {n}
            </span>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-extrabold text-lg">실시간 집계</h3>
          <Pill tone="muted">투표 {voted} / {total}</Pill>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Tally label="찬성" value={approve} tone="good" emoji="👍" />
          <Tally label="반대" value={reject} tone="bad" emoji="👎" />
        </div>
        <Button
          size="xl"
          variant="accent"
          disabled={busy}
          onClick={() => run(() => closeVote(room.id, room.round))}
          className="w-full mt-6"
        >
          투표 마감하고 결과 보기
        </Button>
      </Card>
    </div>
  );
}

function Tally({ label, value, tone, emoji }) {
  const c = tone === "good" ? "text-good bg-good/10" : "text-bad bg-bad/10";
  return (
    <div className={`rounded-2xl py-6 text-center ${c}`}>
      <div className="text-3xl mb-1">{emoji}</div>
      <div className="text-5xl font-black">{value}</div>
      <div className="font-bold text-ink/50 mt-1">{label}</div>
    </div>
  );
}

// ---------- 투표 결과 ----------
function VoteResult({ room, busy, run }) {
  const pass = room.vote_result === "pass";
  return (
    <div className="animate-fade-up">
      <Card glow className="text-center py-10">
        <Eyebrow>ROUND {room.round} · RESULT</Eyebrow>
        <div className="flex items-center justify-center gap-8 my-6">
          <div>
            <div className="text-6xl font-black text-good">{room.vote_pass}</div>
            <div className="font-bold text-ink/50">찬성</div>
          </div>
          <div className="text-4xl text-ink/20">:</div>
          <div>
            <div className="text-6xl font-black text-bad">{room.vote_fail}</div>
            <div className="font-bold text-ink/50">반대</div>
          </div>
        </div>
        <div className={`text-4xl font-black mb-6 ${pass ? "text-good" : "text-bad"}`}>
          {pass ? "✅ 통과" : "🚫 부결"}
        </div>
        {pass ? (
          <Button size="xl" disabled={busy} onClick={() => run(() => startMission(room.id, room.round))}>
            임무 수행 시작
          </Button>
        ) : (
          <Button size="xl" variant="ghost" disabled={busy} onClick={() => run(() => beginRound(room.id, room.round))}>
            탐사대 다시 뽑기
          </Button>
        )}
      </Card>
    </div>
  );
}

// ---------- 임무 수행 ----------
function MissionRun({ room, subs, busy, run }) {
  const teamSize = room.mission_team.length;
  const done = subs.length;
  return (
    <div className="animate-fade-up">
      <Card glow className="text-center py-10">
        <Eyebrow>ROUND {room.round} · MISSION</Eyebrow>
        <h2 className="text-2xl font-black mt-1 mb-2">임무 수행 중</h2>
        <p className="text-ink/50 mb-6">탐사대가 각자 기기에서 결정을 제출합니다</p>

        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {room.mission_team.map((n) => (
            <span key={n} className="w-12 h-12 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-black">
              {n}
            </span>
          ))}
        </div>

        <Pill tone={done === teamSize ? "good" : "brand"}>
          제출 {done} / {teamSize}
        </Pill>

        <div className="mt-6">
          <Button size="xl" variant="accent" disabled={busy} onClick={() => run(() => revealMission(room))}>
            결과 공개
          </Button>
          {done < teamSize && (
            <p className="text-ink/40 text-xs mt-3">아직 제출 안 한 학생이 있어도 공개할 수 있어요.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

// ---------- 임무 결과 ----------
function MissionResult({ room, busy, run }) {
  const last = (room.results || [])[room.results.length - 1];
  if (!last) return null;
  const success = last.result === "success";
  const ended = !!room.winner;

  return (
    <div className="animate-fade-up">
      <Card glow className="text-center py-10">
        <Eyebrow>ROUND {room.round} · OUTCOME</Eyebrow>
        <div className="flex items-center justify-center gap-8 my-6">
          <div>
            <div className="text-5xl font-black text-good">{last.success}</div>
            <div className="font-bold text-ink/50">성공</div>
          </div>
          <div className="text-4xl text-ink/20">:</div>
          <div>
            <div className="text-5xl font-black text-bad">{last.sabotage}</div>
            <div className="font-bold text-ink/50">방해</div>
          </div>
        </div>
        <div className={`text-4xl font-black mb-2 ${success ? "text-good" : "text-bad"}`}>
          {success ? "🎉 임무 성공" : "💥 임무 실패"}
        </div>
        {last.sabotage > 0 && (
          <p className="text-ink/40 text-sm mb-4">방해가 {last.sabotage}건 있어 임무가 실패했습니다.</p>
        )}

        <div className="mt-6">
          {ended ? (
            <Button size="xl" disabled={busy} onClick={() => run(() => proceedAfterResult(room))}>
              최종 결과 보기
            </Button>
          ) : (
            <Button size="xl" disabled={busy} onClick={() => run(() => proceedAfterResult(room))}>
              다음 임무 ({room.round + 1}차) 진행
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
