from flask import Flask, render_template, request, redirect, url_for, flash
from flask_socketio import SocketIO
from werkzeug.utils import secure_filename
from stt_tts.stt import listen_to_speech
from stt_tts.tts import text_to_speech, stop_audio 
from model.model import get_model_response
from rag_chat import rag_pipeline_chroma, initialize_rag_chroma_pipeline
import time
import os

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['ALLOWED_EXTENSIONS'] = {'pdf'}
app.secret_key="d4e507a00b1be6f72068ab53f98aabe0c74776f84a8d8ff4e56984d7b7e820e5"
if not app.secret_key:
    raise ValueError("No secret key set for Flask application")
socketio = SocketIO(app)

history = []
history_rag=[]
file_path=""

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

    stop_audio()
    # Listen to the user's speech
    user_text = listen_to_speech()
    print(f"User said: {user_text}")

    complete_response=get_model_response(user_text)
    history.append({"user": user_text, "ai": complete_response})  # Initialize with empty AI response

    socketio.emit("update_chat", {"user_text": user_text, "ai_text": complete_response, "history": history})


    audio_thread = text_to_speech(complete_response,socketio)
    audio_thread.join()  

@socketio.on("clear_history")
def handle_clear_history():
    global history
    history.clear()
    from model.model import clear_history
    clear_history()
    print("Chat history cleared.")

@socketio.on("clear_rag_history")
def handle_clear_rag_history():
    global history
    history.clear()
    from model.model import clear_history
    clear_history()
    from rag_chat import delete_uploaded_files#, clean_vector_database
    delete_uploaded_files()
    #clean_vector_database()
    print("Rag_Chat history cleared.")    

@socketio.on("stop_audio")
def handle_stop_audio():
    stop_audio()  # Stop audio playback
    print("Audio playback stopped.")

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']    

@app.route("/upload", methods=["POST"])
def upload_file():
    global file_path
    if "pdf_file" not in request.files:
        return "No file uploaded!", 400
    
    file=request.files["pdf_file"]
    if file.filename =="":
        flash("No selected file!", "error")
        return redirect(url_for("pdf_chat"))
    
    if file and allowed_file(file.filename):
        filename=secure_filename(file.filename)
        file_path=os.path.join(app.config["UPLOAD_FOLDER"], filename)
        file.save(file_path)

        socketio.emit("upload_status", {"message":"File uploaded successfully!"})

        flash("File uploaded successfully!", "success")
        print(initialize_rag_chroma_pipeline(file_path))
        return redirect(url_for("pdf_chat"))
    else:
        flash("Invalid file type. Only PDFs are allowed", "error")
        return redirect(url_for("pdf_chat"))

@socketio.on("start_rag_recording")
def handle_start_recording():
    global history
    print("Recording started...")

    stop_audio()
    # Listen to the user's speech
    user_text = listen_to_speech()
    print(f"User said: {user_text}")

    result=rag_pipeline_chroma(user_text)
    history.append({"user": user_text, "ai": result})  # Initialize with empty AI response

    socketio.emit("update_chat", {"user_text": user_text, "ai_text": result, "history": history})


    audio_thread = text_to_speech(result,socketio)
    audio_thread.join()  

if __name__ == "__main__":
    socketio.run(app, debug=True)