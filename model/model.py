import os
import google.generativeai as genai

genai.configure(api_key="AIzaSyDlWIDfJey0yGzUMOO7dEmBh5328a0cqHE")
model = genai.GenerativeModel(model_name="gemini-1.5-flash")

history = []  # Stores user-AI conversation history


def construct_meta_prompt(user_input, history, intent=None):
    """Constructs a meta prompt including conversation history, user input, and intent."""
    meta_prompt = (
        "You are an advanced conversational assistant. Respond with concise, clear, and helpful information. "
        "Be friendly and professional in tone.\n\n"
    )

    if intent == "question":
        meta_prompt += "The user has asked a question. Provide a detailed yet concise answer.\n\n"
    elif intent == "opinion":
        meta_prompt += "The user is seeking an opinion. Respond thoughtfully and engagingly.\n\n"
    elif intent == "greeting":
        meta_prompt += "The user is greeting you. Respond warmly and invitingly.\n\n"
    else:
        meta_prompt += "Respond appropriately to the user's input.\n\n"

    if history:
        meta_prompt += f"Conversation History:\n{history}\n\n"

    meta_prompt += f"User Input:\n{user_input}\n\nYour Response:"

    return meta_prompt


def detect_intent(user_input):
    """Detects the intent of the user's message."""
    if user_input.lower().startswith(("what", "why", "how", "when", "where", "who")):
        return "question"
    elif user_input.lower() in ["hello", "hi", "hey"]:
        return "greeting"
    elif "think" in user_input.lower() or "opinion" in user_input.lower():
        return "opinion"
    else:
        return None


def get_model_response(user_input):
    """Generates a response from the AI model and maintains conversation history."""
    #global history

    # Append user input to history
    history.append({"role": "user", "content": user_input})

    # Detect intent and construct prompt
    intent = detect_intent(user_input)
    meta_prompt = construct_meta_prompt(user_input, history=history, intent=intent)

    try:
        # API call using structured conversation history
        response = model.generate_content(meta_prompt)  # Use conversation history)

        # Extract and clean the AI response
        ai_response = response.text.strip()

        # Update conversation history with AI response
        history.append({"role": "assistant", "content": ai_response})

        return ai_response
    except Exception as e:
        print(f"Error generating response: {e}")
        return "Sorry, I couldn't generate a response."
