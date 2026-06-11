import React, { useState } from "react";
import { Card, Button } from "../common/ui";
import { castVote } from "../../lib/api";

const votedKey = (roomId, round) => `infil_voted_${roomId}_${round}`;

export default function VoteScreen({ room, number, onTeam }) {
  const [voted, setVoted] = useState(() => localStorage.getItem(votedKey(room.id, room.round)));
  const [busy, setBusy] = useState(false);

  const vote = async (choice) => {
    if (voted || busy) return;
    setBusy(true);
    try {
      await castVote(room.id, room.round, number, choice);
      localStorage.setItem(votedKey(room.id, room.round), choice);
      setVoted(choice);
    } catch {
      setVoted("approve"); // 실패해도 화면은 잠금(중복 방지) — 서버 unique가 최종 방어
    }
    setBusy(false);
  };

  return (
    <div className="animate-pop">
      <Card className="mb-4">
        <p className="text-sm font-bold text-ink/50 mb-2">{room.round}차 탐사대</p>
        <div className="flex flex-wrap gap-2">
          {(room.mission_team || []).map((n) => (
            <span
              key={n}
              className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg ${
                n === number ? "bg-accent text-ink" : "bg-brand/10 text-brand"
              }`}
            >
              {n}
            </span>
          ))}
        </div>
        {onTeam && <p className="text-accent text-sm font-bold mt-3">⭐ 나도 탐사대에 포함됐어요</p>}
      </Card>

      {voted ? (
        <Card glow className="text-center py-10">
          <div className="text-5xl mb-3">{voted === "approve" ? "👍" : "👎"}</div>
          <h2 className="text-2xl font-black mb-1">제출 완료</h2>
          <p className="text-ink/50">
            {voted === "approve" ? "찬성" : "반대"}에 투표했어요 · 수정할 수 없습니다
          </p>
        </Card>
      ) : (
        <div>
          <p className="text-center font-bold text-ink/60 mb-4">이 탐사대를 보낼까요?</p>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="good" size="xl" onClick={() => vote("approve")} disabled={busy} className="py-10">
              👍<br />찬성
            </Button>
            <Button variant="bad" size="xl" onClick={() => vote("reject")} disabled={busy} className="py-10">
              👎<br />반대
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
