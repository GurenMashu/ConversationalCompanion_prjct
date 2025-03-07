from flask import Flask, render_template
from flask_socketio import SocketIO
from stt_tts.stt import listen_to_speech
from stt_tts.tts import text_to_speech
from model.model import get_model_response

app=Flask(__name__)
socketio=SocketIO(app)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/page2")
def page2():
    return "Hello wolrd!"

@socketio.on("user_input")
def handle_user_input(data):
    print("recieved user input.")
    user_text=listen_to_speech(data["audio"])

    print(f"User said: {user_text}")

    ai_response=get_model_response(user_text)
    print(f"Avatar response: {ai_response}")

    audio_file=text_to_speech(ai_response)
    if audio_file:
        socketio.emit("ai_response", {"user_text":user_text,"text": ai_response, "audio_file": audio_file})
    else:
        socketio.emit("ai_response", {"user_text":user_text,"text": ai_response, "audio_file": None})

if __name__=="__main__":
    socketio.run(app, debug=True)

