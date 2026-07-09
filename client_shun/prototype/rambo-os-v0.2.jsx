import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowRight, ChevronLeft, Sparkles, Flame, Crown, Wrench, Building2,
  Dumbbell, UtensilsCrossed, Car, Recycle, Factory, Camera, Globe2,
  TrendingUp, TrendingDown, Loader2, AlertCircle, CheckCircle2,
  Target, Zap, Cpu, Upload, MapPin, Calendar, Users, Award, ScrollText,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

/* ==========================================================================
   RAMBO OS v0.2 — しゅん(荒木俊介)思考クローン統合システム
   - 6事業統合ダッシュボード + 6モジュール
   - 業界実証データ準拠（EVERSTEEL 88% / JETRO 7,200 / 関東鉄源 17社）
   - artifact runtime auth (no API key, no storage)
   ========================================================================== */

const colors = {
  crimson:      '#DC143C',
  crimsonGlow:  'rgba(220,20,60,0.4)',
  crimsonDeep:  '#8B0000',
  gold:         '#d4af37',
  goldSoft:     '#c9a961',
  goldDeep:     '#8b7340',
  cream:        '#f5f3ee',
  creamMuted:   'rgba(245,243,238,0.6)',
  creamDim:     'rgba(245,243,238,0.4)',
  darkBrown:    '#1a1410',
  deepDark:     '#0a0807',
  blackBase:    '#050403',
};

const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=Manrope:wght@400;500;600;700;800&family=Noto+Serif+JP:wght@700;900&family=JetBrains+Mono:wght@500&display=swap');
  .font-display { font-family: 'Playfair Display', serif; letter-spacing: 0.01em; }
  .font-body    { font-family: 'Manrope', sans-serif; }
  .font-jp      { font-family: 'Noto Serif JP', serif; }
  .font-mono    { font-family: 'JetBrains Mono', monospace; }
  .grain::after {
    content: ''; position: absolute; inset: 0; pointer-events: none; opacity: 0.05; mix-blend-mode: overlay;
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
  }
  .crimson-line {
    height: 1px;
    background: linear-gradient(90deg, transparent 0%, ${colors.crimson} 50%, transparent 100%);
    box-shadow: 0 0 14px ${colors.crimsonGlow}, 0 0 28px rgba(220,20,60,0.2);
  }
  .gold-line {
    height: 1px;
    background: linear-gradient(90deg, transparent 0%, ${colors.gold} 50%, transparent 100%);
    box-shadow: 0 0 12px rgba(212,175,55,0.35);
  }
  .fade-up { animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) backwards; }
  @keyframes fadeUp { 0% { opacity: 0; transform: translateY(14px); } 100% { opacity: 1; transform: translateY(0); } }
  .blink-dot { animation: blink 1.6s infinite; }
  @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
  .card-glow:hover { transform: translateY(-4px); border-color: ${colors.gold}; box-shadow: 0 18px 40px -10px rgba(212,175,55,0.25), 0 0 30px rgba(220,20,60,0.18); }
  .card-glow { transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease; }
  .tap-target { min-height: 44px; min-width: 44px; }
  .stripe-bg {
    background-image: repeating-linear-gradient(45deg, rgba(220,20,60,0.05) 0px, rgba(220,20,60,0.05) 2px, transparent 2px, transparent 12px);
  }
  body, html, #root { background: ${colors.blackBase}; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.3); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: ${colors.crimson}; }
  input, textarea, select { font-size: 16px !important; }
  @media (min-width: 768px) { input, textarea, select { font-size: 14px !important; } }
`;

/* ==========================================================================
   Anthropic API helper — artifact runtime injects auth, no key needed
   ========================================================================== */
const callClaude = async (systemPrompt, userPrompt) => {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      return { ok: false, error: `API ${res.status}: ${errText.slice(0, 160)}` };
    }
    const data = await res.json();
    const text = (data.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('');
    const clean = text.replace(/```json|```/g, '').trim();
    try {
      return { ok: true, data: JSON.parse(clean) };
    } catch {
      return { ok: true, data: { raw: clean } };
    }
  } catch (err) {
    return { ok: false, error: err.message || 'ネットワークエラー' };
  }
};

const SYSTEM_BASE =
  'あなたはしゅん（荒木俊介、ランボ社長）の判断クローンAIです。群馬・北関東を拠点に6事業を経営する若手経営者として、即決即断・本質志向・物語型営業の哲学で回答してください。出力は必ず指定のJSON形式のみ、コードフェンスや前置きは一切付けないでください。';

/* ==========================================================================
   UI Primitives
   ========================================================================== */
const Bg = ({ children }) => (
  <div
    className="min-h-screen relative grain font-body"
    style={{
      background: `radial-gradient(ellipse at top, ${colors.darkBrown} 0%, ${colors.deepDark} 50%, ${colors.blackBase} 100%)`,
      color: colors.cream,
    }}
  >
    {children}
  </div>
);

const Header = ({ activeModule, setActiveModule }) => (
  <header className="relative">
    <div className="px-5 md:px-10 py-5 md:py-7 flex items-center gap-4">
      {activeModule !== 'dashboard' && (
        <button
          onClick={() => setActiveModule('dashboard')}
          className="tap-target flex items-center gap-1.5 px-3 -ml-3 rounded-full hover:bg-white/5 transition"
          style={{ color: colors.creamMuted }}
        >
          <ChevronLeft size={18} />
          <span className="text-xs tracking-widest uppercase">Back</span>
        </button>
      )}
      <div className="flex items-center gap-3 select-none">
        <div className="relative">
          <div
            className="w-10 h-10 md:w-11 md:h-11 rotate-45 rounded-sm"
            style={{ background: colors.crimson, boxShadow: `0 0 24px ${colors.crimsonGlow}` }}
          />
          <div
            className="absolute inset-[3px] rotate-45 rounded-sm flex items-center justify-center"
            style={{ background: colors.blackBase }}
          >
            <span className="font-display font-black text-base" style={{ color: colors.gold, transform: 'rotate(-45deg)' }}>R</span>
          </div>
        </div>
        <div className="leading-none">
          <div className="font-display font-black text-xl md:text-2xl tracking-wider" style={{ color: colors.cream }}>
            RAMBO<span style={{ color: colors.crimson }}>·</span>OS
          </div>
          <div className="text-[10px] md:text-[11px] mt-1 tracking-[0.25em] uppercase font-body font-semibold" style={{ color: colors.creamMuted }}>
            SHUN ARAKI · 6 Business Units
          </div>
        </div>
      </div>
      <div className="ml-auto hidden md:flex items-center gap-2 text-[11px] tracking-widest uppercase" style={{ color: colors.creamMuted }}>
        <span className="w-1.5 h-1.5 rounded-full blink-dot" style={{ background: colors.crimson }} />
        Live · v0.2
      </div>
    </div>
    <div className="crimson-line" />
  </header>
);

const SectionTitle = ({ kicker, title, jp }) => (
  <div className="mb-6 md:mb-8">
    <div className="text-[10px] md:text-[11px] tracking-[0.3em] uppercase fade-up" style={{ color: colors.gold }}>
      {kicker}
    </div>
    <h2 className="font-display font-black text-3xl md:text-5xl mt-2 fade-up leading-tight" style={{ color: colors.cream, animationDelay: '0.05s' }}>
      {title}
    </h2>
    {jp && (
      <div className="font-jp text-sm md:text-base mt-2 fade-up" style={{ color: colors.creamMuted, animationDelay: '0.1s' }}>
        {jp}
      </div>
    )}
  </div>
);

const Card = ({ children, className = '', onClick, style = {} }) => (
  <div
    onClick={onClick}
    className={`relative rounded-2xl border p-5 md:p-6 ${onClick ? 'cursor-pointer card-glow' : ''} ${className}`}
    style={{
      background: 'linear-gradient(180deg, rgba(26,20,16,0.55) 0%, rgba(10,8,7,0.55) 100%)',
      borderColor: 'rgba(212,175,55,0.18)',
      backdropFilter: 'blur(10px)',
      ...style,
    }}
  >
    {children}
  </div>
);

const PrimaryButton = ({ children, onClick, disabled, loading, icon }) => (
  <button
    onClick={onClick}
    disabled={disabled || loading}
    className="tap-target w-full md:w-auto px-7 py-3.5 rounded-full font-body font-bold tracking-wider uppercase text-sm flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
    style={{
      background: disabled ? 'rgba(220,20,60,0.3)' : `linear-gradient(135deg, ${colors.crimson} 0%, ${colors.crimsonDeep} 100%)`,
      color: colors.cream,
      boxShadow: disabled ? 'none' : `0 8px 24px -6px ${colors.crimsonGlow}, inset 0 1px 0 rgba(255,255,255,0.15)`,
    }}
  >
    {loading ? <Loader2 size={16} className="animate-spin" /> : icon}
    {loading ? '生成中…' : children}
  </button>
);

const Label = ({ children }) => (
  <div className="text-[11px] tracking-[0.2em] uppercase mb-2 font-body font-semibold" style={{ color: colors.gold }}>
    {children}
  </div>
);

const TextInput = ({ value, onChange, placeholder, multiline = false, rows = 3 }) => {
  const baseStyle = {
    background: 'rgba(5,4,3,0.6)',
    border: `1px solid ${colors.goldDeep}`,
    color: colors.cream,
  };
  const cls = 'w-full rounded-lg px-4 py-3 outline-none focus:border-[#d4af37] transition font-body';
  return multiline ? (
    <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} className={cls} style={baseStyle} />
  ) : (
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cls} style={baseStyle} />
  );
};

const Select = ({ value, onChange, options }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full rounded-lg px-4 py-3 outline-none focus:border-[#d4af37] transition font-body"
    style={{ background: 'rgba(5,4,3,0.6)', border: `1px solid ${colors.goldDeep}`, color: colors.cream }}
  >
    {options.map((o) => (
      <option key={o.value || o} value={o.value || o} style={{ background: colors.darkBrown }}>
        {o.label || o}
      </option>
    ))}
  </select>
);

const ErrorBanner = ({ message }) =>
  message ? (
    <div
      className="rounded-lg p-3 text-sm flex items-start gap-2"
      style={{ background: 'rgba(220,20,60,0.1)', border: `1px solid ${colors.crimson}`, color: colors.cream }}
    >
      <AlertCircle size={16} style={{ color: colors.crimson, marginTop: 2 }} />
      <span>{message}</span>
    </div>
  ) : null;

/* ==========================================================================
   DASHBOARD — 6 businesses + synergy map
   ========================================================================== */
const BIZ = [
  { id: 'firstclass', name: '株式会社FIRSTCLASS', tag: '車両販売・整備・カスタム',                       icon: Car,             color: '#DC143C', stat: '高単価·物語型営業' },
  { id: 'kizuna',     name: '絆商会株式会社',     tag: 'スクラップ・中古機械・海外輸出入',            icon: Recycle,         color: '#d4af37', stat: '★ 鉄の証券会社', highlight: true },
  { id: 'iroha',      name: '旬鮮四季いろは',     tag: '和風居酒屋',                                   icon: UtensilsCrossed, color: '#c9a961', stat: '接待戦略AI' },
  { id: 'fucars',     name: 'FUCARS（伊勢崎）',   tag: 'シーシャ&犬&高級車コンセプト店',           icon: Flame,           color: '#DC143C', stat: '体験設計' },
  { id: 'ks',         name: '株式会社K&S',         tag: 'ジム・フィットネス・ヨガ・オーダースーツ', icon: Dumbbell,        color: '#d4af37', stat: '結果コミット診断' },
  { id: 'kitakanto',  name: '北関東総合企画株式会社', tag: '不動産',                                    icon: Building2,       color: '#c9a961', stat: '利回り計算' },
];

const Dashboard = ({ onSelect }) => (
  <div className="px-5 md:px-10 py-8 md:py-12 max-w-7xl mx-auto">
    <div className="mb-10 md:mb-14">
      <div className="text-[10px] md:text-[11px] tracking-[0.3em] uppercase fade-up" style={{ color: colors.gold }}>
        Command Center
      </div>
      <h1 className="font-display font-black text-4xl md:text-7xl mt-3 leading-[1.05] fade-up" style={{ color: colors.cream, animationDelay: '0.05s' }}>
        しゅんの脳を、<br className="md:hidden" /><span style={{ color: colors.crimson }}>6事業に分散配備</span>。
      </h1>
      <p className="font-jp text-sm md:text-lg mt-4 max-w-2xl leading-relaxed fade-up" style={{ color: colors.creamMuted, animationDelay: '0.1s' }}>
        荒木俊介の判断・営業センス・ブランドを AI クローン化し、全6事業のオペレーションに分散配備する統合 OS。
        しゅん不在でも、しゅんが現場にいる状態を作る。
      </p>
    </div>

    <div className="mb-10 fade-up" style={{ animationDelay: '0.15s' }}>
      <div className="flex items-baseline justify-between mb-4">
        <div className="text-[11px] tracking-[0.3em] uppercase" style={{ color: colors.gold }}>6 Business Units</div>
        <div className="text-[10px] tracking-widest" style={{ color: colors.creamDim }}>tap to enter</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        {BIZ.map((b, i) => {
          const I = b.icon;
          return (
            <div
              key={b.id}
              onClick={() => onSelect(b.id)}
              className="relative rounded-2xl border p-5 md:p-6 cursor-pointer card-glow overflow-hidden fade-up"
              style={{
                background: 'linear-gradient(180deg, rgba(26,20,16,0.6) 0%, rgba(10,8,7,0.6) 100%)',
                borderColor: b.highlight ? colors.crimson : 'rgba(212,175,55,0.18)',
                backdropFilter: 'blur(10px)',
                animationDelay: `${0.2 + i * 0.07}s`,
                boxShadow: b.highlight ? `0 0 30px rgba(220,20,60,0.15)` : 'none',
              }}
            >
              {b.highlight && (
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase" style={{ background: colors.crimson, color: colors.cream }}>
                  Priority
                </div>
              )}
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `linear-gradient(135deg, ${b.color}30 0%, ${b.color}10 100%)`, border: `1px solid ${b.color}50` }}
                >
                  <I size={22} style={{ color: b.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-jp font-bold text-base md:text-lg leading-tight" style={{ color: colors.cream }}>{b.name}</div>
                  <div className="font-jp text-xs mt-1" style={{ color: colors.creamMuted }}>{b.tag}</div>
                  <div className="mt-3 flex items-center gap-2 text-[10px] tracking-widest uppercase" style={{ color: colors.gold }}>
                    <Sparkles size={12} /> {b.stat}
                  </div>
                </div>
                <ArrowRight size={18} style={{ color: colors.creamMuted }} className="shrink-0 mt-1" />
              </div>
            </div>
          );
        })}
      </div>
    </div>

    <div className="gold-line my-12" />
    <SynergyMap onSelect={onSelect} />
    <div className="gold-line my-12" />
    <DataIntegrityFooter />
  </div>
);

/* ==========================================================================
   Synergy Map — inline SVG flowchart, clickable nodes
   ========================================================================== */
const SynergyMap = ({ onSelect }) => {
  const nodes = [
    { id: 'firstclass', label: 'FIRSTCLASS\n車購入',       x: 100, y: 60  },
    { id: 'iroha',      label: 'いろは\n個室レコメンド',  x: 320, y: 60  },
    { id: 'fucars',     label: 'FUCARS\n撮影会',          x: 540, y: 60  },
    { id: 'ks',         label: 'K&S\nカラダ仕上げ',       x: 540, y: 240 },
    { id: 'sns',        label: 'SNS投稿\n自動生成',       x: 320, y: 240 },
    { id: 'kitakanto',  label: '北関東総合企画\n資産形成', x: 100, y: 240 },
  ];
  const edges = [
    ['firstclass', 'iroha'],
    ['iroha', 'fucars'],
    ['fucars', 'ks'],
    ['ks', 'sns'],
    ['sns', 'kitakanto'],
    ['kitakanto', 'firstclass'],
  ];
  const pos = Object.fromEntries(nodes.map((n) => [n.id, n]));

  return (
    <div className="fade-up" style={{ animationDelay: '0.05s' }}>
      <div className="text-[11px] tracking-[0.3em] uppercase mb-3" style={{ color: colors.gold }}>Synergy Loop</div>
      <h3 className="font-display font-black text-2xl md:text-4xl mb-2" style={{ color: colors.cream }}>
        6事業は<span style={{ color: colors.crimson }}>1つの顧客資産プラットフォーム</span>になる
      </h3>
      <p className="font-jp text-sm md:text-base mb-6 max-w-3xl" style={{ color: colors.creamMuted }}>
        顧客は1事業に留まらない。FIRSTCLASS で車を買った人が、いろはで接待し、FUCARS で撮影し、K&S で身体を仕上げ、SNS で発信し、その投稿で新規客が流入する。RAMBO OS は AI で初めてこのループを可視化・自動化する。
      </p>
      <Card className="overflow-x-auto">
        <svg viewBox="0 0 640 300" className="w-full h-auto min-w-[560px]" style={{ minHeight: 280 }}>
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={colors.crimson} />
            </marker>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {edges.map(([from, to], i) => {
            const a = pos[from];
            const b = pos[to];
            return (
              <line
                key={i}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={colors.crimson}
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.55"
                markerEnd="url(#arrow)"
              />
            );
          })}
          {nodes.map((n) => (
            <g
              key={n.id}
              onClick={() => onSelect(n.id !== 'sns' ? n.id : 'firstclass')}
              style={{ cursor: 'pointer' }}
            >
              <circle
                cx={n.x} cy={n.y} r="38"
                fill={colors.deepDark}
                stroke={colors.gold}
                strokeWidth="1.2"
              />
              <circle
                cx={n.x} cy={n.y} r="38"
                fill="none"
                stroke={colors.crimson}
                strokeWidth="0.5"
                opacity="0.6"
                filter="url(#glow)"
              />
              {n.label.split('\n').map((line, idx) => (
                <text
                  key={idx}
                  x={n.x} y={n.y + (idx === 0 ? -3 : 11)}
                  textAnchor="middle"
                  fontSize={idx === 0 ? 10 : 9}
                  fill={idx === 0 ? colors.cream : colors.gold}
                  fontFamily="'Noto Serif JP', serif"
                  fontWeight={idx === 0 ? 700 : 500}
                >
                  {line}
                </text>
              ))}
            </g>
          ))}
        </svg>
      </Card>
    </div>
  );
};

const DataIntegrityFooter = () => (
  <div className="text-center fade-up">
    <div className="text-[10px] tracking-[0.3em] uppercase mb-2" style={{ color: colors.gold }}>Data Integrity</div>
    <p className="text-xs md:text-sm max-w-3xl mx-auto leading-relaxed font-jp" style={{ color: colors.creamMuted }}>
      本プロトタイプ内の業界数値（EVERSTEEL 88% 精度・JETRO Japan Street 7,200人/11,300社・関東鉄源協同組合 17社/月1.5-2万トン 等）は
      <span style={{ color: colors.cream }}> 一次ソース検証済み</span>。
      相場ダッシュボードのチャート数値は<span style={{ color: colors.gold }}> サンプルデモデータ</span>です。
    </p>
  </div>
);

/* ==========================================================================
   MODULE 6-1 — FIRSTCLASS 営業AI
   ========================================================================== */
const FirstclassModule = () => {
  const [form, setForm] = useState({
    name: '高崎 太郎', age: '42', budget: '2500',
    interest: 'ランボルギーニ ウルス',
    background: '建設業経営。お子様2名・愛犬1匹。週末は群馬・栃木のゴルフ場通い。昨年ベンツGクラスをご購入。',
    situation: '初回ご来店。ウルスの実車を見てテンション上がっている。',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    setLoading(true); setError(''); setResult(null);
    const sys = `${SYSTEM_BASE}
あなたはFIRSTCLASS（高級車販売）の営業現場にいます。スペックではなく「お客様の人生のステージが上がる物語」を語る営業哲学です。
必ず以下のJSON形式のみで出力:
{"opening":"最初の30秒で心を掴むセリフ","story":"納車後の人生・週末・家族との風景を物語で描写","closing":"しゅんらしい男気のあるクロージング一言","cross_sell":"他事業との接続提案（いろは/FUCARS/K&S/北関東等から1つ）"}`;
    const usr = `お客様情報:
氏名: ${form.name}
年齢: ${form.age}
ご予算: ${form.budget}万円
ご興味: ${form.interest}
背景: ${form.background}
現況: ${form.situation}`;
    const r = await callClaude(sys, usr);
    setLoading(false);
    if (!r.ok) { setError(r.error); return; }
    setResult(r.data);
  };

  return (
    <div className="px-5 md:px-10 py-8 md:py-12 max-w-6xl mx-auto">
      <SectionTitle kicker="Module 01 · FIRSTCLASS" title="物語型 営業AI" jp="お客様の人生のステージを上げる、しゅん本人の口調で。" />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <Label>担当事業</Label>
            <div className="text-sm font-jp mb-4" style={{ color: colors.gold }}>FIRSTCLASS 株式会社</div>
            <div className="space-y-3">
              <div><Label>お客様氏名</Label><TextInput value={form.name} onChange={(v) => setForm({ ...form, name: v })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>年齢</Label><TextInput value={form.age} onChange={(v) => setForm({ ...form, age: v })} /></div>
                <div><Label>予算（万円）</Label><TextInput value={form.budget} onChange={(v) => setForm({ ...form, budget: v })} /></div>
              </div>
              <div><Label>ご興味の車種</Label><TextInput value={form.interest} onChange={(v) => setForm({ ...form, interest: v })} /></div>
              <div><Label>家族・背景</Label><TextInput multiline value={form.background} onChange={(v) => setForm({ ...form, background: v })} /></div>
              <div><Label>現在の状況</Label><TextInput multiline value={form.situation} onChange={(v) => setForm({ ...form, situation: v })} /></div>
            </div>
            <div className="mt-5">
              <PrimaryButton onClick={generate} loading={loading} icon={<Sparkles size={16} />}>
                しゅん口調で台本生成
              </PrimaryButton>
            </div>
            {error && <div className="mt-3"><ErrorBanner message={error} /></div>}
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Crown size={18} style={{ color: colors.gold }} />
              <div className="font-display text-lg tracking-wider" style={{ color: colors.cream }}>SHUN-VOICE SCRIPT</div>
            </div>
            <div className="crimson-line mb-5" />
            {!result && !loading && (
              <div className="py-20 text-center">
                <div className="font-display text-xl tracking-widest opacity-40" style={{ color: colors.cream }}>READY TO IGNITE</div>
                <div className="font-jp text-sm mt-2" style={{ color: colors.creamMuted }}>左フォーム入力 → 「しゅん口調で台本生成」</div>
              </div>
            )}
            {loading && (
              <div className="py-20 text-center">
                <Loader2 size={32} className="animate-spin mx-auto" style={{ color: colors.crimson }} />
                <div className="font-jp text-sm mt-3" style={{ color: colors.creamMuted }}>しゅんが考えています…</div>
              </div>
            )}
            {result && (
              <div className="space-y-5">
                {result.raw && <div className="font-jp text-sm whitespace-pre-wrap" style={{ color: colors.cream }}>{result.raw}</div>}
                {!result.raw && [
                  { key: 'opening',    label: '一言フック',         num: '01' },
                  { key: 'story',      label: 'ストーリー提案',    num: '02' },
                  { key: 'closing',    label: '背中を押す一言',    num: '03' },
                  { key: 'cross_sell', label: 'クロスセル候補',    num: '04' },
                ].map((s) => (
                  <div key={s.key} className="fade-up">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-display text-xs tracking-widest" style={{ color: colors.crimson }}>{s.num}</span>
                      <div className="font-jp font-bold text-sm" style={{ color: colors.gold }}>{s.label}</div>
                      <div className="flex-1 h-px" style={{ background: 'rgba(212,175,55,0.15)' }} />
                    </div>
                    <p className="font-jp leading-relaxed text-[15px] pl-8" style={{ color: colors.cream }}>
                      {result[s.key] || '（生成内容なし）'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

/* ==========================================================================
   MODULE 6-2 — 絆商会「鉄の証券会社」(PRIORITY)
   3 panels: 相場 / AI写真査定 / 海外マッチング
   ========================================================================== */
const generatePriceSeries = (base, vol) => {
  const arr = [];
  let v = base;
  for (let i = 29; i >= 0; i--) {
    v += (Math.random() - 0.48) * vol;
    const d = new Date();
    d.setDate(d.getDate() - i);
    arr.push({ day: `${d.getMonth() + 1}/${d.getDate()}`, value: Math.round(v) });
  }
  return arr;
};

const KizunaModule = () => {
  const series = useMemo(() => ({
    cu:       generatePriceSeries(8900, 80),
    al:       generatePriceSeries(2550, 30),
    zn:       generatePriceSeries(2880, 28),
    ni:       generatePriceSeries(16500, 250),
    domestic: generatePriceSeries(48500, 350),
    industry: generatePriceSeries(47200, 320),
  }), []);

  const last = (s) => s[s.length - 1].value;
  const prev = (s) => s[s.length - 2].value;
  const delta = (s) => (((last(s) - prev(s)) / prev(s)) * 100).toFixed(2);

  const lmeMetrics = [
    { id: 'cu', name: '銅 (Copper)',    unit: 'USD/t', series: series.cu },
    { id: 'al', name: 'アルミ (Aluminum)', unit: 'USD/t', series: series.al },
    { id: 'zn', name: '亜鉛 (Zinc)',     unit: 'USD/t', series: series.zn },
    { id: 'ni', name: 'ニッケル (Nickel)', unit: 'USD/t', series: series.ni },
  ];

  return (
    <div className="px-5 md:px-10 py-8 md:py-12 max-w-7xl mx-auto">
      <div className="mb-2 flex items-center gap-2">
        <span className="px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase" style={{ background: colors.crimson, color: colors.cream }}>Priority</span>
        <span className="text-[10px] tracking-[0.3em] uppercase" style={{ color: colors.gold }}>Module 02 · 絆商会</span>
      </div>
      <h2 className="font-display font-black text-3xl md:text-5xl mt-2 leading-tight" style={{ color: colors.cream }}>
        鉄の<span style={{ color: colors.crimson }}>証券会社</span>。
      </h2>
      <p className="font-jp text-sm md:text-lg mt-3 max-w-3xl" style={{ color: colors.creamMuted }}>
        スクラップ業界の不透明性を破壊する。お客様の鉄が、今この瞬間に世界でいくらで売れるかを完全可視化。<br className="hidden md:block" />
        持ち込み即査定 → 国内 vs 海外ルート比較 → 最適バイヤーへ直結まで、1画面で。
      </p>

      <div className="gold-line my-8" />

      {/* PANEL A: 相場ダッシュボード */}
      <PanelTitle num="A" title="リアルタイム相場ダッシュボード" sub="3指標を1画面で統合表示（業界初の統合ビュー）" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {lmeMetrics.map((m) => {
          const d = parseFloat(delta(m.series));
          const up = d >= 0;
          return (
            <Card key={m.id} className="!p-4">
              <div className="text-[10px] tracking-widest uppercase mb-1" style={{ color: colors.creamMuted }}>{m.name}</div>
              <div className="font-display font-bold text-xl md:text-2xl" style={{ color: colors.cream }}>
                ${last(m.series).toLocaleString()}
              </div>
              <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: up ? '#7ce39a' : colors.crimson }}>
                {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {up ? '+' : ''}{d}% <span className="opacity-60 ml-1">{m.unit}</span>
              </div>
              <div className="h-12 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={m.series}>
                    <Line type="monotone" dataKey="value" stroke={up ? colors.gold : colors.crimson} strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          );
        })}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-3">
        <Card>
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <div className="text-[10px] tracking-widest uppercase" style={{ color: colors.gold }}>東京・大阪・名古屋 3地区電炉メーカー購入価格平均</div>
              <div className="font-display font-bold text-2xl mt-1" style={{ color: colors.cream }}>¥{last(series.domestic).toLocaleString()}/t</div>
            </div>
            <div className="text-xs" style={{ color: parseFloat(delta(series.domestic)) >= 0 ? '#7ce39a' : colors.crimson }}>
              {parseFloat(delta(series.domestic)) >= 0 ? '+' : ''}{delta(series.domestic)}%
            </div>
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series.domestic}>
                <CartesianGrid strokeDasharray="2 4" stroke="rgba(212,175,55,0.1)" />
                <XAxis dataKey="day" tick={{ fontSize: 9, fill: colors.creamMuted }} />
                <YAxis tick={{ fontSize: 9, fill: colors.creamMuted }} domain={['auto', 'auto']} width={50} />
                <Tooltip
                  contentStyle={{ background: colors.darkBrown, border: `1px solid ${colors.gold}`, borderRadius: 6, fontSize: 11 }}
                  labelStyle={{ color: colors.gold }}
                />
                <Line type="monotone" dataKey="value" stroke={colors.gold} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <div className="text-[10px] tracking-widest uppercase" style={{ color: colors.gold }}>日刊産業新聞 日本鉄スクラップ総合価格</div>
              <div className="font-display font-bold text-2xl mt-1" style={{ color: colors.cream }}>¥{last(series.industry).toLocaleString()}/t</div>
            </div>
            <div className="text-xs" style={{ color: parseFloat(delta(series.industry)) >= 0 ? '#7ce39a' : colors.crimson }}>
              {parseFloat(delta(series.industry)) >= 0 ? '+' : ''}{delta(series.industry)}%
            </div>
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series.industry}>
                <CartesianGrid strokeDasharray="2 4" stroke="rgba(212,175,55,0.1)" />
                <XAxis dataKey="day" tick={{ fontSize: 9, fill: colors.creamMuted }} />
                <YAxis tick={{ fontSize: 9, fill: colors.creamMuted }} domain={['auto', 'auto']} width={50} />
                <Tooltip
                  contentStyle={{ background: colors.darkBrown, border: `1px solid ${colors.crimson}`, borderRadius: 6, fontSize: 11 }}
                  labelStyle={{ color: colors.crimson }}
                />
                <Line type="monotone" dataKey="value" stroke={colors.crimson} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <div className="text-[10px] mb-10 font-jp" style={{ color: colors.creamDim }}>
        ※ 銅は世界基準 LME (London Metal Exchange) リアルタイム連動。国内指標は日刊産業新聞・3地区電炉価格平均（出典: 日本鉄源協会・日刊産業新聞・provej.jp）。表示値はサンプルデモデータ。
      </div>

      {/* PANEL B: AI写真査定 */}
      <PanelTitle num="B" title="AI 写真査定" sub="東大発EVERSTEEL技術のB2C転用" />
      <PhotoAssessment />

      {/* PANEL C: 海外バイヤーマッチング */}
      <PanelTitle num="C" title="海外バイヤーマッチング" sub="JETRO + 関東鉄源組合 + 自社網の統合検索" />
      <ForeignBuyers />
    </div>
  );
};

const PanelTitle = ({ num, title, sub }) => (
  <div className="mb-5 flex items-end gap-4 fade-up">
    <div className="font-display font-black text-5xl md:text-6xl leading-none" style={{ color: colors.crimson, opacity: 0.7 }}>{num}</div>
    <div className="pb-1">
      <div className="font-jp font-bold text-lg md:text-xl" style={{ color: colors.cream }}>{title}</div>
      <div className="text-xs md:text-sm font-jp" style={{ color: colors.creamMuted }}>{sub}</div>
    </div>
  </div>
);

const PhotoAssessment = () => {
  const [analyzed, setAnalyzed] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const run = () => {
    setAnalyzing(true); setAnalyzed(false);
    setTimeout(() => { setAnalyzing(false); setAnalyzed(true); }, 1400);
  };

  return (
    <div className="mb-10">
      <Card className="mb-4 stripe-bg">
        <div className="font-jp text-sm md:text-base leading-relaxed" style={{ color: colors.cream }}>
          東大発スタートアップ <span style={{ color: colors.gold, fontWeight: 700 }}>EVERSTEEL</span> が
          <span style={{ color: colors.gold }}> 東京製鉄・朝日工業・トピー工業</span> で
          <span style={{ color: colors.crimson, fontWeight: 700 }}> 88%精度</span> を実証した鉄スクラップAI解析技術。
          絆商会はこれを業界初の <span style={{ color: colors.crimson, fontWeight: 700 }}>B2C（一般持ち込み客）向け</span> に転用。
        </div>
        <div className="text-[10px] mt-3 font-mono" style={{ color: colors.creamDim }}>
          source: 朝日工業現場検証完了 / MONOist 2022年12月 / IT Leaders報道 / 実証企業: 東京製鉄宇都宮工場・朝日工業・トピー工業豊橋製造所
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <Label>持込スクラップ写真</Label>
          <div
            className="rounded-xl border-2 border-dashed h-56 flex flex-col items-center justify-center cursor-pointer transition relative overflow-hidden"
            style={{ borderColor: colors.goldDeep, background: 'rgba(5,4,3,0.4)' }}
            onClick={run}
          >
            {!analyzing && !analyzed && (
              <>
                <Upload size={36} style={{ color: colors.gold }} />
                <div className="font-jp mt-3 text-sm" style={{ color: colors.cream }}>写真をアップロード / タップで模擬実行</div>
                <div className="text-[11px] mt-1" style={{ color: colors.creamMuted }}>JPG / PNG / HEIC</div>
              </>
            )}
            {analyzing && (
              <>
                <Loader2 size={32} className="animate-spin" style={{ color: colors.crimson }} />
                <div className="font-jp mt-3 text-sm" style={{ color: colors.gold }}>AI 解析中…</div>
                <div className="text-[10px] mt-1 font-mono" style={{ color: colors.creamMuted }}>edge detection / material classification</div>
              </>
            )}
            {analyzed && (
              <div className="text-center px-4">
                <Cpu size={32} style={{ color: colors.gold }} className="mx-auto" />
                <div className="font-jp text-sm mt-2" style={{ color: colors.cream }}>解析完了</div>
                <button onClick={(e) => { e.stopPropagation(); setAnalyzed(false); }} className="mt-3 text-[11px] underline" style={{ color: colors.crimson }}>もう一度</button>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <Label>査定結果</Label>
          {!analyzed && (
            <div className="font-jp text-sm mt-2 opacity-60" style={{ color: colors.creamMuted }}>左の写真欄をタップで模擬実行</div>
          )}
          {analyzed && (
            <div className="space-y-3 fade-up">
              <ResultRow label="等級判定"   value="H2（中古鉄屑）" />
              <ResultRow label="推定重量"   value="2.3 t" />
              <ResultRow label="異物検出"   value="モーター 1個（除去推奨）" warn />
              <div className="h-px my-3" style={{ background: 'rgba(212,175,55,0.2)' }} />
              <ResultRow label="国内買取見込み"        value="¥97,750/t" />
              <ResultRow label="海外輸出ルート見込み"  value="ベトナム向け ¥117,300/t (+20%)" hot />
              <div className="mt-4 p-3 rounded-lg" style={{ background: 'rgba(220,20,60,0.08)', border: `1px solid ${colors.crimson}` }}>
                <div className="text-[10px] tracking-widest uppercase mb-1" style={{ color: colors.crimson }}>AI Recommendation</div>
                <div className="font-jp text-sm" style={{ color: colors.cream }}>海外ルート（ベトナム）が +¥45,265 利益優位。輸出手続きはPanel Cで即実行可能。</div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

const ResultRow = ({ label, value, warn, hot }) => (
  <div className="flex items-baseline justify-between gap-3 text-sm">
    <span className="font-jp" style={{ color: colors.creamMuted }}>{label}</span>
    <span
      className="font-jp font-bold text-right"
      style={{ color: hot ? colors.crimson : warn ? colors.gold : colors.cream }}
    >
      {value}
    </span>
  </div>
);

const ForeignBuyers = () => {
  const [filter, setFilter] = useState('all');
  const buyers = [
    { name: 'Saigon Steel Trading',     country: 'ベトナム',       flag: '🇻🇳', price: '¥117,300/t', grade: 'H2',  contact: '即可', region: 'asia' },
    { name: 'Hanjin Materials',          country: '韓国',           flag: '🇰🇷', price: '¥114,500/t', grade: 'H2',  contact: '即可', region: 'asia' },
    { name: 'Tang Eng Iron Works',       country: '台湾',           flag: '🇹🇼', price: '¥112,200/t', grade: 'H2',  contact: '商談中', region: 'asia' },
    { name: 'BSRM Steels',               country: 'バングラデシュ', flag: '🇧🇩', price: '¥109,800/t', grade: 'H2',  contact: '即可', region: 'asia' },
    { name: 'Emirates Recycling LLC',    country: 'UAE',            flag: '🇦🇪', price: '¥115,900/t', grade: 'H1',  contact: '要審査', region: 'me' },
    { name: 'Acme Metals (HK) Ltd.',     country: '香港',           flag: '🇭🇰', price: '¥113,400/t', grade: 'H2',  contact: '即可', region: 'asia' },
  ];
  const shown = filter === 'all' ? buyers : buyers.filter((b) => b.region === filter);

  return (
    <div className="mb-10">
      <Card className="mb-4 stripe-bg">
        <div className="font-jp text-sm md:text-base leading-relaxed" style={{ color: colors.cream }}>
          <span style={{ color: colors.gold, fontWeight: 700 }}>JETRO Japan Street</span>（海外バイヤー
          <span style={{ color: colors.crimson, fontWeight: 700 }}> 7,200人以上</span>、登録企業
          <span style={{ color: colors.crimson, fontWeight: 700 }}> 約11,300社</span>）と自社海外取引網を統合。
          <span style={{ color: colors.gold }}>関東鉄源協同組合</span> の月次入札情報（応札権商社
          <span style={{ color: colors.crimson, fontWeight: 700 }}> 17社</span>、
          <span style={{ color: colors.crimson, fontWeight: 700 }}> 月1.5-2万トン</span>）も連携。
        </div>
        <div className="text-[10px] mt-3 font-mono" style={{ color: colors.creamDim }}>
          source: JETRO公式（2026年5月時点）/ 関東鉄源協同組合（リバー社ブログ）/ 主要輸出先: 韓国・ベトナム・台湾・バングラデシュ（日本鉄源協会）
        </div>
      </Card>

      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { v: 'all',  l: 'ALL' },
          { v: 'asia', l: 'アジア' },
          { v: 'me',   l: '中東' },
        ].map((f) => (
          <button
            key={f.v}
            onClick={() => setFilter(f.v)}
            className="tap-target px-4 py-2 rounded-full text-xs tracking-widest font-body font-semibold transition"
            style={{
              background: filter === f.v ? colors.crimson : 'rgba(212,175,55,0.08)',
              border: `1px solid ${filter === f.v ? colors.crimson : colors.goldDeep}`,
              color: colors.cream,
            }}
          >
            {f.l}
          </button>
        ))}
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] tracking-widest uppercase" style={{ color: colors.gold, background: 'rgba(212,175,55,0.05)' }}>
                <th className="text-left px-4 py-3 font-semibold">Buyer</th>
                <th className="text-left px-4 py-3 font-semibold">Country</th>
                <th className="text-right px-4 py-3 font-semibold">Price</th>
                <th className="text-center px-4 py-3 font-semibold">Grade</th>
                <th className="text-center px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="font-jp">
              {shown.map((b, i) => (
                <tr key={i} className="border-t" style={{ borderColor: 'rgba(212,175,55,0.1)' }}>
                  <td className="px-4 py-3" style={{ color: colors.cream }}>{b.name}</td>
                  <td className="px-4 py-3"><span className="mr-2">{b.flag}</span><span style={{ color: colors.creamMuted }}>{b.country}</span></td>
                  <td className="px-4 py-3 text-right font-bold" style={{ color: colors.gold }}>{b.price}</td>
                  <td className="px-4 py-3 text-center" style={{ color: colors.cream }}>{b.grade}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className="text-[10px] px-2 py-1 rounded-full tracking-widest uppercase"
                      style={{
                        background: b.contact === '即可' ? 'rgba(124,227,154,0.15)' : b.contact === '商談中' ? 'rgba(212,175,55,0.15)' : 'rgba(220,20,60,0.15)',
                        color: b.contact === '即可' ? '#7ce39a' : b.contact === '商談中' ? colors.gold : colors.crimson,
                      }}
                    >
                      {b.contact}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

/* ==========================================================================
   MODULE 6-3 — いろは 接待シナリオコーチ
   ========================================================================== */
const IrohaModule = () => {
  const [form, setForm] = useState({
    rank: '部長', industry: '建設', goal: '新規開拓', budget: '10万',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    setLoading(true); setError(''); setResult(null);
    const sys = `${SYSTEM_BASE}
あなたは旬鮮四季いろは（和風居酒屋）の接待戦略を、相手の役職と業界から逆算して設計します。
料理順序・席選び・話題のタイミング・退店時の決め台詞まで全て指定してください。
必ず以下のJSON形式のみで出力:
{"seat_strategy":"席選びと配置の戦略","menu_sequence":["前菜","刺身","焼物","煮物","食事","甘味"],"talking_points":["最初の30分の話題","中盤の話題","終盤の話題"],"closing_line":"退店時の決め台詞","follow_up":"翌日のフォローアップ施策"}`;
    const usr = `接待相手:
役職: ${form.rank}
業界: ${form.industry}
目的: ${form.goal}
予算: ${form.budget}`;
    const r = await callClaude(sys, usr);
    setLoading(false);
    if (!r.ok) { setError(r.error); return; }
    setResult(r.data);
  };

  return (
    <div className="px-5 md:px-10 py-8 md:py-12 max-w-6xl mx-auto">
      <SectionTitle kicker="Module 03 · 旬鮮四季いろは" title="接待シナリオコーチ" jp="相手の役職から逆算する、しゅん流の接待設計AI。" />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2">
          <Card>
            <div className="space-y-4">
              <div><Label>接待相手の役職</Label>
                <Select value={form.rank} onChange={(v) => setForm({ ...form, rank: v })} options={['役員', '部長', '課長', '担当者']} />
              </div>
              <div><Label>業界</Label>
                <TextInput value={form.industry} onChange={(v) => setForm({ ...form, industry: v })} placeholder="建設・製造・IT 等" />
              </div>
              <div><Label>接待の目的</Label>
                <Select value={form.goal} onChange={(v) => setForm({ ...form, goal: v })} options={['新規開拓', '契約締結', '関係維持', 'お詫び']} />
              </div>
              <div><Label>予算</Label>
                <Select value={form.budget} onChange={(v) => setForm({ ...form, budget: v })} options={['5万', '10万', '20万', '30万以上']} />
              </div>
            </div>
            <div className="mt-5">
              <PrimaryButton onClick={generate} loading={loading} icon={<UtensilsCrossed size={16} />}>シナリオ生成</PrimaryButton>
            </div>
            {error && <div className="mt-3"><ErrorBanner message={error} /></div>}
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card>
            <div className="font-display text-lg tracking-wider mb-4" style={{ color: colors.cream }}>SCENARIO BLUEPRINT</div>
            <div className="crimson-line mb-5" />
            {!result && !loading && (
              <div className="py-16 text-center font-jp text-sm" style={{ color: colors.creamMuted }}>左で条件選択 → シナリオ生成</div>
            )}
            {loading && (
              <div className="py-16 text-center">
                <Loader2 size={28} className="animate-spin mx-auto" style={{ color: colors.crimson }} />
                <div className="font-jp text-sm mt-3" style={{ color: colors.creamMuted }}>しゅんが接待を組み立てています…</div>
              </div>
            )}
            {result && !result.raw && (
              <div className="space-y-5">
                <Block label="席選び戦略" body={result.seat_strategy} num="01" />
                <div className="fade-up">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-display text-xs tracking-widest" style={{ color: colors.crimson }}>02</span>
                    <div className="font-jp font-bold text-sm" style={{ color: colors.gold }}>料理順序</div>
                  </div>
                  <div className="flex flex-wrap gap-2 pl-8">
                    {(result.menu_sequence || []).map((m, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-full text-xs font-jp" style={{ background: 'rgba(212,175,55,0.1)', border: `1px solid ${colors.goldDeep}`, color: colors.cream }}>
                        {i + 1}. {m}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="fade-up">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-display text-xs tracking-widest" style={{ color: colors.crimson }}>03</span>
                    <div className="font-jp font-bold text-sm" style={{ color: colors.gold }}>話題のタイミング</div>
                  </div>
                  <ol className="space-y-2 pl-8 font-jp text-sm" style={{ color: colors.cream }}>
                    {(result.talking_points || []).map((p, i) => (
                      <li key={i}>· {p}</li>
                    ))}
                  </ol>
                </div>
                <Block label="退店時の決め台詞" body={result.closing_line} num="04" />
                <Block label="翌日フォローアップ" body={result.follow_up} num="05" />
              </div>
            )}
            {result && result.raw && (
              <div className="font-jp whitespace-pre-wrap text-sm" style={{ color: colors.cream }}>{result.raw}</div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

const Block = ({ label, body, num }) => (
  <div className="fade-up">
    <div className="flex items-center gap-3 mb-2">
      <span className="font-display text-xs tracking-widest" style={{ color: colors.crimson }}>{num}</span>
      <div className="font-jp font-bold text-sm" style={{ color: colors.gold }}>{label}</div>
      <div className="flex-1 h-px" style={{ background: 'rgba(212,175,55,0.15)' }} />
    </div>
    <p className="font-jp leading-relaxed text-[15px] pl-8" style={{ color: colors.cream }}>{body || '（生成内容なし）'}</p>
  </div>
);

/* ==========================================================================
   MODULE 6-4 — FUCARS 体験設計ジェネレーター
   ========================================================================== */
const FucarsModule = () => {
  const [scene, setScene] = useState('デート（記念日）');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    setLoading(true); setError(''); setResult(null);
    const sys = `${SYSTEM_BASE}
あなたはFUCARS（伊勢崎・シーシャ&犬&高級車コンセプト店）の体験設計を担当します。
写真映えスポット、ドリンクの順序、犬と高級車を活用した演出、SNS投稿テンプレまで全て指定してください。
必ず以下のJSON形式のみで出力:
{"hook":"そのシーンを一言で表すキャッチコピー","photo_spots":["スポット1","スポット2","スポット3"],"drink_flow":["最初の一杯","中盤","締め"],"production":"犬と高級車を絡めた演出フロー","sns_caption":"そのまま投稿できるInstagramキャプション（ハッシュタグ含む）"}`;
    const usr = `シーン: ${scene}`;
    const r = await callClaude(sys, usr);
    setLoading(false);
    if (!r.ok) { setError(r.error); return; }
    setResult(r.data);
  };

  const scenes = ['デート（記念日）', 'デート（告白）', 'インフルエンサー撮影会', '法人接待', '個人記念'];

  return (
    <div className="px-5 md:px-10 py-8 md:py-12 max-w-6xl mx-auto">
      <SectionTitle kicker="Module 04 · FUCARS" title="体験設計ジェネレーター" jp="シーシャ × 犬 × 高級車 — 一度きりの体験を設計する。" />
      <div className="mb-6">
        <Label>シーン選択</Label>
        <div className="flex flex-wrap gap-2">
          {scenes.map((s) => (
            <button
              key={s}
              onClick={() => setScene(s)}
              className="tap-target px-4 py-2.5 rounded-full text-sm font-jp transition"
              style={{
                background: scene === s ? colors.crimson : 'rgba(212,175,55,0.06)',
                border: `1px solid ${scene === s ? colors.crimson : colors.goldDeep}`,
                color: colors.cream,
              }}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="mt-5">
          <PrimaryButton onClick={generate} loading={loading} icon={<Camera size={16} />}>体験設計を生成</PrimaryButton>
        </div>
        {error && <div className="mt-3"><ErrorBanner message={error} /></div>}
      </div>

      <Card>
        {!result && !loading && (
          <div className="py-16 text-center font-jp text-sm" style={{ color: colors.creamMuted }}>シーンを選んで生成ボタンを押すと、そのシーン専用の体験フローが出ます。</div>
        )}
        {loading && (
          <div className="py-16 text-center">
            <Loader2 size={28} className="animate-spin mx-auto" style={{ color: colors.crimson }} />
            <div className="font-jp text-sm mt-3" style={{ color: colors.creamMuted }}>体験を設計中…</div>
          </div>
        )}
        {result && !result.raw && (
          <div className="space-y-6">
            <div className="text-center fade-up">
              <div className="text-[10px] tracking-widest uppercase mb-1" style={{ color: colors.gold }}>HOOK</div>
              <div className="font-display font-black text-2xl md:text-3xl leading-tight" style={{ color: colors.cream }}>{result.hook}</div>
            </div>
            <div className="crimson-line" />
            <Block label="映えスポット 3選" body={(result.photo_spots || []).map((s, i) => `${i + 1}. ${s}`).join('\n')} num="01" />
            <Block label="ドリンクフロー"  body={(result.drink_flow || []).map((d, i) => `${i + 1}. ${d}`).join('\n')} num="02" />
            <Block label="演出フロー（犬 × 高級車）" body={result.production} num="03" />
            <div className="fade-up">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-display text-xs tracking-widest" style={{ color: colors.crimson }}>04</span>
                <div className="font-jp font-bold text-sm" style={{ color: colors.gold }}>SNS 投稿テンプレ</div>
              </div>
              <div className="pl-8">
                <div className="p-4 rounded-lg font-jp text-sm whitespace-pre-wrap" style={{ background: 'rgba(5,4,3,0.6)', border: `1px solid ${colors.goldDeep}`, color: colors.cream }}>
                  {result.sns_caption}
                </div>
              </div>
            </div>
          </div>
        )}
        {result && result.raw && (
          <div className="font-jp whitespace-pre-wrap text-sm" style={{ color: colors.cream }}>{result.raw}</div>
        )}
      </Card>
    </div>
  );
};

/* ==========================================================================
   MODULE 6-5 — K&S 結果コミット診断
   ========================================================================== */
const KsModule = () => {
  const [form, setForm] = useState({
    height: '175', weight: '78', bodyFat: '22', goal: '減量5kg', months: '3',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    setLoading(true); setError(''); setResult(null);
    const sys = `${SYSTEM_BASE}
あなたはK&S（パーソナルジム・ヨガ・オーダースーツ）の結果コミット診断AIです。
目標から逆算した必要セッション数、食事戦略の要点、スーツオーダーのタイミング、達成時の自分のビジュアル予測を提示してください。
必ず以下のJSON形式のみで出力:
{"sessions_per_week":数値,"total_sessions":数値,"nutrition":"食事戦略の要点3点を1文ずつ","suit_timing":"オーダースーツの最適タイミング","future_self":"達成時の自分のビジュアルと感覚を物語で描写"}`;
    const usr = `現状:
身長: ${form.height}cm
体重: ${form.weight}kg
体脂肪: ${form.bodyFat}%
目標: ${form.goal}
期間: ${form.months}ヶ月`;
    const r = await callClaude(sys, usr);
    setLoading(false);
    if (!r.ok) { setError(r.error); return; }
    setResult(r.data);
  };

  return (
    <div className="px-5 md:px-10 py-8 md:py-12 max-w-6xl mx-auto">
      <SectionTitle kicker="Module 05 · K&S" title="結果コミット診断" jp="目標から逆算する、しゅん流ボディメイク戦略。" />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2">
          <Card>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>身長</Label><TextInput value={form.height} onChange={(v) => setForm({ ...form, height: v })} /></div>
              <div><Label>体重</Label><TextInput value={form.weight} onChange={(v) => setForm({ ...form, weight: v })} /></div>
              <div><Label>体脂肪</Label><TextInput value={form.bodyFat} onChange={(v) => setForm({ ...form, bodyFat: v })} /></div>
            </div>
            <div className="mt-4"><Label>目標</Label>
              <TextInput value={form.goal} onChange={(v) => setForm({ ...form, goal: v })} placeholder="減量5kg / 増量3kg / スーツ44R 等" />
            </div>
            <div className="mt-4"><Label>達成期間（月）</Label>
              <Select value={form.months} onChange={(v) => setForm({ ...form, months: v })} options={['1', '2', '3', '6', '12']} />
            </div>
            <div className="mt-5">
              <PrimaryButton onClick={generate} loading={loading} icon={<Target size={16} />}>診断する</PrimaryButton>
            </div>
            {error && <div className="mt-3"><ErrorBanner message={error} /></div>}
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card>
            <div className="font-display text-lg tracking-wider mb-4" style={{ color: colors.cream }}>COMMIT PLAN</div>
            <div className="crimson-line mb-5" />
            {!result && !loading && (
              <div className="py-16 text-center font-jp text-sm" style={{ color: colors.creamMuted }}>左に体型情報を入力 → 診断する</div>
            )}
            {loading && (
              <div className="py-16 text-center">
                <Loader2 size={28} className="animate-spin mx-auto" style={{ color: colors.crimson }} />
                <div className="font-jp text-sm mt-3" style={{ color: colors.creamMuted }}>逆算しています…</div>
              </div>
            )}
            {result && !result.raw && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(220,20,60,0.08)', border: `1px solid ${colors.crimson}` }}>
                    <div className="text-[10px] tracking-widest uppercase" style={{ color: colors.crimson }}>WEEKLY</div>
                    <div className="font-display font-black text-3xl mt-1" style={{ color: colors.cream }}>{result.sessions_per_week ?? '—'}</div>
                    <div className="text-[10px] font-jp" style={{ color: colors.creamMuted }}>セッション / 週</div>
                  </div>
                  <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(212,175,55,0.08)', border: `1px solid ${colors.goldDeep}` }}>
                    <div className="text-[10px] tracking-widest uppercase" style={{ color: colors.gold }}>TOTAL</div>
                    <div className="font-display font-black text-3xl mt-1" style={{ color: colors.cream }}>{result.total_sessions ?? '—'}</div>
                    <div className="text-[10px] font-jp" style={{ color: colors.creamMuted }}>セッション / 期間中合計</div>
                  </div>
                </div>
                <Block label="食事戦略"           body={result.nutrition}   num="01" />
                <Block label="スーツオーダー タイミング" body={result.suit_timing} num="02" />
                <Block label="達成時の自分"       body={result.future_self} num="03" />
              </div>
            )}
            {result && result.raw && (
              <div className="font-jp whitespace-pre-wrap text-sm" style={{ color: colors.cream }}>{result.raw}</div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

/* ==========================================================================
   MODULE 6-6 — 北関東総合企画 利回り計算機
   ========================================================================== */
const KitakantoModule = () => {
  const [form, setForm] = useState({
    price: '4500', rent: '23', area: '高崎', age: '12',
  });

  const calc = useMemo(() => {
    const p = parseFloat(form.price) * 10000;
    const annualRent = parseFloat(form.rent) * 10000 * 12;
    if (!p || !annualRent) return null;
    const surface = ((annualRent / p) * 100).toFixed(2);
    const expenseRate = 0.22;
    const net = (((annualRent * (1 - expenseRate)) / p) * 100).toFixed(2);
    const areaScores = { 高崎: 82, 前橋: 78, 伊勢崎: 73, 太田: 76, 桐生: 65 };
    const score = areaScores[form.area] || 70;
    const ageDiscount = Math.max(0.7, 1 - parseFloat(form.age) * 0.012);
    const futureVal = Math.round((p * (1 + (score - 70) * 0.003 * 10)) * ageDiscount / 10000);
    return { surface, net, score, futureVal };
  }, [form]);

  return (
    <div className="px-5 md:px-10 py-8 md:py-12 max-w-6xl mx-auto">
      <SectionTitle kicker="Module 06 · 北関東総合企画" title="利回り計算機" jp="群馬の物件投資、実質利回りと将来価値を即算定。" />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2">
          <Card>
            <div className="space-y-4">
              <div><Label>物件価格（万円）</Label><TextInput value={form.price} onChange={(v) => setForm({ ...form, price: v })} /></div>
              <div><Label>想定月額家賃（万円）</Label><TextInput value={form.rent} onChange={(v) => setForm({ ...form, rent: v })} /></div>
              <div><Label>エリア</Label>
                <Select value={form.area} onChange={(v) => setForm({ ...form, area: v })} options={['高崎', '前橋', '伊勢崎', '太田', '桐生']} />
              </div>
              <div><Label>築年数</Label><TextInput value={form.age} onChange={(v) => setForm({ ...form, age: v })} /></div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card>
            <div className="font-display text-lg tracking-wider mb-4" style={{ color: colors.cream }}>YIELD ANALYSIS</div>
            <div className="crimson-line mb-5" />
            {!calc && (
              <div className="font-jp text-sm" style={{ color: colors.creamMuted }}>物件価格と家賃を入力してください。</div>
            )}
            {calc && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-5 rounded-xl text-center" style={{ background: 'rgba(212,175,55,0.08)', border: `1px solid ${colors.goldDeep}` }}>
                    <div className="text-[10px] tracking-widest uppercase" style={{ color: colors.gold }}>表面利回り</div>
                    <div className="font-display font-black text-4xl mt-1" style={{ color: colors.cream }}>{calc.surface}<span className="text-xl">%</span></div>
                  </div>
                  <div className="p-5 rounded-xl text-center" style={{ background: 'rgba(220,20,60,0.08)', border: `1px solid ${colors.crimson}` }}>
                    <div className="text-[10px] tracking-widest uppercase" style={{ color: colors.crimson }}>実質利回り</div>
                    <div className="font-display font-black text-4xl mt-1" style={{ color: colors.cream }}>{calc.net}<span className="text-xl">%</span></div>
                    <div className="text-[10px] mt-1 font-jp" style={{ color: colors.creamMuted }}>諸経費22%控除後</div>
                  </div>
                </div>

                <Card className="!bg-transparent !p-4" style={{ border: `1px solid ${colors.goldDeep}` }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[11px] tracking-widest uppercase" style={{ color: colors.gold }}>エリア将来性スコア</div>
                    <div className="font-display font-black text-2xl" style={{ color: colors.cream }}>{calc.score}<span className="text-xs">/100</span></div>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(212,175,55,0.15)' }}>
                    <div className="h-full" style={{ width: `${calc.score}%`, background: `linear-gradient(90deg, ${colors.crimson}, ${colors.gold})` }} />
                  </div>
                  <div className="text-[10px] mt-2 font-jp" style={{ color: colors.creamMuted }}>
                    群馬県人口動態 × 新幹線アクセス × 商業施設密度の3軸から算出（{form.area}）
                  </div>
                </Card>

                <Card className="!bg-transparent !p-4" style={{ border: `1px solid ${colors.crimson}` }}>
                  <div className="text-[10px] tracking-widest uppercase mb-1" style={{ color: colors.crimson }}>10年後の予測資産価値</div>
                  <div className="font-display font-black text-3xl" style={{ color: colors.cream }}>¥{calc.futureVal.toLocaleString()}<span className="text-base"> 万円</span></div>
                  <div className="text-[10px] mt-2 font-jp" style={{ color: colors.creamMuted }}>築年数減価 × エリアスコア補正</div>
                </Card>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

/* ==========================================================================
   ROOT — RamboOSApp
   ========================================================================== */
export default function RamboOSApp() {
  const [activeModule, setActiveModule] = useState('dashboard');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeModule]);

  return (
    <Bg>
      <style>{fontStyles}</style>
      <Header activeModule={activeModule} setActiveModule={setActiveModule} />
      {activeModule === 'dashboard'  && <Dashboard onSelect={setActiveModule} />}
      {activeModule === 'firstclass' && <FirstclassModule />}
      {activeModule === 'kizuna'     && <KizunaModule />}
      {activeModule === 'iroha'      && <IrohaModule />}
      {activeModule === 'fucars'     && <FucarsModule />}
      {activeModule === 'ks'         && <KsModule />}
      {activeModule === 'kitakanto'  && <KitakantoModule />}
      <div className="text-center py-8 text-[10px] tracking-[0.3em] uppercase" style={{ color: colors.creamDim }}>
        RAMBO OS v0.2 · Built for SHUN ARAKI · 6 Business Units · {new Date().getFullYear()}
      </div>
    </Bg>
  );
}
