"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

const MOCK_PROPERTY = {
  "1": { title:"3 Bedroom Flat, Lekki Phase 1", agent:"Adaeze Okonkwo", agent_initials:"AO", price:"₦45.0M" },
  "2": { title:"4 Bedroom Detached House, Maitama", agent:"Babatunde Malik", agent_initials:"BM", price:"₦120.0M" },
  "3": { title:"2 Bedroom Flat, GRA Port Harcourt", agent:"Chioma Eze", agent_initials:"CE", price:"₦25.0M" },
  "4": { title:"Land, Ibeju-Lekki", agent:"Emeka Obi", agent_initials:"EO", price:"₦8.0M" },
  "5": { title:"3 Bedroom Bungalow, Ibadan", agent:"Funke Adeyemi", agent_initials:"FA", price:"₦18.0M" },
  "6": { title:"5 Bedroom Duplex, Asokoro", agent:"Garba Musa", agent_initials:"GM", price:"₦250.0M" },
};

interface Message {
  id: string;
  sender: "client" | "agent" | "system";
  text: string;
  time: string;
  read: boolean;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: "sys-1",
    sender: "system",
    text: "🔒 This is a secure, encrypted conversation. Messages are only visible to you and the agent.",
    time: "",
    read: true,
  },
  {
    id: "agent-1",
    sender: "agent",
    text: "Hello! Thank you for your interest in this property. I'm the verified agent handling this listing. How can I help you today?",
    time: new Date(Date.now() - 60000).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"}),
    read: true,
  },
];

const QUICK_REPLIES = [
  "Is this property still available?",
  "Can I schedule a viewing?",
  "Is the price negotiable?",
  "What documents are available?",
  "What is the service charge?",
];

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;
  const property = MOCK_PROPERTY[propertyId as keyof typeof MOCK_PROPERTY];

  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const simulateAgentResponse = (userMessage: string) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const responses: Record<string, string> = {
        "available": "Yes, the property is still available! Would you like to schedule a viewing?",
        "viewing": "I can arrange a viewing for you. Are you available this weekend or would you prefer a weekday?",
        "negotiable": "The asking price is ₦45M but there is some room for negotiation for serious buyers. What's your budget?",
        "documents": "We have the C of O, Survey Plan, and Deed of Assignment — all verified. I can share copies after you complete your enquiry form.",
        "service": "The annual service charge is ₦500,000 covering security, cleaning, and generator maintenance.",
      };
      let response = "Thank you for your message. I'll get back to you shortly with more details. Is there anything specific you'd like to know about the property?";
      const lower = userMessage.toLowerCase();
      if (lower.includes("available")) response = responses["available"];
      else if (lower.includes("view")) response = responses["viewing"];
      else if (lower.includes("negoti") || lower.includes("price")) response = responses["negotiable"];
      else if (lower.includes("document")) response = responses["documents"];
      else if (lower.includes("service") || lower.includes("charge")) response = responses["service"];

      const agentMsg: Message = {
        id: `agent-${Date.now()}`,
        sender: "agent",
        text: response,
        time: new Date().toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"}),
        read: false,
      };
      setMessages(prev => [...prev, agentMsg]);
    }, 1500 + Math.random() * 1000);
  };

  const sendMessage = (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText) return;

    const newMsg: Message = {
      id: `client-${Date.now()}`,
      sender: "client",
      text: messageText,
      time: new Date().toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"}),
      read: true,
    };
    setMessages(prev => [...prev, newMsg]);
    setInput("");
    setShowQuickReplies(false);
    simulateAgentResponse(messageText);
  };

  if (!property) {
    return (
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",fontFamily:"system-ui"}}>
        <div style={{textAlign:"center"}}>
          <p>Property not found</p>
          <button onClick={() => router.push("/search")} style={{background:"#0A5C3F",color:"white",border:"none",borderRadius:"8px",padding:"10px 20px",cursor:"pointer"}}>
            Back to search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{fontFamily:"system-ui,sans-serif",height:"100vh",display:"flex",flexDirection:"column",background:"#f5f5f5"}}>

      {/* Header */}
      <div style={{background:"#0A5C3F",padding:"12px 16px",display:"flex",alignItems:"center",gap:"12px",flexShrink:0}}>
        <span onClick={() => router.back()} style={{color:"rgba(255,255,255,0.7)",fontSize:"22px",cursor:"pointer",lineHeight:1}}>←</span>
        <div style={{width:"40px",height:"40px",borderRadius:"50%",background:"#E1F5EE",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px",fontWeight:"700",color:"#0A5C3F",flexShrink:0}}>
          {property.agent_initials}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{color:"white",fontSize:"14px",fontWeight:"600",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{property.agent}</div>
          <div style={{color:"rgba(255,255,255,0.65)",fontSize:"11px",display:"flex",alignItems:"center",gap:"4px"}}>
            <span style={{width:"6px",height:"6px",borderRadius:"50%",background:"#5DCAA5",display:"inline-block"}}></span>
            Online · KYC Verified Agent
          </div>
        </div>
        <div style={{textAlign:"right",flexShrink:0}}>
          <div style={{color:"rgba(255,255,255,0.65)",fontSize:"10px"}}>Property</div>
          <div style={{color:"#FAC775",fontSize:"12px",fontWeight:"500"}}>{property.price}</div>
        </div>
      </div>

      {/* Property banner */}
      <div style={{background:"#E1F5EE",borderBottom:"1px solid rgba(10,92,63,0.15)",padding:"10px 16px",display:"flex",alignItems:"center",gap:"10px",flexShrink:0}}>
        <span style={{fontSize:"20px"}}>🏠</span>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:"12px",fontWeight:"500",color:"#0A5C3F",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{property.title}</div>
          <div style={{fontSize:"11px",color:"#888"}}>Tap to view property details</div>
        </div>
        <span onClick={() => router.push(`/property/${propertyId}`)}
          style={{fontSize:"12px",color:"#0A5C3F",fontWeight:"500",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
          View →
        </span>
      </div>

      {/* Messages */}
      <div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:"12px"}}>
        {messages.map(msg => (
          <div key={msg.id}>
            {msg.sender === "system" && (
              <div style={{textAlign:"center",padding:"8px 16px",background:"rgba(0,0,0,0.06)",borderRadius:"20px",fontSize:"11px",color:"#888",margin:"0 auto",maxWidth:"320px"}}>
                {msg.text}
              </div>
            )}

            {msg.sender === "agent" && (
              <div style={{display:"flex",gap:"8px",alignItems:"flex-end",maxWidth:"80%"}}>
                <div style={{width:"28px",height:"28px",borderRadius:"50%",background:"#E1F5EE",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:"700",color:"#0A5C3F",flexShrink:0}}>
                  {property.agent_initials}
                </div>
                <div>
                  <div style={{background:"white",borderRadius:"16px 16px 16px 4px",padding:"10px 14px",fontSize:"13px",color:"#333",boxShadow:"0 1px 3px rgba(0,0,0,0.08)",lineHeight:"1.5"}}>
                    {msg.text}
                  </div>
                  {msg.time && <div style={{fontSize:"10px",color:"#aaa",marginTop:"4px",marginLeft:"4px"}}>{msg.time}</div>}
                </div>
              </div>
            )}

            {msg.sender === "client" && (
              <div style={{display:"flex",justifyContent:"flex-end",maxWidth:"80%",marginLeft:"auto"}}>
                <div>
                  <div style={{background:"#0A5C3F",borderRadius:"16px 16px 4px 16px",padding:"10px 14px",fontSize:"13px",color:"white",lineHeight:"1.5"}}>
                    {msg.text}
                  </div>
                  <div style={{fontSize:"10px",color:"#aaa",marginTop:"4px",textAlign:"right",marginRight:"4px"}}>
                    {msg.time} · ✓✓
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div style={{display:"flex",gap:"8px",alignItems:"flex-end"}}>
            <div style={{width:"28px",height:"28px",borderRadius:"50%",background:"#E1F5EE",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:"700",color:"#0A5C3F",flexShrink:0}}>
              {property.agent_initials}
            </div>
            <div style={{background:"white",borderRadius:"16px 16px 16px 4px",padding:"12px 16px",boxShadow:"0 1px 3px rgba(0,0,0,0.08)",display:"flex",gap:"4px",alignItems:"center"}}>
              {[0,1,2].map(i => (
                <div key={i} style={{width:"6px",height:"6px",borderRadius:"50%",background:"#aaa",animation:`bounce 1s infinite ${i*0.2}s`}}></div>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick replies */}
      {showQuickReplies && (
        <div style={{padding:"8px 16px",background:"white",borderTop:"1px solid #eee",flexShrink:0}}>
          <div style={{fontSize:"11px",color:"#888",marginBottom:"8px"}}>Quick questions</div>
          <div style={{display:"flex",gap:"8px",overflowX:"auto",paddingBottom:"4px"}}>
            {QUICK_REPLIES.map(qr => (
              <button key={qr} onClick={() => sendMessage(qr)}
                style={{flexShrink:0,background:"#E1F5EE",color:"#0A5C3F",border:"1px solid rgba(10,92,63,0.2)",borderRadius:"20px",padding:"6px 12px",fontSize:"12px",cursor:"pointer",whiteSpace:"nowrap"}}>
                {qr}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div style={{background:"white",borderTop:"1px solid #eee",padding:"12px 16px",display:"flex",gap:"10px",alignItems:"flex-end",flexShrink:0}}>
        <div style={{flex:1,background:"#f8f8f8",borderRadius:"24px",padding:"10px 16px",display:"flex",alignItems:"center"}}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Type your message..."
            rows={1}
            style={{flex:1,background:"none",border:"none",outline:"none",resize:"none",fontSize:"14px",color:"#333",fontFamily:"system-ui",lineHeight:"1.4",maxHeight:"100px"}}
          />
        </div>
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim()}
          style={{width:"44px",height:"44px",borderRadius:"50%",background:input.trim()?"#0A5C3F":"#ddd",border:"none",cursor:input.trim()?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"background 0.2s"}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
