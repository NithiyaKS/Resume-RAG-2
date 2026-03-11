# Resume Data Platform Architecture

## Phase 1 -- Data Ingestion (CSV → JSON → Embeddings → MongoDB Atlas)

------------------------------------------------------------------------

## 1. Overview

Phase 1 focuses on building the **data ingestion pipeline** for resume
data.

The system allows users to upload a **CSV file containing resume
information**, converts the content into **JSON**, generates **vector
embeddings using Mistral**, and stores the structured data and
embeddings in **MongoDB Atlas**.

The architecture supports future phases that will introduce **search,
reranking, summarization, and a full RAG pipeline**.

------------------------------------------------------------------------

## 2. Technology Stack

**Frontend** - TypeScript

**Backend** - Node.js - Express.js

**AI** - Mistral Embedding API

**Database** - MongoDB Atlas

**Search (future phases)** - Atlas Vector Search - BM25 - Hybrid Search

------------------------------------------------------------------------

## 3. High Level Architecture

``` mermaid
flowchart LR

User[User] --> UI[Frontend - TypeScript]

UI --> API[Backend - Node.js Express]

API --> CSVParser[CSV Parser]

CSVParser --> JSONMapper[CSV to JSON Converter]

JSONMapper --> EmbeddingService[Embedding Service]

EmbeddingService --> Mistral[Mistral Embedding API]

EmbeddingService --> Mongo[(MongoDB Atlas)]
```

------------------------------------------------------------------------

## 4. Component Architecture

``` mermaid
flowchart TB

subgraph Frontend
UI[TypeScript Web UI]
end

subgraph Backend
API[Express API]
UploadService[CSV Upload Service]
CSVParser[CSV Parser]
JSONMapper[JSON Mapper]
EmbeddingService[Embedding Service]
ErrorHandler[Manual Review Queue]
end

subgraph AI
MistralAPI[Mistral Embedding API]
end

subgraph Database
Mongo[(MongoDB Atlas)]
end

UI --> API
API --> UploadService
UploadService --> CSVParser
CSVParser --> JSONMapper
JSONMapper --> EmbeddingService
EmbeddingService --> MistralAPI
EmbeddingService --> Mongo
EmbeddingService --> ErrorHandler
```

------------------------------------------------------------------------

## 5. Data Processing Flow

### Step 1 -- CSV Upload

User uploads a CSV file through the frontend.

Example CSV:

    name,email,skills,experience,education,summary
    John Doe,john@mail.com,"Python,AI",5,"B.Tech","AI engineer"

------------------------------------------------------------------------

### Step 2 -- CSV Parsing

The backend parses the CSV file and converts each row into JSON.

Example JSON:

``` json
{
  "name": "John Doe",
  "email": "john@mail.com",
  "skills": ["Python","AI"],
  "experience": 5,
  "education": "B.Tech",
  "summary": "AI engineer"
}
```

------------------------------------------------------------------------

### Step 3 -- Embedding Generation

The backend sends selected fields to **Mistral Embedding API**.

Typical embedding fields:

-   skills
-   summary
-   experience description

------------------------------------------------------------------------

### Step 4 -- MongoDB Storage

Example stored document:

``` json
{
  "_id": "ObjectId",
  "name": "John Doe",
  "email": "john@mail.com",
  "skills": ["Python","AI"],
  "experience": 5,
  "education": "B.Tech",
  "summary": "AI engineer with 5 years experience",
  "skills_embedding": [],
  "summary_embedding": []
}
```

------------------------------------------------------------------------

## 6. Backend APIs

### Upload CSV

POST /api/upload-csv

Uploads CSV and triggers ingestion.

------------------------------------------------------------------------

### Convert CSV to JSON

POST /api/convert

Transforms CSV rows to JSON.

------------------------------------------------------------------------

### Generate Embeddings

POST /api/embed

Calls Mistral API and stores embeddings.

------------------------------------------------------------------------

## 7. Environment Configuration

`.env`

    PORT=3000

    MONGO_URI=mongodb+srv://cluster-url
    DB_NAME=resume_db
    COLLECTION_NAME=resumes

    MISTRAL_API_KEY=your_api_key
    MISTRAL_EMBED_MODEL=mistral-embed

    SEARCH_INDEX_NAME=resume_search_index

    API_KEY=internal_api_key

------------------------------------------------------------------------

## 8. Project Structure

    resume-platform

    frontend/
       src/

    backend/
       controllers/
       routes/
       services/
       utils/

    config/
    architecture.md
    .env

------------------------------------------------------------------------

# Future Phases

## Phase 2 -- Resume Search

Implement search capabilities using:

-   MongoDB Atlas Vector Search
-   BM25 keyword search
-   Hybrid search

Capabilities:

-   Semantic resume search
-   Skill based candidate discovery

------------------------------------------------------------------------

## Phase 3 -- Rerank and Summarization

Enhance search results using:

-   LLM based reranking
-   Candidate profile summarization
-   Job-to-resume matching explanations

Capabilities:

-   Top candidate ranking
-   Resume summarization
-   Recruiter insights

------------------------------------------------------------------------

## Phase 4 -- One Click RAG Pipeline

Build a complete **Retrieval Augmented Generation system**.

Pipeline:

User Query → Vector Search → Rerank → Context Assembly → LLM Response

Capabilities:

-   Ask questions about candidates
-   AI generated recruiter insights
-   Natural language talent search

Example:

"Find senior AI engineers with Python and summarize top candidates"

------------------------------------------------------------------------

## End Goal

A **complete AI-powered resume intelligence platform** with:

-   ingestion
-   semantic search
-   AI ranking
-   summarization
-   RAG based recruiter assistant
