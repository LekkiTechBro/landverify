"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

const API = (process.env.NEXT_PUBLIC_API_URL || "https://landverify-production.up.railway.app/api/v1");

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    if (diffDays === 1) return "Yesterday";
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  } catch { return ""; }
}

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedRoom = searchParams.get("room");

  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [showRooms, setShowRooms] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<any>(null);

  const token = typeof window !== "undefined" ? sessionStorage.getItem("access_token") : null;

  useEffect(() => {
    if (!token) { router.push("/auth/login"); return; }
    // Get current user
    fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setUserId(data.id); setUserName(data.full_name); })
      .catch(() => {});
    // Load rooms
    loadRooms();
  }, []);

  useEffect(() => {
    if (preselectedRoom && rooms.length > 0) {
      const room = rooms.find(r => r.id === preselectedRoom);
      if (room) selectRoom(room);
    }
  }, [preselectedRoom, rooms]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Poll for new messages every 3 seconds
  useEffect(() => {
    if (selectedRoom) {
      pollRef.current = setInterval(() => {
        loadMessages(selectedRoom.id, false);
      }, 3000);
    }
    return () => clearInterval(pollRef.current);
  }, [selectedRoom]);

  const loadRooms = async () => {
    try {
      const res = await fetch(`${API}/chat/rooms`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setRooms(data.rooms || []);
    } catch {} finally { setLoading(false); }
  };

  const loadMessages = async (roomId: string, showLoading = true) => {
    try {
      const res = await fetch(`${API}/chat/rooms/${roomId}/messages`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setMessages(data.messages || []);
      if (showLoading) {
        setSelectedRoom((prev: any) => prev ? { ...prev, property_title: data.property_title, other_user_name: data.other_user_name } : prev);
      }
    } catch {}
  };

  const selectRoom = async (room: any) => {
    setSelectedRoom(room);
    setShowRooms(false);
    await loadMessages(room.id);
    // Mark as read in rooms list
    setRooms(prev => prev.map(r => r.id === room.id ? { ...r, unread_count: 0 } : r));
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom || sending) return;
    setSending(true);
    const content = newMessage.trim();
    setNewMessage("");

    // Optimistic update
    const tempMsg = {
      id: `temp-${Date.now()}`,
      content,
      sender_id: userId,
      is_mine: true,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      await fetch(`${API}/chat/rooms/${selectedRoom.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ room_id: selectedRoom.id, content }),
      });
      await loadMessages(selectedRoom.id, false);
      await loadRooms();
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  };

  const initials = (name: string) => name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "??";

  return (
    <div style={{ fontFamily: "system-ui,sans-serif", height: "100vh", display: "flex", flexDirection: "column", background: "#f5f5f5" }}>

      {/* Header */}
      <div style={{ background: "#0A5C3F", padding: "14px 20px", display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
        {!showRooms && (
          <button onClick={() => setShowRooms(true)}
            style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white", borderRadius: "6px", padding: "6px 12px", fontSize: "13px", cursor: "pointer" }}>
            Back
          </button>
        )}
        <span onClick={() => router.push("/")} style={{ color: "white", fontSize: "18px", fontWeight: "600", cursor: "pointer" }}>
          Land<span style={{ color: "#FAC775" }}>Verify</span>
        </span>
        <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>
          {selectedRoom && !showRooms ? selectedRoom.property_title || "Chat" : "Messages"}
        </span>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Rooms list */}
        <div style={{ width: showRooms ? "100%" : "0", minWidth: showRooms ? "280px" : "0", background: "white", borderRight: "1px solid #eee", display: "flex", flexDirection: "column", overflow: "hidden", transition: "width 0.2s" }}>
          <div style={{ padding: "16px", borderBottom: "1px solid #f0f0f0" }}>
            <h2 style={{ fontSize: "15px", fontWeight: "600", color: "#333", margin: 0 }}>
              Conversations {rooms.length > 0 && `(${rooms.length})`}
            </h2>
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {loading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#888", fontSize: "13px" }}>Loading...</div>
            ) : rooms.length === 0 ? (
              <div style={{ padding: "40px 24px", textAlign: "center" }}>
                <div style={{ fontSize: "40px", marginBottom: "12px", color: "#ccc" }}>ðŸ’¬</div>
                <p style={{ fontSize: "14px", color: "#888", marginBottom: "16px" }}>No conversations yet.</p>
                <button onClick={() => router.push("/search")}
                  style={{ background: "#0A5C3F", color: "white", border: "none", borderRadius: "8px", padding: "9px 18px", fontSize: "13px", cursor: "pointer" }}>
                  Browse Properties
                </button>
              </div>
            ) : rooms.map(room => (
              <div key={room.id} onClick={() => selectRoom(room)}
                style={{ padding: "14px 16px", borderBottom: "1px solid #f5f5f5", cursor: "pointer", background: selectedRoom?.id === room.id ? "#f0f9f5" : "white", display: "flex", gap: "12px", alignItems: "center" }}
                onMouseEnter={e => { if (selectedRoom?.id !== room.id) e.currentTarget.style.background = "#fafafa"; }}
                onMouseLeave={e => { if (selectedRoom?.id !== room.id) e.currentTarget.style.background = "white"; }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#E1F5EE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "600", color: "#0A5C3F", flexShrink: 0 }}>
                  {initials(room.other_user_name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: "#222", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {room.other_user_name}
                    </span>
                    <span style={{ fontSize: "11px", color: "#aaa", flexShrink: 0, marginLeft: "8px" }}>
                      {room.last_message_at ? formatTime(room.last_message_at) : ""}
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#888", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {room.property_title}
                  </div>
                  {room.last_message && (
                    <div style={{ fontSize: "12px", color: "#aaa", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: "2px" }}>
                      {room.last_message}
                    </div>
                  )}
                </div>
                {room.unread_count > 0 && (
                  <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#0A5C3F", color: "white", fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {room.unread_count}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Chat area */}
        {(!showRooms) && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {!selectedRoom ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#f9f9f9" }}>
                <div style={{ textAlign: "center", color: "#888" }}>
                  <div style={{ fontSize: "48px", marginBottom: "12px", color: "#ddd" }}>ðŸ’¬</div>
                  <p style={{ fontSize: "14px" }}>Select a conversation to start chatting</p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div style={{ background: "white", padding: "14px 20px", borderBottom: "1px solid #eee", display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                  <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#E1F5EE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "600", color: "#0A5C3F" }}>
                    {initials(selectedRoom.other_user_name)}
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: "600", color: "#222" }}>{selectedRoom.other_user_name}</div>
                    <div style={{ fontSize: "12px", color: "#888" }}>{selectedRoom.property_title}</div>
                  </div>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "8px", background: "#f9f9f9" }}>
                  {messages.length === 0 ? (
                    <div style={{ textAlign: "center", color: "#aaa", fontSize: "13px", marginTop: "40px" }}>
                      No messages yet. Send the first message!
                    </div>
                  ) : messages.map(msg => (
                    <div key={msg.id} style={{ display: "flex", justifyContent: msg.is_mine ? "flex-end" : "flex-start" }}>
                      {!msg.is_mine && (
                        <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#E1F5EE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "600", color: "#0A5C3F", marginRight: "8px", flexShrink: 0, alignSelf: "flex-end" }}>
                          {initials(selectedRoom.other_user_name)}
                        </div>
                      )}
                      <div style={{ maxWidth: "70%" }}>
                        <div style={{
                          background: msg.is_mine ? "#0A5C3F" : "white",
                          color: msg.is_mine ? "white" : "#333",
                          borderRadius: msg.is_mine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                          padding: "10px 14px",
                          fontSize: "14px",
                          lineHeight: "1.5",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                          border: msg.is_mine ? "none" : "1px solid #eee",
                        }}>
                          {msg.content}
                        </div>
                        <div style={{ fontSize: "11px", color: "#aaa", marginTop: "3px", textAlign: msg.is_mine ? "right" : "left", paddingLeft: msg.is_mine ? "0" : "4px" }}>
                          {formatTime(msg.created_at)}
                          {msg.is_mine && msg.read_at && " Â· Read"}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message input */}
                <div style={{ background: "white", padding: "12px 16px", borderTop: "1px solid #eee", display: "flex", gap: "10px", alignItems: "flex-end", flexShrink: 0 }}>
                  <textarea
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder="Type a message... (Enter to send)"
                    rows={1}
                    style={{ flex: 1, border: "1px solid #e8e8e8", borderRadius: "20px", padding: "10px 16px", fontSize: "14px", outline: "none", resize: "none", background: "#f8f8f8", maxHeight: "120px", fontFamily: "system-ui" }}
                  />
                  <button onClick={sendMessage} disabled={sending || !newMessage.trim()}
                    style={{ background: sending || !newMessage.trim() ? "#ccc" : "#0A5C3F", color: "white", border: "none", borderRadius: "50%", width: "42px", height: "42px", cursor: sending || !newMessage.trim() ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "18px" }}>
                    {sending ? "..." : "â†’"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>Loading...</div>}>
      <ChatContent />
    </Suspense>
  );
}


