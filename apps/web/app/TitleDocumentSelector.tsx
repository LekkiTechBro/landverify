"use client";
import { useState, useRef } from "react";

const TITLE_OPTIONS = [
  {
    value: "C_OF_O",
    label: "Certificate of Occupancy (C of O)",
    desc: "Strongest title — government backed ownership",
    icon: "📜",
    risk: "low",
    riskLabel: "Low Risk",
    required_docs: [
      { key: "coo_front", label: "C of O Front Page", hint: "Clear scan of the main certificate page" },
      { key: "coo_schedule", label: "C of O Schedule/Back Page", hint: "Shows land dimensions and conditions" },
      { key: "survey_plan", label: "Survey Plan", hint: "Must match the C of O reference number" },
    ],
  },
  {
    value: "R_OF_O",
    label: "Right of Occupancy (R of O)",
    desc: "Valid but recommend upgrading to C of O",
    icon: "📋",
    risk: "medium",
    riskLabel: "Medium Risk",
    required_docs: [
      { key: "roo_doc", label: "Right of Occupancy Document", hint: "Full R of O certificate" },
      { key: "survey_plan", label: "Survey Plan", hint: "Matching survey plan required" },
    ],
  },
  {
    value: "DEED",
    label: "Deed of Assignment",
    desc: "Review full chain of title before proceeding",
    icon: "📄",
    risk: "medium",
    riskLabel: "Medium Risk",
    required_docs: [
      { key: "deed_doc", label: "Deed of Assignment", hint: "Notarized and stamped copy" },
      { key: "receipt", label: "Purchase Receipt", hint: "Proof of payment from previous owner" },
      { key: "survey_plan", label: "Survey Plan", hint: "Survey plan matching the property" },
    ],
  },
  {
    value: "GOVERNORS_CONSENT",
    label: "Governor's Consent",
    desc: "Required for all property transfers in some states",
    icon: "🏛",
    risk: "low",
    riskLabel: "Low Risk",
    required_docs: [
      { key: "consent_doc", label: "Governor's Consent Document", hint: "Official consent letter" },
      { key: "deed_doc", label: "Underlying Deed", hint: "The deed the consent was granted on" },
      { key: "survey_plan", label: "Survey Plan", hint: "Survey plan required" },
    ],
  },
  {
    value: "GAZETTED",
    label: "Gazetted / Excision",
    desc: "Government-gazette land with community ownership",
    icon: "📰",
    risk: "low",
    riskLabel: "Low Risk",
    required_docs: [
      { key: "gazette_doc", label: "Gazette Document", hint: "Official government gazette" },
      { key: "survey_plan", label: "Survey Plan", hint: "Survey plan required" },
      { key: "family_consent", label: "Family/Community Consent Letter", hint: "For excised land" },
    ],
  },
];

const RISK_STYLE: Record<string, { bg: string; color: string }> = {
  low:    { bg:"#E1F5EE", color:"#0A5C3F" },
  medium: { bg:"#FFF3CD", color:"#856404" },
  high:   { bg:"#FDECEA", color:"#C62828" },
};

interface UploadedDoc {
  key: string;
  file: File;
  preview: string | null;
  base64: string;
}

interface TitleDocumentSelectorProps {
  onChange?: (titles: string[], docs: Record<string, UploadedDoc>) => void;
}

export default function TitleDocumentSelector({ onChange }: TitleDocumentSelectorProps) {
  const [selectedTitles, setSelectedTitles] = useState<string[]>([]);
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, UploadedDoc>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentDocKey = useRef<string>("");

  const toggleTitle = (value: string) => {
    const next = selectedTitles.includes(value)
      ? selectedTitles.filter(t => t !== value)
      : [...selectedTitles, value];
    setSelectedTitles(next);
    onChange?.(next, uploadedDocs);
  };

  const getRequiredDocs = () => {
    const allDocs: { key: string; label: string; hint: string; titleLabel: string }[] = [];
    const seen = new Set<string>();
    selectedTitles.forEach(titleVal => {
      const title = TITLE_OPTIONS.find(t => t.value === titleVal);
      title?.required_docs.forEach(doc => {
        if (!seen.has(doc.key)) {
          seen.add(doc.key);
          allDocs.push({ ...doc, titleLabel: title.label });
        }
      });
    });
    return allDocs;
  };

  const handleFileClick = (docKey: string) => {
    currentDocKey.current = docKey;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert("File must be under 10MB"); return; }
    setUploading(currentDocKey.current);

    const reader = new FileReader();
    reader.onload = ev => {
      const result = ev.target?.result as string;
      const base64 = result.split(",")[1];
      const isImage = file.type.startsWith("image/");

      const doc: UploadedDoc = {
        key: currentDocKey.current,
        file,
        preview: isImage ? result : null,
        base64,
      };

      const next = { ...uploadedDocs, [currentDocKey.current]: doc };
      setUploadedDocs(next);
      setUploading(null);
      onChange?.(selectedTitles, next);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const requiredDocs = getRequiredDocs();
  const uploadedCount = requiredDocs.filter(d => uploadedDocs[d.key]).length;
  const allUploaded = requiredDocs.length > 0 && uploadedCount === requiredDocs.length;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>

      {/* Title selection */}
      <div>
        <label style={{fontSize:"12px",fontWeight:"500",color:"#555",display:"block",marginBottom:"8px"}}>
          Title Type * <span style={{color:"#888",fontWeight:"400"}}>(select all that apply)</span>
        </label>
        <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
          {TITLE_OPTIONS.map(option => {
            const selected = selectedTitles.includes(option.value);
            const risk = RISK_STYLE[option.risk];
            return (
              <div key={option.value}
                onClick={() => toggleTitle(option.value)}
                style={{
                  display:"flex",alignItems:"center",gap:"12px",
                  padding:"12px 14px",
                  border:`1.5px solid ${selected?"#0A5C3F":"#e8e8e8"}`,
                  borderRadius:"10px",
                  cursor:"pointer",
                  background:selected?"#E1F5EE":"white",
                  transition:"all 0.15s",
                }}>
                {/* Checkbox */}
                <div style={{
                  width:"20px",height:"20px",borderRadius:"5px",
                  border:`1.5px solid ${selected?"#0A5C3F":"#ccc"}`,
                  background:selected?"#0A5C3F":"white",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  flexShrink:0,transition:"all 0.15s",
                }}>
                  {selected && <span style={{color:"white",fontSize:"13px",fontWeight:"700"}}>✓</span>}
                </div>
                <span style={{fontSize:"18px",flexShrink:0}}>{option.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:"13px",fontWeight:"600",color:selected?"#0A5C3F":"#333"}}>{option.label}</div>
                  <div style={{fontSize:"11px",color:"#888",marginTop:"1px"}}>{option.desc}</div>
                </div>
                <span style={{fontSize:"10px",fontWeight:"500",background:risk.bg,color:risk.color,borderRadius:"4px",padding:"2px 8px",flexShrink:0}}>
                  {option.riskLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Document upload section */}
      {selectedTitles.length > 0 && (
        <div style={{background:"#f8f8f8",borderRadius:"12px",padding:"16px",border:"1px solid #e8e8e8"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
            <div>
              <h4 style={{fontSize:"13px",fontWeight:"600",color:"#333",marginBottom:"2px"}}>Required Documents</h4>
              <p style={{fontSize:"11px",color:"#888"}}>Upload all documents to receive the Verified badge</p>
            </div>
            <div style={{textAlign:"right"}}>
              <span style={{fontSize:"13px",fontWeight:"700",color:allUploaded?"#0A5C3F":"#856404"}}>
                {uploadedCount}/{requiredDocs.length}
              </span>
              <div style={{fontSize:"10px",color:"#888"}}>uploaded</div>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{height:"4px",background:"#e8e8e8",borderRadius:"2px",marginBottom:"14px",overflow:"hidden"}}>
            <div style={{
              height:"100%",
              background:allUploaded?"#0A5C3F":"#FAC775",
              borderRadius:"2px",
              width:`${requiredDocs.length > 0 ? (uploadedCount/requiredDocs.length)*100 : 0}%`,
              transition:"width 0.3s ease",
            }} />
          </div>

          {/* Document upload items */}
          <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
            {requiredDocs.map(doc => {
              const uploaded = uploadedDocs[doc.key];
              const isUploading = uploading === doc.key;
              return (
                <div key={doc.key} style={{
                  background:"white",
                  borderRadius:"8px",
                  padding:"12px",
                  border:`1px solid ${uploaded?"#0A5C3F":"#e8e8e8"}`,
                  display:"flex",
                  gap:"10px",
                  alignItems:"center",
                }}>
                  {/* Status icon */}
                  <div style={{
                    width:"36px",height:"36px",borderRadius:"8px",
                    background:uploaded?"#E1F5EE":isUploading?"#FFF3CD":"#f0f0f0",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:"16px",flexShrink:0,
                    overflow:"hidden",
                  }}>
                    {uploaded && uploaded.preview ? (
                      <img src={uploaded.preview} alt={doc.label} style={{width:"100%",height:"100%",objectFit:"cover"}} />
                    ) : uploaded ? (
                      <span>📄</span>
                    ) : isUploading ? (
                      <span style={{fontSize:"12px"}}>⏳</span>
                    ) : (
                      <span>📎</span>
                    )}
                  </div>

                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:"12px",fontWeight:"600",color:"#333"}}>{doc.label}</div>
                    <div style={{fontSize:"11px",color:"#888",marginTop:"1px"}}>
                      {uploaded ? (
                        <span style={{color:"#0A5C3F"}}>✓ {uploaded.file.name}</span>
                      ) : (
                        doc.hint
                      )}
                    </div>
                  </div>

                  <div style={{flexShrink:0}}>
                    {uploaded ? (
                      <div style={{display:"flex",gap:"6px"}}>
                        <button
                          onClick={() => {
                            const next = { ...uploadedDocs };
                            delete next[doc.key];
                            setUploadedDocs(next);
                            onChange?.(selectedTitles, next);
                          }}
                          style={{background:"#FDECEA",color:"#C62828",border:"none",borderRadius:"6px",padding:"5px 10px",fontSize:"11px",cursor:"pointer"}}>
                          Remove
                        </button>
                        <span style={{background:"#E1F5EE",color:"#0A5C3F",borderRadius:"6px",padding:"5px 10px",fontSize:"11px",fontWeight:"500"}}>
                          ✓ Uploaded
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleFileClick(doc.key)}
                        disabled={isUploading}
                        style={{background:"#0A5C3F",color:"white",border:"none",borderRadius:"6px",padding:"6px 12px",fontSize:"12px",fontWeight:"500",cursor:"pointer"}}>
                        {isUploading ? "..." : "Upload"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Verification status */}
          {allUploaded ? (
            <div style={{marginTop:"12px",background:"#E1F5EE",borderRadius:"8px",padding:"10px 14px",display:"flex",gap:"8px",alignItems:"center"}}>
              <span style={{fontSize:"16px"}}>✅</span>
              <div>
                <div style={{fontSize:"12px",fontWeight:"600",color:"#0A5C3F"}}>All documents uploaded</div>
                <div style={{fontSize:"11px",color:"#0A5C3F"}}>LandVerify will verify these within 24 hours. You'll receive the Verified badge once cleared.</div>
              </div>
            </div>
          ) : (
            <div style={{marginTop:"12px",background:"#FFF3CD",borderRadius:"8px",padding:"10px 14px",display:"flex",gap:"8px",alignItems:"center"}}>
              <span style={{fontSize:"16px"}}>⚠️</span>
              <div>
                <div style={{fontSize:"12px",fontWeight:"600",color:"#856404"}}>{requiredDocs.length - uploadedCount} document{requiredDocs.length - uploadedCount !== 1 ? "s" : ""} remaining</div>
                <div style={{fontSize:"11px",color:"#856404"}}>Your listing will show as "Pending Verification" until all documents are uploaded.</div>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedTitles.length === 0 && (
        <div style={{background:"#FFF3CD",borderRadius:"8px",padding:"10px 14px",fontSize:"12px",color:"#856404",border:"1px solid rgba(133,100,4,0.15)"}}>
          ⚠ Select at least one title type to continue. Properties without title documents will not be listed.
        </div>
      )}

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} style={{display:"none"}} />
    </div>
  );
}
