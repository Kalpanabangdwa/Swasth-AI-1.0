# Swasth AI - Databricks Mosaic AI Database Pipeline

This project builds a complete database pipeline for the Swasth AI symptom checker using Databricks Mosaic AI. 
It creates tables for body areas, symptoms, duration/severity options, and an extensive diseases master table.
It also automatically generates encyclopedia chunks, generates embeddings using `databricks-bge-large-en`, sets up a Vector Search Endpoint, generates synthetic patient data with DBRX LLM, and evaluates its validity with LLM as a judge using MLflow. Finally, it exports the required datasets as JSON for usage in a Node.js backend.

## Prerequisites
- Databricks account
- Mosaic AI enabled in your workspace
- Appropriate access rights to create Unity Catalog schemas and endpoints

## How to Run
Run notebooks 01 through 10 in order directly in Databricks.

## Notebook overview
1. `01_setup.py` - Installs packages, creates schemas, and tests setup.
2. `02_body_areas_symptoms.py` - Creates delta tables for body areas and symptoms.
3. `03_duration_severity.py` - Creates duration and severity options delta tables.
4. `04_diseases.py` - Creates diseases master table with 20 diseases.
5. `05_encyclopedia_chunks.py` - Generates 60 text chunks for diseases using DBRX.
6. `06_embeddings.py` - Generates embeddings for chunks using databricks-bge-large-en.
7. `07_vector_search.py` - Creates and syncs a vector search index for the embeddings.
8. `08_synthetic_data.py` - Uses DBRX to generate synthetic patient data based on diseases.
9. `09_validation.py` - Evaluates the synthetic cases with LLM-as-a-judge & logs with MLflow.
10. `10_export.py` - Exports the DB delta tables as JSON to DBFS for download.

## Connecting to Node.js Backend
Once ran, the vector search index can be accessed via the Databricks Serving Endpoint URL, using a Personal Access Token as the Bearer Token.

## Exported JSON Files Download
The JSON files will be exported to `/dbfs/FileStore/swasth_ai/exports/`. They can be downloaded at:
`https://[workspace-url]/files/swasth_ai/exports/[filename].json`

## Delta Tables Created
| Table Name | Schema | Description | Row Count |
|---|---|---|---|
| `body_areas` | `symptom_checker` | Body areas mapping | 6 |
| `symptoms` | `symptom_checker` | Symptoms grouped by area | 35 |
| `duration_options` | `symptom_checker` | Symptom duration options | 4 |
| `severity_config` | `symptom_checker` | Severity levels | 3 |
| `diseases` | `symptom_checker` | Diseases master table | 20 |
| `encyclopedia_chunks` | `vector_store` | AI-generated knowledge | 60 |
| `encyclopedia_with_embeddings` | `vector_store` | Embeddings | 60 |
| `patient_cases` | `synthetic_data` | LLM synthetic patient cases | ~200 |
| `generation_summary` | `synthetic_data` | Synthetic data summary | 20 |
| `validation_results` | `evaluation` | MLflow LLM-judge results | 100 |
