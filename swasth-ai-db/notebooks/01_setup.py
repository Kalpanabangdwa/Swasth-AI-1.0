# Databricks notebook source
# MAGIC %pip install databricks-genai-inference databricks-vectorsearch mlflow pandas faker

# COMMAND ----------
# MAGIC %restart_python

# COMMAND ----------
import json
import time
import random
import os
import pandas as pd
import mlflow
import mlflow.deployments
from databricks.vector_search.client import VectorSearchClient
from databricks_genai_inference import ChatCompletion
from faker import Faker

fake = Faker("en_IN")

import sys
sys.path.append(os.path.abspath("../config"))
import settings

# COMMAND ----------
spark.sql(f"CREATE CATALOG IF NOT EXISTS {settings.CATALOG}")
spark.sql(f"CREATE SCHEMA IF NOT EXISTS {settings.CATALOG}.{settings.SCHEMA_MAIN}")
spark.sql(f"CREATE SCHEMA IF NOT EXISTS {settings.CATALOG}.{settings.SCHEMA_VECTORS}")
spark.sql(f"CREATE SCHEMA IF NOT EXISTS {settings.CATALOG}.{settings.SCHEMA_SYNTHETIC}")
spark.sql(f"CREATE SCHEMA IF NOT EXISTS {settings.CATALOG}.{settings.SCHEMA_EVAL}")

# COMMAND ----------
schemas = spark.sql(f"SHOW SCHEMAS IN {settings.CATALOG}").select("databaseName").rdd.flatMap(lambda x: x).collect()
print("Schemas created successfully:")
for s in schemas:
    print(f"- {s}")
