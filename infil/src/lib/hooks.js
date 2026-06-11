import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "./supabase";
import { getRoomById, getPlayers, getVotes, getSubmissions } from "./api";

// 공용: 특정 테이블의 room_id 변경을 구독하고, 바뀔 때마다 fetch 로 새로고침.
function useLiveList(table, roomId, round, fetcher) {
  const [items, setItems] = useState([]);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refresh = useCallback(async () => {
    if (!roomId) return;
    const data = await fetcherRef.current();
    setItems(data);
  }, [roomId, round]);

  useEffect(() => {
    if (!roomId) return;
    refresh();
    const ch = supabase
      .channel(`infil-${table}-${roomId}-${round ?? "x"}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter: `room_id=eq.${roomId}` },
        () => refresh()
      )
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [table, roomId, round, refresh]);

  return [items, refresh];
}

// 방(단일 row) 구독 — 학생/교사 모두 사용. phase 등 모든 상태의 단일 진실원.
export function useRoom(roomId) {
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!roomId) return;
    const data = await getRoomById(roomId);
    setRoom(data);
    setLoading(false);
  }, [roomId]);

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }
    refresh();
    const ch = supabase
      .channel(`infil-room-${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "infil_rooms", filter: `id=eq.${roomId}` },
        (payload) => {
          if (payload.eventType === "DELETE") setRoom(null);
          else setRoom(payload.new);
        }
      )
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [roomId, refresh]);

  return { room, loading, refresh };
}

export function usePlayers(roomId) {
  return useLiveList("infil_players", roomId, null, () => getPlayers(roomId));
}

export function useVotes(roomId, round) {
  return useLiveList("infil_votes", roomId, round, () => getVotes(roomId, round));
}

export function useSubmissions(roomId, round) {
  return useLiveList("infil_submissions", roomId, round, () => getSubmissions(roomId, round));
}

// 학생 본인 정보(역할 등) 구독 — 방 player 변경 시 본인 row 갱신.
export function useSelf(roomId, number) {
  const [self, setSelf] = useState(null);

  const refresh = useCallback(async () => {
    if (!roomId || number == null) return;
    const { data } = await supabase
      .from("infil_players")
      .select()
      .eq("room_id", roomId)
      .eq("number", number)
      .maybeSingle();
    setSelf(data);
  }, [roomId, number]);

  useEffect(() => {
    if (!roomId || number == null) return;
    refresh();
    const ch = supabase
      .channel(`infil-self-${roomId}-${number}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "infil_players", filter: `room_id=eq.${roomId}` },
        () => refresh()
      )
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [roomId, number, refresh]);

  return self;
}
