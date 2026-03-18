# Databricks notebook source
import sys, os, json
sys.path.append(os.path.abspath("../config"))
import settings
import pandas as pd
from datetime import datetime
import mlflow.deployments
from databricks.vector_search.client import VectorSearchClient

export_dir = "/dbfs/FileStore/swasth_ai/exports/"
os.makedirs(export_dir, exist_ok=True)

# COMMAND ----------
def export_table(tbl, filename):
    df = spark.table(f"{settings.CATALOG}.{tbl}").toPandas()
    df.to_json(os.path.join(export_dir, filename), orient="records")
    print(f"Exported {filename} to {export_dir}")

export_table(f"{settings.SCHEMA_MAIN}.body_areas", "body_areas.json")
export_table(f"{settings.SCHEMA_MAIN}.symptoms", "symptoms.json")
export_table(f"{settings.SCHEMA_MAIN}.duration_options", "duration_options.json")
export_table(f"{settings.SCHEMA_MAIN}.severity_config", "severity_config.json")
export_table(f"{settings.SCHEMA_MAIN}.diseases", "diseases.json")

# COMMAND ----------
cases = spark.sql(f"SELECT c.* FROM {settings.CATALOG}.{settings.SCHEMA_SYNTHETIC}.patient_cases c JOIN {settings.CATALOG}.{settings.SCHEMA_EVAL}.validation_results v ON c.source_disease = v.disease_name WHERE v.is_valid = true").toPandas()
cases['step1_symptoms'] = cases['step1_symptoms'].apply(lambda x: json.loads(x) if isinstance(x, str) else x)
cases.to_json(os.path.join(export_dir, "patient_cases.json"), orient="records")
print(f"Exported patient_cases.json with {len(cases)} valid cases.")

# COMMAND ----------
try:
    acc = float(spark.table(f"{settings.CATALOG}.{settings.SCHEMA_EVAL}.validation_results").toPandas()['is_valid'].mean() * 100)
except:
    acc = 0.0

summary = {
    "total_body_areas": 6,
    "total_symptoms": 35,
    "total_diseases": 20,
    "total_encyclopedia_chunks": 60,
    "total_synthetic_cases": len(cases),
    "validation_accuracy": acc,
    "vector_search_endpoint": settings.VECTOR_ENDPOINT,
    "vector_index": settings.VECTOR_INDEX,
    "embedding_model": settings.EMBEDDING_ENDPOINT,
    "embedding_dimension": settings.EMBEDDING_DIMENSION,
    "generated_at": str(datetime.now())
}
with open(os.path.join(export_dir, "database_summary.json"), "w") as f:
    json.dump(summary, f)
print("Exported database_summary.json")

# COMMAND ----------
# Print download URLs
print("\n--- Download URLs for Node.js Backend ---")
workspace_url = spark.conf.get("spark.databricks.workspaceUrl", "<workspace_url>")
files = ["body_areas.json", "symptoms.json", "duration_options.json", "severity_config.json", "diseases.json", "patient_cases.json", "database_summary.json"]
for file in files:
    print(f"https://{workspace_url}/files/swasth_ai/exports/{file}")

# COMMAND ----------
# End to end Vector Search Test
print("\n--- Final End-to-End Test ---")
print("Input: symptoms = Chest Pain + Shortness of Breath, duration = less than 1 day, severity = 8")

deploy_client = mlflow.deployments.get_deploy_client("databricks")
test_emb = deploy_client.predict(endpoint=settings.EMBEDDING_ENDPOINT, inputs={"input": ["Chest Pain Shortness of Breath severe 8"]})["data"][0]["embedding"]
vsc = VectorSearchClient()
index = vsc.get_index(settings.VECTOR_ENDPOINT, settings.VECTOR_INDEX)
res = index.similarity_search(query_vector=test_emb, columns=["disease_name"], num_results=5)

found_angina = False
print("Top matched diseases:")
for i, r in enumerate(res.get('result', {}).get('data_array', [])):
    print(f"{i+1}. {r[0]}")
    if 'Angina' in r[0] and i < 3: 
        found_angina = True

if found_angina:
    print("\n✅ PASS - Angina found in the top 3 results!")
else:
    print("\n❌ FAIL - Angina not found in the top 3 results.")
