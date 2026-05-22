"use client";

import { useState, useEffect } from "react";

import { useSearchParams, useRouter } from "next/navigation";

import { Suspense } from "react";



const API = (process.env.NEXT_PUBLIC_API_URL || "https://landverify-production.up.railway.app/api/v1");



const MILESTONES = [

  { key:"payment_secured",  label:"Payment Secured",  desc:"Funds held safely in LandVerify escrow",          icon:"" },

  { key:"legal_search",     label:"Legal Search",     desc:"Title registry verification in progress",          icon:"" },

  { key:"deed_signing",     label:"Deed Signing",     desc:"Documents reviewed and signed by both parties",    icon:"" },

  { key:"fund_release",     label:"Fund Release",     desc:"Funds released to seller upon completion",         icon:"" },

];



function formatPrice(p: number) {

  if (p >= 1000000) return "" + (p/1000000).toFixed(1) + "M";

  return "" + p.toLocaleString();

}



function PaymentContent() {

  const router = useRouter();

  const searchParams = useSearchParams();

  const propertyId = searchParams.get("property") || "1";

  const propertyTitle = searchParams.get("title") || "3 Bedroom Flat, Lekki Phase 1";

  const amountNaira = parseFloat(searchParams.get("amount") || "45000000");



  const [step, setStep] = useState<"overview"|"confirm"|"processing"|"secured"|"tracking">("overview");

  const [escrowId, setEscrowId] = useState("");

  const [escrowData, setEscrowData] = useState<any>(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [agreed, setAgreed] = useState(false);



  const serviceFee = amountNaira * 0.015; // 1.5% LandVerify fee

  const total = amountNaira + serviceFee;



  const handleInitiatePayment = async () => {

    setLoading(true);

    setError("");

    const token = sessionStorage.getItem("access_token");

    try {

      const res = await fetch(`${API}/payments/escrow/initiate`, {

        method: "POST",

        headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },

        body: JSON.stringify({

          property_id: propertyId,

          property_title: propertyTitle,

          amount_naira: amountNaira,

          seller_id: "mock-seller-id",

          callback_url: `${window.location.origin}/payment/callback`,

        }),

      });

      const data = await res.json();

      if (res.ok) {

        setEscrowId(data.escrow_id);

        // In production: redirect to data.authorization_url

        // For demo: simulate successful payment

        setStep("processing");

        setTimeout(() => {

          setStep("secured");

          setEscrowData({

            id: data.escrow_id,

            reference: data.reference,

            amount_naira: amountNaira,

            status: "secured",

            current_milestone: "payment_secured",

            milestones_completed: ["payment_secured"],

            property_title: propertyTitle,

            paid_at: new Date().toISOString(),

          });

        }, 2500);

      } else {

        setError(data.detail || "Payment initiation failed");

        setStep("confirm");

      }

    } catch {

      setError("Cannot connect to server. Make sure you are logged in.");

      setStep("confirm");

    } finally {

      setLoading(false);

    }

  };



  return (

    <div style={{minHeight:"100vh",background:"#f5f5f5",fontFamily:"system-ui,sans-serif"}}>



      {/* Header */}

      <div style={{background:"#0A5C3F",padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>

        <span onClick={() => router.push("/")} style={{color:"white",fontSize:"18px",fontWeight:"600",cursor:"pointer"}}>

          Land<span style={{color:"#FAC775"}}>Verify</span>

        </span>

        <span style={{fontSize:"12px",color:"rgba(255,255,255,0.6)"}}> Secure Escrow Payment</span>

      </div>



      <div style={{maxWidth:"560px",margin:"32px auto",padding:"0 20px"}}>



        {/* OVERVIEW */}

        {step === "overview" && (

          <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>



            {/* Property card */}

            <div style={{background:"white",borderRadius:"14px",padding:"20px",border:"1px solid #eee"}}>

              <div style={{display:"flex",gap:"14px",alignItems:"center",marginBottom:"16px"}}>

                <div style={{width:"52px",height:"52px",background:"linear-gradient(135deg,#0A5C3F,#1D9E75)",borderRadius:"10px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"22px",flexShrink:0}}></div>

                <div>

                  <div style={{fontSize:"15px",fontWeight:"600",color:"#222",marginBottom:"2px"}}>{propertyTitle}</div>

                  <div style={{fontSize:"12px",color:"#888"}}>Property ID: {propertyId}</div>

                </div>

              </div>

              <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>

                {[

                  { label:"Property Price", value:formatPrice(amountNaira), bold:true },

                  { label:"LandVerify Service Fee (1.5%)", value:formatPrice(serviceFee), bold:false },

                  { label:"Total", value:formatPrice(total), bold:true, green:true },

                ].map(item => (

                  <div key={item.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #f5f5f5"}}>

                    <span style={{fontSize:"13px",color:"#666"}}>{item.label}</span>

                    <span style={{fontSize:item.bold?"16px":"13px",fontWeight:item.bold?"700":"400",color:item.green?"#0A5C3F":"#333"}}>{item.value}</span>

                  </div>

                ))}

              </div>

            </div>



            {/* How escrow works */}

            <div style={{background:"white",borderRadius:"14px",padding:"20px",border:"1px solid #eee"}}>

              <h3 style={{fontSize:"14px",fontWeight:"600",color:"#333",marginBottom:"14px"}}>How LandVerify Escrow Works</h3>

              <div style={{display:"flex",flexDirection:"column",gap:"0"}}>

                {MILESTONES.map((m, i) => (

                  <div key={m.key} style={{display:"flex",gap:"12px",alignItems:"flex-start",paddingBottom:i<MILESTONES.length-1?"14px":"0",position:"relative"}}>

                    {i < MILESTONES.length-1 && (

                      <div style={{position:"absolute",left:"15px",top:"32px",bottom:0,width:"2px",background:"#e8e8e8"}}></div>

                    )}

                    <div style={{width:"32px",height:"32px",borderRadius:"50%",background:"#E1F5EE",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px",flexShrink:0,zIndex:1}}>

                      {m.icon}

                    </div>

                    <div style={{paddingTop:"4px"}}>

                      <div style={{fontSize:"13px",fontWeight:"600",color:"#333",marginBottom:"2px"}}>{m.label}</div>

                      <div style={{fontSize:"12px",color:"#888"}}>{m.desc}</div>

                    </div>

                  </div>

                ))}

              </div>

            </div>



            {/* Security badges */}

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>

              {[

                { icon:"", label:"256-bit Encryption", desc:"Bank-level security" },

                { icon:"", label:"Paystack Powered", desc:"Nigeria's #1 payment gateway" },

                { icon:"", label:"Legal Protection", desc:"Binding escrow agreement" },

                { icon:"", label:"Refund Policy", desc:"Full refund if title fails" },

              ].map(b => (

                <div key={b.label} style={{background:"white",borderRadius:"10px",padding:"12px",border:"1px solid #eee",display:"flex",gap:"10px",alignItems:"center"}}>

                  <span style={{fontSize:"20px"}}>{b.icon}</span>

                  <div>

                    <div style={{fontSize:"12px",fontWeight:"600",color:"#333"}}>{b.label}</div>

                    <div style={{fontSize:"11px",color:"#888"}}>{b.desc}</div>

                  </div>

                </div>

              ))}

            </div>



            <button onClick={() => setStep("confirm")}

              style={{width:"100%",background:"#0A5C3F",color:"white",border:"none",borderRadius:"12px",padding:"15px",fontSize:"15px",fontWeight:"500",cursor:"pointer"}}>

              Proceed to Payment 

            </button>

          </div>

        )}



        {/* CONFIRM */}

        {step === "confirm" && (

          <div style={{background:"white",borderRadius:"14px",padding:"24px",border:"1px solid #eee"}}>

            <h2 style={{fontSize:"20px",fontWeight:"700",color:"#222",marginBottom:"6px"}}>Confirm Payment</h2>

            <p style={{fontSize:"14px",color:"#888",marginBottom:"20px"}}>Review the details before proceeding</p>



            <div style={{background:"#f8f8f8",borderRadius:"10px",padding:"16px",marginBottom:"16px"}}>

              <div style={{fontSize:"13px",color:"#888",marginBottom:"4px"}}>Paying for</div>

              <div style={{fontSize:"15px",fontWeight:"600",color:"#333",marginBottom:"8px"}}>{propertyTitle}</div>

              <div style={{fontSize:"28px",fontWeight:"700",color:"#0A5C3F"}}>{formatPrice(total)}</div>

              <div style={{fontSize:"12px",color:"#888"}}>includes {formatPrice(serviceFee)} service fee</div>

            </div>



            {error && (

              <div style={{background:"#FDECEA",border:"1px solid rgba(198,40,40,0.2)",borderRadius:"8px",padding:"10px 14px",marginBottom:"14px",fontSize:"13px",color:"#C62828"}}>

                 {error}

              </div>

            )}



            <div onClick={() => setAgreed(!agreed)}

              style={{display:"flex",gap:"10px",alignItems:"flex-start",padding:"12px",background:"#f8f8f8",borderRadius:"8px",cursor:"pointer",marginBottom:"16px",border:`1px solid ${agreed?"#0A5C3F":"#e8e8e8"}`}}>

              <div style={{width:"18px",height:"18px",borderRadius:"4px",border:`1.5px solid ${agreed?"#0A5C3F":"#ccc"}`,background:agreed?"#0A5C3F":"white",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:"1px"}}>

                {agreed && <span style={{color:"white",fontSize:"11px",fontWeight:"700"}}></span>}

              </div>

              <span style={{fontSize:"12px",color:"#555",lineHeight:"1.5"}}>

                I agree to the <span style={{color:"#0A5C3F"}}>Escrow Terms</span>. I understand that funds will be held securely until all title verification steps are complete.

              </span>

            </div>



            <div style={{display:"flex",gap:"10px"}}>

              <button onClick={() => setStep("overview")}

                style={{flex:1,background:"#f0f0f0",color:"#333",border:"none",borderRadius:"10px",padding:"13px",fontSize:"14px",cursor:"pointer"}}>

                 Back

              </button>

              <button onClick={handleInitiatePayment} disabled={!agreed||loading}

                style={{flex:2,background:(!agreed||loading)?"#ccc":"#0A5C3F",color:"white",border:"none",borderRadius:"10px",padding:"13px",fontSize:"14px",fontWeight:"500",cursor:(!agreed||loading)?"not-allowed":"pointer"}}>

                {loading?"Processing...":"Pay with Paystack "}

              </button>

            </div>



            <div style={{display:"flex",gap:"16px",justifyContent:"center",marginTop:"14px"}}>

              {["Visa","Mastercard","Verve","Bank Transfer","USSD"].map(m => (

                <span key={m} style={{fontSize:"11px",color:"#aaa"}}>{m}</span>

              ))}

            </div>

          </div>

        )}



        {/* PROCESSING */}

        {step === "processing" && (

          <div style={{background:"white",borderRadius:"14px",padding:"40px",border:"1px solid #eee",textAlign:"center"}}>

            <div style={{fontSize:"56px",marginBottom:"16px",animation:"spin 2s linear infinite"}}></div>

            <h2 style={{fontSize:"20px",fontWeight:"700",color:"#222",marginBottom:"8px"}}>Processing Payment</h2>

            <p style={{fontSize:"14px",color:"#888",lineHeight:"1.6"}}>

              Securing your funds in escrow via Paystack...<br/>Please do not close this window.

            </p>

            <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>

          </div>

        )}



        {/* SECURED */}

        {step === "secured" && escrowData && (

          <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>

            <div style={{background:"white",borderRadius:"14px",padding:"28px",border:"1px solid #eee",textAlign:"center"}}>

              <div style={{width:"72px",height:"72px",background:"#E1F5EE",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:"32px"}}></div>

              <h2 style={{fontSize:"22px",fontWeight:"700",color:"#0A5C3F",marginBottom:"8px"}}>Payment Secured!</h2>

              <p style={{fontSize:"14px",color:"#888",marginBottom:"20px",lineHeight:"1.6"}}>

                <strong>{formatPrice(amountNaira)}</strong> is now held safely in escrow.<br/>

                Funds will be released to the seller once all milestones are complete.

              </p>

              <div style={{background:"#f8f8f8",borderRadius:"8px",padding:"12px",marginBottom:"20px",textAlign:"left"}}>

                <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}>

                  <span style={{fontSize:"12px",color:"#888"}}>Reference</span>

                  <span style={{fontSize:"12px",fontFamily:"monospace",color:"#333"}}>{escrowData.reference?.slice(-12)}</span>

                </div>

                <div style={{display:"flex",justifyContent:"space-between"}}>

                  <span style={{fontSize:"12px",color:"#888"}}>Escrow ID</span>

                  <span style={{fontSize:"12px",fontFamily:"monospace",color:"#333"}}>{escrowData.id?.slice(-12)}</span>

                </div>

              </div>

              <button onClick={() => setStep("tracking")}

                style={{width:"100%",background:"#0A5C3F",color:"white",border:"none",borderRadius:"10px",padding:"13px",fontSize:"14px",fontWeight:"500",cursor:"pointer"}}>

                Track Progress 

              </button>

            </div>

          </div>

        )}



        {/* TRACKING */}

        {step === "tracking" && escrowData && (

          <div style={{background:"white",borderRadius:"14px",padding:"24px",border:"1px solid #eee"}}>

            <h2 style={{fontSize:"18px",fontWeight:"700",color:"#222",marginBottom:"4px"}}>Escrow Progress</h2>

            <p style={{fontSize:"13px",color:"#888",marginBottom:"20px"}}>{propertyTitle}</p>



            <div style={{marginBottom:"20px"}}>

              {MILESTONES.map((m, i) => {

                const completed = escrowData.milestones_completed?.includes(m.key);

                const current = escrowData.current_milestone === m.key;

                return (

                  <div key={m.key} style={{display:"flex",gap:"14px",alignItems:"flex-start",paddingBottom:i<MILESTONES.length-1?"16px":"0",position:"relative"}}>

                    {i < MILESTONES.length-1 && (

                      <div style={{position:"absolute",left:"15px",top:"32px",bottom:0,width:"2px",background:completed?"#0A5C3F":"#eee",transition:"background 0.3s"}}></div>

                    )}

                    <div style={{width:"32px",height:"32px",borderRadius:"50%",background:completed?"#0A5C3F":current?"#FFF3CD":"#f0f0f0",border:`2px solid ${completed?"#0A5C3F":current?"#856404":"#ddd"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px",flexShrink:0,zIndex:1}}>

                      {completed ? "" : m.icon}

                    </div>

                    <div style={{paddingTop:"4px",flex:1}}>

                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>

                        <div style={{fontSize:"13px",fontWeight:"600",color:completed?"#0A5C3F":current?"#856404":"#888",marginBottom:"2px"}}>{m.label}</div>

                        <span style={{fontSize:"10px",fontWeight:"500",background:completed?"#E1F5EE":current?"#FFF3CD":"#f0f0f0",color:completed?"#0A5C3F":current?"#856404":"#aaa",borderRadius:"4px",padding:"2px 7px"}}>

                          {completed?"Done":current?"In Progress":"Pending"}

                        </span>

                      </div>

                      <div style={{fontSize:"12px",color:"#888"}}>{m.desc}</div>

                    </div>

                  </div>

                );

              })}

            </div>



            <div style={{background:"#E1F5EE",borderRadius:"10px",padding:"14px",marginBottom:"16px"}}>

              <div style={{fontSize:"13px",fontWeight:"600",color:"#0A5C3F",marginBottom:"4px"}}>Amount in Escrow</div>

              <div style={{fontSize:"24px",fontWeight:"700",color:"#0A5C3F"}}>{formatPrice(amountNaira)}</div>

              <div style={{fontSize:"12px",color:"#0A5C3F",marginTop:"2px"}}> Secured · Refundable if title fails</div>

            </div>



            <div style={{display:"flex",gap:"10px"}}>

              <button onClick={() => router.push("/buyer")}

                style={{flex:1,background:"#f0f0f0",color:"#333",border:"none",borderRadius:"10px",padding:"12px",fontSize:"13px",cursor:"pointer"}}>

                My Portal

              </button>

              <button onClick={() => router.push(`/property/${propertyId}`)}

                style={{flex:2,background:"#0A5C3F",color:"white",border:"none",borderRadius:"10px",padding:"12px",fontSize:"13px",fontWeight:"500",cursor:"pointer"}}>

                View Property 

              </button>

            </div>

          </div>

        )}

      </div>

    </div>

  );

}



export default function PaymentPage() {

  return (

    <Suspense fallback={<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",fontFamily:"system-ui"}}>Loading...</div>}>

      <PaymentContent />

    </Suspense>

  );

}



