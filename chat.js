const config = window.CHAT_CONFIG;

const supabaseClient = window.supabase.createClient(
  config.supabaseUrl,
  config.supabaseAnonKey
);

const params = new URLSearchParams(window.location.search);
const roomId = params.get("room_id");

const messagesElement = document.getElementById("messages");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");

function getGuestId() {
  let guestId = localStorage.getItem("guest_id");

  if (!guestId) {
    guestId =
      window.crypto && crypto.randomUUID
        ? crypto.randomUUID()
        : `guest-${Date.now()}-${Math.random()}`;

    localStorage.setItem("guest_id", guestId);
  }

  return guestId;
}

const guestId = getGuestId();

if (!roomId) {
  alert("채팅방 정보가 없습니다.");
  window.location.href = "index.html";
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

function addMessageToScreen(message) {
  const messageElement = document.createElement("div");

  const isMine = message.sender_id === guestId;

  messageElement.className = isMine
    ? "message mine"
    : "message";

  messageElement.innerHTML = escapeHtml(message.content);

  messagesElement.appendChild(messageElement);
  messagesElement.scrollTop = messagesElement.scrollHeight;
}

async function loadMessages() {
  const { data, error } = await supabaseClient
    .from("messages")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("메시지 불러오기 실패:", error);
    return;
  }

  messagesElement.innerHTML = "";

  data.forEach((message) => {
    addMessageToScreen(message);
  });
}

async function sendMessage(content) {
  const text = content.trim();

  if (!text) return;

  const { error } = await supabaseClient
    .from("messages")
    .insert({
      room_id: roomId,
      sender_id: guestId,
      content: text
    });

  if (error) {
    console.error("메시지 전송 실패:", error);
    alert(`메시지를 보내지 못했습니다.\n${error.message}`);
    return;
  }

  messageInput.value = "";
}

messageForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  await sendMessage(messageInput.value);
});

function subscribeToMessages() {
  supabaseClient
    .channel(`room-${roomId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `room_id=eq.${roomId}`
      },
      (payload) => {
        addMessageToScreen(payload.new);
      }
    )
    .subscribe((status) => {
      console.log("채팅 Realtime 상태:", status);
    });
}

loadMessages();
subscribeToMessages();
