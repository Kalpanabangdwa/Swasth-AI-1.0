# Databricks notebook source
import sys, os, time, json
sys.path.append(os.path.abspath("../config"))
import settings
import pandas as pd
from datetime import datetime
from databricks_genai_inference import ChatCompletion

# COMMAND ----------
diseases_df = spark.table(f"{settings.CATALOG}.{settings.SCHEMA_MAIN}.diseases").toPandas()

all_cases = []

prompt_template = """You are a medical data generator for Swasth AI, 
an Indian health app symptom checker with 4 steps.

Disease: {name}
Symptoms this disease causes: {symptoms}  
Description: {description}
Self care: {self_care}
Urgency: {urgency}

Generate exactly {cases_count} realistic Indian patient cases.
Each case maps to the 4-step symptom checker flow:

Step 1 - What symptoms the patient selected (2-4 symptoms chosen from the disease symptoms list above)
Step 2 - Duration they selected (one of exactly: less than 1 day, 1-3 days, 1 week, more than 1 week)
Step 3 - Severity score they entered (number 1-10)
Step 4 - What the correct AI analysis result should be

Return ONLY a valid JSON array, no markdown:
[
  {{
    "patient_age": 34,
    "patient_sex": "male",
    "step1_symptoms": ["Fever", "Headache", "Body Ache"],
    "step1_free_text": "sudden chills since yesterday evening",
    "step2_duration": "1-3 days",
    "step3_severity": 6,
    "step4_primary_diagnosis": "{name}",
    "step4_alternative_diagnoses": [
      {{"name": "similar disease", "confidence": 45}}
    ],
    "step4_confidence": 78,
    "step4_self_care": "specific advice from disease info above",
    "step4_see_doctor": true,
    "step4_urgency": "routine",
    "step4_severity_label": "Moderate Pain",
    "step4_disclaimer": "This is not a substitute for professional medical advice."
  }}
]

Variation rules across the 10 cases:
- Ages: include children 5-15, adults 20-50, elderly 60-75
- Sex: mix male female and other
- Vary symptom combinations each time (not always same 4)
- Vary duration across all 4 options
- Vary severity — low for mild cases, high for severe
- Free text in short natural Indian English
- step4_confidence varies between 65 and 92
- step4_severity_label must match step3_severity score:
  1-3 = Mild Pain, 4-6 = Moderate Pain, 7-10 = Severe Pain
"""

# COMMAND ----------
print(f"Generating synthetic patient cases using {settings.LLM_MODEL}...")

for _, row in diseases_df.iterrows():
    p = prompt_template.format(
        name=row['name'], symptoms=row['related_symptoms'], 
        description=row['description'], self_care=row['self_care'],
        urgency=row['urgency'], cases_count=settings.CASES_PER_DISEASE
    )
    for _ in range(3): # retries
        try:
            resp = ChatCompletion.create(model=settings.LLM_MODEL, messages=[{"role": "user", "content": p}], max_tokens=2000)
            res_str = resp.message
            if res_str.startswith('```json'): res_str = res_str[7:-3]
            if res_str.startswith('```'): res_str = res_str[3:-3]
                
            cases = json.loads(res_str.strip())
            for c in cases:
                c['disease_id'] = row['id']
                c['source_disease'] = row['name']
                c['generated_at'] = datetime.now()
                c['source'] = 'mosaic_ai_dbrx'
                c['step1_symptoms'] = json.dumps(c['step1_symptoms'])
                c['step4_alternative_diagnoses'] = json.dumps(c['step4_alternative_diagnoses'])
                all_cases.append(c)
            break
        except Exception as e:
            print(f"Error generating cases for {row['name']}: {e}")
            time.sleep(2)

cases_df = spark.createDataFrame(pd.DataFrame(all_cases))
cases_df.write.format('delta').mode('overwrite').saveAsTable(f"{settings.CATALOG}.{settings.SCHEMA_SYNTHETIC}.patient_cases")
print(f"Total cases created: {cases_df.count()}")

# COMMAND ----------
summary_query = f"""
CREATE OR REPLACE TABLE {settings.CATALOG}.{settings.SCHEMA_SYNTHETIC}.generation_summary AS
SELECT 
    source_disease as disease_name,
    COUNT(*) as cases_generated,
    AVG(step4_confidence) as avg_confidence,
    (SELECT collect_list(struct(c, c_count)) FROM (SELECT step4_urgency as c, COUNT(*) as c_count FROM {settings.CATALOG}.{settings.SCHEMA_SYNTHETIC}.patient_cases WHERE source_disease = p.source_disease GROUP BY step4_urgency)) as urgency_distribution,
    (SELECT collect_list(struct(d, d_count)) FROM (SELECT step2_duration as d, COUNT(*) as d_count FROM {settings.CATALOG}.{settings.SCHEMA_SYNTHETIC}.patient_cases WHERE source_disease = p.source_disease GROUP BY step2_duration)) as duration_distribution
FROM {settings.CATALOG}.{settings.SCHEMA_SYNTHETIC}.patient_cases p
GROUP BY source_disease
"""
spark.sql(summary_query)
display(spark.table(f"{settings.CATALOG}.{settings.SCHEMA_SYNTHETIC}.generation_summary"))
