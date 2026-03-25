"""
services/diet_symptom_service.py
Complete backend logic for:
  - Weekly diet plan generation (deficiency-aware, allergy-filtered)
  - Symptom checking (multi-condition matching, severity scoring)
"""

import re
import json
from typing import List, Optional, Dict, Any

# ═══════════════════════════════════════════════════════════════════════════════
# DIET PLANNER DATA
# ═══════════════════════════════════════════════════════════════════════════════

# Maps deficiency names (from medical reports) → foods that fix them
DEFICIENCY_FOODS = {
    "iron": {
        "foods": ["spinach", "lentils", "chickpeas", "tofu", "pumpkin seeds", "beetroot", "chicken liver", "red meat"],
        "avoid": [],
        "note": "Iron deficiency detected. Added iron-rich foods to your plan."
    },
    "vitamin d": {
        "foods": ["eggs", "salmon", "mushrooms", "fortified milk", "tuna", "mackerel"],
        "avoid": [],
        "note": "Vitamin D deficiency detected. Added Vitamin D rich foods."
    },
    "vitamin b12": {
        "foods": ["eggs", "milk", "paneer", "chicken", "fish", "curd"],
        "avoid": [],
        "note": "Vitamin B12 deficiency detected. Added B12-rich foods."
    },
    "calcium": {
        "foods": ["milk", "curd", "paneer", "sesame seeds", "almonds", "broccoli", "ragi"],
        "avoid": [],
        "note": "Calcium deficiency detected. Added calcium-rich foods."
    },
    "vitamin c": {
        "foods": ["oranges", "amla", "guava", "bell peppers", "strawberries", "lemon"],
        "avoid": [],
        "note": "Vitamin C deficiency detected. Added citrus and fresh fruits."
    },
    "protein": {
        "foods": ["eggs", "chicken", "lentils", "paneer", "tofu", "greek yogurt", "chickpeas"],
        "avoid": [],
        "note": "Low protein detected. Increased protein-rich foods in your plan."
    },
    "zinc": {
        "foods": ["pumpkin seeds", "chickpeas", "cashews", "lentils", "chicken", "beef"],
        "avoid": [],
        "note": "Zinc deficiency detected. Added zinc-rich foods."
    },
    "magnesium": {
        "foods": ["almonds", "spinach", "dark chocolate", "avocado", "banana", "black beans"],
        "avoid": [],
        "note": "Magnesium deficiency detected. Added magnesium-rich foods."
    },
    "folate": {
        "foods": ["spinach", "broccoli", "chickpeas", "lentils", "asparagus", "avocado"],
        "avoid": [],
        "note": "Folate deficiency detected. Added folate-rich leafy greens."
    },
    "potassium": {
        "foods": ["banana", "sweet potato", "spinach", "coconut water", "lentils", "avocado"],
        "avoid": [],
        "note": "Potassium deficiency detected. Added potassium-rich foods."
    },
    "omega-3": {
        "foods": ["salmon", "walnuts", "flaxseeds", "chia seeds", "mackerel", "sardines"],
        "avoid": [],
        "note": "Omega-3 deficiency detected. Added healthy fat sources."
    },
    "vitamin a": {
        "foods": ["carrots", "sweet potato", "spinach", "mango", "eggs", "milk"],
        "avoid": [],
        "note": "Vitamin A deficiency detected. Added beta-carotene rich foods."
    },
}

# Allergen → ingredients to exclude
ALLERGEN_EXCLUSIONS = {
    "nuts":      ["almonds", "cashews", "walnuts", "peanuts", "peanut butter", "mixed nuts", "nut"],
    "dairy":     ["milk", "paneer", "curd", "cheese", "butter", "ghee", "yogurt", "cream", "whey"],
    "gluten":    ["wheat", "roti", "bread", "pasta", "oats", "barley", "whole wheat"],
    "shellfish": ["prawns", "shrimp", "crab", "lobster", "shellfish"],
    "soy":       ["tofu", "soy", "soya", "edamame"],
    "eggs":      ["eggs", "egg"],
}

# Full 7-day meal database per preference
WEEKLY_MEALS = {
    "vegetarian": {
        "monday":    {"breakfast": "Oats porridge with banana and almonds",           "mid_morning": "Apple with peanut butter",          "lunch": "Dal tadka, brown rice, sabzi and curd",        "snack": "Roasted makhana with green tea",       "dinner": "Roti, palak paneer and cucumber salad"},
        "tuesday":   {"breakfast": "Besan chilla with mint chutney and low-fat curd", "mid_morning": "Orange or seasonal fruit",           "lunch": "Rajma chawal with onion salad",                "snack": "Mixed nuts and seeds (30g)",           "dinner": "Moong dal soup with whole wheat bread"},
        "wednesday": {"breakfast": "Vegetable upma with green chutney",               "mid_morning": "Fruit salad with chaat masala",      "lunch": "Paneer bhurji wrap with salad",                "snack": "Sprouts chaat with lemon",             "dinner": "Vegetable daliya with raita"},
        "thursday":  {"breakfast": "Whole wheat toast with peanut butter and banana", "mid_morning": "Buttermilk (chaas)",                 "lunch": "Chole with brown rice and salad",              "snack": "Fruit salad",                         "dinner": "Methi thepla with curd and pickle"},
        "friday":    {"breakfast": "Idli with sambar and coconut chutney",            "mid_morning": "Handful of roasted chana",           "lunch": "Mixed vegetable khichdi with kadhi",           "snack": "Banana smoothie",                     "dinner": "Tofu stir-fry with quinoa and vegetables"},
        "saturday":  {"breakfast": "Smoothie bowl with chia seeds and berries",       "mid_morning": "Ragi biscuits with herbal tea",      "lunch": "Spinach dal with jeera rice and papad",        "snack": "Hummus with carrot sticks",            "dinner": "Paneer tikka with mint chutney and salad"},
        "sunday":    {"breakfast": "Poha with vegetables and lemon",                  "mid_morning": "Coconut water",                      "lunch": "Kadhi pakoda with steamed rice",               "snack": "Roasted peanuts and jaggery",          "dinner": "Vegetable soup with whole wheat toast"},
    },
    "non-vegetarian": {
        "monday":    {"breakfast": "Boiled eggs (2) with whole wheat toast and juice", "mid_morning": "Banana",                           "lunch": "Grilled chicken with brown rice and salad",    "snack": "Boiled eggs with black pepper",        "dinner": "Baked fish with sautéed vegetables"},
        "tuesday":   {"breakfast": "Egg bhurji with roti and glass of milk",           "mid_morning": "Apple",                            "lunch": "Fish curry with steamed rice and vegetables",  "snack": "Grilled chicken tikka (100g)",         "dinner": "Chicken soup with whole wheat bread"},
        "wednesday": {"breakfast": "Grilled chicken sandwich with lettuce",            "mid_morning": "Mixed nuts (30g)",                 "lunch": "Egg curry with roti and onion salad",          "snack": "Tuna on whole wheat crackers",         "dinner": "Grilled prawns with brown rice and salad"},
        "thursday":  {"breakfast": "Omelette with vegetables and whole wheat toast",   "mid_morning": "Orange juice",                     "lunch": "Chicken wrap with mint chutney and salad",     "snack": "Boiled eggs (2)",                      "dinner": "Mutton keema with roti and raita"},
        "friday":    {"breakfast": "Scrambled eggs with spinach and toast",            "mid_morning": "Banana smoothie",                  "lunch": "Prawn stir-fry with brown rice",               "snack": "Chicken tikka (grilled)",              "dinner": "Fish tacos with salsa and avocado"},
        "saturday":  {"breakfast": "Egg white omelette with veggies and toast",        "mid_morning": "Mixed fruit",                      "lunch": "Chicken biryani (brown rice) with raita",      "snack": "Hard boiled egg and fruit",            "dinner": "Grilled salmon with quinoa and greens"},
        "sunday":    {"breakfast": "Keema paratha with curd",                          "mid_morning": "Coconut water",                    "lunch": "Mutton curry with steamed rice and salad",     "snack": "Roasted chicken strips",               "dinner": "Chicken clear soup with multigrain bread"},
    },
    "vegan": {
        "monday":    {"breakfast": "Smoothie bowl with chia seeds, berries and almond milk", "mid_morning": "Apple",                      "lunch": "Red lentil soup with brown rice and salad",    "snack": "Hummus with carrot sticks",            "dinner": "Mixed vegetable curry with quinoa"},
        "tuesday":   {"breakfast": "Besan chilla with mint chutney and fruit",               "mid_morning": "Orange",                     "lunch": "Tofu stir-fry with quinoa and vegetables",     "snack": "Trail mix (nuts, seeds, dried fruit)", "dinner": "Black bean tacos with salsa and avocado"},
        "wednesday": {"breakfast": "Oats with almond milk, flaxseeds and banana",            "mid_morning": "Roasted chickpeas",          "lunch": "Chickpea salad wrap with tahini dressing",     "snack": "Fresh fruit",                         "dinner": "Lentil dal with whole wheat roti and salad"},
        "thursday":  {"breakfast": "Tofu scramble with whole wheat toast",                   "mid_morning": "Coconut water",              "lunch": "Rajma (no dairy) with brown rice",             "snack": "Banana and peanut butter",             "dinner": "Mushroom and spinach stir-fry with rice"},
        "friday":    {"breakfast": "Chia pudding with mango and coconut milk",               "mid_morning": "Mixed berries",              "lunch": "Lentil and vegetable soup with bread",         "snack": "Pumpkin seeds and dried cranberries",  "dinner": "Vegetable curry with quinoa and salad"},
        "saturday":  {"breakfast": "Avocado toast with flaxseeds and tomatoes",              "mid_morning": "Handful of almonds",         "lunch": "Buddha bowl with roasted vegetables and tahini", "snack": "Fruit salad with chia seeds",          "dinner": "Stuffed bell peppers with brown rice"},
        "sunday":    {"breakfast": "Banana oat pancakes with maple syrup",                   "mid_morning": "Fresh orange juice",         "lunch": "Spiced chickpea bowl with greens",             "snack": "Dark chocolate and walnuts",           "dinner": "Thai vegetable curry with jasmine rice"},
    },
}

DAYS = ["monday", "tuesday", "wednesday",
        "thursday", "friday", "saturday", "sunday"]

MEAL_EMOJIS = {
    "breakfast": "🌅", "mid_morning": "🍎",
    "lunch": "☀️", "snack": "🫐", "dinner": "🌙"
}

MEAL_TIMES = {
    "breakfast": "8:00 AM", "mid_morning": "10:30 AM",
    "lunch": "1:00 PM", "snack": "4:00 PM", "dinner": "8:00 PM"
}


def normalize(text: str) -> str:
    return text.lower().strip()


def contains_allergen(meal_text: str, allergens: List[str]) -> List[str]:
    """Return list of allergens found in the meal text."""
    found = []
    meal_lower = meal_text.lower()
    for allergen in allergens:
        exclusions = ALLERGEN_EXCLUSIONS.get(
            allergen.lower(), [allergen.lower()])
        for word in exclusions:
            if word in meal_lower:
                found.append(allergen)
                break
    return found


def get_deficiency_note(meal_text: str, deficiencies: List[str]) -> Optional[str]:
    """Check if this meal addresses any of the user's deficiencies."""
    meal_lower = meal_text.lower()
    addressed = []
    for deficiency in deficiencies:
        def_key = normalize(deficiency)
        # Find matching deficiency key
        for key in DEFICIENCY_FOODS:
            if key in def_key or def_key in key:
                for food in DEFICIENCY_FOODS[key]["foods"]:
                    if food in meal_lower:
                        addressed.append(key.title())
                        break
    if addressed:
        return f"✅ Addresses: {', '.join(addressed)}"
    return None


def substitute_allergen_meal(day: str, meal_slot: str, preference: str, allergens: List[str]) -> str:
    """Find a safe alternative meal from another day for the same slot."""
    for alt_day in DAYS:
        if alt_day == day:
            continue
        alt_meal = WEEKLY_MEALS.get(preference, WEEKLY_MEALS["vegetarian"])[
            alt_day][meal_slot]
        if not contains_allergen(alt_meal, allergens):
            return alt_meal + " (substituted)"
    return f"Please prepare a {meal_slot} without {', '.join(allergens)} — consult your nutritionist."


def build_weekly_plan(
    preference: str,
    allergens: List[str],
    deficiencies: List[str],
    goal: str,
    target_calories: int,
    water_ml: int,
    notes: List[str],
) -> Dict[str, Any]:
    """Build the full 7-day plan dict."""
    pref_key = normalize(preference)
    if "non" in pref_key or "nonveg" in pref_key or "chicken" in pref_key or "meat" in pref_key:
        pref_key = "non-vegetarian"
    elif "vegan" in pref_key:
        pref_key = "vegan"
    else:
        pref_key = "vegetarian"

    allergens_lower = [a.lower() for a in allergens]
    deficiencies_lower = [d.lower() for d in deficiencies]

    weekly_plan = {}
    allergen_alerts = []

    for day in DAYS:
        day_meals = {}
        base = WEEKLY_MEALS[pref_key][day]

        for slot in ["breakfast", "mid_morning", "lunch", "snack", "dinner"]:
            meal_text = base[slot]
            found_allergens = contains_allergen(meal_text, allergens_lower)

            if found_allergens:
                allergen_alerts.append(
                    f"{day.title()} {slot}: replaced (contains {', '.join(found_allergens)})")
                meal_text = substitute_allergen_meal(
                    day, slot, pref_key, allergens_lower)

            deficiency_note = get_deficiency_note(
                meal_text, deficiencies_lower)

            day_meals[slot] = {
                "name":     meal_text,
                "time":     MEAL_TIMES[slot],
                "emoji":    MEAL_EMOJIS[slot],
                "deficiency_note": deficiency_note,
            }

        weekly_plan[day] = day_meals

    # Build deficiency notes
    deficiency_notes = []
    for deficiency in deficiencies_lower:
        for key in DEFICIENCY_FOODS:
            if key in deficiency or deficiency in key:
                deficiency_notes.append(DEFICIENCY_FOODS[key]["note"])
                break

    return {
        "weekly_plan":      weekly_plan,
        "allergen_alerts":  allergen_alerts,
        "deficiency_notes": list(set(deficiency_notes)),
        "general_notes":    notes,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# SYMPTOM CHECKER DATA
# ═══════════════════════════════════════════════════════════════════════════════

DISEASES_DB = [
    {
        "name": "Common Cold",
        "related": ["Runny Nose", "Sore Throat", "Headache", "Fever", "Cough", "Body Ache", "Fatigue"],
        "advice": "Rest and stay hydrated. Use OTC pain relievers for fever and discomfort.",
        "self_care": ["Drink warm fluids (ginger tea, soup)", "Rest for at least 8 hours", "Gargle with salt water for sore throat", "Use a humidifier"],
        "see_doctor_if": ["Fever exceeds 103°F", "Symptoms last more than 10 days", "Difficulty breathing"],
        "severity_threshold": 4,
        "isEmergency": False,
        "category": "Viral Infection",
        "icd_code": "J00"
    },
    {
        "name": "Influenza (Flu)",
        "related": ["Fever", "Body Ache", "Headache", "Fatigue", "Cough", "Chills", "Sore Throat"],
        "advice": "Get plenty of rest and drink fluids. Take paracetamol for fever.",
        "self_care": ["Isolate to prevent spread", "Take paracetamol (500mg every 6 hours)", "Drink ORS or electrolyte fluids", "Wear warm clothing"],
        "see_doctor_if": ["Fever above 104°F", "Chest pain or difficulty breathing", "Confusion or altered consciousness", "Symptoms worsening after day 5"],
        "severity_threshold": 5,
        "isEmergency": False,
        "category": "Viral Infection",
        "icd_code": "J11"
    },
    {
        "name": "Dengue Fever",
        "related": ["Fever", "Headache", "Joint Pain", "Body Ache", "Rash", "Fatigue", "Nausea", "Vomiting"],
        "advice": "Avoid ibuprofen and aspirin. Stay hydrated. Monitor platelet counts with a doctor.",
        "self_care": ["Drink at least 3L of fluids daily", "Only take paracetamol (NOT ibuprofen)", "Use mosquito repellent to prevent spread", "Rest completely"],
        "see_doctor_if": ["Bleeding from nose, gums or urine", "Severe abdominal pain", "Persistent vomiting", "Platelet count drops below 100,000"],
        "severity_threshold": 6,
        "isEmergency": True,
        "category": "Vector-Borne Disease",
        "icd_code": "A90"
    },
    {
        "name": "Malaria",
        "related": ["Fever", "Chills", "Headache", "Fatigue", "Nausea", "Vomiting", "Body Ache", "Night Sweats"],
        "advice": "See a doctor immediately for a blood test and antimalarial medication.",
        "self_care": ["Do NOT self-medicate with antimalarials", "Stay hydrated", "Use mosquito nets at night", "Keep cool during fever episodes"],
        "see_doctor_if": ["All cases require immediate medical attention", "Especially if recently travelled to a malaria-prone area"],
        "severity_threshold": 6,
        "isEmergency": True,
        "category": "Parasitic Infection",
        "icd_code": "B54"
    },
    {
        "name": "Typhoid Fever",
        "related": ["Fever", "Abdominal Pain", "Fatigue", "Loss of Appetite", "Headache", "Diarrhea", "Constipation", "Nausea"],
        "advice": "Drink boiled water and eat easily digestible food. See a doctor for antibiotics.",
        "self_care": ["Drink only boiled or bottled water", "Eat soft, easy-to-digest foods (khichdi, curd rice)", "Maintain strict hand hygiene", "Rest completely"],
        "see_doctor_if": ["All suspected cases need a Widal test", "Fever persisting beyond 3 days", "Severe abdominal pain or bloating"],
        "severity_threshold": 5,
        "isEmergency": True,
        "category": "Bacterial Infection",
        "icd_code": "A01"
    },
    {
        "name": "Chickenpox",
        "related": ["Rash", "Itching", "Fever", "Fatigue", "Loss of Appetite", "Headache"],
        "advice": "Apply calamine lotion, take cool baths, and avoid scratching.",
        "self_care": ["Apply calamine lotion to itchy areas", "Take cool oatmeal baths", "Cut fingernails short to prevent scratching", "Wear loose, comfortable clothing"],
        "see_doctor_if": ["Rash near eyes", "Difficulty breathing", "Rash becomes very red, warm or tender", "Fever above 102°F lasting more than 4 days"],
        "severity_threshold": 4,
        "isEmergency": False,
        "category": "Viral Infection",
        "icd_code": "B01"
    },
    {
        "name": "Bronchitis",
        "related": ["Cough", "Chest Pain", "Shortness of Breath", "Fatigue", "Fever", "Wheezing"],
        "advice": "Inhale steam and drink warm fluids. Avoid smoke completely.",
        "self_care": ["Steam inhalation twice daily", "Drink warm honey-lemon water", "Avoid all smoke and dust", "Use a chest rub (eucalyptus balm)"],
        "see_doctor_if": ["Cough lasting more than 3 weeks", "Coughing up blood", "High fever", "Shortness of breath at rest"],
        "severity_threshold": 5,
        "isEmergency": False,
        "category": "Respiratory",
        "icd_code": "J20"
    },
    {
        "name": "Asthma Attack",
        "related": ["Wheezing", "Shortness of Breath", "Chest Pain", "Cough", "Fatigue"],
        "advice": "Sit upright and use your rescue inhaler. Seek immediate help if it doesn't improve.",
        "self_care": ["Sit upright — do NOT lie down", "Use rescue inhaler (salbutamol) as prescribed", "Try pursed-lip breathing", "Remove yourself from triggers (smoke, dust, pollen)"],
        "see_doctor_if": ["Rescue inhaler not helping after 20 minutes", "Blue-tinted lips or fingernails", "Cannot speak in full sentences", "Severe chest tightness"],
        "severity_threshold": 7,
        "isEmergency": True,
        "category": "Respiratory",
        "icd_code": "J45"
    },
    {
        "name": "Pneumonia",
        "related": ["Fever", "Cough", "Shortness of Breath", "Chest Pain", "Fatigue", "Chills"],
        "advice": "Requires urgent medical evaluation and possibly antibiotics or hospitalization.",
        "self_care": ["Rest completely", "Stay hydrated", "Take prescribed antibiotics fully", "Monitor oxygen levels if possible"],
        "see_doctor_if": ["All cases require immediate evaluation", "Especially in elderly, children, or those with existing conditions"],
        "severity_threshold": 6,
        "isEmergency": True,
        "category": "Respiratory",
        "icd_code": "J18"
    },
    {
        "name": "Possible Heart Attack / Angina",
        "related": ["Chest Pain", "Shortness of Breath", "Fatigue", "Dizziness", "Palpitations", "Nausea"],
        "advice": "Stop all activity immediately. Call emergency services. Do NOT drive yourself.",
        "self_care": ["Chew an aspirin (325mg) if not allergic", "Sit or lie in a comfortable position", "Loosen any tight clothing", "Stay calm and wait for emergency services"],
        "see_doctor_if": ["IMMEDIATELY — this is a life-threatening emergency"],
        "severity_threshold": 8,
        "isEmergency": True,
        "category": "Cardiovascular",
        "icd_code": "I20"
    },
    {
        "name": "Cardiac Arrhythmia",
        "related": ["Palpitations", "Chest Pain", "Dizziness", "Shortness of Breath", "Fatigue"],
        "advice": "Sit comfortably, try to relax and avoid caffeine. See a cardiologist if recurring.",
        "self_care": ["Sit down and rest", "Try vagal manoeuvres (coughing, bearing down)", "Avoid caffeine and stimulants", "Track episodes with a note of duration and triggers"],
        "see_doctor_if": ["First episode of rapid irregular heartbeat", "Fainting or near-fainting", "Chest pain accompanying palpitations"],
        "severity_threshold": 6,
        "isEmergency": False,
        "category": "Cardiovascular",
        "icd_code": "I49"
    },
    {
        "name": "Gastroenteritis (Food Poisoning)",
        "related": ["Nausea", "Vomiting", "Diarrhea", "Abdominal Pain", "Fever", "Fatigue", "Loss of Appetite"],
        "advice": "Rehydrate heavily with ORS. Stick to a bland BRAT diet (banana, rice, applesauce, toast).",
        "self_care": ["Sip ORS every 15 minutes", "Eat BRAT diet — banana, rice, applesauce, toast", "Avoid dairy, spicy and fatty food", "Rest completely"],
        "see_doctor_if": ["Blood in stool or vomit", "Unable to keep any fluids down for 24 hours", "Signs of severe dehydration (no urination, extreme thirst)", "Fever above 102°F"],
        "severity_threshold": 5,
        "isEmergency": False,
        "category": "Gastrointestinal",
        "icd_code": "A09"
    },
    {
        "name": "Acid Reflux (GERD)",
        "related": ["Abdominal Pain", "Nausea", "Bloating", "Chest Pain", "Loss of Appetite"],
        "advice": "Avoid lying down after eating. Eat smaller, non-spicy meals throughout the day.",
        "self_care": ["Eat smaller meals every 3-4 hours", "Avoid spicy, oily and acidic food", "Don't lie down for 2 hours after eating", "Elevate head while sleeping"],
        "see_doctor_if": ["Symptoms more than twice a week", "Difficulty swallowing", "Unexplained weight loss", "Blood in vomit"],
        "severity_threshold": 4,
        "isEmergency": False,
        "category": "Gastrointestinal",
        "icd_code": "K21"
    },
    {
        "name": "Migraine",
        "related": ["Headache", "Blurred Vision", "Nausea", "Vomiting", "Dizziness", "Fatigue"],
        "advice": "Rest in a quiet dark room. Apply cold compresses to the head and neck.",
        "self_care": ["Rest in a dark, quiet room", "Apply cold or warm compress to head/neck", "Stay hydrated", "Take prescribed migraine medication at onset"],
        "see_doctor_if": ["Worst headache of your life (thunderclap)", "Headache with stiff neck and fever", "Neurological symptoms like weakness or slurred speech", "Headaches becoming more frequent"],
        "severity_threshold": 7,
        "isEmergency": False,
        "category": "Neurological",
        "icd_code": "G43"
    },
    {
        "name": "Tension Headache",
        "related": ["Headache", "Stiff Neck", "Fatigue", "Dizziness"],
        "advice": "Perform neck stretches, correct your posture, and try gentle massage or a warm compress.",
        "self_care": ["Neck and shoulder stretches", "Cold/warm compress on forehead", "Reduce screen time", "Practice deep breathing or meditation"],
        "see_doctor_if": ["Headache lasting more than 3 days", "Pain waking you from sleep", "Accompanied by fever or stiff neck"],
        "severity_threshold": 4,
        "isEmergency": False,
        "category": "Neurological",
        "icd_code": "G44"
    },
    {
        "name": "Rheumatoid Arthritis",
        "related": ["Joint Pain", "Swelling", "Fatigue", "Stiff Neck", "Muscle Weakness", "Fever"],
        "advice": "Apply warm/cold compresses to affected joints. Consult a rheumatologist.",
        "self_care": ["Apply warm compress in morning, cold after activity", "Gentle range-of-motion exercises", "Avoid high-impact activities during flare", "Maintain a healthy weight"],
        "see_doctor_if": ["Multiple joints swollen simultaneously", "Symptoms lasting more than 6 weeks", "Significant morning stiffness lasting more than 1 hour"],
        "severity_threshold": 6,
        "isEmergency": False,
        "category": "Musculoskeletal",
        "icd_code": "M06"
    },
    {
        "name": "Muscle Strain / Sprain",
        "related": ["Joint Pain", "Muscle Weakness", "Swelling", "Cramps", "Numbness"],
        "advice": "Apply ice and elevate the area. Use R.I.C.E method. Avoid activity.",
        "self_care": ["Rest — stop the aggravating activity", "Ice — apply for 20 minutes every 2 hours", "Compress — use a bandage for support", "Elevate — raise the affected limb"],
        "see_doctor_if": ["Unable to bear weight on the limb", "Visible deformity", "Severe swelling or bruising", "Numbness or tingling in the limb"],
        "severity_threshold": 5,
        "isEmergency": False,
        "category": "Musculoskeletal",
        "icd_code": "M79"
    },
    {
        "name": "Allergic Reaction",
        "related": ["Rash", "Itching", "Hives", "Swelling", "Shortness of Breath", "Fever"],
        "advice": "Take antihistamines immediately. Call emergency if breathing is affected.",
        "self_care": ["Take antihistamine (cetirizine/loratadine) immediately", "Apply cool compress to rash", "Remove or avoid the allergen", "Monitor breathing closely"],
        "see_doctor_if": ["ANY difficulty breathing — call emergency immediately", "Swelling of face, lips or throat", "Dizziness or feeling faint", "Rash spreading rapidly"],
        "severity_threshold": 6,
        "isEmergency": True,
        "category": "Immunological",
        "icd_code": "T78"
    },
    {
        "name": "Anemia",
        "related": ["Fatigue", "Dizziness", "Shortness of Breath", "Palpitations", "Muscle Weakness", "Skin Discoloration"],
        "advice": "Increase iron-rich foods in diet. Get a CBC blood test to confirm.",
        "self_care": ["Eat iron-rich foods (spinach, lentils, dates, jaggery)", "Take iron supplements if prescribed", "Eat Vitamin C alongside iron-rich foods to boost absorption", "Avoid tea/coffee with iron-rich meals"],
        "see_doctor_if": ["Severe fatigue interfering with daily life", "Rapid or irregular heartbeat", "Pale or yellowish skin", "Shortness of breath on minimal exertion"],
        "severity_threshold": 4,
        "isEmergency": False,
        "category": "Hematological",
        "icd_code": "D64"
    },
    {
        "name": "Uncontrolled Diabetes",
        "related": ["Weight Loss", "Fatigue", "Blurred Vision", "Numbness", "Nausea"],
        "advice": "Consult an endocrinologist to check blood sugar levels immediately.",
        "self_care": ["Monitor blood sugar at home if meter is available", "Drink water — avoid sugary drinks", "Eat small, regular meals with low glycemic index foods", "Avoid skipping meals"],
        "see_doctor_if": ["All cases require medical evaluation", "Extremely high or low blood sugar readings", "Confusion or loss of consciousness"],
        "severity_threshold": 6,
        "isEmergency": True,
        "category": "Endocrine",
        "icd_code": "E11"
    },
    {
        "name": "Sinusitis",
        "related": ["Headache", "Runny Nose", "Fever", "Fatigue", "Sore Throat", "Earache"],
        "advice": "Use saline nasal drops and steam inhalation twice daily.",
        "self_care": ["Steam inhalation twice daily (add eucalyptus oil)", "Saline nasal rinse (neti pot or spray)", "Stay warm and avoid cold drinks", "Sleep with head elevated"],
        "see_doctor_if": ["Symptoms lasting more than 10 days", "Severe headache or facial pain", "Vision changes", "High fever with stiff neck"],
        "severity_threshold": 4,
        "isEmergency": False,
        "category": "ENT",
        "icd_code": "J32"
    },
    {
        "name": "Kidney Stones",
        "related": ["Abdominal Pain", "Nausea", "Vomiting", "Fever", "Chills"],
        "advice": "Drink large amounts of water. Seek medical care for severe pain.",
        "self_care": ["Drink 3+ litres of water per day", "Take prescribed pain medication", "Use a warm compress on the back", "Filter urine to catch any stones for analysis"],
        "see_doctor_if": ["Inability to urinate", "Blood in urine", "Fever with back pain", "Pain so severe it prevents normal movement"],
        "severity_threshold": 8,
        "isEmergency": True,
        "category": "Urological",
        "icd_code": "N20"
    },
    {
        "name": "Appendicitis",
        "related": ["Abdominal Pain", "Nausea", "Vomiting", "Fever", "Loss of Appetite"],
        "advice": "Go to the emergency room immediately. This requires urgent surgical evaluation.",
        "self_care": ["Do NOT eat or drink anything", "Do NOT apply heat to the abdomen", "Do NOT take pain medication before diagnosis (can mask symptoms)", "Go to emergency room NOW"],
        "see_doctor_if": ["IMMEDIATELY — this is a surgical emergency"],
        "severity_threshold": 7,
        "isEmergency": True,
        "category": "Surgical Emergency",
        "icd_code": "K37"
    },
    {
        "name": "Tuberculosis (TB)",
        "related": ["Cough", "Weight Loss", "Night Sweats", "Fever", "Fatigue", "Chest Pain"],
        "advice": "Requires urgent medical diagnosis and a long course of antibiotics (6-9 months).",
        "self_care": ["Wear a mask to prevent spreading", "Ensure room ventilation", "Do NOT stop medication midway", "Eat a nutritious, high-protein diet"],
        "see_doctor_if": ["All suspected cases — get a chest X-ray and sputum test immediately"],
        "severity_threshold": 6,
        "isEmergency": True,
        "category": "Infectious Disease",
        "icd_code": "A15"
    },
    {
        "name": "Meningitis",
        "related": ["Headache", "Fever", "Stiff Neck", "Nausea", "Vomiting", "Dizziness"],
        "advice": "Seek emergency medical attention immediately. This is life-threatening.",
        "self_care": ["Do NOT wait — go to emergency room immediately", "Avoid bright lights", "Stay hydrated if able"],
        "see_doctor_if": ["IMMEDIATELY — potentially fatal within hours"],
        "severity_threshold": 8,
        "isEmergency": True,
        "category": "Neurological Emergency",
        "icd_code": "G03"
    },
]


def analyze_symptoms(
    symptoms: List[str],
    duration: str,
    severity: int,
) -> Dict[str, Any]:
    """
    Match symptoms against disease database.
    Returns top 3 conditions with scores, self-care steps, and emergency flag.
    """
    if not symptoms:
        return {
            "top_conditions": [],
            "emergency": False,
            "overall_severity": "None",
            "message": "No symptoms provided. Please select at least one symptom."
        }

    scored = []

    for disease in DISEASES_DB:
        matched = [s for s in symptoms if s in disease["related"]]
        if not matched:
            continue

        match_count = len(matched)

        # Score = weighted match ratio
        # how much of disease is covered
        recall = match_count / len(disease["related"])
        # how specific to this disease
        precision = match_count / len(symptoms)
        base_score = (recall * 50) + (precision * 50)

        # Severity correlation
        sev_diff = abs(disease["severity_threshold"] - severity)
        base_score -= sev_diff * 4

        # Duration boost for serious diseases
        if disease["isEmergency"] and duration in ["1 week", "More than 1 week"] and severity > 6:
            base_score += 12

        # Boost if many symptoms matched
        if match_count >= 4:
            base_score += 10

        confidence = min(97, max(30, round(base_score)))

        scored.append({
            "name":            disease["name"],
            "confidence":      confidence,
            "matched_symptoms": matched,
            "advice":          disease["advice"],
            "self_care":       disease["self_care"],
            "see_doctor_if":   disease["see_doctor_if"],
            "isEmergency":     disease["isEmergency"] or severity >= 9,
            "category":        disease["category"],
            "icd_code":        disease.get("icd_code", ""),
        })

    # Sort by confidence descending, take top 3
    scored.sort(key=lambda x: x["confidence"], reverse=True)
    top3 = scored[:3]

    overall_severity = (
        "Mild" if severity <= 3
        else "Moderate" if severity <= 7
        else "Severe"
    )

    is_emergency = any(c["isEmergency"] for c in top3) or severity >= 9

    return {
        "top_conditions":    top3,
        "emergency":         is_emergency,
        "overall_severity":  overall_severity,
        "symptom_count":     len(symptoms),
        "duration":          duration,
        "severity_score":    severity,
        "message": (
            "⚠️ EMERGENCY: Please seek immediate medical attention!"
            if is_emergency
            else "Analysis complete. Review conditions below and consult a doctor for proper diagnosis."
        )
    }
