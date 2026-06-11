import React, { useState } from "react";
import { Screen, Card, Button, Eyebrow } from "./components/common/ui";
import TeacherApp from "./components/teacher/TeacherApp";
import StudentApp from "./components/student/StudentApp";

function readParams() {
  const p = new URLSearchParams(window.location.search);
  return { role: p.get("role"), code: p.get("code") };
}

export default function App() {
  const params = readParams();
  // 학생이 QR로 들어오면 즉시 학생 화면. 그 외엔 역할 선택.
  const [role, setRole] = useState(params.role === "student" || params.role === "teacher" ? params.role : null);

  if (role === "teacher") return <TeacherApp />;
  if (role === "student") return <StudentApp initialCode={params.code || ""} />;

  return <RoleSelect onPick={setRole} />;
}

function RoleSelect({ onPick }) {
  return (
    <Screen className="flex items-center">
      <div className="w-full max-w-xl mx-auto animate-fade-up">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🛸</div>
          <Eyebrow>OPERATION INFILTRATOR</Eyebrow>
          <h1 className="text-4xl sm:text-5xl font-black mt-2 mb-3">외계인 침투 작전</h1>
          <p className="text-ink/60 leading-relaxed">
            지구 연구기지에 정체를 숨긴 침투자들이 숨어들었다.
            <br />
            탐사팀을 꾸려 다섯 번의 임무를 완수하라.
          </p>
        </div>

        <div className="grid gap-4">
          <Card glow className="text-center">
            <div className="text-4xl mb-2">🖥️</div>
            <h2 className="text-xl font-extrabold mb-1">교사 — 진행하기</h2>
            <p className="text-ink/50 text-sm mb-5">전자칠판에서 게임을 만들고 진행합니다</p>
            <Button size="lg" onClick={() => onPick("teacher")} className="w-full">
              게임 만들기
            </Button>
          </Card>

          <Card className="text-center">
            <div className="text-4xl mb-2">📱</div>
            <h2 className="text-xl font-extrabold mb-1">학생 — 참가하기</h2>
            <p className="text-ink/50 text-sm mb-5">QR을 찍거나 입장 코드로 들어옵니다</p>
            <Button size="lg" variant="ghost" onClick={() => onPick("student")} className="w-full">
              참가하기
            </Button>
          </Card>
        </div>
      </div>
    </Screen>
  );
}
