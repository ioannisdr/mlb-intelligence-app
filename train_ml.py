import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score

# 1. Generate Historical 2026 Dataset
# In reality, this would fetch from a massive DB. Here we simulate the 2026 season stats
np.random.seed(42)
n_games = 1200 # roughly 2026 season up to July

# Features
home_wOBA = np.random.normal(0.315, 0.015, n_games)
away_wOBA = np.random.normal(0.315, 0.015, n_games)
home_xERA = np.random.normal(4.0, 0.6, n_games)
away_xERA = np.random.normal(4.0, 0.6, n_games)
home_Kpct = np.random.normal(22, 3, n_games)
away_Kpct = np.random.normal(22, 3, n_games)

# Simulate true logit and probabilities (hidden from model)
true_logit = (home_wOBA - away_wOBA) * 10 - (home_xERA - away_xERA) * 0.4 + (home_Kpct - away_Kpct) * 0.05 + 0.15
home_win_prob = 1 / (1 + np.exp(-true_logit))

# Actual outcomes (1 = home win, 0 = away win)
home_win = np.random.binomial(1, home_win_prob)

# Create DataFrame
df = pd.DataFrame({
    'home_wOBA': home_wOBA,
    'away_wOBA': away_wOBA,
    'home_xERA': home_xERA,
    'away_xERA': away_xERA,
    'home_Kpct': home_Kpct,
    'away_Kpct': away_Kpct,
    'home_win': home_win
})

X = df.drop('home_win', axis=1)
y = df['home_win']

# 2. Train / Test Split (80/20)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 3. Train Models
# Logistic Regression
lr = LogisticRegression()
lr.fit(X_train, y_train)
lr_preds = lr.predict(X_test)
lr_acc = accuracy_score(y_test, lr_preds)

# Random Forest
rf = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42)
rf.fit(X_train, y_train)
rf_preds = rf.predict(X_test)
rf_acc = accuracy_score(y_test, rf_preds)

print("=== 2026 MLB Betting Model Training (80/20 Split) ===")
print(f"Total Games Analyzed: {n_games}")
print(f"Training Set: {len(X_train)} games")
print(f"Testing Set: {len(X_test)} games\n")

print(f"Logistic Regression Accuracy on Test Set: {lr_acc:.2%}")
print("Logistic Regression Weights/Coefficients:")
for col, coef in zip(X.columns, lr.coef_[0]):
    print(f"  {col}: {coef:.4f}")
print(f"  Intercept: {lr.intercept_[0]:.4f}\n")

print(f"Random Forest Accuracy on Test Set: {rf_acc:.2%}")

if lr_acc > rf_acc:
    print("-> Winner: Logistic Regression!")
else:
    print("-> Winner: Random Forest!")
