import os
import re
import csv
import json
import logging # Import logging first
import uuid
import traceback
from datetime import datetime, timedelta
from pathlib import Path
# Import standard typing AFTER standard libraries
from typing import List, Dict, Any, Optional, Tuple, Union, TypedDict

import firebase_admin
from firebase_admin import credentials, firestore

# Import external libraries
import requests
from flask import Flask, request, jsonify, abort
from flask_cors import CORS
import google.generativeai as genai
import chromadb
from chromadb import PersistentClient, EmbeddingFunction

from chromadb.api.models.Collection import Collection       
from typing import List, Dict, Any, Optional, TypedDict # Add TypedDict here

import config
from config.config import GEMINI_API_KEY


logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__) # Define logger HERE

# -----------------------------------------------------------------------------
# Firebase Admin SDK Initialization
# -----------------------------------------------------------------------------
db_firestore = None # Initialize as None globally
try:
    # --- Construct the relative path to the key file ---
    # Path(__file__) is the path to app.py
    # .parent gets the directory containing app.py (backend/)
    # Then navigate into 'config' and specify the filename
    relative_path_to_key = Path(__file__).parent / "config" / "asha-ai-firebase-adminsdk-fbsvc-e10ece5897.json"

    if not relative_path_to_key.exists():
         # This error is critical if you *only* rely on the relative path
         logger.error(f"Firebase service account key NOT FOUND at expected relative path: {relative_path_to_key}")
         logger.error("Ensure the key file exists in the 'backend/config/' directory.")
         # db_firestore remains None
    else:
         logger.info(f"Using service account key found at: {relative_path_to_key}")
         # Initialize using the path object converted to a string
         cred = credentials.Certificate(str(relative_path_to_key))

         # Check if the app is already initialized (prevents errors on hot-reloading)
         if not firebase_admin._apps:
             firebase_admin.initialize_app(cred)
             logger.info("Firebase Admin SDK initialized successfully.")
         else:
              logger.info("Firebase Admin SDK already initialized.")
         # Get the Firestore client instance
         db_firestore = firestore.client()

except Exception as e:
    # Log any other unexpected error during initialization
    logger.critical(f"CRITICAL: Failed to initialize Firebase Admin SDK: {e}", exc_info=True)
    db_firestore = None # Ensure db_firestore is None on any init error
# --- End Firebase Admin Init ---

# --- Type Definitions for Analytics ---

# Define nested structures first
class BiasMetrics(TypedDict, total=False): # total=False makes keys optional
    bias_detected_count: int
    bias_prevented_count: int
    bias_types: Dict[str, int]
    prevention_rate: Optional[float] # Can be None

class ConversationsAnalytics(TypedDict, total=False):
    total_conversations: int
    conversations_by_date: Dict[str, int] # Key is YYYY-MM-DD date string
    language_distribution: Dict[str, int]
    topic_distribution: Dict[str, int]
    response_times: List[float] # List of response times in seconds
    messages_per_conversation: List[int] # Optional: if you calculate this
    avg_messages_per_conversation: Optional[float] # Optional: if you calculate this
    bias_metrics: BiasMetrics
    last_updated: Optional[str] # ISO format timestamp

class UserAnalytics(TypedDict, total=False):
    total_users: int
    active_users: int # This is an approximation in the current code
    new_users: Optional[int] # Marked as Optional as it's hard to track from events
    retention_rate: Optional[float] # Marked as Optional
    # Add other user metrics if needed

class AccuracyRatings(TypedDict, total=False):
    accurate: int
    inaccurate: int
    unsure: int
    other: int

class ResponseQuality(TypedDict, total=False):
     helpful: int
     not_helpful: int

class FeedbackAnalytics(TypedDict, total=False):
    total_feedback: int
    accuracy_ratings: AccuracyRatings
    calculated_accuracy_rate: Optional[float] # Can be None
    feedback_by_date: Dict[str, int] # Key is YYYY-MM-DD date string
    response_quality: ResponseQuality
    last_updated: Optional[str] # ISO format timestamp

# Define the main AnalyticsData structure
class AnalyticsData(TypedDict):
    # These keys are expected based on the aggregation logic
    conversations: ConversationsAnalytics
    users: UserAnalytics
    feedback: FeedbackAnalytics

# --- End Type Definitions ---

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------
class Config:
    # File Paths (relative to the app.py file location)
    DATA_DIR = Path(__file__).parent / "data"
    CHROMA_DB_PATH = DATA_DIR / "chroma_db"
    SESSIONS_FILE = DATA_DIR / "session_details.json"
    JOBS_FILE = DATA_DIR / "job_listing_data.csv"
    TRUSTED_SOURCES_FILE = DATA_DIR / "trusted_sources.json"
    ANALYTICS_DIR = DATA_DIR / "analytics"
    FEEDBACK_DIR = DATA_DIR / "feedback"
    FEEDBACK_LIST_FILE = FEEDBACK_DIR / "feedback_list.json"

    # API Keys
    GEMINI_API_KEY = os.getenv(GEMINI_API_KEY) # Replace fallback

    # ChromaDB
    CHROMA_COLLECTION_NAME = "asha_knowledge"

    # Analytics
    ANALYTICS_DATE_FORMAT = "%Y-%m-%d"
    ANALYTICS_SUMMARY_DAYS = 30 # How many days of daily data to keep in summaries

    # CORS Origins
    CORS_ORIGINS = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5000",
        "http://127.0.0.1:5000",
        # Add production frontend URL here if applicable
    ]

# -----------------------------------------------------------------------------
# Setup Logging
# -----------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# -----------------------------------------------------------------------------
# File I/O Helpers
# -----------------------------------------------------------------------------
def read_json(file_path: Path, default: Any = None) -> Any:
    """Safely reads JSON data from a file."""
    if not file_path.exists():
        logger.warning(f"JSON file not found: {file_path}. Returning default.")
        return default
    try:
        with file_path.open('r', encoding='utf-8') as f:
            content = f.read().strip()
            if not content:
                logger.warning(f"JSON file is empty: {file_path}. Returning default.")
                return default
            return json.loads(content)
    except (json.JSONDecodeError, IOError, UnicodeDecodeError) as e:
        logger.error(f"Error reading JSON file {file_path}: {e}")
        return default

def write_json(file_path: Path, data: Any):
    """Safely writes JSON data to a file."""
    try:
        file_path.parent.mkdir(parents=True, exist_ok=True) # Ensure directory exists
        with file_path.open('w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        # logger.info(f"Successfully wrote JSON to {file_path}")
        return True
    except (IOError, TypeError) as e:
        logger.error(f"Error writing JSON file {file_path}: {e}")
        return False

def read_csv(file_path: Path) -> List[Dict[str, str]]:
    """Reads data from a CSV file into a list of dictionaries."""
    data = []
    if not file_path.exists():
        logger.warning(f"CSV file not found: {file_path}. Returning empty list.")
        return data
    try:
        with file_path.open('r', newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                data.append(row)
        return data
    except (IOError, csv.Error) as e:
        logger.error(f"Error reading CSV file {file_path}: {e}")
        return [] # Return empty list on error

def write_csv(file_path: Path, data: List[Dict[str, Any]], fieldnames: Optional[List[str]] = None):
    """Writes a list of dictionaries to a CSV file."""
    try:
        file_path.parent.mkdir(parents=True, exist_ok=True)
        if not data and not fieldnames:
            # Create an empty file if no data and no headers specified
            file_path.touch()
            logger.warning(f"Writing empty CSV file as no data or fieldnames provided: {file_path}")
            return True

        if not fieldnames and data:
            fieldnames = list(data[0].keys()) # Infer headers from first row if not provided

        if not fieldnames:
             logger.error(f"Cannot write CSV file without fieldnames: {file_path}")
             return False

        with file_path.open('w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(data)
        # logger.info(f"Successfully wrote CSV to {file_path}")
        return True
    except (IOError, csv.Error, IndexError) as e:
        logger.error(f"Error writing CSV file {file_path}: {e}")
        return False

# -----------------------------------------------------------------------------
# Analytics Logging (Simplified - logs raw events)
# -----------------------------------------------------------------------------
# REPLACE the existing log_analytics_event function
def log_analytics_event(event_type: str, event_data: Dict[str, Any]):
    """Logs an analytics event by reading, appending, and writing a JSON array file."""
    try:
        Config.ANALYTICS_DIR.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.now()
        event_id = str(uuid.uuid4())

        event = {
            "id": event_id,
            "timestamp": timestamp.isoformat(),
            "event_type": event_type,
            "data": event_data
        }

        date_str = timestamp.strftime(Config.ANALYTICS_DATE_FORMAT)
        # Ensure we use the .json extension
        analytics_file = Config.ANALYTICS_DIR / f"events_{date_str}.json"

        # --- Read-Modify-Write Logic ---
        events_for_day = []
        if analytics_file.exists():
            # Read the existing array using the helper
            existing_data = read_json(analytics_file, default=[]) # Default to empty list on error/empty
            # Ensure it's actually a list
            if isinstance(existing_data, list):
                events_for_day = existing_data
            else:
                logger.warning(f"Analytics file {analytics_file} did not contain a list. Starting fresh for today.")
                # Optionally, back up the corrupted file here before overwriting
                # backup_path = analytics_file.with_suffix(f".json.corrupted.{timestamp.isoformat().replace(':','-')}")
                # analytics_file.rename(backup_path)

        # Append the new event
        events_for_day.append(event)

        # Write the entire updated array back
        if not write_json(analytics_file, events_for_day):
             logger.error(f"Failed to write updated events array to {analytics_file}")
             return False # Indicate failure

        # logger.info(f"Logged event {event_id} to {analytics_file}") # Optional: Log success
        return True

    except Exception as e:
        # Catch potential errors during read/write or processing
        logger.error(f"Error logging analytics event to JSON array file: {e}", exc_info=True)
        return False
# -----------------------------------------------------------------------------
# Bias Detection Functions (Mostly unchanged, added type hint)
# -----------------------------------------------------------------------------
def detect_bias(user_query: str) -> Tuple[bool, Optional[str]]:
    """Detects bias and its type. Returns (is_biased, bias_type)."""
    try:
        # Configure Gemini if needed (moved key config outside)
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = f"""
        Analyze the following query for gender, racial, religious, age, or other harmful biases/stereotypes:
        Query: "{user_query}"
        Respond ONLY with "Biased: Yes, Type: [type]" or "Biased: No". Replace [type] with one of: gender, racial, religious, age, other.
        """
        response = model.generate_content(prompt)
        result = response.text.strip().lower()
        
        if result.startswith("biased: yes"):
            match = re.search(r"type:\s*(\w+)", result)
            bias_type = match.group(1) if match else "other"
            return True, bias_type
        else:
            return False, None
    except Exception as e:
        logger.error(f"Error in API bias detection: {e}")
        # Fallback keyword matching
        biased_keywords = {
            'gender': ['women can\'t', 'women should not', 'women are not', 'girls can\'t', 'females are', 'men always'],
            'racial': ['race', 'ethnic', 'minority'],
            'religious': ['religion', 'faith', 'belief', 'worship'],
            'age': ['too old', 'too young', 'age', 'elderly']
        }
        query_lower = user_query.lower()
        for bias_type, keywords in biased_keywords.items():
            if any(term in query_lower for term in keywords):
                logger.warning(f"Keyword bias detected (Type: {bias_type}) for query: {user_query}")
                return True, bias_type
        return False, None

def handle_bias() -> str:
    """Returns a standard response for biased queries."""
    return "I focus on providing inclusive and respectful information related to career development. Let's rephrase or explore a different topic."

# -----------------------------------------------------------------------------
# Vector Store Setup and Functions
# -----------------------------------------------------------------------------
class GeminiEmbeddingFunction(EmbeddingFunction):
    def __call__(self, input: List[str]) -> List[List[float]]:
        genai.configure(api_key=Config.GEMINI_API_KEY)
        model = "models/embedding-001"
        try:
            # Batch embedding requests if possible (check API limits)
            # Simplified: process one by one if batching fails or isn't straightforward
            embeddings = []
            for text in input:
                 result = genai.embed_content(model=model, content=text, task_type="retrieval_document")
                 embeddings.append(result["embedding"])
            return embeddings
            # Note: Original code had `title` which might not be supported by all task types.
            # Using batch embed requires careful handling of input size.
            # result = genai.embed_content(model=model, content=input, task_type="retrieval_document")
            # return result["embedding"] # This assumes batching works directly
        except Exception as e:
            logger.error(f"Error generating Gemini embedding: {e}")
            # Provide zero vectors or raise a specific exception
            raise RuntimeError("Embedding generation failed.") from e

def initialize_vector_store() -> chromadb.api.models.Collection:
    """Creates or loads the ChromaDB collection and ingests data."""
    try:
        client = PersistentClient(path=str(Config.CHROMA_DB_PATH)) # Path object needs conversion
        # Use get_or_create for robustness
        collection = client.get_or_create_collection(
            name=Config.CHROMA_COLLECTION_NAME,
            embedding_function=GeminiEmbeddingFunction()
        )
        logger.info(f"Chroma collection '{Config.CHROMA_COLLECTION_NAME}' loaded/created.")
        # Clear existing data before ingestion? Optional, depends on desired behavior.
        # collection.delete(where={}) # Uncomment to clear before re-ingesting
        _ingest_data(collection)
        return collection
    except Exception as e:
        logger.error(f"Error initializing Chroma collection: {e}")
        raise RuntimeError("Vector store initialization failed.") from e

def _ingest_data(collection: Collection):
    """Helper function to ingest data into the collection with metadata."""
    ingested_count = 0
    # Ingest Jobs with metadata
    jobs = read_csv(Config.JOBS_FILE)
    if jobs:
        logger.info(f"Attempting to ingest {len(jobs)} job listings...")
        for idx, job in enumerate(jobs):
            job_id = f"job_{job.get('id', uuid.uuid4())}"  # Use provided ID or generate one
            doc_text = (
                f"Job Title: {job.get('title', 'N/A')}\n"
                f"Company: {job.get('company', 'N/A')}\n"
                f"Location: {job.get('location', 'N/A')}\n"
                f"Type: {job.get('type', 'N/A')}\n"
                f"Deadline: {job.get('deadline', 'N/A')}\n"
                f"Description: {job.get('description', 'No description available.')}"
            )
            # ADD METADATA HERE
            metadata = {
                'source_type': 'job',
                'apply_url': job.get('applyUrl', '#'),
                'title': job.get('title', 'N/A'),
                'company': job.get('company', 'N/A'),
                'description': job.get('description', 'N/A'),
                'location': job.get('location', 'N/A')
            }
        try:
                # Add documents one by one for easier error isolation during dev
                collection.add(documents=[doc_text], ids=[job_id], metadatas=[metadata])  # Add metadata
                ingested_count += 1
        except Exception as e:
                logger.error(f"Failed to add job {job_id} to collection: {e}")
        if ingested_count > 0:
            logger.info(f"Successfully ingested {ingested_count} job listings.")

    # Ingest Sessions with metadata
    sessions = read_json(Config.SESSIONS_FILE, default=[])
    if sessions:
        logger.info(f"Attempting to ingest {len(sessions)} sessions...")
        ingested_session_count = 0  # Use a different counter variable name
        for idx, session in enumerate(sessions):
            session_id = f"session_{session.get('id', uuid.uuid4())}"
            doc_text = (
                f"Session Title: {session.get('title', 'N/A')}\n"
                f"Date: {session.get('date', 'N/A')}\n"
                f"Time: {session.get('time', 'N/A')}\n"
                f"Location: {session.get('location', 'N/A')}\n"
                f"Description: {session.get('description', 'No description available.')}"
            )
            # ADD METADATA HERE
            metadata = {
                'source_type': 'session',
                'registerUrl': session.get('registerUrl', 'N/A'),
                'title': session.get('title', 'N/A'),
                'description': job.get('description', 'N/A'),
                'date': session.get('date', 'N/A'),
                'location': session.get('location', 'N/A')
            }
    try:
                collection.add(documents=[doc_text], ids=[session_id], metadatas=[metadata])  # Add metadata
                ingested_session_count += 1
    except Exception as e:
        logger.error(f"Failed to add session {session_id} to collection: {e}")
        if ingested_session_count > 0:
            logger.info(f"Successfully ingested {ingested_session_count} session details.")

    total_ingested = ingested_count + ingested_session_count  # Use both counters
    if total_ingested == 0:
        logger.warning("No data was successfully ingested into the vector store.")

# Global variable for the vector store collection.
vector_collection: Optional[chromadb.api.models.Collection] = None

def update_vector_store():
    """Reinitializes the vector store. Inefficient for large datasets."""
    global vector_collection
    try:
        logger.info("Attempting to update vector store by re-initialization...")
        vector_collection = initialize_vector_store()
        logger.info("Vector store re-initialized successfully.")
        return True
    except Exception as e:
        logger.error(f"Error updating vector store: {e}")
        return False

# -----------------------------------------------------------------------------
# RAG Pipeline Functions (Refined Prompts)
# -----------------------------------------------------------------------------
# REPLACE this function:
def get_relevant_passage(
    query: str,
    db: Collection, # Changed type hint
    n_results: int = 5, # Retrieve more initially for potential filtering/ranking
    source_type_filter: Optional[str] = None
) -> List[Tuple[str, Dict[str, Any]]]:
    """Retrieves relevant passages, optionally filtered by source_type, and returns docs with metadata."""
    if not db:
        logger.error("Vector store not available for query.")
        return []
    try:
        # Construct the where clause only if a filter is provided
        where_clause = {'source_type': source_type_filter} if source_type_filter else None

        # Perform the query, including metadata and specifying the where clause if applicable
        if where_clause:
            results = db.query(query_texts=[query], n_results=n_results, where=where_clause, include=['documents', 'metadatas'])
        else:
            # Query without filter if no source type specified
            results = db.query(query_texts=[query], n_results=n_results, include=['documents', 'metadatas'])

        # Safely extract documents and metadatas
        docs = results.get("documents")
        metadatas = results.get("metadatas")

        # Check if results are valid lists and have content
        if docs and metadatas and isinstance(docs, list) and len(docs) > 0 and isinstance(metadatas, list) and len(metadatas) > 0:
            # Ensure docs[0] and metadatas[0] are lists themselves (ChromaDB structure)
            doc_list = docs[0] if isinstance(docs[0], list) else []
            meta_list = metadatas[0] if isinstance(metadatas[0], list) else []

            # Combine documents and metadata into tuples, ensuring lengths match
            min_len = min(len(doc_list), len(meta_list))
            return list(zip(doc_list[:min_len], meta_list[:min_len]))
        else:
            # Return empty list if results are missing or malformed
            logger.warning(f"Query returned no documents or metadata for query: '{query}' with filter: {source_type_filter}")
            return []
    except Exception as e:
        logger.error(f"Error querying vector store: {e}", exc_info=True)
        return []

# REPLACE this function:
def make_rag_prompt(
    query: str,
    passages_with_metadata: List[Tuple[str, Dict[str, Any]]],
    language: str = "English",
    topic: str = "general"
    # external_context: Optional[str] = None # Placeholder for scraped content
) -> str:
    """Constructs the RAG prompt based on the topic and retrieved data."""

    # --- Base Persona and Instructions ---
    base_prompt = f"""
You are Asha, a helpful and empowering AI assistant focused on women's career development in India. Your goal is to provide accurate, unbiased, encouraging, and relevant information based on the provided context and the user's query. Maintain a positive, supportive, and professional tone. Avoid stereotypes and biases. **Respond ONLY in {language}.**
"""
    suggest_resources_instruction = "\n\nFinally, suggest 1-2 additional relevant resources (like specific website sections, types of workshops, or relevant organizations from trusted sources if applicable) or next steps the user could take."

    # --- Topic-Specific Handling ---
    context_str = ""
    specific_instruction = ""

    # Limit results displayed
    max_results_to_display = 3
    relevant_items = passages_with_metadata[:max_results_to_display]

    if topic == "career" and relevant_items:
        context_str += "**Relevant Job Opportunities Found:**\n"
        for i, (doc, meta) in enumerate(relevant_items):
            title = meta.get('title', 'N/A')
            company = meta.get('company', 'N/A')
            location = meta.get('location', 'N/A')
            apply_url = meta.get('apply_url', '') # Get URL, default empty
            # Extract description snippet carefully
            desc_match = re.search(r"Description:\s*(.*)", doc, re.IGNORECASE | re.DOTALL)
            description_snippet = (desc_match.group(1).strip()[:150] + "...") if desc_match and desc_match.group(1).strip() else "Details available."
            context_str += f"{i+1}. **{title}** at {company} ({location})\n   *Description:* {description_snippet}\n"
            # Only add apply link if URL is valid
            if apply_url and apply_url != '#':
                context_str += f"   *Apply here:* {apply_url}\n"
            else:
                context_str += "   *Application link not provided.*\n"
        specific_instruction = f"Based on the user's query '{query}', present the {len(relevant_items)} most relevant job opportunities listed above. Briefly mention the company and location. Include the application link if available. If the query asks for something specific not covered, address that too."
    elif topic == "session" and relevant_items: # Handle sessions/events (normalized topic)
        context_str += "**Relevant Sessions/Events Found:**\n"
        for i, (doc, meta) in enumerate(relevant_items):
            title = meta.get('title', 'N/A')
            date = meta.get('date', 'N/A')
            location = meta.get('location', 'N/A')
            register_url = meta.get('register_url', '') # Get URL, default empty
            desc_match = re.search(r"Description:\s*(.*)", doc, re.IGNORECASE | re.DOTALL)
            description_snippet = (desc_match.group(1).strip()[:150] + "...") if desc_match and desc_match.group(1).strip() else "Details available."
            context_str += f"{i+1}. **{title}** ({location} on {date})\n   *Details:* {description_snippet}\n"
            # Only add register link if URL is valid
            if register_url and register_url != '#':
                 context_str += f"   *Register here:* {register_url}\n"
            else:
                 context_str += "   *Registration link not provided.*\n"
        specific_instruction = f"Based on the user's query '{query}', present the {len(relevant_items)} most relevant sessions/events listed above. Briefly mention the date and location. Include the registration link if available. If the query asks for something specific not covered, address that too."
    else: # General topic or no specific results found for job/session
        if relevant_items:
             context_str += "**Relevant Information Found:**\n"
             # Just use the document text for general context
             context_str += "\n\n---\n\n".join([doc for doc, meta in relevant_items])
        else:
             context_str += "No specific documents found in the internal knowledge base matching the query."
        specific_instruction = f"Answer the user's query '{query}' clearly and concisely using the provided context if relevant. If the context is insufficient or missing, use your general knowledge but clearly state this (e.g., 'Based on general knowledge,...')."
        # Placeholder: Integrate external content if available
        # if external_context:
        #    context_str += "\n\n**Potentially Relevant External Information:**\n" + external_context

    # --- Final Prompt Assembly ---
    prompt = f"""{base_prompt}

        **Context:**
        {context_str}

        **User Query:** "{query}"

        **Instructions:**
        1. {specific_instruction}
        2. If no relevant information was found (context indicates this), acknowledge that and answer based on general knowledge if appropriate, stating that you couldn't find specific details in the knowledge base.
        3. {suggest_resources_instruction}

        **Answer (in {language}):**
        """
    return prompt

def generate_answer(prompt: str) -> str:
    """Generates an answer using the Gemini model."""
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        answer = response.text.strip()
        if not answer:
            logger.warning("Received empty response from Gemini AI.")
            return "I couldn't generate a specific response for that query. Could you try rephrasing?"
        return answer

    except Exception as e:
        logger.error(f"Error generating Gemini response: {e}")
        return "I am sorry, I encountered a technical difficulty. Please try again later."

# -----------------------------------------------------------------------------
# Flask App and Endpoints
# -----------------------------------------------------------------------------
app = Flask(__name__)
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = True
CORS(app, origins=Config.CORS_ORIGINS, supports_credentials=True)

# Configure Gemini API Key on startup
genai.configure(api_key=Config.GEMINI_API_KEY)

# Initialize Vector Store on startup
try:
    Config.DATA_DIR.mkdir(parents=True, exist_ok=True)
    vector_collection = initialize_vector_store()
except Exception as e:
    logger.critical(f"CRITICAL: Failed to initialize vector store on startup: {e}", exc_info=True)
    # Depending on requirements, you might exit or run in a degraded mode
    # For now, we'll let it continue, but endpoints needing it will fail.
    vector_collection = None

# --- Chat Endpoint ---
# --- Chat Endpoint ---
@app.route('/chat', methods=['POST'])
def chat():
    global vector_collection, db_firestore # Add db_firestore global
    data = request.json
    if not data: return jsonify({"error": "No data provided"}), 400

    query = data.get('query', '').strip()
    history_list = data.get('conversation_history', [])
    language = data.get('language', 'English')
    # Get user_id, could be null/undefined if anonymous or error in frontend
    user_id = data.get('user_id')
    topic = data.get('topic', 'general').lower()

    if not query: return jsonify({"error": "Empty query provided"}), 400
    if not vector_collection:
        logger.error("Chat request failed: Vector store not initialized.")
        return jsonify({"error": "Service temporary unavailable (VS)"}), 503 # Service Unavailable

    # Firestore is needed *only* for logged-in users' profile fetch
    # Allow anonymous users to proceed even if Firestore isn't available
    # if not db_firestore: # Stricter check - block all if Firestore fails
    #    logger.error("Chat request failed: Firestore client not initialized.")
    #    return jsonify({"error": "Service temporary unavailable (DB)"}), 503

    start_time = datetime.now()

    # --- Fetch User Profile (if user_id provided and it's the start of convo) ---
    user_profile_info = ""
    user_name = "there" # Default greeting name
    # Determine if this is effectively the first *user* turn being processed
    is_first_user_message = not any(msg.get('role') == 'user' for msg in history_list)

    # Proceed with profile fetch only if logged in, Firestore ready, and first user message
    if user_id and not str(user_id).startswith('anonymous_') and db_firestore and is_first_user_message:
        try:
            # Ensure user_id is a string before using it as document ID
            user_id_str = str(user_id)
            logger.info(f"Attempting to fetch profile for user_id: {user_id_str}")
            # Assumes collection named 'userProfiles' and documents are named by UID
            user_doc_ref = db_firestore.collection('profiles').document(user_id_str)
            user_doc = user_doc_ref.get()

            if user_doc.exists:
                profile_data = user_doc.to_dict()
                if profile_data: # Check if conversion worked
                    logger.info(f"Fetched profile for user {user_id_str}")
                    first_name = profile_data.get('firstName', '').strip()
                    if first_name: user_name = first_name # Use first name for greeting

                    profile_parts = []
                    # Add checks for existence AND non-empty values before appending
                    if profile_data.get('age'): profile_parts.append(f"- Age: {profile_data['age']}")
                    if profile_data.get('bio', '').strip(): profile_parts.append(f"- Bio: {profile_data['bio']}")
                    if profile_data.get('careerGoals', '').strip(): profile_parts.append(f"- Career Goals: {profile_data['careerGoals']}")
                    if profile_data.get('domainsOfInterest') and isinstance(profile_data['domainsOfInterest'], list) and profile_data['domainsOfInterest']:
                        profile_parts.append(f"- Domains of Interest: {', '.join(profile_data['domainsOfInterest'])}")
                    if profile_data.get('industry', '').strip(): profile_parts.append(f"- Industry: {profile_data['industry']}")
                    if profile_data.get('yearsOfExperience', '').strip(): profile_parts.append(f"- Experience: {profile_data['yearsOfExperience']}") # No 'years' suffix needed here

                    if profile_parts:
                         user_profile_info = "Based on your profile, here's some information I have:\n" + "\n".join(profile_parts) + "\n\n"
                    else:
                         user_profile_info = "I see you're logged in, but your profile details seem minimal. Adding more details can help me give you more personalized advice!\n\n"
                else:
                    logger.warning(f"Profile data for user {user_id_str} is empty after conversion.")
                    user_profile_info = "Welcome! I couldn't retrieve your profile details fully. Completing your profile might help.\n\n"

            else:
                logger.warning(f"User profile document not found in Firestore for user_id: {user_id_str}")
                # Maybe create a basic profile entry here? Or just inform the user.
                user_profile_info = "Welcome! It looks like your detailed profile isn't set up yet. Completing it can lead to more personalized help.\n\n"
        except Exception as e:
            logger.error(f"Error fetching/processing Firestore profile for {user_id}: {e}", exc_info=True)
            # Don't block chat, just provide a generic message about the profile issue
            user_profile_info = "There was an issue checking your profile details.\n\n"
    elif is_first_user_message and not user_id:
        # Handle anonymous user's first message if needed (optional)
        logger.info("Processing first message from anonymous user.")
        # user_profile_info = "Hello there! How can I help you today?\n\n" # Example anonymous greeting
    # --- End User Profile Fetch ---


    # 1. Bias Check
    is_biased, bias_type = detect_bias(query)
    if is_biased:
        logger.warning(f"Bias detected (Type: {bias_type}) in query: {query}")
        log_analytics_event("bias_detected", { "query": query, "prevented": True, "bias_type": bias_type, "language": language, "user_id": user_id or 'anonymous' })
        return jsonify({"response": handle_bias()}), 200

    # 2. Topic-Specific RAG Pipeline
    try:
        source_filter: Optional[str] = None
        # Normalize topic terms and set filter
        if topic in ["career", "job", "jobs"]: source_filter = "job"; topic = "career"
        elif topic in ["session", "event", "events", "sessions", "workshop", "workshops"]: source_filter = "session"; topic = "session"

        passages_with_metadata = get_relevant_passage(
            query, vector_collection, n_results=5, source_type_filter=source_filter
        )

        # Create prompt - Note: We are NOT adding user profile data to the RAG context/prompt itself
        # The profile info is only used for the initial response message prepending.
        prompt = make_rag_prompt(
            query=query,
            passages_with_metadata=passages_with_metadata,
            language=language,
            topic=topic
        )

        response_text = generate_answer(prompt)

        # Prepend profile info *only* if it was generated earlier
        if user_profile_info:
             # Format the final response
             final_response = f"Hello {user_name}! {user_profile_info}Here's what I found:\n\n{response_text}"
        else:
             final_response = response_text # Standard response for subsequent messages or anonymous users

    except Exception as e:
        logger.error(f"Error during RAG pipeline: {e}", exc_info=True)
        # Use final_response variable name consistently
        final_response = "Sorry, I encountered an error processing your request."
        # Decide on status code - 500 Internal Server Error is appropriate
        return jsonify({"error": final_response}), 500


    end_time = datetime.now()
    response_time_sec = (end_time - start_time).total_seconds()

    # 3. Log Analytics
    log_analytics_event("chat", {
        "query": query,
        "response_length": len(final_response), # Log length of the final combined response
        "response_time": response_time_sec,
        "language": language,
        "user_id": user_id or 'anonymous', # Ensure user_id is logged
        "topic": topic,
        "has_context": bool(passages_with_metadata)
    })

    return jsonify({
        "response": final_response, # Send the potentially prepended response
        "messageId": str(uuid.uuid4()),
        "timestamp": datetime.now().isoformat(),
        "bias_detected": False,
    }), 200
            
# --- Admin Data Endpoints ---
@app.route('/admin/sessions', methods=['GET'])
def get_sessions():
    sessions = read_json(Config.SESSIONS_FILE, default=[])
    return jsonify(sessions)

@app.route('/admin/sessions', methods=['POST'])
def update_sessions():
    data = request.get_json()
    if not data or 'sessions' not in data:
        return jsonify({"error": "Invalid data format"}), 400
    sessions = data['sessions']
    if not isinstance(sessions, list):
        return jsonify({"error": "'sessions' must be a list"}), 400

    if write_json(Config.SESSIONS_FILE, sessions):
        if update_vector_store():  # Attempt to update vector store
            return jsonify(sessions), 200
        else:
            logger.error("Sessions saved, but failed to update vector store.")
            return jsonify({"error": "Data saved, but knowledge base update failed. Please try updating manually."}), 500
    else:
        return jsonify({"error": "Failed to save session data"}), 500

@app.route('/admin/jobs', methods=['GET'])
def get_jobs():
    jobs = read_csv(Config.JOBS_FILE)
    return jsonify(jobs)

@app.route('/admin/jobs', methods=['POST'])
def update_jobs():
    data = request.get_json()
    if not data or 'jobs' not in data:
        return jsonify({"error": "Invalid data format"}), 400
    jobs = data['jobs']
    if not isinstance(jobs, list):
        return jsonify({"error": "'jobs' must be a list"}), 400

    # Define expected headers (adjust if needed)
    fieldnames = ['id', 'title', 'company', 'location', 'type', 'deadline', 'description', 'applyUrl', 'verified', 'category', 'source', 'diversity_focus']

    if write_csv(Config.JOBS_FILE, jobs, fieldnames=fieldnames):
        if update_vector_store():
            return jsonify(jobs), 200
        else:
            logger.error("Jobs saved, but failed to update vector store.")
            return jsonify({"error": "Data saved, but knowledge base update failed. Please try updating manually."}), 500
    else:
        return jsonify({"error": "Failed to save job data"}), 500

@app.route('/admin/trusted-sources', methods=['GET'])
def get_trusted_sources():
    """Returns the raw trusted sources data for admin dashboard."""
    sources = read_json(Config.TRUSTED_SOURCES_FILE, default=[])
    if not sources:
        return jsonify([]), 200  # Return empty array if no sources found
    return jsonify(sources), 200

@app.route('/admin/trusted-sources', methods=['POST'])
def update_trusted_sources():
    """Updates the trusted sources data."""
    try:
        # Get the updated sources from request body
        sources = request.json
        if not isinstance(sources, list):
            return jsonify({"error": "Invalid data format. Expected an array of trusted sources."}), 400

        # Validate each source has required fields
        required_fields = ['id', 'name', 'url', 'category', 'description', 'verified', 'dataType']
        for source in sources:
            missing_fields = [field for field in required_fields if field not in source]
            if missing_fields:
                return jsonify({
                    "error": f"Missing required fields: {', '.join(missing_fields)}",
                    "source": source
                }), 400

        # Write to the trusted sources file
        if not write_json(Config.TRUSTED_SOURCES_FILE, sources):
            return jsonify({"error": "Failed to write trusted sources file"}), 500

        return jsonify(sources), 200

    except Exception as e:
        logger.error(f"Error updating trusted sources: {e}", exc_info=True)
        return jsonify({"error": "Internal server error updating trusted sources"}), 500

# --- Feedback Endpoints ---
@app.route('/api/submit-feedback', methods=['POST'])
def submit_feedback():
    feedback_data = request.json
    if not feedback_data:
        return jsonify({'error': 'No feedback data provided'}), 400

    feedback_id = feedback_data.get('feedback_id', str(uuid.uuid4()))
    timestamp = feedback_data.get('timestamp', datetime.now().isoformat())
    status = feedback_data.get('status', 'pending') # Default status

    # Create a summary preview
    preview_content = feedback_data.get('messageContent', '') or feedback_data.get('additionalDetails', '')
    preview = (preview_content[:100] + '...') if len(preview_content) > 100 else preview_content
    if not preview: preview = "No preview available"

    # Prepare feedback data to save
    feedback_to_save = {
        **feedback_data, # Include all original data
        'id': feedback_id, # Ensure 'id' field exists for consistency
        'feedback_id': feedback_id,
        'timestamp': timestamp,
        'status': status,
        'preview': preview # Add generated preview
    }

    feedback_file_path = Config.FEEDBACK_DIR / f"{feedback_id}.json"
    if not write_json(feedback_file_path, feedback_to_save):
        return jsonify({'error': 'Failed to save feedback detail file'}), 500

    # Update the feedback list
    feedback_list = read_json(Config.FEEDBACK_LIST_FILE, default=[])
    if not isinstance(feedback_list, list): feedback_list = [] # Ensure it's a list

    # Create summary for the list
    feedback_summary = {
        'id': feedback_id,
        'feedbackType': feedback_data.get('feedbackType', 'general'),
        'timestamp': timestamp,
        'status': status,
        'preview': preview
    }

    # Avoid duplicates in list (optional, based on ID)
    feedback_list = [item for item in feedback_list if item.get('id') != feedback_id]
    feedback_list.append(feedback_summary)

    if not write_json(Config.FEEDBACK_LIST_FILE, feedback_list):
         # Log error, but maybe still return success to client? Depends on requirements.
         logger.error(f"Failed to update feedback list file, but detail file {feedback_id}.json was saved.")
         # return jsonify({'error': 'Failed to update feedback list'}), 500 # Stricter failure
         # Lenient failure:
         return jsonify({'success': True, 'feedback_id': feedback_id, 'warning': 'Failed to update summary list'}), 200

    # Log analytics event
    log_analytics_event("feedback", {
        "feedback_id": feedback_id,
        "feedback_type": feedback_summary['feedbackType'],
        "accuracy_rating": feedback_data.get("accuracy_rating", "unsure"), # Extract rating if provided
        "helpful": feedback_data.get("helpful", None), # Extract helpfulness if provided
        "user_id": feedback_data.get("userId", "anonymous")
    })

    return jsonify({'success': True, 'feedback_id': feedback_id}), 200

@app.route('/admin/feedback', methods=['GET'])
def get_feedback_list():
    # Directly read the list file
    feedback_list = read_json(Config.FEEDBACK_LIST_FILE, default=None)

    if feedback_list is None: # Check if read_json failed
        # Make sure to return after error
        return jsonify({"error": "Could not read feedback list file"}), 500

    if not isinstance(feedback_list, list):
        logger.error(f"Feedback list file does not contain a list: {Config.FEEDBACK_LIST_FILE}")
        # Attempt to fix by writing an empty list
        write_json(Config.FEEDBACK_LIST_FILE, [])
        return jsonify([]), 200 # Return empty list now

    # Add default sample data if the list is empty (for demo purposes)
    if not feedback_list:
         logger.info("Feedback list is empty, returning sample data.")
         # You might want to remove this block for production
         sample_feedback = [
            {"id": "sample-1", "feedbackType": "inaccurate", "timestamp": datetime.now().isoformat(), "status": "pending", "preview": "Sample: Incorrect info."},
            {"id": "sample-2", "feedbackType": "helpful", "timestamp": (datetime.now() - timedelta(days=1)).isoformat(), "status": "resolved", "preview": "Sample: Very helpful explanation!"},
         ]
         return jsonify(sample_feedback) # Return sample if list was empty

    # If everything is okay, return the actual list
    return jsonify(feedback_list)

@app.route('/admin/feedback/<string:feedback_id>', methods=['GET'])
def get_feedback_detail(feedback_id):
    # Validate feedback_id format (optional, basic check)
    if not re.match(r'^[a-zA-Z0-9-]+$', feedback_id):
        return jsonify({"error": "Invalid feedback ID format"}), 400

    feedback_file_path = Config.FEEDBACK_DIR / f"{feedback_id}.json"
    feedback_data = read_json(feedback_file_path, default=None)

    if feedback_data is None:
        # Correct place to return 404
        return jsonify({"error": "Feedback not found or could not be read"}), 404

    # This return should only happen if feedback_data is NOT None
    return jsonify(feedback_data), 200
        
@app.route('/admin/feedback/<string:feedback_id>/status', methods=['PUT'])
def update_feedback_status(feedback_id):
    if not re.match(r'^[a-zA-Z0-9-]+$', feedback_id):
        return jsonify({"error": "Invalid feedback ID format"}), 400

    data = request.json
    if not data or 'status' not in data:
        return jsonify({"error": "Missing 'status' in request body"}), 400

    new_status = data['status']
    valid_statuses = ['new', 'pending', 'reviewed', 'resolved'] # Added 'pending'
    if new_status not in valid_statuses:
        return jsonify({"error": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"}), 400

    # Update the individual feedback file
    feedback_file_path = Config.FEEDBACK_DIR / f"{feedback_id}.json"
    feedback_data = read_json(feedback_file_path, default=None)

    if feedback_data is None:
        return jsonify({"error": "Feedback detail file not found or could not be read"}), 404 # Return 404

    # Update status in the loaded data
    feedback_data['status'] = new_status

    # Write the updated data back to the detail file
    if not write_json(feedback_file_path, feedback_data):
        # If saving fails, return an error
        return jsonify({"error": "Failed to update feedback detail file"}), 500

    # --- Attempt to update the master list (secondary operation) ---
    list_update_failed = False # Flag to track list update status
    try:
        feedback_list = read_json(Config.FEEDBACK_LIST_FILE, default=[])
        if isinstance(feedback_list, list):
            item_found_in_list = False
            for item in feedback_list:
                # Use .get() for safer access and compare as string
                if item.get('id') and str(item.get('id')) == feedback_id:
                    item['status'] = new_status
                    item_found_in_list = True
                    break # Exit loop once found

            if item_found_in_list:
                if not write_json(Config.FEEDBACK_LIST_FILE, feedback_list):
                    logger.error(f"Failed to write updated status to feedback list file for {feedback_id}")
                    list_update_failed = True # Mark list update as failed
            else:
                 logger.warning(f"Feedback ID {feedback_id} not found in list file during status update.")
                 # Don't mark as error if not found, detail was updated successfully

        else:
            logger.error(f"feedback_list.json content is not a list. Path: {Config.FEEDBACK_LIST_FILE}")
            list_update_failed = True # Mark as failed if file content is wrong

    except Exception as e:
        logger.error(f"Exception during feedback list update for {feedback_id}: {e}", exc_info=True)
        list_update_failed = True # Mark as failed on any exception

    # --- Return final response ---
    response_payload = {"success": True, "data": feedback_data}
    if list_update_failed:
        # Add a warning if the secondary operation (list update) failed
        response_payload["warning"] = "Feedback detail updated, but failed to update summary list."

    # Return 200 OK because the primary operation (updating detail file) succeeded
    return jsonify(response_payload), 200
        
# --- External Content Endpoint ---
@app.route('/fetch-external-content', methods=['GET'])
def fetch_external_content():
    """Fetches and categorizes content from trusted sources."""
    sources = read_json(Config.TRUSTED_SOURCES_FILE, default=[])
    if not sources:
        return jsonify({"error": "Trusted sources file not found or empty"}), 500

    external_content: Dict[str, List[Dict[str, Any]]] = {
        "career_resources": [], "entrepreneurship": [], "job_opportunities": [],
        "skill_development": [], "policy_initiatives": [], "latest_articles": []
    }
    # Mapping from source 'dataType' to our internal category keys
    category_map = {
        'career_resources': 'career_resources', 'tech_careers': 'career_resources',
        'entrepreneurship': 'entrepreneurship', 'entrepreneurship_resources': 'entrepreneurship', 'startup_resources': 'entrepreneurship',
        'job_listings': 'job_opportunities', 'communities_jobs': 'job_opportunities',
        'skilling_livelihoods': 'skill_development', 'tech_education': 'skill_development',
        'policies_programs': 'policy_initiatives', 'legal_support': 'policy_initiatives', 'research_advocacy': 'policy_initiatives',
        'articles_resources': 'latest_articles', 'recognition_stories': 'latest_articles'
    }

    for source in sources:
        source_name = source.get('name', 'Unknown Source')
        data_type = source.get('dataType')
        category = category_map.get(data_type, 'latest_articles') # Default to articles if type unknown

        # Simulate fetching - Replace with actual fetching logic using requests
        # Example: requests.get(source['url'], timeout=10).json() or parse HTML
        simulated_data = {
            "title": f"Content from {source_name}",
            "description": source.get('description', f"Explore resources from {source_name}."),
            "url": source.get('url', '#'),
            "source": source_name,
            "date": datetime.now().strftime(Config.ANALYTICS_DATE_FORMAT),
            "verified": source.get('verified', False)
        }
        if category in external_content:
            external_content[category].append(simulated_data)
        else:
             logger.warning(f"Unknown category '{category}' derived from dataType '{data_type}' for source '{source_name}'")

        
        return jsonify(external_content), 200
        
# --- Analytics Aggregation Endpoint ---
# REPLACE the /admin/analytics endpoint function:
@app.route('/admin/analytics', methods=['GET'])
def get_analytics_data():
    """Aggregates and returns analytics data based on logged events for a specific year."""
    try:
        # --- Get Year Parameter ---
        current_year = datetime.now().year
        try:
            # Get 'year' from query param, default to current year, ensure it's an int
            year_to_process = request.args.get('year', default=current_year, type=int)
            # Optional: Add validation for a reasonable year range if needed
            if year_to_process < 2020 or year_to_process > current_year + 1:
                 raise ValueError("Year out of reasonable range")
        except (ValueError, TypeError):
             logger.warning(f"Invalid or missing year parameter. Defaulting to {current_year}.")
             year_to_process = current_year

        logger.info(f"Generating analytics for year: {year_to_process}")

        # --- Aggregate Data for the Selected Year ---
# Inside the get_analytics_data function:

# --- Aggregate Data for the Selected Year ---
        raw_events = []
        # CHANGE THE GLOB PATTERN back to .json
        year_pattern = f"events_{year_to_process}-??-??.json" # Look for .json files
        event_files = sorted(Config.ANALYTICS_DIR.glob(year_pattern))

        if not event_files:
            logger.warning(f"No event files found for year {year_to_process}")
            # ... (return empty data structure as before) ...
            empty_data: AnalyticsData = { # Define or import AnalyticsData type
                "conversations": {"total_conversations": 0, "conversations_by_date": {}, "language_distribution": {}, "topic_distribution": {}, "response_times": [], "bias_metrics": {"bias_detected_count": 0, "bias_prevented_count": 0, "bias_types": {}}},
                "users": {"total_users": 0, "active_users": 0},
                "feedback": {"total_feedback": 0, "accuracy_ratings": {"accurate": 0, "inaccurate": 0, "unsure": 0, "other": 0}, "feedback_by_date": {}, "response_quality": {"helpful": 0, "not_helpful": 0}}
            }
            return jsonify(empty_data), 200


        # Read each file, expecting a JSON array inside
        for event_file in event_files:
            try:
                # Use read_json helper, expecting a list
                file_events = read_json(event_file, default=None) # Default to None to detect read errors

                if file_events is None:
                    logger.error(f"Failed to read or parse JSON array from {event_file}")
                    continue # Skip this file if reading failed

                if isinstance(file_events, list):
                    # EXTEND the main list with the list from the file
                    valid_events_in_file = []
                    for event in file_events:
                        if isinstance(event, dict) and 'timestamp' in event and 'event_type' in event:
                            valid_events_in_file.append(event)
                        else:
                            logger.warning(f"Skipping invalid event structure within {event_file}: {str(event)[:100]}...")
                    raw_events.extend(valid_events_in_file)
                else:
                    logger.warning(f"Content of {event_file} is not a JSON list. Skipping file.")

            except Exception as e: # Catch potential errors during read_json or processing
                logger.error(f"Could not process event file {event_file}: {e}")


        # --- Process Events into Desired Structure (Logic remains largely the same) ---
        conversations: Dict[str, Any] = {
            "total_conversations": 0,
            "conversations_by_date": {}, # Will contain daily data for the whole year
            "language_distribution": {},
            "topic_distribution": {},
            "response_times": [],
            "bias_metrics": {"bias_detected_count": 0, "bias_prevented_count": 0, "bias_types": {}},
        }
        feedback: Dict[str, Any] = {
            "total_feedback": 0,
            "accuracy_ratings": {"accurate": 0, "inaccurate": 0, "unsure": 0, "other": 0},
            "feedback_by_date": {}, # Daily data for the whole year
            "response_quality": {"helpful": 0, "not_helpful": 0},
        }
        users_seen_in_year = set()

        for event in raw_events:
            event_type = event.get("event_type")
            event_data = event.get("data", {})
            try:
                # Use date part only for aggregation keys
                event_date = datetime.fromisoformat(event["timestamp"]).strftime(Config.ANALYTICS_DATE_FORMAT)
            except (KeyError, ValueError):
                 logger.warning(f"Skipping event with invalid timestamp: {event.get('id', 'N/A')}")
                 continue # Skip event if timestamp is bad

            # User Tracking for the year
            user_id = event_data.get("user_id")
            if user_id: users_seen_in_year.add(user_id)

            # Conversation Aggregation
            if event_type == "chat":
                conversations["total_conversations"] += 1
                conversations["conversations_by_date"][event_date] = conversations["conversations_by_date"].get(event_date, 0) + 1
                lang = event_data.get("language", "Unknown")
                conversations["language_distribution"][lang] = conversations["language_distribution"].get(lang, 0) + 1
                topic = event_data.get("topic", "general")
                conversations["topic_distribution"][topic] = conversations["topic_distribution"].get(topic, 0) + 1
                response_time = event_data.get("response_time_sec") or event_data.get("response_time")
                if response_time is not None:
                    try: # Add try-except for float conversion
                       conversations["response_times"].append(float(response_time))
                    except ValueError:
                       logger.warning(f"Skipping invalid response_time value: {response_time}")


            # Bias Aggregation
            elif event_type == "bias_detected":
                metrics = conversations["bias_metrics"]
                metrics["bias_detected_count"] += 1
                if event_data.get("prevented"): metrics["bias_prevented_count"] += 1
                b_type = event_data.get("bias_type", "other")
                metrics["bias_types"][b_type] = metrics["bias_types"].get(b_type, 0) + 1

            # Feedback Aggregation
            elif event_type == "feedback":
                feedback["total_feedback"] += 1
                feedback["feedback_by_date"][event_date] = feedback["feedback_by_date"].get(event_date, 0) + 1
                accuracy = event_data.get("accuracy_rating", "unsure").lower()
                if accuracy in feedback["accuracy_ratings"]:
                     feedback["accuracy_ratings"][accuracy] += 1
                else:
                     feedback["accuracy_ratings"]["other"] += 1
                if event_data.get("helpful") is True:
                    feedback["response_quality"]["helpful"] += 1
                elif event_data.get("helpful") is False:
                    feedback["response_quality"]["not_helpful"] += 1

        # --- Calculate Derived Metrics (Logic remains the same) ---
        if conversations["total_conversations"] > 0:
            total_feedback = feedback["total_feedback"]
            accurate = feedback["accuracy_ratings"].get("accurate", 0) # Use .get with default
            inaccurate = feedback["accuracy_ratings"].get("inaccurate", 0)
            rated_total = accurate + inaccurate
            feedback["calculated_accuracy_rate"] = (accurate / rated_total * 100) if rated_total > 0 else None
        else:
            feedback["calculated_accuracy_rate"] = None

        detected = conversations["bias_metrics"].get("bias_detected_count", 0)
        prevented = conversations["bias_metrics"].get("bias_prevented_count", 0)
        if detected > 0:
            conversations["bias_metrics"]["prevention_rate"] = (prevented / detected * 100)
        else:
             conversations["bias_metrics"]["prevention_rate"] = None

        # --- Prepare final response ---
        user_metrics = {
            "total_users": len(users_seen_in_year), # Users seen in the selected year
            "active_users": len(users_seen_in_year), # Approximation for the year
            "new_users": None,
            "retention_rate": None
        }

        # Add last updated timestamps
        last_update_time = datetime.now().isoformat()
        conversations["last_updated"] = last_update_time
        feedback["last_updated"] = last_update_time

        # Limit response times array size
        if len(conversations.get("response_times", [])) > 2000: # Allow more for yearly view
             conversations["response_times"] = conversations["response_times"][-2000:]

        # Final structure
        final_data: AnalyticsData = {
            "conversations": conversations,
            "users": user_metrics,
            "feedback": feedback
        }

        return jsonify(final_data), 200

    except Exception as e:
        logger.error(f"Error generating analytics data: {e}", exc_info=True)
        return jsonify({"error": "Failed to generate analytics data"}), 500

@app.route('/admin/feedback-count', methods=['GET'])
def get_feedback_count():
    """Returns the total number of feedback submissions."""
    try:
        feedback_list = read_json(Config.FEEDBACK_LIST_FILE, default=[])
        count = len(feedback_list) if isinstance(feedback_list, list) else 0
        return jsonify({"count": count}), 200
    except Exception as e:
        logger.error(f"Error getting feedback count: {e}")
        return jsonify({"error": "Failed to get feedback count"}), 500

# --- Global Error Handler ---
@app.errorhandler(Exception)
def handle_exception(e):
    """Logs unhandled exceptions and returns a generic error response."""
    tb_str = traceback.format_exc()
    logger.error(f"Unhandled Exception: {e}\nTraceback:\n{tb_str}")
    # Avoid exposing internal details in production
    error_message = "An internal server error occurred."
    # For development, you might want more detail:
    # error_message = f"Internal Server Error: {e}"
    return jsonify({"error": error_message}), 500

# -----------------------------------------------------------------------------
# App Initialization and Run
# -----------------------------------------------------------------------------
def ensure_initial_files():
    """Creates necessary directories and default files if they don't exist."""
    Config.DATA_DIR.mkdir(parents=True, exist_ok=True)
    Config.ANALYTICS_DIR.mkdir(parents=True, exist_ok=True)
    Config.FEEDBACK_DIR.mkdir(parents=True, exist_ok=True)
    Config.CHROMA_DB_PATH.mkdir(parents=True, exist_ok=True)

    # Initialize empty files if they don't exist
    files_to_init = [
        (Config.SESSIONS_FILE, []),
        (Config.JOBS_FILE, [], ['id', 'title', 'company', 'location', 'type', 'deadline', 'description', 'applyUrl', 'verified', 'category', 'source', 'diversity_focus']), # CSV needs headers
        (Config.TRUSTED_SOURCES_FILE, []),
        (Config.FEEDBACK_LIST_FILE, [])
    ]

    for file_path, default_data, *headers in files_to_init:
        if not file_path.exists():
            logger.info(f"Initializing file: {file_path}")
            if file_path.suffix == '.csv':
                write_csv(file_path, default_data, fieldnames=headers[0] if headers else None)
            else:
                write_json(file_path, default_data)

@app.route('/api/classify-topic', methods=['POST'])
def classify_topic():
    """Classifies the topic of a conversation using Gemini."""
    try:
        data = request.get_json()
        if not data or 'message' not in data:
            return jsonify({'error': 'No message provided'}), 400

        message = data['message']
        
        # Configure Gemini
        genai.configure(api_key=Config.GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-1.5-pro')
        
        # Create the classification prompt
        prompt = f"""
        Classify the following message into exactly one of these topics:
        - Career -job searching, career guidance
        - Education -studying, courses, degrees
        - Skill Development -learning new skills, training
        - Interview Prep -interview preparation, hiring
        - Entrepreneurship -business, startup
        - Mentorship -finding mentors, mentoring
        - General anything else

        Message: "{message}"

        Respond with only the topic name in lowercase, nothing else.
        """

        # Generate classification
        response = model.generate_content(prompt)
        topic = response.text.strip().lower()
        print(topic)
        # Validate the topic is one of the expected values
        # valid_topics = {'Career', 'education', 'skill development', 'interview prep', 
        #                'entrepreneurship', 'mentorship', 'general'}
        # if topic not in valid_topics:
        #     topic = 'general'  # Default to general if unexpected topic returned
        
        return jsonify({
            'topic': topic,
            'original_message': message
        })
        
    except Exception as e:
        logger.error(f"Error classifying topic: {str(e)}")
        return jsonify({'error': 'Failed to classify topic'}), 500

if __name__ == "__main__":
    ensure_initial_files() # Ensure directories/files exist before starting
    # Note: Vector store initialization now happens eagerly outside the if __name__ block
    if vector_collection is None:
         logger.warning("Running Flask app without a functional vector store. RAG features will fail.")
    app.run(host="0.0.0.0", port=5000, debug=os.getenv("FLASK_DEBUG", "False").lower() == "true") # Enable debug based on env var