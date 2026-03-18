# Databricks notebook source
import sys, os
sys.path.append(os.path.abspath("../config"))
import settings
import pandas as pd

# COMMAND ----------
# TABLE 1: duration_options
duration_data = [
    (1, 'Less than 1 day', 'less_than_1_day', 0, 1, True, 'within_24h', 1),
    (2, '1 - 3 days', '1_to_3_days', 1, 3, False, 'routine', 2),
    (3, '1 week', '1_week', 7, 7, False, 'routine', 3),
    (4, 'More than 1 week', 'more_than_1_week', 8, 999, True, 'within_24h', 4)
]
duration_df = spark.createDataFrame(duration_data, ['id', 'label', 'value', 'days_min', 'days_max', 'affects_urgency', 'urgency_modifier', 'display_order'])
duration_df.write.format('delta').mode('overwrite').saveAsTable(f"{settings.CATALOG}.{settings.SCHEMA_MAIN}.duration_options")

# COMMAND ----------
# TABLE 2: severity_config
severity_data = [
    (1, 1, 3, 'Mild Pain', '#22c55e', False, 'routine', 'Monitor symptoms at home. Rest and stay hydrated.', 'thermometer-low'),
    (2, 4, 6, 'Moderate Pain', '#f59e0b', False, 'routine', 'Consider OTC medication. See doctor if no improvement in 2 days.', 'thermometer-mid'),
    (3, 7, 10, 'Severe Pain', '#ef4444', True, 'within_24h', 'Seek medical attention promptly. Do not delay.', 'thermometer-high')
]

severity_df = spark.createDataFrame(severity_data, ['id', 'score_min', 'score_max', 'label', 'color', 'see_doctor_threshold', 'urgency', 'advice', 'icon'])
severity_df.write.format('delta').mode('overwrite').saveAsTable(f"{settings.CATALOG}.{settings.SCHEMA_MAIN}.severity_config")

# COMMAND ----------
# Verify tables
print("duration_options table:")
display(spark.table(f"{settings.CATALOG}.{settings.SCHEMA_MAIN}.duration_options"))
print("\nseverity_config table:")
display(spark.table(f"{settings.CATALOG}.{settings.SCHEMA_MAIN}.severity_config"))

# Test query
query = f"SELECT label FROM {settings.CATALOG}.{settings.SCHEMA_MAIN}.severity_config WHERE score_min <= 5 AND score_max >= 5"
test_res = spark.sql(query).collect()[0]['label']
print(f"\nTest severity 5 maps to: {test_res} (Should be Moderate Pain)")
