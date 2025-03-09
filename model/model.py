import os
import google.generativeai as genai

api_key = "AIzaSyDlWIDfJey0yGzUMOO7dEmBh5328a0cqHE"
genai.configure(api_key=api_key)
model = genai.GenerativeModel(model_name="gemini-1.5-flash")

history=[]

def construct_meta_prompt(user_input, context=None, intent=None):
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

    if context and "history":
        meta_prompt += f"Conversation History:\n{context["history"]}\n\n"

    meta_prompt += f"User Input:\n{user_input}\n\nYour Response:"
    
    return meta_prompt

def detect_intent(user_input):
  
    if user_input.lower().startswith(("what", "why", "how", "when", "where", "who")):
        return "question"
    elif user_input.lower() in ["hello", "hi", "hey"]:
        return "greeting"
    elif "think" in user_input.lower() or "opinion" in user_input.lower():
        return "opinion"
    else:
        return None
    

def get_model_response(user_input, context=None):
    global history

    # Append user input to history
    history.append(f"User: {user_input}")

    # Construct the meta prompt (including full conversation history)
    intent = detect_intent(user_input)
    meta_prompt = construct_meta_prompt(user_input, context=context, intent=intent)

    try:
        # Call the model WITHOUT the history argument
        response = model.generate_content(meta_prompt)

        # Update conversation history with AI response
        if context:
            context["history"] = context.get("history", "") + f"User: {user_input}\nAI: {response.text.strip()}\n"
        
        history.append(f"AI: {response.text.strip()}")
        return response.text.strip()
    except Exception as e:
        print(f"Error generating response: {e}")
        return "Sorry, I couldn't generate a response."


# def get_model_response(user_input, context=None):
    
#     global history

#     history.append(f"User: {user_input}")

#     meta_prompt = "\n".join(history) + "\nAI:"
#     try:
      
#         intent = detect_intent(user_input)

#         meta_prompt = construct_meta_prompt(user_input, context=context, intent=intent)

#         if context and "history" in context:
#             response = model.generate_content(
#                 meta_prompt,
#                 history=context["history"]  # Pass conversation history to the API
#             )
#         else:
#             response = model.generate_content(meta_prompt)

#         # Update the conversation history
#         if context:
#             context["history"] = context.get("history", "") + f"User: {user_input}\nAI: {response.text}\n"

#         return response.text.strip()
#     except Exception as e:
#         print(f"Error generating response: {e}")
#         return "Sorry, I couldn't generate a response."


