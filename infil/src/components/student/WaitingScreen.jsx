import React from "react";
import { Card } from "../common/ui";

export default function WaitingScreen({ title, message, emoji = "🛰️" }) {
  return (
    <Card glow className="text-center animate-pop py-12">
      <div className="text-6xl mb-4">{emoji}</div>
      <h2 className="text-2xl font-black mb-1">{title}</h2>
      {message && <p className="text-ink/50">{message}</p>}
      <div className="mt-6 flex justify-center gap-1.5">
        <Dot /> <Dot delay="0.2s" /> <Dot delay="0.4s" />
      </div>
    </Card>
  );
}

function Dot({ delay = "0s" }) {
  return (
    <span
      className="w-2.5 h-2.5 rounded-full bg-brand/40 animate-pulse"
      style={{ animationDelay: delay }}
    />
  );
}
