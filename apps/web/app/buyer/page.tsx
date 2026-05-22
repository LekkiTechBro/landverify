"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DocumentVault from "./DocumentVault";

const API = "${process.env.NEXT_PUBLIC_API_URL || "https://landverify-production.up.railway.app/api/v1"}";

function formatPrice(p: number) {
  if (p >= 1000000) return "N" + (p / 1000000).toFixed(1) + "M";
  return "N" + p.toLocaleString();
}

export default function BuyerPortal() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("My Portal");
  const [user, setUser] = useState<any>(null);
  const [savedProperties, setSavedProperties] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifSettings, setNotifSettings] = useState({ email: true, sms: false, push: true, deals: true });
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: "", email: "", phone: "" });
  const [darkMode, setDarkMode] = useState(false);

  const TABS = ["My Portal", "Saved Properties", "My Enquiries", "Documents", "Reviews", "Settings"];

  useEffect(() => {
    const token = sessionStorage.getItem("access_token");
    if (!token) { router.push("/auth/login"); return; }

    fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        setUser(data);
        setProfileForm({ full_name: data.full_name || "", email: data.email || "", phone: data.phone || "" });
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Mock saved properties and enquiries for now
    setSavedProperties([
      { id: "1", title: "3 Bedroom Flat, Lekki Phase 1", price: 45000000, state: "Lagos", type: "Flat", verified: true },
      { id: "2", title: "4 Bedroom Duplex, Asokoro", price: 120000000, state: "Abuja", type: "Duplex", verified: true },
    ]);
    setEnquiries([
      { id: "1", property: "3 Bedroom Flat, Lekki Phase 1", agent: "Adaeze Okonkwo", message: "Yes, the property is still available!", time: "Today, 4:01 PM", unread: 1 },
      { id: "2", property: "5 Bedroom Duplex, Asokoro", agent: "Garba Musa", message: "Thank you for your interest. I'll get back to you.", time: "Yesterday", unread: 0 },
    ]);
  }, []);

  const handleLogout = () => {
    sessionStorage.clear();
    document.cookie = "access_token=; path=/; max-age=0";
    router.push("/auth/login");
  };

  const handleSaveProfile = async () => {
    const token = sessionStorage.getItem("access_token");
    try {
      await fetch(`${API}/auth/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(profileForm),
      });
      setUser((prev: any) => ({ ...prev, ...profileForm }));
      setEditingProfile(false);
    } catch {
      alert("Could not save profile");
    }
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "system-ui" }}>
      <p style={{ color: "#888" }}>Loading your portal...</p>
    </div>
  );

  const initials = user?.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "U";

  return (
    <div style={{ fontFamily: "system-ui,sans-serif", minHeight: "100vh", background: "#f5f5f5" }}>

      {/* Header */}
      <div style={{ background: "#0A5C3F", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span onClick={() => router.push("/")} style={{ color: "white", fontSize: "18px", fontWeight: "600", cursor: "pointer" }}>
          Land<span style={{ color: "#FAC775" }}>Verify</span>
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px" }}>Buyer Portal</span>
          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#E1F5EE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "700", color: "#0A5C3F", position: "relative", cursor: "pointer" }}
            onClick={() => setActiveTab("Settings")}>
            {initials}
            {user?.kyc_status === "verified" && (
              <div style={{ position: "absolute", bottom: 0, right: 0, width: "10px", height: "10px", borderRadius: "50%", background: "#1D9E75", border: "2px solid white" }} />
            )}
          </div>
          <button onClick={handleLogout} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", fontSize: "12px", cursor: "pointer" }}>Sign out</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: "white", borderBottom: "1px solid #eee", padding: "0 24px", display: "flex", overflowX: "auto" }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => tab === "Reviews" ? router.push("/reviews") : setActiveTab(tab)}
            style={{ padding: "14px 18px", border: "none", background: "none", fontSize: "13px", fontWeight: "500", cursor: "pointer", whiteSpace: "nowrap", color: activeTab === tab ? "#0A5C3F" : "#888", borderBottom: activeTab === tab ? "2px solid #0A5C3F" : "2px solid transparent" }}>
            {tab}{tab === "My Enquiries" ? ` ${enquiries.filter(e => e.unread > 0).length > 0 ? "("+enquiries.filter(e=>e.unread>0).length+")" : ""}` : ""}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "20px" }}>

        {/* MY PORTAL */}
        {activeTab === "My Portal" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Welcome card */}
            <div style={{ background: "linear-gradient(135deg, #0A5C3F, #1D9E75)", borderRadius: "16px", padding: "24px", color: "white" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: "700" }}>
                  {initials}
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700" }}>Welcome back, {user?.full_name?.split(" ")[0] || ""}.</h2>
                  <p style={{ margin: 0, fontSize: "13px", opacity: 0.8 }}>Your private portal to Nigeria's most secure land assets.</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                {[
                  { label: "Saved Properties", value: savedProperties.length },
                  { label: "Active Enquiries", value: enquiries.length },
                  { label: "KYC Status", value: user?.kyc_status === "verified" ? "✓" : "Pending" },
                ].map(stat => (
                  <div key={stat.label} style={{ background: "rgba(255,255,255,0.15)", borderRadius: "10px", padding: "12px 16px", flex: 1, textAlign: "center" }}>
                    <div style={{ fontSize: "22px", fontWeight: "700" }}>{stat.value}</div>
                    <div style={{ fontSize: "11px", opacity: 0.8 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* KYC banner */}
            {user?.kyc_status !== "verified" && (
              <div style={{ background: "#FFF3CD", border: "1px solid rgba(133,100,4,0.2)", borderRadius: "12px", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#856404" }}>Complete your KYC verification</div>
                  <div style={{ fontSize: "12px", color: "#856404", marginTop: "2px" }}>Verify your NIN to unlock document access, enquiries, and secure transactions.</div>
                </div>
                <button onClick={() => router.push("/kyc")}
                  style={{ background: "#856404", color: "white", border: "none", borderRadius: "8px", padding: "9px 16px", fontSize: "13px", cursor: "pointer", whiteSpace: "nowrap" }}>
                  Verify Now
                </button>
              </div>
            )}

            {/* Quick actions */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px" }}>
              {[
                { label: "Search Properties", action: () => router.push("/search"), icon: "[Search]" },
                { label: "My Enquiries", action: () => setActiveTab("My Enquiries"), icon: "[Chat]" },
                { label: "Saved Properties", action: () => setActiveTab("Saved Properties"), icon: "[Saved]" },
                { label: "My Documents", action: () => setActiveTab("Documents"), icon: "[Docs]" },
              ].map(item => (
                <div key={item.label} onClick={item.action}
                  style={{ background: "white", borderRadius: "12px", padding: "20px 12px", textAlign: "center", cursor: "pointer", border: "1px solid #eee" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f0f9f5")}
                  onMouseLeave={e => (e.currentTarget.style.background = "white")}>
                  <div style={{ fontSize: "12px", color: "#888", fontWeight: "500", marginBottom: "6px" }}>{item.icon}</div>
                  <div style={{ fontSize: "12px", color: "#333", fontWeight: "500" }}>{item.label}</div>
                </div>
              ))}
            </div>

            {/* Recent activity */}
            <div style={{ background: "white", borderRadius: "12px", padding: "20px", border: "1px solid #eee" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#333", marginBottom: "16px" }}>Recent Activity</h3>
              {enquiries.map(e => (
                <div key={e.id} onClick={() => setActiveTab("My Enquiries")}
                  style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 0", borderBottom: "1px solid #f5f5f5", cursor: "pointer" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#E1F5EE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "600", color: "#0A5C3F", flexShrink: 0 }}>
                    {e.agent.split(" ").map((n: string) => n[0]).join("").slice(0,2)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "13px", fontWeight: "500", color: "#222" }}>{e.property}</div>
                    <div style={{ fontSize: "12px", color: "#888" }}>{e.message}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: "11px", color: "#aaa" }}>{e.time}</div>
                    {e.unread > 0 && (
                      <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: "#0A5C3F", color: "white", fontSize: "10px", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: "auto", marginTop: "4px" }}>{e.unread}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* How LandVerify protects you */}
            <div style={{ background: "white", borderRadius: "12px", padding: "20px", border: "1px solid #eee" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#333", marginBottom: "16px" }}>How LandVerify Protects You</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {[
                  { title: "Registry Check", desc: "Every title verified against state land registries before listing" },
                  { title: "Agent KYC", desc: "All agents verified with NIN and face match before access" },
                  { title: "Escrow Payment", desc: "Funds held securely until title transfer is complete" },
                  { title: "Document Vault", desc: "AES-256 encrypted storage for all your property documents" },
                ].map(item => (
                  <div key={item.title} style={{ background: "#f8f8f8", borderRadius: "10px", padding: "14px" }}>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#0A5C3F", marginBottom: "4px" }}>{item.title}</div>
                    <div style={{ fontSize: "12px", color: "#888", lineHeight: "1.5" }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SAVED PROPERTIES */}
        {activeTab === "Saved Properties" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#333", margin: 0 }}>Saved Properties ({savedProperties.length})</h2>
            {savedProperties.length === 0 ? (
              <div style={{ background: "white", borderRadius: "12px", padding: "40px", textAlign: "center", border: "1px solid #eee" }}>
                <p style={{ color: "#888" }}>No saved properties yet. Browse and save properties you like.</p>
                <button onClick={() => router.push("/search")} style={{ background: "#0A5C3F", color: "white", border: "none", borderRadius: "8px", padding: "10px 20px", fontSize: "13px", cursor: "pointer", marginTop: "12px" }}>
                  Search Properties
                </button>
              </div>
            ) : savedProperties.map(p => (
              <div key={p.id} style={{ background: "white", borderRadius: "12px", padding: "16px", border: "1px solid #eee", display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ width: "60px", height: "60px", borderRadius: "10px", background: "linear-gradient(135deg,#0A5C3F,#1D9E75)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "11px", fontWeight: "600", flexShrink: 0 }}>
                  {p.type}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#222" }}>{p.title}</div>
                  <div style={{ fontSize: "12px", color: "#888" }}>{p.state} · {p.type}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "16px", fontWeight: "700", color: "#0A5C3F" }}>{formatPrice(p.price)}</div>
                  <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                    <button onClick={() => router.push(`/property/${p.id}`)}
                      style={{ background: "#f0f0f0", color: "#333", border: "none", borderRadius: "6px", padding: "5px 10px", fontSize: "12px", cursor: "pointer" }}>View</button>
                    <button onClick={() => router.push(`/purchase?property=${p.id}&title=${encodeURIComponent(p.title)}&amount=${p.price}`)}
                      style={{ background: "#0A5C3F", color: "white", border: "none", borderRadius: "6px", padding: "5px 10px", fontSize: "12px", cursor: "pointer" }}>Buy Now</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MY ENQUIRIES */}
        {activeTab === "My Enquiries" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#333", margin: 0 }}>My Enquiries ({enquiries.length})</h2>
            {enquiries.length === 0 ? (
              <div style={{ background: "white", borderRadius: "12px", padding: "40px", textAlign: "center", border: "1px solid #eee" }}>
                <p style={{ color: "#888" }}>No enquiries yet. Send a message to an agent about a property.</p>
              </div>
            ) : enquiries.map(e => (
              <div key={e.id} style={{ background: "white", borderRadius: "12px", padding: "16px", border: "1px solid #eee", cursor: "pointer" }}
                onClick={() => router.push(`/chat/${e.id}`)}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#222" }}>{e.property}</div>
                  <div style={{ fontSize: "11px", color: "#aaa" }}>{e.time}</div>
                </div>
                <div style={{ fontSize: "12px", color: "#888" }}>Agent: {e.agent}</div>
                <div style={{ fontSize: "13px", color: "#555", marginTop: "6px" }}>{e.message}</div>
                {e.unread > 0 && (
                  <div style={{ marginTop: "8px" }}>
                    <span style={{ background: "#0A5C3F", color: "white", borderRadius: "10px", padding: "2px 8px", fontSize: "11px" }}>{e.unread} new message</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* DOCUMENTS */}
        {activeTab === "Documents" && <DocumentVault />}

        {/* SETTINGS */}
        {activeTab === "Settings" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Profile */}
            <div style={{ background: "white", borderRadius: "12px", padding: "24px", border: "1px solid #eee" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: "600", color: "#333", margin: 0 }}>Profile</h3>
                {!editingProfile && (
                  <button onClick={() => setEditingProfile(true)}
                    style={{ background: "#f0f0f0", color: "#333", border: "none", borderRadius: "7px", padding: "7px 14px", fontSize: "12px", cursor: "pointer" }}>
                    Edit Profile
                  </button>
                )}
              </div>

              {editingProfile ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {[
                    { label: "Full Name", key: "full_name", type: "text" },
                    { label: "Email", key: "email", type: "email" },
                    { label: "Phone", key: "phone", type: "tel" },
                  ].map(field => (
                    <div key={field.key}>
                      <label style={{ fontSize: "12px", color: "#888", display: "block", marginBottom: "5px" }}>{field.label}</label>
                      <input type={field.type} value={(profileForm as any)[field.key]}
                        onChange={e => setProfileForm(p => ({ ...p, [field.key]: e.target.value }))}
                        style={{ width: "100%", background: "#f8f8f8", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "9px 12px", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={() => setEditingProfile(false)} style={{ flex: 1, background: "#f0f0f0", color: "#333", border: "none", borderRadius: "8px", padding: "10px", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
                    <button onClick={handleSaveProfile} style={{ flex: 2, background: "#0A5C3F", color: "white", border: "none", borderRadius: "8px", padding: "10px", fontSize: "13px", fontWeight: "500", cursor: "pointer" }}>Save Changes</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  {[
                    { label: "Full Name", value: user?.full_name },
                    { label: "Email", value: user?.email },
                    { label: "Phone", value: user?.phone },
                    { label: "KYC Status", value: user?.kyc_status === "verified" ? "Verified" : "Pending", color: user?.kyc_status === "verified" ? "#0A5C3F" : "#856404" },
                  ].map(item => (
                    <div key={item.label} style={{ background: "#f8f8f8", borderRadius: "8px", padding: "12px" }}>
                      <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px" }}>{item.label}</div>
                      <div style={{ fontSize: "13px", fontWeight: "500", color: (item as any).color || "#333" }}>{item.value || "Not set"}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications */}
            <div style={{ background: "white", borderRadius: "12px", padding: "24px", border: "1px solid #eee" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "600", color: "#333", marginBottom: "16px" }}>Notification Preferences</h3>
              {[
                { key: "email", label: "Email Notifications", desc: "Receive updates via email" },
                { key: "sms", label: "SMS Alerts", desc: "Get SMS for important updates" },
                { key: "push", label: "Push Notifications", desc: "Browser push notifications" },
                { key: "deals", label: "New Property Alerts", desc: "Get notified of new matching listings" },
              ].map(item => (
                <div key={item.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f5f5f5" }}>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "500", color: "#333" }}>{item.label}</div>
                    <div style={{ fontSize: "12px", color: "#888" }}>{item.desc}</div>
                  </div>
                  <div onClick={() => setNotifSettings(p => ({ ...p, [item.key]: !p[item.key as keyof typeof p] }))}
                    style={{ width: "40px", height: "22px", borderRadius: "11px", background: (notifSettings as any)[item.key] ? "#0A5C3F" : "#ddd", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
                    <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "white", position: "absolute", top: "3px", left: (notifSettings as any)[item.key] ? "21px" : "3px", transition: "left 0.2s" }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Danger zone */}
            <div style={{ background: "white", borderRadius: "12px", padding: "24px", border: "1px solid #eee" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "600", color: "#C62828", marginBottom: "12px" }}>Account</h3>
              <button onClick={handleLogout}
                style={{ background: "#FDECEA", color: "#C62828", border: "none", borderRadius: "8px", padding: "10px 20px", fontSize: "13px", cursor: "pointer" }}>
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
