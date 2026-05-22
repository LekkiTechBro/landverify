"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

function EyeOpen() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function EyeClosed() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showNin, setShowNin] = useState(false);

  const [form, setForm] = useState({
    full_name: "", email: "", phone: "",
    password: "", confirm_password: "",
    role: "client", nin: "", agreed: false,
  });

  const update = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError("");
  };

  const validateStep1 = () => {
    if (!form.full_name.trim()) return "Please enter your full name";
    if (!form.email.trim() || !form.email.includes("@")) return "Please enter a valid email";
    if (!form.phone.trim() || form.phone.length < 11) return "Please enter a valid Nigerian phone number";
    return null;
  };

  const validateStep2 = () => {
    if (form.password.length < 8) return "Password must be at least 8 characters";
    if (form.password !== form.confirm_password) return "Passwords do not match";
    if (form.role === "agent" && !form.nin.trim()) return "NIN is required for agent accounts";
    if (!form.agreed) return "Please accept the terms to continue";
    return null;
  };

  const handleNext = () => {
    const err = validateStep1();
    if (err) { setError(err); return; }
    setStep(2); setError("");
  };

  const handleSignup = async () => {
    const err = validateStep2();
    if (err) { setError(err); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("https://landverify-production.up.railway.app/api/v1/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.full_name, email: form.email,
          phone: form.phone, password: form.password,
          role: form.role, nin: form.nin || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || "Signup failed. Please try again."); return; }
      const accessToken = data.access_token || data.tokens?.access_token;
      const refreshToken = data.refresh_token || data.tokens?.refresh_token;
      const role = data.user?.role || data.role || form.role;
      if (accessToken) {
        sessionStorage.setItem("access_token", accessToken);
        sessionStorage.setItem("refresh_token", refreshToken);
        sessionStorage.setItem("user_role", role);
        document.cookie = "access_token=" + accessToken + "; path=/; max-age=86400; SameSite=Lax";
      }
      setSuccess(true);
    } catch {
      setError("Cannot connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inp: React.CSSProperties = {
    width: "100%", background: "#f8f8f8", border: "1px solid #e8e8e8",
    borderRadius: "8px", padding: "12px 44px 12px 14px", fontSize: "14px",
    color: "#333", outline: "none", boxSizing: "border-box",
  };

  const eyeStyle: React.CSSProperties = {
    position: "absolute", right: "12px", top: "50%",
    transform: "translateY(-50%)", cursor: "pointer",
    display: "flex", alignItems: "center",
  };

  if (success) {
    return (
      <div style={{minHeight:"100vh",background:"#f5f5f5",fontFamily:"system-ui,sans-serif",display:"flex",flexDirection:"column"}}>
        <div style={{background:"#0A5C3F",padding:"16px 24px"}}>
          <span style={{color:"white",fontSize:"20px",fontWeight:"600"}}>Land<span style={{color:"#FAC775"}}>Verify</span></span>
        </div>
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px"}}>
          <div style={{background:"white",borderRadius:"16px",padding:"40px",width:"100%",maxWidth:"420px",textAlign:"center",border:"1px solid #eee"}}>
            <div style={{width:"64px",height:"64px",borderRadius:"50%",background:"#E1F5EE",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:"28px",color:"#0A5C3F",fontWeight:"700"}}>
              OK
            </div>
            <h2 style={{fontSize:"22px",fontWeight:"700",color:"#222",marginBottom:"8px"}}>Account created!</h2>
            <p style={{fontSize:"14px",color:"#888",marginBottom:"24px",lineHeight:"1.6"}}>
              Welcome to LandVerify.
              {form.role === "agent" ? " Complete KYC verification to start listing properties." : " Start searching for your perfect property."}
            </p>
            <button onClick={() => router.push("/")}
              style={{width:"100%",background:"#0A5C3F",color:"white",border:"none",borderRadius:"10px",padding:"14px",fontSize:"15px",fontWeight:"500",cursor:"pointer"}}>
              Get Started
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{minHeight:"100vh",background:"#f5f5f5",fontFamily:"system-ui,sans-serif",display:"flex",flexDirection:"column"}}>
      <div style={{background:"#0A5C3F",padding:"16px 24px"}}>
        <span onClick={() => router.push("/")} style={{color:"white",fontSize:"20px",fontWeight:"600",cursor:"pointer"}}>
          Land<span style={{color:"#FAC775"}}>Verify</span>
        </span>
      </div>

      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px"}}>
        <div style={{background:"white",borderRadius:"16px",padding:"36px",width:"100%",maxWidth:"440px",border:"1px solid #eee",boxShadow:"0 4px 20px rgba(0,0,0,0.06)"}}>

          {/* Progress bar */}
          <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"24px"}}>
            <div style={{flex:1,height:"4px",borderRadius:"2px",background:"#0A5C3F"}}></div>
            <div style={{flex:1,height:"4px",borderRadius:"2px",background:step>=2?"#0A5C3F":"#eee"}}></div>
          </div>

          <div style={{marginBottom:"24px"}}>
            <h1 style={{fontSize:"22px",fontWeight:"700",color:"#222",margin:"0 0 6px"}}>
              {step === 1 ? "Create your account" : "Set your password"}
            </h1>
            <p style={{fontSize:"14px",color:"#888",margin:0}}>
              {step === 1 ? "Step 1 of 2 — Your details" : "Step 2 of 2 — Security & verification"}
            </p>
          </div>

          {error && (
            <div style={{background:"#FDECEA",border:"1px solid rgba(198,40,40,0.2)",borderRadius:"8px",padding:"10px 14px",marginBottom:"16px",fontSize:"13px",color:"#C62828"}}>
              {typeof error === "string" ? error : JSON.stringify(error)}
            </div>
          )}

          {step === 1 && (
            <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
              <div>
                <label style={{fontSize:"12px",fontWeight:"500",color:"#555",display:"block",marginBottom:"8px"}}>I am a</label>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
                  {[
                    { value:"client", label:"Property Buyer", desc:"Search and enquire" },
                    { value:"agent", label:"Property Agent", desc:"List and sell" },
                  ].map(opt => (
                    <div key={opt.value} onClick={() => update("role", opt.value)}
                      style={{padding:"12px",border:"1.5px solid "+(form.role===opt.value?"#0A5C3F":"#e8e8e8"),borderRadius:"8px",cursor:"pointer",background:form.role===opt.value?"#E1F5EE":"white",textAlign:"center"}}>
                      <div style={{fontSize:"14px",fontWeight:"500",color:form.role===opt.value?"#0A5C3F":"#333",marginBottom:"2px"}}>{opt.label}</div>
                      <div style={{fontSize:"11px",color:"#888"}}>{opt.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label style={{fontSize:"12px",fontWeight:"500",color:"#555",display:"block",marginBottom:"6px"}}>Full name</label>
                <input type="text" placeholder="Adaeze Okonkwo" value={form.full_name}
                  onChange={e => update("full_name", e.target.value)}
                  style={{...inp, padding:"12px 14px"}} />
              </div>

              <div>
                <label style={{fontSize:"12px",fontWeight:"500",color:"#555",display:"block",marginBottom:"6px"}}>Email address</label>
                <input type="email" placeholder="you@example.com" value={form.email}
                  onChange={e => update("email", e.target.value)}
                  style={{...inp, padding:"12px 14px"}} />
              </div>

              <div>
                <label style={{fontSize:"12px",fontWeight:"500",color:"#555",display:"block",marginBottom:"6px"}}>Phone number</label>
                <input type="tel" placeholder="08012345678" value={form.phone}
                  onChange={e => update("phone", e.target.value)}
                  style={{...inp, padding:"12px 14px"}} />
              </div>

              <button onClick={handleNext}
                style={{width:"100%",background:"#0A5C3F",color:"white",border:"none",borderRadius:"10px",padding:"14px",fontSize:"15px",fontWeight:"500",cursor:"pointer",marginTop:"4px"}}>
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
              <div>
                <label style={{fontSize:"12px",fontWeight:"500",color:"#555",display:"block",marginBottom:"6px"}}>Password</label>
                <div style={{position:"relative"}}>
                  <input type={showPassword?"text":"password"} placeholder="At least 8 characters"
                    value={form.password} onChange={e => update("password", e.target.value)} style={inp}/>
                  <span style={eyeStyle} onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOpen /> : <EyeClosed />}
                  </span>
                </div>
                {form.password.length > 0 && (
                  <div style={{marginTop:"6px",display:"flex",gap:"4px"}}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{flex:1,height:"3px",borderRadius:"2px",background:
                        form.password.length >= i*3
                          ? (form.password.length >= 10 ? "#0A5C3F" : form.password.length >= 7 ? "#FAC775" : "#C62828")
                          : "#eee"}}/>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label style={{fontSize:"12px",fontWeight:"500",color:"#555",display:"block",marginBottom:"6px"}}>Confirm password</label>
                <div style={{position:"relative"}}>
                  <input type={showConfirm?"text":"password"} placeholder="Repeat your password"
                    value={form.confirm_password} onChange={e => update("confirm_password", e.target.value)} style={inp}/>
                  <span style={eyeStyle} onClick={() => setShowConfirm(!showConfirm)}>
                    {showConfirm ? <EyeOpen /> : <EyeClosed />}
                  </span>
                </div>
                {form.confirm_password && (
                  <span style={{fontSize:"11px",color:form.password===form.confirm_password?"#0A5C3F":"#C62828",marginTop:"4px",display:"block"}}>
                    {form.password===form.confirm_password ? "Passwords match" : "Passwords do not match"}
                  </span>
                )}
              </div>

              {form.role === "agent" && (
                <div>
                  <label style={{fontSize:"12px",fontWeight:"500",color:"#555",display:"block",marginBottom:"6px"}}>
                    NIN <span style={{color:"#C62828"}}>*required for agents</span>
                  </label>
                  <div style={{position:"relative"}}>
                    <input type={showNin?"text":"password"} placeholder="11-digit NIN"
                      value={form.nin} onChange={e => update("nin", e.target.value)} style={inp} maxLength={11}/>
                    <span style={eyeStyle} onClick={() => setShowNin(!showNin)}>
                      {showNin ? <EyeOpen /> : <EyeClosed />}
                    </span>
                  </div>
                  <span style={{fontSize:"11px",color:"#888",marginTop:"4px",display:"block"}}>
                    Your NIN is encrypted and never stored in plain text
                  </span>
                </div>
              )}

              <div onClick={() => update("agreed", !form.agreed)}
                style={{display:"flex",alignItems:"flex-start",gap:"10px",cursor:"pointer",padding:"12px",background:"#f8f8f8",borderRadius:"8px",border:"1px solid "+(form.agreed?"#0A5C3F":"#e8e8e8")}}>
                <div style={{width:"18px",height:"18px",borderRadius:"4px",border:"1.5px solid "+(form.agreed?"#0A5C3F":"#ccc"),background:form.agreed?"#0A5C3F":"white",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:"1px"}}>
                  {form.agreed && <span style={{color:"white",fontSize:"11px",fontWeight:"700"}}>✓</span>}
                </div>
                <span style={{fontSize:"12px",color:"#555",lineHeight:"1.5"}}>
                  I agree to LandVerify's{" "}
                  <span onClick={e => { e.stopPropagation(); router.push("/legal/terms"); }} style={{color:"#0A5C3F"}}>Terms of Service</span>
                  {" "}and{" "}
                  <span onClick={e => { e.stopPropagation(); router.push("/legal/privacy"); }} style={{color:"#0A5C3F"}}>Privacy Policy</span>.
                </span>
              </div>

              <div style={{display:"flex",gap:"10px"}}>
                <button onClick={() => { setStep(1); setError(""); }}
                  style={{flex:1,background:"#f0f0f0",color:"#333",border:"none",borderRadius:"10px",padding:"14px",fontSize:"14px",cursor:"pointer"}}>
                  Back
                </button>
                <button onClick={handleSignup} disabled={loading}
                  style={{flex:2,background:loading?"#ccc":"#0A5C3F",color:"white",border:"none",borderRadius:"10px",padding:"14px",fontSize:"15px",fontWeight:"500",cursor:loading?"not-allowed":"pointer"}}>
                  {loading ? "Creating..." : "Create account"}
                </button>
              </div>
            </div>
          )}

          <p style={{textAlign:"center",fontSize:"13px",color:"#888",margin:"20px 0 0"}}>
            Already have an account?{" "}
            <span onClick={() => router.push("/auth/login")} style={{color:"#0A5C3F",fontWeight:"500",cursor:"pointer"}}>Sign in</span>
          </p>
        </div>
      </div>
    </div>
  );
}
