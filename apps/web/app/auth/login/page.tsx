"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { setError("Please fill in all fields"); return; }
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("username", email);
      formData.append("password", password);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://landverify-production.up.railway.app/api/v1"}/auth/login`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || "Invalid email or password"); return; }

      const accessToken = data.access_token || data.tokens?.access_token;
      const refreshToken = data.refresh_token || data.tokens?.refresh_token;
      const role = data.user?.role || data.role;

      sessionStorage.setItem("access_token", accessToken);
      sessionStorage.setItem("refresh_token", refreshToken);
      sessionStorage.setItem("user_role", role);
      document.cookie = "access_token=" + accessToken + "; path=/; max-age=86400; SameSite=Lax";

      const redirect = new URLSearchParams(window.location.search).get("redirect");
      if (redirect) {
        router.push(redirect);
      } else if (role === "admin") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch {
      setError("Cannot connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inp: React.CSSProperties = {
    width: "100%", background: "#f8f8f8", border: "1px solid #e8e8e8",
    borderRadius: "8px", padding: "12px 14px", fontSize: "14px",
    color: "#333", outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", fontFamily: "system-ui,sans-serif", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "#0A5C3F", padding: "16px 24px" }}>
        <span onClick={() => router.push("/")} style={{ color: "white", fontSize: "20px", fontWeight: "600", cursor: "pointer" }}>
          Land<span style={{ color: "#FAC775" }}>Verify</span>
        </span>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ background: "white", borderRadius: "16px", padding: "36px", width: "100%", maxWidth: "420px", border: "1px solid #eee", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>

          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#222", margin: "0 0 6px" }}>Welcome back</h1>
            <p style={{ fontSize: "14px", color: "#888", margin: 0 }}>Sign in to your LandVerify account</p>
          </div>

          {error && (
            <div style={{ background: "#FDECEA", border: "1px solid rgba(198,40,40,0.2)", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", fontSize: "13px", color: "#C62828" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "500", color: "#555", display: "block", marginBottom: "6px" }}>Email address</label>
              <input type="email" placeholder="you@example.com" value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                style={inp} />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: "500", color: "#555" }}>Password</label>
                <span onClick={() => router.push("/auth/forgot-password")} style={{ fontSize: "12px", color: "#0A5C3F", cursor: "pointer" }}>Forgot password?</span>
              </div>
              <div style={{ position: "relative" }}>
                <input type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  style={inp} />
                <span onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", fontSize: "12px", color: "#888" }}>
                  {showPassword ? "Hide" : "Show"}
                </span>
              </div>
            </div>

            <button onClick={handleLogin} disabled={loading}
              style={{ width: "100%", background: loading ? "#ccc" : "#0A5C3F", color: "white", border: "none", borderRadius: "10px", padding: "14px", fontSize: "15px", fontWeight: "500", cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>

          <div style={{ background: "#f8f8f8", borderRadius: "10px", padding: "14px", margin: "20px 0", textAlign: "center" }}>
            <span style={{ fontSize: "11px", color: "#888" }}>Secure login · NIN verified · Encrypted</span>
          </div>

          <p style={{ textAlign: "center", fontSize: "13px", color: "#888", margin: 0 }}>
            Don't have an account?{" "}
            <span onClick={() => router.push("/auth/signup")} style={{ color: "#0A5C3F", fontWeight: "500", cursor: "pointer" }}>
              Create one free
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

