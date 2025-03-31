
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
