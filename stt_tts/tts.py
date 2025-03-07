import pyttsx3

def text_to_speech(text, filename="response.mp3"):
    sentences=text.split(". ")
    engine=pyttsx3.init()
    engine.save_to_file(text, filename)
    return filename
    # engine.setProperty("rate",170)
    # engine.setProperty("volume",1.0)
    
    # voices=engine.getProperty("voices")
    # engine.setProperty("voice",voices[0].id)
    # for sentence in sentences:
    #     engine.say(sentence)
    #     engine.runAndWait()