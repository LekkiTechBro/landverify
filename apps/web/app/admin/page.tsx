"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API = "http://localhost:8000/api/v1";

const MILESTONES = [
  { key:"payment_secured", label:"Payment Secured" },
  { key:"legal_search",    label:"Legal Search" },
  { key:"deed_signing",    label:"Deed Signing" },
  { key:"fund_release",    label:"Fund Release" },
];

function formatPrice(p: number) {
  if (p >= 1000000) return "N" + (p/1000000).toFixed(1) + "M";
  return "N" + p.toLocaleString();
}

function formatDate(d: string) {
  try { return new Date(d).toLocaleDateString("en-GB", {day:"numeric",month:"short",year:"numeric"}); }
  catch { return d; }
}

export default function AdminPanel() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"escrows"|"users"|"properties"|"log">("escrows");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState("");

  const [escrows, setEscrows] = useState<any[]>([]);
  const [selectedEscrow, setSelectedEscrow] = useState<any>(null);
  const [advancing, setAdvancing] = useState(false);
  const [actionLog, setActionLog] = useState<any[]>([]);

  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const [properties, setProperties] = useState<any[]>([]);
  const [propsLoading, setPropsLoading] = useState(false);

  const token = typeof window !== "undefined" ? sessionStorage.getItem("access_token") : null;

  useEffect(() => {
    if (!token) { router.push("/auth/login"); return; }
    fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        const role = data.role || sessionStorage.getItem("user_role");
        if (role === "admin") {
          setIsAdmin(true);
          setAdminName(data.full_name || "Admin");
        } else {
          router.push("/");
        }
        setLoading(false);
      })
      .catch(() => { setLoading(false); });

    fetch(`${API}/payments/my-escrows`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setEscrows(data.escrows || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (activeTab === "users" && users.length === 0) loadUsers();
    if (activeTab === "properties" && properties.length === 0) loadProperties();
  }, [activeTab]);

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await fetch(`${API}/users`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : data.users || []);
    } catch {} finally { setUsersLoading(false); }
  };

  const loadProperties = async () => {
    setPropsLoading(true);
    try {
      const res = await fetch(`${API}/properties?limit=50`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setProperties(data.data || []);
    } catch {} finally { setPropsLoading(false); }
  };

  const handleAdvance = async (escrowId: string) => {
    setAdvancing(true);
    try {
      const res = await fetch(`${API}/payments/escrow/${escrowId}/advance`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setEscrows(prev => prev.map(e => e.id === escrowId ? { ...e, ...data } : e));
        setSelectedEscrow((prev: any) => prev?.id === escrowId ? { ...prev, ...data } : prev);
        setActionLog(prev => [{ action: "milestone_advanced", escrow_id: escrowId, milestone: data.advanced_to, admin: adminName, timestamp: new Date().toISOString() }, ...prev]);
      }
    } catch { alert("Failed to advance milestone"); }
    finally { setAdvancing(false); }
  };

  const handleVerifyProperty = async (propertyId: string, action: "verify"|"reject") => {
    try {
      await fetch(`${API}/properties/${propertyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ verification_status: action === "verify" ? "fully_verified" : "rejected" }),
      });
      setProperties(prev => prev.map(p => p.id === propertyId ? { ...p, verification_status: action === "verify" ? "fully_verified" : "rejected" } : p));
      setActionLog(prev => [{ action: `property_${action}d`, property_id: propertyId, admin: adminName, timestamp: new Date().toISOString() }, ...prev]);
    } catch { alert("Failed to update property"); }
  };

  const handleSuspendUser = async (userId: string, suspend: boolean) => {
    try {
      await fetch(`${API}/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_active: !suspend }),
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: !suspend } : u));
      setActionLog(prev => [{ action: suspend ? "user_suspended" : "user_activated", user_id: userId, admin: adminName, timestamp: new Date().toISOString() }, ...prev]);
    } catch { alert("Failed to update user"); }
  };

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#0f1117", color:"white", fontFamily:"system-ui" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:"32px", marginBottom:"8px" }}>...</div>
        <div>Verifying admin access...</div>
      </div>
    </div>
  );

  if (!isAdmin) return null;

  const TABS = [
    { key:"escrows",    label:"Escrow Control" },
    { key:"users",      label:`Users (${users.length})` },
    { key:"properties", label:`Properties (${properties.length})` },
    { key:"log",        label:"Audit Log" },
  ];

  return (
    <div style={{ fontFamily:"system-ui,sans-serif", minHeight:"100vh", background:"#0f1117", color:"#e8eaf0" }}>

      {/* Header */}
      <div style={{ background:"#111827", borderBottom:"1px solid #1e2130", padding:"14px 24px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"14px" }}>
          <span onClick={() => router.push("/")} style={{ color:"#FAC775", fontSize:"18px", fontWeight:"600", cursor:"pointer" }}>
            Land<span style={{ color:"white" }}>Verify</span>
          </span>
          <span style={{ color:"#4b5563" }}>/ Admin Panel</span>
        </div>
        <span style={{ background:"#E1F5EE", color:"#0A5C3F", borderRadius:"6px", padding:"4px 10px", fontSize:"11px", fontWeight:"500" }}>
          Admin: {adminName}
        </span>
      </div>

      {/* Stats */}
      <div style={{ background:"#111827", borderBottom:"1px solid #1e2130", padding:"12px 24px", display:"flex", gap:"32px" }}>
        {[
          { label:"Total Users",        value: users.length > 0 ? users.length : "—" },
          { label:"Total Properties",   value: properties.length > 0 ? properties.length : "—" },
          { label:"Active Escrows",     value: escrows.filter(e => e.status === "secured").length, color:"#FAC775" },
          { label:"Completed Escrows",  value: escrows.filter(e => e.status === "completed").length, color:"#4ade80" },
          { label:"Total Escrow Value", value: "N" + (escrows.reduce((a,e) => a + (e.amount_naira||0), 0)/1000000).toFixed(1) + "M", color:"#1D9E75" },
        ].map(s => (
          <div key={s.label} style={{ textAlign:"center" }}>
            <div style={{ fontSize:"18px", fontWeight:"700", color:(s as any).color || "#e8eaf0" }}>{s.value}</div>
            <div style={{ fontSize:"10px", color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.5px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ background:"#111827", borderBottom:"1px solid #1e2130", padding:"0 24px", display:"flex" }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as any)}
            style={{ padding:"12px 18px", border:"none", background:"none", fontSize:"13px", cursor:"pointer", color: activeTab===t.key?"#1D9E75":"#6b7280", borderBottom: activeTab===t.key?"2px solid #1D9E75":"2px solid transparent", fontWeight: activeTab===t.key?"600":"400" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding:"20px 24px", overflowY:"auto", height:"calc(100vh - 160px)" }}>

        {/* ESCROWS */}
        {activeTab === "escrows" && (
          <div style={{ display:"grid", gridTemplateColumns: selectedEscrow ? "1fr 380px" : "1fr", gap:"20px" }}>
            <div>
              {escrows.length === 0 ? (
                <div style={{ textAlign:"center", padding:"60px", color:"#6b7280" }}>
                  <div style={{ fontSize:"32px", marginBottom:"12px" }}>[No Escrows]</div>
                  <p>No escrow transactions yet.</p>
                </div>
              ) : escrows.map(escrow => {
                const currentIdx = MILESTONES.findIndex(m => m.key === escrow.current_milestone);
                const nextMilestone = MILESTONES[currentIdx + 1];
                const isComplete = escrow.status === "completed";
                return (
                  <div key={escrow.id} onClick={() => setSelectedEscrow(escrow)}
                    style={{ background: selectedEscrow?.id===escrow.id?"#1e2130":"#161b27", border:`1px solid ${selectedEscrow?.id===escrow.id?"#1D9E75":"#1e2130"}`, borderRadius:"10px", padding:"16px", cursor:"pointer", marginBottom:"10px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"8px" }}>
                      <div>
                        <div style={{ fontSize:"14px", fontWeight:"600", color:"#e8eaf0" }}>{escrow.property_title}</div>
                        <div style={{ fontSize:"12px", color:"#6b7280" }}>{escrow.buyer_email}</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:"16px", fontWeight:"700", color:"#1D9E75" }}>{formatPrice(escrow.amount_naira)}</div>
                        <span style={{ fontSize:"10px", color: isComplete?"#4ade80":"#FAC775" }}>{isComplete?"Completed":"Active"}</span>
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:"4px", marginBottom:"8px" }}>
                      {MILESTONES.map(m => (
                        <div key={m.key} style={{ flex:1, height:"4px", borderRadius:"2px", background: escrow.milestones_completed?.includes(m.key)?"#1D9E75":"#2e3248" }}/>
                      ))}
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontSize:"12px", color:"#9ca3af" }}>
                        {MILESTONES.find(m => m.key===escrow.current_milestone)?.label || "—"}
                      </span>
                      {!isComplete && nextMilestone && (
                        <button onClick={e => { e.stopPropagation(); handleAdvance(escrow.id); }} disabled={advancing}
                          style={{ background:"#1D9E75", color:"white", border:"none", borderRadius:"6px", padding:"4px 10px", fontSize:"11px", cursor:"pointer" }}>
                          {advancing?"...":"Advance to " + nextMilestone.label}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {selectedEscrow && (
              <div style={{ background:"#111827", border:"1px solid #1e2130", borderRadius:"12px", padding:"20px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"16px" }}>
                  <h3 style={{ fontSize:"14px", fontWeight:"600", color:"#e8eaf0", margin:0 }}>Escrow Detail</h3>
                  <button onClick={() => setSelectedEscrow(null)} style={{ background:"none", border:"none", color:"#6b7280", cursor:"pointer", fontSize:"18px" }}>x</button>
                </div>
                <div style={{ background:"#1e2130", borderRadius:"8px", padding:"14px", marginBottom:"14px" }}>
                  <div style={{ fontSize:"14px", fontWeight:"600", color:"#e8eaf0" }}>{selectedEscrow.property_title}</div>
                  <div style={{ fontSize:"22px", fontWeight:"700", color:"#1D9E75" }}>{formatPrice(selectedEscrow.amount_naira)}</div>
                  <div style={{ fontSize:"11px", color:"#6b7280", fontFamily:"monospace" }}>{selectedEscrow.reference}</div>
                </div>
                {MILESTONES.map((m, i) => {
                  const done = selectedEscrow.milestones_completed?.includes(m.key);
                  return (
                    <div key={m.key} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"8px", background: done?"#0d2e22":"#1e2130", borderRadius:"8px", marginBottom:"6px" }}>
                      <div style={{ width:"24px", height:"24px", borderRadius:"50%", background: done?"#1D9E75":"#2e3248", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"11px" }}>
                        {done ? "✓" : i+1}
                      </div>
                      <span style={{ fontSize:"13px", color: done?"#4ade80":"#9ca3af" }}>{m.label}</span>
                      <span style={{ marginLeft:"auto", fontSize:"10px", color: done?"#4ade80":"#4b5563" }}>{done?"Done":"Pending"}</span>
                    </div>
                  );
                })}
                {selectedEscrow.status !== "completed" && (
                  <button onClick={() => handleAdvance(selectedEscrow.id)} disabled={advancing}
                    style={{ width:"100%", background:"#1D9E75", color:"white", border:"none", borderRadius:"8px", padding:"11px", fontSize:"13px", fontWeight:"500", cursor:"pointer", marginTop:"12px" }}>
                    {advancing?"Advancing...":"Advance to " + (MILESTONES[MILESTONES.findIndex(m => m.key===selectedEscrow.current_milestone)+1]?.label||"Complete")}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* USERS */}
        {activeTab === "users" && (
          <div>
            {usersLoading ? (
              <div style={{ textAlign:"center", padding:"40px", color:"#6b7280" }}>Loading users...</div>
            ) : users.length === 0 ? (
              <div style={{ textAlign:"center", padding:"60px", color:"#6b7280" }}>No users found.</div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                {users.map(user => (
                  <div key={user.id} style={{ background:"#161b27", border:"1px solid #1e2130", borderRadius:"10px", padding:"14px 16px", display:"flex", alignItems:"center", gap:"14px" }}>
                    <div style={{ width:"40px", height:"40px", borderRadius:"50%", background:"#1D9E75", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"14px", fontWeight:"700", flexShrink:0 }}>
                      {user.full_name?.split(" ").map((n:string)=>n[0]).join("").slice(0,2).toUpperCase()}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:"13px", fontWeight:"600", color:"#e8eaf0" }}>{user.full_name}</div>
                      <div style={{ fontSize:"11px", color:"#6b7280" }}>{user.email} · {user.phone}</div>
                    </div>
                    <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
                      <span style={{ fontSize:"10px", background: user.role==="agent"?"#1a1400":"#0d2e22", color: user.role==="agent"?"#FAC775":"#4ade80", borderRadius:"4px", padding:"2px 6px" }}>{user.role}</span>
                      <span style={{ fontSize:"10px", background: user.kyc_status==="verified"?"#0d2e22":"#1e2130", color: user.kyc_status==="verified"?"#4ade80":"#9ca3af", borderRadius:"4px", padding:"2px 6px" }}>{user.kyc_status}</span>
                      <span style={{ fontSize:"10px", background: user.is_active?"#0d2e22":"#2a0f0f", color: user.is_active?"#4ade80":"#f87171", borderRadius:"4px", padding:"2px 6px" }}>{user.is_active?"Active":"Suspended"}</span>
                      <button onClick={() => handleSuspendUser(user.id, user.is_active)}
                        style={{ background: user.is_active?"#2a0f0f":"#0d2e22", color: user.is_active?"#f87171":"#4ade80", border:"none", borderRadius:"6px", padding:"4px 10px", fontSize:"11px", cursor:"pointer" }}>
                        {user.is_active?"Suspend":"Activate"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PROPERTIES */}
        {activeTab === "properties" && (
          <div>
            {propsLoading ? (
              <div style={{ textAlign:"center", padding:"40px", color:"#6b7280" }}>Loading properties...</div>
            ) : properties.length === 0 ? (
              <div style={{ textAlign:"center", padding:"60px", color:"#6b7280" }}>No properties found.</div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                {properties.map(prop => (
                  <div key={prop.id} style={{ background:"#161b27", border:"1px solid #1e2130", borderRadius:"10px", padding:"14px 16px", display:"flex", alignItems:"center", gap:"14px" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:"13px", fontWeight:"600", color:"#e8eaf0" }}>{prop.title}</div>
                      <div style={{ fontSize:"11px", color:"#6b7280" }}>{prop.area}, {prop.lga}, {prop.state} · {prop.type} · {formatPrice(prop.price)}</div>
                    </div>
                    <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
                      <span style={{ fontSize:"10px", background: prop.verification_status==="fully_verified"?"#0d2e22":prop.verification_status==="rejected"?"#2a0f0f":"#1a1400", color: prop.verification_status==="fully_verified"?"#4ade80":prop.verification_status==="rejected"?"#f87171":"#FAC775", borderRadius:"4px", padding:"2px 6px" }}>
                        {prop.verification_status}
                      </span>
                      {prop.verification_status !== "fully_verified" && (
                        <button onClick={() => handleVerifyProperty(prop.id, "verify")}
                          style={{ background:"#0d2e22", color:"#4ade80", border:"none", borderRadius:"6px", padding:"4px 10px", fontSize:"11px", cursor:"pointer" }}>
                          Verify
                        </button>
                      )}
                      {prop.verification_status !== "rejected" && (
                        <button onClick={() => handleVerifyProperty(prop.id, "reject")}
                          style={{ background:"#2a0f0f", color:"#f87171", border:"none", borderRadius:"6px", padding:"4px 10px", fontSize:"11px", cursor:"pointer" }}>
                          Reject
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AUDIT LOG */}
        {activeTab === "log" && (
          <div>
            {actionLog.length === 0 ? (
              <div style={{ textAlign:"center", padding:"60px", color:"#6b7280" }}>
                <p>No admin actions yet. Actions will appear here as you verify properties, manage users and advance escrow milestones.</p>
              </div>
            ) : actionLog.map((log, i) => (
              <div key={i} style={{ background:"#161b27", border:"1px solid #1e2130", borderRadius:"8px", padding:"12px", marginBottom:"8px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"4px" }}>
                  <span style={{ fontSize:"12px", fontWeight:"500", color: log.action.includes("reject")||log.action.includes("suspend")?"#f87171":"#4ade80" }}>
                    {log.action.replace(/_/g," ").toUpperCase()}
                  </span>
                  <span style={{ fontSize:"10px", color:"#4b5563" }}>{formatDate(log.timestamp)}</span>
                </div>
                <div style={{ fontSize:"11px", color:"#6b7280" }}>By: {log.admin}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
