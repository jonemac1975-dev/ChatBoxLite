document.addEventListener("DOMContentLoaded", () => {
  const chatBody = document.getElementById("messages");
  const chatInput = document.getElementById("input");
  const sendBtn = document.getElementById("send");

  if (!chatBody || !chatInput || !sendBtn) {
      console.error("❌ LỖI: ID trong HTML không tồn tại!");
      return;
  }

  function appendMessage(role, text) {
      const msg = document.createElement("div");
      msg.className = `msg ${role}`;
      msg.textContent = text;
      chatBody.appendChild(msg);
      chatBody.scrollTop = chatBody.scrollHeight;
  }

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

  async function sendMessage() {
      const text = chatInput.value.trim();
      if (!text) return;

      appendMessage("user", text);
      chatInput.value = "";
      appendTyping();

      try {
          const res = await fetch("https://bold-firefly-c9fc.jonemac1975.workers.dev/", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ messages: [{ role: "user", content: text }] })
          });

          removeTyping();

          if (!res.ok) {
              appendMessage("bot", `⚠️ API trả về lỗi: ${res.status}`);
              return;
          }

          const data = await res.json();

          // Kiểm tra payload an toàn
          const reply = data?.choices?.[0]?.message?.content || data?.reply;
          if (!reply) {
              appendMessage("bot", "⚠️ Không nhận được trả lời từ AI.");
              return;
          }

          appendMessage("bot", reply);

      } catch (error) {
          console.error("API Error:", error);
          removeTyping();
          appendMessage("bot", "⚠️ Lỗi kết nối API (CORS/Network).");
      }
  }

  chatInput.addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
      }
  });

  sendBtn.addEventListener("click", sendMessage);
});
