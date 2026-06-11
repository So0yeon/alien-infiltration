import React, { useEffect, useMemo, useState } from "react";
import { Screen, Card, Eyebrow } from "../common/ui";
import { useRoom, useSelf } from "../../lib/hooks";
import { joinRoom } from "../../lib/api";
import JoinScreen from "./JoinScreen";
import WaitingScreen from "./WaitingScreen";
import RoleCard from "./RoleCard";
import VoteScreen from "./VoteScreen";
import MissionScreen from "./MissionScreen";

function clientId() {
  let id = localStorage.getItem("infil_client_id");
  if (!id) {
    id = "c_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("infil_client_id", id);
  }
  return id;
}

const saveKey = (code) => `infil_student_${code.toUpperCase()}`;

export default function StudentApp({ initialCode }) {
  const [session, setSession] = useState(() => {
    // 같은 코드로 들어온 적 있으면 재접속 정보 복원
    if (initialCode) {
      const raw = localStorage.getItem(saveKey(initialCode));
      if (raw) {
        try {
          return JSON.parse(raw);
        } catch {}
      }
    }
    return null;
  });

  const { room, loading } = useRoom(session?.roomId);
  const self = useSelf(session?.roomId, session?.number);

  // 재접속 시 last_seen 갱신(명단 유지)
  useEffect(() => {
    if (session?.roomId && session?.number != null) {
      joinRoom(session.roomId, session.number, clientId()).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.roomId]);

  const handleJoined = (info) => {
    localStorage.setItem(saveKey(info.code), JSON.stringify(info));
    setSession(info);
  };

  const leave = () => {
    if (session?.code) localStorage.removeItem(saveKey(session.code));
    setSession(null);
  };

  if (!session) {
    return <JoinScreen initialCode={initialCode} clientId={clientId()} onJoined={handleJoined} />;
  }

  if (loading) {
    return (
      <Screen className="flex items-center">
        <Card className="mx-auto max-w-sm text-center animate-pop">
          <div className="text-4xl mb-3 animate-pulse">🛰️</div>
          <p className="text-ink/60">연결 중…</p>
        </Card>
      </Screen>
    );
  }

  // 방이 사라짐 = 교사가 게임을 종료함
  if (!room) {
    return (
      <Screen className="flex items-center">
        <Card className="mx-auto max-w-sm text-center animate-pop">
          <div className="text-4xl mb-3">🌙</div>
          <h2 className="text-xl font-extrabold mb-2">게임이 끝났어요</h2>
          <p className="text-ink/50 mb-5">교사 화면에서 게임이 종료되었습니다.</p>
          <button onClick={leave} className="text-brand font-bold underline underline-offset-4">
            처음으로
          </button>
        </Card>
      </Screen>
    );
  }

  return <StudentStage room={room} self={self} number={session.number} />;
}

function StudentStage({ room, self, number }) {
  const onTeam = useMemo(
    () => (room.mission_team || []).includes(number),
    [room.mission_team, number]
  );

  const header = (
    <div className="flex items-center justify-between mb-5">
      <Eyebrow>STATION · {room.code}</Eyebrow>
      <div className="px-3 py-1 rounded-full bg-brand text-white font-black text-lg">{number}번</div>
    </div>
  );

  let body;
  switch (room.phase) {
    case "lobby":
      body = <WaitingScreen title="입장 완료" message="교사의 시작을 기다리세요" emoji="🚀" />;
      break;
    case "role_reveal":
      body = <RoleCard role={self?.role} />;
      break;
    case "mission_select":
      body = <WaitingScreen title="탐사대 선발 중" message="누가 임무를 갈지 정하고 있어요" emoji="🔭" />;
      break;
    case "voting":
      body = <VoteScreen room={room} number={number} onTeam={onTeam} />;
      break;
    case "vote_result":
      body = (
        <WaitingScreen
          title={room.vote_result === "pass" ? "탐사대 통과" : "탐사대 부결"}
          message={room.vote_result === "pass" ? "임무를 준비하세요" : "다시 탐사대를 정합니다"}
          emoji={room.vote_result === "pass" ? "✅" : "🚫"}
        />
      );
      break;
    case "mission_run":
      body = onTeam ? (
        <MissionScreen room={room} number={number} role={self?.role} />
      ) : (
        <WaitingScreen title="임무 수행 중" message="탐사대의 결정을 기다려요" emoji="🛰️" />
      );
      break;
    case "mission_result": {
      const last = (room.results || [])[room.results.length - 1];
      body = (
        <WaitingScreen
          title={last?.result === "success" ? "임무 성공!" : "임무 실패…"}
          message="다음 임무를 기다리세요"
          emoji={last?.result === "success" ? "🎉" : "💥"}
        />
      );
      break;
    }
    case "ended":
      body = (
        <WaitingScreen
          title={room.winner === "human" ? "인간팀 승리!" : "침투자팀 승리!"}
          message="게임이 끝났습니다"
          emoji={room.winner === "human" ? "🏆" : "👽"}
        />
      );
      break;
    default:
      body = <WaitingScreen title="대기 중" message="" emoji="🛰️" />;
  }

  return (
    <Screen className="flex items-center">
      <div className="w-full max-w-md mx-auto">
        {header}
        {body}
      </div>
    </Screen>
  );
}
