// chatbox.js — Sessions + Model select + Dark/Light theme (full)
// - Sidebar sessions (260px)
// - Select model (saved to localStorage)
// - Theme toggle (saved to localStorage)

document.addEventListener("DOMContentLoaded", () => {
  // ELEMENTS (graceful checks)
  const chatBody = document.getElementById("messages");
  const chatInput = document.getElementById("input");
  const sendBtn = document.getElementById("send");
  const btnFile = document.getElementById("btnFile");
  const fileInput = document.getElementById("fileInput");
  const newChatBtn = document.getElementById("newChat");
  const clearChatsBtn = document.getElementById("clearChats");
  const modelSelect = document.getElementById("modelSelect");
  const modelLabel = document.getElementById("modelLabel");
  const sessionsListEl = document.getElementById("sessionsList");
  const toggleThemeBtn = document.getElementById("toggleTheme");

  const WORKER_URL = "https://bold-firefly-c9fc.jonemac1975.workers.dev/";

  // STORAGE KEYS
  const SESSIONS_KEY = "chat_sessions_v2";
  const CURRENT_ID_KEY = "chat_current_id_v2";
  const MODEL_KEY = "chat_current_model_v2";
  const THEME_KEY = "chat_theme_v2";

  // SYSTEM PROMPT
  const systemPrompt = `Bạn là AI trợ lý cao cấp. Trả lời rõ ràng, chia mục, không dùng Markdown. Dùng số mục 1), 2) và gạch đầu dòng - cho ý nhỏ. Nếu output không đúng định dạng, hãy sửa lại để đúng trước khi trả về.`;

  // -------------------------
  // Helpers: load/save sessions
  // -------------------------
  function loadSessions() {
    try {
      const raw = localStorage.getItem(SESSIONS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn("Failed parse sessions", e);
      return [];
    }
  }
  function saveSessions(sessions) {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  }

  // -------------------------
  // Create / access session
  //--------------------------
  function createSession(title) {
    const id = "s_" + Date.now();
    return { id, title: title || "Chat mới", createdAt: Date.now(), updatedAt: Date.now(), messages: [] };
  }
  function getCurrentSession() {
    return sessions.find(s => s.id === currentId);
  }

  // -------------------------
  // State init
  // -------------------------
  let sessions = loadSessions();
  let currentId = localStorage.getItem(CURRENT_ID_KEY);

  if (!sessions || sessions.length === 0) {
    const s = createSession("Chat mới");
    sessions = [s];
    currentId = s.id;
    saveSessions(sessions);
    localStorage.setItem(CURRENT_ID_KEY, currentId);
  }

  if (!currentId || !sessions.find(s => s.id === currentId)) {
    currentId = sessions[0].id;
    localStorage.setItem(CURRENT_ID_KEY, currentId);
  }

  // -------------------------
  // Theme init
  // -------------------------
  const savedTheme = localStorage.getItem(THEME_KEY) || "light";
  if (savedTheme === "dark") document.body.classList.add("dark");

  function toggleTheme() {
    const isDark = document.body.classList.toggle("dark");
    localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
    if (toggleThemeBtn) toggleThemeBtn.textContent = isDark ? "🌞 Light" : "🌙 Dark";
  }
  if (toggleThemeBtn) {
    toggleThemeBtn.textContent = document.body.classList.contains("dark") ? "🌞 Light" : "🌙 Dark";
    toggleThemeBtn.addEventListener("click", toggleTheme);
  }

  // -------------------------
  // Model init
  // -------------------------
  let currentModel = localStorage.getItem(MODEL_KEY) || (modelSelect ? modelSelect.value : "gpt-4.1-mini");
  if (modelSelect) {
    modelSelect.value = currentModel;
    modelSelect.addEventListener("change", () => {
      currentModel = modelSelect.value;
      localStorage.setItem(MODEL_KEY, currentModel);
      if (modelLabel) modelLabel.textContent = currentModel;
    });
  }
  if (modelLabel) modelLabel.textContent = currentModel;

  // -------------------------
  // Render sessions list
  // -------------------------
  function renderSessionsList() {
    if (!sessionsListEl) return;
    sessionsListEl.innerHTML = "";
    sessions.forEach(s => {
      const item = document.createElement("div");
      item.className = `session-row ${s.id === currentId ? "active" : ""}`;
      item.style.cursor = "pointer";
      item.style.padding = "10px 12px";
      item.style.borderRadius = "8px";
      item.style.marginBottom = "8px";
      if (s.id === currentId) item.style.background = "#eef6ff";

      const title = document.createElement("div");
      title.className = "session-row-title";
      title.textContent = s.title.length > 36 ? s.title.slice(0, 36) + "..." : s.title;
      title.style.fontSize = "13px";
      title.style.fontWeight = "500";

      const time = document.createElement("div");
      time.className = "session-row-time";
      time.textContent = new Date(s.updatedAt).toLocaleString();
      time.style.fontSize = "11px";
      time.style.color = "#666";

      item.appendChild(title);
      item.appendChild(time);

      item.addEventListener("contextmenu", (ev) => {
        ev.preventDefault();
        const action = prompt("Nhập 'r' để đổi tên, 'd' để xóa cuộc chat:", "");
        if (!action) return;
        if (action.toLowerCase() === "r") {
          const newTitle = prompt("Tên mới:", s.title);
          if (newTitle !== null) {
            s.title = newTitle || s.title;
            s.updatedAt = Date.now();
            saveSessions(sessions);
            renderSessionsList();
          }
        } else if (action.toLowerCase() === "d") {
          if (confirm("Xóa cuộc chat này?")) deleteSession(s.id);
        }
      });

      item.addEventListener("click", () => selectSession(s.id));
      sessionsListEl.appendChild(item);
    });

    sessionsListEl.style.width = "260px";
  }

  // -------------------------
  // Append message
  // -------------------------
  function appendMessage(role, text, save = true) {
    const apiRole = role === "assistant" || role === "system" ? "assistant" : "user";
    const uiRole = apiRole === "assistant" ? "bot" : "user";

    const msg = document.createElement("div");
    msg.className = `msg ${uiRole}`;

    // Nếu là text thuần thì escape, còn HTML (như img) giữ nguyên
    if (typeof text === "string") {
      const safe = String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      msg.innerHTML = safe.replace(/\r/g, "").replace(/\n/g, "<br>");
    } else {
      // text là node (img/div) => append trực tiếp
      msg.appendChild(text);
    }

    chatBody.appendChild(msg);
    chatBody.scrollTop = chatBody.scrollHeight;

    if (save) {
      const session = getCurrentSession();
      if (!session) return;

      session.messages.push({ role: apiRole, content: typeof text === "string" ? text : "[media]" });
      session.updatedAt = Date.now();

      if ((!session.title || session.title === "Chat mới") && session.messages.length) {
        const firstUser = session.messages.find(m => m.role === "user");
        if (firstUser) {
          const t = firstUser.content.trim().split("\n")[0].slice(0, 40);
          session.title = t || session.title;
        }
      }

      if (session.messages.length > 200) session.messages = session.messages.slice(-200);

      saveSessions(sessions);
      renderSessionsList();
    }
  }

  function appendTyping() {
    const t = document.createElement("div");
    t.className = "msg bot typing";
    t.textContent = "Đang trả lời...";
    chatBody.appendChild(t);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function removeTyping() {
    const t = document.querySelector(".typing");
    if (t) t.remove();
  }

  // -------------------------
  // File processing
  //--------------------------
  async function processFile(file) {
    // Ảnh
    if (file.type.startsWith("image/")) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = function(e) {
          const img = document.createElement("img");
          img.src = e.target.result;
          img.style.maxWidth = "200px";
          img.style.borderRadius = "8px";

          appendMessage("user", img);

          resolve(`[image: ${file.name}]`);
        };
        reader.readAsDataURL(file);
      });
    }

    // PDF
    if (file.type === "application/pdf") {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = async function(e) {
          const typedarray = new Uint8Array(e.target.result);
          const pdf = await pdfjsLib.getDocument(typedarray).promise;
          let pdfText = "";

          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            pdfText += textContent.items.map(item => item.str).join(" ") + "\n\n";
          }

          appendMessage("user", `[PDF: ${file.name}]\n` + pdfText);

          resolve(pdfText);
        };
        reader.readAsArrayBuffer(file);
      });
    }

    // File khác
    appendMessage("user", `[file gửi: ${file.name}]`);
    return `[file gửi: ${file.name}]`;
  }

  // -------------------------
  // Send message
  // -------------------------
  async function sendMessage(contentOverride = null) {
    const session = getCurrentSession();
    if (!session) return;

    const text = contentOverride ?? chatInput.value.trim();
    if (!text) return;

    if (!contentOverride) appendMessage("user", text, true);
    chatInput.value = "";
    appendTyping();

    try {
      const last = session.messages.slice(-30).map(m => ({ role: m.role, content: m.content }));

      const payload = {
        model: currentModel,
        max_tokens: 2000,
        messages: [
          { role: "system", content: systemPrompt },
          ...last,
          { role: "user", content: text }
        ]
      };

      const res = await fetch(WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      removeTyping();

      const reply = data?.reply || "⚠️ Không nhận được trả lời từ AI.";
      appendMessage("assistant", reply, true);

    } catch (err) {
      removeTyping();
      appendMessage("assistant", "⚠️ Lỗi kết nối API.", true);
    }
  }

  // -------------------------
  // Session operations
  // -------------------------
  function selectSession(id) {
    const s = sessions.find(x => x.id === id);
    if (!s) return;

    currentId = id;
    localStorage.setItem(CURRENT_ID_KEY, currentId);

    chatBody.innerHTML = "";

    // FIX: render lại với role gốc (assistant/user)
    s.messages.forEach(m => {
      appendMessage(m.role, m.content, false);
    });

    renderSessionsList();
  }

  function newSession() {
    const s = createSession("Chat mới");
    sessions.unshift(s);
    currentId = s.id;

    saveSessions(sessions);
    localStorage.setItem(CURRENT_ID_KEY, currentId);

    chatBody.innerHTML = "";
    appendMessage("assistant", "Chat mới đã sẵn sàng", true);

    renderSessionsList();
  }

  function deleteSession(id) {
    const idx = sessions.findIndex(x => x.id === id);
    if (idx === -1) return;

    sessions.splice(idx, 1);
    if (sessions.length === 0) {
      const s = createSession("Chat mới");
      sessions.push(s);
    }

    if (!sessions.find(s => s.id === currentId)) currentId = sessions[0].id;

    saveSessions(sessions);
    localStorage.setItem(CURRENT_ID_KEY, currentId);

    selectSession(currentId);
  }

  function clearAllSessions() {
    sessions = [createSession("Chat mới")];
    currentId = sessions[0].id;

    saveSessions(sessions);
    localStorage.setItem(CURRENT_ID_KEY, currentId);

    chatBody.innerHTML = "";
    appendMessage("assistant", "Đã xóa toàn bộ lịch sử chat!", true);

    renderSessionsList();
  }

  // -------------------------
  // Events
  // -------------------------
  if (chatInput) {
    chatInput.addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  if (sendBtn) sendBtn.addEventListener("click", () => sendMessage());

  if (btnFile && fileInput) {
    btnFile.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", async e => {
      const file = e.target.files[0];
      if (!file) return;

      const content = await processFile(file); // trả text hoặc reference cho AI
      sendMessage(content);

      fileInput.value = "";
    });
  }

  if (newChatBtn) newChatBtn.addEventListener("click", () => newSession());
  if (clearChatsBtn) clearChatsBtn.addEventListener("click", () => clearAllSessions());

  // -------------------------
  // Init UI
  // -------------------------
  function initUI() {
    renderSessionsList();
    selectSession(currentId);
    if (modelLabel) modelLabel.textContent = currentModel;
  }

  initUI();

  window._chatbox = {
    sessions, getCurrentSession, sendMessage, newSession, deleteSession
  };
});
