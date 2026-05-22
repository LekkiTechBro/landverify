"use client";

import { useState, useEffect, Suspense } from "react";

import { useSearchParams, useRouter } from "next/navigation";



const API = "https://landverify-production.up.railway.app/api/v1";



const STATES_LGAS: Record<string, string[]> = {

  "Lagos": ["Agege","Ajeromi-Ifelodun","Alimosho","Amuwo-Odofin","Apapa","Badagry","Epe","Eti-Osa","Ibeju-Lekki","Ifako-Ijaiye","Ikeja","Ikorodu","Kosofe","Lagos Island","Lagos Mainland","Mushin","Ojo","Oshodi-Isolo","Shomolu","Surulere"],

  "Abuja (FCT)": ["Abaji","Bwari","Gwagwalada","Kuje","Kwali","Municipal Area Council"],

  "Rivers": ["Abua-Odual","Ahoada East","Ahoada West","Akuku-Toru","Andoni","Asari-Toru","Bonny","Degema","Eleme","Emohua","Etche","Gokana","Ikwerre","Khana","Obio-Akpor","Ogba-Egbema-Ndoni","Ogu-Bolo","Okrika","Omuma","Opobo-Nkoro","Oyigbo","Port Harcourt","Tai"],

  "Oyo": ["Afijio","Akinyele","Atiba","Atisbo","Egbeda","Ibadan North","Ibadan North-East","Ibadan North-West","Ibadan South-East","Ibadan South-West","Ibarapa Central","Ibarapa East","Ibarapa North","Ido","Irepo","Iseyin","Itesiwaju","Iwajowa","Kajola","Lagelu","Ogbomosho North","Ogbomosho South","Ogo Oluwa","Olorunsogo","Oluyole","Ona-Ara","Orelope","Orire","Oyo East","Oyo West","Saki East","Saki West","Surulere"],

  "Ogun": ["Abeokuta North","Abeokuta South","Ado-Odo/Ota","Egbado North","Egbado South","Ewekoro","Ifo","Ijebu East","Ijebu North","Ijebu North-East","Ijebu Ode","Ikenne","Imeko Afon","Ipokia","Obafemi Owode","Odeda","Odogbolu","Ogun Waterside","Remo North","Shagamu"],

  "Kano": ["Ajingi","Albasu","Bagwai","Bebeji","Bichi","Bunkure","Dala","Dambatta","Dawakin Kudu","Dawakin Tofa","Doguwa","Fagge","Gabasawa","Garko","Garun Mallam","Gaya","Gezawa","Gwale","Gwarzo","Kabo","Kano Municipal","Karaye","Kibiya","Kiru","Kumbotso","Kunchi","Kura","Madobi","Makoda","Minjibir","Nasarawa","Rano","Rimin Gado","Rogo","Shanono","Sumaila","Takai","Tarauni","Tofa","Tsanyawa","Tudun Wada","Ungogo","Warwa","Wudil"],

  "Kaduna": ["Birnin Gwari","Chikun","Giwa","Igabi","Ikara","Jaba","Jema'a","Kachia","Kaduna North","Kaduna South","Kagarko","Kajuru","Kaura","Kauru","Kubau","Kudan","Lere","Makarfi","Sabon Gari","Sanga","Soba","Zangon Kataf","Zaria"],

  "Enugu": ["Aninri","Awgu","Enugu East","Enugu North","Enugu South","Ezeagu","Igbo Etiti","Igbo Eze North","Igbo Eze South","Isi Uzo","Nkanu East","Nkanu West","Nsukka","Oji River","Udenu","Udi","Uzo-Uwani"],

  "Delta": ["Aniocha North","Aniocha South","Bomadi","Burutu","Ethiope East","Ethiope West","Ika North East","Ika South","Isoko North","Isoko South","Ndokwa East","Ndokwa West","Okpe","Oshimili North","Oshimili South","Patani","Sapele","Udu","Ughelli North","Ughelli South","Ukwuani","Uvwie","Warri North","Warri South","Warri South-West"],

  "Edo": ["Akoko-Edo","Egor","Esan Central","Esan North-East","Esan South-East","Esan West","Etsako Central","Etsako East","Etsako West","Igueben","Ikpoba-Okha","Orhionmwon","Oredo","Ovia North-East","Ovia South-West","Owan East","Owan West","Uhunmwonde"],

  "Anambra": ["Aguata","Anambra East","Anambra West","Anaocha","Awka North","Awka South","Ayamelum","Dunukofia","Ekwusigo","Idemili North","Idemili South","Ihiala","Njikoka","Nnewi North","Nnewi South","Ogbaru","Onitsha North","Onitsha South","Orumba North","Orumba South","Oyi"],

  "Imo": ["Aboh Mbaise","Ahiazu Mbaise","Ehime Mbano","Ezinihitte","Ideato North","Ideato South","Ihitte/Uboma","Ikeduru","Isiala Mbano","Isu","Mbaitoli","Ngor Okpala","Njaba","Nkwerre","Nwangele","Obowo","Oguta","Ohaji/Egbema","Okigwe","Orlu","Orsu","Oru East","Oru West","Owerri Municipal","Owerri North","Owerri West","Unuimo"],

  "Abia": ["Aba North","Aba South","Arochukwu","Bende","Ikwuano","Isiala Ngwa North","Isiala Ngwa South","Isuikwuato","Obi Ngwa","Ohafia","Osisioma","Ugwunagbo","Ukwa East","Ukwa West","Umuahia North","Umuahia South","Umu Nneochi"],

  "Akwa Ibom": ["Abak","Eastern Obolo","Eket","Esit Eket","Essien Udim","Etim Ekpo","Etinan","Ibeno","Ibesikpo Asutan","Ibiono-Ibom","Ika","Ikono","Ikot Abasi","Ikot Ekpene","Ini","Itu","Mbo","Mkpat-Enin","Nsit-Atai","Nsit-Ibom","Nsit-Ubium","Obot Akara","Okobo","Onna","Oron","Oruk Anam","Udung-Uko","Ukanafun","Uruan","Urue-Offong/Oruko","Uyo"],

  "Ekiti": ["Ado Ekiti","Efon","Ekiti East","Ekiti South-West","Ekiti West","Emure","Gbonyin","Ido/Osi","Ijero","Ikere","Ikole","Ilejemeje","Irepodun/Ifelodun","Ise/Orun","Moba","Oye"],

  "Ondo": ["Akoko North-East","Akoko North-West","Akoko South-East","Akoko South-West","Akure North","Akure South","Ese Odo","Idanre","Ifedore","Ilaje","Ile Oluji/Okeigbo","Irele","Odigbo","Okitipupa","Ondo East","Ondo West","Ose","Owo"],

  "Osun": ["Aiyedade","Aiyedire","Atakunmosa East","Atakunmosa West","Boluwaduro","Boripe","Ede North","Ede South","Egbedore","Ejigbo","Ife Central","Ife East","Ife North","Ife South","Ifedayo","Ifelodun","Ila","Ilesa East","Ilesa West","Irepodun","Irewole","Isokan","Iwo","Obokun","Odo-Otin","Ola-Oluwa","Olorunda","Oriade","Orolu","Osogbo"],

  "Kwara": ["Asa","Baruten","Edu","Ekiti","Ifelodun","Ilorin East","Ilorin South","Ilorin West","Irepodun","Isin","Kaiama","Moro","Offa","Oke Ero","Oyun","Pategi"],

  "Niger": ["Agaie","Agwara","Bida","Borgu","Bosso","Chanchaga","Edati","Gbako","Gurara","Katcha","Kontagora","Lapai","Lavun","Magama","Mariga","Mashegu","Mokwa","Moya","Paikoro","Rafi","Rijau","Shiroro","Suleja","Tafa","Wushishi"],

  "Kogi": ["Adavi","Ajaokuta","Ankpa","Bassa","Dekina","Ibaji","Idah","Igalamela-Odolu","Ijumu","Kabba/Bunu","Kogi","Lokoja","Mopa-Muro","Ofu","Ogori/Magongo","Okehi","Okene","Olamaboro","Omala","Yagba East","Yagba West"],

  "Benue": ["Ado","Agatu","Apa","Buruku","Gboko","Guma","Gwer East","Gwer West","Katsina-Ala","Konshisha","Kwande","Logo","Makurdi","Obi","Ogbadibo","Ohimini","Oju","Okpokwu","Otukpo","Tarka","Ukum","Ushongo","Vandeikya"],

  "Plateau": ["Barkin Ladi","Bassa","Bokkos","Jos East","Jos North","Jos South","Kanam","Kanke","Langtang North","Langtang South","Mangu","Mikang","Pankshin","Qua'an Pan","Riyom","Shendam","Wase"],

  "Nasarawa": ["Akwanga","Awe","Doma","Karu","Keana","Keffi","Kokona","Lafia","Nasarawa","Nasarawa Egon","Obi","Toto","Wamba"],

  "Taraba": ["Ardo Kola","Bali","Donga","Gashaka","Gassol","Ibi","Jalingo","Karim Lamido","Kumi","Lau","Sardauna","Takum","Ussa","Wukari","Yorro","Zing"],

  "Adamawa": ["Demsa","Fufure","Ganye","Gayuk","Gombi","Grie","Hong","Jada","Lamurde","Madagali","Maiha","Mayo Belwa","Michika","Mubi North","Mubi South","Numan","Shelleng","Song","Toungo","Yola North","Yola South"],

  "Bauchi": ["Alkaleri","Bauchi","Bogoro","Damban","Darazo","Dass","Gamawa","Ganjuwa","Giade","Itas/Gadau","Jama'are","Katagum","Kirfi","Misau","Ningi","Shira","Tafawa Balewa","Toro","Warji","Zaki"],

  "Gombe": ["Akko","Balanga","Billiri","Dukku","Funakaye","Gombe","Kaltungo","Kwami","Nafada","Shongom","Yamaltu/Deba"],

  "Yobe": ["Bade","Bursari","Damaturu","Fika","Fune","Geidam","Gujba","Gulani","Jakusko","Karasuwa","Machina","Nangere","Nguru","Potiskum","Tarmuwa","Yunusari","Yusufari"],

  "Borno": ["Abadam","Askira/Uba","Bama","Bayo","Biu","Chibok","Damboa","Dikwa","Gubio","Guzamala","Gwoza","Hawul","Jere","Kaga","Kala/Balge","Konduga","Kukawa","Kwaya Kusar","Mafa","Magumeri","Maiduguri","Marte","Mobbar","Monguno","Ngala","Nganzai","Shani"],

  "Sokoto": ["Binji","Bodinga","Dange Shuni","Gada","Goronyo","Gudu","Gwadabawa","Illela","Isa","Kebbe","Kware","Rabah","Sabon Birni","Shagari","Silame","Sokoto North","Sokoto South","Tambuwal","Tangaza","Tureta","Wamako","Wurno","Yabo"],

  "Kebbi": ["Aleiro","Arewa Dandi","Argungu","Augie","Bagudo","Birnin Kebbi","Bunza","Dandi","Fakai","Gwandu","Jega","Kalgo","Koko/Besse","Maiyama","Ngaski","Sakaba","Shanga","Suru","Wasagu/Danko","Yauri","Zuru"],

  "Zamfara": ["Anka","Bakura","Birnin Magaji/Kiyaw","Bukkuyum","Bungudu","Gummi","Gusau","Kaura Namoda","Maradun","Maru","Shinkafi","Talata Mafara","Tsafe","Zurmi"],

  "Katsina": ["Bakori","Batagarawa","Batsari","Baure","Bindawa","Charanchi","Dan Musa","Dandume","Danja","Daura","Dutsi","Dutsin-Ma","Faskari","Funtua","Ingawa","Jibia","Kafur","Kaita","Kankara","Kankia","Katsina","Kurfi","Kusada","Mai'adua","Malumfashi","Mani","Mashi","Matazu","Musawa","Rimi","Sabuwa","Safana","Sandamu","Zango"],

  "Jigawa": ["Auyo","Babura","Biriniwa","Birnin Kudu","Buji","Dutse","Gagarawa","Garki","Gumel","Guri","Gwaram","Gwiwa","Hadejia","Jahun","Kafin Hausa","Kaugama","Kazaure","Kiri Kasama","Kiyawa","Maigatari","Malam Madori","Miga","Ringim","Roni","Sule Tankarkar","Taura","Yankwashi"],

  "Bayelsa": ["Brass","Ekeremor","Kolokuma/Opokuma","Nembe","Ogbia","Sagbama","Southern Ijaw","Yenagoa"],

  "Cross River": ["Abi","Akamkpa","Akpabuyo","Bakassi","Bekwarra","Biase","Boki","Calabar Municipal","Calabar South","Etung","Ikom","Obanliku","Obubra","Obudu","Odukpani","Ogoja","Yakuur","Yala"],

  "Ebonyi": ["Abakaliki","Afikpo North","Afikpo South","Ebonyi","Ezza North","Ezza South","Ikwo","Ishielu","Ivo","Izzi","Ohaozara","Ohaukwu","Onicha"],

};



const STATES_CITIES: Record<string, string[]> = {

  "Lagos": ["All Cities","Lagos Island","Ikeja","Lekki","Victoria Island","Ikoyi","Surulere","Yaba","Ikorodu","Badagry","Epe","Apapa","Mushin","Oshodi","Agege","Alimosho"],

  "Abuja (FCT)": ["All Cities","Abuja","Garki","Maitama","Asokoro","Wuse","Gwarinpa","Gwagwalada","Kuje","Bwari","Kubwa","Lokogoma"],

  "Rivers": ["All Cities","Port Harcourt","Obio-Akpor","Rumuola","GRA","D-Line","Eleme","Bonny","Degema","Omoku"],

  "Oyo": ["All Cities","Ibadan","Ogbomosho","Oyo","Iseyin","Saki","Eruwa","Igboho"],

  "Ogun": ["All Cities","Abeokuta","Sagamu","Ijebu-Ode","Ota","Ilaro","Ijebu-Igbo","Shagamu"],

  "Kano": ["All Cities","Kano","Wudil","Rano","Dala","Fagge","Gwale","Nassarawa","Tarauni"],

  "Kaduna": ["All Cities","Kaduna","Zaria","Kafanchan","Kachia","Saminaka"],

  "Enugu": ["All Cities","Enugu","Nsukka","Oji River","Awgu","Agbani","9th Mile Corner"],

  "Delta": ["All Cities","Warri","Asaba","Sapele","Ughelli","Agbor","Abraka","Oleh"],

  "Edo": ["All Cities","Benin City","Auchi","Ekpoma","Uromi","Igarra","Ubiaja"],

  "Anambra": ["All Cities","Awka","Onitsha","Nnewi","Ekwulobia","Aguata","Ihiala","Ogidi"],

  "Imo": ["All Cities","Owerri","Orlu","Okigwe","Mbaise","Oguta","Ngor Okpala"],

  "Abia": ["All Cities","Aba","Umuahia","Ohafia","Arochukwu","Bende"],

  "Akwa Ibom": ["All Cities","Uyo","Eket","Ikot Ekpene","Abak","Oron","Itu"],

  "Ekiti": ["All Cities","Ado Ekiti","Ikere","Ikole","Emure","Omuo"],

  "Ondo": ["All Cities","Akure","Ondo","Owo","Okitipupa","Ile-Oluji"],

  "Osun": ["All Cities","Osogbo","Ile-Ife","Ilesa","Ede","Ikirun","Iwo"],

  "Kwara": ["All Cities","Ilorin","Offa","Lokoja","Lafiagi","Share"],

  "Benue": ["All Cities","Makurdi","Gboko","Otukpo","Katsina-Ala","Vandeikya"],

  "Plateau": ["All Cities","Jos","Bukuru","Shendam","Pankshin","Langtang"],

  "Nasarawa": ["All Cities","Lafia","Keffi","Akwanga","Nasarawa","Doma"],

  "Taraba": ["All Cities","Jalingo","Wukari","Bali","Takum","Gembu"],

  "Adamawa": ["All Cities","Yola","Mubi","Numan","Ganye","Michika"],

  "Bauchi": ["All Cities","Bauchi","Azare","Misau","Ningi","Tafawa Balewa"],

  "Gombe": ["All Cities","Gombe","Kaltungo","Billiri","Dukku","Nafada"],

  "Yobe": ["All Cities","Damaturu","Potiskum","Nguru","Gashua","Geidam"],

  "Borno": ["All Cities","Maiduguri","Biu","Gwoza","Damboa","Monguno"],

  "Sokoto": ["All Cities","Sokoto","Tambuwal","Wurno","Gwadabawa","Illela"],

  "Kebbi": ["All Cities","Birnin Kebbi","Argungu","Yauri","Zuru","Jega"],

  "Zamfara": ["All Cities","Gusau","Kaura Namoda","Talata Mafara","Anka","Bungudu"],

  "Katsina": ["All Cities","Katsina","Daura","Funtua","Malumfashi","Kankia"],

  "Jigawa": ["All Cities","Dutse","Hadejia","Kazaure","Gumel","Birnin Kudu"],

  "Bayelsa": ["All Cities","Yenagoa","Brass","Nembe","Ogbia","Sagbama"],

  "Cross River": ["All Cities","Calabar","Ikom","Obudu","Ogoja","Akamkpa"],

  "Ebonyi": ["All Cities","Abakaliki","Afikpo","Onueke","Ezza","Ikwo"],

  "Niger": ["All Cities","Minna","Bida","Suleja","Kontagora","Lapai"],

  "Kogi": ["All Cities","Lokoja","Okene","Kabba","Idah","Ankpa"],

};



const PROPERTY_IMAGES: Record<string, {grad:string,icon:string}> = {

  "Flat":           { grad:"linear-gradient(135deg,#0A5C3F,#1D9E75)", icon:"Ã°Å¸Â¢" },

  "Detached House": { grad:"linear-gradient(135deg,#1a4a6b,#2d7dd2)", icon:"Ã°Å¸Â " },

  "Semi-Detached":  { grad:"linear-gradient(135deg,#2d4a22,#5a8a3c)", icon:"Ã°Å¸" },

  "Land":           { grad:"linear-gradient(135deg,#6b4c1a,#c4892a)", icon:"Ã°Å¸Å’" },

  "Bungalow":       { grad:"linear-gradient(135deg,#4a1a6b,#8a3cc4)", icon:"Ã°Å¸Â¡" },

  "Duplex":         { grad:"linear-gradient(135deg,#6b1a2d,#c43c5a)", icon:"Ã°Å¸â€”" },

  "Commercial":     { grad:"linear-gradient(135deg,#1a3a6b,#2d5dd2)", icon:"Ã°Å¸Âª" },

  "Terraced":       { grad:"linear-gradient(135deg,#2d3a22,#5a6a3c)", icon:"Ã°Å¸Å¡" },

};



const RISK_COLORS: Record<string, {bg:string,color:string,label:string}> = {

  low:    { bg:"#E1F5EE", color:"#0A5C3F", label:"Low Risk" },

  medium: { bg:"#FFF3CD", color:"#856404", label:"Medium Risk" },

  high:   { bg:"#FDECEA", color:"#C62828", label:"High Risk" },

};



function formatPrice(price: number) {

  if (price >= 1000000000) return "N" + (price/1000000000).toFixed(1) + "B";

  if (price >= 1000000) return "N" + (price/1000000).toFixed(1) + "M";

  return "N" + price.toLocaleString();

}



function PropertyThumb({ type, image }: { type: string; image: string|null }) {

  const img = PROPERTY_IMAGES[type] || PROPERTY_IMAGES["Flat"];

  if (image) {

    return (

      <div style={{position:"relative",minHeight:"160px",overflow:"hidden"}}>

        <img src={image} alt={type} style={{width:"100%",height:"160px",objectFit:"cover"}} />

        <div style={{position:"absolute",bottom:"8px",left:"8px",background:"rgba(0,0,0,0.5)",borderRadius:"4px",padding:"2px 8px",fontSize:"11px",color:"white",fontWeight:"500"}}>{type}</div>

      </div>

    );

  }

  return (

    <div style={{background:img.grad,display:"flex",alignItems:"center",justifyContent:"center",minHeight:"160px",position:"relative",overflow:"hidden",flexDirection:"column",gap:"6px"}}>

      <span style={{fontSize:"36px",lineHeight:1}}>{img.icon}</span>

      <span style={{fontSize:"10px",color:"rgba(255,255,255,0.6)",letterSpacing:"1px",textTransform:"uppercase"}}>{type}</span>

    </div>

  );

}



function SearchContent() {

  const searchParams = useSearchParams();

  const router = useRouter();

  const [selectedState, setSelectedState] = useState(searchParams.get("state") || "Lagos");

  const [selectedLGA, setSelectedLGA] = useState(searchParams.get("lga") || "");

  const [selectedCity, setSelectedCity] = useState(searchParams.get("city") || "");

  const [selectedType, setSelectedType] = useState(searchParams.get("type") || "");

  const [selectedTitle, setSelectedTitle] = useState(searchParams.get("title") || "");

  const [verifiedOnly, setVerifiedOnly] = useState(searchParams.get("verified") === "true");

  const [sortBy, setSortBy] = useState("newest");

  const [properties, setProperties] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [savedIds, setSavedIds] = useState<string[]>([]);



  const states = Object.keys(STATES_LGAS).sort();

  const lgas = STATES_LGAS[selectedState] || [];

  const cities = STATES_CITIES[selectedState] || ["All Cities"];



  const fetchProperties = async () => {

    setLoading(true);

    setError("");

    try {

      const params = new URLSearchParams();

      if (selectedState) params.set("state", selectedState);

      if (selectedLGA) params.set("lga", selectedLGA);

      if (selectedCity) params.set("city", selectedCity);

      if (selectedType) params.set("type", selectedType);

      if (selectedTitle) params.set("title_type", selectedTitle);

      if (verifiedOnly) params.set("verified", "true");

      params.set("limit", "50");



      const token = sessionStorage.getItem("access_token");

      const headers: Record<string, string> = {};

      if (token) headers["Authorization"] = `Bearer ${token}`;



      const res = await fetch(`${API}/properties?${params.toString()}`, { headers });

      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();

      setProperties(Array.isArray(data) ? data : data.properties || []);

    } catch (e) {

      setError("Could not load properties. Please try again.");

      setProperties([]);

    } finally {

      setLoading(false);

    }

  };



  useEffect(() => {

    fetchProperties();

  }, [selectedState, selectedLGA, selectedCity, selectedType, selectedTitle, verifiedOnly]);



  const sorted = [...properties].sort((a, b) => {

    if (sortBy === "price_asc") return a.price - b.price;

    if (sortBy === "price_desc") return b.price - a.price;

    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();

  });



  const handleSave = (id: string) => {

    setSavedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  };



  return (

    <div style={{fontFamily:"system-ui,sans-serif",minHeight:"100vh",background:"#f5f5f5"}}>

      <div style={{background:"#0A5C3F",padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:10}}>

        <span onClick={() => router.push("/")} style={{color:"white",fontSize:"18px",fontWeight:"600",cursor:"pointer"}}>

          Land<span style={{color:"#FAC775"}}>Verify</span>

        </span>

        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>

          <span style={{color:"rgba(255,255,255,0.7)",fontSize:"13px"}}>

            {loading ? "Searching..." : `${sorted.length} listing${sorted.length !== 1 ? "s" : ""} found`}

          </span>

          <span onClick={() => router.push("/map")}

            style={{background:"rgba(255,255,255,0.15)",color:"white",borderRadius:"6px",padding:"5px 12px",fontSize:"12px",cursor:"pointer"}}>

            Map View

          </span>

        </div>

      </div>



      <div style={{display:"flex",flexDirection:"column",minHeight:"calc(100vh - 50px)"}}>

        {/* Filters sidebar */}

        <div style={{background:"white",borderRight:"1px solid #eee",padding:"20px",overflowY:"auto"}}>

          <h3 style={{fontSize:"14px",fontWeight:"600",color:"#333",marginBottom:"16px"}}>Filter Properties</h3>



          <div style={{marginBottom:"14px"}}>

            <label style={{fontSize:"11px",color:"#888",textTransform:"uppercase",letterSpacing:"0.5px",display:"block",marginBottom:"6px"}}>City</label>

            <select value={selectedCity} onChange={e => setSelectedCity(e.target.value === "All Cities" ? "" : e.target.value)}

              style={{width:"100%",background:"#f8f8f8",border:"1px solid #e8e8e8",borderRadius:"8px",padding:"9px 12px",fontSize:"13px"}}>

              {cities.map(c => <option key={c} value={c === "All Cities" ? "" : c}>{c}</option>)}

            </select>

          </div>



          <div style={{marginBottom:"14px"}}>

            <label style={{fontSize:"11px",color:"#888",textTransform:"uppercase",letterSpacing:"0.5px",display:"block",marginBottom:"6px"}}>State</label>

            <select value={selectedState} onChange={e => { setSelectedState(e.target.value); setSelectedLGA(""); setSelectedCity(""); }}

              style={{width:"100%",background:"#f8f8f8",border:"1px solid #e8e8e8",borderRadius:"8px",padding:"9px 12px",fontSize:"13px"}}>

              {states.map(s => <option key={s} value={s}>{s}</option>)}

            </select>

          </div>



          <div style={{marginBottom:"14px"}}>

            <label style={{fontSize:"11px",color:"#888",textTransform:"uppercase",letterSpacing:"0.5px",display:"block",marginBottom:"6px"}}>LGA ({lgas.length})</label>

            <select value={selectedLGA} onChange={e => setSelectedLGA(e.target.value)}

              style={{width:"100%",background:"#f8f8f8",border:"1px solid #e8e8e8",borderRadius:"8px",padding:"9px 12px",fontSize:"13px"}}>

              <option value="">All LGAs</option>

              {lgas.map(l => <option key={l} value={l}>{l}</option>)}

            </select>

          </div>



          <div style={{marginBottom:"14px"}}>

            <label style={{fontSize:"11px",color:"#888",textTransform:"uppercase",letterSpacing:"0.5px",display:"block",marginBottom:"6px"}}>Property Type</label>

            <select value={selectedType} onChange={e => setSelectedType(e.target.value)}

              style={{width:"100%",background:"#f8f8f8",border:"1px solid #e8e8e8",borderRadius:"8px",padding:"9px 12px",fontSize:"13px"}}>

              <option value="">All types</option>

              {["Flat","Detached House","Semi-Detached","Land","Bungalow","Duplex","Commercial"].map(t => <option key={t} value={t}>{t}</option>)}

            </select>

          </div>



          <div style={{marginBottom:"14px"}}>

            <label style={{fontSize:"11px",color:"#888",textTransform:"uppercase",letterSpacing:"0.5px",display:"block",marginBottom:"6px"}}>Title Type</label>

            <select value={selectedTitle} onChange={e => setSelectedTitle(e.target.value)}

              style={{width:"100%",background:"#f8f8f8",border:"1px solid #e8e8e8",borderRadius:"8px",padding:"9px 12px",fontSize:"13px"}}>

              <option value="">All titles</option>

              {["C of O","R of O","Gazetted","Deed of Assignment","Governor's Consent"].map(t => <option key={t} value={t}>{t}</option>)}

            </select>

          </div>



          <div onClick={() => setVerifiedOnly(!verifiedOnly)}

            style={{display:"flex",alignItems:"center",gap:"10px",background:verifiedOnly?"#E1F5EE":"#f8f8f8",border:"1px solid "+(verifiedOnly?"rgba(29,158,117,0.3)":"#e8e8e8"),borderRadius:"8px",padding:"12px",cursor:"pointer",marginBottom:"14px"}}>

            <div style={{width:"36px",height:"20px",background:verifiedOnly?"#1D9E75":"#ccc",borderRadius:"10px",position:"relative",flexShrink:0}}>

              <div style={{width:"14px",height:"14px",background:"white",borderRadius:"50%",position:"absolute",top:"3px",left:verifiedOnly?"19px":"3px",transition:"left 0.2s"}}></div>

            </div>

            <div>

              <strong style={{display:"block",fontSize:"12px",color:verifiedOnly?"#0A5C3F":"#555"}}>Verified only</strong>

              <span style={{fontSize:"11px",color:"#888"}}>Registry-confirmed titles</span>

            </div>

          </div>



          <button onClick={() => { setSelectedState("Lagos"); setSelectedLGA(""); setSelectedCity(""); setSelectedType(""); setSelectedTitle(""); setVerifiedOnly(false); }}

            style={{width:"100%",background:"none",border:"1px solid #ddd",borderRadius:"8px",padding:"9px",fontSize:"13px",color:"#666",cursor:"pointer"}}>

            Reset filters

          </button>

        </div>



        {/* Results */}

        <div style={{padding:"20px",overflowY:"auto"}}>

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>

            <h2 style={{fontSize:"15px",fontWeight:"600",color:"#333"}}>

              {loading ? "Searching..." : sorted.length === 0 ? "No properties found" : `${sorted.length} ${sorted.length===1?"property":"properties"} in ${selectedCity || selectedLGA || selectedState}`}

            </h2>

            <select value={sortBy} onChange={e => setSortBy(e.target.value)}

              style={{background:"white",border:"1px solid #e8e8e8",borderRadius:"8px",padding:"7px 12px",fontSize:"13px",color:"#555"}}>

              <option value="newest">Newest first</option>

              <option value="price_asc">Price: Low to High</option>

              <option value="price_desc">Price: High to Low</option>

            </select>

          </div>



          {loading ? (

            <div style={{textAlign:"center",padding:"60px 20px",background:"white",borderRadius:"12px",border:"1px solid #eee"}}>

              <div style={{fontSize:"32px",marginBottom:"12px"}}>...</div>

              <p style={{color:"#888",fontSize:"14px"}}>Loading properties...</p>

            </div>

          ) : error ? (

            <div style={{textAlign:"center",padding:"40px",background:"white",borderRadius:"12px",border:"1px solid #eee"}}>

              <p style={{color:"#C62828",fontSize:"14px"}}>{error}</p>

              <button onClick={fetchProperties} style={{marginTop:"12px",background:"#0A5C3F",color:"white",border:"none",borderRadius:"8px",padding:"9px 20px",fontSize:"13px",cursor:"pointer"}}>Try again</button>

            </div>

          ) : sorted.length === 0 ? (

            <div style={{textAlign:"center",padding:"60px 20px",background:"white",borderRadius:"12px",border:"1px solid #eee"}}>

              <div style={{fontSize:"48px",marginBottom:"16px"}}></div>

              <h3 style={{fontSize:"16px",fontWeight:"600",color:"#333",marginBottom:"8px"}}>No properties found</h3>

              <p style={{fontSize:"13px",color:"#888",marginBottom:"20px",lineHeight:"1.6"}}>No properties match your search. Try adjusting your filters or check back later as agents add new listings.</p>

              <div style={{display:"flex",gap:"10px",justifyContent:"center",flexWrap:"wrap"}}>

                {verifiedOnly && <button onClick={() => setVerifiedOnly(false)} style={{background:"#0A5C3F",color:"white",border:"none",borderRadius:"8px",padding:"9px 16px",fontSize:"13px",cursor:"pointer"}}>Show all listings</button>}

                {selectedLGA && <button onClick={() => setSelectedLGA("")} style={{background:"#f0f0f0",color:"#333",border:"none",borderRadius:"8px",padding:"9px 16px",fontSize:"13px",cursor:"pointer"}}>Search all of {selectedState}</button>}

                <button onClick={() => { setSelectedState("Lagos"); setSelectedLGA(""); setSelectedCity(""); setSelectedType(""); setVerifiedOnly(false); }} style={{background:"#f0f0f0",color:"#333",border:"none",borderRadius:"8px",padding:"9px 16px",fontSize:"13px",cursor:"pointer"}}>Reset all</button>

              </div>

            </div>

          ) : (

            <div style={{display:"grid",gap:"16px"}}>

              {sorted.map(p => (

                <div key={p.id} style={{background:"white",borderRadius:"12px",border:"1px solid #eee",overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.04)",cursor:"pointer"}}

                  onMouseEnter={e => (e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.1)")}

                  onMouseLeave={e => (e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,0.04)")}>

                  <div style={{display:"grid",gridTemplateColumns:"200px 1fr"}}>

                    <PropertyThumb type={p.type} image={p.image || null} />

                    <div style={{padding:"16px"}}>

                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"6px"}}>

                        <h3 style={{fontSize:"15px",fontWeight:"600",color:"#222",margin:0,flex:1,paddingRight:"12px"}}>{p.title}</h3>

                        <div style={{display:"flex",gap:"6px",flexShrink:0}}>

                          {p.verification_status === "fully_verified" && (

                            <span style={{fontSize:"10px",fontWeight:"500",background:"#E1F5EE",color:"#0A5C3F",borderRadius:"4px",padding:"3px 7px"}}>Verified</span>

                          )}

                          <span style={{fontSize:"10px",fontWeight:"500",background:RISK_COLORS[p.risk_score || "low"].bg,color:RISK_COLORS[p.risk_score || "low"].color,borderRadius:"4px",padding:"3px 7px"}}>

                            {RISK_COLORS[p.risk_score || "low"].label}

                          </span>

                        </div>

                      </div>

                      <p style={{fontSize:"13px",color:"#888",margin:"0 0 8px"}}>

                        {p.area && `${p.area}, `}{p.lga}, {p.state}

                      </p>

                      <div style={{display:"flex",gap:"12px",marginBottom:"10px",flexWrap:"wrap"}}>

                        {p.bedrooms > 0 && <span style={{fontSize:"12px",color:"#555"}}>{p.bedrooms} bed</span>}

                        {p.bathrooms > 0 && <span style={{fontSize:"12px",color:"#555"}}>{p.bathrooms} bath</span>}

                        {p.size_sqm && <span style={{fontSize:"12px",color:"#555"}}>{p.size_sqm} sqm</span>}

                        {p.title_type && <span style={{fontSize:"12px",color:"#555"}}>{p.title_type.replace(/_/g," ")}</span>}

                      </div>

                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>

                        <div>

                          <span style={{fontSize:"20px",fontWeight:"700",color:"#0A5C3F"}}>{formatPrice(p.price)}</span>

                          <span style={{fontSize:"12px",color:"#888",marginLeft:"6px"}}>{p.purpose === "rent" ? "/yr" : p.purpose === "shortlet" ? "/night" : ""}</span>

                        </div>

                        <div style={{display:"flex",gap:"8px"}}>

                          <button onClick={() => handleSave(p.id)}

                            style={{background:savedIds.includes(p.id)?"#E1F5EE":"#f0f0f0",color:savedIds.includes(p.id)?"#0A5C3F":"#555",border:"none",borderRadius:"8px",padding:"8px 14px",fontSize:"13px",cursor:"pointer"}}>

                            {savedIds.includes(p.id) ? "Saved" : "Save"}

                          </button>

                          <button onClick={() => router.push(`/property/${p.id}`)}

                            style={{background:"#0A5C3F",color:"white",border:"none",borderRadius:"8px",padding:"8px 16px",fontSize:"13px",fontWeight:"500",cursor:"pointer"}}>

                            View

                          </button>

                        </div>

                      </div>

                      {p.agent_name && (

                        <div style={{marginTop:"8px",paddingTop:"8px",borderTop:"1px solid #f0f0f0",display:"flex",alignItems:"center",gap:"6px"}}>

                          <div style={{width:"24px",height:"24px",borderRadius:"50%",background:"#E1F5EE",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",fontWeight:"600",color:"#0A5C3F"}}>

                            {p.agent_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}

                          </div>

                          <span style={{fontSize:"12px",color:"#666"}}>{p.agent_name}</span>

                          {p.agent_kyc_verified && <span style={{fontSize:"10px",color:"#0A5C3F",background:"#E1F5EE",padding:"2px 6px",borderRadius:"4px"}}>KYC Verified</span>}

                        </div>

                      )}

                    </div>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

      </div>

    </div>

  );

}



export default function SearchPage() {

  return (

    <Suspense fallback={<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",fontFamily:"system-ui"}}>Loading...</div>}>

      <SearchContent />

    </Suspense>

  );

}



