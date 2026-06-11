import React, { useEffect, useState } from "react";
import { Screen, Card, Button, Eyebrow, Pill } from "../common/ui";
import QRModal from "../common/QRModal";
import { MissionBoard, TeamHistory } from "../common/VictoryBoard";
import { useRoom, usePlayers } from "../../lib/hooks";
import { createRoom, getRoomById, endAndDelete } from "../../lib/api";
import Lobby from "./Lobby";
import RoundFlow from "./RoundFlow";
import { PHASE_LABEL } from "../../lib/gameLogic";

const HOST_KEY = "infil_host_room";

export default function TeacherApp() {
  const [roomId, setRoomId] = useState(null);
  const [booting, setBooting] = useState(true);
  const [creating, setCreating] = useState(false);

  // 재접속: 마지막 진행 방 복구
  useEffect(() => {
    const saved = localStorage.getItem(HOST_KEY);
    if (!saved) return setBooting(false);
    getRoomById(saved).then((r) => {
      if (r) setRoomId(saved);
      else localStorage.removeItem(HOST_KEY);
      setBooting(false);
    });
  }, []);

  const create = async () => {
    setCreating(true);
    try {
      const room = await createRoom();
      localStorage.setItem(HOST_KEY, room.id);
      setRoomId(room.id);
    } finally {
      setCreating(false);
    }
  };

  const reset = () => {
    localStorage.removeItem(HOST_KEY);
    setRoomId(null);
  };

  if (booting) {
    return (
      <Screen className="flex items-center">
        <Card className="mx-auto max-w-sm text-center">
          <div className="text-4xl animate-pulse">🛰️</div>
        </Card>
      </Screen>
    );
  }

  if (!roomId) return <CreateGame onCreate={create} creating={creating} />;

  return <TeacherStage roomId={roomId} onReset={reset} />;
}

function CreateGame({ onCreate, creating }) {
  return (
    <Screen className="flex items-center">
      <div className="w-full max-w-lg mx-auto animate-fade-up text-center">
        <div className="text-6xl mb-4">🖥️</div>
        <Eyebrow>TEACHER CONSOLE</Eyebrow>
        <h1 className="text-3xl sm:text-4xl font-black mt-2 mb-3">게임 만들기</h1>
        <p className="text-ink/60 mb-8 leading-relaxed">
          버튼을 누르면 입장 코드와 QR이 생성됩니다.
          <br />
          학생들은 QR을 찍어 출석번호로 바로 들어옵니다.
        </p>
        <Button size="xl" onClick={onCreate} disabled={creating}>
          {creating ? "생성 중…" : "🚀 새 게임 시작"}
        </Button>
      </div>
    </Screen>
  );
}

function TeacherStage({ roomId, onReset }) {
  const { room, loading } = useRoom(roomId);
  const [players] = usePlayers(roomId);
  const [showQR, setShowQR] = useState(false);

  if (loading || !room) {
    return (
      <Screen className="flex items-center">
        <Card className="mx-auto max-w-sm text-center">
          <div className="text-4xl animate-pulse">🛰️</div>
          <p className="text-ink/50 mt-3">불러오는 중…</p>
        </Card>
      </Screen>
    );
  }

  const started = room.phase !== "lobby";
  const showBoard = started && room.phase !== "role_reveal";

  const endGame = async () => {
    if (!confirm("게임을 종료하면 모든 데이터가 즉시 삭제됩니다. 계속할까요?")) return;
    await endAndDelete(roomId);
    onReset();
  };

  return (
    <Screen>
      {/* 상단 고정 바: 코드/단계 + 항상 보이는 QR 버튼 */}
      <div className="sticky top-0 z-30 -mx-4 px-4 sm:-mx-6 sm:px-6 py-3 bg-base/80 backdrop-blur-md mb-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛸</span>
            <div>
              <div className="font-black text-lg leading-none">
                코드 <span className="text-brand tracking-widest">{room.code}</span>
              </div>
              <div className="text-xs text-ink/40 font-bold mt-0.5">{PHASE_LABEL[room.phase]}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Pill tone="muted">👥 {players.length}명</Pill>
            <Button size="sm" variant="accent" onClick={() => setShowQR(true)}>
              📷 접속 QR
            </Button>
            <Button size="sm" variant="ghost" onClick={endGame}>
              종료
            </Button>
          </div>
        </div>
      </div>

      {showBoard && (
        <div className="mb-4">
          <MissionBoard results={room.results} totalRounds={5} currentRound={room.round} />
        </div>
      )}

      {/* 단계별 본문 */}
      {room.phase === "lobby" ? (
        <Lobby room={room} players={players} />
      ) : room.phase === "ended" ? (
        <Ended room={room} onEnd={endGame} />
      ) : (
        <RoundFlow room={room} players={players} />
      )}

      {/* 탐사대 기록 — 진행 내내 칠판에 남김 */}
      {showBoard && (room.results || []).length > 0 && (
        <div className="mt-5">
          <TeamHistory results={room.results} />
        </div>
      )}

      {showQR && <QRModal code={room.code} onClose={() => setShowQR(false)} />}
    </Screen>
  );
}

function Ended({ room, onEnd }) {
  const human = room.winner === "human";
  return (
    <div className="animate-fade-up">
      <Card glow className="text-center py-12">
        <div className="text-7xl mb-4">{human ? "🏆" : "👽"}</div>
        <Eyebrow>MISSION COMPLETE</Eyebrow>
        <h1 className={`text-4xl sm:text-5xl font-black mt-2 ${human ? "text-good" : "text-bad"}`}>
          {human ? "인간팀 승리!" : "침투자팀 승리!"}
        </h1>
        <p className="text-ink/50 mt-3">
          {human ? "탐사대가 기지를 지켜냈습니다." : "침투자들이 임무를 무너뜨렸습니다."}
        </p>
        <div className="mt-8">
          <Button size="lg" variant="bad" onClick={onEnd}>
            게임 종료 · 데이터 삭제
          </Button>
        </div>
        <p className="text-ink/30 text-xs mt-3">종료하면 서버에서 모든 기록이 사라집니다.</p>
      </Card>
    </div>
  );
}
