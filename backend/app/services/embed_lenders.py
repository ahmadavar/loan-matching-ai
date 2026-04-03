"""
Run once to embed all lenders into PostgreSQL using pgvector.
Usage: python -m app.services.embed_lenders
"""
import os
import psycopg2
from sentence_transformers import SentenceTransformer
from app.data.loader import get_lenders
LENDERS = get_lenders()
from dotenv import load_dotenv

load_dotenv()

MODEL_NAME = "all-MiniLM-L6-v2"  # 384-dimensional embeddings, runs locally


def build_lender_text(lender: dict) -> str:
    return (
        f"{lender['name']}. {lender['description']} "
        f"Loan types: {', '.join(lender['loan_types'])}. "
        f"Specializations: {', '.join(lender.get('specializations', []))}. "
        f"Accepted employment: {', '.join(lender.get('accepted_employment_types', []))}. "
        f"Min credit score: {lender['credit_score_min']}. "
        f"Min annual income: ${lender['min_annual_income']:,}."
    )


def embed_all_lenders():
    db_url = os.getenv("DATABASE_URL")
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    # Create table if not exists
    cur.execute("""
        CREATE TABLE IF NOT EXISTS lender_embeddings (
            id SERIAL PRIMARY KEY,
            lender_name TEXT UNIQUE NOT NULL,
            description TEXT NOT NULL,
            embedding vector(384)
        );
    """)
    conn.commit()

    print(f"Loading model: {MODEL_NAME}")
    model = SentenceTransformer(MODEL_NAME)

    print(f"Embedding {len(LENDERS)} lenders...")
    for lender in LENDERS:
        text = build_lender_text(lender)
        embedding = model.encode(text).tolist()

        cur.execute("""
            INSERT INTO lender_embeddings (lender_name, description, embedding)
            VALUES (%s, %s, %s)
            ON CONFLICT (lender_name) DO UPDATE
                SET description = EXCLUDED.description,
                    embedding = EXCLUDED.embedding;
        """, (lender["name"], text, embedding))
        print(f"  ✓ {lender['name']}")

    # Create index for fast cosine similarity search
    cur.execute("""
        CREATE INDEX IF NOT EXISTS lender_embeddings_idx
        ON lender_embeddings USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 10);
    """)
    conn.commit()
    cur.close()
    conn.close()
    print(f"\nDone. {len(LENDERS)} lenders embedded and stored in PostgreSQL.")


if __name__ == "__main__":
    embed_all_lenders()
