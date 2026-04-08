"""
LoanMatch AI — Daily Analytics Pipeline

Flow:
  PostgreSQL (match_results) → GCS (CSV) → BigQuery (raw table) → dbt (marts)

Schedule: daily at 06:00 UTC
"""
from datetime import datetime, timedelta
import os

from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator

# ── Config ─────────────────────────────────────────────────────────────────────
GCP_PROJECT   = "electric-cosine-485318-f9"
GCS_BUCKET    = "loanmatch-analytics"
GCS_PREFIX    = "loanmatch"
BQ_DATASET    = "loanmatch_raw"
BQ_TABLE      = "match_results"
DBT_PROJECT   = os.path.expanduser("~/projects/loan-matching-ai/loanmatch_dbt")

# PostgreSQL — connects to local Docker DB via host port
DB_HOST = "localhost"
DB_PORT = 5433          # mapped port from docker-compose
DB_NAME = "loanmatch"
DB_USER = "loanmatch"
DB_PASS = "loanmatch123"

default_args = {
    "owner": "airflow",
    "retries": 1,
    "retry_delay": timedelta(minutes=5),
}

# ── Task functions ──────────────────────────────────────────────────────────────

def extract_to_gcs(**context):
    """
    Pull all rows from match_results, write to CSV, upload to GCS.
    Uses run date as partition key so reruns are idempotent.
    """
    import psycopg2
    import csv
    import tempfile
    from google.cloud import storage

    run_date = context["ds"]  # YYYY-MM-DD

    conn = psycopg2.connect(
        host=DB_HOST, port=DB_PORT, dbname=DB_NAME,
        user=DB_USER, password=DB_PASS,
    )
    cur = conn.cursor()

    cur.execute("SELECT column_name FROM information_schema.columns "
                "WHERE table_name='match_results' ORDER BY ordinal_position")
    columns = [row[0] for row in cur.fetchall()]

    cur.execute("SELECT * FROM match_results")
    rows = cur.fetchall()
    cur.close()
    conn.close()

    print(f"Extracted {len(rows)} rows from PostgreSQL")

    with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as f:
        writer = csv.writer(f)
        writer.writerow(columns)
        writer.writerows(rows)
        tmp_path = f.name

    gcs_path = f"{GCS_PREFIX}/{run_date}/match_results.csv"
    client = storage.Client()
    bucket = client.bucket(GCS_BUCKET)
    blob = bucket.blob(gcs_path)
    blob.upload_from_filename(tmp_path)

    os.unlink(tmp_path)
    print(f"Uploaded to gs://{GCS_BUCKET}/{gcs_path}")

    # Pass GCS path to next task via XCom
    return gcs_path


def _ensure_bq_dataset(client):
    """Create BQ dataset if it doesn't exist."""
    from google.cloud import bigquery
    dataset_ref = bigquery.DatasetReference(GCP_PROJECT, BQ_DATASET)
    try:
        client.get_dataset(dataset_ref)
    except Exception:
        dataset = bigquery.Dataset(dataset_ref)
        dataset.location = "US"
        client.create_dataset(dataset)
        print(f"Created dataset {BQ_DATASET}")


def load_gcs_to_bigquery(**context):
    """
    Load match_results CSV from GCS into BigQuery.
    Partitioned by created_at, clustered by employment_type + outcome.
    """
    from google.cloud import bigquery

    ti = context["ti"]
    gcs_path = ti.xcom_pull(task_ids="extract_to_gcs")
    gcs_uri = f"gs://{GCS_BUCKET}/{gcs_path}"

    client = bigquery.Client(project=GCP_PROJECT)
    _ensure_bq_dataset(client)

    table_ref = f"{GCP_PROJECT}.{BQ_DATASET}.{BQ_TABLE}"

    job_config = bigquery.LoadJobConfig(
        source_format=bigquery.SourceFormat.CSV,
        skip_leading_rows=1,
        autodetect=True,
        write_disposition=bigquery.WriteDisposition.WRITE_TRUNCATE,
        time_partitioning=bigquery.TimePartitioning(
            type_=bigquery.TimePartitioningType.DAY,
            field="created_at",
        ),
        clustering_fields=["employment_type", "outcome"],
    )

    load_job = client.load_table_from_uri(gcs_uri, table_ref, job_config=job_config)
    load_job.result()

    table = client.get_table(table_ref)
    print(f"Loaded {table.num_rows} rows into {table_ref}")
    print(f"Partitioned by: created_at (DAY) | Clustered by: employment_type, outcome")


def extract_lenders_to_gcs(**context):
    """Extract lenders reference table to GCS (full refresh, rarely changes)."""
    import psycopg2
    import csv
    import tempfile
    from google.cloud import storage

    run_date = context["ds"]

    conn = psycopg2.connect(
        host=DB_HOST, port=DB_PORT, dbname=DB_NAME,
        user=DB_USER, password=DB_PASS,
    )
    cur = conn.cursor()

    cur.execute("SELECT column_name FROM information_schema.columns "
                "WHERE table_name='lenders' ORDER BY ordinal_position")
    columns = [row[0] for row in cur.fetchall()]

    cur.execute("SELECT * FROM lenders")
    rows = cur.fetchall()
    cur.close()
    conn.close()

    print(f"Extracted {len(rows)} lenders from PostgreSQL")

    with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as f:
        writer = csv.writer(f)
        writer.writerow(columns)
        writer.writerows(rows)
        tmp_path = f.name

    gcs_path = f"{GCS_PREFIX}/{run_date}/lenders.csv"
    client = storage.Client()
    bucket = client.bucket(GCS_BUCKET)
    blob = bucket.blob(gcs_path)
    blob.upload_from_filename(tmp_path)

    os.unlink(tmp_path)
    print(f"Uploaded to gs://{GCS_BUCKET}/{gcs_path}")
    return gcs_path


def load_lenders_to_bigquery(**context):
    """Load lenders CSV from GCS into BigQuery (full refresh)."""
    from google.cloud import bigquery

    ti = context["ti"]
    gcs_path = ti.xcom_pull(task_ids="extract_lenders_to_gcs")
    gcs_uri = f"gs://{GCS_BUCKET}/{gcs_path}"

    client = bigquery.Client(project=GCP_PROJECT)
    _ensure_bq_dataset(client)

    table_ref = f"{GCP_PROJECT}.{BQ_DATASET}.lenders"

    job_config = bigquery.LoadJobConfig(
        source_format=bigquery.SourceFormat.CSV,
        skip_leading_rows=1,
        autodetect=True,
        write_disposition=bigquery.WriteDisposition.WRITE_TRUNCATE,
    )

    load_job = client.load_table_from_uri(gcs_uri, table_ref, job_config=job_config)
    load_job.result()

    table = client.get_table(table_ref)
    print(f"Loaded {table.num_rows} lenders into {table_ref}")


# ── DAG definition ──────────────────────────────────────────────────────────────

with DAG(
    dag_id="loanmatch_daily_pipeline",
    description="LoanMatch AI: PostgreSQL → GCS → BigQuery → dbt",
    schedule="0 6 * * *",
    start_date=datetime(2026, 1, 1),
    catchup=False,
    default_args=default_args,
    tags=["loanmatch", "analytics", "bigquery"],
) as dag:

    t1a_extract_matches = PythonOperator(
        task_id="extract_to_gcs",
        python_callable=extract_to_gcs,
    )

    t1b_extract_lenders = PythonOperator(
        task_id="extract_lenders_to_gcs",
        python_callable=extract_lenders_to_gcs,
    )

    t2a_load_matches = PythonOperator(
        task_id="load_gcs_to_bigquery",
        python_callable=load_gcs_to_bigquery,
    )

    t2b_load_lenders = PythonOperator(
        task_id="load_lenders_to_bigquery",
        python_callable=load_lenders_to_bigquery,
    )

    t3_dbt = BashOperator(
        task_id="dbt_run",
        bash_command=f"cd {DBT_PROJECT} && dbt run --target prod",
    )

    t4_dbt_test = BashOperator(
        task_id="dbt_test",
        bash_command=f"cd {DBT_PROJECT} && dbt test --target prod",
    )

    # Extract both tables in parallel, then load in parallel, then dbt
    [t1a_extract_matches, t1b_extract_lenders]
    t1a_extract_matches >> t2a_load_matches
    t1b_extract_lenders >> t2b_load_lenders
    [t2a_load_matches, t2b_load_lenders] >> t3_dbt >> t4_dbt_test
