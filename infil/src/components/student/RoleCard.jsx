import React, { useState } from "react";
import { Card } from "../common/ui";
import { ROLE_LABEL } from "../../lib/gameLogic";

export default function RoleCard({ role }) {
  const [revealed, setRevealed] = useState(false);
  const isAlien = role === "alien";

  if (!role) {
    return (
      <Card className="text-center py-12 animate-pop">
        <div className="text-5xl mb-3 animate-pulse">🛰️</div>
        <p className="text-ink/60">역할을 배정하는 중…</p>
      </Card>
    );
  }

  return (
    <div className="animate-pop">
      <p className="text-center text-ink/50 mb-3 text-sm">버튼을 눌러 내 정체를 확인하세요</p>
      <button
        onClick={() => setRevealed((v) => !v)}
        className={`w-full rounded-xl3 py-16 px-6 border-2 transition-all duration-200 active:scale-[.98] ${
          revealed
            ? isAlien
              ? "bg-bad/10 border-bad shadow-glow"
              : "bg-brand/10 border-brand shadow-glow"
            : "bg-panel border-brand/20 shadow-card"
        }`}
      >
        {revealed ? (
          <div className="animate-pop">
            <div className="text-7xl mb-3">{isAlien ? "👽" : "🔬"}</div>
            <div className={`text-4xl font-black ${isAlien ? "text-bad" : "text-brand"}`}>
              {ROLE_LABEL[role]}
            </div>
            <p className="text-ink/50 mt-3 text-sm">
              {isAlien ? "임무에서 몰래 방해할 수 있어요" : "임무를 성공시키세요"}
            </p>
          </div>
        ) : (
          <div>
            <div className="text-6xl mb-3">🔒</div>
            <div className="text-3xl font-black text-ink/70">내 역할</div>
            <p className="text-ink/40 mt-2 text-sm">눌러서 확인</p>
          </div>
        )}
      </button>
      <p className="text-center text-ink/40 text-xs mt-4">
        주변 친구가 못 보게 가리고 확인하세요. 다시 누르면 숨겨집니다.
      </p>
    </div>
  );
}
