# Vector Store Setup and Functions
# -----------------------------------------------------------------------------
class GeminiEmbeddingFunction(EmbeddingFunction):
    def __call__(self, input: List[str]) -> List[List[float]]:
        genai.configure(api_key=Config.GEMINI_API_KEY)
        model = "models/embedding-001"
        try:
            # Batch embedding requests if possible (check API limits)
            # Simplified: process one by one if batching fails or isn't straightforward
            embeddings = []
            for text in input:
                 result = genai.embed_content(model=model, content=text, task_type="retrieval_document")
                 embeddings.append(result["embedding"])
            return embeddings
            # Note: Original code had `title` which might not be supported by all task types.
            # Using batch embed requires careful handling of input size.
            # result = genai.embed_content(model=model, content=input, task_type="retrieval_document")
            # return result["embedding"] # This assumes batching works directly
        except Exception as e:
            logger.error(f"Error generating Gemini embedding: {e}")
            # Provide zero vectors or raise a specific exception
            raise RuntimeError("Embedding generation failed.") from e

def initialize_vector_store() -> chromadb.api.models.Collection:
    """Creates or loads the ChromaDB collection and ingests data."""
    try:
        client = PersistentClient(path=str(Config.CHROMA_DB_PATH)) # Path object needs conversion
        # Use get_or_create for robustness
        collection = client.get_or_create_collection(
            name=Config.CHROMA_COLLECTION_NAME,
