import { supabase } from "./supabase";
import {
  generateCode,
  calcAlienCount,
  calcMissionSizes,
  assignRoles as buildRoles,
  evaluateMission,
  checkWinner,
} from "./gameLogic";

const ROOMS = "infil_rooms";
const PLAYERS = "infil_players";
const VOTES = "infil_votes";
const SUBS = "infil_submissions";

const touch = () => ({ updated_at: new Date().toISOString() });

// ---------- 교사: 방 생성 ----------
export async function createRoom() {
  // 코드 충돌이 나면 몇 번 재시도
  for (let i = 0; i < 6; i++) {
    const code = generateCode();
    const { data, error } = await supabase
      .from(ROOMS)
      .insert({ code, phase: "lobby" })
      .select()
      .single();
    if (!error) return data;
    if (error.code !== "23505") throw error; // unique 위반이 아니면 진짜 에러
  }
  throw new Error("입장 코드를 만들지 못했습니다. 다시 시도해 주세요.");
}

export async function getRoomByCode(code) {
  const { data } = await supabase
    .from(ROOMS)
    .select()
    .eq("code", code.toUpperCase())
    .maybeSingle();
  return data;
}

export async function getRoomById(id) {
  const { data } = await supabase.from(ROOMS).select().eq("id", id).maybeSingle();
  return data;
}

// ---------- 학생: 입장 (출석번호 기준 upsert, 재접속 지원) ----------
export async function joinRoom(roomId, number, clientId) {
  const { data, error } = await supabase
    .from(PLAYERS)
    .upsert(
      { room_id: roomId, number, client_id: clientId, last_seen: new Date().toISOString() },
      { onConflict: "room_id,number" }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getPlayers(roomId) {
  const { data } = await supabase
    .from(PLAYERS)
    .select()
    .eq("room_id", roomId)
    .order("number");
  return data || [];
}

export async function getSelf(roomId, number) {
  const { data } = await supabase
    .from(PLAYERS)
    .select()
    .eq("room_id", roomId)
    .eq("number", number)
    .maybeSingle();
  return data;
}

// ---------- 교사: 게임 시작 (역할 배정) ----------
export async function startGame(room, players, opts = {}) {
  const numbers = players.map((p) => p.number);
  const total = numbers.length;
  const alienCount = opts.alienCount ?? calcAlienCount(total);
  const missionSizes = opts.missionSizes ?? calcMissionSizes(total);

  const roles = buildRoles(numbers, alienCount);
  // 각 학생 역할 저장
  await Promise.all(
    roles.map((r) =>
      supabase.from(PLAYERS).update({ role: r.role }).eq("room_id", room.id).eq("number", r.number)
    )
  );

  const { data } = await supabase
    .from(ROOMS)
    .update({
      phase: "role_reveal",
      total_players: total,
      alien_count: alienCount,
      mission_sizes: missionSizes,
      round: 0,
      results: [],
      winner: null,
      ...touch(),
    })
    .eq("id", room.id)
    .select()
    .single();
  return data;
}

// ---------- 교사: 라운드 시작 → 임무팀 선발 단계 ----------
export async function beginRound(roomId, round) {
  const { data } = await supabase
    .from(ROOMS)
    .update({
      phase: "mission_select",
      round,
      mission_team: [],
      vote_pass: 0,
      vote_fail: 0,
      vote_result: null,
      ...touch(),
    })
    .eq("id", roomId)
    .select()
    .single();
  return data;
}

// ---------- 교사: 임무팀 확정 → 투표 시작 ----------
export async function openVote(roomId, round, team) {
  // 이전 투표 기록 정리(재투표 대비)
  await supabase.from(VOTES).delete().eq("room_id", roomId).eq("round", round);
  const { data } = await supabase
    .from(ROOMS)
    .update({ phase: "voting", mission_team: team, vote_pass: 0, vote_fail: 0, vote_result: null, ...touch() })
    .eq("id", roomId)
    .select()
    .single();
  return data;
}

// ---------- 학생: 승인 투표 ----------
export async function castVote(roomId, round, number, choice) {
  const { error } = await supabase
    .from(VOTES)
    .insert({ room_id: roomId, round, player_number: number, choice });
  // 중복(이미 투표함)은 조용히 무시
  if (error && error.code !== "23505") throw error;
}

export async function getVotes(roomId, round) {
  const { data } = await supabase
    .from(VOTES)
    .select()
    .eq("room_id", roomId)
    .eq("round", round);
  return data || [];
}

// ---------- 교사: 투표 마감 → 결과 ----------
export async function closeVote(roomId, round) {
  const votes = await getVotes(roomId, round);
  const pass = votes.filter((v) => v.choice === "approve").length;
  const fail = votes.filter((v) => v.choice === "reject").length;
  const result = pass > fail ? "pass" : "fail"; // 동점은 부결
  const { data } = await supabase
    .from(ROOMS)
    .update({ phase: "vote_result", vote_pass: pass, vote_fail: fail, vote_result: result, ...touch() })
    .eq("id", roomId)
    .select()
    .single();
  return data;
}

// ---------- 교사: 임무 수행 시작 (통과 시) ----------
export async function startMission(roomId, round) {
  await supabase.from(SUBS).delete().eq("room_id", roomId).eq("round", round);
  const { data } = await supabase
    .from(ROOMS)
    .update({ phase: "mission_run", ...touch() })
    .eq("id", roomId)
    .select()
    .single();
  return data;
}

// ---------- 학생: 임무 제출 ----------
export async function submitMission(roomId, round, number, choice) {
  const { error } = await supabase
    .from(SUBS)
    .insert({ room_id: roomId, round, player_number: number, choice });
  if (error && error.code !== "23505") throw error;
}

export async function getSubmissions(roomId, round) {
  const { data } = await supabase
    .from(SUBS)
    .select()
    .eq("room_id", roomId)
    .eq("round", round);
  return data || [];
}

// ---------- 교사: 임무 결과 공개 ----------
export async function revealMission(room) {
  const round = room.round;
  const subs = await getSubmissions(room.id, round);
  const { success, sabotage, result } = evaluateMission(subs);
  const entry = { round, team: room.mission_team, success, sabotage, result };
  const results = [...(room.results || []), entry];
  const winner = checkWinner(results);
  const isLast = round >= 5;
  const { data } = await supabase
    .from(ROOMS)
    .update({
      phase: "mission_result",
      results,
      winner: winner || (isLast ? finalWinner(results) : null),
      ...touch(),
    })
    .eq("id", room.id)
    .select()
    .single();
  return data;
}

// 5라운드까지 갔는데 3승/3패가 안 났을 때(이론상 드묾): 성공 수가 많으면 인간.
function finalWinner(results) {
  const win = results.filter((r) => r.result === "success").length;
  const lose = results.filter((r) => r.result === "fail").length;
  return win >= lose ? "human" : "alien";
}

// ---------- 교사: 다음 단계 진행 ----------
export async function proceedAfterResult(room) {
  if (room.winner) {
    const { data } = await supabase
      .from(ROOMS)
      .update({ phase: "ended", ...touch() })
      .eq("id", room.id)
      .select()
      .single();
    return data;
  }
  return beginRound(room.id, room.round + 1);
}

// ---------- 교사: 게임 종료 → 방 삭제 (cascade 로 전부 삭제) ----------
export async function endAndDelete(roomId) {
  await supabase.from(ROOMS).delete().eq("id", roomId);
}

// ---------- 교사: 인원 구성 수동 수정 (시작 전) ----------
export async function updateSetup(roomId, { alienCount, missionSizes }) {
  const patch = { ...touch() };
  if (alienCount != null) patch.alien_count = alienCount;
  if (missionSizes != null) patch.mission_sizes = missionSizes;
  const { data } = await supabase.from(ROOMS).update(patch).eq("id", roomId).select().single();
  return data;
}
