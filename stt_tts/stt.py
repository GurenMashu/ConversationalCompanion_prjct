import speech_recognition as sr
import base64
import io

def listen_to_speech(base64_audio):
    recognizer=sr.Recognizer()
    audio_data=base64.b64decode(base64_audio)
    print(f"Audio data length: {len(audio_data)} bytes")
    audio_file=io.BytesIO(audio_data)

    if len(audio_data)==0:
        print("Error: Empty audio data.")
        return None
    
    with open("temp_audio.wav", "wb") as f:
        f.write(audio_data)

    with sr.AudioFile(audio_file) as source:
        print("Processing audio...")
        print(audio_file)
        audio=recognizer.record(source)
        try:
            text=recognizer.recognize_google(audio)
            print(f"Recognized: {text}")
            return text
        except sr.UnknownValueError:
            return "Unable To process!! Try again."
        except sr.RequestError:
            return "Sorry, there was an error with the speech service."
