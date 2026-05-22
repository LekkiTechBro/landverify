"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DarkModeToggle } from "./DarkModeToggle";
import { useTheme } from "./ThemeProvider";
import { RegistryTicker, LiveStats, TrustBadges } from "./HomepageWidgets";

const STATES_LGAS: Record<string, string[]> = {
  "Lagos": ["Agege","Ajeromi-Ifelodun","Alimosho","Amuwo-Odofin","Apapa","Badagry","Epe","Eti-Osa","Ibeju-Lekki","Ifako-Ijaiye","Ikeja","Ikorodu","Kosofe","Lagos Island","Lagos Mainland","Mushin","Ojo","Oshodi-Isolo","Shomolu","Surulere"],
  "Abuja (FCT)": ["Abaji","Bwari","Gwagwalada","Kuje","Kwali","Municipal Area Council"],
  "Rivers": ["Port Harcourt","Obio-Akpor","Eleme","Emohua","Etche","Gokana","Ikwerre","Khana","Tai"],
  "Oyo": ["Ibadan North","Ibadan North-East","Ibadan North-West","Ibadan South-East","Ibadan South-West","Lagelu","Ogbomosho North","Ogbomosho South","Oluyole","Ona-Ara"],
  "Ogun": ["Abeokuta North","Abeokuta South","Ado-Odo/Ota","Ifo","Ijebu Ode","Sagamu"],
  "Kano": ["Kano Municipal","Fagge","Gwale","Nasarawa","Tarauni","Ungogo"],
  "Kaduna": ["Kaduna North","Kaduna South","Chikun","Igabi","Zaria"],
  "Enugu": ["Enugu East","Enugu North","Enugu South","Nsukka","Udi"],
  "Delta": ["Warri North","Warri South","Oshimili North","Oshimili South","Sapele","Uvwie"],
  "Edo": ["Egor","Ikpoba-Okha","Oredo","Ovia North-East","Ovia South-West"],
  "Anambra": ["Awka North","Awka South","Onitsha North","Onitsha South","Nnewi North","Nnewi South"],
  "Imo": ["Owerri Municipal","Owerri North","Owerri West","Orlu","Okigwe"],
};

const STATES_CITIES: Record<string, string[]> = {
  "Lagos": ["All Cities","Lagos Island","Ikeja","Lekki","Victoria Island","Ikoyi","Surulere","Yaba","Ikorodu","Badagry","Epe","Apapa","Mushin","Oshodi","Agege","Alimosho"],
  "Abuja (FCT)": ["All Cities","Abuja","Garki","Maitama","Asokoro","Wuse","Gwarinpa","Gwagwalada","Kuje","Bwari","Kubwa"],
  "Rivers": ["All Cities","Port Harcourt","Obio-Akpor","Rumuola","GRA","D-Line","Eleme","Bonny","Degema"],
  "Oyo": ["All Cities","Ibadan","Ogbomosho","Oyo","Iseyin","Saki"],
  "Ogun": ["All Cities","Abeokuta","Sagamu","Ijebu-Ode","Ota","Ilaro"],
  "Kano": ["All Cities","Kano","Wudil","Rano","Dala","Fagge","Gwale"],
  "Kaduna": ["All Cities","Kaduna","Zaria","Kafanchan"],
  "Enugu": ["All Cities","Enugu","Nsukka","Oji River","Awgu"],
  "Delta": ["All Cities","Warri","Asaba","Sapele","Ughelli"],
  "Edo": ["All Cities","Benin City","Auchi","Ekpoma","Uromi"],
  "Anambra": ["All Cities","Awka","Onitsha","Nnewi","Ekwulobia"],
  "Imo": ["All Cities","Owerri","Orlu","Okigwe"],
};

export default function Home() {
  const router = useRouter();
  const { theme } = useTheme();
  const states = Object.keys(STATES_LGAS).sort();
  const [selectedState, setSelectedState] = useState("Lagos");
  const [selectedLGA, setSelectedLGA] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const cities = STATES_CITIES[selectedState] || ["All Cities"];
  const [selectedType, setSelectedType] = useState("");
  const [selectedTitle, setSelectedTitle] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [activeTab, setActiveTab] = useState("Buy");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const token = sessionStorage.getItem("access_token");
    setIsLoggedIn(!!token);
    if (token) {
      fetch("https://landverify-production.up.railway.app/api/v1/auth/me", { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => {
          if (data.full_name) {
            setUserName(data.full_name.split(" ")[0]);
            setUserRole(data.role || "");
          }
        }).catch(() => {});
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.clear();
    document.cookie = "access_token=; path=/; max-age=0";
    setIsLoggedIn(false);
    setUserName("");
    setUserRole("");
  };

  const lgas = STATES_LGAS[selectedState] || [];

  const handleSearch = () => {
    const token = sessionStorage.getItem("access_token");
    if (!token) { router.push("/auth/login?redirect=/search"); return; }
    const params = new URLSearchParams();
    params.set("state", selectedState);
    if (activeTab === "Rent") params.set("purpose", "rent");
    else if (activeTab === "Shortlet") params.set("purpose", "shortlet");
    else params.set("purpose", "sale");
    if (selectedLGA) params.set("lga", selectedLGA);
    if (selectedCity) params.set("city", selectedCity);
    if (selectedType) params.set("type", selectedType);
    if (selectedTitle) params.set("title", selectedTitle);
    params.set("verified", String(verifiedOnly));
    router.push(`/search?${params.toString()}`);
  };

  const sel = {
    width: "100%", background: "#f8f8f8", border: "1px solid #e8e8e8",
    borderRadius: "8px", padding: "10px 12px", fontSize: "14px", color: "#333"
  };

  const label = {
    fontSize: "11px", color: "#888", textTransform: "uppercase" as const,
    letterSpacing: "0.5px", display: "block" as const, marginBottom: "5px"
  };

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg-primary)", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "#0A5C3F", padding: "20px 28px 44px" }}>
        <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
          <span style={{ color: "white", fontSize: "20px", fontWeight: "600" }}>
            Land<span style={{ color: "#FAC775" }}>Verify</span>
          </span>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {isLoggedIn ? (
              <>
                {userName && (
                  <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px" }}>
                    Hi, {userName}
                    <span style={{ color: "#FAC775", fontSize: "11px", marginLeft: "6px", fontWeight: "500" }}>· Premium Access</span>
                  </span>
                )}
                {userRole !== "agent" && userRole !== "admin" && (
                  <span onClick={() => router.push("/buyer")}
                    style={{ color: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "6px", padding: "6px 14px", fontSize: "13px", cursor: "pointer" }}>
                    My Portal
                  </span>
                )}
                {userRole === "agent" && (
                  <span onClick={() => router.push("/dashboard")}
                    style={{ background: "#FAC775", color: "#412402", borderRadius: "6px", padding: "6px 14px", fontSize: "13px", fontWeight: "500", cursor: "pointer" }}>
                    List Property
                  </span>
                )}
                {userRole === "admin" && (
                  <span onClick={() => router.push("/admin")}
                    style={{ background: "#FAC775", color: "#412402", borderRadius: "6px", padding: "6px 14px", fontSize: "13px", fontWeight: "500", cursor: "pointer" }}>
                    Admin Panel
                  </span>
                )}
                <span onClick={handleLogout}
                  style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", cursor: "pointer", padding: "6px", borderRadius: "4px" }}>
                  Sign out
                </span>
                <DarkModeToggle />
              </>
            ) : (
              <>
                <span onClick={() => router.push("/auth/login")}
                  style={{ color: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "6px", padding: "6px 14px", fontSize: "13px", cursor: "pointer" }}>
                  Sign in
                </span>
                <span onClick={() => router.push("/auth/signup")}
                  style={{ background: "#FAC775", color: "#412402", borderRadius: "6px", padding: "6px 14px", fontSize: "13px", fontWeight: "500", cursor: "pointer" }}>
                  List Property
                </span>
                <DarkModeToggle />
              </>
            )}
          </div>
        </nav>

        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px" }}>
          Verified property across Nigeria
        </p>
        <h1 style={{ color: "white", fontSize: "30px", fontWeight: "300", lineHeight: "1.2", marginBottom: "16px" }}>
          Find a home with<br />
          <em style={{ color: "#FAC775" }}>zero title risk</em>
        </h1>
        <TrustBadges />
        <RegistryTicker />
      </div>

      <div style={{ margin: "0 16px", marginTop: "-20px", background: "var(--bg-card)", borderRadius: "16px", border: "1px solid var(--border)", padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>

        <div style={{ display: "flex", gap: "4px", background: "var(--bg-secondary)", borderRadius: "10px", padding: "4px", marginBottom: "20px" }}>
          {["Buy", "Rent", "Shortlet", "Verify Title"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ flex: 1, padding: "8px 4px", border: "none", borderRadius: "7px", fontSize: "13px", cursor: "pointer", background: activeTab === tab ? "white" : "none", color: activeTab === tab ? "#0A5C3F" : "#888", fontWeight: activeTab === tab ? "500" : "400", boxShadow: activeTab === tab ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>
              {tab}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label style={label}>City — {selectedState}</label>
          <select style={sel} value={selectedCity} onChange={e => setSelectedCity(e.target.value === "All Cities" ? "" : e.target.value)}>
            {cities.map(c => <option key={c} value={c === "All Cities" ? "" : c}>{c}</option>)}
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
          <div>
            <label style={label}>State</label>
            <select style={sel} value={selectedState} onChange={e => { setSelectedState(e.target.value); setSelectedLGA(""); setSelectedCity(""); }}>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>LGA — {selectedState} ({lgas.length})</label>
            <select style={sel} value={selectedLGA} onChange={e => setSelectedLGA(e.target.value)}>
              <option value="">All LGAs</option>
              {lgas.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
          <div>
            <label style={label}>Property Type</label>
            <select style={sel} value={selectedType} onChange={e => setSelectedType(e.target.value)}>
              <option value="">All types</option>
              {["Flat", "Detached House", "Semi-Detached", "Land", "Bungalow", "Duplex", "Commercial"].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>Title Type</label>
            <select style={sel} value={selectedTitle} onChange={e => setSelectedTitle(e.target.value)}>
              <option value="">All titles</option>
              {["C of O", "R of O", "Gazetted", "Deed of Assignment", "Governor's Consent"].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div onClick={() => setVerifiedOnly(!verifiedOnly)}
          style={{ display: "flex", alignItems: "center", gap: "10px", background: verifiedOnly ? "#E1F5EE" : "#f8f8f8", border: `1px solid ${verifiedOnly ? "rgba(29,158,117,0.3)" : "#e8e8e8"}`, borderRadius: "8px", padding: "12px 14px", marginBottom: "14px", cursor: "pointer" }}>
          <div style={{ width: "36px", height: "20px", background: verifiedOnly ? "#1D9E75" : "#ccc", borderRadius: "10px", position: "relative", flexShrink: 0 }}>
            <div style={{ width: "14px", height: "14px", background: "white", borderRadius: "50%", position: "absolute", top: "3px", left: verifiedOnly ? "19px" : "3px", transition: "left 0.2s" }} />
          </div>
          <div>
            <strong style={{ display: "block", fontSize: "13px", color: verifiedOnly ? "#0A5C3F" : "#555" }}>Verified listings only</strong>
            <span style={{ fontSize: "11px", color: "#888" }}>Registry-confirmed titles · KYC-cleared agents</span>
          </div>
        </div>

        {activeTab === "Verify Title" ? (
          <div style={{ background: "#E1F5EE", borderRadius: "10px", padding: "16px", textAlign: "center" }}>
            <div style={{ fontSize: "14px", fontWeight: "500", color: "#0A5C3F", marginBottom: "4px" }}>Title Verification</div>
            <div style={{ fontSize: "12px", color: "#666", marginBottom: "12px" }}>Enter a property address or title number to verify its registry status</div>
            <input type="text" placeholder="e.g. Plot 15, Lekki Phase 1 or Title No. LG/123456"
              style={{ width: "100%", background: "white", border: "1px solid #cde8db", borderRadius: "8px", padding: "10px 12px", fontSize: "13px", outline: "none", boxSizing: "border-box" as const, marginBottom: "10px" }} />
            <button onClick={handleSearch} style={{ width: "100%", background: "#0A5C3F", color: "white", border: "none", borderRadius: "8px", padding: "12px", fontSize: "14px", fontWeight: "500", cursor: "pointer" }}>
              Verify Title
            </button>
          </div>
        ) : (
          <button onClick={handleSearch}
            style={{ width: "100%", background: "#0A5C3F", color: "white", border: "none", borderRadius: "10px", padding: "14px", fontSize: "15px", fontWeight: "500", cursor: "pointer" }}>
            {activeTab === "Rent" ? "Search rental properties" : activeTab === "Shortlet" ? "Search shortlets" : "Search properties"}
          </button>
        )}
      </div>

      <LiveStats />
    </main>
  );
}


