                'source_type': 'job',
                'apply_url': job.get('applyUrl', '#'),
                'title': job.get('title', 'N/A'),
                'company': job.get('company', 'N/A'),
                'description': job.get('description', 'N/A'),
                'location': job.get('location', 'N/A')
            }
        try:
                # Add documents one by one for easier error isolation during dev
                collection.add(documents=[doc_text], ids=[job_id], metadatas=[metadata])  # Add metadata
                ingested_count += 1
        except Exception as e:
                logger.error(f"Failed to add job {job_id} to collection: {e}")
        if ingested_count > 0:
            logger.info(f"Successfully ingested {ingested_count} job listings.")

    # Ingest Sessions with metadata
    sessions = read_json(Config.SESSIONS_FILE, default=[])
    if sessions:
        logger.info(f"Attempting to ingest {len(sessions)} sessions...")
        ingested_session_count = 0  # Use a different counter variable name
        for idx, session in enumerate(sessions):
            session_id = f"session_{session.get('id', uuid.uuid4())}"
            doc_text = (
                f"Session Title: {session.get('title', 'N/A')}\n"
                f"Date: {session.get('date', 'N/A')}\n"
                f"Time: {session.get('time', 'N/A')}\n"
                f"Location: {session.get('location', 'N/A')}\n"
                f"Description: {session.get('description', 'No description available.')}"
            )
