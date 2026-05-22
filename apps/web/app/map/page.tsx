"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const PROPERTIES = [
  { id:"1", title:"3 Bedroom Flat, Lekki Phase 1", price:45000000, type:"Flat", state:"Lagos", lga:"Eti-Osa", area:"Lekki Phase 1", risk:"low", verified:true, lat:6.4281, lng:3.4219, bedrooms:3 },
  { id:"2", title:"4 Bedroom House, Maitama", price:120000000, type:"Detached House", state:"Abuja (FCT)", lga:"Municipal Area Council", area:"Maitama", risk:"low", verified:true, lat:9.0820, lng:7.4891, bedrooms:4 },
  { id:"3", title:"2 Bedroom Flat, GRA Port Harcourt", price:25000000, type:"Flat", state:"Rivers", lga:"Port Harcourt", area:"GRA", risk:"medium", verified:true, lat:4.8156, lng:7.0498, bedrooms:2 },
  { id:"4", title:"Land, Ibeju-Lekki", price:8000000, type:"Land", state:"Lagos", lga:"Ibeju-Lekki", area:"Eleko", risk:"low", verified:false, lat:6.4698, lng:3.8553, bedrooms:0 },
  { id:"5", title:"3 Bedroom Bungalow, Ibadan", price:18000000, type:"Bungalow", state:"Oyo", lga:"Ibadan North", area:"Bodija", risk:"medium", verified:true, lat:7.3775, lng:3.9470, bedrooms:3 },
  { id:"6", title:"5 Bedroom Duplex, Asokoro", price:250000000, type:"Duplex", state:"Abuja (FCT)", lga:"Municipal Area Council", area:"Asokoro", risk:"low", verified:true, lat:9.0419, lng:7.5114, bedrooms:5 },
  { id:"7", title:"2 Bedroom Flat, Surulere", price:22000000, type:"Flat", state:"Lagos", lga:"Surulere", area:"Surulere", risk:"medium", verified:true, lat:6.5059, lng:3.3586, bedrooms:2 },
  { id:"8", title:"4 Bedroom Duplex, Magodo", price:85000000, type:"Duplex", state:"Lagos", lga:"Kosofe", area:"Magodo", risk:"low", verified:true, lat:6.6018, lng:3.3876, bedrooms:4 },
  { id:"9", title:"Land, Epe", price:5000000, type:"Land", state:"Lagos", lga:"Epe", area:"Epe", risk:"low", verified:false, lat:6.5833, lng:3.9833, bedrooms:0 },
  { id:"10", title:"3 Bedroom Flat, Enugu GRA", price:30000000, type:"Flat", state:"Enugu", lga:"Enugu East", area:"GRA", risk:"low", verified:true, lat:6.4584, lng:7.5464, bedrooms:3 },
  { id:"11", title:"Commercial Space, Kano", price:55000000, type:"Commercial", state:"Kano", lga:"Kano Municipal", area:"Sabon Gari", risk:"medium", verified:false, lat:12.0022, lng:8.5920, bedrooms:0 },
  { id:"12", title:"3 Bedroom Bungalow, Benin City", price:20000000, type:"Bungalow", state:"Edo", lga:"Oredo", area:"GRA", risk:"low", verified:true, lat:6.3350, lng:5.6037, bedrooms:3 },
];

const RISK_COLORS: Record<string, string> = {
  low: "#0A5C3F",
  medium: "#856404",
  high: "#C62828",
};

const TYPE_ICONS: Record<string, string> = {
  "Flat": "", "Detached House": "", "Land": "",
  "Bungalow": "", "Duplex": "", "Commercial": "",
  "Semi-Detached": "", "Terraced": "",
};

function formatPrice(p: number) {
  if (p >= 1000000000) return "" + (p/1000000000).toFixed(1) + "B";
  if (p >= 1000000) return "" + (p/1000000).toFixed(1) + "M";
  return "" + p.toLocaleString();
}

export default function MapPage() {
  const router = useRouter();
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);
  const [selectedProp, setSelectedProp] = useState<any>(null);
  const [filterType, setFilterType] = useState("");
  const [filterRisk, setFilterRisk] = useState("");
  const [filterVerified, setFilterVerified] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  const filtered = PROPERTIES.filter(p => {
    if (filterType && p.type !== filterType) return false;
    if (filterRisk && p.risk !== filterRisk) return false;
    if (filterVerified && !p.verified) return false;
    return true;
  });

  useEffect(() => {
    if (mapRef.current) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      const L = (window as any).L;
      if (!mapContainerRef.current || mapRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [9.0820, 8.6753],
        zoom: 6,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      mapRef.current = map;
      setMapLoaded(true);
    };
    document.head.appendChild(script);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const L = (window as any).L;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    filtered.forEach(prop => {
      const color = RISK_COLORS[prop.risk] || "#0A5C3F";
      const icon = TYPE_ICONS[prop.type] || "";

      const markerHtml = `
        <div style="
          background:${color};
          color:white;
          border-radius:20px;
          padding:4px 10px;
          font-size:12px;
          font-weight:600;
          font-family:system-ui,sans-serif;
          white-space:nowrap;
          box-shadow:0 2px 8px rgba(0,0,0,0.25);
          border:2px solid white;
          display:flex;
          align-items:center;
          gap:4px;
          cursor:pointer;
        ">
          ${icon} ${formatPrice(prop.price)}
          ${prop.verified ? '<span style="font-size:10px"></span>' : ''}
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: "",
        iconAnchor: [40, 20],
      });

      const marker = L.marker([prop.lat, prop.lng], { icon: customIcon })
        .addTo(mapRef.current)
        .on("click", () => setSelectedProp(prop));

      markersRef.current.push(marker);
    });
  }, [mapLoaded, filtered.length, filterType, filterRisk, filterVerified]);

  return (
    <div style={{fontFamily:"system-ui,sans-serif",height:"100vh",display:"flex",flexDirection:"column",background:"#f5f5f5"}}>

      {/* Header */}
      <div style={{background:"#0A5C3F",padding:"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,zIndex:10}}>
        <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
          <span onClick={() => router.push("/")} style={{color:"rgba(255,255,255,0.7)",fontSize:"20px",cursor:"pointer"}}></span>
          <span onClick={() => router.push("/")} style={{color:"white",fontSize:"18px",fontWeight:"600",cursor:"pointer"}}>
            Land<span style={{color:"#FAC775"}}>Verify</span>
          </span>
          <span style={{color:"rgba(255,255,255,0.5)",fontSize:"13px"}}>/ Map View</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <span style={{fontSize:"12px",color:"rgba(255,255,255,0.7)"}}>{filtered.length} properties</span>
          <button onClick={() => router.push("/search")}
            style={{background:"rgba(255,255,255,0.15)",color:"white",border:"none",borderRadius:"6px",padding:"6px 12px",fontSize:"12px",cursor:"pointer"}}>
            List View 
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div style={{background:"white",borderBottom:"1px solid #eee",padding:"10px 20px",display:"flex",gap:"10px",alignItems:"center",flexShrink:0,flexWrap:"wrap"}}>
        <span style={{fontSize:"12px",color:"#888",fontWeight:"500"}}>Filter:</span>

        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          style={{background:"#f8f8f8",border:"1px solid #e8e8e8",borderRadius:"6px",padding:"6px 10px",fontSize:"12px",color:"#333",outline:"none"}}>
          <option value="">All Types</option>
          {["Flat","Detached House","Land","Bungalow","Duplex","Commercial"].map(t => <option key={t}>{t}</option>)}
        </select>

        <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)}
          style={{background:"#f8f8f8",border:"1px solid #e8e8e8",borderRadius:"6px",padding:"6px 10px",fontSize:"12px",color:"#333",outline:"none"}}>
          <option value="">All Risk Levels</option>
          <option value="low">Low Risk</option>
          <option value="medium">Medium Risk</option>
          <option value="high">High Risk</option>
        </select>

        <div onClick={() => setFilterVerified(!filterVerified)}
          style={{display:"flex",alignItems:"center",gap:"6px",cursor:"pointer",background:filterVerified?"#E1F5EE":"#f8f8f8",border:"1px solid "+(filterVerified?"rgba(10,92,63,0.3)":"#e8e8e8"),borderRadius:"6px",padding:"6px 10px"}}>
          <div style={{width:"28px",height:"16px",background:filterVerified?"#1D9E75":"#ccc",borderRadius:"8px",position:"relative",flexShrink:0}}>
            <div style={{width:"12px",height:"12px",background:"white",borderRadius:"50%",position:"absolute",top:"2px",left:filterVerified?"14px":"2px",transition:"left 0.2s"}}></div>
          </div>
          <span style={{fontSize:"12px",color:filterVerified?"#0A5C3F":"#555",fontWeight:filterVerified?"500":"400"}}>Verified only</span>
        </div>

        {(filterType || filterRisk || filterVerified) && (
          <button onClick={() => { setFilterType(""); setFilterRisk(""); setFilterVerified(false); }}
            style={{background:"none",border:"none",color:"#C62828",fontSize:"12px",cursor:"pointer",textDecoration:"underline"}}>
            Clear filters
          </button>
        )}

        {/* Legend */}
        <div style={{marginLeft:"auto",display:"flex",gap:"12px",alignItems:"center"}}>
          {[["#0A5C3F","Low Risk"],["#856404","Medium Risk"],["#C62828","High Risk"]].map(([color,label]) => (
            <div key={label} style={{display:"flex",alignItems:"center",gap:"4px"}}>
              <div style={{width:"10px",height:"10px",borderRadius:"50%",background:color}}></div>
              <span style={{fontSize:"11px",color:"#888"}}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Map + sidebar */}
      <div style={{flex:1,position:"relative",display:"flex",overflow:"hidden"}}>

        {/* Map */}
        <div ref={mapContainerRef} style={{flex:1,height:"100%"}} />

        {/* Loading overlay */}
        {!mapLoaded && (
          <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:"#e8ede8",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"12px"}}>
            <div style={{fontSize:"48px"}}></div>
            <div style={{fontSize:"14px",color:"#555"}}>Loading Nigeria map...</div>
          </div>
        )}

        {/* Property detail card */}
        {selectedProp && (
          <div style={{position:"absolute",bottom:"20px",left:"50%",transform:"translateX(-50%)",background:"white",borderRadius:"14px",padding:"16px",boxShadow:"0 8px 30px rgba(0,0,0,0.15)",width:"340px",zIndex:1000,border:"1px solid #eee"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"10px"}}>
              <div style={{flex:1,paddingRight:"8px"}}>
                <h3 style={{fontSize:"14px",fontWeight:"600",color:"#222",margin:"0 0 4px"}}>{selectedProp.title}</h3>
                <p style={{fontSize:"12px",color:"#888",margin:0}}> {selectedProp.area}, {selectedProp.lga}, {selectedProp.state}</p>
              </div>
              <button onClick={() => setSelectedProp(null)}
                style={{background:"#f0f0f0",border:"none",borderRadius:"6px",width:"28px",height:"28px",cursor:"pointer",fontSize:"14px",flexShrink:0}}>
                
              </button>
            </div>

            <div style={{display:"flex",gap:"8px",marginBottom:"12px",flexWrap:"wrap"}}>
              {selectedProp.verified && <span style={{fontSize:"10px",background:"#E1F5EE",color:"#0A5C3F",borderRadius:"4px",padding:"2px 7px",fontWeight:"500"}}> Verified</span>}
              <span style={{fontSize:"10px",background:selectedProp.risk==="low"?"#E1F5EE":selectedProp.risk==="medium"?"#FFF3CD":"#FDECEA",color:RISK_COLORS[selectedProp.risk],borderRadius:"4px",padding:"2px 7px",fontWeight:"500",textTransform:"capitalize"}}>{selectedProp.risk} risk</span>
              <span style={{fontSize:"10px",background:"#f0f0f0",color:"#555",borderRadius:"4px",padding:"2px 7px"}}>{selectedProp.type}</span>
              {selectedProp.bedrooms > 0 && <span style={{fontSize:"10px",background:"#f0f0f0",color:"#555",borderRadius:"4px",padding:"2px 7px"}}> {selectedProp.bedrooms} bed</span>}
            </div>

            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:"22px",fontWeight:"700",color:"#0A5C3F"}}>{formatPrice(selectedProp.price)}</span>
              <div style={{display:"flex",gap:"8px"}}>
                <button style={{background:"#f0f0f0",color:"#555",border:"none",borderRadius:"8px",padding:"8px 12px",fontSize:"12px",cursor:"pointer"}}>Save</button>
                <button onClick={() => router.push(`/property/${selectedProp.id}`)}
                  style={{background:"#0A5C3F",color:"white",border:"none",borderRadius:"8px",padding:"8px 16px",fontSize:"12px",fontWeight:"500",cursor:"pointer"}}>
                  View 
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
