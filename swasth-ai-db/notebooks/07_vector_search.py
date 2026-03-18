# Databricks notebook source
import sys, os, time
sys.path.append(os.path.abspath("../config"))
import settings
from databricks.vector_search.client import VectorSearchClient
import mlflow.deployments

vsc = VectorSearchClient()

# COMMAND ----------
# Step 1: Create endpoint
endpoints = [e['name'] for e in vsc.list_endpoints().get('endpoints', [])]
if settings.VECTOR_ENDPOINT not in endpoints:
    vsc.create_endpoint(name=settings.VECTOR_ENDPOINT, endpoint_type="STANDARD")
    print(f"Creating endpoint '{settings.VECTOR_ENDPOINT}', this may take a few minutes...")
    while vsc.get_endpoint(settings.VECTOR_ENDPOINT)['endpoint_status']['state'] in ['PROVISIONING']:
        time.sleep(30)
else:
    print(f"Endpoint '{settings.VECTOR_ENDPOINT}' already exists.")

# COMMAND ----------
# Step 2: Create delta sync index
index_name = settings.VECTOR_INDEX
source_table = f"{settings.CATALOG}.{settings.SCHEMA_VECTORS}.encyclopedia_with_embeddings"

indexes = [i['name'] for i in vsc.list_indexes(settings.VECTOR_ENDPOINT).get('vector_indexes', [])]
if index_name not in indexes:
    print(f"Creating vector index '{index_name}'...")
    vsc.create_delta_sync_index(
        endpoint_name=settings.VECTOR_ENDPOINT,
        source_table_name=source_table,
        index_name=index_name,
        pipeline_type='TRIGGERED',
        primary_key='chunk_id',
        embedding_dimension=settings.EMBEDDING_DIMENSION,
        embedding_vector_column='embedding'
    )

# COMMAND ----------
# Step 3: Wait for sync
print("Waiting for index sync...")
for _ in range(20):
    status = vsc.get_index(settings.VECTOR_ENDPOINT, index_name).describe()['status']
    print(status)
    if status['ready']: break
    time.sleep(30)

# COMMAND ----------
# Step 4: Test query 1
deploy_client = mlflow.deployments.get_deploy_client("databricks")
test_emb = deploy_client.predict(endpoint=settings.EMBEDDING_ENDPOINT, inputs={"input": ["fever headache body ache chills"]})["data"][0]["embedding"]

index = vsc.get_index(settings.VECTOR_ENDPOINT, index_name)
results = index.similarity_search(query_vector=test_emb, columns=["disease_name", "chunk_type"], num_results=settings.VECTOR_SEARCH_TOP_K)
print("Test 1 results (Expected: dengue, malaria, influenza):")
for r in results.get('result', {}).get('data_array', []):
    print(r)

# COMMAND ----------
# Step 5: Test query 2
test_emb_2 = deploy_client.predict(endpoint=settings.EMBEDDING_ENDPOINT, inputs={"input": ["chest pain shortness of breath palpitations"]})["data"][0]["embedding"]
results_2 = index.similarity_search(query_vector=test_emb_2, columns=["disease_name", "chunk_type"], num_results=settings.VECTOR_SEARCH_TOP_K)
print("\nTest 2 results (Expected: angina, arrhythmia):")
for r in results_2.get('result', {}).get('data_array', []):
    print(r)
