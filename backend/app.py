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
