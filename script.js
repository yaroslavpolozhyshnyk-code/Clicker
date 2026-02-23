/* ================================
   MOPE ULTRA
================================ */

const API_KEY = "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";
const MODEL = "llama-3.1-8b-instant";
const STORAGE_KEY = "MOPE";

let data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
  user: { name: null },
  chats: {},
  currentChat: null
};

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/* ================================
   CHAT SYSTEM
================================ */

function createChat() {
  const id = "chat_" + Date.now();
  data.chats[id] = {
    name: "Nowy czat",
    messages: [],
    summary: ""
  };
  data.currentChat = id;
  save();
  renderChatList();
  renderMessages();
}

function switchChat(id) {
  data.currentChat = id;
  renderMessages();
  save();
}

function deleteChat(id) {
  if (!confirm("Usunąć czat?")) return;
  delete data.chats[id];
  const keys = Object.keys(data.chats);
  data.currentChat = keys[0] || null;
  if (!data.currentChat) createChat();
  save();
  renderChatList();
  renderMessages();
}

function renameChat(id) {
  const name = prompt("Nowa nazwa:", data.chats[id].name);
  if (!name) return;
  data.chats[id].name = name;
  save();
  renderChatList();
}

/* ================================
   RENDER
================================ */

function renderChatList() {
  const list = document.getElementById("chatList");
  list.innerHTML = "";

  Object.keys(data.chats).forEach(id => {
    const item = document.createElement("div");
    item.className = "chat-item";
    item.onclick = () => switchChat(id);

    item.innerHTML = `
      <span>${data.chats[id].name}</span>
      <div>
        <button onclick="event.stopPropagation(); renameChat('${id}')">✏</button>
        <button onclick="event.stopPropagation(); deleteChat('${id}')">🗑</button>
      </div>
    `;

    list.appendChild(item);
  });
}

function renderMessages() {
  const chat = document.getElementById("chat");
  chat.innerHTML = "";

  const messages = data.chats[data.currentChat]?.messages || [];

  messages.forEach(msg => {
    const div = document.createElement("div");
    div.className = "message " + msg.role;

    div.innerHTML = `<div class="bubble">${formatMessage(msg.content)}</div>`;

    chat.appendChild(div);
  });

  chat.scrollTop = chat.scrollHeight;
}

/* ================================
   FORMATOWANIE KODU
================================ */

function formatMessage(text) {

  // kod ```
  text = text.replace(/```([\s\S]*?)```/g, function(match, code) {
    return `
      <div class="code-block">
        <button onclick="copyCode(this)">📋</button>
        <pre>${escapeHTML(code)}</pre>
      </div>
    `;
  });

  return escapeHTML(text).replace(/\n/g, "<br>");
}

function copyCode(btn) {
  const code = btn.nextElementSibling.innerText;
  navigator.clipboard.writeText(code);
  btn.innerText = "✔";
  setTimeout(() => btn.innerText = "📋", 1000);
}

/* ================================
   PLUGINS
================================ */

function runPlugin(text) {

  // kalkulator
  if (/^[0-9+\-*/ ().]+$/.test(text)) {
    try {
      return "Wynik: " + eval(text);
    } catch {
      return null;
    }
  }

  // data
  if (text.toLowerCase().includes("data")) {
    return "Dzisiejsza data: " + new Date().toLocaleString();
  }

  return null;
}

/* ================================
   SEND
================================ */

let sending = false;

async function send() {

  if (sending) return;

  const input = document.getElementById("input");
  const text = input.value.trim();
  if (!text) return;

  sending = true;
  input.value = "";

  const chat = data.chats[data.currentChat];

  chat.messages.push({ role: "user", content: text });
  renderMessages();
  save();

  // plugin?
  const pluginResult = runPlugin(text);
  if (pluginResult) {
    chat.messages.push({ role: "assistant", content: pluginResult });
    renderMessages();
    save();
    sending = false;
    return;
  }

  chat.messages.push({ role: "assistant", content: "" });
  renderMessages();

  try {

    const lastMessages = chat.messages.slice(-20);

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: "Jesteś inteligentnym, naturalnym asystentem." },
            ...lastMessages
          ],
          temperature: 0.7
        })
      }
    );

    const result = await response.json();

    let reply = result?.choices?.[0]?.message?.content || "Błąd odpowiedzi.";

    await typeEffect(chat, reply);

    // auto nazwa czatu po pierwszej wiadomości
    if (chat.messages.length === 2) {
      chat.name = text.substring(0, 25);
      renderChatList();
    }

  } catch (err) {

    chat.messages[chat.messages.length - 1].content = "Błąd połączenia.";
  }

  renderMessages();
  save();
  sending = false;
}

/* ================================
   TYPING EFFECT
================================ */

async function typeEffect(chat, text) {

  let message = chat.messages[chat.messages.length - 1];

  for (let i = 0; i < text.length; i++) {
    message.content += text[i];
    renderMessages();
    await new Promise(r => setTimeout(r, 10));
  }
}

/* ================================
   EKSPORT
================================ */

function exportChat() {
  const chat = data.chats[data.currentChat];
  let content = chat.messages.map(m => `${m.role}: ${m.content}`).join("\n\n");

  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = chat.name + ".txt";
  a.click();

  URL.revokeObjectURL(url);
}

/* ================================
   SECURITY
================================ */

function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* ================================
   INIT
================================ */

document.addEventListener("keydown", e => {
  if (e.key === "Enter") send();
});

if (!data.currentChat) createChat();

renderChatList();
renderMessages();
