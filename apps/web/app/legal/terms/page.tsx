// Terms of Service page - save as apps/web/app/legal/terms/page.tsx
"use client";
import { useRouter } from "next/navigation";

export default function TermsPage() {
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
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#0A5C3F", marginBottom: "8px" }}>Terms of Service</h1>
          <p style={{ color: "#888", marginBottom: "32px" }}>Last updated: May 2026</p>

          {[
            { title: "1. Acceptance of Terms", content: "By accessing or using LandVerify, you agree to be bound by these Terms of Service. LandVerify is a Nigerian real estate verification platform that connects property buyers with KYC-verified agents." },
            { title: "2. User Accounts", content: "You must provide accurate information when creating an account. Agents must complete NIN verification via NIMC registry before listing properties. You are responsible for maintaining the security of your account credentials." },
            { title: "3. Property Listings", content: "All property listings on LandVerify are subject to verification by our team. Agents must upload valid title documents. LandVerify reserves the right to reject or remove listings that do not meet our standards." },
            { title: "4. Escrow Payments", content: "LandVerify provides an escrow service for property transactions. Funds are held securely and released only upon completion of all milestones: Payment Secured, Legal Search, Deed Signing, and Fund Release. LandVerify charges a 1.5% service fee on all escrow transactions." },
            { title: "5. KYC Verification", content: "NIN verification is required for all agents. Your NIN is verified against the NIMC national registry. We store only a SHA-256 hash of your NIN — never the raw number. Misrepresentation of identity is grounds for immediate account suspension." },
            { title: "6. Refund Policy", content: "Buyers are entitled to a full refund if title verification fails or if the property is found to have legal encumbrances. Refunds are processed within 5-10 business days. See our Refund Policy for details." },
            { title: "7. Liability", content: "LandVerify is a platform and not a party to property transactions. We do not guarantee the accuracy of title documents uploaded by agents. Always conduct independent legal due diligence before completing a property purchase." },
            { title: "8. Privacy", content: "Your personal data is processed in accordance with our Privacy Policy. We do not sell your data to third parties. KYC data is processed by Smile Identity under their privacy policy." },
            { title: "9. Governing Law", content: "These Terms are governed by the laws of the Federal Republic of Nigeria. Any disputes shall be resolved in the courts of Lagos State, Nigeria." },
            { title: "10. Contact", content: "For questions about these Terms, contact us at legal@landverify.ng" },
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
