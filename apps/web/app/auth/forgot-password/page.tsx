"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const API = (process.env.NEXT_PUBLIC_API_URL || "https://landverify-production.up.railway.app/api/v1");

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await fetch(`${API}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
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

          {sent ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: "60px", height: "60px", background: "#E1F5EE", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: "28px" }}>✓</div>
              <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0A5C3F", marginBottom: "8px" }}>Check your email</h2>
              <p style={{ fontSize: "14px", color: "#888", lineHeight: "1.6", marginBottom: "24px" }}>
                If an account exists for <strong>{email}</strong>, we sent a password reset link. Check your inbox and spam folder.
              </p>
              <button onClick={() => router.push("/auth/login")}
                style={{ width: "100%", background: "#0A5C3F", color: "white", border: "none", borderRadius: "10px", padding: "13px", fontSize: "14px", fontWeight: "500", cursor: "pointer" }}>
                Back to Sign In
              </button>
            </div>
          ) : (
            <>
              <div style={{ textAlign: "center", marginBottom: "28px" }}>
                <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#222", margin: "0 0 6px" }}>Forgot Password</h1>
                <p style={{ fontSize: "14px", color: "#888", margin: 0 }}>Enter your email and we will send you a reset link</p>
              </div>

              {error && (
                <div style={{ background: "#FDECEA", border: "1px solid rgba(198,40,40,0.2)", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", fontSize: "13px", color: "#C62828" }}>
                  {error}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "500", color: "#555", display: "block", marginBottom: "6px" }}>Email address</label>
                  <input
                    type="email" placeholder="you@example.com" value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSubmit()}
                    style={inp}
                  />
                </div>
                <button onClick={handleSubmit} disabled={loading}
                  style={{ width: "100%", background: loading ? "#ccc" : "#0A5C3F", color: "white", border: "none", borderRadius: "10px", padding: "13px", fontSize: "15px", fontWeight: "500", cursor: loading ? "not-allowed" : "pointer" }}>
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </div>

              <p style={{ textAlign: "center", fontSize: "13px", color: "#888", margin: "20px 0 0" }}>
                Remember your password?{" "}
                <span onClick={() => router.push("/auth/login")} style={{ color: "#0A5C3F", fontWeight: "500", cursor: "pointer" }}>
                  Sign in
                </span>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
