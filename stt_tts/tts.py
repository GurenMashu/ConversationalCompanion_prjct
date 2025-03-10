from gtts import gTTS
import os
import time
import pygame
import threading

stop_speech = False  # Flag to stop speech playback

def play_audio(filename):
    global stop_speech

    pygame.mixer.init()
    pygame.mixer.music.load(filename)
    pygame.mixer.music.play()

    while pygame.mixer.music.get_busy():
        if stop_speech:
            pygame.mixer.music.stop()
            break
        time.sleep(0.1)

    pygame.mixer.quit()
    os.remove(filename)  # Delete file after playing

def text_to_speech(text):
    global stop_speech
    stop_speech = False  

    sentences = text.split(". ")  # Break long responses into chunks

    def generate_and_play():
        for idx, sentence in enumerate(sentences):
            if stop_speech:  # Stop if the user interrupts
                break
            
            filename = f"response_{idx}.mp3"
            tts = gTTS(text=sentence, lang='en', slow=False)
            tts.save(filename)
            play_audio(filename)  # Play as soon as a chunk is ready

    audio_thread = threading.Thread(target=generate_and_play)
    audio_thread.start()
    
    return audio_thread  # Return thread to track status

def stop_audio():
    global stop_speech
    stop_speech = True  # Set flag to stop speech