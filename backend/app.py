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
