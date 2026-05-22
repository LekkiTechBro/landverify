"use client";
import { useState, useRef, useEffect } from "react";

const API = "http://localhost:8000/api/v1";

const DOC_TYPES = [
  { value:"C_OF_O", label:"Certificate of Occupancy (C of O)" },
  { value:"SURVEY_PLAN", label:"Survey Plan" },
  { value:"DEED", label:"Deed of Assignment" },
  { value:"GOVERNORS_CONSENT", label:"Governor's Consent" },
  { value:"RECEIPT", label:"Payment Receipt" },
  { value:"KYC", label:"Identity Document" },
  { value:"OTHER", label:"Other Document" },
];

interface Document {
  id: string;
  name: string;
  type: string;
  size_bytes: number;
  uploaded_at: string;
  encrypted: boolean;
  property_id?: string;
}

interface ViewerState {
  open: boolean;
  loading: boolean;
  error: string;
  name: string;
  watermark_svg: string;
  watermark_text: string;
  content_base64: string;
  viewed_by: string;
  viewed_at: string;
}

export default function DocumentVault() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [docType, setDocType] = useState("C_OF_O");
  const [docName, setDocName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [viewer, setViewer] = useState<ViewerState>({
    open: false, loading: false, error: "",
    name: "", watermark_svg: "", watermark_text: "",
    content_base64: "", viewed_by: "", viewed_at: "",
  });

  const token = typeof window !== "undefined" ? sessionStorage.getItem("access_token") : "";

  useEffect(() => { loadDocs(); }, []);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/documents/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setDocs(data.documents || []);
    } catch {}
    setLoading(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setUploadError("File must be under 10MB"); return; }
    setSelectedFile(file);
    setUploadError("");
    if (!docName) setDocName(file.name.replace(/\.[^/.]+$/, ""));
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = e => setFilePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !docName) return;
    setUploading(true);
    setUploadError("");
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(",")[1];
        const res = await fetch(`${API}/documents/upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name: docName, type: docType, data_base64: base64 }),
        });
        const data = await res.json();
        if (res.ok) {
          setUploadSuccess(`✓ "${docName}" encrypted and stored securely`);
          setSelectedFile(null); setDocName(""); setFilePreview(null);
          if (fileRef.current) fileRef.current.value = "";
          setTimeout(() => setUploadSuccess(""), 4000);
          await loadDocs();
        } else {
          setUploadError(data.detail || "Upload failed");
        }
        setUploading(false);
      };
      reader.readAsDataURL(selectedFile);
    } catch {
      setUploadError("Cannot connect to server");
      setUploading(false);
    }
  };

  const handleViewDoc = async (docId: string, docName: string) => {
    setViewer({ open: true, loading: true, error: "", name: docName, watermark_svg: "", watermark_text: "", content_base64: "", viewed_by: "", viewed_at: "" });
    try {
      // Get signed URL
      const urlRes = await fetch(`${API}/documents/signed-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ document_id: docId, expires_in: 120 }),
      });
      const urlData = await urlRes.json();
      if (!urlRes.ok) { setViewer(v => ({ ...v, loading: false, error: urlData.detail || "Access denied" })); return; }

      // Fetch document via signed URL
      const viewRes = await fetch(urlData.signed_url);
      const viewData = await viewRes.json();
      if (!viewRes.ok) { setViewer(v => ({ ...v, loading: false, error: viewData.detail || "Link expired" })); return; }

      setViewer({
        open: true, loading: false, error: "",
        name: viewData.name,
        watermark_svg: viewData.watermark_svg,
        watermark_text: viewData.watermark_text,
        content_base64: viewData.content_base64,
        viewed_by: viewData.viewed_by,
        viewed_at: viewData.viewed_at,
      });
    } catch {
      setViewer(v => ({ ...v, loading: false, error: "Failed to load document" }));
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    if (bytes >= 1024) return (bytes / 1024).toFixed(0) + " KB";
    return bytes + " B";
  };

  const inp = { width:"100%", background:"#f8f8f8", border:"1px solid #e8e8e8", borderRadius:"8px", padding:"10px 12px", fontSize:"13px", color:"#333", outline:"none", boxSizing:"border-box" as const };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>

      {/* Vault header */}
      <div style={{background:"linear-gradient(135deg,#0A5C3F,#1D9E75)",borderRadius:"12px",padding:"20px",color:"white",display:"flex",gap:"16px",alignItems:"center"}}>
        <div style={{width:"48px",height:"48px",background:"rgba(255,255,255,0.15)",borderRadius:"10px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"24px",flexShrink:0}}>🔐</div>
        <div>
          <div style={{fontSize:"16px",fontWeight:"600",marginBottom:"4px"}}>Encrypted Document Vault</div>
          <div style={{fontSize:"12px",color:"rgba(255,255,255,0.75)"}}>AES-256-GCM encryption · Time-limited access · Identity watermarking · Full audit trail</div>
        </div>
        <div style={{marginLeft:"auto",textAlign:"right",flexShrink:0}}>
          <div style={{fontSize:"22px",fontWeight:"700"}}>{docs.length}</div>
          <div style={{fontSize:"11px",color:"rgba(255,255,255,0.7)"}}>Documents</div>
        </div>
      </div>

      {/* Security badges */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"10px"}}>
        {[
          { icon:"🔒", label:"AES-256-GCM", desc:"Military-grade encryption" },
          { icon:"⏱", label:"Signed URLs", desc:"Links expire in 120s" },
          { icon:"👁", label:"Watermarked", desc:"Your identity embedded" },
          { icon:"📋", label:"Audit Log", desc:"Every view recorded" },
        ].map(b => (
          <div key={b.label} style={{background:"white",borderRadius:"10px",padding:"12px",border:"1px solid #eee",textAlign:"center"}}>
            <div style={{fontSize:"20px",marginBottom:"4px"}}>{b.icon}</div>
            <div style={{fontSize:"12px",fontWeight:"600",color:"#333",marginBottom:"2px"}}>{b.label}</div>
            <div style={{fontSize:"11px",color:"#888"}}>{b.desc}</div>
          </div>
        ))}
      </div>

      {/* Upload section */}
      <div style={{background:"white",borderRadius:"12px",padding:"20px",border:"1px solid #eee"}}>
        <h3 style={{fontSize:"14px",fontWeight:"600",color:"#333",marginBottom:"14px"}}>Upload Document</h3>

        {uploadSuccess && (
          <div style={{background:"#E1F5EE",border:"1px solid rgba(10,92,63,0.2)",borderRadius:"8px",padding:"10px 14px",marginBottom:"12px",fontSize:"13px",color:"#0A5C3F"}}>
            {uploadSuccess}
          </div>
        )}
        {uploadError && (
          <div style={{background:"#FDECEA",border:"1px solid rgba(198,40,40,0.2)",borderRadius:"8px",padding:"10px 14px",marginBottom:"12px",fontSize:"13px",color:"#C62828"}}>
            ⚠ {uploadError}
          </div>
        )}

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"12px"}}>
          <div>
            <label style={{fontSize:"12px",fontWeight:"500",color:"#555",display:"block",marginBottom:"6px"}}>Document Name</label>
            <input type="text" placeholder="e.g. Title Deed - Lekki Plot" value={docName}
              onChange={e => setDocName(e.target.value)} style={inp} />
          </div>
          <div>
            <label style={{fontSize:"12px",fontWeight:"500",color:"#555",display:"block",marginBottom:"6px"}}>Document Type</label>
            <select value={docType} onChange={e => setDocType(e.target.value)} style={inp}>
              {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        {/* File drop zone */}
        <div onClick={() => fileRef.current?.click()}
          style={{border:"2px dashed "+(selectedFile?"#0A5C3F":"#e8e8e8"),borderRadius:"10px",padding:"0",cursor:"pointer",background:"#f8f8f8",marginBottom:"12px",overflow:"hidden",minHeight:"120px",display:"flex",alignItems:"center",justifyContent:"center"}}>
          {filePreview ? (
            <div style={{width:"100%",position:"relative"}}>
              <img src={filePreview} alt="Preview" style={{width:"100%",maxHeight:"180px",objectFit:"cover",display:"block"}} />
              <div style={{position:"absolute",bottom:"8px",left:"8px",background:"rgba(10,92,63,0.8)",borderRadius:"6px",padding:"4px 10px",fontSize:"12px",color:"white"}}>
                ✓ {selectedFile?.name}
              </div>
            </div>
          ) : selectedFile ? (
            <div style={{textAlign:"center",padding:"24px"}}>
              <div style={{fontSize:"36px",marginBottom:"8px"}}>📄</div>
              <div style={{fontSize:"13px",fontWeight:"500",color:"#0A5C3F"}}>{selectedFile.name}</div>
              <div style={{fontSize:"12px",color:"#888"}}>{formatSize(selectedFile.size)}</div>
            </div>
          ) : (
            <div style={{textAlign:"center",padding:"24px"}}>
              <div style={{fontSize:"36px",marginBottom:"8px"}}>📎</div>
              <div style={{fontSize:"14px",fontWeight:"500",color:"#555",marginBottom:"4px"}}>Click to upload document</div>
              <div style={{fontSize:"12px",color:"#aaa"}}>PDF, JPG, PNG up to 10MB · Will be encrypted immediately</div>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleFileSelect} style={{display:"none"}} />

        <button onClick={handleUpload} disabled={!selectedFile || !docName || uploading}
          style={{width:"100%",background:(!selectedFile||!docName||uploading)?"#ccc":"#0A5C3F",color:"white",border:"none",borderRadius:"8px",padding:"12px",fontSize:"14px",fontWeight:"500",cursor:(!selectedFile||!docName||uploading)?"not-allowed":"pointer"}}>
          {uploading ? "🔐 Encrypting and storing..." : "🔒 Encrypt & Upload"}
        </button>
      </div>

      {/* Documents list */}
      <div style={{background:"white",borderRadius:"12px",padding:"20px",border:"1px solid #eee"}}>
        <h3 style={{fontSize:"14px",fontWeight:"600",color:"#333",marginBottom:"14px"}}>My Encrypted Documents</h3>

        {loading ? (
          <div style={{textAlign:"center",padding:"20px",color:"#888"}}>Loading...</div>
        ) : docs.length === 0 ? (
          <div style={{textAlign:"center",padding:"30px",color:"#888"}}>
            <div style={{fontSize:"36px",marginBottom:"8px"}}>🔐</div>
            <p style={{fontSize:"13px"}}>No documents uploaded yet. Upload your first document above.</p>
          </div>
        ) : docs.map(doc => (
          <div key={doc.id} style={{display:"flex",alignItems:"center",gap:"12px",padding:"12px",background:"#f8f8f8",borderRadius:"8px",marginBottom:"8px",border:"1px solid #eee"}}>
            <div style={{width:"40px",height:"40px",borderRadius:"8px",background:"#E1F5EE",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",flexShrink:0}}>
              {doc.type === "C_OF_O" ? "📜" : doc.type === "SURVEY_PLAN" ? "🗺" : doc.type === "KYC" ? "🪪" : "📄"}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:"13px",fontWeight:"500",color:"#333",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{doc.name}</div>
              <div style={{fontSize:"11px",color:"#888"}}>
                {DOC_TYPES.find(t=>t.value===doc.type)?.label || doc.type} · {formatSize(doc.size_bytes)} · {new Date(doc.uploaded_at).toLocaleDateString()}
              </div>
            </div>
            <div style={{display:"flex",gap:"6px",alignItems:"center",flexShrink:0}}>
              <span style={{fontSize:"10px",background:"#E1F5EE",color:"#0A5C3F",borderRadius:"4px",padding:"2px 7px"}}>🔒 Encrypted</span>
              <button onClick={() => handleViewDoc(doc.id, doc.name)}
                style={{background:"#0A5C3F",color:"white",border:"none",borderRadius:"6px",padding:"6px 12px",fontSize:"12px",cursor:"pointer"}}>
                Secure View
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Document viewer modal */}
      {viewer.open && (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
          <div style={{background:"white",borderRadius:"16px",width:"100%",maxWidth:"700px",maxHeight:"90vh",overflow:"hidden",display:"flex",flexDirection:"column"}}>

            {/* Modal header */}
            <div style={{padding:"16px 20px",borderBottom:"1px solid #eee",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
              <div>
                <div style={{fontSize:"14px",fontWeight:"600",color:"#333"}}>{viewer.name}</div>
                {viewer.viewed_by && <div style={{fontSize:"11px",color:"#0A5C3F"}}>🔒 Watermarked · Expires in 120s</div>}
              </div>
              <button onClick={() => setViewer(v=>({...v,open:false}))}
                style={{background:"#f0f0f0",border:"none",borderRadius:"6px",padding:"6px 12px",fontSize:"13px",cursor:"pointer"}}>
                ✕ Close
              </button>
            </div>

            {/* Modal body */}
            <div style={{flex:1,overflow:"auto",padding:"20px"}}>
              {viewer.loading && (
                <div style={{textAlign:"center",padding:"40px",color:"#888"}}>
                  <div style={{fontSize:"32px",marginBottom:"12px"}}>🔐</div>
                  <div>Decrypting document and applying watermark...</div>
                </div>
              )}
              {viewer.error && (
                <div style={{background:"#FDECEA",borderRadius:"10px",padding:"20px",textAlign:"center"}}>
                  <div style={{fontSize:"28px",marginBottom:"8px"}}>⛔</div>
                  <div style={{fontSize:"14px",fontWeight:"500",color:"#C62828",marginBottom:"4px"}}>Access Denied</div>
                  <div style={{fontSize:"13px",color:"#C62828"}}>{viewer.error}</div>
                </div>
              )}
              {!viewer.loading && !viewer.error && viewer.content_base64 && (
                <div>
                  {/* Watermark notice */}
                  <div style={{background:"#FFF3CD",border:"1px solid rgba(133,100,4,0.2)",borderRadius:"8px",padding:"10px 14px",marginBottom:"16px",fontSize:"12px",color:"#856404"}}>
                    ⚠ <strong>This document is watermarked with your identity.</strong> Any screenshots or shares are traceable back to you.
                  </div>

                  {/* Watermark text */}
                  <div style={{background:"#f8f8f8",borderRadius:"6px",padding:"8px 12px",marginBottom:"12px",fontSize:"11px",color:"#888",fontFamily:"monospace",wordBreak:"break-all"}}>
                    {viewer.watermark_text}
                  </div>

                  {/* Document with watermark overlay */}
                  <div style={{position:"relative",border:"1px solid #eee",borderRadius:"8px",overflow:"hidden",minHeight:"300px",background:"#fafafa",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {/* Check if it's an image */}
                    {viewer.content_base64.startsWith("/9j/") || viewer.content_base64.startsWith("iVBOR") ? (
                      <img
                        src={`data:image/jpeg;base64,${viewer.content_base64}`}
                        alt={viewer.name}
                        style={{maxWidth:"100%",display:"block"}}
                      />
                    ) : (
                      <div style={{textAlign:"center",padding:"40px",color:"#888"}}>
                        <div style={{fontSize:"48px",marginBottom:"12px"}}>📄</div>
                        <div style={{fontSize:"14px",fontWeight:"500",color:"#333",marginBottom:"8px"}}>{viewer.name}</div>
                        <div style={{fontSize:"12px",color:"#888",marginBottom:"16px"}}>Document decrypted successfully</div>
                        <div style={{background:"#E1F5EE",borderRadius:"6px",padding:"8px 14px",display:"inline-block",fontSize:"12px",color:"#0A5C3F"}}>
                          ✓ AES-256-GCM decryption successful
                        </div>
                      </div>
                    )}
                    {/* SVG watermark overlay */}
                    <div
                      style={{position:"absolute",top:0,left:0,right:0,bottom:0,pointerEvents:"none"}}
                      dangerouslySetInnerHTML={{ __html: viewer.watermark_svg }}
                    />
                  </div>

                  <div style={{marginTop:"12px",fontSize:"11px",color:"#aaa",textAlign:"center"}}>
                    Viewed by {viewer.viewed_by} · {new Date(viewer.viewed_at).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

