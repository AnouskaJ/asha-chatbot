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
