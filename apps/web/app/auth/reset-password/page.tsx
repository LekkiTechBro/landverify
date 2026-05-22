"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const API = "http://localhost:8000/api/v1";

function ResetContent() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) { router.push("/auth/forgot-password"); }
  }, [token]);

  const handleReset = async () => {
    if (!password || password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || "Reset failed. Link may have expired."); return; }
      setDone(true);
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
          {done ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: "60px", height: "60px", background: "#E1F5EE", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: "28px" }}>✓</div>
              <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0A5C3F", marginBottom: "8px" }}>Password Reset!</h2>
              <p style={{ fontSize: "14px", color: "#888", marginBottom: "24px" }}>Your password has been updated. You can now sign in.</p>
              <button onClick={() => router.push("/auth/login")}
                style={{ width: "100%", background: "#0A5C3F", color: "white", border: "none", borderRadius: "10px", padding: "13px", fontSize: "14px", fontWeight: "500", cursor: "pointer" }}>
                Sign In
              </button>
            </div>
          ) : (
            <>
              <div style={{ textAlign: "center", marginBottom: "28px" }}>
                <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#222", margin: "0 0 6px" }}>Reset Password</h1>
                <p style={{ fontSize: "14px", color: "#888", margin: 0 }}>Enter your new password below</p>
              </div>

              {error && (
                <div style={{ background: "#FDECEA", border: "1px solid rgba(198,40,40,0.2)", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", fontSize: "13px", color: "#C62828" }}>
                  {error}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "500", color: "#555", display: "block", marginBottom: "6px" }}>New Password</label>
                  <input type="password" placeholder="Min. 8 characters" value={password}
                    onChange={e => setPassword(e.target.value)} style={inp} />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "500", color: "#555", display: "block", marginBottom: "6px" }}>Confirm Password</label>
                  <input type="password" placeholder="Repeat your password" value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleReset()} style={inp} />
                </div>
                <button onClick={handleReset} disabled={loading}
                  style={{ width: "100%", background: loading ? "#ccc" : "#0A5C3F", color: "white", border: "none", borderRadius: "10px", padding: "13px", fontSize: "15px", fontWeight: "500", cursor: loading ? "not-allowed" : "pointer" }}>
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>Loading...</div>}>
      <ResetContent />
    </Suspense>
  );
}
