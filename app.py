from flask import Flask, render_template
from flask_socketio import SocketIO
from stt_tts.stt import listen_to_speech
from stt_tts.tts import text_to_speech, stop_audio  # Import the new functions
from model.model import get_model_response
import time

app = Flask(__name__)
socketio = SocketIO(app)

history = []

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/page2")
def page2():
    return "Hello world!"

@socketio.on("start_recording")
def handle_start_recording():
    global history
    print("Recording started...")

    # Listen to the user's speech
    user_text = listen_to_speech()
    print(f"User said: {user_text}")

    # Append a new entry to history
    history.append({"user": user_text, "ai": ""})  # Initialize with empty AI response

    # Send the user's message to the client
    socketio.emit("update_chat", {
        "user_text": user_text,
        "ai_text": "",
        "history": history
    })

    # Stream the AI's response
    ai_response = ""

    complete_response=get_model_response(user_text)
    socketio.emit("ai_audio")  # Notify client that audio playback is starting
    text_to_speech(complete_response)  # Start audio playback in a separate thread
    socketio.emit("ai_audio_end")  # Notify client that audio playback has ended
    
    for chunk in get_model_response(user_text):
        ai_response += chunk

        # Update the last AI message in history
        if history:  # Ensure history is not empty
            history[-1]["ai"] = ai_response

        # Send the text chunk to the client
        socketio.emit("update_chat", {
            "user_text": user_text,
            "ai_text": ai_response,
            "history": history
        })

        # Simulate a small delay for streaming effect
        time.sleep(0.1)

    # Generate and play audio for the full response
    

@socketio.on("clear_history")
def handle_clear_history():
    global history
    history.clear()
    print("Chat history cleared.")

@socketio.on("stop_audio")
def handle_stop_audio():
    stop_audio()  # Stop audio playback
    print("Audio playback stopped.")

if __name__ == "__main__":
    socketio.run(app, debug=True)