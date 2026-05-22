"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API = "https://landverify-production.up.railway.app/api/v1";

function StarRating({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: "4px" }}>
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          style={{
            fontSize: "24px",
            cursor: readonly ? "default" : "pointer",
            color: star <= (hover || value) ? "#FAC775" : "#ddd",
            transition: "color 0.1s",
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    agent_id: "",
    property_id: "",
    rating: 0,
    title: "",
    comment: "",
    tags: [] as string[],
  });
  const [agents, setAgents] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [stats, setStats] = useState({ average: 0, total: 0, breakdown: [0, 0, 0, 0, 0] });

  const TAGS = ["Professional", "Responsive", "Honest", "Good Value", "Knowledgeable", "Punctual", "Recommended"];

  useEffect(() => {
    const token = sessionStorage.getItem("access_token");
    if (!token) { router.push("/auth/login"); return; }

    // Fetch reviews
    fetch(`${API}/reviews`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : data.reviews || [];
        setReviews(list);
        if (list.length > 0) {
          const avg = list.reduce((a: number, r: any) => a + r.rating, 0) / list.length;
          const breakdown = [0, 0, 0, 0, 0];
          list.forEach((r: any) => { if (r.rating >= 1 && r.rating <= 5) breakdown[r.rating - 1]++; });
          setStats({ average: avg, total: list.length, breakdown });
        }
      })
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));

    // Fetch agents for the form
    fetch(`${API}/agents`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setAgents(Array.isArray(data) ? data : []))
      .catch(() => {});

    // Fetch user's properties for the form
    fetch(`${API}/properties?limit=50`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setProperties(Array.isArray(data) ? data : data.data || []))
      .catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (form.rating === 0) { alert("Please select a star rating"); return; }
    if (!form.comment.trim()) { alert("Please write a review comment"); return; }
    setSubmitting(true);
    const token = sessionStorage.getItem("access_token");
    try {
      const res = await fetch(`${API}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const newReview = await res.json();
        setReviews(prev => [newReview, ...prev]);
        setSuccess(true);
        setShowForm(false);
        setForm({ agent_id: "", property_id: "", rating: 0, title: "", comment: "", tags: [] });
        setTimeout(() => setSuccess(false), 4000);
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to submit review");
      }
    } catch {
      alert("Could not submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTag = (tag: string) => {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag],
    }));
  };

  return (
    <div style={{ fontFamily: "system-ui,sans-serif", minHeight: "100vh", background: "#f5f5f5" }}>
      {/* Header */}
      <div style={{ background: "#0A5C3F", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span onClick={() => router.push("/")} style={{ color: "white", fontSize: "18px", fontWeight: "600", cursor: "pointer" }}>
          Land<span style={{ color: "#FAC775" }}>Verify</span>
        </span>
        <button onClick={() => router.back()} style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "none", borderRadius: "6px", padding: "6px 14px", fontSize: "13px", cursor: "pointer" }}>
          Back
        </button>
      </div>

      <div style={{ maxWidth: "800px", margin: "24px auto", padding: "0 20px" }}>

        {success && (
          <div style={{ background: "#E1F5EE", border: "1px solid rgba(10,92,63,0.2)", borderRadius: "10px", padding: "12px 16px", marginBottom: "16px", fontSize: "13px", color: "#0A5C3F" }}>
            Review submitted successfully! Thank you for your feedback.
          </div>
        )}

        {/* Stats */}
        <div style={{ background: "white", borderRadius: "12px", padding: "24px", border: "1px solid #eee", marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#222", margin: 0 }}>Agent Reviews</h2>
            <button onClick={() => setShowForm(!showForm)}
              style={{ background: "#0A5C3F", color: "white", border: "none", borderRadius: "8px", padding: "9px 18px", fontSize: "13px", fontWeight: "500", cursor: "pointer" }}>
              {showForm ? "Cancel" : "Write a Review"}
            </button>
          </div>

          {stats.total > 0 && (
            <div style={{ display: "flex", gap: "32px", alignItems: "center" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "48px", fontWeight: "700", color: "#0A5C3F" }}>{stats.average.toFixed(1)}</div>
                <StarRating value={Math.round(stats.average)} readonly />
                <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>{stats.total} reviews</div>
              </div>
              <div style={{ flex: 1 }}>
                {[5, 4, 3, 2, 1].map(star => (
                  <div key={star} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "12px", color: "#888", width: "12px" }}>{star}</span>
                    <span style={{ color: "#FAC775", fontSize: "12px" }}>★</span>
                    <div style={{ flex: 1, background: "#f0f0f0", borderRadius: "4px", height: "8px", overflow: "hidden" }}>
                      <div style={{ background: "#FAC775", height: "100%", width: `${stats.total ? (stats.breakdown[star - 1] / stats.total) * 100 : 0}%`, borderRadius: "4px" }} />
                    </div>
                    <span style={{ fontSize: "12px", color: "#888", width: "20px" }}>{stats.breakdown[star - 1]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Write review form */}
        {showForm && (
          <div style={{ background: "white", borderRadius: "12px", padding: "24px", border: "1px solid #eee", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#222", marginBottom: "20px" }}>Write a Review</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "500", color: "#555", display: "block", marginBottom: "8px" }}>Your Rating *</label>
                <StarRating value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} />
                <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
                  {form.rating === 1 ? "Poor" : form.rating === 2 ? "Fair" : form.rating === 3 ? "Good" : form.rating === 4 ? "Very Good" : form.rating === 5 ? "Excellent" : "Select a rating"}
                </div>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "500", color: "#555", display: "block", marginBottom: "6px" }}>Review Title</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Summarize your experience"
                  style={{ width: "100%", background: "#f8f8f8", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "10px 12px", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "500", color: "#555", display: "block", marginBottom: "6px" }}>Your Review *</label>
                <textarea
                  value={form.comment}
                  onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
                  placeholder="Share your experience with this agent or property..."
                  rows={4}
                  style={{ width: "100%", background: "#f8f8f8", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "10px 12px", fontSize: "13px", outline: "none", resize: "vertical", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "500", color: "#555", display: "block", marginBottom: "8px" }}>Tags (optional)</label>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {TAGS.map(tag => (
                    <span key={tag} onClick={() => toggleTag(tag)}
                      style={{ fontSize: "12px", padding: "5px 12px", borderRadius: "20px", cursor: "pointer", border: `1px solid ${form.tags.includes(tag) ? "#0A5C3F" : "#e8e8e8"}`, background: form.tags.includes(tag) ? "#E1F5EE" : "#f8f8f8", color: form.tags.includes(tag) ? "#0A5C3F" : "#555" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setShowForm(false)}
                  style={{ flex: 1, background: "#f0f0f0", color: "#333", border: "none", borderRadius: "8px", padding: "11px", fontSize: "13px", cursor: "pointer" }}>
                  Cancel
                </button>
                <button onClick={handleSubmit} disabled={submitting}
                  style={{ flex: 2, background: submitting ? "#ccc" : "#0A5C3F", color: "white", border: "none", borderRadius: "8px", padding: "11px", fontSize: "13px", fontWeight: "500", cursor: submitting ? "not-allowed" : "pointer" }}>
                  {submitting ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reviews list */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", background: "white", borderRadius: "12px", border: "1px solid #eee" }}>
            <p style={{ color: "#888" }}>Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", background: "white", borderRadius: "12px", border: "1px solid #eee" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>★</div>
            <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#333", marginBottom: "8px" }}>No reviews yet</h3>
            <p style={{ color: "#888", fontSize: "13px" }}>Be the first to review an agent on LandVerify.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {reviews.map((review: any) => (
              <div key={review.id} style={{ background: "white", borderRadius: "12px", padding: "20px", border: "1px solid #eee" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                  <div>
                    <StarRating value={review.rating} readonly />
                    {review.title && <h4 style={{ fontSize: "14px", fontWeight: "600", color: "#222", margin: "6px 0 0" }}>{review.title}</h4>}
                  </div>
                  <span style={{ fontSize: "11px", color: "#888" }}>
                    {new Date(review.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                <p style={{ fontSize: "13px", color: "#555", lineHeight: "1.7", margin: "0 0 10px" }}>{review.comment}</p>
                {review.tags && review.tags.length > 0 && (
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {review.tags.map((tag: string) => (
                      <span key={tag} style={{ fontSize: "11px", background: "#E1F5EE", color: "#0A5C3F", borderRadius: "20px", padding: "3px 10px" }}>{tag}</span>
                    ))}
                  </div>
                )}
                <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid #f5f5f5", display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#E1F5EE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "600", color: "#0A5C3F" }}>
                    {(review.reviewer_name || "A").charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: "500", color: "#333" }}>{review.reviewer_name || "Anonymous"}</div>
                    {review.agent_name && <div style={{ fontSize: "11px", color: "#888" }}>Review for {review.agent_name}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
