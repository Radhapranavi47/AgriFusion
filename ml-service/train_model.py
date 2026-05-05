import pickle
import pandas as pd
import numpy as np

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix, f1_score

from imblearn.over_sampling import SMOTE
from xgboost import XGBClassifier


# =============================
# CONFIG
# =============================

DATASET_PATH = "agriculture_dataset.csv"
MODEL_PATH = "model.pkl"
ENCODER_PATH = "encoder.pkl"

FEATURES = [
    "NDVI",
    "SAVI",
    "Temperature",
    "Humidity",
    "Rainfall",
    "Wind_Speed",
    "Crop_Growth_Stage",
    "Soil_Moisture",
    "Soil_pH",
    "Organic_Matter",
    "Chlorophyll_Content",
    "Leaf_Area_Index",
    "Canopy_Coverage",
    "Crop_Stress_Indicator",
    "Pest_Damage"
]

TARGET_COLUMN = "Crop_Health_Label"


# =============================
# LOAD DATA
# =============================

print("Loading dataset...")
df = pd.read_csv(DATASET_PATH)

df = df.dropna(subset=FEATURES + [TARGET_COLUMN])

X = df[FEATURES]
y = df[TARGET_COLUMN]


# =============================
# LABEL ENCODING
# =============================

label_encoder = LabelEncoder()
y_encoded = label_encoder.fit_transform(y)

print("Classes:", label_encoder.classes_)


# =============================
# TRAIN TEST SPLIT
# =============================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y_encoded,
    test_size=0.2,
    random_state=42,
    stratify=y_encoded
)


# =============================
# HANDLE CLASS IMBALANCE
# =============================

print("Applying SMOTE...")
sm = SMOTE(random_state=42)

X_train, y_train = sm.fit_resample(X_train, y_train)


# =============================
# MODEL (XGBoost)
# =============================

print("Training model...")

model = XGBClassifier(
    n_estimators=700,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    scale_pos_weight=2,
    random_state=42,
    n_jobs=-1
)

model.fit(X_train, y_train)


# =============================
# PREDICTION
# =============================

y_pred = model.predict(X_test)

accuracy = accuracy_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)


# =============================
# RESULTS
# =============================

print("\n==============================")
print("MODEL PERFORMANCE")
print("==============================")

print("Accuracy:", round(accuracy, 4))
print("F1 Score:", round(f1, 4))

print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))

print("\nClassification Report:")
print(classification_report(
    y_test,
    y_pred,
    target_names=[str(c) for c in label_encoder.classes_]
))


cm = confusion_matrix(y_test, y_pred)

print("\nConfusion Matrix (Raw):")
print(cm)

# Pretty format for paper
tn, fp, fn, tp = cm.ravel()

print("\nConfusion Matrix (Formatted):")
print(f"True Negatives (TN): {tn}")
print(f"False Positives (FP): {fp}")
print(f"False Negatives (FN): {fn}")
print(f"True Positives (TP): {tp}")

# =============================
# SAVE CONFUSION MATRIX IMAGE
# =============================

plt.figure(figsize=(6,5))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
            xticklabels=['Stressed', 'Healthy'],
            yticklabels=['Stressed', 'Healthy'])

plt.xlabel('Predicted')
plt.ylabel('Actual')
plt.title('Confusion Matrix')

plt.tight_layout()
plt.savefig("confusion_matrix.png")
plt.show()

# =============================
# FEATURE IMPORTANCE
# =============================

print("\nFeature Importance:")

importances = model.feature_importances_

for name, importance in sorted(zip(FEATURES, importances), key=lambda x: x[1], reverse=True):
    print(f"{name}: {round(importance, 4)}")


# =============================
# SAVE MODEL
# =============================

with open(MODEL_PATH, "wb") as f:
    pickle.dump(model, f)

with open(ENCODER_PATH, "wb") as f:
    pickle.dump(label_encoder, f)

print("\nModel and encoder saved successfully.")