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
