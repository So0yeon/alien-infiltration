import { createClient } from "@supabase/supabase-js";

// 기존에 사용 중인 Supabase 프로젝트를 재사용합니다.
// anon 키는 브라우저에 노출되도록 설계된 "공개 키"라 그대로 담아도 안전합니다.
// (절대 service_role 키는 넣지 마세요.)
// 다른 프로젝트로 바꾸려면 .env 에 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 만 넣으면 됩니다.
const URL =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://evkyiemqdeoaaorynozy.supabase.co";

const ANON =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2a3lpZW1xZGVvYWFvcnlub3p5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3OTI5NTYsImV4cCI6MjA5NjM2ODk1Nn0.VRURNH8nXpK8wpAaDG3YlV7NwqaBDr7CNj9WTbQTdTY";

export const supabase = createClient(URL, ANON, {
  realtime: { params: { eventsPerSecond: 20 } },
});
