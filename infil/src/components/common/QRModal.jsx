import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "./ui";

export function joinUrl(code) {
  const base = window.location.origin + window.location.pathname;
  return `${base}?role=student&code=${code}`;
}

export default function QRModal({ code, onClose }) {
  const url = joinUrl(code);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4 animate-pop"
      onClick={onClose}
    >
      <div
        className="bg-panel rounded-xl3 p-8 sm:p-12 max-w-2xl w-full text-center shadow-glow"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs font-bold tracking-[0.25em] text-brand/60 uppercase mb-2">JOIN THE STATION</p>
        <h2 className="text-2xl sm:text-3xl font-extrabold mb-1">QR을 찍어 입장하세요</h2>
        <p className="text-ink/50 mb-6">튕긴 친구도 다시 들어올 수 있어요</p>

        <div className="inline-block bg-white p-5 rounded-xl2 border border-brand/10">
          <QRCodeSVG value={url} size={260} level="M" fgColor="#1F2440" />
        </div>

        <div className="mt-6">
          <p className="text-sm text-ink/50 mb-1">입장 코드</p>
          <div className="text-6xl sm:text-7xl font-black tracking-[0.15em] text-brand">{code}</div>
        </div>

        <p className="mt-4 text-sm text-ink/40 break-all px-4">{url}</p>

        <div className="mt-8">
          <Button variant="ghost" size="lg" onClick={onClose}>
            닫기
          </Button>
        </div>
      </div>
    </div>
  );
}
