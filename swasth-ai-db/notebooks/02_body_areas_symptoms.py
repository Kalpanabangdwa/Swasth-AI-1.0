# Databricks notebook source
import sys, os
sys.path.append(os.path.abspath("../config"))
import settings
import pandas as pd

# COMMAND ----------
# TABLE 1: body_areas
body_areas_data = [
    (1, 'Head & Neck', 'head', 1),
    (2, 'Chest & Heart', 'heart', 2),
    (3, 'Stomach & Gut', 'stomach', 3),
    (4, 'Arms & Legs', 'limbs', 4),
    (5, 'Skin', 'skin', 5),
    (6, 'General / Whole Body', 'body', 6)
]
body_areas_df = spark.createDataFrame(body_areas_data, ['id', 'name', 'icon', 'display_order'])
body_areas_df.write.format('delta').mode('overwrite').saveAsTable(f"{settings.CATALOG}.{settings.SCHEMA_MAIN}.body_areas")

# COMMAND ----------
# TABLE 2: symptoms
symptoms_data = [
    (1, 'Headache', 1, 'R51', 'head pain throbbing migraine', 1),
    (2, 'Fever', 1, 'R50.9', 'high temperature hot chills', 2),
    (3, 'Sore Throat', 1, 'J02.9', 'throat pain swallowing', 3),
    (4, 'Runny Nose', 1, 'J00', 'nasal discharge cold mucus', 4),
    (5, 'Earache', 1, 'H92.0', 'ear pain ache infection', 5),
    (6, 'Dizziness', 1, 'R42', 'vertigo spinning balance', 6),
    (7, 'Stiff Neck', 1, 'M54.2', 'neck stiffness rigid', 7),
    (8, 'Blurred Vision', 1, 'H53.8', 'vision blur eye sight', 8),
    (9, 'Chest Pain', 2, 'R07.9', 'chest tightness pressure cardiac', 1),
    (10, 'Shortness of Breath', 2, 'R06.0', 'breathless dyspnea breathing', 2),
    (11, 'Palpitations', 2, 'R00.2', 'heart racing flutter irregular', 3),
    (12, 'Cough', 2, 'R05', 'coughing dry wet productive', 4),
    (13, 'Wheezing', 2, 'R06.2', 'wheeze breathing whistle asthma', 5),
    (14, 'Nausea', 3, 'R11.0', 'sick stomach queasy vomit urge', 1),
    (15, 'Vomiting', 3, 'R11.1', 'throwing up emesis', 2),
    (16, 'Diarrhea', 3, 'R19.7', 'loose stool watery frequent', 3),
    (17, 'Constipation', 3, 'K59.0', 'no bowel movement hard stool', 4),
    (18, 'Abdominal Pain', 3, 'R10.9', 'stomach ache cramp belly pain', 5),
    (19, 'Bloating', 3, 'R14.0', 'gas swollen belly distension', 6),
    (20, 'Loss of Appetite', 3, 'R63.0', 'not hungry anorexia food', 7),
    (21, 'Joint Pain', 4, 'M25.5', 'arthritis joint ache swollen', 1),
    (22, 'Muscle Weakness', 4, 'M62.8', 'weak muscles strength loss', 2),
    (23, 'Swelling', 4, 'R60.0', 'edema puffiness fluid', 3),
    (24, 'Numbness', 4, 'R20.0', 'tingling pins needles sensation', 4),
    (25, 'Cramps', 4, 'R25.2', 'muscle spasm cramp leg', 5),
    (26, 'Rash', 5, 'R21', 'skin rash eruption spots', 1),
    (27, 'Itching', 5, 'L29.9', 'itch pruritus scratch', 2),
    (28, 'Hives', 5, 'L50.9', 'urticaria welts allergy', 3),
    (29, 'Bruising', 5, 'R23.3', 'bruise contusion discoloration', 4),
    (30, 'Skin Discoloration', 5, 'R23.8', 'yellow pale dark skin color', 5),
    (31, 'Fatigue', 6, 'R53.8', 'tired exhausted weakness energy', 1),
    (32, 'Weight Loss', 6, 'R63.4', 'losing weight unexplained', 2),
    (33, 'Night Sweats', 6, 'R61', 'sweating sleeping night', 3),
    (34, 'Chills', 6, 'R68.8', 'shivering cold shaking', 4),
    (35, 'Body Ache', 6, 'M79.3', 'myalgia whole body pain ache', 5)
]

symptoms_df = spark.createDataFrame(symptoms_data, ['id', 'name', 'body_area_id', 'icd10_code', 'keywords', 'display_order'])
symptoms_df.write.format('delta').mode('overwrite').saveAsTable(f"{settings.CATALOG}.{settings.SCHEMA_MAIN}.symptoms")

# COMMAND ----------
# Verify counts
ba_count = spark.table(f"{settings.CATALOG}.{settings.SCHEMA_MAIN}.body_areas").count()
sym_count = spark.table(f"{settings.CATALOG}.{settings.SCHEMA_MAIN}.symptoms").count()

print(f"Body areas count: {ba_count}")
print(f"Symptoms count: {sym_count}")

# Test query for body_area 2
print("\nSymptoms for Chest & Heart:")
display(spark.sql(f"SELECT * FROM {settings.CATALOG}.{settings.SCHEMA_MAIN}.symptoms WHERE body_area_id = 2"))
