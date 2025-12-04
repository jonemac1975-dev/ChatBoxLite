// =======================================
//           CHATBOX.JS (FULL FIXED)
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

        const apiKey = localStorage.getItem("CHATBOX_API_KEY");
        if (!apiKey) {
            alert("Bạn chưa nhập API key — chuyển sang trang setup.");
            window.location.href = "setup.html";
            return;
        }

        appendMessage("user", text);
        chatInput.value = "";
        appendTyping();

        try {
            const res = await fetch("https://api.openai.com/v1/responses", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + apiKey
                },
                body: JSON.stringify({
                    model: "gpt-4.1-mini",
                    input: text
                })
            });

            const data = await res.json();
            removeTyping();

            const botReply = data.output_text || "⚠️ Không nhận được trả lời từ AI.";
            appendMessage("bot", botReply);

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
