"use client";

import { useState, useRef, useEffect } from "react";

import { useRouter } from "next/navigation";



const API = "https://landverify-production.up.railway.app/api/v1";



type KYCStep = "intro" | "nin" | "selfie" | "review" | "submitted" | "verified" | "rejected";



//  Animated spinner dot 

function SpinnerDot() {

  return (

    <span style={{display:"inline-flex",gap:"3px",alignItems:"center"}}>

      {[0,1,2].map(i => (

        <span key={i} style={{

          width:"5px",height:"5px",borderRadius:"50%",background:"#856404",

          display:"inline-block",

          animation:`dotBounce 1.2s ease-in-out ${i*0.2}s infinite`,

        }}/>

      ))}

    </span>

  );

}



//  Live verification progress 

function VerificationProgress({ escrowData, onVerified, onRejected, router }: any) {

  const [stages, setStages] = useState([

    { key:"nin_submitted",    label:"NIN submitted",             done:true,  processing:false, failed:false },

    { key:"selfie_submitted", label:"Selfie submitted",          done:true,  processing:false, failed:false },

    { key:"registry_check",   label:"Registry check in progress", done:false, processing:true,  failed:false },

    { key:"face_match",       label:"Face match in progress",     done:false, processing:false, failed:false },

  ]);

  const [error, setError] = useState("");

  const pollRef = useRef<any>(null);

  const attempts = useRef(0);



  useEffect(() => {

    // Start face match animation 1.5s after registry starts

    const t = setTimeout(() => {

      setStages(prev => prev.map(s => s.key === "face_match" ? {...s, processing:true} : s));

    }, 1500);



    // Poll backend for verification result

    pollRef.current = setInterval(async () => {

      attempts.current++;

      const token = sessionStorage.getItem("access_token");

      try {

        const res = await fetch("https://landverify-production.up.railway.app/api/v1/auth/me", {

          headers: { Authorization: `Bearer ${token}` },

        });

        const data = await res.json();



        if (data.kyc_status === "verified") {

          clearInterval(pollRef.current);

          // Animate stages completing one by one

          setStages(prev => prev.map(s =>

            s.key === "registry_check" ? {...s, done:true, processing:false} : s

          ));

          setTimeout(() => {

            setStages(prev => prev.map(s =>

              s.key === "face_match" ? {...s, done:true, processing:false} : s

            ));

            setTimeout(() => onVerified(), 800);

          }, 800);

          return;

        }



        if (data.kyc_status === "rejected") {

          clearInterval(pollRef.current);

          setStages(prev => prev.map(s =>

            !s.done ? {...s, processing:false, failed:true} : s

          ));

          setTimeout(() => onRejected(), 1500);

          return;

        }



        // Timeout after 30 attempts (~60s)

        if (attempts.current > 30) {

          clearInterval(pollRef.current);

          setError("Verification is taking longer than expected. We'll notify you by email when complete.");

        }

      } catch {}

    }, 2000);



    return () => { clearTimeout(t); clearInterval(pollRef.current); };

  }, []);



  const getStageStyle = (stage: any) => {

    if (stage.done) return { bg:"#E1F5EE", color:"#0A5C3F", border:"1px solid rgba(10,92,63,0.2)" };

    if (stage.failed) return { bg:"#FDECEA", color:"#C62828", border:"1px solid rgba(198,40,40,0.2)" };

    if (stage.processing) return { bg:"#FFF3CD", color:"#856404", border:"1px solid rgba(133,100,4,0.2)" };

    return { bg:"#f8f8f8", color:"#aaa", border:"1px solid #eee" };

  };



  const getStageIcon = (stage: any) => {

    if (stage.done) return <span style={{fontSize:"16px",color:"#0A5C3F",fontWeight:"700"}}></span>;

    if (stage.failed) return <span style={{fontSize:"16px",color:"#C62828"}}></span>;

    if (stage.processing) return <SpinnerDot />;

    return <span style={{fontSize:"14px",color:"#ccc"}}></span>;

  };



  return (

    <div style={{background:"white",borderRadius:"16px",padding:"40px",border:"1px solid #eee",textAlign:"center"}}>

      <style>{`

        @keyframes dotBounce {

          0%,80%,100%{transform:scale(0.6);opacity:0.4}

          40%{transform:scale(1.1);opacity:1}

        }

        @keyframes verifiedGlow {

          0%,100%{box-shadow:0 0 0 0 rgba(10,92,63,0.3)}

          50%{box-shadow:0 0 0 8px rgba(10,92,63,0)}

        }

      `}</style>



      <div style={{

        width:"64px",height:"64px",borderRadius:"50%",

        background:"linear-gradient(135deg,#0A5C3F,#1D9E75)",

        display:"flex",alignItems:"center",justifyContent:"center",

        margin:"0 auto 16px",fontSize:"28px",

        animation:"verifiedGlow 2s infinite",

      }}></div>



      <h2 style={{fontSize:"22px",fontWeight:"700",color:"#222",marginBottom:"8px"}}>Verifying Your Identity</h2>

      <p style={{fontSize:"14px",color:"#888",marginBottom:"24px",lineHeight:"1.6"}}>

        Checking your NIN against the NIMC national registry.<br/>Please keep this page open.

      </p>



      <div style={{display:"flex",flexDirection:"column",gap:"8px",marginBottom:"24px",textAlign:"left"}}>

        {stages.map(stage => {

          const style = getStageStyle(stage);

          return (

            <div key={stage.key} style={{

              display:"flex",alignItems:"center",gap:"12px",

              padding:"12px 16px",

              background:style.bg,

              border:style.border,

              borderRadius:"10px",

              transition:"all 0.4s ease",

            }}>

              <div style={{width:"24px",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>

                {getStageIcon(stage)}

              </div>

              <span style={{fontSize:"13px",color:style.color,fontWeight:stage.done?"600":"400",flex:1}}>

                {stage.label}

              </span>

              {stage.processing && (

                <span style={{fontSize:"10px",color:"#856404",background:"rgba(133,100,4,0.1)",borderRadius:"4px",padding:"2px 7px"}}>

                  Processing

                </span>

              )}

              {stage.done && (

                <span style={{fontSize:"10px",color:"#0A5C3F",background:"rgba(10,92,63,0.1)",borderRadius:"4px",padding:"2px 7px"}}>

                  Verified

                </span>

              )}

              {stage.failed && (

                <span style={{fontSize:"10px",color:"#C62828",background:"rgba(198,40,40,0.1)",borderRadius:"4px",padding:"2px 7px"}}>

                  Failed

                </span>

              )}

            </div>

          );

        })}

      </div>



      {error ? (

        <div style={{background:"#FFF3CD",borderRadius:"10px",padding:"14px",marginBottom:"16px",fontSize:"13px",color:"#856404"}}>

           {error}

        </div>

      ) : (

        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",color:"#888",fontSize:"12px",marginBottom:"20px"}}>

          <SpinnerDot />

          <span>Communicating with NIMC registry...</span>

        </div>

      )}



      <button onClick={() => router.push("/buyer")}

        style={{width:"100%",background:"#f0f0f0",color:"#555",border:"none",borderRadius:"10px",padding:"13px",fontSize:"14px",cursor:"pointer"}}>

        Return to My Portal

      </button>

      <p style={{fontSize:"11px",color:"#aaa",marginTop:"10px"}}>

        You'll be notified once verification is complete. Do not submit again.

      </p>

    </div>

  );

}



export default function KYCPage() {

  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [step, setStep] = useState<KYCStep>("intro");

  const [nin, setNin] = useState("");

  const [ninError, setNinError] = useState("");

  const [selfieData, setSelfieData] = useState<string | null>(null);

  const [cameraActive, setCameraActive] = useState(false);

  const [cameraError, setCameraError] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const [submitError, setSubmitError] = useState("");

  const [kycStatus, setKycStatus] = useState<any>(null);

  const [user, setUser] = useState<any>(null);



  useEffect(() => {

    const token = sessionStorage.getItem("access_token");

    if (!token) { router.push("/auth/login"); return; }

    fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })

      .then(r => r.json())

      .then(data => {

        setUser(data);

        // Check if NIN from signup exists and matches

        if (data.kyc_status === "verified") setStep("verified");

        else if (data.kyc_status === "submitted") setStep("submitted");

        else if (data.kyc_status === "rejected") setStep("rejected");

      }).catch(() => {});

  }, []);



  const startCamera = async () => {

    setCameraError("");

    try {

      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } });

      if (videoRef.current) {

        videoRef.current.srcObject = stream;

        videoRef.current.play();

        setCameraActive(true);

      }

    } catch (err) {

      setCameraError("Camera access denied. Please allow camera access and try again.");

    }

  };



  const stopCamera = () => {

    if (videoRef.current?.srcObject) {

      const stream = videoRef.current.srcObject as MediaStream;

      stream.getTracks().forEach(t => t.stop());

      setCameraActive(false);

    }

  };



  const captureSelfie = () => {

    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;

    canvas.width = videoRef.current.videoWidth;

    canvas.height = videoRef.current.videoHeight;

    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);

    setSelfieData(canvas.toDataURL("image/jpeg", 0.8));

    stopCamera();

    setStep("review");

  };



  const validateNin = () => {

    const clean = nin.replace(/\D/g, "");

    if (clean.length !== 11) { setNinError("NIN must be exactly 11 digits"); return; }

    setNinError("");

    setStep("selfie");

    setTimeout(startCamera, 500);

  };



  const handleSubmit = async () => {

    setSubmitting(true);

    setSubmitError("");

    const token = sessionStorage.getItem("access_token");

    try {

      const res = await fetch(`${API}/auth/kyc/initiate`, {

        method: "POST",

        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },

        body: JSON.stringify({ nin: nin.replace(/\D/g, "") }),

      });

      const data = await res.json();

      if (res.ok) {

        setKycStatus(data);

        setStep("submitted");

      } else {

        setSubmitError(data.detail || "Verification failed. Please try again.");

      }

    } catch {

      setSubmitError("Cannot connect to server. Please try again.");

    } finally {

      setSubmitting(false);

    }

  };



  const formatNin = (val: string) => {

    const digits = val.replace(/\D/g, "").slice(0, 11);

    return digits;

  };



  return (

    <div style={{minHeight:"100vh",background:"#f5f5f5",fontFamily:"system-ui,sans-serif"}}>



      {/* Header */}

      <div style={{background:"#0A5C3F",padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>

        <span onClick={() => router.push("/")} style={{color:"white",fontSize:"18px",fontWeight:"600",cursor:"pointer"}}>

          Land<span style={{color:"#FAC775"}}>Verify</span>

        </span>

        <span style={{fontSize:"12px",color:"rgba(255,255,255,0.6)"}}>Identity Verification</span>

      </div>



      <div style={{maxWidth:"520px",margin:"40px auto",padding:"0 20px"}}>



        {/* Progress bar */}

        {!["submitted","verified","rejected"].includes(step) && (

          <div style={{display:"flex",gap:"6px",marginBottom:"28px"}}>

            {["intro","nin","selfie","review"].map((s, i) => (

              <div key={s} style={{flex:1,height:"4px",borderRadius:"2px",background:["intro","nin","selfie","review"].indexOf(step) >= i ? "#0A5C3F" : "#ddd"}}></div>

            ))}

          </div>

        )}



        {/* INTRO */}

        {step === "intro" && (

          <div style={{background:"white",borderRadius:"16px",padding:"32px",border:"1px solid #eee",textAlign:"center"}}>

            <div style={{width:"72px",height:"72px",background:"#E1F5EE",borderRadius:"16px",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:"32px"}}></div>

            <h1 style={{fontSize:"22px",fontWeight:"700",color:"#222",marginBottom:"8px"}}>Verify Your Identity</h1>

            <p style={{fontSize:"14px",color:"#888",marginBottom:"24px",lineHeight:"1.6"}}>

              LandVerify uses NIN verification to protect all users from fraud. This process takes less than 2 minutes.

            </p>

            <div style={{display:"flex",flexDirection:"column",gap:"10px",marginBottom:"28px",textAlign:"left"}}>

              {[

                { icon:"", title:"Your NIN", desc:"11-digit National Identity Number" },

                { icon:"", title:"A quick selfie", desc:"To match your face with your NIN record" },

                { icon:"", title:"Your data is safe", desc:"Encrypted and never shared with third parties" },

              ].map(item => (

                <div key={item.title} style={{display:"flex",gap:"12px",alignItems:"center",padding:"12px",background:"#f8f8f8",borderRadius:"10px"}}>

                  <span style={{fontSize:"24px",flexShrink:0}}>{item.icon}</span>

                  <div>

                    <div style={{fontSize:"13px",fontWeight:"600",color:"#333"}}>{item.title}</div>

                    <div style={{fontSize:"12px",color:"#888"}}>{item.desc}</div>

                  </div>

                </div>

              ))}

            </div>

            <button onClick={() => setStep("nin")}

              style={{width:"100%",background:"#0A5C3F",color:"white",border:"none",borderRadius:"10px",padding:"14px",fontSize:"15px",fontWeight:"500",cursor:"pointer"}}>

              Start Verification 

            </button>

            <p style={{fontSize:"11px",color:"#aaa",marginTop:"12px"}}>

              Your NIN is encrypted with AES-256-GCM and never stored in plain text.

            </p>

          </div>

        )}



        {/* NIN ENTRY */}

        {step === "nin" && (

          <div style={{background:"white",borderRadius:"16px",padding:"32px",border:"1px solid #eee"}}>

            <div style={{marginBottom:"24px"}}>

              <h2 style={{fontSize:"20px",fontWeight:"700",color:"#222",marginBottom:"6px"}}>Enter your NIN</h2>

              <p style={{fontSize:"14px",color:"#888"}}>Your 11-digit National Identity Number</p>

            </div>



            {/* What will be cross-checked */}

            {user && (

              <div style={{background:"#E1F5EE",border:"1px solid rgba(10,92,63,0.2)",borderRadius:"10px",padding:"14px",marginBottom:"16px"}}>

                <div style={{fontSize:"12px",fontWeight:"600",color:"#0A5C3F",marginBottom:"8px"}}> Your NIN will be verified against:</div>

                <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>

                  {[

                    {label:"Full Name", value:user.full_name||""},

                    {label:"Phone Number", value:user.phone||""},

                  ].map(item=>(

                    <div key={item.label} style={{display:"flex",justifyContent:"space-between",fontSize:"12px"}}>

                      <span style={{color:"#0A5C3F"}}>{item.label}</span>

                      <span style={{color:"#333",fontWeight:"500"}}>{item.value}</span>

                    </div>

                  ))}

                </div>

                <p style={{fontSize:"11px",color:"#0A5C3F",margin:"8px 0 0",lineHeight:"1.5"}}>

                  Make sure your NIN matches the name and phone you used to sign up. Mismatches will fail verification.

                </p>

              </div>

            )}



            <div style={{marginBottom:"16px"}}>

              <label style={{fontSize:"12px",fontWeight:"500",color:"#555",display:"block",marginBottom:"8px"}}>NIN Number</label>

              <input

                type="tel"

                placeholder="e.g. 12345678901"

                value={nin}

                onChange={e => { setNin(formatNin(e.target.value)); setNinError(""); }}

                maxLength={11}

                style={{width:"100%",background:"#f8f8f8",border:`1px solid ${ninError?"#C62828":"#e8e8e8"}`,borderRadius:"8px",padding:"14px 16px",fontSize:"20px",letterSpacing:"4px",outline:"none",boxSizing:"border-box" as const,textAlign:"center" as const}}

              />

              {ninError && <span style={{fontSize:"12px",color:"#C62828",marginTop:"6px",display:"block"}}>{ninError}</span>}

              <div style={{display:"flex",justifyContent:"space-between",marginTop:"6px"}}>

                <span style={{fontSize:"11px",color:"#aaa"}}>Digits entered: {nin.length}/11</span>

                <span style={{fontSize:"11px",color:"#aaa"}}> Hashed  never stored in plain text</span>

              </div>

            </div>



            <div style={{background:"#FFF3CD",border:"1px solid rgba(133,100,4,0.2)",borderRadius:"8px",padding:"12px",marginBottom:"20px"}}>

              <p style={{fontSize:"12px",color:"#856404",margin:0,lineHeight:"1.6"}}>

                 Find your NIN on your National ID card, or dial <strong>*346#</strong> on your registered phone to retrieve it.

                <br/> Your NIN name must match the name on your LandVerify account exactly.

              </p>

            </div>



            <div style={{display:"flex",gap:"10px"}}>

              <button onClick={() => setStep("intro")}

                style={{flex:1,background:"#f0f0f0",color:"#333",border:"none",borderRadius:"10px",padding:"13px",fontSize:"14px",cursor:"pointer"}}>

                 Back

              </button>

              <button onClick={validateNin} disabled={nin.length !== 11}

                style={{flex:2,background:nin.length!==11?"#ccc":"#0A5C3F",color:"white",border:"none",borderRadius:"10px",padding:"13px",fontSize:"14px",fontWeight:"500",cursor:nin.length!==11?"not-allowed":"pointer"}}>

                Continue 

              </button>

            </div>

          </div>

        )}



        {/* SELFIE */}

        {step === "selfie" && (

          <div style={{background:"white",borderRadius:"16px",padding:"32px",border:"1px solid #eee"}}>

            <div style={{marginBottom:"20px"}}>

              <h2 style={{fontSize:"20px",fontWeight:"700",color:"#222",marginBottom:"6px"}}>Take a selfie</h2>

              <p style={{fontSize:"14px",color:"#888"}}>Use your camera or upload a clear photo of your face</p>

            </div>



            {/* Camera view */}

            <div style={{position:"relative",borderRadius:"12px",overflow:"hidden",background:"#1a1a2e",marginBottom:"16px",aspectRatio:"4/3",display:"flex",alignItems:"center",justifyContent:"center"}}>

              <video ref={videoRef} autoPlay playsInline muted style={{width:"100%",height:"100%",objectFit:"cover",display:cameraActive?"block":"none"}} />

              <canvas ref={canvasRef} style={{display:"none"}} />



              {!cameraActive && !cameraError && (

                <div style={{textAlign:"center",color:"white",padding:"20px"}}>

                  <div style={{fontSize:"56px",marginBottom:"12px"}}></div>

                  <div style={{fontSize:"14px",marginBottom:"16px",color:"rgba(255,255,255,0.8)"}}>Ready to activate camera</div>

                  <button onClick={startCamera}

                    style={{background:"#0A5C3F",color:"white",border:"none",borderRadius:"8px",padding:"10px 20px",fontSize:"13px",cursor:"pointer"}}>

                     Open Camera

                  </button>

                </div>

              )}



              {cameraError && (

                <div style={{textAlign:"center",color:"white",padding:"20px"}}>

                  <div style={{fontSize:"36px",marginBottom:"8px"}}></div>

                  <div style={{fontSize:"13px",lineHeight:"1.5",color:"rgba(255,255,255,0.8)",marginBottom:"12px"}}>Camera not available</div>

                  <div style={{fontSize:"12px",color:"rgba(255,255,255,0.5)"}}>Use the upload option below instead</div>

                </div>

              )}



              {cameraActive && (

                <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:"180px",height:"220px",border:"2px solid rgba(255,255,255,0.7)",borderRadius:"50%",pointerEvents:"none",boxShadow:"0 0 0 2000px rgba(0,0,0,0.3)"}}></div>

              )}

            </div>



            {/* Camera capture button */}

            {cameraActive && (

              <button onClick={captureSelfie}

                style={{width:"100%",background:"#0A5C3F",color:"white",border:"none",borderRadius:"10px",padding:"13px",fontSize:"14px",fontWeight:"500",cursor:"pointer",marginBottom:"12px"}}>

                 Capture Photo

              </button>

            )}



            {/* Divider */}

            <div style={{display:"flex",alignItems:"center",gap:"10px",margin:"12px 0"}}>

              <div style={{flex:1,height:"1px",background:"#eee"}}></div>

              <span style={{fontSize:"12px",color:"#aaa"}}>or upload a photo</span>

              <div style={{flex:1,height:"1px",background:"#eee"}}></div>

            </div>



            {/* Upload fallback */}

            <div onClick={() => {

              const input = document.createElement("input");

              input.type = "file";

              input.accept = "image/*";

              input.capture = "user";

              input.onchange = (e: any) => {

                const file = e.target?.files?.[0];

                if (!file) return;

                const reader = new FileReader();

                reader.onload = ev => {

                  setSelfieData(ev.target?.result as string);

                  stopCamera();

                  setStep("review");

                };

                reader.readAsDataURL(file);

              };

              input.click();

            }}

              style={{border:"2px dashed #e8e8e8",borderRadius:"10px",padding:"16px",cursor:"pointer",textAlign:"center",background:"#f8f8f8",marginBottom:"16px"}}

              onMouseEnter={e => (e.currentTarget.style.borderColor="#0A5C3F")}

              onMouseLeave={e => (e.currentTarget.style.borderColor="#e8e8e8")}>

              <div style={{fontSize:"24px",marginBottom:"6px"}}></div>

              <div style={{fontSize:"13px",fontWeight:"500",color:"#555"}}>Upload a selfie photo</div>

              <div style={{fontSize:"11px",color:"#aaa"}}>JPG or PNG · Clear face photo required</div>

            </div>



            <button onClick={() => { stopCamera(); setStep("nin"); }}

              style={{width:"100%",background:"#f0f0f0",color:"#333",border:"none",borderRadius:"10px",padding:"12px",fontSize:"14px",cursor:"pointer"}}>

               Back

            </button>



            <div style={{display:"flex",gap:"12px",marginTop:"14px",justifyContent:"center"}}>

              {["Good lighting","Face forward","No sunglasses"].map(tip => (

                <span key={tip} style={{fontSize:"11px",color:"#888",background:"#f5f5f5",borderRadius:"20px",padding:"4px 10px"}}> {tip}</span>

              ))}

            </div>

          </div>

        )}



        {/* REVIEW */}

        {step === "review" && (

          <div style={{background:"white",borderRadius:"16px",padding:"32px",border:"1px solid #eee"}}>

            <h2 style={{fontSize:"20px",fontWeight:"700",color:"#222",marginBottom:"20px"}}>Review & Submit</h2>



            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px",marginBottom:"20px"}}>

              {/* Selfie preview */}

              <div style={{borderRadius:"10px",overflow:"hidden",border:"1px solid #eee"}}>

                {selfieData ? (

                  <img src={selfieData} alt="Selfie" style={{width:"100%",aspectRatio:"4/3",objectFit:"cover",display:"block"}} />

                ) : (

                  <div style={{background:"#f5f5f5",aspectRatio:"4/3",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"32px"}}></div>

                )}

                <div style={{padding:"8px 10px",fontSize:"12px",color:"#888",background:"#f8f8f8"}}>Your selfie</div>

              </div>



              {/* NIN summary */}

              <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>

                <div style={{background:"#f8f8f8",borderRadius:"8px",padding:"12px"}}>

                  <div style={{fontSize:"11px",color:"#888",marginBottom:"4px"}}>NIN</div>

                  <div style={{fontSize:"16px",fontWeight:"600",color:"#333",letterSpacing:"3px"}}>

                    {"".repeat(7) + nin.slice(-4)}

                  </div>

                </div>

                <div style={{background:"#E1F5EE",borderRadius:"8px",padding:"12px"}}>

                  <div style={{fontSize:"11px",color:"#0A5C3F",marginBottom:"4px"}}>Security</div>

                  <div style={{fontSize:"12px",color:"#0A5C3F"}}> AES-256-GCM encrypted</div>

                </div>

                <div style={{background:"#f8f8f8",borderRadius:"8px",padding:"12px"}}>

                  <div style={{fontSize:"11px",color:"#888",marginBottom:"4px"}}>Verification by</div>

                  <div style={{fontSize:"12px",color:"#333",fontWeight:"500"}}>Smile Identity</div>

                </div>

              </div>

            </div>



            {submitError && (

              <div style={{background:"#FDECEA",border:"1px solid rgba(198,40,40,0.2)",borderRadius:"8px",padding:"10px 14px",marginBottom:"16px",fontSize:"13px",color:"#C62828"}}>

                 {submitError}

              </div>

            )}



            <div style={{background:"#f8f8f8",borderRadius:"8px",padding:"12px",marginBottom:"20px"}}>

              <p style={{fontSize:"12px",color:"#555",margin:0,lineHeight:"1.6"}}>

                By submitting, you confirm that this is your NIN and selfie. False submissions may result in account suspension. Your data is processed securely and never sold to third parties.

              </p>

            </div>



            <div style={{display:"flex",gap:"10px"}}>

              <button onClick={() => { setSelfieData(null); setStep("selfie"); setTimeout(startCamera, 300); }}

                style={{flex:1,background:"#f0f0f0",color:"#333",border:"none",borderRadius:"10px",padding:"13px",fontSize:"14px",cursor:"pointer"}}>

                 Retake

              </button>

              <button onClick={handleSubmit} disabled={submitting}

                style={{flex:2,background:submitting?"#ccc":"#0A5C3F",color:"white",border:"none",borderRadius:"10px",padding:"13px",fontSize:"14px",fontWeight:"500",cursor:submitting?"not-allowed":"pointer"}}>

                {submitting ? "Submitting..." : "Submit for Verification "}

              </button>

            </div>

          </div>

        )}



        {/* SUBMITTED  live polling */}

        {step === "submitted" && (

          <VerificationProgress

            escrowData={kycStatus}

            onVerified={() => setStep("verified")}

            onRejected={() => setStep("rejected")}

            router={router}

          />

        )}



        {/* VERIFIED */}

        {step === "verified" && (

          <div style={{background:"white",borderRadius:"16px",padding:"40px",border:"1px solid #eee",textAlign:"center"}}>

            <div style={{width:"80px",height:"80px",background:"#E1F5EE",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:"36px"}}></div>

            <h2 style={{fontSize:"22px",fontWeight:"700",color:"#0A5C3F",marginBottom:"8px"}}>Identity Verified</h2>

            <p style={{fontSize:"14px",color:"#888",marginBottom:"24px",lineHeight:"1.6"}}>

              Your NIN has been verified against the national registry. You now have full access to LandVerify's secure features.

            </p>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"24px",textAlign:"left"}}>

              {[

                { icon:"", label:"NIN verified", color:"#0A5C3F" },

                { icon:"", label:"Face matched", color:"#0A5C3F" },

                { icon:"", label:"Registry cleared", color:"#0A5C3F" },

                { icon:"", label:"KYC complete", color:"#0A5C3F" },

              ].map(item => (

                <div key={item.label} style={{display:"flex",alignItems:"center",gap:"8px",padding:"10px 12px",background:"#E1F5EE",borderRadius:"8px"}}>

                  <span style={{color:item.color,fontWeight:"700"}}>{item.icon}</span>

                  <span style={{fontSize:"12px",color:item.color,fontWeight:"500"}}>{item.label}</span>

                </div>

              ))}

            </div>

            <button onClick={() => router.push("/buyer")}

              style={{width:"100%",background:"#0A5C3F",color:"white",border:"none",borderRadius:"10px",padding:"14px",fontSize:"15px",fontWeight:"500",cursor:"pointer"}}>

              Go to My Portal 

            </button>

          </div>

        )}



        {/* REJECTED */}

        {step === "rejected" && (

          <div style={{background:"white",borderRadius:"16px",padding:"40px",border:"1px solid #eee",textAlign:"center"}}>

            <div style={{fontSize:"56px",marginBottom:"16px"}}></div>

            <h2 style={{fontSize:"22px",fontWeight:"700",color:"#C62828",marginBottom:"8px"}}>Verification Failed</h2>

            <p style={{fontSize:"14px",color:"#888",marginBottom:"24px",lineHeight:"1.6"}}>

              We could not verify your identity. This may be due to a mismatch between your NIN and selfie, or an incorrect NIN.

            </p>

            <div style={{background:"#FDECEA",borderRadius:"8px",padding:"14px",marginBottom:"24px",textAlign:"left"}}>

              <p style={{fontSize:"13px",color:"#C62828",margin:0,lineHeight:"1.6"}}>

                Common reasons for failure:<br/>

                 NIN and face do not match<br/>

                 Incorrect NIN entered<br/>

                 Poor lighting in selfie<br/>

                 NIN not registered in the national database

              </p>

            </div>

            <button onClick={() => setStep("intro")}

              style={{width:"100%",background:"#0A5C3F",color:"white",border:"none",borderRadius:"10px",padding:"14px",fontSize:"15px",fontWeight:"500",cursor:"pointer"}}>

              Try Again 

            </button>

          </div>

        )}

      </div>

    </div>

  );

}



