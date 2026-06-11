// =====================================================================
//  순수 게임 로직 — 하드코딩된 인원수 없이 "참가 인원" 기준으로 동적 계산.
//  학급 운영 편의성과 이해하기 쉬운 규칙을 게임 밸런스보다 우선한다.
// =====================================================================

// 라운드별 임무 인원 비율 (전체 인원 대비)
export const MISSION_RATIOS = [0.15, 0.18, 0.22, 0.26, 0.3];

// 외계인 비율 (약 20~25%, 1:3~1:4)
export const ALIEN_RATIO = 0.22;

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 외계인 수: 전체의 약 22%, 최소 1명, 연구원이 항상 과반이 되도록 상한.
export function calcAlienCount(total) {
  if (total <= 0) return 0;
  const raw = Math.round(total * ALIEN_RATIO);
  const maxAlien = Math.max(1, Math.ceil(total / 2) - 1); // 연구원 과반 보장
  return clamp(raw, 1, maxAlien);
}

// 라운드별 임무 인원: 비율로 계산, 최소 2명, 전체 인원 이내.
export function calcMissionSizes(total) {
  return MISSION_RATIOS.map((r) => clamp(Math.round(total * r), 2, Math.max(2, total)));
}

// 임무 판정: 방해(sabotage)가 1건이라도 있으면 임무 실패.
export function evaluateMission(submissions) {
  const success = submissions.filter((s) => s.choice === "success").length;
  const sabotage = submissions.filter((s) => s.choice === "sabotage").length;
  return { success, sabotage, result: sabotage >= 1 ? "fail" : "success" };
}

// 누적 결과로 승패 판정: 성공 3회 → 인간 승리, 실패 3회 → 침투자 승리.
export function checkWinner(results) {
  const win = results.filter((r) => r.result === "success").length;
  const lose = results.filter((r) => r.result === "fail").length;
  if (win >= 3) return "human";
  if (lose >= 3) return "alien";
  return null;
}

// 현재까지의 성공/실패 카운트
export function tally(results) {
  return {
    win: results.filter((r) => r.result === "success").length,
    lose: results.filter((r) => r.result === "fail").length,
  };
}

// 4자리 입장 코드 (혼동되는 글자 제외)
export function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// 역할 랜덤 배정: 외계인 alienCount명, 나머지 연구원.
export function assignRoles(playerNumbers, alienCount) {
  const shuffled = [...playerNumbers].sort(() => Math.random() - 0.5);
  const aliens = new Set(shuffled.slice(0, alienCount));
  return playerNumbers.map((number) => ({
    number,
    role: aliens.has(number) ? "alien" : "researcher",
  }));
}

export const ROLE_LABEL = { researcher: "연구원", alien: "외계인" };
export const PHASE_LABEL = {
  lobby: "대기",
  role_reveal: "역할 확인",
  mission_select: "임무팀 선발",
  voting: "승인 투표",
  vote_result: "투표 결과",
  mission_run: "임무 수행",
  mission_result: "임무 결과",
  ended: "게임 종료",
};
