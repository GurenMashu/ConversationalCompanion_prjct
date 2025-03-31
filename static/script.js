const socket = io();

const startConvoBtn = document.getElementById("start-convo-btn");
const speakBtn = document.getElementById("speak-btn");
const chatContainer = document.getElementById("chat-container");
const avatarVideo = document.getElementById("avatar-video");
const maleBtn = document.getElementById("male-btn")
const femaleBtn = document.getElementById("female-btn")

const sources = document.getElementById("avatar-sources");
const maleVideoSrc = sources.dataset.maleVideo;
const idleMaleVideoSrc = sources.dataset.idleMaleVideo;
const femaleVideoSrc = sources.dataset.femaleVideo;
const idleFemaleVideoSrc = sources.dataset.idleFemaleVideo;

let isConversationActive = false;
let currentAvatar = 'male'; // Track active avatar


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

        stopAvatarAnimation();
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

// Handle AI Audio Playback Start
socket.on("ai_audio", () => {
    console.log("AI audio started");
    startAvatarAnimation();
});

// Handle AI Audio Playback End
socket.on("ai_audio_end", () => {
    console.log("AI audio ended");
    stopAvatarAnimation();
});

maleBtn.addEventListener("click", () => {
    currentAvatar = 'male';
    if (!isSpeaking) { // Only set idle state if AI is not speaking
        setIdleState();
    } else {
        startAvatarAnimation(); // Ensure it continues speaking
    }
});

femaleBtn.addEventListener("click", () => {
    currentAvatar = 'female';
    if (!isSpeaking) { // Only set idle state if AI is not speaking
        setIdleState();
    } else {
        startAvatarAnimation(); // Ensure it continues speaking
    }
});


let isSpeaking = false; // Track if AI is currently speaking


// Start Avatar Animation (Play Speaking Video)
function startAvatarAnimation() {
    isSpeaking = true; // AI starts speaking
    if (currentAvatar === "male") {
        avatarVideo.src = maleVideoSrc;
    } else {
        avatarVideo.src = femaleVideoSrc;
    }
    avatarVideo.play();

     // Smooth loop handling for speaking animation
     avatarVideo.addEventListener("timeupdate", function () {
        if (avatarVideo.currentTime >= avatarVideo.duration - 0.1) {
            avatarVideo.currentTime = 0;
            avatarVideo.play();
        }
    });
}

// Stop Avatar Animation (Reset to Idle)
function stopAvatarAnimation() {
    isSpeaking = false; // AI stops speaking
    avatarVideo.pause();
    setIdleState();
}

// Set Avatar to Idle State
function setIdleState() {
    if (currentAvatar === "male") {
        avatarVideo.src = idleMaleVideoSrc;
    } else {
        avatarVideo.src = idleFemaleVideoSrc;
    }
    avatarVideo.play(); // Loop idle video

     // Ensure seamless looping
     avatarVideo.addEventListener("timeupdate", function () {
        if (avatarVideo.currentTime >= avatarVideo.duration - 0.1) {
            avatarVideo.currentTime = 0; // Restart before the last frame
            avatarVideo.play();
        }
    });

}

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

// setIdleState(); // Set default state on page load
