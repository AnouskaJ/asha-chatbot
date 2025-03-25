
GEMINI_API_KEY = config.GEMINI_API_KEY

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
