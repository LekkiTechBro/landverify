"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

const API = "http://localhost:8000/api/v1";

function formatPrice(price: number) {
  if (price >= 1000000000) return "N" + (price / 1000000000).toFixed(1) + "B";
  if (price >= 1000000) return "N" + (price / 1000000).toFixed(1) + "M";
  return "N" + price.toLocaleString();
}

const RISK_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  low:    { bg: "#E1F5EE", color: "#0A5C3F", label: "Low Risk" },
  medium: { bg: "#FFF3CD", color: "#856404", label: "Medium Risk" },
  high:   { bg: "#FDECEA", color: "#C62828", label: "High Risk" },
};

export default function PropertyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enquiring, setEnquiring] = useState(false);
  const [enquiryMsg, setEnquiryMsg] = useState("");
  const [enquirySent, setEnquirySent] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const token = sessionStorage.getItem("access_token");
    if (!token) { router.push("/auth/login"); return; }

    fetch(`${API}/properties/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.detail) { setError("Property not found."); return; }
        setProperty(data);
      })
      .catch(() => setError("Could not load property."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleEnquire = async () => {
    const token = sessionStorage.getItem("access_token");
    if (!token) { router.push("/auth/login"); return; }
    if (!enquiryMsg.trim()) return;
    setEnquiring(true);
    try {
      await fetch(`${API}/chat/enquire`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ property_id: id, message: enquiryMsg }),
      });
      setEnquirySent(true);
      setEnquiryMsg("");
    } catch {
      alert("Could not send enquiry. Please try again.");
    } finally {
      setEnquiring(false);
    }
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "system-ui" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "32px", marginBottom: "12px" }}>...</div>
        <p style={{ color: "#888" }}>Loading property...</p>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "system-ui" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>404</div>
        <p style={{ color: "#888", marginBottom: "16px" }}>{error}</p>
        <button onClick={() => router.push("/search")} style={{ background: "#0A5C3F", color: "white", border: "none", borderRadius: "8px", padding: "10px 20px", cursor: "pointer" }}>Back to Search</button>
      </div>
    </div>
  );

  const risk = property.risk_score || "low";
  const riskStyle = RISK_COLORS[risk] || RISK_COLORS.low;
  const verified = property.verification_status === "fully_verified";

  return (
    <div style={{ fontFamily: "system-ui,sans-serif", minHeight: "100vh", background: "#f5f5f5" }}>
      {/* Header */}
      <div style={{ background: "#0A5C3F", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span onClick={() => router.push("/")} style={{ color: "white", fontSize: "18px", fontWeight: "600", cursor: "pointer" }}>
          Land<span style={{ color: "#FAC775" }}>Verify</span>
        </span>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => router.back()} style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "none", borderRadius: "6px", padding: "6px 14px", fontSize: "13px", cursor: "pointer" }}>
            Back
          </button>
          <button onClick={() => router.push("/search")} style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "none", borderRadius: "6px", padding: "6px 14px", fontSize: "13px", cursor: "pointer" }}>
            Search
          </button>
        </div>
      </div>

      <div style={{ maxWidth: "900px", margin: "24px auto", padding: "0 20px" }}>

        {/* Property image */}
        <div style={{ background: "linear-gradient(135deg,#0A5C3F,#1D9E75)", borderRadius: "16px", height: "280px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px", overflow: "hidden" }}>
          {property.images && property.images.length > 0 ? (
            <img src={property.images[activeImage]} alt={property.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ textAlign: "center", color: "white" }}>
              <div style={{ fontSize: "64px", marginBottom: "8px" }}>🏠</div>
              <div style={{ fontSize: "14px", opacity: 0.7 }}>No photos uploaded yet</div>
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "20px" }}>

          {/* Main content */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Title & badges */}
            <div style={{ background: "white", borderRadius: "12px", padding: "20px", border: "1px solid #eee" }}>
              <div style={{ display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
                {verified && <span style={{ fontSize: "11px", background: "#E1F5EE", color: "#0A5C3F", borderRadius: "4px", padding: "3px 8px", fontWeight: "500" }}>Verified</span>}
                <span style={{ fontSize: "11px", background: riskStyle.bg, color: riskStyle.color, borderRadius: "4px", padding: "3px 8px", fontWeight: "500" }}>{riskStyle.label}</span>
                <span style={{ fontSize: "11px", background: "#f0f0f0", color: "#555", borderRadius: "4px", padding: "3px 8px" }}>{property.type}</span>
                <span style={{ fontSize: "11px", background: "#f0f0f0", color: "#555", borderRadius: "4px", padding: "3px 8px", textTransform: "capitalize" }}>{property.purpose}</span>
              </div>
              <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#222", margin: "0 0 8px" }}>{property.title}</h1>
              <p style={{ fontSize: "14px", color: "#888", margin: "0 0 16px" }}>
                {property.area && `${property.area}, `}{property.lga}, {property.state}
              </p>
              <div style={{ fontSize: "28px", fontWeight: "700", color: "#0A5C3F" }}>
                {formatPrice(property.price)}
                {property.purpose === "rent" && <span style={{ fontSize: "14px", color: "#888", fontWeight: "400" }}>/year</span>}
              </div>
            </div>

            {/* Property details */}
            <div style={{ background: "white", borderRadius: "12px", padding: "20px", border: "1px solid #eee" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "600", color: "#333", marginBottom: "16px" }}>Property Details</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {[
                  { label: "Type", value: property.type },
                  { label: "Purpose", value: property.purpose?.charAt(0).toUpperCase() + property.purpose?.slice(1) },
                  { label: "State", value: property.state },
                  { label: "LGA", value: property.lga },
                  { label: "Area", value: property.area || "N/A" },
                  { label: "Title Type", value: property.title_type?.replace(/_/g, " ") },
                  property.bedrooms && { label: "Bedrooms", value: property.bedrooms },
                  property.bathrooms && { label: "Bathrooms", value: property.bathrooms },
                  property.size_sqm && { label: "Size", value: `${property.size_sqm} sqm` },
                  property.parking_spaces && { label: "Parking", value: property.parking_spaces + " spaces" },
                ].filter(Boolean).map((item: any) => (
                  <div key={item.label} style={{ background: "#f8f8f8", borderRadius: "8px", padding: "12px" }}>
                    <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px" }}>{item.label}</div>
                    <div style={{ fontSize: "13px", fontWeight: "500", color: "#333" }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            {property.description && (
              <div style={{ background: "white", borderRadius: "12px", padding: "20px", border: "1px solid #eee" }}>
                <h3 style={{ fontSize: "15px", fontWeight: "600", color: "#333", marginBottom: "12px" }}>Description</h3>
                <p style={{ fontSize: "14px", color: "#555", lineHeight: "1.7", margin: 0 }}>{property.description}</p>
              </div>
            )}

            {/* Title document checklist */}
            <div style={{ background: "white", borderRadius: "12px", padding: "20px", border: "1px solid #eee" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "600", color: "#333", marginBottom: "12px" }}>Title Document Checklist</h3>
              {[
                { label: "Title document uploaded", done: true },
                { label: "Title type declared", done: !!property.title_type },
                { label: "Registry verification", done: verified },
                { label: "Agent KYC verified", done: property.agent_kyc_verified || false },
              ].map(item => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: "1px solid #f5f5f5" }}>
                  <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: item.done ? "#E1F5EE" : "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", flexShrink: 0 }}>
                    {item.done ? "✓" : "·"}
                  </div>
                  <span style={{ fontSize: "13px", color: item.done ? "#0A5C3F" : "#888" }}>{item.label}</span>
                  <span style={{ marginLeft: "auto", fontSize: "10px", background: item.done ? "#E1F5EE" : "#f0f0f0", color: item.done ? "#0A5C3F" : "#aaa", borderRadius: "4px", padding: "2px 6px" }}>
                    {item.done ? "Done" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Price & Buy Now */}
            <div style={{ background: "white", borderRadius: "12px", padding: "20px", border: "1px solid #eee" }}>
              <div style={{ fontSize: "24px", fontWeight: "700", color: "#0A5C3F", marginBottom: "4px" }}>{formatPrice(property.price)}</div>
              <div style={{ fontSize: "12px", color: "#888", marginBottom: "16px" }}>
                {property.price_negotiable ? "Price negotiable" : "Fixed price"}
              </div>
              {property.purpose === "sale" && (
                <button onClick={() => router.push(`/purchase?property=${id}&title=${encodeURIComponent(property.title)}&amount=${property.price}&agent=${encodeURIComponent(property.agent_name || "Agent")}`)}
                  style={{ width: "100%", background: "#0A5C3F", color: "white", border: "none", borderRadius: "10px", padding: "13px", fontSize: "15px", fontWeight: "500", cursor: "pointer", marginBottom: "10px" }}>
                  Buy Now
                </button>
              )}
              <button onClick={() => router.push("/payment")}
                style={{ width: "100%", background: "#f0f0f0", color: "#333", border: "none", borderRadius: "10px", padding: "11px", fontSize: "13px", cursor: "pointer" }}>
                Pay via Escrow
              </button>
            </div>

            {/* Escrow protection notice */}
            <div style={{ background: "#E1F5EE", borderRadius: "12px", padding: "16px", border: "1px solid rgba(10,92,63,0.15)" }}>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#0A5C3F", marginBottom: "6px" }}>Escrow Protection</div>
              <p style={{ fontSize: "12px", color: "#0A5C3F", lineHeight: "1.6", margin: 0 }}>
                Your payment is held securely by LandVerify and only released to the seller after title transfer is verified.
              </p>
            </div>

            {/* Enquire */}
            <div style={{ background: "white", borderRadius: "12px", padding: "20px", border: "1px solid #eee" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#333", marginBottom: "12px" }}>Send Enquiry</h3>
              {enquirySent ? (
                <div style={{ background: "#E1F5EE", borderRadius: "8px", padding: "12px", fontSize: "13px", color: "#0A5C3F", textAlign: "center" }}>
                  Enquiry sent! The agent will respond shortly.
                </div>
              ) : (
                <>
                  <textarea
                    value={enquiryMsg}
                    onChange={e => setEnquiryMsg(e.target.value)}
                    placeholder="Hi, I am interested in this property. Is it still available?"
                    rows={4}
                    style={{ width: "100%", background: "#f8f8f8", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "10px 12px", fontSize: "13px", outline: "none", resize: "vertical", boxSizing: "border-box" }}
                  />
                  <button onClick={handleEnquire} disabled={enquiring || !enquiryMsg.trim()}
                    style={{ width: "100%", background: enquiring || !enquiryMsg.trim() ? "#ccc" : "#0A5C3F", color: "white", border: "none", borderRadius: "8px", padding: "11px", fontSize: "13px", fontWeight: "500", cursor: enquiring ? "not-allowed" : "pointer", marginTop: "8px" }}>
                    {enquiring ? "Sending..." : "Send Enquiry"}
                  </button>
                </>
              )}
            </div>

            {/* Property stats */}
            <div style={{ background: "white", borderRadius: "12px", padding: "16px", border: "1px solid #eee" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {[
                  { label: "Views", value: property.views || 0 },
                  { label: "Enquiries", value: property.inquiries || 0 },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: "center", background: "#f8f8f8", borderRadius: "8px", padding: "10px" }}>
                    <div style={{ fontSize: "20px", fontWeight: "700", color: "#0A5C3F" }}>{s.value}</div>
                    <div style={{ fontSize: "11px", color: "#888" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
