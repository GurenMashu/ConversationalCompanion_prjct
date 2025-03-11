const socket = io();

const startConvoBtn = document.getElementById("start-convo-btn");
const speakBtn = document.getElementById("speak-btn");
const chatContainer = document.getElementById("chat-container");
const avatarImage = document.getElementById("avatar-image");

// Define avatar image URLs
const neutralAvatarUrl = "static/neutral.jpeg";
const talkingAvatarUrl = "static/talking.jpeg";

let isConversationActive = false;

// Handle Start/End Conversation Button Click
startConvoBtn.addEventListener("click", () => {
    if (!isConversationActive) {
        isConversationActive = true;
        startConvoBtn.textContent = "End Conversation";
        speakBtn.disabled = false;
        console.log("Conversation started.");
    } else {
        isConversationActive = false;
        startConvoBtn.textContent = "Start Conversation";
        speakBtn.disabled = true;
        console.log("Conversation ended.");

        // Clear chat history in the UI
        chatContainer.innerHTML = "";

        // Clear history on the server side
        socket.emit("clear_history");

        // Stop audio playback
        socket.emit("stop_audio");

        // Reset avatar to neutral state
        avatarImage.src = neutralAvatarUrl;
    }
});

// Handle Speak Button Click
speakBtn.addEventListener("click", () => {
    if (isConversationActive) {
        socket.emit("start_recording");
    }
});

// Handle Streaming Updates from Server
socket.on("update_chat", (data) => {
    updateChatHistory(data.history);
});

// Handle AI Audio Playback
socket.on("ai_audio", () => {
    avatarImage.src = talkingAvatarUrl;
});

// Handle AI Audio Playback End
socket.on("ai_audio_end", () => {
    avatarImage.src = neutralAvatarUrl;
});

// Function to update chat history and auto-scroll
function updateChatHistory(history) {
    chatContainer.innerHTML = ""; // Clear chat box before updating

    history.forEach(entry => {
        const userMessage = document.createElement("div");
        userMessage.classList.add("user-message");
        userMessage.textContent = `You: ${entry.user}`;
        chatContainer.appendChild(userMessage);

        const aiMessage = document.createElement("div");
        aiMessage.classList.add("ai-message");
        chatContainer.appendChild(aiMessage);

        typeText(aiMessage, `AI: ${entry.ai}`);
    });

    // Auto-scroll to the bottom of the chat container
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Function to simulate typing effect
function typeText(element, text, delay = 50) {
    let index = 0;
    element.textContent = "";

    const typingInterval = setInterval(() => {
        if (index < text.length) {
            element.textContent += text.charAt(index);
            index++;
        } else {
            clearInterval(typingInterval);
        }
    }, delay);
}
