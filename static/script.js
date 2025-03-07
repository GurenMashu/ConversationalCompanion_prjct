const socket = io();

const startConvoBtn = document.getElementById("start-convo-btn");
const speakBtn = document.getElementById("speak-btn");
const userText = document.getElementById("user-text");
const aiResponse = document.getElementById("ai-response");
const avatarImage = document.getElementById("avatar-image");

let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let isConversationActive = false;
let aiAudio = null; // To handle AI speech interruption

// Handle Start Conversation Button Click
startConvoBtn.addEventListener("click", () => {
    if (!isConversationActive) {
        // Start the conversation
        isConversationActive = true;
        startConvoBtn.textContent = "End Conversation";
        speakBtn.disabled = false;
        console.log("Conversation started.");
    } else {
        // End the conversation
        isConversationActive = false;
        startConvoBtn.textContent = "Start Conversation";
        speakBtn.disabled = true;
        console.log("Conversation ended.");
    }
});

// Handle Speak Button Click
speakBtn.addEventListener("click", () => {
    if (!isRecording) {
        startRecording();
    } else {
        stopRecording();
    }
});

// Start Recording
function startRecording() {
    if (aiAudio) {
        aiAudio.pause(); // Interrupt AI speech`
        aiAudio = null;
    }

    // Set avatar to neutral when the user starts speaking
    avatarImage.src = neutralAvatarUrl;

    navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.start();
            isRecording = true;
            speakBtn.textContent = "Stop Speaking";
            audioChunks = [];

            mediaRecorder.addEventListener("dataavailable", (event) => {
                audioChunks.push(event.data);
            });

            mediaRecorder.addEventListener("stop", () => {
                console.log("Recording stopped.");
                sendAudioToServer();
            });
        })
        .catch((err) => {
            console.error("Error accessing microphone:", err);
            alert("Microphone access denied. Please allow microphone access to use this feature.");
        });
}

// Stop Recording
function stopRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        speakBtn.textContent = "Speak";
    }
}

// Send Audio to Server
function sendAudioToServer() {
    const audioBlob = new Blob(audioChunks, { type: "audio/webm" }); // Recorded in webm format
    console.log("Audio Blob size: ", audioBlob.size);

    // Convert webm to WAV
    const reader = new FileReader();
    reader.onload = () => {
        const audioContext = new AudioContext({ sampleRate: 16000 });
        audioContext.decodeAudioData(reader.result, (buffer) => {
            console.log("Decoded buffer sample rate:", buffer.sampleRate);
            const wavBuffer = encodeWAV(buffer); // Convert to WAV
            const base64Audio = arrayBufferToBase64(wavBuffer); // Convert to base64
            socket.emit("user_input", { audio: base64Audio }); // Send to server
        });
    };
    reader.readAsArrayBuffer(audioBlob);
}

// Helper function to encode audio buffer as WAV
function encodeWAV(buffer) {
    const numChannels = 1; // Mono audio
    const sampleRate = 16000; // 16kHz sample rate
    const bitDepth = 16; // 16-bit depth

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = buffer.length * numChannels * bytesPerSample;

    const bufferSize = 44 + dataSize;
    const arrayBuffer = new ArrayBuffer(bufferSize);
    const view = new DataView(arrayBuffer);

    // Write WAV header
    writeString(view, 0, "RIFF"); // RIFF header
    view.setUint32(4, 36 + dataSize, true); // File size
    writeString(view, 8, "WAVE"); // WAVE format
    writeString(view, 12, "fmt "); // fmt chunk
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, 1, true); // Audio format (1 = PCM)
    view.setUint16(22, numChannels, true); // Number of channels
    view.setUint32(24, sampleRate, true); // Sample rate
    view.setUint32(28, byteRate, true); // Byte rate
    view.setUint16(32, blockAlign, true); // Block align
    view.setUint16(34, bitDepth, true); // Bit depth
    writeString(view, 36, "data"); // data chunk
    view.setUint32(40, dataSize, true); // data chunk size

    // Write audio data
    const offset = 44;
    const channelData = buffer.getChannelData(0); // Mono audio
    for (let i = 0; i < channelData.length; i++) {
        const sample = Math.max(-1, Math.min(1, channelData[i])); // Clamp sample to [-1, 1]
        const intSample = sample < 0 ? sample * 32768 : sample * 32767; // Convert to 16-bit
        view.setInt16(offset + i * 2, intSample, true); // Write sample
    }

    return arrayBuffer;
}

// Helper function to write a string to a DataView
function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

// Helper function to convert ArrayBuffer to base64
function arrayBufferToBase64(buffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

socket.on("ai_response", (data) => {
 
    userText.textContent = `You: ${data.user_text}`;
    avatarImage.src = talkingAvatarUrl;
    aiResponse.textContent = `AI: ${data.text}`;

    aiAudio = new Audio("D:\PythonStuffs\ConversationalCompanion_prjct\response.wav");
    aiAudio.play();

    aiAudio.onended = () => {
        console.log("Audio has ended")
        avatarImage.src = neutralAvatarUrl;
    };


    // if (data.audio_file) {
    //     aiAudio = new Audio("response.mp3");
    //     aiAudio.play();

    //     aiAudio.onended = () => {
    //         console.log("Audio has ended")
    //         avatarImage.src = neutralAvatarUrl;
    //     };
    // } else {
    //     console.error("No audio file received from the server.");
    // }
});