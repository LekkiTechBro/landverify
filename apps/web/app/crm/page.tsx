"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Stage = "new" | "contacted" | "inspection" | "closed" | "lost";

interface Lead {
  id: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  property_title: string;
  property_price: number;
  property_type: string;
  state: string;
  lga: string;
  stage: Stage;
  priority: "high" | "medium" | "low";
  notes: string;
  created_at: string;
  last_contact: string;
  inspection_date?: string;
  budget?: number;
  source: string;
}

const MOCK_LEADS: Lead[] = [
  { id:"l1", buyer_name:"Emeka Okafor", buyer_email:"emeka@gmail.com", buyer_phone:"+234 801 234 5678", property_title:"3 Bedroom Flat, Lekki Phase 1", property_price:45000000, property_type:"Flat", state:"Lagos", lga:"Eti-Osa", stage:"new", priority:"high", notes:"Very interested, asked about C of O. Wants to view this weekend.", created_at:"2026-05-15", last_contact:"Today", source:"LandVerify Search" },
  { id:"l2", buyer_name:"Ngozi Adeyemi", buyer_email:"ngozi@yahoo.com", buyer_phone:"+234 802 345 6789", property_title:"3 Bedroom Flat, Lekki Phase 1", property_price:45000000, property_type:"Flat", state:"Lagos", lga:"Eti-Osa", stage:"contacted", priority:"medium", notes:"Diaspora buyer from London. Needs virtual tour first. Send pictures.", created_at:"2026-05-13", last_contact:"Yesterday", source:"Referral" },
  { id:"l3", buyer_name:"Bayo Salami", buyer_email:"bayo@hotmail.com", buyer_phone:"+234 803 456 7890", property_title:"Land, Ibeju-Lekki", property_price:8000000, property_type:"Land", state:"Lagos", lga:"Ibeju-Lekki", stage:"inspection", priority:"high", notes:"Inspection booked for Saturday 10am. Bring survey plan copy.", created_at:"2026-05-10", last_contact:"2 days ago", inspection_date:"2026-05-17", source:"LandVerify Search" },
  { id:"l4", buyer_name:"Chidinma Eze", buyer_email:"chidinma@gmail.com", buyer_phone:"+234 804 567 8901", property_title:"3 Bedroom Flat, Lekki Phase 1", property_price:45000000, property_type:"Flat", state:"Lagos", lga:"Eti-Osa", stage:"closed", priority:"low", notes:"Deal closed. Deposit paid. C of O transfer in progress.", created_at:"2026-05-01", last_contact:"Last week", source:"LandVerify Search" },
  { id:"l5", buyer_name:"Tunde Fashola", buyer_email:"tunde@gmail.com", buyer_phone:"+234 805 678 9012", property_title:"4 Bedroom Duplex, Magodo", property_price:85000000, property_type:"Duplex", state:"Lagos", lga:"Kosofe", stage:"new", priority:"medium", notes:"First enquiry. Has not responded to follow-up yet.", created_at:"2026-05-14", last_contact:"Yesterday", source:"WhatsApp" },
  { id:"l6", buyer_name:"Amaka Obi", buyer_email:"amaka@gmail.com", buyer_phone:"+234 806 789 0123", property_title:"Land, Ibeju-Lekki", property_price:8000000, property_type:"Land", state:"Lagos", lga:"Ibeju-Lekki", stage:"contacted", priority:"high", notes:"Serious investor. Looking at 2-3 plots. Budget 25M total.", created_at:"2026-05-12", last_contact:"Today", budget:25000000, source:"LandVerify Search" },
];

const STAGES: { key: Stage; label: string; color: string; bg: string; icon: string }[] = [
  { key:"new",        label:"New Enquiry",          color:"#1a4a6b", bg:"#E8F4FD", icon:"" },
  { key:"contacted",  label:"Contacted",            color:"#856404", bg:"#FFF3CD", icon:"" },
  { key:"inspection", label:"Inspection Scheduled", color:"#5a2d82", bg:"#F3E8FF", icon:"" },
  { key:"closed",     label:"Closed / Won",         color:"#0A5C3F", bg:"#E1F5EE", icon:"" },
];

const PRIORITY_STYLE = {
  high:   { color:"#C62828", bg:"#FDECEA", label:"High" },
  medium: { color:"#856404", bg:"#FFF3CD", label:"Medium" },
  low:    { color:"#555",    bg:"#f0f0f0", label:"Low" },
};

function formatPrice(p: number) {
  if (p >= 1000000) return "" + (p/1000000).toFixed(1) + "M";
  return "" + p.toLocaleString();
}

export default function CRMPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);
  const [view, setView] = useState<"pipeline" | "list">("pipeline");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [filterStage, setFilterStage] = useState<Stage | "all">("all");
  const [editNote, setEditNote] = useState("");
  const [showNoteEdit, setShowNoteEdit] = useState(false);

  const moveStage = (leadId: string, newStage: Stage) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, stage: newStage } : l));
    if (selectedLead?.id === leadId) setSelectedLead(prev => prev ? { ...prev, stage: newStage } : null);
  };

  const saveNote = (leadId: string, note: string) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, notes: note } : l));
    if (selectedLead?.id === leadId) setSelectedLead(prev => prev ? { ...prev, notes: note } : null);
    setShowNoteEdit(false);
  };

  const totalValue = leads.filter(l => l.stage !== "lost").reduce((a, l) => a + l.property_price, 0);
  const closedValue = leads.filter(l => l.stage === "closed").reduce((a, l) => a + l.property_price, 0);

  const filteredLeads = filterStage === "all" ? leads : leads.filter(l => l.stage === filterStage);

  return (
    <div style={{fontFamily:"system-ui,sans-serif",minHeight:"100vh",background:"#f5f5f5"}}>

      {/* Header */}
      <div style={{background:"#0A5C3F",padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:"16px"}}>
          <span onClick={() => router.push("/dashboard")} style={{color:"rgba(255,255,255,0.7)",fontSize:"20px",cursor:"pointer"}}></span>
          <span onClick={() => router.push("/")} style={{color:"white",fontSize:"18px",fontWeight:"600",cursor:"pointer"}}>
            Land<span style={{color:"#FAC775"}}>Verify</span>
          </span>
          <span style={{color:"rgba(255,255,255,0.5)",fontSize:"13px"}}>/ Lead CRM</span>
        </div>
        <div style={{display:"flex",gap:"8px"}}>
          <button onClick={() => setView("pipeline")}
            style={{background:view==="pipeline"?"white":"transparent",color:view==="pipeline"?"#0A5C3F":"rgba(255,255,255,0.7)",border:"none",borderRadius:"6px",padding:"6px 14px",fontSize:"13px",cursor:"pointer"}}>
            Pipeline
          </button>
          <button onClick={() => setView("list")}
            style={{background:view==="list"?"white":"transparent",color:view==="list"?"#0A5C3F":"rgba(255,255,255,0.7)",border:"none",borderRadius:"6px",padding:"6px 14px",fontSize:"13px",cursor:"pointer"}}>
            List
          </button>
        </div>
      </div>

      <div style={{maxWidth:"1100px",margin:"0 auto",padding:"20px"}}>

        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:"12px",marginBottom:"20px"}}>
          {[
            { label:"Total Leads", value:leads.length, color:"#333" },
            { label:"New", value:leads.filter(l=>l.stage==="new").length, color:"#1a4a6b" },
            { label:"In Progress", value:leads.filter(l=>["contacted","inspection"].includes(l.stage)).length, color:"#856404" },
            { label:"Closed", value:leads.filter(l=>l.stage==="closed").length, color:"#0A5C3F" },
            { label:"Pipeline Value", value:formatPrice(totalValue), color:"#0A5C3F" },
          ].map(s => (
            <div key={s.label} style={{background:"white",borderRadius:"10px",padding:"14px",border:"1px solid #eee",textAlign:"center"}}>
              <div style={{fontSize:"20px",fontWeight:"700",color:s.color,marginBottom:"4px"}}>{s.value}</div>
              <div style={{fontSize:"11px",color:"#888"}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* PIPELINE VIEW */}
        {view === "pipeline" && (
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"14px"}}>
            {STAGES.map(stage => {
              const stageLeads = leads.filter(l => l.stage === stage.key);
              return (
                <div key={stage.key} style={{background:"white",borderRadius:"12px",border:"1px solid #eee",overflow:"hidden"}}>
                  {/* Column header */}
                  <div style={{padding:"12px 14px",background:stage.bg,borderBottom:"1px solid #eee",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
                      <span>{stage.icon}</span>
                      <span style={{fontSize:"12px",fontWeight:"600",color:stage.color}}>{stage.label}</span>
                    </div>
                    <span style={{fontSize:"12px",fontWeight:"700",color:stage.color,background:"white",borderRadius:"10px",padding:"2px 8px"}}>{stageLeads.length}</span>
                  </div>

                  {/* Cards */}
                  <div style={{padding:"10px",display:"flex",flexDirection:"column",gap:"8px",minHeight:"200px"}}>
                    {stageLeads.length === 0 && (
                      <div style={{textAlign:"center",padding:"20px",color:"#ccc",fontSize:"12px"}}>No leads here</div>
                    )}
                    {stageLeads.map(lead => (
                      <div key={lead.id}
                        onClick={() => setSelectedLead(lead)}
                        style={{background:"#fafafa",borderRadius:"8px",padding:"10px 12px",border:"1px solid #eee",cursor:"pointer",borderLeft:`3px solid ${PRIORITY_STYLE[lead.priority].color}`}}
                        onMouseEnter={e => (e.currentTarget.style.background="#f0f0f0")}
                        onMouseLeave={e => (e.currentTarget.style.background="#fafafa")}>
                        <div style={{fontSize:"13px",fontWeight:"600",color:"#222",marginBottom:"3px"}}>{lead.buyer_name}</div>
                        <div style={{fontSize:"11px",color:"#888",marginBottom:"5px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{lead.property_title}</div>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <span style={{fontSize:"12px",fontWeight:"600",color:"#0A5C3F"}}>{formatPrice(lead.property_price)}</span>
                          <span style={{fontSize:"10px",background:PRIORITY_STYLE[lead.priority].bg,color:PRIORITY_STYLE[lead.priority].color,borderRadius:"4px",padding:"2px 6px"}}>{PRIORITY_STYLE[lead.priority].label}</span>
                        </div>
                        <div style={{fontSize:"10px",color:"#aaa",marginTop:"4px"}}>{lead.source} · {lead.last_contact}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* LIST VIEW */}
        {view === "list" && (
          <div style={{background:"white",borderRadius:"12px",border:"1px solid #eee",overflow:"hidden"}}>
            {/* Filter tabs */}
            <div style={{display:"flex",gap:"0",borderBottom:"1px solid #eee",padding:"0 16px"}}>
              {([["all","All"],["new","New"],["contacted","Contacted"],["inspection","Inspection"],["closed","Closed"]] as [Stage|"all",string][]).map(([key,label]) => (
                <button key={key} onClick={() => setFilterStage(key)}
                  style={{padding:"12px 16px",border:"none",background:"none",fontSize:"13px",cursor:"pointer",color:filterStage===key?"#0A5C3F":"#888",borderBottom:filterStage===key?"2px solid #0A5C3F":"2px solid transparent",fontWeight:filterStage===key?"600":"400"}}>
                  {label} ({key==="all"?leads.length:leads.filter(l=>l.stage===key).length})
                </button>
              ))}
            </div>

            <div style={{padding:"0"}}>
              {filteredLeads.map((lead, i) => (
                <div key={lead.id} onClick={() => setSelectedLead(lead)}
                  style={{display:"grid",gridTemplateColumns:"1fr 180px 100px 90px 80px",gap:"12px",padding:"14px 16px",borderBottom:"1px solid #f5f5f5",cursor:"pointer",alignItems:"center",background:"white"}}
                  onMouseEnter={e => (e.currentTarget.style.background="#f8f8f8")}
                  onMouseLeave={e => (e.currentTarget.style.background="white")}>
                  <div>
                    <div style={{fontSize:"14px",fontWeight:"600",color:"#222",marginBottom:"2px"}}>{lead.buyer_name}</div>
                    <div style={{fontSize:"12px",color:"#888"}}>{lead.property_title}</div>
                  </div>
                  <div style={{fontSize:"13px",fontWeight:"600",color:"#0A5C3F"}}>{formatPrice(lead.property_price)}</div>
                  <div>
                    {STAGES.find(s=>s.key===lead.stage) && (
                      <span style={{fontSize:"11px",fontWeight:"500",background:STAGES.find(s=>s.key===lead.stage)!.bg,color:STAGES.find(s=>s.key===lead.stage)!.color,borderRadius:"4px",padding:"3px 8px"}}>
                        {STAGES.find(s=>s.key===lead.stage)!.label}
                      </span>
                    )}
                  </div>
                  <div>
                    <span style={{fontSize:"11px",background:PRIORITY_STYLE[lead.priority].bg,color:PRIORITY_STYLE[lead.priority].color,borderRadius:"4px",padding:"3px 8px"}}>
                      {PRIORITY_STYLE[lead.priority].label}
                    </span>
                  </div>
                  <div style={{fontSize:"12px",color:"#aaa"}}>{lead.last_contact}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lead detail panel */}
      {selectedLead && (
        <div style={{position:"fixed",top:0,right:0,bottom:0,width:"380px",background:"white",boxShadow:"-4px 0 20px rgba(0,0,0,0.1)",zIndex:100,overflowY:"auto",display:"flex",flexDirection:"column"}}>

          {/* Panel header */}
          <div style={{padding:"16px 20px",borderBottom:"1px solid #eee",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0,background:"#0A5C3F"}}>
            <div>
              <div style={{fontSize:"15px",fontWeight:"600",color:"white"}}>{selectedLead.buyer_name}</div>
              <div style={{fontSize:"11px",color:"rgba(255,255,255,0.6)"}}>{selectedLead.source} · {selectedLead.last_contact}</div>
            </div>
            <button onClick={() => setSelectedLead(null)}
              style={{background:"rgba(255,255,255,0.15)",border:"none",borderRadius:"6px",padding:"6px 10px",fontSize:"13px",cursor:"pointer",color:"white"}}>
              
            </button>
          </div>

          <div style={{padding:"16px",flex:1,overflowY:"auto"}}>

            {/* Contact info */}
            <div style={{background:"#f8f8f8",borderRadius:"10px",padding:"14px",marginBottom:"14px"}}>
              <h4 style={{fontSize:"12px",fontWeight:"600",color:"#888",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:"10px"}}>Contact</h4>
              {[
                { icon:"", value:selectedLead.buyer_email },
                { icon:"", value:selectedLead.buyer_phone },
              ].map(item => (
                <div key={item.value} style={{display:"flex",gap:"8px",alignItems:"center",marginBottom:"6px"}}>
                  <span style={{fontSize:"14px"}}>{item.icon}</span>
                  <span style={{fontSize:"13px",color:"#333"}}>{item.value}</span>
                </div>
              ))}
            </div>

            {/* Property */}
            <div style={{background:"#f8f8f8",borderRadius:"10px",padding:"14px",marginBottom:"14px"}}>
              <h4 style={{fontSize:"12px",fontWeight:"600",color:"#888",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:"10px"}}>Property</h4>
              <div style={{fontSize:"13px",fontWeight:"500",color:"#333",marginBottom:"4px"}}>{selectedLead.property_title}</div>
              <div style={{fontSize:"20px",fontWeight:"700",color:"#0A5C3F",marginBottom:"4px"}}>{formatPrice(selectedLead.property_price)}</div>
              <div style={{fontSize:"12px",color:"#888"}}>{selectedLead.lga}, {selectedLead.state} · {selectedLead.property_type}</div>
              {selectedLead.budget && (
                <div style={{fontSize:"12px",color:"#856404",marginTop:"4px"}}> Buyer budget: {formatPrice(selectedLead.budget)}</div>
              )}
            </div>

            {/* Stage */}
            <div style={{marginBottom:"14px"}}>
              <h4 style={{fontSize:"12px",fontWeight:"600",color:"#888",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:"10px"}}>Move to Stage</h4>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
                {STAGES.map(stage => (
                  <button key={stage.key} onClick={() => moveStage(selectedLead.id, stage.key)}
                    style={{padding:"8px 10px",border:`1.5px solid ${selectedLead.stage===stage.key?stage.color:"#eee"}`,borderRadius:"8px",background:selectedLead.stage===stage.key?stage.bg:"white",fontSize:"12px",color:selectedLead.stage===stage.key?stage.color:"#555",cursor:"pointer",fontWeight:selectedLead.stage===stage.key?"600":"400",textAlign:"left" as const}}>
                    {stage.icon} {stage.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div style={{marginBottom:"14px"}}>
              <h4 style={{fontSize:"12px",fontWeight:"600",color:"#888",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:"10px"}}>Priority</h4>
              <div style={{display:"flex",gap:"8px"}}>
                {(["high","medium","low"] as const).map(p => (
                  <button key={p} onClick={() => {
                    setLeads(prev => prev.map(l => l.id===selectedLead.id?{...l,priority:p}:l));
                    setSelectedLead(prev => prev?{...prev,priority:p}:null);
                  }}
                    style={{flex:1,padding:"7px",border:`1.5px solid ${selectedLead.priority===p?PRIORITY_STYLE[p].color:"#eee"}`,borderRadius:"7px",background:selectedLead.priority===p?PRIORITY_STYLE[p].bg:"white",fontSize:"12px",color:selectedLead.priority===p?PRIORITY_STYLE[p].color:"#555",cursor:"pointer",fontWeight:selectedLead.priority===p?"600":"400"}}>
                    {PRIORITY_STYLE[p].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Inspection date */}
            {selectedLead.stage === "inspection" && (
              <div style={{background:"#F3E8FF",borderRadius:"10px",padding:"14px",marginBottom:"14px"}}>
                <h4 style={{fontSize:"12px",fontWeight:"600",color:"#5a2d82",marginBottom:"8px"}}> Inspection Date</h4>
                <input type="date" defaultValue={selectedLead.inspection_date}
                  onChange={e => {
                    setLeads(prev => prev.map(l => l.id===selectedLead.id?{...l,inspection_date:e.target.value}:l));
                    setSelectedLead(prev => prev?{...prev,inspection_date:e.target.value}:null);
                  }}
                  style={{width:"100%",background:"white",border:"1px solid #ddd",borderRadius:"6px",padding:"8px 10px",fontSize:"13px",outline:"none",boxSizing:"border-box" as const}} />
              </div>
            )}

            {/* Notes */}
            <div style={{marginBottom:"14px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
                <h4 style={{fontSize:"12px",fontWeight:"600",color:"#888",textTransform:"uppercase",letterSpacing:"0.5px",margin:0}}>Notes</h4>
                <button onClick={() => { setEditNote(selectedLead.notes); setShowNoteEdit(true); }}
                  style={{fontSize:"12px",color:"#0A5C3F",background:"none",border:"none",cursor:"pointer",fontWeight:"500"}}>
                  Edit
                </button>
              </div>
              {showNoteEdit ? (
                <div>
                  <textarea value={editNote} onChange={e => setEditNote(e.target.value)} rows={4}
                    style={{width:"100%",background:"#f8f8f8",border:"1px solid #e8e8e8",borderRadius:"8px",padding:"10px",fontSize:"13px",outline:"none",resize:"vertical",boxSizing:"border-box" as const}} />
                  <div style={{display:"flex",gap:"8px",marginTop:"8px"}}>
                    <button onClick={() => setShowNoteEdit(false)}
                      style={{flex:1,background:"#f0f0f0",color:"#333",border:"none",borderRadius:"6px",padding:"8px",fontSize:"12px",cursor:"pointer"}}>
                      Cancel
                    </button>
                    <button onClick={() => saveNote(selectedLead.id, editNote)}
                      style={{flex:2,background:"#0A5C3F",color:"white",border:"none",borderRadius:"6px",padding:"8px",fontSize:"12px",cursor:"pointer"}}>
                      Save Note
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{background:"#f8f8f8",borderRadius:"8px",padding:"12px",fontSize:"13px",color:"#555",lineHeight:"1.5",borderLeft:"3px solid #0A5C3F"}}>
                  {selectedLead.notes || "No notes yet."}
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
              <a href={`tel:${selectedLead.buyer_phone}`}
                style={{display:"block",background:"#0A5C3F",color:"white",borderRadius:"8px",padding:"11px",fontSize:"13px",fontWeight:"500",cursor:"pointer",textAlign:"center" as const,textDecoration:"none"}}>
                 Call {selectedLead.buyer_name.split(" ")[0]}
              </a>
              <a href={`mailto:${selectedLead.buyer_email}`}
                style={{display:"block",background:"#f0f0f0",color:"#333",borderRadius:"8px",padding:"11px",fontSize:"13px",cursor:"pointer",textAlign:"center" as const,textDecoration:"none"}}>
                 Send Email
              </a>
              <button onClick={() => router.push("/chat/1")}
                style={{background:"#E1F5EE",color:"#0A5C3F",border:"none",borderRadius:"8px",padding:"11px",fontSize:"13px",cursor:"pointer",fontWeight:"500"}}>
                 Open Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
