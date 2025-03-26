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
