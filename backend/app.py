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
