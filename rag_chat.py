import chromadb
from fastembed import TextEmbedding
import numpy as np
import google.generativeai as genai
import os
from dotenv import load_dotenv
import PyPDF2
from model.model import get_model_response

import logging
logging.basicConfig(level=logging.INFO)
logging.getLogger("chromadb").setLevel(logging.WARNING)  # or ERROR

load_dotenv()
genai.configure(api_key="AIzaSyDlWIDfJey0yGzUMOO7dEmBh5328a0cqHE")

chroma_collection=None
chunks=None
embeddings=None

def extract_text_from_pdf(pdf_path):
    text=""
    try:
        with open(pdf_path, 'rb') as file:
            reader=PyPDF2.PdfReader(file)
            for page in reader.pages:
                text+=page.extract_text() or ""
        return text
    except FileNotFoundError:
        print(f"Error: PDF file not found at {pdf_path}")
        return None
    except Exception as e:
        print("Error extracting text from PDF: {e}")
        return None
    
def chunk_text(text, chunk_size=800, chunk_overlap=80):
    chunks=[]
    start=0
    while start<len(text):
        end =start+chunk_size 
        chunks.append(text[start:end])
        start=end-chunk_overlap
    return chunks

def create_embeddings_fastembed(chunks, model_name="BAAI/bge-small-en"):
    model=TextEmbedding(model_name=model_name)
    try:
        embeddings=list(model.embed(chunks))
        return np.array(embeddings)
    except Exception as e:
        print(f"Error creating embeddings: {e}")
        return None
    
def generate_answer(query, Context):
    model=genai.GenerativeModel("gemini-1.5-flash")
    prompt=f"Context: {Context}\n\nQuestion: {query}\n\nAnswer:"
    try:
        response=model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Error generating answer: {e}")
        return "Sorry, couldnt generate an answer."
    
def create_chroma_client(collection_name="my_collection"):
    try:
        client=chromadb.Client()
        collection=client.get_or_create_collection(name=collection_name)
        return collection
    except Exception as e:
        print(f"Error creating Chroma client: {e}")
        return None

def add_to_chroma(collection, chunks, embeddings):
    ids=[str(i) for i in range(len(chunks))]
    embeddings_list=embeddings.tolist()
    try:
        collection.add(
            embeddings=embeddings_list,
            documents=chunks,
            ids=ids
        )
    except Exception as e:
        print(f"Error adding to Chroma: {e}")

def retrieve_from_chroma(collection, query_embedding, top_k=3):
    try:
        results=collection.query(query_embeddings=query_embedding.tolist(), n_results=top_k)
        return results["documents"][0]
    except Exception as e:
        print(f"Error retrieving from Chroma: {e}")
        return []
    
def initialize_rag_chroma_pipeline(pdf_path):
    global chroma_collection, embeddings, chunks
    logging.info("Extracting text from uploade pdf...")
    text=extract_text_from_pdf(pdf_path)
    if text is None:
        return "Failed to load PDF."
    logging.info("Spliting text into chunks...")
    chunks =chunk_text(text)
    if not chunks:
        print("Failed to create chunks.")
    logging.info("Creating vector embeddings for the chunks...")
    embeddings=create_embeddings_fastembed(chunks)
    if embeddings is None:
        return "Failed to create embeddings."
    logging.info("Creating a chromadb client...")
    chroma_collection=create_chroma_client()
    if chroma_collection is None:
        return "Failed to create chroma collection"
    logging.info("Storing the embedding into database...")
    add_to_chroma(chroma_collection, chunks, embeddings)
    return "RAG pipeline initialized successfully."
    
def rag_pipeline_chroma(query):   
    global chroma_collection, chunks, embeddings

    logging.info("Creating embeddings for user query...")
    query_embedding=list(TextEmbedding().embed([query]))[0]
    if query_embedding is None:
        return "Failed to create query embedding."
    logging.info("Checking database for relevant info...")
    relevant_chunks=retrieve_from_chroma(chroma_collection, np.array(query_embedding), top_k=3)
    if not relevant_chunks:
        return "No relevant information found."
    
    context="\n".join(relevant_chunks)
    logging.info("Llm is generating response...")
    answer=get_model_response(query, context)
    return answer

def delete_uploaded_files(directory_path="uploads"):
    for file in os.listdir(directory_path):
        file_path=os.path.join(directory_path, file)
        if os.path.isfile(file_path):
            os.remove(file_path)

if __name__=="__main__":
    pdf_path=r"C:\Users\GLENN\OneDrive\Documents\S6 Notes\NLP\nlp1.pdf"
    init_result=initialize_rag_chroma_pipeline(pdf_path)
    print(init_result)

    while True:
        query=input("Ask a question ('exit' to quit) : ")
        if query.lower()=='exit':
            logging.info("Deleting uploaded files...")
            delete_uploaded_files()
            break
        answer=rag_pipeline_chroma(query)
        print("Answer: ",answer)
