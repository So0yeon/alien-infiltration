import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card, Button, Eyebrow, Pill } from "../common/ui";
import { joinUrl } from "../common/QRModal";
import { calcAlienCount, calcMissionSizes } from "../../lib/gameLogic";
import { startGame } from "../../lib/api";

export default function Lobby({ room, players }) {
  const total = players.length;
  const autoAlien = calcAlienCount(total);
  const autoSizes = calcMissionSizes(total);

  const [alien, setAlien] = useState(null); // null = 자동
  const [sizes, setSizes] = useState(null);
  const [busy, setBusy] = useState(false);

  const curAlien = alien ?? autoAlien;
  const curSizes = sizes ?? autoSizes;

  const stepAlien = (d) =>
    setAlien((v) => Math.max(1, Math.min(total - 1, (v ?? autoAlien) + d)));
  const stepSize = (i, d) =>
    setSizes((arr) => {
      const base = [...(arr ?? autoSizes)];
      base[i] = Math.max(1, Math.min(total, base[i] + d));
      return base;
    });

  const start = async () => {
    setBusy(true);
    try {
      await startGame(room, players, { alienCount: curAlien, missionSizes: curSizes });
    } finally {
      setBusy(false);
    }
  };

  const canStart = total >= 4; // 최소 인원 가드(연구원3+외계인1)

  return (
    <div className="grid lg:grid-cols-[1fr,1.1fr] gap-5 animate-fade-up">
      {/* 입장 안내 */}
      <Card glow className="text-center">
        <Eyebrow>SCAN TO JOIN</Eyebrow>
        <div className="mt-4 inline-block bg-white p-4 rounded-xl2 border border-brand/10">
          <QRCodeSVG value={joinUrl(room.code)} size={180} level="M" fgColor="#1F2440" />
        </div>
        <div className="mt-5">
          <p className="text-sm text-ink/50">입장 코드</p>
          <div className="text-6xl font-black tracking-[0.15em] text-brand">{room.code}</div>
        </div>
        <p className="mt-3 text-sm text-ink/40">QR을 찍고 출석번호만 입력하면 끝</p>
      </Card>

      {/* 참가자 + 인원 구성 */}
      <div className="space-y-5">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-extrabold text-lg">참가자</h3>
            <Pill>👥 {total}명</Pill>
          </div>
          {total === 0 ? (
            <p className="text-ink/40 py-6 text-center">아직 들어온 학생이 없어요</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {players.map((p) => (
                <span
                  key={p.id}
                  className="w-11 h-11 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-black animate-pop"
                >
                  {p.number}
                </span>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h3 className="font-extrabold text-lg mb-1">인원 구성</h3>
          <p className="text-ink/40 text-sm mb-4">자동 계산됩니다. 필요하면 바로 고치세요.</p>

          <div className="flex items-center justify-between bg-bad/5 rounded-2xl px-4 py-3 mb-4">
            <div>
              <div className="font-bold">외계인 침투자</div>
              <div className="text-xs text-ink/40">연구원 {Math.max(0, total - curAlien)}명 · 침투자 {curAlien}명</div>
            </div>
            <Stepper value={curAlien} onMinus={() => stepAlien(-1)} onPlus={() => stepAlien(1)} tone="bad" />
          </div>

          <div className="text-sm font-bold text-ink/50 mb-2">라운드별 임무 인원</div>
          <div className="grid grid-cols-5 gap-2">
            {curSizes.map((s, i) => (
              <div key={i} className="bg-brand/5 rounded-xl p-2 text-center">
                <div className="text-[11px] text-ink/40 font-bold mb-1">{i + 1}차</div>
                <div className="text-2xl font-black text-brand">{s}</div>
                <div className="flex justify-center gap-1 mt-1">
                  <button onClick={() => stepSize(i, -1)} className="w-6 h-6 rounded-md bg-white border border-brand/20 text-brand font-black leading-none">−</button>
                  <button onClick={() => stepSize(i, 1)} className="w-6 h-6 rounded-md bg-white border border-brand/20 text-brand font-black leading-none">+</button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Button size="xl" onClick={start} disabled={!canStart || busy} className="w-full">
          {busy ? "역할 배정 중…" : canStart ? "🎲 역할 배정하고 시작" : "최소 4명이 필요해요"}
        </Button>
      </div>
    </div>
  );
}

function Stepper({ value, onMinus, onPlus, tone = "brand" }) {
  const color = tone === "bad" ? "text-bad" : "text-brand";
  return (
    <div className="flex items-center gap-2">
      <button onClick={onMinus} className="w-9 h-9 rounded-xl bg-white border-2 border-ink/10 font-black text-xl leading-none">−</button>
      <span className={`w-10 text-center text-2xl font-black ${color}`}>{value}</span>
      <button onClick={onPlus} className="w-9 h-9 rounded-xl bg-white border-2 border-ink/10 font-black text-xl leading-none">+</button>
    </div>
  );
}
