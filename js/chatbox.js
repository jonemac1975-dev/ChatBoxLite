// =======================================
//           CHATBOX.JS (FINAL VERSION)
//     Dùng Cloudflare Worker làm proxy
// =======================================

document.addEventListener("DOMContentLoaded", () => {

    // ELEMENTS — đúng ID theo HTML bạn gửi
    const chatBody = document.getElementById("messages");
    const chatInput = document.getElementById("input");
    const sendBtn = document.getElementById("send");

    if (!chatBody || !chatInput || !sendBtn) {
        console.error("❌ LỖI: ID trong HTML không tồn tại!");
        return;
    }

    // Append chat message
    function appendMessage(role, text) {
        const msg = document.createElement("div");
        msg.className = `msg ${role}`;
        msg.textContent = text;
        chatBody.appendChild(msg);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    // Bot typing animation
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

    // SEND MESSAGE
    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        appendMessage("user", text);
        chatInput.value = "";
        appendTyping();

        try {
            const res = await fetch("https://bold-firefly-c9fc.jonemac1975.workers.dev/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    prompt: text   // Worker nhận JSON { prompt: "..." }
                })
            });

            const data = await res.json();
            removeTyping();

            if (!data.reply) {
                appendMessage("bot", "⚠️ Không nhận được trả lời từ AI.");
                return;
            }

            appendMessage("bot", data.reply);

        } catch (error) {
            console.error("API Error:", error);
            removeTyping();
            appendMessage("bot", "⚠️ Lỗi kết nối API.");
        }
    }

    // EVENT
    chatInput.addEventListener("keydown", e => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    sendBtn.addEventListener("click", sendMessage);

});
// =======================================
