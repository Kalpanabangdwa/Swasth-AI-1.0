# Databricks notebook source
import sys, os, time, json
sys.path.append(os.path.abspath("../config"))
import settings
import pandas as pd
from datetime import datetime
import mlflow
from databricks_genai_inference import ChatCompletion

# COMMAND ----------
cases = spark.table(f"{settings.CATALOG}.{settings.SCHEMA_SYNTHETIC}.patient_cases").sample(0.5).limit(100).toPandas()
diseases = spark.table(f"{settings.CATALOG}.{settings.SCHEMA_MAIN}.diseases").toPandas()

# COMMAND ----------
def validate_case(case, disease):
    prompt = f"""You are a medical data quality validator for Swasth AI.

Source disease: {disease['description']} - {disease['self_care']}

Generated patient case:
- Symptoms selected: {case['step1_symptoms']}
- Duration: {case['step2_duration']}
- Severity: {case['step3_severity']}
- Diagnosis: {case['step4_primary_diagnosis']}  
- Self care given: {case['step4_self_care']}
- See doctor: {case['step4_see_doctor']}
- Urgency: {case['step4_urgency']}

Validate this case. Return ONLY valid JSON:
{{
  "is_valid": true,
  "diagnosis_matches_source": true,
  "symptoms_realistic_for_disease": true,
  "self_care_grounded_in_source": true,
  "severity_label_matches_score": true,
  "urgency_appropriate": true,
  "issue": null
}}
Set is_valid to false if any field is wrong.
Describe the issue if is_valid is false."""
    try:
        resp = ChatCompletion.create(model=settings.LLM_MODEL, messages=[{"role": "user", "content": prompt}], temperature=0.1)
        res_str = resp.message
        if res_str.startswith('```json'):
            res_str = res_str[7:-3]
        if res_str.startswith('```'):
            res_str = res_str[3:-3]
        return json.loads(res_str.strip())
    except:
        return {"is_valid": False, "issue": "Evaluation error"}

# COMMAND ----------
print(f"Validating {len(cases)} cases using {settings.LLM_MODEL} as judge...")
results = []
for idx, c in cases.iterrows():
    d = diseases[diseases['id'] == c['disease_id']].iloc[0]
    val = validate_case(c, d)
    val['case_id'] = idx
    val['disease_name'] = c['source_disease']
    val['validated_at'] = datetime.now()
    results.append(val)
    time.sleep(0.1)

res_df = pd.DataFrame(results)

# COMMAND ----------
# Save to MLflow & Delta
with mlflow.start_run(run_name="symptom_checker_validation"):
    accuracy = res_df['is_valid'].mean() * 100
    mlflow.log_metric("validation_accuracy", accuracy)
    for col in ['diagnosis_matches_source', 'symptoms_realistic_for_disease', 'self_care_grounded_in_source', 'severity_label_matches_score', 'urgency_appropriate']:
        if col in res_df.columns:
            mlflow.log_metric(f"{col}_accuracy", res_df[col].mean() * 100)
    mlflow.log_metric("total_cases_validated", len(res_df))
    
    invalid = res_df[res_df['is_valid'] == False].to_dict('records')
    with open('/tmp/invalid_cases.json', 'w') as f:
        json.dump(invalid, f)
    mlflow.log_artifact('/tmp/invalid_cases.json')

spark.createDataFrame(res_df).write.format('delta').mode('overwrite').saveAsTable(f"{settings.CATALOG}.{settings.SCHEMA_EVAL}.validation_results")

# COMMAND ----------
# Report
print(f"Overall accuracy percentage: {accuracy}%")
if len(invalid) > 0:
    most_invalid = res_df[res_df['is_valid'] == False]['disease_name'].mode()
    if len(most_invalid) > 0:
        print(f"Most invalid disease cases: {most_invalid[0]}")
    most_common_issue = res_df[res_df['is_valid'] == False]['issue'].mode()
    if len(most_common_issue) > 0:
        print(f"Most common validation failure: {most_common_issue[0]}")
else:
    print("Zero invalid cases detected!")

print(f"Pass or Fail: {'PASS' if accuracy > 85 else 'FAIL'}")
