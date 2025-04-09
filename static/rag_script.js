const socket = io();
const startRagConvoBtn = document.getElementById("start-rag-convo-btn");
const speakRagBtn = document.getElementById("speak-rag-btn");

const chatContainer = document.getElementById("chat-container1");
const avatarVideo = document.getElementById("avatar-video");
const maleBtn = document.getElementById("male-btn")
const femaleBtn = document.getElementById("female-btn")

const sources = document.getElementById("avatar-sources");
const maleVideoSrc = sources.dataset.maleVideo;
const idleMaleVideoSrc = sources.dataset.idleMaleVideo;
const femaleVideoSrc = sources.dataset.femaleVideo;
const idleFemaleVideoSrc = sources.dataset.idleFemaleVideo;

let isConversationActive = false;
let currentAvatar = 'male';  

startRagConvoBtn.addEventListener("click", () => {
    if (!isConversationActive) {
        isConversationActive = true;
        startRagConvoBtn.textContent = "End Rag Conversation";
        speakRagBtn.disabled = false;
        console.log("Conversation started.");
    } else {
        isConversationActive = false;
        startRagConvoBtn.textContent = "Start Rag Conversation";
        speakRagBtn.disabled = true;
        console.log("Conversation ended.");

        chatContainer.innerHTML = "";

        socket.emit("clear_rag_history");

        socket.emit("stop_audio");
        stopAvatarAnimation();
    }
});

speakRagBtn.addEventListener("click", () => {
    if (isConversationActive) {
        socket.emit("start_rag_recording");
    }
});

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
// let mouthAnimationInterval = null;
// const mouthFrames = [
//     "static/assets/mouthOpened0.1.png", "static/assets/mouthOpened0.2.png", "static/assets/mouthOpened0.3.png",
//     "static/assets/mouthOpened0.4.png", "static/assets/mouthOpened0.5.png", "static/assets/mouthOpened0.6.png",
//     "static/assets/mouthOpened0.7.png", "static/assets/mouthOpened0.8.png", "static/assets/mouthOpened0.9.png",
//     "static/assets/mouthOpenedFully.png"
// ];

// const mouthFrames2 = [
//     "static/assets/AvatarFemaleMouthopen0.1.png", "static/assets/FemaleAvatarMouthOpen0.2.png", "static/assets/FemaleAvatarMouthOpen0.3.png",
//     "static/assets/FemaleAvatarMouthOpen0.4.png", "static/assets/FemaleAvatarMouthOpen0.5.png", "static/assets/FemaleAvatarMouthOpen0.6.png",
//     "static/assets/FemaleAvatarMouthOpen0.7.png", "static/assets/FemaleAvatarMouthOpen0.8.png", "static/assets/FemaleAvatarMouthOpen0.9.png",
//     "static/assets/FemaleAvatarMouthOpen1.png"
// ];

// let frameIndex = 0;

// // Preload All Mouth Frames (Avoid Flickering)
// [...mouthFrames, ...mouthFrames2].forEach((src) => {
//     const img = new Image();
//     img.src = src;
// });

// socket.on("ai_audio", () => {
//     if(mouthAnimationInterval) {
//         clearInterval(mouthAnimationInterval);
//     }

//     frameIndex = 0; // Start from first frame
//     mouthAnimationInterval = setInterval(() => {
//         if (currentAvatar == 'male'){
//         avatarImage.src = mouthFrames[frameIndex]; // Set current frame
//         frameIndex = (frameIndex + 1) % mouthFrames.length;
//         }
//         else{
//             avatarImage.src = mouthFrames2[frameIndex]; // Set current frame
//             frameIndex = (frameIndex + 1) % mouthFrames2.length;

//         } // Loop through frames
//     }, 100); // Adjust speed (100ms for smooth movement)
// });

// socket.on("ai_audio_end", () => {
//     if (mouthAnimationInterval) {
//         clearInterval(mouthAnimationInterval); // Stop animation
//         mouthAnimationInterval = null;
//     }
//     setTimeout(() => {
      
//         updateAvatar()
//         // Ensure instant reset
//     }, 5);
// });

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
