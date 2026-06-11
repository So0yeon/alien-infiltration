import React, { useState } from "react";
import { Card, Button } from "../common/ui";
import { submitMission } from "../../lib/api";

const subKey = (roomId, round) => `infil_sub_${roomId}_${round}`;

export default function MissionScreen({ room, number, role }) {
  const [done, setDone] = useState(() => localStorage.getItem(subKey(room.id, room.round)));
  const [busy, setBusy] = useState(false);
  const isAlien = role === "alien";

  const send = async (choice) => {
    if (done || busy) return;
    if (choice === "sabotage" && !isAlien) return; // 연구원은 방해 불가
    setBusy(true);
    try {
      await submitMission(room.id, room.round, number, choice);
      localStorage.setItem(subKey(room.id, room.round), choice);
      setDone(choice);
    } catch {
      setDone("success");
    }
    setBusy(false);
  };

  if (done) {
    return (
      <Card glow className="text-center py-12 animate-pop">
        <div className="text-6xl mb-3">🛰️</div>
        <h2 className="text-2xl font-black mb-1">제출 완료</h2>
        <p className="text-ink/50">결과 공개를 기다리세요</p>
        <p className="text-ink/30 text-xs mt-3">무엇을 골랐는지는 비밀이에요</p>
      </Card>
    );
  }

  return (
    <div className="animate-pop">
      <Card className="mb-4 text-center">
        <p className="text-sm font-bold text-ink/50 mb-1">{room.round}차 임무</p>
        <p className="text-lg font-black">
          {isAlien ? "성공시킬까, 몰래 방해할까?" : "임무를 성공시키세요"}
        </p>
      </Card>

      <div className="grid gap-4">
        <Button variant="good" size="xl" onClick={() => send("success")} disabled={busy} className="py-10">
          ✅ 성공
        </Button>
        <Button
          variant={isAlien ? "bad" : "ghost"}
          size="xl"
          onClick={() => send("sabotage")}
          disabled={busy || !isAlien}
          className="py-10"
        >
          {isAlien ? "💥 방해" : "🔒 방해 (연구원은 불가)"}
        </Button>
      </div>
    </div>
  );
}
