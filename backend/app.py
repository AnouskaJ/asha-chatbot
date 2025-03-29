
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
