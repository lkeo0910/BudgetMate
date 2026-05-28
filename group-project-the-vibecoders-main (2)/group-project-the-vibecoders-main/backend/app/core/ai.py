from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from app.core.config import settings

# Initialize embeddings once for reuse across the application
embeddings = GoogleGenerativeAIEmbeddings(
    model="gemini-embedding-2",
    google_api_key=settings.GOOGLE_API_KEY,
    task_type="retrieval_query",
    output_dimensionality=768
)

# Initialize LLM once for reuse across the application
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=settings.GOOGLE_API_KEY,
    temperature=0
)
