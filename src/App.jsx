import { useState, useRef, useEffect, useCallback } from "react";

/* ── 색상 팔레트 ─────────────────────────────────── */
const C = {
  bg: "#09090f", surface: "#111118", card: "#16161f", border: "#1e1e2e",
  accent: "#4ade80", accentDim: "#14532d",
  amber: "#fbbf24", amberDim: "#78350f",
  blue: "#60a5fa", blueDim: "#1e3a5f",
  purple: "#a78bfa", purpleDim: "#3b1f6e",
  red: "#f87171", redDim: "#7f1d1d",
  text: "#e2e8f0", muted: "#4b5563", subtle: "#94a3b8",
};

/* ── 번역 언어 목록 ──────────────────────────────── */
const LANGS = [
  { code: "en", label: "English",    flag: "🇺🇸" },
  { code: "ja", label: "日本語",      flag: "🇯🇵" },
  { code: "zh", label: "中文",        flag: "🇨🇳" },
  { code: "es", label: "Español",    flag: "🇪🇸" },
  { code: "fr", label: "Français",   flag: "🇫🇷" },
  { code: "de", label: "Deutsch",    flag: "🇩🇪" },
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { code: "th", label: "ภาษาไทย",   flag: "🇹🇭" },
];

/* ── 글로벌 CSS ──────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Noto+Sans+KR:wght@400;500;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #09090f; }
  @keyframes wave    { 0%,100%{transform:scaleY(.25)} 50%{transform:scaleY(1)} }
  @keyframes bgwave  { 0%,100%{transform:scaleY(.15)} 50%{transform:scaleY(.45)} }
  @keyframes rec-dot { 0%,100%{opacity:1;box-shadow:0 0 0 0 #f87171cc} 50%{opacity:.7;box-shadow:0 0 0 8px #f8717100} }
  @keyframes amb-dot { 0%,100%{opacity:1;box-shadow:0 0 0 0 #fbbf24cc} 50%{opacity:.7;box-shadow:0 0 0 8px #fbbf2400} }
  @keyframes fadein  { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes blink   { 0%,100%{opacity:.7} 50%{opacity:.2} }
  textarea { font-family:'Noto Sans KR',sans-serif; resize: none; outline: none; }
  button   { font-family:'Noto Sans KR',sans-serif; cursor: pointer; }
  ::-webkit-scrollbar{width:4px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:#1e1e2e;border-radius:4px}
  .tab-btn { transition: all .15s ease; }
  .tab-btn:hover { opacity:.85; }
  .lang-chip { transition: all .15s ease; }
  .lang-chip:hover { transform: translateY(-1px); }
`;

/* ── 유틸 컴포넌트 ───────────────────────────────── */
function Spinner({ color = C.accent }) {
  return (
    <div style={{
      width: 14, height: 14, borderRadius: "50%",
      border: `2px solid #2a2a3a`, borderTopColor: color,
      animation: "spin .8s linear infinite", flexShrink: 0,
    }} />
  );
}

function Wave({ active, bg }) {
  const h = [.3, .65, 1, .8, .5, .9, .4, .75, 1, .55];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, height: 36 }}>
      {h.map((v, i) => (
        <div key={i} style={{
          width: 3, height: 36 * v, borderRadius: 3, transformOrigin: "center",
          background: active ? C.accent : bg ? C.amber + "77" : C.muted + "33",
          animation: active
            ? `wave ${.55 + i * .07}s ease-in-out infinite`
            : bg ? `bgwave ${1.1 + i * .1}s ease-in-out infinite` : "none",
          animationDelay: `${i * .08}s`,
        }} />
      ))}
    </div>
  );
}

function Card({ children, borderColor, style = {} }) {
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${borderColor || C.border}`,
      borderRadius: 20, padding: 24,
      animation: "fadein .3s ease",
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ icon, label, right }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ fontSize: 10, letterSpacing: 3, color: C.muted, textTransform: "uppercase", fontWeight: 700 }}>
          {label}
        </span>
      </div>
      {right}
    </div>
  );
}

function PrimaryBtn({ onClick, disabled, bg, color = "#fff", children }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "11px 26px", borderRadius: 50, border: "none",
      background: disabled ? C.card : bg, color: disabled ? C.muted : color,
      fontSize: 14, fontWeight: 700, letterSpacing: .3,
      display: "flex", alignItems: "center", gap: 8,
      opacity: disabled ? .6 : 1,
    }}>
      {children}
    </button>
  );
}

function GhostBtn({ onClick, children, small }) {
  return (
    <button onClick={onClick} style={{
      padding: small ? "5px 16px" : "10px 22px",
      borderRadius: 50, border: `1px solid ${C.border}`,
      background: "transparent", color: C.muted,
      fontSize: small ? 12 : 13, fontWeight: 600,
    }}>
      {children}
    </button>
  );
}

function formatTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
}

/* ── Claude API 호출 ─────────────────────────────── */
async function callClaude(system, user) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  const data = await res.json();
  return data.content?.map(b => b.text || "").join("") || "";
}

/* ── iOS 감지 ────────────────────────────────────── */
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

/* ── 메인 앱 ─────────────────────────────────────── */
export default function App() {
  /* 녹음 상태 */
  const [status, setStatus]       = useState("idle"); // idle | recording | stopped
  const [tabVis, setTabVis]       = useState("active"); // active | background
  const [elapsed, setElapsed]     = useState(0);
  const [bgCount, setBgCount]     = useState(0);
  const [micError, setMicError]   = useState("");

  /* 텍스트 데이터 */
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim]       = useState("");
  const [memo, setMemo]             = useState("");

  /* AI */
  const [summary, setSummary]         = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);

  /* 번역 */
  const [activeLang, setActiveLang]   = useState(null);
  const [translation, setTranslation] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateSrc, setTranslateSrc]   = useState("summary"); // "summary" | "transcript" | "memo"

  /* 탭 (받아쓰기 / 메모) */
  const [activeTab, setActiveTab] = useState("transcript");

  /* refs */
  const recRef      = useRef(null);
  const timerRef    = useRef(null);
  const bgTimerRef  = useRef(null);
  const bgSecRef    = useRef(0);
  const intentRef   = useRef(false);
  const statusRef   = useRef("idle");

  useEffect(() => { statusRef.current = status; }, [status]);

  /* ── 음성 인식 실행 ── */
  const launchRecognition = useCallback(() => {
    const SRClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SRClass) {
      setMicError(isIOS
        ? "Safari 브라우저에서 사용해주세요. (설정 → Safari → 마이크 허용)"
        : "Chrome 또는 Safari 브라우저에서 사용해주세요."
      );
      return;
    }

    const rec = new SRClass();
    rec.lang = "ko-KR";
    // iOS Safari는 continuous=true 시 오류 발생 → false로 설정 후 onend에서 재시작
    rec.continuous = !isIOS;
    rec.interimResults = !isIOS; // iOS는 interim 미지원
    rec._stopped = false;

    rec.onstart = () => setMicError("");

    rec.onresult = (e) => {
      let fin = "", itr = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) fin += t + " ";
        else itr += t;
      }
      if (fin) setTranscript(prev => prev + fin);
      if (!isIOS) setInterim(itr);
    };

    rec.onerror = (e) => {
      if (e.error === "no-speech") return; // 무시 — 자동 재시작됨
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setMicError("마이크 권한이 거부됐습니다. 설정 앱 → Safari → 마이크를 '허용'으로 변경해주세요.");
        intentRef.current = false;
      } else if (e.error === "audio-capture") {
        setMicError("마이크를 찾을 수 없습니다. 다른 앱이 마이크를 사용 중인지 확인해주세요.");
      } else if (e.error === "network") {
        setMicError("네트워크 오류입니다. 인터넷 연결을 확인해주세요.");
      } else {
        setMicError(`음성 인식 오류: ${e.error}`);
      }
    };

    rec.onend = () => {
      setInterim("");
      // 의도적으로 중지한 게 아니면 자동 재시작 (iOS는 continuous 미지원이라 항상 재시작)
      if (!rec._stopped && intentRef.current && !document.hidden) {
        setTimeout(() => {
          if (intentRef.current && !document.hidden) launchRecognition();
        }, isIOS ? 100 : 300);
      }
    };

    try {
      rec.start();
      recRef.current = rec;
    } catch (err) {
      setMicError("음성 인식을 시작할 수 없습니다. 페이지를 새로고침 후 다시 시도해주세요.");
    }
  }, []);

  /* ── Page Visibility ── */
  useEffect(() => {
    const handler = () => {
      if (!intentRef.current) return;
      if (document.hidden) {
        // 백그라운드 진입
        setTabVis("background");
        bgSecRef.current = 0;
        bgTimerRef.current = setInterval(() => { bgSecRef.current += 1; }, 1000);
        if (recRef.current) { recRef.current._stopped = true; recRef.current.stop(); }
        setInterim("");
      } else {
        // 포그라운드 복귀
        setTabVis("active");
        const secs = bgSecRef.current;
        clearInterval(bgTimerRef.current);
        setBgCount(n => n + 1);
        if (secs > 1) setTranscript(prev => prev + `\n[⏸ 백그라운드 ${secs}초]\n`);
        if (statusRef.current === "recording") launchRecognition();
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [launchRecognition]);

  /* ── 녹음 시작 ── */
  const startRecording = useCallback(() => {
    intentRef.current = true;
    setStatus("recording");
    setTabVis("active");
    setMicError("");
    setElapsed(0);
    setBgCount(0);
    launchRecognition();
    timerRef.current = setInterval(() => setElapsed(n => n + 1), 1000);
  }, [launchRecognition]);

  /* ── 녹음 중지 ── */
  const stopRecording = useCallback(() => {
    intentRef.current = false;
    if (recRef.current) { recRef.current._stopped = true; recRef.current.stop(); }
    clearInterval(timerRef.current);
    clearInterval(bgTimerRef.current);
    setInterim("");
    setTabVis("active");
    setStatus("stopped");
  }, []);

  /* ── 전체 초기화 ── */
  const resetAll = () => {
    intentRef.current = false;
    setStatus("idle"); setTabVis("active");
    setTranscript(""); setInterim(""); setMemo("");
    setSummary(""); setElapsed(0); setBgCount(0); setMicError("");
    setTranslation(""); setActiveLang(null);
  };

  /* ── AI 요약 ── */
  const summarize = async () => {
    const src = transcript.replace(/\[⏸ 백그라운드 \d+초\]/g, "").trim();
    if (!src) return;
    setIsSummarizing(true); setSummary(""); setTranslation(""); setActiveLang(null);
    try {
      const memoNote = memo.trim() ? `\n\n[참고 메모]\n${memo.trim()}` : "";
      const result = await callClaude(
        "당신은 회의 내용을 분석하는 전문가입니다. 핵심 안건, 결정사항, 액션 아이템을 구분하여 한국어로 요약하세요. 마크다운 없이 일반 텍스트로 작성하세요.",
        `다음 회의 내용을 요약해주세요:\n\n${src}${memoNote}`
      );
      setSummary(result || "요약 실패");
    } catch { setSummary("요약 중 오류가 발생했습니다."); }
    setIsSummarizing(false);
  };

  /* ── 번역 ── */
  const translate = async (langCode) => {
    const langInfo = LANGS.find(l => l.code === langCode);
    if (!langInfo) return;

    let src = "";
    let label = "";
    if (translateSrc === "summary" && summary) { src = summary; label = "요약본"; }
    else if (translateSrc === "memo" && memo.trim()) { src = memo.trim(); label = "메모"; }
    else { src = transcript.replace(/\[⏸ 백그라운드 \d+초\]/g, " ").trim(); label = "받아쓰기"; }

    if (!src) return;

    setActiveLang(langCode);
    setIsTranslating(true);
    setTranslation("");

    try {
      const result = await callClaude(
        `You are a professional translator. Translate the Korean text into ${langInfo.label} accurately and naturally. Output only the translated text, no explanation.`,
        src
      );
      setTranslation(result || "번역 실패");
    } catch { setTranslation("번역 중 오류가 발생했습니다."); }
    setIsTranslating(false);
  };

  /* ── 파생 상태 ── */
  const isRecording   = status === "recording";
  const isStopped     = status === "stopped";
  const isBg          = tabVis === "background";
  const cleanText     = transcript.replace(/\[⏸ 백그라운드 \d+초\]/g, "").trim();
  const wordCount     = cleanText.split(/\s+/).filter(Boolean).length;
  const hasContent    = cleanText.length > 0;

  const dotCfg = (() => {
    if (!isRecording && !isStopped) return { color: C.muted,  label: "대기 중",          anim: "none" };
    if (isStopped)                   return { color: C.accent, label: "녹음 완료",          anim: "none" };
    if (isBg)                        return { color: C.amber,  label: "백그라운드 유지 중", anim: "amb-dot 1.5s ease-in-out infinite" };
    return                                  { color: C.red,    label: "녹음 중",            anim: "rec-dot 1.5s ease-in-out infinite" };
  })();

  /* ── 받아쓰기 텍스트 렌더 ── */
  const renderTranscript = () => {
    const parts = transcript.split(/(\[⏸ 백그라운드 \d+초\])/g);
    return (
      <div style={{ fontSize: 14.5, lineHeight: 1.9, color: C.text, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        {parts.map((p, i) => {
          const m = p.match(/^\[⏸ 백그라운드 (\d+)초\]$/);
          if (m) {
            return (
              <span key={i} style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                background: `${C.amberDim}44`, border: `1px solid ${C.amber}44`,
                color: C.amber, fontSize: 11, padding: "2px 10px",
                borderRadius: 20, margin: "2px 4px", verticalAlign: "middle",
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                ⏸ 백그라운드 {m[1]}초
              </span>
            );
          }
          return <span key={i}>{p}</span>;
        })}
        {interim && <span style={{ color: C.subtle, fontStyle: "italic" }}>{interim}</span>}
        {isRecording && !transcript && !interim && (
          <span style={{ color: C.muted, animation: "blink 1.2s step-end infinite" }}>
            🎙 듣고 있습니다...
          </span>
        )}
        {!isRecording && !transcript && (
          <span style={{ color: C.muted }}>녹음을 시작하면 여기에 내용이 표시됩니다.</span>
        )}
      </div>
    );
  };

  /* ── 렌더 ── */
  return (
    <>
      <style>{CSS}</style>
      <div style={{
        minHeight: "100vh", background: C.bg, color: C.text,
        fontFamily: "'Noto Sans KR', sans-serif",
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "44px 20px 80px",
      }}>

        {/* 헤더 */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 10, letterSpacing: 5, color: C.accent, fontWeight: 700, textTransform: "uppercase", marginBottom: 12 }}>
            ◆ Meeting Studio
          </div>
          <h1 style={{
            fontSize: 32, fontWeight: 800, letterSpacing: -1.5,
            background: `linear-gradient(135deg, ${C.text} 30%, ${C.muted} 100%)`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            회의 녹음 & 요약
          </h1>
          <p style={{ color: C.muted, marginTop: 8, fontSize: 13 }}>
            실시간 받아쓰기 · 메모 · 백그라운드 유지 · AI 요약 · 번역
          </p>
        </div>

        <div style={{ width: "100%", maxWidth: 760, display: "flex", flexDirection: "column", gap: 16 }}>

          {/* ── 백그라운드 배너 ── */}
          {isRecording && isBg && (
            <div style={{
              background: `${C.amberDim}44`, border: `1px solid ${C.amber}44`,
              borderRadius: 14, padding: "13px 20px",
              display: "flex", alignItems: "center", gap: 12, animation: "fadein .3s ease",
            }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.amber, animation: "amb-dot 1.5s ease-in-out infinite" }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.amber }}>백그라운드 녹음 유지 중</div>
                <div style={{ fontSize: 12, color: C.subtle, marginTop: 2 }}>탭으로 돌아오면 자동으로 재개됩니다</div>
              </div>
            </div>
          )}

          {/* ── 녹음 컨트롤 카드 ── */}
          <Card borderColor={isRecording && !isBg ? "#4ade8025" : isBg ? "#fbbf2425" : C.border}
            style={{ position: "relative", overflow: "hidden" }}>
            {/* 배경 글로우 */}
            {isRecording && (
              <div style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                background: isBg
                  ? `radial-gradient(ellipse at 50% 0%, ${C.amberDim}20 0%, transparent 70%)`
                  : `radial-gradient(ellipse at 50% 0%, ${C.accentDim}25 0%, transparent 70%)`,
                transition: "background .5s",
              }} />
            )}

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
              {/* 상태 표시 */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: dotCfg.color, animation: dotCfg.anim }} />
                <span style={{ fontSize: 13, color: C.subtle }}>{dotCfg.label}</span>
                {(isRecording || isStopped) && (
                  <span style={{ fontSize: 13, color: C.text, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                    {formatTime(elapsed)}
                  </span>
                )}
                {isRecording && bgCount > 0 && (
                  <span style={{ fontSize: 11, color: C.amber, background: `${C.amberDim}55`, padding: "2px 10px", borderRadius: 20 }}>
                    BG×{bgCount}
                  </span>
                )}
              </div>

              <Wave active={isRecording && !isBg} bg={isBg && isRecording} />

              {/* 버튼들 */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                {status === "idle" && (
                  <PrimaryBtn onClick={startRecording} bg={C.accent} color="#000">
                    ● 녹음 시작
                  </PrimaryBtn>
                )}
                {isRecording && (
                  <PrimaryBtn onClick={stopRecording} bg={C.red}>
                    ■ 녹음 중지
                  </PrimaryBtn>
                )}
                {isStopped && (
                  <>
                    <GhostBtn onClick={resetAll}>↺ 초기화</GhostBtn>
                    <PrimaryBtn onClick={startRecording} bg={C.accent} color="#000">
                      ● 추가 녹음
                    </PrimaryBtn>
                  </>
                )}
              </div>

              {/* 마이크 오류 */}
              {micError && (
                <div style={{
                  color: C.red, fontSize: 13, background: `${C.redDim}33`,
                  border: `1px solid ${C.redDim}`, padding: "8px 18px", borderRadius: 10,
                }}>
                  ⚠️ {micError}
                </div>
              )}
            </div>
          </Card>

          {/* ── 탭: 받아쓰기 / 메모 ── */}
          <Card>
            {/* 탭 헤더 */}
            <div style={{ display: "flex", gap: 4, marginBottom: 16, background: C.card, borderRadius: 12, padding: 4 }}>
              {[
                { key: "transcript", icon: "📝", label: "받아쓰기" },
                { key: "memo",       icon: "✏️", label: "메모" },
              ].map(tab => (
                <button
                  key={tab.key}
                  className="tab-btn"
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    flex: 1, padding: "9px 16px", borderRadius: 9, border: "none",
                    background: activeTab === tab.key ? C.surface : "transparent",
                    color: activeTab === tab.key ? C.text : C.muted,
                    fontSize: 13, fontWeight: activeTab === tab.key ? 700 : 400,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    boxShadow: activeTab === tab.key ? "0 1px 4px #00000040" : "none",
                    transition: "all .15s ease",
                  }}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.key === "transcript" && wordCount > 0 && (
                    <span style={{ fontSize: 11, color: C.muted, background: C.bg, padding: "1px 8px", borderRadius: 20 }}>
                      {wordCount}
                    </span>
                  )}
                  {tab.key === "memo" && memo.trim() && (
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.purple, flexShrink: 0 }} />
                  )}
                </button>
              ))}
            </div>

            {/* 받아쓰기 탭 */}
            {activeTab === "transcript" && (
              <div>
                <div style={{
                  background: C.bg, borderRadius: 14,
                  padding: "16px 18px", minHeight: 160, maxHeight: 320, overflowY: "auto",
                  border: `1px solid ${isRecording && !isBg ? "#4ade8020" : C.border}`,
                  transition: "border-color .3s",
                }}>
                  {renderTranscript()}
                </div>
                {/* 받아쓰기 → 수동 편집 안내 */}
                {hasContent && (
                  <div style={{ marginTop: 8, fontSize: 11, color: C.muted, textAlign: "right" }}>
                    {bgCount > 0 && `백그라운드 전환 ${bgCount}회 · `}{wordCount}단어 인식됨
                  </div>
                )}
              </div>
            )}

            {/* 메모 탭 */}
            {activeTab === "memo" && (
              <div>
                <textarea
                  value={memo}
                  onChange={e => setMemo(e.target.value)}
                  placeholder="회의 중 자유롭게 메모하세요.&#10;이 내용은 AI 요약 시 참고됩니다."
                  style={{
                    width: "100%", minHeight: 180,
                    background: C.bg, color: C.text,
                    border: `1px solid ${C.border}`, borderRadius: 14,
                    padding: "16px 18px", fontSize: 14, lineHeight: 1.8,
                    transition: "border-color .2s",
                  }}
                  onFocus={e => e.target.style.borderColor = C.purple + "88"}
                  onBlur={e => e.target.style.borderColor = C.border}
                />
                <div style={{ marginTop: 6, fontSize: 11, color: C.muted, textAlign: "right" }}>
                  {memo.trim().split(/\s+/).filter(Boolean).length}단어
                </div>
              </div>
            )}
          </Card>

          {/* ── AI 요약 버튼 ── */}
          {isStopped && hasContent && (
            <button
              onClick={summarize}
              disabled={isSummarizing}
              style={{
                width: "100%", padding: "15px",
                background: isSummarizing ? C.card : "linear-gradient(135deg, #14532d, #166534)",
                color: isSummarizing ? C.muted : "#fff",
                border: "none", borderRadius: 16,
                fontSize: 14, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                animation: "fadein .3s ease",
              }}
            >
              {isSummarizing ? <><Spinner />AI 요약 중...</> : "✦ AI로 요약하기"}
            </button>
          )}

          {/* ── 요약 결과 ── */}
          {summary && (
            <Card borderColor={C.accentDim}>
              <SectionTitle icon="✦" label="AI 요약 결과"
                right={<GhostBtn onClick={summarize} small>↺ 재요약</GhostBtn>}
              />
              <div style={{
                background: C.bg, borderRadius: 12, padding: "16px 18px",
                fontSize: 14, lineHeight: 1.95, color: C.text,
                whiteSpace: "pre-wrap", wordBreak: "break-word",
              }}>
                {summary}
              </div>
            </Card>
          )}

          {/* ── 번역 ── */}
          {isStopped && (hasContent || summary) && (
            <Card borderColor={C.blueDim}>
              <SectionTitle icon="🌐" label="번역" />

              {/* 번역 소스 선택 */}
              <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
                {[
                  { key: "summary",    label: "요약본",    disabled: !summary },
                  { key: "transcript", label: "받아쓰기",   disabled: !hasContent },
                  { key: "memo",       label: "메모",      disabled: !memo.trim() },
                ].map(opt => (
                  <button key={opt.key} onClick={() => { if (!opt.disabled) { setTranslateSrc(opt.key); setTranslation(""); setActiveLang(null); } }}
                    disabled={opt.disabled}
                    style={{
                      padding: "5px 16px", borderRadius: 50, fontSize: 12,
                      border: `1px solid ${translateSrc === opt.key ? C.blue : C.border}`,
                      background: translateSrc === opt.key ? `${C.blueDim}88` : "transparent",
                      color: opt.disabled ? C.muted : translateSrc === opt.key ? C.blue : C.subtle,
                      fontWeight: translateSrc === opt.key ? 700 : 400,
                      opacity: opt.disabled ? .4 : 1,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* 언어 선택 */}
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 16 }}>
                {LANGS.map(lang => (
                  <button
                    key={lang.code}
                    className="lang-chip"
                    onClick={() => translate(lang.code)}
                    disabled={isTranslating}
                    style={{
                      padding: "7px 14px", borderRadius: 50, fontSize: 13,
                      border: `1px solid ${activeLang === lang.code ? C.blue : C.border}`,
                      background: activeLang === lang.code ? `${C.blueDim}99` : C.card,
                      color: activeLang === lang.code ? C.blue : C.subtle,
                      fontWeight: activeLang === lang.code ? 700 : 400,
                      display: "flex", alignItems: "center", gap: 6,
                      opacity: isTranslating && activeLang !== lang.code ? .45 : 1,
                    }}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                  </button>
                ))}
              </div>

              {/* 번역 결과 */}
              {activeLang ? (
                <div>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                    {LANGS.find(l => l.code === activeLang)?.flag}{" "}
                    {LANGS.find(l => l.code === activeLang)?.label}으로 번역
                    {isTranslating && <Spinner color={C.blue} />}
                  </div>
                  <div style={{
                    background: C.bg, border: `1px solid ${C.blueDim}`,
                    borderRadius: 12, padding: "16px 18px",
                    fontSize: 14, lineHeight: 1.9, color: isTranslating ? C.muted : C.text,
                    whiteSpace: "pre-wrap", wordBreak: "break-word", minHeight: 60,
                  }}>
                    {isTranslating
                      ? <span style={{ animation: "blink 1.2s step-end infinite" }}>번역 중...</span>
                      : translation
                    }
                  </div>
                  {!isTranslating && translation && (
                    <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                      <GhostBtn small onClick={() => navigator.clipboard?.writeText(translation)}>
                        📋 복사
                      </GhostBtn>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  background: C.bg, border: `1px dashed ${C.border}`,
                  borderRadius: 12, padding: "22px",
                  textAlign: "center", color: C.muted, fontSize: 13,
                }}>
                  언어를 선택하면 번역이 시작됩니다
                </div>
              )}
            </Card>
          )}

        </div>

        <p style={{ marginTop: 56, fontSize: 11, color: C.muted, letterSpacing: .8, textAlign: "center" }}>
          {isIOS
            ? "iPhone · iPad: Safari 브라우저 사용 필요 · 설정 → Safari → 마이크 허용"
            : "Chrome / Safari 브라우저 권장 · 마이크 권한 필요"
          }
        </p>
      </div>
    </>
  );
}
