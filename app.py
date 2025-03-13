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
    return render_template("home.html")

@app.route("/chat")
def chat():
    return render_template("chat.html")

@app.route("/pdf_chat")
def pdf_chat():
    return render_template("pdf_chat.html")

@socketio.on("start_recording")
def handle_start_recording():
    global history
    print("Recording started...")

    # Listen to the user's speech
    user_text = listen_to_speech()
    print(f"User said: {user_text}")

    # Append a new entry to history
    history.append({"user": user_text, "ai": ""})  # Initialize with empty AI response


    complete_response=get_model_response(user_text)
    history.append({"user": user_text, "ai": complete_response})  # Initialize with empty AI response

    socketio.emit("update_chat", {"user_text": user_text, "ai_text": complete_response, "history": history})


    audio_thread = text_to_speech(complete_response,socketio)
    audio_thread.join()  

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