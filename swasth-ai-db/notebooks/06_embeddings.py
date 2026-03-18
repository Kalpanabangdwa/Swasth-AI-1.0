# Databricks notebook source
import sys, os, time
sys.path.append(os.path.abspath("../config"))
import settings
import pandas as pd
import mlflow.deployments

deploy_client = mlflow.deployments.get_deploy_client("databricks")

# COMMAND ----------
def embed_text(text):
    try:
        response = deploy_client.predict(
            endpoint=settings.EMBEDDING_ENDPOINT,
            inputs={"input": [text]}
        )
        return response["data"][0]["embedding"]
    except Exception as e:
        print(f"Error: {e}")
        return [0.0] * settings.EMBEDDING_DIMENSION

chunks_df = spark.table(f"{settings.CATALOG}.{settings.SCHEMA_VECTORS}.encyclopedia_chunks").toPandas()
embeddings = []

# COMMAND ----------
print(f"Embedding {len(chunks_df)} chunks using {settings.EMBEDDING_ENDPOINT}...")
for i, text in enumerate(chunks_df['text']):
    embeddings.append(embed_text(text))
    time.sleep(0.1)
    if (i + 1) % 10 == 0:
        print(f"Embedded {i + 1} chunks")

chunks_df['embedding'] = embeddings

# COMMAND ----------
from pyspark.sql.types import StructType, StructField, StringType, BooleanType, ArrayType, FloatType
schema = spark.createDataFrame(chunks_df.head(1)).schema

new_df = spark.createDataFrame(chunks_df, schema=schema)
(new_df.write.format('delta').mode('overwrite')
  .option("delta.enableChangeDataFeed", "true")
  .saveAsTable(f"{settings.CATALOG}.{settings.SCHEMA_VECTORS}.encyclopedia_with_embeddings"))

spark.sql(f"ALTER TABLE {settings.CATALOG}.{settings.SCHEMA_VECTORS}.encyclopedia_with_embeddings SET TBLPROPERTIES ('embedding_dimension' = '{settings.EMBEDDING_DIMENSION}')")

count = spark.table(f"{settings.CATALOG}.{settings.SCHEMA_VECTORS}.encyclopedia_with_embeddings").count()
print(f"Total rows saved: {count}")
print(f"Embedding shape: {len(embeddings[0])}")
