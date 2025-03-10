const socket = io();

const startConvoBtn = document.getElementById("start-convo-btn");
const speakBtn = document.getElementById("speak-btn");
const chatContainer = document.getElementById("chat-container");
const avatarImage = document.getElementById("avatar-image");

// Define avatar image URLs
const neutralAvatarUrl = "static/neutral.jpeg";  // URL for neutral avatar
const talkingAvatarUrl = "static/talking.jpeg";  // URL for talking avatar

let isConversationActive = false;

// Handle Start Conversation Button Click
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
        // Notify the server to start recording and processing audio
        socket.emit("start_recording");
    }
});

// Handle Streaming Updates from Server
socket.on("update_chat", (data) => {
    updateChatHistory(data.history);
});

// Handle AI Audio Playback
socket.on("ai_audio", () => {
    // Set avatar to talking state
    avatarImage.src = talkingAvatarUrl;
});

// Handle AI Audio Playback End
socket.on("ai_audio_end", () => {
    // Set avatar to neutral state
    avatarImage.src = neutralAvatarUrl;
});

// Function to simulate typing effect
function typeText(element, text, delay = 50) {
    let index = 0;
    element.textContent = ""; // Clear the text initially

    const typingInterval = setInterval(() => {
        if (index < text.length) {
            element.textContent += text.charAt(index);
            index++;
        } else {
            clearInterval(typingInterval);
        }
    }, delay);
}

// Update Chat History in UI
function updateChatHistory(history) {
    // Clear only the new messages, not the entire container
    const existingMessages = chatContainer.querySelectorAll(".user-message, .ai-message");
    const lastMessage = existingMessages[existingMessages.length - 1];

    // If the last message is from the AI, update it instead of adding a new one
    if (lastMessage && lastMessage.classList.contains("ai-message")) {
        lastMessage.textContent = `AI: ${history[history.length - 1].ai}`;
    } else {
        // Append new messages
        const entry = history[history.length - 1];
        const userMessage = document.createElement("div");
        userMessage.classList.add("user-message");
        userMessage.textContent = `You: ${entry.user}`;
        chatContainer.appendChild(userMessage);

        const aiMessage = document.createElement("div");
        aiMessage.classList.add("ai-message");
        aiMessage.textContent = `AI: ${entry.ai}`;
        chatContainer.appendChild(aiMessage);
        typeText(aiMessage, `AI: ${entry.ai}`); // Simulate typing effect
    }

    // Auto-scroll to the bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}