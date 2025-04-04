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
