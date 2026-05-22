"use client";
import { useRouter } from "next/navigation";

export default function RefundPage() {
  const router = useRouter();
  return (
    <div style={{ fontFamily: "system-ui,sans-serif", minHeight: "100vh", background: "#f5f5f5" }}>
      <div style={{ background: "#0A5C3F", padding: "16px 24px" }}>
        <span onClick={() => router.push("/")} style={{ color: "white", fontSize: "20px", fontWeight: "600", cursor: "pointer" }}>
          Land<span style={{ color: "#FAC775" }}>Verify</span>
        </span>
      </div>
      <div style={{ maxWidth: "800px", margin: "40px auto", padding: "0 24px" }}>
        <div style={{ background: "white", borderRadius: "16px", padding: "40px", border: "1px solid #eee" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#0A5C3F", marginBottom: "8px" }}>Refund Policy</h1>
          <p style={{ color: "#888", marginBottom: "32px" }}>Last updated: May 2026</p>

          <div style={{ background: "#E1F5EE", borderRadius: "10px", padding: "16px", marginBottom: "28px" }}>
            <p style={{ color: "#0A5C3F", fontWeight: "500", margin: 0 }}>LandVerify's escrow system is designed to protect buyers. You are entitled to a full refund if any of the conditions below are met.</p>
          </div>

          {[
            { title: "Full Refund Conditions", content: "You are entitled to a 100% refund if: (1) Title verification fails and encumbrances are found on the property. (2) The agent cannot produce valid title documents within 14 days. (3) The property is found to be fraudulently listed. (4) The transaction is cancelled before the Legal Search milestone is completed." },
            { title: "Partial Refund Conditions", content: "A partial refund (minus legal search costs) may apply if: The transaction is cancelled after Legal Search but before Deed Signing. Legal search fees of up to 0.5% of the property value may be deducted." },
            { title: "No Refund Conditions", content: "No refund is available if: All milestones have been completed and funds released to the seller. The buyer withdraws after Deed Signing without valid reason. The buyer provided false information during the transaction." },
            { title: "How to Request a Refund", content: "Contact our support team at support@landverify.ng with your escrow reference number and reason for refund. Our team will review within 2 business days. If approved, refunds are processed via your original payment method within 5-10 business days." },
            { title: "Service Fee", content: "LandVerify's 1.5% service fee is non-refundable once the escrow has been activated and the payment secured milestone completed." },
            { title: "Disputes", content: "If you have a dispute about a refund decision, you may escalate to our dispute resolution team at disputes@landverify.ng. All disputes are governed by Nigerian law." },
          ].map(section => (
            <div key={section.title} style={{ marginBottom: "24px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#222", marginBottom: "8px" }}>{section.title}</h2>
              <p style={{ fontSize: "14px", color: "#555", lineHeight: "1.8", margin: 0 }}>{section.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
