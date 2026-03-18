# Databricks notebook source
import sys, os
sys.path.append(os.path.abspath("../config"))
import settings
import pandas as pd
from databricks_genai_inference import ChatCompletion

# COMMAND ----------
diseases_df = spark.table(f"{settings.CATALOG}.{settings.SCHEMA_MAIN}.diseases").toPandas()
chunks = []

def generate_text(prompt, retries=3):
    for i in range(retries):
        try:
            resp = ChatCompletion.create(model=settings.LLM_MODEL, messages=[{"role": "user", "content": prompt}], max_tokens=600)
            return resp.message
        except Exception as e:
            if i == retries - 1:
                return "Failed to generate."

# COMMAND ----------
print(f"Generating chunks for {len(diseases_df)} diseases. This will take a few minutes...")

for _, row in diseases_df.iterrows():
    name = row['name']
    
    prompt_a = f"Write a detailed 300-word medical description of {name} focusing on: what symptoms a patient experiences, how symptoms present in Indian patients, what the symptoms feel like, and how to distinguish this from similar conditions. Write in plain English suitable for a health app. No markdown."
    text_a = generate_text(prompt_a)
    chunks.append({
        'chunk_id': f"{row['id']}_A", 'disease_id': row['id'], 'disease_name': name, 'body_system': row['body_system'],
        'category': row['category'], 'chunk_type': 'A', 'text': text_a, 'symptoms_covered': row['related_symptoms'],
        'urgency': row['urgency'], 'see_doctor': row['see_doctor']
    })

    prompt_b = f"Write a detailed 300-word description of {name} focusing on: what causes it, who is at risk in India, seasonal and environmental factors in India, and common triggers. Write in plain English. No markdown."
    text_b = generate_text(prompt_b)
    chunks.append({
        'chunk_id': f"{row['id']}_B", 'disease_id': row['id'], 'disease_name': name, 'body_system': row['body_system'],
        'category': row['category'], 'chunk_type': 'B', 'text': text_b, 'symptoms_covered': row['related_symptoms'],
        'urgency': row['urgency'], 'see_doctor': row['see_doctor']
    })

    prompt_c = f"Write a detailed 300-word description of {name} focusing on: home remedies and self-care for Indian patients, over-the-counter medications available in India, when to see a doctor, what tests a doctor will run, and expected recovery time. Write in plain English. No markdown."
    text_c = generate_text(prompt_c)
    chunks.append({
        'chunk_id': f"{row['id']}_C", 'disease_id': row['id'], 'disease_name': name, 'body_system': row['body_system'],
        'category': row['category'], 'chunk_type': 'C', 'text': text_c, 'symptoms_covered': row['related_symptoms'],
        'urgency': row['urgency'], 'see_doctor': row['see_doctor']
    })

# COMMAND ----------
chunks_df = spark.createDataFrame(pd.DataFrame(chunks))
(chunks_df.write.format('delta').mode('overwrite')
  .option("delta.enableChangeDataFeed", "true")
  .saveAsTable(f"{settings.CATALOG}.{settings.SCHEMA_VECTORS}.encyclopedia_chunks"))

count = spark.table(f"{settings.CATALOG}.{settings.SCHEMA_VECTORS}.encyclopedia_chunks").count()
print(f"Chunks count: {count} (Expected 60)")
display(spark.table(f"{settings.CATALOG}.{settings.SCHEMA_VECTORS}.encyclopedia_chunks").limit(3))
