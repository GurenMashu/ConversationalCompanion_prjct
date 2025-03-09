from flask import Flask, render_template
from flask_socketio import SocketIO
from stt_tts.stt import listen_to_speech
from stt_tts.tts import text_to_speech
from model.model import get_model_response

app=Flask(__name__)
socketio=SocketIO(app)

history = []

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/page2")
def page2():
    return "Hello wolrd!"

@socketio.on("user_input")
def handle_user_input(data):
    global history
    print("recieved user input.")
    user_text=listen_to_speech(data["audio"])

    print(f"User said: {user_text}")

    ai_response=get_model_response(user_text)
    print(f"Avatar response: {ai_response}")

    # Append to history
    history.append({"user": user_text, "ai": ai_response})

    audio_file=text_to_speech(ai_response)

    if audio_file:
     socketio.emit("ai_response", {
        "user_text": user_text,
        "text": ai_response,
        "audio_file": f"/audio/{audio_file}",
        "history": history  # Send history to frontend
    })
    else:
        socketio.emit("ai_response", {
        "user_text": user_text,
        "text": ai_response,
        "audio_file": None,
        "history": history  # Send history to frontend
    })
    # if audio_file:
    #     socketio.emit("ai_response", {"user_text":user_text,"text": ai_response, "audio_file": audio_file})
    # else:
    #     socketio.emit("ai_response", {"user_text":user_text,"text": ai_response, "audio_file": None})

@socketio.on("clear_history")
def handle_clear_history():
    from model.model import history
    history.clear()
    print("Chat history cleared.")


if __name__=="__main__":
    socketio.run(app, debug=True)

