from gtts import gTTS
import os
import time
import pygame
import threading
from flask_socketio import SocketIO

stop_speech = False  # Flag to stop speech playback
socketio = None  # Placeholder for socketio, will be assigned dynamically


def play_audio(filename):
    global stop_speech

    pygame.mixer.init()
    pygame.mixer.music.load(filename)

    if socketio:
        socketio.emit("ai_audio")  # Notify client when audio actually starts

    pygame.mixer.music.play()


    while pygame.mixer.music.get_busy():
        if stop_speech:
            socketio.emit("ai_audio_end")  # Ensure `ai_audio_end` is sent before stopping
            pygame.mixer.music.stop()
            break
        time.sleep(0.01)

    pygame.mixer.music.stop()
    socketio.emit("ai_audio_end")  # Ensure `ai_audio_end` is sent immediately when playback stops

    pygame.mixer.quit()
    os.remove(filename)  # Delete file after playing

    if socketio:
        socketio.emit("ai_audio_end")  # Notify client when audio stops

def text_to_speech(text, socket):
    global stop_speech, socketio
    stop_speech = False  
    socketio = socket

    filename = "response.mp3"
    tts = gTTS(text=text, lang='en', slow=False)
    tts.save(filename)
    audio_thread = threading.Thread(target=play_audio, args=(filename,))
    audio_thread.start()
    return audio_thread

def stop_audio():
    global stop_speech
    stop_speech = True
