"use client";
import { useState, useEffect, useRef } from "react";

// ── Registry Ticker ────────────────────────────────────────────────────────
const TICKER_EVENTS = [
  { state:"Lagos", action:"C of O verified", ref:"LG/2026/04821", time:"2s ago" },
  { state:"Abuja", action:"NIN matched", ref:"AB/2026/00934", time:"8s ago" },
  { state:"Rivers", action:"Title search complete", ref:"RV/2026/01247", time:"14s ago" },
  { state:"Oyo", action:"Deed of Assignment logged", ref:"OY/2026/00512", time:"21s ago" },
  { state:"Lagos", action:"Survey plan confirmed", ref:"LG/2026/04822", time:"35s ago" },
  { state:"Enugu", action:"C of O verified", ref:"EN/2026/00318", time:"42s ago" },
  { state:"Delta", action:"Registry check passed", ref:"DT/2026/00721", time:"58s ago" },
  { state:"Abuja", action:"Escrow secured", ref:"AB/2026/00935", time:"1m ago" },
  { state:"Kano", action:"Agent KYC cleared", ref:"KN/2026/00204", time:"1m ago" },
  { state:"Lagos", action:"C of O verified", ref:"LG/2026/04823", time:"2m ago" },
];

export function RegistryTicker() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex(i => (i + 1) % TICKER_EVENTS.length);
        setVisible(true);
      }, 400);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const event = TICKER_EVENTS[index];

  return (
    <div style={{
      marginTop:"14px",
      background:"rgba(255,255,255,0.07)",
      borderRadius:"8px",
      padding:"8px 14px",
      display:"flex",
      alignItems:"center",
      gap:"10px",
      overflow:"hidden",
      border:"1px solid rgba(255,255,255,0.08)",
    }}>
      <div style={{display:"flex",alignItems:"center",gap:"5px",flexShrink:0}}>
        <div style={{
          width:"6px",height:"6px",borderRadius:"50%",
          background:"#4ade80",
          animation:"livePulse 2s infinite",
        }} />
        <span style={{fontSize:"10px",color:"rgba(255,255,255,0.5)",fontWeight:"600",letterSpacing:"1px",textTransform:"uppercase"}}>Live</span>
      </div>
      <div style={{width:"1px",height:"16px",background:"rgba(255,255,255,0.1)",flexShrink:0}} />
      <div style={{
        flex:1,
        opacity:visible?1:0,
        transform:visible?"translateY(0)":"translateY(-8px)",
        transition:"opacity 0.35s ease, transform 0.35s ease",
        display:"flex",
        alignItems:"center",
        gap:"8px",
        minWidth:0,
      }}>
        <span style={{fontSize:"11px",color:"rgba(255,255,255,0.4)",flexShrink:0}}>{event.state}</span>
        <span style={{fontSize:"11px",color:"rgba(255,255,255,0.75)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
          {event.action}
        </span>
        <span style={{fontSize:"10px",fontFamily:"monospace",color:"rgba(255,255,255,0.3)",flexShrink:0}}>{event.ref}</span>
      </div>
      <span style={{fontSize:"10px",color:"rgba(255,255,255,0.3)",flexShrink:0}}>{event.time}</span>
    </div>
  );
}


// ── Count-up animation hook ────────────────────────────────────────────────
function useCountUp(target: number, duration: number = 1800) {
  const [count, setCount] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const start = performance.now();
    const startVal = Math.max(0, target - Math.floor(target * 0.15));

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(startVal + (target - startVal) * eased);
      setCount(current);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);

  return count;
}


// ── Live Stats with Count-up + Pulsing Dots ────────────────────────────────
export function LiveStats() {
  const listings = useCountUp(2847, 1600);
  const agents = useCountUp(143, 1400);
  const [pulses, setPulses] = useState([false, false, false]);
  const [liveListings, setLiveListings] = useState(2847);
  const [liveAgents, setLiveAgents] = useState(143);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      setLiveListings(listings);
      setLiveAgents(agents);
    }
  }, [listings, agents]);

  // Live incrementing after count-up
  useEffect(() => {
    const t1 = setInterval(() => {
      setLiveListings(n => n + 1);
      setPulses(p => { const n=[...p]; n[0]=true; return n; });
      setTimeout(() => setPulses(p => { const n=[...p]; n[0]=false; return n; }), 600);
    }, 8000);
    const t2 = setInterval(() => {
      setLiveAgents(n => n + 1);
      setPulses(p => { const n=[...p]; n[1]=true; return n; });
      setTimeout(() => setPulses(p => { const n=[...p]; n[1]=false; return n; }), 600);
    }, 28000);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, []);

  const stats = [
    { value: listings > 0 ? liveListings : listings, label:"Verified listings", live:true, suffix:"" },
    { value: agents > 0 ? liveAgents : agents, label:"KYC'd agents", live:true, suffix:"" },
    { value: 98, label:"Title accuracy", live:false, suffix:"%" },
  ];

  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"10px",padding:"16px"}}>
      {stats.map((stat, i) => (
        <div key={stat.label} style={{
          background:"var(--bg-card,#f8f8f8)",
          borderRadius:"10px",
          padding:"12px",
          textAlign:"center",
          border:"1px solid var(--border,#eee)",
          position:"relative",
          overflow:"hidden",
        }}>
          {pulses[i] && (
            <div style={{
              position:"absolute",top:0,left:0,right:0,bottom:0,
              borderRadius:"10px",
              border:"2px solid #0A5C3F",
              animation:"statPulse 0.6s ease-out forwards",
              pointerEvents:"none",
            }} />
          )}
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"5px",marginBottom:"4px"}}>
            {stat.live && (
              <div style={{
                width:"5px",height:"5px",borderRadius:"50%",
                background:"#0A5C3F",
                animation:"livePulse 2s infinite",
                flexShrink:0,
              }} />
            )}
            <span style={{
              color:"#0A5C3F",fontSize:"22px",fontWeight:"700",
              fontVariantNumeric:"tabular-nums",
            }}>
              {stat.value.toLocaleString()}{stat.suffix}
            </span>
          </div>
          <span style={{fontSize:"11px",color:"var(--text-muted,#888)"}}>{stat.label}</span>
        </div>
      ))}
      <style>{`
        @keyframes livePulse {
          0%{box-shadow:0 0 0 0 rgba(10,92,63,0.5)}
          70%{box-shadow:0 0 0 5px rgba(10,92,63,0)}
          100%{box-shadow:0 0 0 0 rgba(10,92,63,0)}
        }
        @keyframes statPulse {
          0%{opacity:1;transform:scale(1)}
          100%{opacity:0;transform:scale(1.05)}
        }
      `}</style>
    </div>
  );
}


// ── Dynamic Search Button ──────────────────────────────────────────────────
const SEARCH_PHRASES = [
  { text:"Search properties", sub:"Across all 36 states" },
  { text:"Find your home", sub:"Verified · Zero title risk" },
  { text:"Explore premium assets", sub:"C of O confirmed listings" },
  { text:"Discover secure listings", sub:"Registry-backed titles" },
  { text:"Search verified homes", sub:"NIN-cleared agents only" },
];

interface DynamicSearchButtonProps {
  onClick: () => void;
  tab: string;
  state: string;
  lga: string;
  city: string;
}

export function DynamicSearchButton({ onClick, tab, state, lga, city }: DynamicSearchButtonProps) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const getContextualText = () => {
    if (tab === "Rent") return { text:`Search rentals in ${lga || city || state}`, sub:"Verified rental listings" };
    if (tab === "Shortlet") return { text:`Find shortlets in ${city || state}`, sub:"Short-stay verified properties" };
    if (tab === "Verify Title") return { text:"Verify property title", sub:"Instant registry check" };
    if (lga) return { text:`Search in ${lga}`, sub:`${state} · Verified listings` };
    if (city) return { text:`Search in ${city}`, sub:`${state} · Verified listings` };
    if (state && state !== "Lagos") return { text:`Search in ${state}`, sub:"Verified listings" };
    return SEARCH_PHRASES[phraseIndex];
  };

  const isContextual = tab !== "Buy" || lga || city || (state && state !== "Lagos");

  useEffect(() => {
    if (isContextual) return;
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setPhraseIndex(i => (i + 1) % SEARCH_PHRASES.length);
        setFade(true);
      }, 250);
    }, 4000);
    return () => clearInterval(interval);
  }, [isContextual]);

  const phrase = getContextualText();

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width:"100%",
        background:"linear-gradient(135deg,#0A5C3F,#0d6b48)",
        color:"white",
        border:"none",
        borderRadius:"10px",
        padding:"0",
        fontSize:"15px",
        fontWeight:"500",
        cursor:"pointer",
        transition:"all 0.2s ease",
        transform:isHovered?"translateY(-1px)":"translateY(0)",
        boxShadow:isHovered?"0 8px 24px rgba(10,92,63,0.4)":"0 2px 8px rgba(10,92,63,0.2)",
        overflow:"hidden",
      }}
    >
      <div style={{
        padding:"13px 20px",
        display:"flex",
        alignItems:"center",
        justifyContent:"space-between",
        background:isHovered?"rgba(255,255,255,0.06)":"transparent",
        transition:"background 0.2s",
      }}>
        <div style={{
          textAlign:"left",
          opacity:fade?1:0,
          transition:"opacity 0.25s ease",
        }}>
          <div style={{fontSize:"14px",fontWeight:"600",lineHeight:1.2}}>
            {phrase.text}
          </div>
          <div style={{fontSize:"10px",color:"rgba(255,255,255,0.55)",marginTop:"2px",letterSpacing:"0.3px"}}>
            {phrase.sub}
          </div>
        </div>
        <span style={{
          fontSize:"18px",
          transition:"transform 0.2s ease",
          transform:isHovered?"translateX(4px)":"translateX(0)",
          flexShrink:0,
          marginLeft:"12px",
        }}>→</span>
      </div>
    </button>
  );
}


// ── Interactive Trust Badges ───────────────────────────────────────────────
const BADGE_INFO = [
  {
    id: "nin",
    label: "NIN-verified agents",
    dot: false,
    dotColor: "",
    icon: "🪪",
    title: "NIN-Verified Agents",
    subtitle: "Every agent is identity-verified",
    details: [
      "All agents submit their 11-digit National Identity Number (NIN)",
      "Face-match liveness check via Smile Identity",
      "Real-time verification against NIMC national database",
      "Agents with failed or expired KYC are automatically suspended",
    ],
    stat: "143 agents cleared",
    statColor: "#0A5C3F",
  },
  {
    id: "coo",
    label: "C of O Auditing Live",
    dot: true,
    dotColor: "#4ade80",
    icon: "🔍",
    title: "C of O Auditing Live",
    subtitle: "Real-time title registry verification",
    details: [
      "Every Certificate of Occupancy is checked against state land registries",
      "Survey plans are cross-referenced with physical boundaries",
      "Encumbrance checks run on all listed properties",
      "Audit results update in real-time as registry data changes",
    ],
    stat: "98% title accuracy",
    statColor: "#0A5C3F",
  },
  {
    id: "escrow",
    label: "✓ Escrow protected",
    dot: false,
    dotColor: "",
    icon: "🔒",
    title: "Paystack Escrow Protection",
    subtitle: "Your funds are never at risk",
    details: [
      "Payments are held by Paystack — never touched by agents",
      "4-milestone release: Payment → Legal Search → Deed Signing → Release",
      "Full refund if title verification fails at any stage",
      "Powered by Paystack, Nigeria's most trusted payment infrastructure",
    ],
    stat: "₦0 lost to fraud",
    statColor: "#0A5C3F",
  },
];

export function TrustBadges() {
  const [active, setActive] = useState<string | null>(null);

  return (
    <>
      <div style={{display:"flex",gap:"14px",flexWrap:"wrap",alignItems:"center",marginTop:"16px"}}>
        {BADGE_INFO.map(badge => (
          <button
            key={badge.id}
            onClick={() => setActive(active === badge.id ? null : badge.id)}
            style={{
              background: active === badge.id ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.08)",
              border: `1px solid ${active === badge.id ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.12)"}`,
              borderRadius:"20px",
              padding:"5px 12px",
              cursor:"pointer",
              display:"flex",
              alignItems:"center",
              gap:"6px",
              transition:"all 0.2s ease",
            }}
          >
            {badge.dot && (
              <div style={{
                width:"6px",height:"6px",borderRadius:"50%",
                background:badge.dotColor,
                animation:"livePulse 2s infinite",
                flexShrink:0,
              }} />
            )}
            <span style={{
              color: active === badge.id ? "white" : "rgba(255,255,255,0.75)",
              fontSize:"12px",
              fontWeight: active === badge.id ? "500" : "400",
            }}>
              {badge.label}
            </span>
            <span style={{color:"rgba(255,255,255,0.4)",fontSize:"10px"}}>
              {active === badge.id ? "▲" : "▼"}
            </span>
          </button>
        ))}
      </div>

      <p style={{color:"rgba(255,255,255,0.3)",fontSize:"10px",marginTop:"8px",letterSpacing:"0.5px"}}>
        UNCOMPROMISING REAL-TIME SECURITY · TAP TO LEARN MORE
      </p>

      {/* Expanded panel */}
      {active && (() => {
        const badge = BADGE_INFO.find(b => b.id === active)!;
        return (
          <div style={{
            marginTop:"12px",
            background:"rgba(255,255,255,0.07)",
            border:"1px solid rgba(255,255,255,0.12)",
            borderRadius:"12px",
            padding:"16px",
            animation:"fadeSlideIn 0.25s ease",
          }}>
            <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"12px"}}>
              <span style={{fontSize:"22px"}}>{badge.icon}</span>
              <div>
                <div style={{fontSize:"14px",fontWeight:"600",color:"white"}}>{badge.title}</div>
                <div style={{fontSize:"11px",color:"rgba(255,255,255,0.5)"}}>{badge.subtitle}</div>
              </div>
              <div style={{marginLeft:"auto",background:"rgba(10,92,63,0.4)",borderRadius:"6px",padding:"3px 10px",fontSize:"11px",color:"#4ade80",fontWeight:"500"}}>
                {badge.stat}
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
              {badge.details.map((detail, i) => (
                <div key={i} style={{display:"flex",gap:"8px",alignItems:"flex-start"}}>
                  <span style={{color:"#4ade80",fontSize:"12px",flexShrink:0,marginTop:"1px"}}>✓</span>
                  <span style={{fontSize:"12px",color:"rgba(255,255,255,0.7)",lineHeight:"1.5"}}>{detail}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      <style>{`
        @keyframes livePulse {
          0%{box-shadow:0 0 0 0 rgba(74,222,128,0.5)}
          70%{box-shadow:0 0 0 6px rgba(74,222,128,0)}
          100%{box-shadow:0 0 0 0 rgba(74,222,128,0)}
        }
        @keyframes fadeSlideIn {
          from{opacity:0;transform:translateY(-8px)}
          to{opacity:1;transform:translateY(0)}
        }
      `}</style>
    </>
  );
}
