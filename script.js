/* =========================
   ⚙️ KONFIG
========================= */

const API_KEY = "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";
const MODEL = "llama-3.1-8b-instant";

const AI_NAME = "Mope";

let aiMood = "neutralny"; // zmienia się dynamicznie

/* =========================
   💾 DANE
========================= */

let chats = JSON.parse(localStorage.getItem("mopeChats")) || {};
let memories = JSON.parse(localStorage.getItem("mopeMemory")) || {};
let currentChatId = localStorage.getItem("mopeCurrentChat");

if (!currentChatId || !chats[currentChatId]) {
  createNewChat();
}

function saveAll() {
  localStorage.setItem("mopeChats", JSON.stringify(chats));
  localStorage.setItem("mopeCurrentChat", currentChatId);
  localStorage.setItem("mopeMemory", JSON.stringify(memories));
}

/* =========================
   📚 WIKIPEDIA ENGINE
========================= */

async function searchWikipedia(query) {
  try {
    const res = await fetch(
      `https://pl.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`
    );

    if (!res.ok) return null;

    const data = await res.json();
    if (!data.extract) return null;

    return data.extract.slice(0, 1000);

  } catch {
    return null;
  }
}

function shouldUseWiki(text) {
  const keywords = ["co to", "kim jest", "kto to", "definicja", "wyjaśnij"];
  return keywords.some(k => text.toLowerCase().includes(k));
}

/* =========================
   🧠 MEMORY
========================= */

function updateMemory(text) {
  if (!memories.longTerm) memories.longTerm = [];

  if (text.length < 120) {
    memories.longTerm.push(text);
    memories.longTerm = memories.longTerm.slice(-25);
  }

  saveAll();
}

function getMemoryContext() {
  if (!memories.longTerm) return "";
  return "Ważne informacje o użytkowniku: " + memories.longTerm.join(" | ");
}

/* =========================
   ❤️ EMOTION + MOOD
========================= */

async function detectEmotion(message) {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: "Podaj emocję użytkownika w 1 słowie." },
          { role: "user", content: message }
        ],
        max_tokens: 10
      })
    });

    const data = await response.json();
    const emotion = data.choices[0].message.content.trim();

    // AI mood adaptation
    if (emotion.includes("smutek")) aiMood = "wspierający";
    else if (emotion.includes("złość")) aiMood = "spokojny";
    else if (emotion.includes("radość")) aiMood = "entuzjastyczny";
    else aiMood = "neutralny";

    return emotion;

  } catch {
    return "neutralna";
  }
}

/* =========================
   💬 CHAT
========================= */

function createNewChat() {
  const id = "chat_" + Date.now();
  chats[id] = { name: "Nowy czat", messages: [] };
  currentChatId = id;
  saveAll();
  renderChatList();
  renderMessages();
}

function renameChat(id) {
  const newName = prompt("Nowa nazwa:", chats[id].name);
  if (newName) {
    chats[id].name = newName;
    saveAll();
    renderChatList();
  }
}

function switchChat(id) {
  currentChatId = id;
  saveAll();
  renderMessages();
}

function renderChatList() {
  const list = document.getElementById("chatList");
  list.innerHTML = "";

  Object.keys(chats).forEach(id => {
    const item = document.createElement("div");
    item.className = "chat-item";
    item.onclick = () => switchChat(id);

    item.innerHTML = `
      <span>${chats[id].name}</span>
      <button onclick="event.stopPropagation(); renameChat('${id}')">✏</button>
    `;

    list.appendChild(item);
  });
}

function renderMessages() {
  const chatDiv = document.getElementById("chat");
  chatDiv.innerHTML = "";

  chats[currentChatId].messages.forEach(msg => {

    const wrapper = document.createElement("div");
    wrapper.className = "message " + msg.role;

    wrapper.innerHTML = `
      <div class="avatar">${msg.role === "assistant" ? "🤖" : "🧑"}</div>
      <div class="bubble">${msg.content.replace(/\n/g,"<br>")}</div>
    `;

    chatDiv.appendChild(wrapper);
  });

  chatDiv.scrollTop = 999999;
}

/* =========================
   🚀 SEND
========================= */

async function send() {
  const input = document.getElementById("input");
  const text = input.value.trim();
  if (!text) return;

  chats[currentChatId].messages.push({ role: "user", content: text });
  input.value = "";
  saveAll();
  renderMessages();

  const emotion = await detectEmotion(text);
  const memoryContext = getMemoryContext();

  let wikiData = null;

  if (shouldUseWiki(text)) {
    wikiData = await searchWikipedia(text.replace(/co to|kim jest|kto to/gi,""));
  }

  const systemPrompt = `
Jesteś Mope.
Twój aktualny nastrój: ${aiMood}.
Emocja użytkownika: ${emotion}.
${memoryContext}
${wikiData ? "Dane z Wikipedii: " + wikiData : ""}
Odpowiadaj inteligentnie i naturalnie.
`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          ...chats[currentChatId].messages.slice(-10)
        ],
        temperature: 0.7,
        max_tokens: 700
      })
    });

    const data = await response.json();
    const reply = data.choices[0].message.content;

    chats[currentChatId].messages.push({
      role: "assistant",
      content: reply
    });

    updateMemory(text);
    saveAll();
    renderMessages();

  } catch {
    alert("Błąd API");
  }
}

/* ========================= */

document.addEventListener("keydown", e => {
  if (e.key === "Enter") send();
});

renderChatList();
renderMessages();
