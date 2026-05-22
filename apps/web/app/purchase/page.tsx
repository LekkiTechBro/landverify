"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const API = "http://localhost:8000/api/v1";

const STEPS = ["Details", "Review", "Payment", "Confirmed"];

function PurchaseContent() {
  const router = useRouter();
  const params = useSearchParams();
  const propertyId    = params.get("property") || "1";
  const propertyTitle = params.get("title")    || "3 Bedroom Flat, Lekki Phase 1";
  const amountNaira   = parseFloat(params.get("amount") || "45000000");
  const agentName     = params.get("agent")    || "Agent";

  const [step, setStep]         = useState(0);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [reference, setReference] = useState("");
  const [escrowId, setEscrowId]   = useState("");

  const [form, setForm] = useState({
    full_name: "", phone: "", email: "",
    address: "", city: "", state: "Lagos",
    agreed_price: amountNaira,
    payment_method: "full",
    notes: "",
  });

  useEffect(() => {
    const token = sessionStorage.getItem("access_token");
    if (!token) { router.push("/auth/login"); return; }
    fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        setForm(f => ({
          ...f,
          full_name: data.full_name || "",
          phone: data.phone || "",
          email: data.email || "",
        }));
      }).catch(() => {});
  }, []);

  const serviceFee = form.agreed_price * 0.015;
  const total      = form.agreed_price + serviceFee;

  const formatPrice = (p: number) =>
    p >= 1000000 ? "₦" + (p/1000000).toFixed(2) + "M" : "₦" + p.toLocaleString();

  const validateDetails = () => {
    if (!form.full_name.trim()) return "Full name is required";
    if (!form.phone.trim() || form.phone.length < 10) return "Valid phone number required";
    if (!form.email.trim() || !form.email.includes("@")) return "Valid email required";
    if (!form.address.trim()) return "Delivery/correspondence address required";
    if (!form.city.trim()) return "City is required";
    return null;
  };

  const handlePaystack = async () => {
    setLoading(true);
    setError("");
    const token = sessionStorage.getItem("access_token");

    try {
      const loadPaystack = (): Promise<void> => new Promise((resolve, reject) => {
        if ((window as any).PaystackPop) { resolve(); return; }
        const s = document.createElement("script");
        s.src = "https://js.paystack.co/v1/inline.js";
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("Failed to load Paystack script"));
        document.head.appendChild(s);
      });
      await loadPaystack();

      const ref = `LV-PROP-${propertyId}-${Date.now()}`;

      const handler = (window as any).PaystackPop.setup({
        key: "pk_test_5644a321b126bc1f8946c05f84548fa631428603",
        email: form.email,
        amount: Math.round(total * 100), // kobo
        currency: "NGN",
        ref,
        firstname: form.full_name.split(" ")[0],
        lastname:  form.full_name.split(" ").slice(1).join(" "),
        phone: form.phone,
        label: `Purchase: ${propertyTitle}`,
        description: `Escrow payment for ${propertyTitle}`,
        channels: ["card", "bank", "ussd", "mobile_money", "bank_transfer"],
        metadata: {
          property_id: propertyId,         // ✅ removed undefined `data.escrow_id`
          buyer_name: form.full_name,
          buyer_phone: form.phone,
          buyer_address: form.address,
          custom_fields: [
            { display_name: "Property",    variable_name: "property",    value: propertyTitle },
            { display_name: "Buyer Name",  variable_name: "buyer_name",  value: form.full_name },
            { display_name: "Buyer Phone", variable_name: "buyer_phone", value: form.phone },
            { display_name: "Transaction", variable_name: "type",        value: "Property Escrow" },
          ],
        },
        onSuccess: (response: any) => {
          setReference(response.reference);
          setStep(2);
          fetch(`${API}/payments/escrow/verify/${response.reference}`, {
              headers: { Authorization: `Bearer ${token || ""}` },
            });
          
          setEscrowId(`ESC-${response.reference}`);
          setTimeout(() => { setStep(3); setLoading(false); }, 1200);
        },
        onClose: () => {
          setLoading(false);
        },
      });

      handler.openIframe();
    } catch (err: any) {
      console.error("Paystack error:", err);
      setError(`Payment error: ${err?.message || "Please try again."}`);
      setLoading(false);
    }
  };

  const inp = {
    width: "100%", background: "#f8f8f8", border: "1px solid #e8e8e8",
    borderRadius: "8px", padding: "11px 14px", fontSize: "14px", color: "#333",
    outline: "none", boxSizing: "border-box" as const,
  };

  return (
    <div style={{minHeight:"100vh",background:"#f5f5f5",fontFamily:"system-ui,sans-serif"}}>
      {/* Header */}
      <div style={{background:"#0A5C3F",padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span onClick={() => router.push("/")} style={{color:"white",fontSize:"18px",fontWeight:"600",cursor:"pointer"}}>
          Land<span style={{color:"#FAC775"}}>Verify</span>
        </span>
        <span style={{fontSize:"12px",color:"rgba(255,255,255,0.6)"}}>🔒 Secure Property Purchase</span>
      </div>

      {/* Progress */}
      <div style={{background:"white",borderBottom:"1px solid #eee",padding:"14px 24px"}}>
        <div style={{maxWidth:"600px",margin:"0 auto",display:"flex",gap:"0"}}>
          {STEPS.map((s, i) => (
            <div key={s} style={{flex:1,display:"flex",alignItems:"center",gap:"0"}}>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"4px",flex:1}}>
                <div style={{
                  width:"28px",height:"28px",borderRadius:"50%",
                  background:i<step?"#0A5C3F":i===step?"#0A5C3F":"#eee",
                  color:i<=step?"white":"#aaa",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:"12px",fontWeight:"600",
                }}>
                  {i < step ? "✓" : i+1}
                </div>
                <span style={{fontSize:"11px",color:i<=step?"#0A5C3F":"#aaa",fontWeight:i===step?"600":"400"}}>{s}</span>
              </div>
              {i < STEPS.length-1 && (
                <div style={{height:"2px",flex:1,background:i<step?"#0A5C3F":"#eee",marginBottom:"18px"}}/>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{maxWidth:"600px",margin:"24px auto",padding:"0 20px"}}>

        {/* Property summary */}
        <div style={{background:"white",borderRadius:"12px",padding:"16px",border:"1px solid #eee",marginBottom:"16px",display:"flex",gap:"14px",alignItems:"center"}}>
          <div style={{width:"48px",height:"48px",borderRadius:"10px",background:"linear-gradient(135deg,#0A5C3F,#1D9E75)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"22px",flexShrink:0}}>🏠</div>
          <div style={{flex:1}}>
            <div style={{fontSize:"14px",fontWeight:"600",color:"#222"}}>{propertyTitle}</div>
            <div style={{fontSize:"12px",color:"#888"}}>Agent: {agentName}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:"18px",fontWeight:"700",color:"#0A5C3F"}}>{formatPrice(form.agreed_price)}</div>
            <div style={{fontSize:"10px",color:"#888"}}>Agreed price</div>
          </div>
        </div>

        {error && (
          <div style={{background:"#FDECEA",border:"1px solid rgba(198,40,40,0.2)",borderRadius:"8px",padding:"10px 14px",marginBottom:"14px",fontSize:"13px",color:"#C62828"}}>
            ⚠️ {error}
          </div>
        )}

        {/* STEP 0 — Purchase Details */}
        {step === 0 && (
          <div style={{background:"white",borderRadius:"12px",padding:"24px",border:"1px solid #eee"}}>
            <h2 style={{fontSize:"16px",fontWeight:"700",color:"#222",marginBottom:"4px"}}>Purchase Information</h2>
            <p style={{fontSize:"13px",color:"#888",marginBottom:"20px"}}>Fill in your details to proceed with the purchase</p>

            <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
                <div>
                  <label style={{fontSize:"12px",fontWeight:"500",color:"#555",display:"block",marginBottom:"5px"}}>Full Name *</label>
                  <input value={form.full_name} onChange={e=>setForm(f=>({...f,full_name:e.target.value}))}
                    placeholder="As on your ID" style={inp}/>
                </div>
                <div>
                  <label style={{fontSize:"12px",fontWeight:"500",color:"#555",display:"block",marginBottom:"5px"}}>Phone Number *</label>
                  <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}
                    placeholder="+234 801 234 5678" style={inp}/>
                </div>
              </div>
              <div>
                <label style={{fontSize:"12px",fontWeight:"500",color:"#555",display:"block",marginBottom:"5px"}}>Email Address *</label>
                <input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}
                  placeholder="you@example.com" style={inp}/>
              </div>
              <div>
                <label style={{fontSize:"12px",fontWeight:"500",color:"#555",display:"block",marginBottom:"5px"}}>Correspondence Address *</label>
                <input value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))}
                  placeholder="Your current residential address" style={inp}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
                <div>
                  <label style={{fontSize:"12px",fontWeight:"500",color:"#555",display:"block",marginBottom:"5px"}}>City *</label>
                  <input value={form.city} onChange={e=>setForm(f=>({...f,city:e.target.value}))}
                    placeholder="e.g. Lagos" style={inp}/>
                </div>
                <div>
                  <label style={{fontSize:"12px",fontWeight:"500",color:"#555",display:"block",marginBottom:"5px"}}>State</label>
                  <select value={form.state} onChange={e=>setForm(f=>({...f,state:e.target.value}))} style={inp}>
                    {["Lagos","Abuja (FCT)","Rivers","Oyo","Kano","Delta","Enugu","Edo","Anambra","Ogun","Kaduna","Imo"].map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{fontSize:"12px",fontWeight:"500",color:"#555",display:"block",marginBottom:"5px"}}>Agreed Purchase Price (₦) *</label>
                <input type="number" value={form.agreed_price}
                  onChange={e=>setForm(f=>({...f,agreed_price:parseFloat(e.target.value)||0}))}
                  style={inp}/>
                <span style={{fontSize:"11px",color:"#888",marginTop:"4px",display:"block"}}>
                  + {formatPrice(form.agreed_price*0.015)} LandVerify service fee (1.5%) = <strong>{formatPrice(form.agreed_price*1.015)} total</strong>
                </span>
              </div>
              <div>
                <label style={{fontSize:"12px",fontWeight:"500",color:"#555",display:"block",marginBottom:"5px"}}>Notes to Agent (optional)</label>
                <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}
                  placeholder="Any specific terms, conditions or special requests..."
                  rows={3} style={{...inp,resize:"vertical" as const}}/>
              </div>
            </div>

            <button onClick={() => {
              const err = validateDetails();
              if (err) { setError(err); return; }
              setError(""); setStep(1);
            }}
              style={{width:"100%",background:"#0A5C3F",color:"white",border:"none",borderRadius:"10px",padding:"14px",fontSize:"15px",fontWeight:"500",cursor:"pointer",marginTop:"20px"}}>
              Review Purchase →
            </button>
          </div>
        )}

        {/* STEP 1 — Review */}
        {step === 1 && (
          <div style={{background:"white",borderRadius:"12px",padding:"24px",border:"1px solid #eee"}}>
            <h2 style={{fontSize:"16px",fontWeight:"700",color:"#222",marginBottom:"4px"}}>Review Your Purchase</h2>
            <p style={{fontSize:"13px",color:"#888",marginBottom:"20px"}}>Confirm all details before proceeding to payment</p>

            <div style={{background:"#f8f8f8",borderRadius:"10px",padding:"16px",marginBottom:"14px"}}>
              <h4 style={{fontSize:"12px",fontWeight:"600",color:"#888",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:"12px"}}>Buyer Information</h4>
              {[
                {label:"Full Name", value:form.full_name},
                {label:"Phone", value:form.phone},
                {label:"Email", value:form.email},
                {label:"Address", value:`${form.address}, ${form.city}, ${form.state}`},
              ].map(item=>(
                <div key={item.label} style={{display:"flex",justifyContent:"space-between",marginBottom:"8px",fontSize:"13px"}}>
                  <span style={{color:"#888"}}>{item.label}</span>
                  <span style={{color:"#333",fontWeight:"500",textAlign:"right",maxWidth:"60%"}}>{item.value}</span>
                </div>
              ))}
            </div>

            <div style={{background:"#f8f8f8",borderRadius:"10px",padding:"16px",marginBottom:"14px"}}>
              <h4 style={{fontSize:"12px",fontWeight:"600",color:"#888",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:"12px"}}>Property Details</h4>
              {[
                {label:"Property", value:propertyTitle},
                {label:"Seller/Agent", value:agentName},
                {label:"Property ID", value:propertyId},
              ].map(item=>(
                <div key={item.label} style={{display:"flex",justifyContent:"space-between",marginBottom:"8px",fontSize:"13px"}}>
                  <span style={{color:"#888"}}>{item.label}</span>
                  <span style={{color:"#333",fontWeight:"500"}}>{item.value}</span>
                </div>
              ))}
            </div>

            <div style={{background:"#E1F5EE",borderRadius:"10px",padding:"16px",marginBottom:"20px"}}>
              <h4 style={{fontSize:"12px",fontWeight:"600",color:"#0A5C3F",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:"12px"}}>Payment Breakdown</h4>
              {[
                {label:"Agreed Purchase Price", value:formatPrice(form.agreed_price)},
                {label:"LandVerify Service Fee (1.5%)", value:formatPrice(serviceFee)},
              ].map(item=>(
                <div key={item.label} style={{display:"flex",justifyContent:"space-between",marginBottom:"8px",fontSize:"13px"}}>
                  <span style={{color:"#0A5C3F"}}>{item.label}</span>
                  <span style={{color:"#0A5C3F",fontWeight:"500"}}>{item.value}</span>
                </div>
              ))}
              <div style={{borderTop:"1px solid rgba(10,92,63,0.2)",paddingTop:"10px",marginTop:"4px",display:"flex",justifyContent:"space-between"}}>
                <span style={{fontSize:"15px",fontWeight:"700",color:"#0A5C3F"}}>Total Payable</span>
                <span style={{fontSize:"18px",fontWeight:"700",color:"#0A5C3F"}}>{formatPrice(total)}</span>
              </div>
            </div>

            <div style={{background:"#FFF3CD",border:"1px solid rgba(133,100,4,0.2)",borderRadius:"8px",padding:"12px",marginBottom:"20px",fontSize:"12px",color:"#856404",lineHeight:"1.6"}}>
              🔒 <strong>Escrow Protection:</strong> Your payment will be held securely by LandVerify. Funds are only released to the seller after legal title transfer is complete. Full refund if title verification fails.
            </div>

            <div style={{display:"flex",gap:"10px"}}>
              <button onClick={()=>{setStep(0);setError("");}}
                style={{flex:1,background:"#f0f0f0",color:"#333",border:"none",borderRadius:"10px",padding:"13px",fontSize:"14px",cursor:"pointer"}}>
                ← Edit Details
              </button>
              <button onClick={handlePaystack} disabled={loading}
                style={{flex:2,background:loading?"#ccc":"#0A5C3F",color:"white",border:"none",borderRadius:"10px",padding:"13px",fontSize:"15px",fontWeight:"500",cursor:loading?"not-allowed":"pointer"}}>
                {loading ? "Opening Paystack..." : `Pay ${formatPrice(total)} via Paystack →`}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 — Processing */}
        {step === 2 && (
          <div style={{background:"white",borderRadius:"12px",padding:"40px",border:"1px solid #eee",textAlign:"center"}}>
            <div style={{fontSize:"48px",marginBottom:"16px",animation:"spin 2s linear infinite"}}>⏳</div>
            <h2 style={{fontSize:"18px",fontWeight:"700",color:"#222",marginBottom:"8px"}}>Processing Payment</h2>
            <p style={{fontSize:"13px",color:"#888"}}>Complete the payment in the Paystack window.<br/>Do not close this page.</p>
            <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {/* STEP 3 — Confirmed */}
        {step === 3 && (
          <div style={{background:"white",borderRadius:"12px",padding:"40px",border:"1px solid #eee",textAlign:"center"}}>
            <div style={{width:"80px",height:"80px",borderRadius:"50%",background:"#E1F5EE",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:"36px"}}>✅</div>
            <h2 style={{fontSize:"22px",fontWeight:"700",color:"#0A5C3F",marginBottom:"8px"}}>Payment Confirmed!</h2>
            <p style={{fontSize:"14px",color:"#888",marginBottom:"20px",lineHeight:"1.6"}}>
              <strong>{formatPrice(form.agreed_price)}</strong> is now held in escrow.<br/>
              LandVerify will notify you when the title transfer is complete.
            </p>

            <div style={{background:"#f8f8f8",borderRadius:"10px",padding:"14px",marginBottom:"20px",textAlign:"left"}}>
              {[
                {label:"Reference",    value:reference},
                {label:"Escrow ID",    value:escrowId?.slice(-12)},
                {label:"Property",     value:propertyTitle},
                {label:"Buyer",        value:form.full_name},
                {label:"Amount Paid",  value:formatPrice(total)},
                {label:"Status",       value:"Payment Secured in Escrow"},
              ].map(item=>(
                <div key={item.label} style={{display:"flex",justifyContent:"space-between",marginBottom:"8px",fontSize:"12px"}}>
                  <span style={{color:"#888"}}>{item.label}</span>
                  <span style={{color:"#333",fontWeight:"500",fontFamily:item.label.includes("ID")||item.label==="Reference"?"monospace":"inherit"}}>{item.value}</span>
                </div>
              ))}
            </div>

            <div style={{marginBottom:"20px",textAlign:"left"}}>
              {[
                {label:"Payment Secured",  done:true,  desc:"Funds held in LandVerify escrow"},
                {label:"Legal Search",     done:false, desc:"Title registry verification"},
                {label:"Deed Signing",     done:false, desc:"Documents signed by both parties"},
                {label:"Fund Release",     done:false, desc:"Funds released to seller"},
              ].map((m,i)=>(
                <div key={m.label} style={{display:"flex",gap:"10px",alignItems:"center",padding:"10px 0",borderBottom:"1px solid #f5f5f5"}}>
                  <div style={{width:"28px",height:"28px",borderRadius:"50%",background:m.done?"#0A5C3F":"#eee",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",flexShrink:0,color:m.done?"white":"#888"}}>
                    {m.done ? "✓" : i+1}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:"13px",fontWeight:"500",color:m.done?"#0A5C3F":"#888"}}>{m.label}</div>
                    <div style={{fontSize:"11px",color:"#aaa"}}>{m.desc}</div>
                  </div>
                  <span style={{fontSize:"10px",background:m.done?"#E1F5EE":"#f0f0f0",color:m.done?"#0A5C3F":"#aaa",borderRadius:"4px",padding:"2px 7px"}}>
                    {m.done ? "Done" : "Pending"}
                  </span>
                </div>
              ))}
            </div>

            <div style={{display:"flex",gap:"10px"}}>
              <button onClick={()=>router.push("/buyer")}
                style={{flex:1,background:"#f0f0f0",color:"#333",border:"none",borderRadius:"10px",padding:"12px",fontSize:"13px",cursor:"pointer"}}>
                My Portal
              </button>
              <button onClick={()=>router.push(`/property/${propertyId}`)}
                style={{flex:2,background:"#0A5C3F",color:"white",border:"none",borderRadius:"10px",padding:"12px",fontSize:"13px",fontWeight:"500",cursor:"pointer"}}>
                View Property →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PurchasePage() {
  return (
    <Suspense fallback={<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",fontFamily:"system-ui"}}>Loading...</div>}>
      <PurchaseContent />
    </Suspense>
  );
}




