"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import TitleDocumentSelector from "./TitleDocumentSelector";

const API = "https://landverify-production.up.railway.app/api/v1";

const SUBSCRIPTION_PLANS = [
  { key:"free", name:"Free", price:0, monthly:"N0/mo", listing_limit:10, features:["10 listings max","Basic badge","Email support","Standard search placement"], color:"#555", bg:"#f0f0f0" },
  { key:"professional", name:"Professional", price:1500000, monthly:"N15,000/mo", listing_limit:999, features:["Unlimited listings","Verified badge","Priority search","Chat support","Analytics dashboard"], color:"#0A5C3F", bg:"#E1F5EE" },
  { key:"premium", name:"Premium", price:3500000, monthly:"N35,000/mo", listing_limit:999, features:["Everything in Pro","Featured listings","Top of search results","Dedicated manager","Custom branding"], color:"#412402", bg:"#FFF3CD" },
];

const PROPERTY_COLORS: Record<string,string> = {
  "Flat":"linear-gradient(135deg,#0A5C3F,#1D9E75)",
  "Detached House":"linear-gradient(135deg,#1a4a6b,#2d7dd2)",
  "Semi-Detached":"linear-gradient(135deg,#2d4a22,#5a8a3c)",
  "Land":"linear-gradient(135deg,#6b4c1a,#c4892a)",
  "Bungalow":"linear-gradient(135deg,#4a1a6b,#8a3cc4)",
  "Duplex":"linear-gradient(135deg,#6b1a2d,#c43c5a)",
  "Commercial":"linear-gradient(135deg,#1a3a6b,#2d5dd2)",
  "Terraced":"linear-gradient(135deg,#2d3a22,#5a6a3c)",
};

const STATUS_STYLE: Record<string,{bg:string,color:string,label:string}> = {
  available:{bg:"#E1F5EE",color:"#0A5C3F",label:"Available"},
  under_offer:{bg:"#FFF3CD",color:"#856404",label:"Under Offer"},
  sold:{bg:"#FDECEA",color:"#C62828",label:"Sold"},
  suspended:{bg:"#f0f0f0",color:"#888",label:"Suspended"},
};

function formatPrice(p:number){if(p>=1000000)return"N"+(p/1000000).toFixed(1)+"M";return"N"+p.toLocaleString();}
function formatDate(d:string){try{return new Date(d).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"});}catch{return d;}}

function LiveCounter({value,suffix="",pulsing=true}:{value:number,suffix?:string,pulsing?:boolean}){
  const [display,setDisplay]=useState(value);
  const [pulse,setPulse]=useState(false);
  useEffect(()=>{
    if(!pulsing)return;
    const t=setInterval(()=>{
      setDisplay(n=>n+1);
      setPulse(true);
      setTimeout(()=>setPulse(false),500);
    },Math.random()*20000+15000);
    return()=>clearInterval(t);
  },[pulsing]);
  return(
    <span style={{position:"relative",fontVariantNumeric:"tabular-nums"}}>
      {display.toLocaleString()}{suffix}
      {pulse&&<span style={{position:"absolute",top:"-4px",right:"-8px",width:"6px",height:"6px",borderRadius:"50%",background:"#1D9E75",animation:"fadeOut 0.5s ease forwards"}}/>}
    </span>
  );
}

function PropertyThumb({type,image}:{type:string,image:string|null}){
  const grad=PROPERTY_COLORS[type]||PROPERTY_COLORS["Flat"];
  if(image)return<div style={{minHeight:"100px",overflow:"hidden"}}><img src={image} alt={type} style={{width:"100%",height:"100px",objectFit:"cover"}}/></div>;
  return(
    <div style={{background:grad,display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100px",flexDirection:"column",gap:"4px"}}>
      <span style={{fontSize:"9px",color:"rgba(255,255,255,0.7)",textTransform:"uppercase",letterSpacing:"1px",fontWeight:"600"}}>{type}</span>
    </div>
  );
}

const TABS=["Overview","My Listings","Add Property","CRM","Messages","Profile"];

export default function AgentDashboard(){
  const router=useRouter();
  const [activeTab,setActiveTab]=useState("Overview");
  const [listings,setListings]=useState<any[]>([]);
  const [loadingListings,setLoadingListings]=useState(true);
  const [showSuccess,setShowSuccess]=useState(false);
  const [agent,setAgent]=useState({name:"",initials:"",email:"",phone:"",kyc_status:"pending",subscription:"free",states_covered:[] as string[]});
  const [submitting,setSubmitting]=useState(false);
  const [formErrors,setFormErrors]=useState<Record<string,string>>({});
  const [uploadedImages,setUploadedImages]=useState<string[]>([]);
  const [titleDocs,setTitleDocs]=useState<any>({});
  const [selectedTitles,setSelectedTitles]=useState<string[]>([]);
  const [profileImage,setProfileImage]=useState<string|null>(null);
  const [selectedPlan,setSelectedPlan]=useState<string|null>(null);
  const [editingProfile,setEditingProfile]=useState(false);
  const [profileForm,setProfileForm]=useState({name:"",email:"",phone:"",bio:"",states_covered:[] as string[]});
  const [responseRate,setResponseRate]=useState(98);
  const fileInputRef=useRef<HTMLInputElement>(null);
  const profileImageRef=useRef<HTMLInputElement>(null);

  const [newProperty,setNewProperty]=useState({
    title:"",state:"Lagos",lga:"",area:"",city:"",type:"Flat",
    purpose:"sale",price:"",bedrooms:"",bathrooms:"",
    size_sqm:"",title_type:"C_OF_O",description:"",
  });

  useEffect(()=>{
    const token=sessionStorage.getItem("access_token");
    if(!token){router.push("/auth/login");return;}
    fetch(`${API}/auth/me`,{headers:{Authorization:`Bearer ${token}`}})
      .then(r=>r.json())
      .then(data=>{
        if(data.full_name){
          setProfileForm(p=>({...p,name:data.full_name,email:data.email||"",phone:data.phone||""}));
          setAgent(prev=>({
            ...prev,name:data.full_name,
            initials:data.full_name.split(" ").filter(Boolean).map((n:string)=>n[0]).join("").toUpperCase().slice(0,2),
            email:data.email||"",phone:data.phone||"",
            kyc_status:data.kyc_status||"pending",
          }));
        }
      }).catch(()=>{});
    fetch(`${API}/properties/my`,{headers:{Authorization:`Bearer ${token}`}})
      .then(r=>r.json())
      .then(data=>{setListings(Array.isArray(data)&&data.length>0?data:[]);})
      .catch(()=>setListings([]))
      .finally(()=>setLoadingListings(false));
  },[]);

  useEffect(()=>{
    const t=setInterval(()=>{
      setResponseRate(r=>Math.min(100,Math.max(60,r+(Math.random()>0.3?1:-1))));
    },30000);
    return()=>clearInterval(t);
  },[]);

  const getResponseRateColor=()=>responseRate>=90?"#0A5C3F":responseRate>=75?"#856404":"#C62828";
  const getResponseRateLabel=()=>responseRate>=90?"Excellent":responseRate>=75?"Good":"Needs Improvement";

  const currentPlan=SUBSCRIPTION_PLANS.find(p=>p.key===agent.subscription)||SUBSCRIPTION_PLANS[0];
  const listingLimit=currentPlan.listing_limit;
  const canAddListing=listings.length<listingLimit;
  const updateProp=(field:string,value:string)=>setNewProperty(prev=>({...prev,[field]:value}));

  const validateForm=()=>{
    const errors:Record<string,string>={};
    if(!newProperty.title.trim())errors.title="Property title is required";
    if(!newProperty.state)errors.state="State is required";
    if(!newProperty.lga.trim())errors.lga="LGA is required";
    if(!newProperty.city.trim())errors.city="City is required";
    if(!newProperty.area.trim())errors.area="Area / Neighbourhood is required";
    if(!newProperty.purpose)errors.purpose="Select For Sale or Rent";
    if(!newProperty.price||parseInt(newProperty.price)<=0)errors.price="Valid price is required";
    if(selectedTitles.length===0)errors.title_type="Select at least one title type";
    if(!newProperty.bedrooms&&newProperty.type!=="Land"&&newProperty.type!=="Commercial")errors.bedrooms="Number of bedrooms is required";
    if(!newProperty.bathrooms&&newProperty.type!=="Land"&&newProperty.type!=="Commercial")errors.bathrooms="Number of bathrooms is required";
    if(!newProperty.size_sqm||parseFloat(newProperty.size_sqm)<=0)errors.size_sqm="Property size is required";
    if(!newProperty.description.trim()||newProperty.description.trim().length<20)errors.description="Description must be at least 20 characters";
    if(uploadedImages.length===0)errors.photos="Upload at least 1 property photo";
    if(Object.keys(titleDocs).length===0)errors.docs="Upload at least one title document";
    return errors;
  };

  const handleAddProperty=async()=>{
    if(!canAddListing){alert(`You've reached your ${listingLimit} listing limit. Upgrade to add more.`);setActiveTab("Profile");return;}
    const errors=validateForm();
    setFormErrors(errors);
    if(Object.keys(errors).length>0){document.querySelector('[data-error="true"]')?.scrollIntoView({behavior:"smooth",block:"center"});return;}
    setSubmitting(true);
    const token=sessionStorage.getItem("access_token");
    try{
      const res=await fetch(`${API}/properties`,{
        method:"POST",
        headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},
        body:JSON.stringify({
          title:newProperty.title,state:newProperty.state,lga:newProperty.lga,
          area:newProperty.area||"",type:newProperty.type,purpose:newProperty.purpose,
          price:parseInt(newProperty.price),title_type:newProperty.title_type||selectedTitles[0],
          description:newProperty.description||"",price_negotiable:true,
          bedrooms:newProperty.bedrooms?parseInt(newProperty.bedrooms):null,
          bathrooms:newProperty.bathrooms?parseInt(newProperty.bathrooms):null,
          size_sqm:newProperty.size_sqm?parseFloat(newProperty.size_sqm):null,
        }),
      });
      const data=await res.json();
      if(res.ok){
        setListings(prev=>[{...data,image:uploadedImages[0]||null,city:newProperty.city,verification_status:"pending_verification"},...prev]);
        setNewProperty({title:"",state:"Lagos",lga:"",area:"",city:"",type:"Flat",purpose:"sale",price:"",bedrooms:"",bathrooms:"",size_sqm:"",title_type:"C_OF_O",description:""});
        setUploadedImages([]);setTitleDocs({});setSelectedTitles([]);setFormErrors({});
        setShowSuccess(true);setActiveTab("My Listings");
        setTimeout(()=>setShowSuccess(false),5000);
      }else{alert(data.detail||"Failed to list property.");}
    }catch{alert("Cannot connect to server.");}
    finally{setSubmitting(false);}
  };

  const handleRemoveListing=async(id:string)=>{
    if(!confirm("Remove this listing? This cannot be undone."))return;
    const token=sessionStorage.getItem("access_token");
    try{await fetch(`${API}/properties/${id}`,{method:"DELETE",headers:{Authorization:`Bearer ${token}`}});}catch{}
    setListings(prev=>prev.filter(l=>l.id!==id));
  };

  const handleSubscribe=async(plan:typeof SUBSCRIPTION_PLANS[0])=>{
    if(plan.key==="free"){setSelectedPlan("free");return;}
    setSelectedPlan(plan.key);
    const token=sessionStorage.getItem("access_token");
    if(!token){alert("Please sign in to upgrade your plan.");return;}
    const loadPaystack=():Promise<void>=>new Promise((resolve)=>{
      if((window as any).PaystackPop){resolve();return;}
      const script=document.createElement("script");
      script.src="https://js.paystack.co/v1/inline.js";
      script.onload=()=>resolve();
      document.head.appendChild(script);
    });
    try{
      const me=await fetch(`${API}/auth/me`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json());
      if(!me.email){alert("Could not load your account.");return;}
      await loadPaystack();
      (window as any).PaystackPop.setup({
        key:"pk_test_5644a321b126bc1f8946c05f84548fa631428603",
        email:me.email,amount:plan.price,currency:"NGN",
        ref:`LV-SUB-${plan.key.toUpperCase()}-${Date.now()}`,
        channels:["card","bank","ussd","mobile_money","bank_transfer"],
        onSuccess:(response:any)=>{
          setAgent(prev=>({...prev,subscription:plan.key}));
          alert(`Payment successful! Reference: ${response.reference}. Your ${plan.name} plan is now active.`);
        },
        onCancel:()=>{},
      }).openIframe();
    }catch{alert("Could not load payment. Please try again.");}
  };

  const handleProfileImageSelect=(e:React.ChangeEvent<HTMLInputElement>)=>{
    const file=e.target.files?.[0];
    if(!file)return;
    if(file.size>5*1024*1024){alert("Image must be under 5MB");return;}
    const reader=new FileReader();
    reader.onload=ev=>{setProfileImage(ev.target?.result as string);};
    reader.readAsDataURL(file);
  };

  const totalViews=listings.reduce((a,l)=>a+(l.views||0),0);
  const totalEnquiries=listings.reduce((a,l)=>a+(l.inquiries||0),0);
  const statesCovered=[...new Set(listings.map(l=>l.state).filter(Boolean))];
  const inp={width:"100%",background:"#f8f8f8",border:"1px solid #e8e8e8",borderRadius:"8px",padding:"10px 12px",fontSize:"13px",color:"#333",outline:"none",boxSizing:"border-box" as const};

  return(
    <div style={{fontFamily:"system-ui,sans-serif",minHeight:"100vh",background:"#f5f5f5"}}>
      <style>{`
        @keyframes fadeOut{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(2)}}
        @keyframes verifiedPulse{0%,100%{box-shadow:0 0 0 0 rgba(10,92,63,0.4)}50%{box-shadow:0 0 0 8px rgba(10,92,63,0)}}
        @keyframes pendingBlink{0%,100%{opacity:1}50%{opacity:0.4}}
      `}</style>

      {/* Header */}
      <div style={{background:"#0A5C3F",padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span onClick={()=>router.push("/")} style={{color:"white",fontSize:"18px",fontWeight:"600",cursor:"pointer"}}>
          Land<span style={{color:"#FAC775"}}>Verify</span>
        </span>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <span style={{fontSize:"12px",color:"rgba(255,255,255,0.7)"}}>Agent Dashboard</span>
          <div onClick={()=>setActiveTab("Profile")}
            style={{width:"36px",height:"36px",borderRadius:"50%",overflow:"hidden",cursor:"pointer",border:"2px solid rgba(255,255,255,0.3)",flexShrink:0}}>
            {profileImage
              ?<img src={profileImage} alt="Profile" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
              :<div style={{width:"100%",height:"100%",background:"#E1F5EE",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",fontWeight:"700",color:"#0A5C3F"}}>
                {agent.initials||"AG"}
              </div>
            }
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{background:"white",borderBottom:"1px solid #eee",padding:"0 24px",display:"flex",overflowX:"auto"}}>
        {TABS.map(tab=>(
          <button key={tab} onClick={()=>tab==="Messages"?router.push("/chat"):setActiveTab(tab)}
            style={{padding:"14px 20px",border:"none",background:"none",fontSize:"13px",fontWeight:"500",cursor:"pointer",color:activeTab===tab?"#0A5C3F":"#888",borderBottom:activeTab===tab?"2px solid #0A5C3F":"2px solid transparent",whiteSpace:"nowrap"}}>
            {tab}{tab==="My Listings"?` (${listings.length})`:""}
          </button>
        ))}
      </div>

      <div style={{maxWidth:"1000px",margin:"0 auto",padding:"20px"}}>
        {showSuccess&&(
          <div style={{background:"#E1F5EE",border:"1px solid rgba(10,92,63,0.3)",borderRadius:"10px",padding:"12px 16px",marginBottom:"16px",fontSize:"13px",color:"#0A5C3F"}}>
            Property submitted for verification. It will appear in search once verified (usually within 24 hours).
          </div>
        )}

        {/* OVERVIEW */}
        {activeTab==="Overview"&&(
          <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
            <div style={{background:"white",borderRadius:"12px",padding:"20px",border:"1px solid #eee",display:"flex",gap:"16px",alignItems:"center"}}>
              <div style={{position:"relative",flexShrink:0}} onClick={()=>setActiveTab("Profile")}>
                <div style={{width:"60px",height:"60px",borderRadius:"50%",overflow:"hidden",border:"2px solid #E1F5EE",cursor:"pointer"}}>
                  {profileImage
                    ?<img src={profileImage} alt="Profile" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                    :<div style={{width:"100%",height:"100%",background:"#E1F5EE",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px",fontWeight:"700",color:"#0A5C3F"}}>{agent.initials||"AG"}</div>
                  }
                </div>
                <div style={{position:"absolute",bottom:0,right:0,background:"#0A5C3F",borderRadius:"50%",width:"18px",height:"18px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"9px",cursor:"pointer",border:"2px solid white",color:"white"}}>
                  Edit
                </div>
              </div>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"4px"}}>
                  <h2 style={{fontSize:"18px",fontWeight:"700",color:"#222",margin:0}}>{agent.name||"Your Name"}</h2>
                  {agent.kyc_status==="verified"
                    ?<span style={{fontSize:"11px",fontWeight:"500",background:"#E1F5EE",color:"#0A5C3F",borderRadius:"4px",padding:"2px 8px"}}>KYC Verified</span>
                    :<span style={{fontSize:"11px",fontWeight:"500",background:"#FFF3CD",color:"#856404",borderRadius:"4px",padding:"2px 8px",animation:"pendingBlink 2s infinite"}}>KYC Pending</span>
                  }
                  <span style={{fontSize:"11px",fontWeight:"500",background:"#FAC775",color:"#412402",borderRadius:"4px",padding:"2px 8px",textTransform:"capitalize"}}>{currentPlan.name}</span>
                </div>
                <div style={{fontSize:"13px",color:"#888"}}>{agent.email}{agent.phone?` · ${agent.phone}`:""}</div>
                <div style={{fontSize:"12px",color:"#888",marginTop:"2px"}}>
                  Response Rate: <span style={{color:getResponseRateColor(),fontWeight:"600"}}>{responseRate}% — {getResponseRateLabel()}</span>
                </div>
              </div>
              <button onClick={()=>canAddListing?setActiveTab("Add Property"):setActiveTab("Profile")}
                style={{background:canAddListing?"#0A5C3F":"#ccc",color:"white",border:"none",borderRadius:"8px",padding:"10px 16px",fontSize:"13px",fontWeight:"500",cursor:"pointer",flexShrink:0}}>
                {canAddListing?"+ Add Property":`Limit Reached (${listingLimit})`}
              </button>
            </div>

            {/* Stats */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"12px"}}>
              {[
                {label:"Total Listings",value:listings.length,color:"#0A5C3F",live:false},
                {label:"Total Views",value:totalViews,color:"#1D9E75",live:true},
                {label:"Total Enquiries",value:totalEnquiries,color:"#856404",live:true},
                {label:"Response Rate",value:responseRate,color:getResponseRateColor(),live:false,suffix:"%"},
              ].map(stat=>(
                <div key={stat.label} style={{background:"white",borderRadius:"12px",padding:"16px",border:"1px solid #eee",textAlign:"center",position:"relative"}}>
                  {stat.live&&<div style={{position:"absolute",top:"8px",right:"8px",width:"6px",height:"6px",borderRadius:"50%",background:"#1D9E75",animation:"verifiedPulse 2s infinite"}}/>}
                  <div style={{fontSize:"22px",fontWeight:"700",color:stat.color,margin:"8px 0"}}>
                    {stat.live?<LiveCounter value={stat.value} suffix={stat.suffix||""}/>:<span>{stat.value.toLocaleString()}{stat.suffix||""}</span>}
                  </div>
                  <div style={{fontSize:"11px",color:"#888"}}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Recent listings */}
            <div style={{background:"white",borderRadius:"12px",padding:"20px",border:"1px solid #eee"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
                <h3 style={{fontSize:"14px",fontWeight:"600",color:"#333",margin:0}}>Recent Listings</h3>
                <button onClick={()=>setActiveTab("My Listings")} style={{fontSize:"12px",color:"#0A5C3F",background:"none",border:"none",cursor:"pointer",fontWeight:"500"}}>View all</button>
              </div>
              {loadingListings?(
                <div style={{textAlign:"center",padding:"20px",color:"#888",fontSize:"13px"}}>Loading...</div>
              ):listings.length===0?(
                <div style={{textAlign:"center",padding:"20px",color:"#888",fontSize:"13px"}}>
                  No listings yet. <span onClick={()=>setActiveTab("Add Property")} style={{color:"#0A5C3F",cursor:"pointer",fontWeight:"500"}}>Add your first property</span>
                </div>
              ):listings.slice(0,3).map(l=>(
                <div key={l.id} style={{display:"flex",alignItems:"center",gap:"12px",padding:"10px 0",borderBottom:"1px solid #f5f5f5"}}>
                  <div style={{width:"40px",height:"40px",borderRadius:"8px",overflow:"hidden",flexShrink:0,background:PROPERTY_COLORS[l.type]||PROPERTY_COLORS["Flat"],display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {l.image?<img src={l.image} alt={l.type} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                      :<span style={{fontSize:"9px",color:"rgba(255,255,255,0.8)",fontWeight:"600"}}>{l.type?.slice(0,3)}</span>}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:"13px",fontWeight:"500",color:"#333",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{l.title}</div>
                    <div style={{fontSize:"11px",color:"#888",marginTop:"2px"}}>{l.views||0} views · {l.inquiries||0} enquiries</div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontSize:"13px",fontWeight:"600",color:"#0A5C3F"}}>{formatPrice(l.price)}</div>
                    {l.verification_status==="fully_verified"
                      ?<span style={{fontSize:"10px",fontWeight:"500",background:"#E1F5EE",color:"#0A5C3F",borderRadius:"4px",padding:"2px 6px",display:"inline-block"}}>Verified</span>
                      :<span style={{fontSize:"10px",fontWeight:"500",background:"#FFF3CD",color:"#856404",borderRadius:"4px",padding:"2px 6px",display:"inline-block"}}>Pending</span>
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MY LISTINGS */}
        {activeTab==="My Listings"&&(
          <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <h2 style={{fontSize:"16px",fontWeight:"600",color:"#333",margin:0}}>{listings.length} Properties</h2>
                {agent.subscription==="free"&&(
                  <div style={{fontSize:"12px",color:listings.length>=10?"#C62828":"#888",marginTop:"2px"}}>
                    {listings.length}/10 listings used on Free plan
                    {listings.length>=10&&<span style={{marginLeft:"6px",color:"#C62828",fontWeight:"500"}}>— Limit reached</span>}
                  </div>
                )}
              </div>
              <button onClick={()=>canAddListing?setActiveTab("Add Property"):(alert(`Upgrade your plan to add more listings.`),setActiveTab("Profile"))}
                style={{background:canAddListing?"#0A5C3F":"#aaa",color:"white",border:"none",borderRadius:"8px",padding:"9px 16px",fontSize:"13px",fontWeight:"500",cursor:"pointer"}}>
                {canAddListing?"+ Add New Property":"Upgrade Plan"}
              </button>
            </div>

            {agent.subscription==="free"&&listings.length>=8&&listings.length<10&&(
              <div style={{background:"#FFF3CD",border:"1px solid rgba(133,100,4,0.2)",borderRadius:"8px",padding:"10px 14px",fontSize:"12px",color:"#856404"}}>
                You have {10-listings.length} listing slot{10-listings.length!==1?"s":""} remaining. <span onClick={()=>setActiveTab("Profile")} style={{fontWeight:"600",cursor:"pointer",textDecoration:"underline"}}>Upgrade to Professional</span>
              </div>
            )}

            {loadingListings?(
              <div style={{textAlign:"center",padding:"40px",color:"#888"}}>Loading...</div>
            ):listings.length===0?(
              <div style={{background:"white",borderRadius:"12px",padding:"40px",textAlign:"center",border:"1px solid #eee"}}>
                <p style={{color:"#888",fontSize:"14px",marginBottom:"16px"}}>No properties listed yet.</p>
                <button onClick={()=>setActiveTab("Add Property")} style={{background:"#0A5C3F",color:"white",border:"none",borderRadius:"8px",padding:"10px 20px",fontSize:"14px",cursor:"pointer"}}>
                  List Your First Property
                </button>
              </div>
            ):listings.map(l=>(
              <div key={l.id} style={{background:"white",borderRadius:"12px",border:"1px solid #eee",overflow:"hidden"}}>
                <div style={{display:"grid",gridTemplateColumns:"120px 1fr"}}>
                  <PropertyThumb type={l.type} image={l.image||null}/>
                  <div style={{padding:"14px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"6px"}}>
                      <h3 style={{fontSize:"14px",fontWeight:"600",color:"#222",margin:0,flex:1,paddingRight:"8px"}}>{l.title}</h3>
                      <div style={{display:"flex",gap:"6px",flexShrink:0}}>
                        <span style={{fontSize:"10px",background:(STATUS_STYLE[l.status]||STATUS_STYLE.available).bg,color:(STATUS_STYLE[l.status]||STATUS_STYLE.available).color,borderRadius:"4px",padding:"2px 6px"}}>
                          {(STATUS_STYLE[l.status]||STATUS_STYLE.available).label}
                        </span>
                        {l.verification_status==="fully_verified"
                          ?<span style={{fontSize:"10px",background:"#E1F5EE",color:"#0A5C3F",borderRadius:"4px",padding:"2px 6px"}}>Verified</span>
                          :<span style={{fontSize:"10px",background:"#FFF3CD",color:"#856404",borderRadius:"4px",padding:"2px 6px",animation:"pendingBlink 2s infinite",display:"inline-block"}}>Pending</span>
                        }
                      </div>
                    </div>
                    <div style={{fontSize:"12px",color:"#888",marginBottom:"8px"}}>{l.area||l.lga}{l.city?`, ${l.city}`:""}, {l.state} · {l.type} · {l.created_at?formatDate(l.created_at):""}</div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                        <span style={{fontSize:"16px",fontWeight:"700",color:"#0A5C3F"}}>{formatPrice(l.price)}</span>
                        <span style={{fontSize:"11px",color:"#888"}}>{l.views||0} views</span>
                        <span style={{fontSize:"11px",color:"#888"}}>{l.inquiries||0} enquiries</span>
                      </div>
                      <div style={{display:"flex",gap:"6px"}}>
                        <button onClick={()=>router.push(`/property/${l.id}`)} style={{background:"#f0f0f0",color:"#555",border:"none",borderRadius:"6px",padding:"6px 10px",fontSize:"12px",cursor:"pointer"}}>View</button>
                        <button style={{background:"#E1F5EE",color:"#0A5C3F",border:"none",borderRadius:"6px",padding:"6px 10px",fontSize:"12px",cursor:"pointer"}}>Edit</button>
                        <button onClick={()=>handleRemoveListing(l.id)} style={{background:"#FDECEA",color:"#C62828",border:"none",borderRadius:"6px",padding:"6px 10px",fontSize:"12px",cursor:"pointer"}}>Remove</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ADD PROPERTY */}
        {activeTab==="Add Property"&&(
          <div style={{background:"white",borderRadius:"12px",padding:"24px",border:"1px solid #eee"}}>
            {!canAddListing?(
              <div style={{textAlign:"center",padding:"40px"}}>
                <h3 style={{fontSize:"18px",fontWeight:"700",color:"#C62828",marginBottom:"8px"}}>Listing Limit Reached</h3>
                <p style={{fontSize:"14px",color:"#888",marginBottom:"20px"}}>You have used all {listingLimit} listing slots on the <strong>{currentPlan.name}</strong> plan.</p>
                <div style={{display:"flex",gap:"10px",justifyContent:"center"}}>
                  <button onClick={()=>setActiveTab("My Listings")} style={{background:"#f0f0f0",color:"#333",border:"none",borderRadius:"8px",padding:"10px 20px",fontSize:"14px",cursor:"pointer"}}>Manage Listings</button>
                  <button onClick={()=>setActiveTab("Profile")} style={{background:"#0A5C3F",color:"white",border:"none",borderRadius:"8px",padding:"10px 20px",fontSize:"14px",cursor:"pointer"}}>Upgrade Plan</button>
                </div>
              </div>
            ):(
              <>
                <h2 style={{fontSize:"16px",fontWeight:"600",color:"#333",marginBottom:"20px"}}>List a New Property</h2>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px"}}>

                  {/* Photos */}
                  <div style={{gridColumn:"1/-1"}}>
                    <label style={{fontSize:"12px",fontWeight:"500",color:"#555",display:"block",marginBottom:"8px"}}>
                      Property Photos (min 1, max 30)
                      {uploadedImages.length>0&&<span style={{color:"#0A5C3F",marginLeft:"8px",fontWeight:"600"}}>{uploadedImages.length}/30</span>}
                    </label>
                    {uploadedImages.length>0?(
                      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:"8px",marginBottom:"8px"}}>
                        {uploadedImages.map((img,i)=>(
                          <div key={i} style={{position:"relative",borderRadius:"8px",overflow:"hidden",aspectRatio:"1",border:"1px solid #e8e8e8"}}>
                            <img src={img} alt={`Photo ${i+1}`} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                            {i===0&&<div style={{position:"absolute",top:"4px",left:"4px",background:"#0A5C3F",borderRadius:"4px",padding:"2px 6px",fontSize:"9px",color:"white",fontWeight:"600"}}>COVER</div>}
                            <button onClick={e=>{e.stopPropagation();setUploadedImages(prev=>prev.filter((_,idx)=>idx!==i));}}
                              style={{position:"absolute",top:"4px",right:"4px",background:"rgba(0,0,0,0.6)",border:"none",borderRadius:"4px",width:"20px",height:"20px",cursor:"pointer",color:"white",fontSize:"12px"}}>x</button>
                          </div>
                        ))}
                        {uploadedImages.length<30&&(
                          <div onClick={()=>fileInputRef.current?.click()}
                            style={{border:"2px dashed #e8e8e8",borderRadius:"8px",aspectRatio:"1",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",background:"#f8f8f8",flexDirection:"column",gap:"4px"}}>
                            <span style={{fontSize:"20px"}}>+</span>
                            <span style={{fontSize:"10px",color:"#aaa"}}>Add</span>
                          </div>
                        )}
                      </div>
                    ):(
                      <div onClick={()=>fileInputRef.current?.click()}
                        style={{border:`2px dashed ${formErrors.photos?"#C62828":"#e8e8e8"}`,borderRadius:"10px",padding:"24px",cursor:"pointer",background:"#f8f8f8",textAlign:"center",marginBottom:"8px"}}>
                        <div style={{fontSize:"13px",fontWeight:"500",color:"#555"}}>Click to upload property photos</div>
                        <div style={{fontSize:"11px",color:"#aaa",marginTop:"4px"}}>JPG, PNG up to 5MB. First photo becomes cover image.</div>
                      </div>
                    )}
                    {formErrors.photos&&<span style={{fontSize:"11px",color:"#C62828",display:"block"}}>{formErrors.photos}</span>}
                    <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={e=>{
                      const files=Array.from(e.target.files||[]);
                      const remaining=30-uploadedImages.length;
                      files.slice(0,remaining).forEach(file=>{
                        if(file.size>5*1024*1024){alert(`${file.name} over 5MB — skipped`);return;}
                        const reader=new FileReader();
                        reader.onload=ev=>setUploadedImages(prev=>[...prev,ev.target?.result as string]);
                        reader.readAsDataURL(file);
                      });
                      e.target.value="";
                    }} style={{display:"none"}}/>
                  </div>

                  <div style={{gridColumn:"1/-1"}} data-error={!!formErrors.title}>
                    <label style={{fontSize:"12px",fontWeight:"500",color:formErrors.title?"#C62828":"#555",display:"block",marginBottom:"6px"}}>Property Title *</label>
                    <input type="text" placeholder="e.g. 3 Bedroom Flat, Lekki Phase 1" value={newProperty.title}
                      onChange={e=>{updateProp("title",e.target.value);setFormErrors(p=>({...p,title:""}));}}
                      style={{...inp,border:`1px solid ${formErrors.title?"#C62828":"#e8e8e8"}`}}/>
                    {formErrors.title&&<span style={{fontSize:"11px",color:"#C62828",marginTop:"4px",display:"block"}}>{formErrors.title}</span>}
                  </div>

                  <div data-error={!!formErrors.state}>
                    <label style={{fontSize:"12px",fontWeight:"500",color:formErrors.state?"#C62828":"#555",display:"block",marginBottom:"6px"}}>State *</label>
                    <select value={newProperty.state} onChange={e=>{updateProp("state",e.target.value);setFormErrors(p=>({...p,state:""}));}}
                      style={{...inp,border:`1px solid ${formErrors.state?"#C62828":"#e8e8e8"}`}}>
                      {["Lagos","Abuja (FCT)","Rivers","Oyo","Ogun","Kano","Kaduna","Enugu","Delta","Edo","Anambra","Imo","Abia","Akwa Ibom","Ekiti","Ondo","Osun","Kwara","Niger","Kogi","Benue","Plateau","Nasarawa","Taraba","Adamawa","Bauchi","Gombe","Yobe","Borno","Sokoto","Kebbi","Zamfara","Katsina","Jigawa","Bayelsa","Cross River","Ebonyi"].map(s=><option key={s}>{s}</option>)}
                    </select>
                  </div>

                  <div data-error={!!formErrors.lga}>
                    <label style={{fontSize:"12px",fontWeight:"500",color:formErrors.lga?"#C62828":"#555",display:"block",marginBottom:"6px"}}>LGA *</label>
                    <input type="text" placeholder="e.g. Eti-Osa" value={newProperty.lga}
                      onChange={e=>{updateProp("lga",e.target.value);setFormErrors(p=>({...p,lga:""}));}}
                      style={{...inp,border:`1px solid ${formErrors.lga?"#C62828":"#e8e8e8"}`}}/>
                    {formErrors.lga&&<span style={{fontSize:"11px",color:"#C62828",marginTop:"4px",display:"block"}}>{formErrors.lga}</span>}
                  </div>

                  <div data-error={!!formErrors.city}>
                    <label style={{fontSize:"12px",fontWeight:"500",color:formErrors.city?"#C62828":"#555",display:"block",marginBottom:"6px"}}>City *</label>
                    <input type="text" placeholder="e.g. Lagos, Abuja, Ibadan" value={newProperty.city}
                      onChange={e=>{updateProp("city",e.target.value);setFormErrors(p=>({...p,city:""}));}}
                      style={{...inp,border:`1px solid ${formErrors.city?"#C62828":"#e8e8e8"}`}}/>
                    {formErrors.city&&<span style={{fontSize:"11px",color:"#C62828",marginTop:"4px",display:"block"}}>{formErrors.city}</span>}
                  </div>

                  <div data-error={!!formErrors.area}>
                    <label style={{fontSize:"12px",fontWeight:"500",color:formErrors.area?"#C62828":"#555",display:"block",marginBottom:"6px"}}>Area / Neighbourhood *</label>
                    <input type="text" placeholder="e.g. Lekki Phase 1" value={newProperty.area}
                      onChange={e=>{updateProp("area",e.target.value);setFormErrors(p=>({...p,area:""}));}}
                      style={{...inp,border:`1px solid ${formErrors.area?"#C62828":"#e8e8e8"}`}}/>
                    {formErrors.area&&<span style={{fontSize:"11px",color:"#C62828",marginTop:"4px",display:"block"}}>{formErrors.area}</span>}
                  </div>

                  <div>
                    <label style={{fontSize:"12px",fontWeight:"500",color:"#555",display:"block",marginBottom:"6px"}}>Property Type</label>
                    <select value={newProperty.type} onChange={e=>updateProp("type",e.target.value)} style={inp}>
                      {["Flat","Detached House","Semi-Detached","Terraced","Land","Commercial","Duplex","Bungalow"].map(t=><option key={t}>{t}</option>)}
                    </select>
                  </div>

                  <div data-error={!!formErrors.purpose}>
                    <label style={{fontSize:"12px",fontWeight:"500",color:formErrors.purpose?"#C62828":"#555",display:"block",marginBottom:"6px"}}>For Sale or Rent *</label>
                    <select value={newProperty.purpose} onChange={e=>{updateProp("purpose",e.target.value);setFormErrors(p=>({...p,purpose:""}));}} style={{...inp,border:`1px solid ${formErrors.purpose?"#C62828":"#e8e8e8"}`}}>
                      <option value="sale">For Sale</option>
                      <option value="rent">For Rent</option>
                      <option value="shortlet">Shortlet</option>
                    </select>
                  </div>

                  <div data-error={!!formErrors.price}>
                    <label style={{fontSize:"12px",fontWeight:"500",color:formErrors.price?"#C62828":"#555",display:"block",marginBottom:"6px"}}>Price (N) *</label>
                    <input type="number" placeholder="e.g. 45000000" value={newProperty.price}
                      onChange={e=>{updateProp("price",e.target.value);setFormErrors(p=>({...p,price:""}));}}
                      style={{...inp,border:`1px solid ${formErrors.price?"#C62828":"#e8e8e8"}`}}/>
                    {formErrors.price&&<span style={{fontSize:"11px",color:"#C62828",marginTop:"4px",display:"block"}}>{formErrors.price}</span>}
                  </div>

                  {newProperty.type!=="Land"&&newProperty.type!=="Commercial"&&(
                    <div data-error={!!formErrors.bedrooms}>
                      <label style={{fontSize:"12px",fontWeight:"500",color:formErrors.bedrooms?"#C62828":"#555",display:"block",marginBottom:"6px"}}>Bedrooms *</label>
                      <select value={newProperty.bedrooms} onChange={e=>{updateProp("bedrooms",e.target.value);setFormErrors(p=>({...p,bedrooms:""}));}} style={{...inp,border:`1px solid ${formErrors.bedrooms?"#C62828":"#e8e8e8"}`}}>
                        <option value="">Select</option>
                        {[1,2,3,4,5,6,7,8].map(n=><option key={n} value={n}>{n}</option>)}
                      </select>
                      {formErrors.bedrooms&&<span style={{fontSize:"11px",color:"#C62828",marginTop:"4px",display:"block"}}>{formErrors.bedrooms}</span>}
                    </div>
                  )}

                  {newProperty.type!=="Land"&&newProperty.type!=="Commercial"&&(
                    <div data-error={!!formErrors.bathrooms}>
                      <label style={{fontSize:"12px",fontWeight:"500",color:formErrors.bathrooms?"#C62828":"#555",display:"block",marginBottom:"6px"}}>Bathrooms *</label>
                      <select value={newProperty.bathrooms} onChange={e=>{updateProp("bathrooms",e.target.value);setFormErrors(p=>({...p,bathrooms:""}));}} style={{...inp,border:`1px solid ${formErrors.bathrooms?"#C62828":"#e8e8e8"}`}}>
                        <option value="">Select</option>
                        {[1,2,3,4,5,6].map(n=><option key={n} value={n}>{n}</option>)}
                      </select>
                      {formErrors.bathrooms&&<span style={{fontSize:"11px",color:"#C62828",marginTop:"4px",display:"block"}}>{formErrors.bathrooms}</span>}
                    </div>
                  )}

                  <div data-error={!!formErrors.size_sqm}>
                    <label style={{fontSize:"12px",fontWeight:"500",color:formErrors.size_sqm?"#C62828":"#555",display:"block",marginBottom:"6px"}}>Size (sqm) *</label>
                    <input type="number" placeholder="e.g. 120" value={newProperty.size_sqm}
                      onChange={e=>{updateProp("size_sqm",e.target.value);setFormErrors(p=>({...p,size_sqm:""}));}}
                      style={{...inp,border:`1px solid ${formErrors.size_sqm?"#C62828":"#e8e8e8"}`}}/>
                    {formErrors.size_sqm&&<span style={{fontSize:"11px",color:"#C62828",marginTop:"4px",display:"block"}}>{formErrors.size_sqm}</span>}
                  </div>

                  <div style={{gridColumn:"1/-1"}} data-error={!!formErrors.description}>
                    <label style={{fontSize:"12px",fontWeight:"500",color:formErrors.description?"#C62828":"#555",display:"block",marginBottom:"6px"}}>
                      Description * ({newProperty.description.length}/20 min)
                    </label>
                    <textarea placeholder="Describe the property, key features, nearby landmarks, access roads..."
                      value={newProperty.description} onChange={e=>{updateProp("description",e.target.value);setFormErrors(p=>({...p,description:""}));}}
                      rows={4} style={{...inp,resize:"vertical",border:`1px solid ${formErrors.description?"#C62828":"#e8e8e8"}`}}/>
                    {formErrors.description&&<span style={{fontSize:"11px",color:"#C62828",marginTop:"4px",display:"block"}}>{formErrors.description}</span>}
                  </div>

                  <div style={{gridColumn:"1/-1"}}>
                    <TitleDocumentSelector onChange={(titles,docs)=>{setSelectedTitles(titles);setTitleDocs(docs);if(titles.length>0)updateProp("title_type",titles[0]);}}/>
                    {formErrors.title_type&&<span style={{fontSize:"11px",color:"#C62828",marginTop:"4px",display:"block"}}>{formErrors.title_type}</span>}
                    {formErrors.docs&&<span style={{fontSize:"11px",color:"#C62828",marginTop:"4px",display:"block"}}>{formErrors.docs}</span>}
                  </div>

                  {Object.keys(formErrors).length>0&&(
                    <div style={{gridColumn:"1/-1",background:"#FDECEA",border:"1px solid rgba(198,40,40,0.2)",borderRadius:"10px",padding:"12px 16px"}}>
                      <div style={{fontSize:"13px",fontWeight:"600",color:"#C62828",marginBottom:"6px"}}>Please fix the following:</div>
                      <ul style={{margin:0,paddingLeft:"16px"}}>
                        {Object.values(formErrors).filter(Boolean).map((err,i)=>(
                          <li key={i} style={{fontSize:"12px",color:"#C62828",marginBottom:"2px"}}>{err as string}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div style={{gridColumn:"1/-1",display:"flex",gap:"12px"}}>
                    <button onClick={()=>setActiveTab("My Listings")} style={{flex:1,background:"#f0f0f0",color:"#333",border:"none",borderRadius:"10px",padding:"13px",fontSize:"14px",cursor:"pointer"}}>Cancel</button>
                    <button onClick={handleAddProperty} disabled={submitting}
                      style={{flex:2,background:submitting?"#ccc":"#0A5C3F",color:"white",border:"none",borderRadius:"10px",padding:"13px",fontSize:"14px",fontWeight:"500",cursor:submitting?"not-allowed":"pointer"}}>
                      {submitting?"Submitting...":"Submit for Verification"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* CRM */}
        {activeTab==="CRM"&&(
          <div style={{background:"white",borderRadius:"12px",padding:"32px",border:"1px solid #eee",textAlign:"center"}}>
            <h2 style={{fontSize:"20px",fontWeight:"700",color:"#222",marginBottom:"8px"}}>Lead CRM Pipeline</h2>
            <p style={{fontSize:"14px",color:"#888",marginBottom:"24px",lineHeight:"1.6"}}>Manage all your buyer enquiries. Track leads from New to Contacted to Inspection to Closed.</p>
            <button onClick={()=>router.push("/crm")} style={{background:"#0A5C3F",color:"white",border:"none",borderRadius:"10px",padding:"13px 32px",fontSize:"15px",fontWeight:"500",cursor:"pointer"}}>Open CRM Pipeline</button>
          </div>
        )}

        {/* PROFILE */}
        {activeTab==="Profile"&&(
          <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
            <div style={{background:"white",borderRadius:"12px",padding:"24px",border:"1px solid #eee"}}>
              <div style={{display:"flex",gap:"20px",alignItems:"flex-start",marginBottom:"20px"}}>
                <div style={{position:"relative",flexShrink:0}}>
                  <div style={{width:"80px",height:"80px",borderRadius:"50%",overflow:"hidden",border:"3px solid #E1F5EE",cursor:"pointer"}} onClick={()=>profileImageRef.current?.click()}>
                    {profileImage
                      ?<img src={profileImage} alt="Profile" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                      :<div style={{width:"100%",height:"100%",background:"#E1F5EE",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"24px",fontWeight:"700",color:"#0A5C3F"}}>{agent.initials||"AG"}</div>
                    }
                  </div>
                  <div onClick={()=>profileImageRef.current?.click()}
                    style={{position:"absolute",bottom:"2px",right:"2px",background:"#0A5C3F",borderRadius:"50%",width:"22px",height:"22px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"9px",cursor:"pointer",border:"2px solid white",color:"white",zIndex:1}}>
                    Edit
                  </div>
                  <input ref={profileImageRef} type="file" accept="image/*" onChange={handleProfileImageSelect} style={{display:"none"}}/>
                </div>
                <div style={{flex:1}}>
                  <h2 style={{fontSize:"18px",fontWeight:"700",color:"#222",margin:"0 0 4px"}}>{agent.name||"Your Name"}</h2>
                  <div style={{fontSize:"13px",color:"#888",marginBottom:"6px"}}>{agent.email}</div>
                  <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
                    {agent.kyc_status==="verified"
                      ?<span style={{fontSize:"11px",background:"#E1F5EE",color:"#0A5C3F",borderRadius:"4px",padding:"3px 8px"}}>NIN Verified</span>
                      :<span style={{fontSize:"11px",background:"#FFF3CD",color:"#856404",borderRadius:"4px",padding:"3px 8px",cursor:"pointer"}} onClick={()=>router.push("/kyc")}>Complete KYC</span>
                    }
                    <span style={{fontSize:"11px",background:"#FAC775",color:"#412402",borderRadius:"4px",padding:"3px 8px",textTransform:"capitalize"}}>{currentPlan.name} Plan</span>
                  </div>
                </div>
              </div>

              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"}}>
                <h3 style={{fontSize:"14px",fontWeight:"600",color:"#333",margin:0}}>Account Details</h3>
                {!editingProfile&&(
                  <button onClick={()=>{setProfileForm({name:agent.name,email:agent.email,phone:agent.phone,bio:"",states_covered:statesCovered});setEditingProfile(true);}}
                    style={{background:"#f0f0f0",color:"#333",border:"none",borderRadius:"7px",padding:"7px 14px",fontSize:"12px",fontWeight:"500",cursor:"pointer"}}>
                    Edit Profile
                  </button>
                )}
              </div>

              {editingProfile?(
                <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
                    {[{label:"Full Name",key:"name"},{label:"Email Address",key:"email"},{label:"Phone Number",key:"phone"}].map(f=>(
                      <div key={f.key}>
                        <label style={{fontSize:"11px",color:"#888",display:"block",marginBottom:"5px"}}>{f.label}</label>
                        <input value={(profileForm as any)[f.key]} onChange={e=>setProfileForm(p=>({...p,[f.key]:e.target.value}))}
                          style={{width:"100%",background:"#f8f8f8",border:"1px solid #e8e8e8",borderRadius:"8px",padding:"9px 12px",fontSize:"13px",outline:"none",boxSizing:"border-box" as const}}/>
                      </div>
                    ))}
                    <div>
                      <label style={{fontSize:"11px",color:"#888",display:"block",marginBottom:"5px"}}>KYC / NIN Status</label>
                      <div style={{background:"#f8f8f8",borderRadius:"8px",padding:"9px 12px",fontSize:"13px",color:agent.kyc_status==="verified"?"#0A5C3F":"#856404"}}>
                        {agent.kyc_status==="verified"?"NIN Verified":<span style={{cursor:"pointer",textDecoration:"underline"}} onClick={()=>router.push("/kyc")}>Complete KYC</span>}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label style={{fontSize:"11px",color:"#888",display:"block",marginBottom:"5px"}}>Professional Bio</label>
                    <textarea value={profileForm.bio} onChange={e=>setProfileForm(p=>({...p,bio:e.target.value}))}
                      placeholder="Describe your experience, specialties, areas of coverage..."
                      rows={3} style={{width:"100%",background:"#f8f8f8",border:"1px solid #e8e8e8",borderRadius:"8px",padding:"9px 12px",fontSize:"13px",outline:"none",resize:"vertical",boxSizing:"border-box" as const}}/>
                  </div>
                  {statesCovered.length>0&&(
                    <div style={{background:"#f8f8f8",borderRadius:"8px",padding:"12px"}}>
                      <div style={{fontSize:"11px",color:"#888",marginBottom:"6px"}}>States Covered (auto-detected from listings)</div>
                      <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
                        {statesCovered.map(s=>(
                          <span key={s} style={{background:"#E1F5EE",color:"#0A5C3F",borderRadius:"4px",padding:"3px 10px",fontSize:"12px",fontWeight:"500"}}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div style={{display:"flex",gap:"10px"}}>
                    <button onClick={()=>setEditingProfile(false)} style={{flex:1,background:"#f0f0f0",color:"#333",border:"none",borderRadius:"8px",padding:"10px",fontSize:"13px",cursor:"pointer"}}>Cancel</button>
                    <button onClick={()=>{
                      setAgent(prev=>({...prev,name:profileForm.name,email:profileForm.email,phone:profileForm.phone,
                        initials:profileForm.name.split(" ").filter(Boolean).map((n:string)=>n[0]).join("").toUpperCase().slice(0,2)}));
                      setEditingProfile(false);
                    }} style={{flex:2,background:"#0A5C3F",color:"white",border:"none",borderRadius:"8px",padding:"10px",fontSize:"13px",fontWeight:"500",cursor:"pointer"}}>
                      Save Changes
                    </button>
                  </div>
                </div>
              ):(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
                  {[
                    {label:"Full Name",value:agent.name||"Not set"},
                    {label:"Email",value:agent.email||"Not set"},
                    {label:"Phone",value:agent.phone||"Not set"},
                    {label:"KYC Status",value:agent.kyc_status==="verified"?"Verified":"Pending",color:agent.kyc_status==="verified"?"#0A5C3F":"#856404"},
                    {label:"Response Rate",value:`${responseRate}% — ${getResponseRateLabel()}`,color:getResponseRateColor()},
                    {label:"States Covered",value:statesCovered.length>0?statesCovered.join(", "):"No listings yet"},
                  ].map(item=>(
                    <div key={item.label} style={{background:"#f8f8f8",borderRadius:"8px",padding:"12px"}}>
                      <div style={{fontSize:"11px",color:"#888",marginBottom:"4px"}}>{item.label}</div>
                      <div style={{fontSize:"13px",fontWeight:"500",color:(item as any).color||"#333"}}>{item.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Subscription plans */}
            <div style={{background:"white",borderRadius:"12px",padding:"24px",border:"1px solid #eee"}}>
              <h3 style={{fontSize:"14px",fontWeight:"600",color:"#333",marginBottom:"6px"}}>Subscription Plans</h3>
              <p style={{fontSize:"12px",color:"#888",marginBottom:"16px"}}>Free plan: 10 listings max. Upgrade to list unlimited properties and get the Verified badge.</p>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"12px"}}>
                {SUBSCRIPTION_PLANS.map(plan=>{
                  const isCurrent=agent.subscription===plan.key||(plan.key==="free"&&!agent.subscription);
                  return(
                    <div key={plan.key} style={{border:`2px solid ${isCurrent?"#0A5C3F":"#eee"}`,borderRadius:"10px",padding:"16px",background:isCurrent?"#E1F5EE":"white",position:"relative"}}>
                      {isCurrent&&<div style={{position:"absolute",top:"-8px",right:"12px",background:"#0A5C3F",color:"white",borderRadius:"4px",padding:"2px 8px",fontSize:"10px",fontWeight:"600"}}>CURRENT</div>}
                      <div style={{fontSize:"14px",fontWeight:"700",color:isCurrent?"#0A5C3F":"#333",marginBottom:"4px"}}>{plan.name}</div>
                      <div style={{fontSize:"20px",fontWeight:"700",color:isCurrent?"#0A5C3F":"#333",marginBottom:"6px"}}>{plan.monthly}</div>
                      <div style={{fontSize:"11px",color:"#888",marginBottom:"10px"}}>
                        {plan.listing_limit===999?"Unlimited listings":`${plan.listing_limit} listings max`}
                        {plan.key==="free"&&listings.length>0&&(
                          <div style={{marginTop:"4px"}}>
                            <div style={{background:"#e8e8e8",borderRadius:"2px",height:"4px",overflow:"hidden"}}>
                              <div style={{background:listings.length>=10?"#C62828":"#0A5C3F",height:"100%",width:`${Math.min(100,(listings.length/10)*100)}%`}}/>
                            </div>
                            <span style={{color:listings.length>=10?"#C62828":"#888"}}>{listings.length}/10 used</span>
                          </div>
                        )}
                      </div>
                      {plan.features.map(f=><div key={f} style={{fontSize:"11px",color:"#666",marginBottom:"3px"}}>· {f}</div>)}
                      <button onClick={()=>isCurrent?null:handleSubscribe(plan)} disabled={isCurrent}
                        style={{marginTop:"12px",width:"100%",background:isCurrent?"#0A5C3F":"#f0f0f0",color:isCurrent?"white":"#333",border:"none",borderRadius:"6px",padding:"8px",fontSize:"12px",cursor:isCurrent?"default":"pointer",fontWeight:isCurrent?"500":"400"}}>
                        {isCurrent?"Current Plan":plan.key==="free"?"Downgrade":"Upgrade"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
