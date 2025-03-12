const socket = io();

const startConvoBtn = document.getElementById("start-convo-btn");
const speakBtn = document.getElementById("speak-btn");
const chatContainer = document.getElementById("chat-container");
const avatarImage = document.getElementById("avatar-image");

// Define avatar image URLs
//const neutralAvatarUrl = "static/neutral.jpeg";
//const talkingAvatarUrl = "static/talking.jpeg";
const neutralAvatarUrl = "static/idealAvatar.png";
// const mouthOpened01Url = "static/mouthOpened0.1.png"
// const mouthOpened02Url = "static/mouthOpened0.1.png";
// const mouthOpened03Url = "static/mouthOpened0.1.png";
// const mouthOpened04Url = "static/mouthOpened0.1.png";
// const mouthOpened05Url = "static/mouthOpened0.1.png";
// const mouthOpened06Url = "static/mouthOpened0.1.png";
// const mouthOpened07Url = "static/mouthOpened0.1.png";
// const mouthOpened08Url = "static/mouthOpened0.1.png";
// const mouthOpened09Url = "static/mouthOpened0.1.png";
// const mouthOpened1Url = "static/mouthOpenedFully.png";

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

let mouthAnimationInterval = null;
const mouthFrames = [
    "static/mouthOpened0.1.png", "static/mouthOpened0.2.png", "static/mouthOpened0.3.png",
    "static/mouthOpened0.4.png", "static/mouthOpened0.5.png", "static/mouthOpened0.6.png",
    "static/mouthOpened0.7.png", "static/mouthOpened0.8.png", "static/mouthOpened0.9.png",
    "static/mouthOpenedFully.png"
];

let frameIndex = 0;

// **Preload images to avoid flickering**
const preloadedImages = mouthFrames.map((src) => {
    const img = new Image();
    img.src = src;
    return img;
});

// Handle AI Audio Playback
socket.on("ai_audio", () => {
    if(mouthAnimationInterval) {
        clearInterval(mouthAnimationInterval);
    }

    frameIndex = 0; // Start from first frame
    mouthAnimationInterval = setInterval(() => {
        avatarImage.src = mouthFrames[frameIndex]; // Set current frame
        frameIndex = (frameIndex + 1) % mouthFrames.length; // Loop through frames
    }, 100); // Adjust speed (100ms for smooth movement)
});


// Handle AI Audio Playback End
socket.on("ai_audio_end", () => {
    if (mouthAnimationInterval) {
        clearInterval(mouthAnimationInterval); // Stop animation
        mouthAnimationInterval = null;
    }
    avatarImage.src = neutralAvatarUrl;
});

// Function to update chat history and auto-scroll
function updateChatHistory(history) {
    const lastEntry = history[history.length - 1]; // Get the latest message
    if (!lastEntry) return; // Avoid errors if history is empty

    // Find the last AI message in the chat to update it dynamically
    const lastAIMessage = chatContainer.querySelector(".ai-message:last-child");

    // If it's a new user message, add it to the chat
    if (!lastAIMessage || lastAIMessage.previousElementSibling.textContent !== `You: ${lastEntry.user}`) {
        const userMessage = document.createElement("div");
        userMessage.classList.add("user-message");
        userMessage.textContent = `You: ${lastEntry.user}`;
        chatContainer.appendChild(userMessage);

        const aiMessage = document.createElement("div");
        aiMessage.classList.add("ai-message");
        aiMessage.dataset.index = history.length - 1; // Store message index
        chatContainer.appendChild(aiMessage);
    }

    // Update the last AI message dynamically (streaming effect)
    const lastAI = chatContainer.querySelector(".ai-message:last-child");
    lastAI.textContent = `AI: ${lastEntry.ai}`;

    // Auto-scroll to the latest message
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

