import React, { useState } from "react";
import { Screen, Card, Button, Eyebrow } from "../common/ui";
import { getRoomByCode, joinRoom } from "../../lib/api";

export default function JoinScreen({ initialCode, clientId, onJoined }) {
  const [code, setCode] = useState((initialCode || "").toUpperCase());
  const [number, setNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const codeLocked = !!initialCode;

  const onlyDigits = (v) => v.replace(/[^0-9]/g, "").slice(0, 3);

  const submit = async () => {
    setError("");
    const c = code.trim().toUpperCase();
    const n = parseInt(number, 10);
    if (c.length < 4) return setError("입장 코드를 확인하세요.");
    if (!number || isNaN(n) || n < 1) return setError("출석번호를 입력하세요.");

    setBusy(true);
    try {
      const room = await getRoomByCode(c);
      if (!room) {
        setBusy(false);
        return setError("그런 입장 코드가 없어요. 교사 화면을 확인하세요.");
      }
      await joinRoom(room.id, n, clientId);
      onJoined({ code: c, roomId: room.id, number: n });
    } catch (e) {
      setBusy(false);
      setError("입장에 실패했어요. 잠시 후 다시 시도하세요.");
    }
  };

  return (
    <Screen className="flex items-center">
      <div className="w-full max-w-sm mx-auto animate-fade-up">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🛸</div>
          <Eyebrow>JOIN THE STATION</Eyebrow>
          <h1 className="text-2xl font-black mt-1">연구기지 입장</h1>
        </div>

        <Card>
          {!codeLocked && (
            <div className="mb-5">
              <label className="block text-sm font-bold text-ink/60 mb-2">입장 코드</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 4))}
                placeholder="ABCD"
                autoCapitalize="characters"
                className="w-full text-center text-3xl font-black tracking-[0.3em] py-4 rounded-2xl border-2 border-brand/20 focus:border-brand outline-none uppercase"
              />
            </div>
          )}
          {codeLocked && (
            <div className="mb-5 text-center">
              <span className="text-sm text-ink/50">입장 코드</span>
              <div className="text-3xl font-black tracking-[0.2em] text-brand">{code}</div>
            </div>
          )}

          <label className="block text-sm font-bold text-ink/60 mb-2">출석번호를 입력하세요</label>
          <input
            value={number}
            onChange={(e) => setNumber(onlyDigits(e.target.value))}
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="번호"
            className="w-full text-center text-4xl font-black py-4 rounded-2xl border-2 border-brand/20 focus:border-brand outline-none"
          />

          {error && <p className="text-bad text-sm font-bold mt-3 text-center">{error}</p>}

          <Button size="lg" onClick={submit} disabled={busy} className="w-full mt-6">
            {busy ? "입장 중…" : "입장하기"}
          </Button>
        </Card>
      </div>
    </Screen>
  );
}
