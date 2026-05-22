"use client";
import { useRouter } from "next/navigation";

export default function PrivacyPage() {
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
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#0A5C3F", marginBottom: "8px" }}>Privacy Policy</h1>
          <p style={{ color: "#888", marginBottom: "32px" }}>Last updated: May 2026</p>

          {[
            { title: "1. Information We Collect", content: "We collect: full name, email address, phone number, NIN (hashed), profile photo, property listings, chat messages, and payment transaction data. We do not store your raw NIN number." },
            { title: "2. How We Use Your Information", content: "We use your information to: verify your identity against the NIMC registry, facilitate property transactions, send transactional emails (welcome, KYC, payment confirmations), and improve our platform." },
            { title: "3. Data Security", content: "All sensitive data is encrypted at rest using AES-256-GCM. Passwords are hashed using bcrypt with 12 rounds. NINs are stored as SHA-256 hashes only. Document vault files use time-limited signed URLs with identity watermarks." },
            { title: "4. Third-Party Services", content: "We use: Smile Identity for NIN verification, Paystack for payment processing, Resend for transactional emails. Each provider has their own privacy policy governing data they process." },
            { title: "5. Data Retention", content: "We retain your account data for as long as your account is active. Transaction records are retained for 7 years as required by Nigerian financial regulations. You may request deletion of your account by contacting us." },
            { title: "6. Your Rights", content: "You have the right to: access your personal data, correct inaccurate data, request deletion of your data, and opt out of marketing communications. Contact privacy@landverify.ng to exercise these rights." },
            { title: "7. Cookies", content: "We use session cookies for authentication only. We do not use tracking or advertising cookies. You can disable cookies in your browser settings." },
            { title: "8. Contact", content: "For privacy questions, contact our Data Protection Officer at privacy@landverify.ng" },
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
