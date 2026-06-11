-- =====================================================================
--  외계인 침투 작전 (Operation Infiltrator) — Supabase 스키마
--  Supabase 대시보드 > SQL Editor 에 붙여넣고 한 번 실행하세요.
--
--  설계 원칙
--   - 개인정보 없음: 학생은 출석번호(정수)만 사용. 닉네임/계정 없음.
--   - 일회성: 교사가 "게임 종료"를 누르면 방(row)을 삭제 → 하위 데이터
--     (학생/투표/제출)가 ON DELETE CASCADE 로 즉시 함께 삭제됩니다.
--   - 기존 프로젝트와 공존: 모든 객체에 infil_ 접두사. 다른 게임 테이블과
--     충돌하지 않습니다.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. 방 (한 교실 = 한 row)
-- ---------------------------------------------------------------------
create table if not exists public.infil_rooms (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,            -- 학생 입장 코드 (4자리)
  phase           text not null default 'lobby',
  -- lobby | role_reveal | mission_select | voting | vote_result
  --       | mission_run | mission_result | ended
  total_players   int  not null default 0,         -- 게임 시작 시 확정 인원
  alien_count     int  not null default 0,         -- 외계인 수 (교사 수정 가능)
  mission_sizes   int[] not null default '{}',     -- 라운드별 임무 인원 [r1..r5]
  round           int  not null default 0,         -- 0=시작 전, 1..5
  mission_team    int[] not null default '{}',     -- 현재 라운드 선발 출석번호
  vote_pass       int  not null default 0,         -- 현재 투표 찬성 수(스냅샷)
  vote_fail       int  not null default 0,         -- 현재 투표 반대 수(스냅샷)
  vote_result     text,                            -- 'pass' | 'fail' | null
  results         jsonb not null default '[]',     -- 라운드별 결과 누적
  -- results 예: [{ "round":1, "team":[3,7,14,22], "success":3, "sabotage":1,
  --               "result":"fail" }, ...]
  winner          text,                            -- 'human' | 'alien' | null
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. 학생 (출석번호 기준)
-- ---------------------------------------------------------------------
create table if not exists public.infil_players (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid not null references public.infil_rooms(id) on delete cascade,
  number     int  not null,                        -- 출석번호
  role       text,                                 -- 'researcher' | 'alien' | null
  client_id  text,                                 -- 재접속 식별 (기기 로컬값)
  last_seen  timestamptz not null default now(),
  joined_at  timestamptz not null default now(),
  unique (room_id, number)
);

-- ---------------------------------------------------------------------
-- 3. 승인 투표 (라운드 × 학생 1표, 중복 방지)
-- ---------------------------------------------------------------------
create table if not exists public.infil_votes (
  id            uuid primary key default gen_random_uuid(),
  room_id       uuid not null references public.infil_rooms(id) on delete cascade,
  round         int  not null,
  player_number int  not null,
  choice        text not null,                     -- 'approve' | 'reject'
  created_at    timestamptz not null default now(),
  unique (room_id, round, player_number)
);

-- ---------------------------------------------------------------------
-- 4. 임무 제출 (임무팀만, 라운드 × 학생 1건)
-- ---------------------------------------------------------------------
create table if not exists public.infil_submissions (
  id            uuid primary key default gen_random_uuid(),
  room_id       uuid not null references public.infil_rooms(id) on delete cascade,
  round         int  not null,
  player_number int  not null,
  choice        text not null,                     -- 'success' | 'sabotage'
  created_at    timestamptz not null default now(),
  unique (room_id, round, player_number)
);

-- 조회 성능용 인덱스
create index if not exists infil_players_room   on public.infil_players(room_id);
create index if not exists infil_votes_room     on public.infil_votes(room_id, round);
create index if not exists infil_subs_room      on public.infil_submissions(room_id, round);

-- ---------------------------------------------------------------------
-- 5. 권한 (RLS)
--    인증/개인정보가 없는 일회성 교실 게임이므로 anon 키로 자유롭게
--    읽고 쓰게 둡니다. 민감 정보가 없고 게임 종료 시 즉시 삭제됩니다.
-- ---------------------------------------------------------------------
alter table public.infil_rooms       enable row level security;
alter table public.infil_players     enable row level security;
alter table public.infil_votes       enable row level security;
alter table public.infil_submissions enable row level security;

do $$
declare t text;
begin
  foreach t in array array['infil_rooms','infil_players','infil_votes','infil_submissions']
  loop
    execute format('drop policy if exists "%s_all" on public.%I;', t, t);
    execute format(
      'create policy "%s_all" on public.%I for all to anon, authenticated using (true) with check (true);',
      t, t);
  end loop;
end $$;

-- 실시간에서 room_id 로 필터링한 UPDATE/DELETE 도 잡히도록 전체 행 식별.
alter table public.infil_players     replica identity full;
alter table public.infil_votes       replica identity full;
alter table public.infil_submissions replica identity full;

-- ---------------------------------------------------------------------
-- 6. 실시간 (Realtime) 발행에 테이블 추가
-- ---------------------------------------------------------------------
do $$
begin
  begin alter publication supabase_realtime add table public.infil_rooms;       exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.infil_players;     exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.infil_votes;       exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.infil_submissions; exception when duplicate_object then null; end;
end $$;

-- ---------------------------------------------------------------------
-- 7. 안전망: 혹시 교사가 종료를 안 누르고 닫았을 때를 대비한 정리 함수.
--    필요 시 대시보드에서 수동 실행하거나 cron(pg_cron)에 걸 수 있습니다.
--    3시간 넘게 갱신 안 된 방을 삭제(하위 데이터 cascade).
-- ---------------------------------------------------------------------
create or replace function public.infil_cleanup_stale()
returns void language sql as $$
  delete from public.infil_rooms
  where updated_at < now() - interval '3 hours';
$$;

-- 초기화가 필요하면 아래 주석을 풀어 실행하세요(모든 진행 중 방 삭제):
-- drop table if exists public.infil_submissions cascade;
-- drop table if exists public.infil_votes cascade;
-- drop table if exists public.infil_players cascade;
-- drop table if exists public.infil_rooms cascade;
