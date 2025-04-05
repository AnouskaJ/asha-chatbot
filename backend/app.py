        logger.info("Vector store re-initialized successfully.")
        return True
    except Exception as e:
        logger.error(f"Error updating vector store: {e}")
        return False

# -----------------------------------------------------------------------------
# RAG Pipeline Functions (Refined Prompts)
# -----------------------------------------------------------------------------
# REPLACE this function:
def get_relevant_passage(
    query: str,
    db: Collection, # Changed type hint
    n_results: int = 5, # Retrieve more initially for potential filtering/ranking
    source_type_filter: Optional[str] = None
) -> List[Tuple[str, Dict[str, Any]]]:
    """Retrieves relevant passages, optionally filtered by source_type, and returns docs with metadata."""
    if not db:
        logger.error("Vector store not available for query.")
        return []
    try:
        # Construct the where clause only if a filter is provided
        where_clause = {'source_type': source_type_filter} if source_type_filter else None

        # Perform the query, including metadata and specifying the where clause if applicable
        if where_clause:
            results = db.query(query_texts=[query], n_results=n_results, where=where_clause, include=['documents', 'metadatas'])
        else:
            # Query without filter if no source type specified
            results = db.query(query_texts=[query], n_results=n_results, include=['documents', 'metadatas'])
