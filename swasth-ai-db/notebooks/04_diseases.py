# Databricks notebook source
import sys, os, json
sys.path.append(os.path.abspath("../config"))
import settings
import pandas as pd

# COMMAND ----------
# Load seed data
with open("../data/diseases_seed.json", "r") as f:
    diseases_data = json.load(f)

for row in diseases_data:
    row['related_symptoms'] = json.dumps(row['related_symptoms'])

df = spark.createDataFrame(pd.DataFrame(diseases_data))
df.write.format('delta').mode('overwrite').saveAsTable(f"{settings.CATALOG}.{settings.SCHEMA_MAIN}.diseases")

# COMMAND ----------
# Verify count
count = spark.table(f"{settings.CATALOG}.{settings.SCHEMA_MAIN}.diseases").count()
print(f"Diseases count expected to be 20. Actual count: {count}")
display(spark.table(f"{settings.CATALOG}.{settings.SCHEMA_MAIN}.diseases").limit(5))
