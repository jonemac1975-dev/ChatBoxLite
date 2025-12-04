document.addEventListener("DOMContentLoaded", () => {
  const chatBody = document.getElementById("messages");
  const chatInput = document.getElementById("input");
  const sendBtn = document.getElementById("send");

  // URL Worker của bạn
  const WORKER_URL = "https://bold-firefly-c9fc.jonemac1975.workers.dev/";

  if (!chatBody || !chatInput || !sendBtn) {
    console.error("❌ LỖI: ID trong HTML không tồn tại!");
    return;
  }

  // Hiển thị tin nhắn
  function appendMessage(role, text) {
    const msg = document.createElement("div");
    msg.className = `msg ${role}`;
    msg.textContent = text;
    chatBody.appendChild(msg);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  // Hiển thị đang trả lời
  function appendTyping() {
    const msg = document.createElement("div");
    msg.className = "msg bot typing";
    msg.textContent = "Đang trả lời...";
    chatBody.appendChild(msg);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function removeTyping() {
    const typing = document.querySelector(".typing");
    if (typing) typing.remove();
  }

  // Gửi tin nhắn
  async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    appendMessage("user", text);
    chatInput.value = "";
    appendTyping();

    try {
      const res = await fetch(WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: text }] })
      });

      console.log("Fetch status:", res.status);

      const data = await res.json();
      console.log("API raw data:", data);

      removeTyping();

      // Lấy reply từ Worker
      const reply = data?.reply || "⚠️ Không nhận được trả lời từ AI.";
      appendMessage("bot", reply);

    } catch (error) {
      console.error("API Error:", error);
      removeTyping();
      appendMessage("bot", "⚠️ Lỗi kết nối API (CORS/Network).");
    }
  }

  // Enter gửi, Shift+Enter xuống dòng
  chatInput.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Ngăn xuống dòng
      sendMessage();      // Gửi tin nhắn
    }
    // Shift+Enter → xuống dòng bình thường
  });

  // Click button gửi
  sendBtn.addEventListener("click", sendMessage);
});
