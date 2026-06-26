"""
Deep Learning Health Monitoring and Control System - Offline Reference Code
This module implements the underlying Deep Learning architectures in both PyTorch and TensorFlow.
It matches the structures used in the interactive React browser-based engines.

Contains:
1. Data Preprocessing Flow (Pandas & Scikit-Learn)
2. MLP (Multilayer Perceptron) Classifier (Tabular Risk Prediction)
3. LSTM (Long Short-Term Memory) Regressor (Periodic Trend Forecasting)
"""

import numpy as np
import pandas as pd

# =====================================================================
# PART 1: DATA PREPROCESSING
# =====================================================================
from sklearn.preprocessing import MinMaxScaler
from sklearn.impute import SimpleImputer

def preprocess_health_data(raw_df: pd.DataFrame) -> np.ndarray:
    """
    Standard preprocessor mimicking the JS frontend.
    Handles Imputation (median) and scaling (MinMax to [0,1]).
    """
    # Define features
    features = [
        'age', 'gender_encoded', 'height', 'weight', 'bmi',
        'systolic', 'diastolic', 'cholesterol', 'sugar', 'heartRate',
        'smoke_encoded', 'activity_encoded', 'diet_encoded',
        'history_hypertension', 'history_diabetes', 'history_heartDisease'
    ]
    
    # 1. Impute missing values with median
    imputer = SimpleImputer(strategy='median')
    imputed_data = imputer.fit_transform(raw_df[features])
    
    # 2. Scale continuous variables to [0, 1] range
    scaler = MinMaxScaler()
    scaled_data = scaler.fit_transform(imputed_data)
    
    return scaled_data


# =====================================================================
# PART 2: PYTORCH IMPLEMENTATION
# =====================================================================
import torch
import torch.nn as nn
import torch.optim as optim

class PyTorchMLPClassifier(nn.Module):
    """
    Multilayer Perceptron (Dense Neural Network) in PyTorch.
    Input size: 16 (scaled health metrics)
    Hidden layers: 12, 8
    Output size: 3 (hypertension, diabetes, heart disease risk probabilities)
    """
    def __init__(self):
        super(PyTorchMLPClassifier, self).__init__()
        this_fc1 = nn.Linear(16, 12)
        this_fc2 = nn.Linear(12, 8)
        this_fc3 = nn.Linear(8, 3)
        
        this_relu = nn.ReLU()
        this_sigmoid = nn.Sigmoid()
        
        # Sequenced Layer Container
        self.network = nn.Sequential(
            this_fc1,
            this_relu,
            this_fc2,
            this_relu,
            this_fc3,
            this_sigmoid # maps outputs to [0, 1] probability range
        )
        
    def forward(self, x):
        return self.network(x)


class PyTorchLSTMRegressor(nn.Module):
    """
    LSTM Recurrent Neural Network in PyTorch for time-series forecasting.
    Predicts: [cholesterol, systolic, diastolic, sugar]
    """
    def __init__(self, input_dim=4, hidden_dim=8, output_dim=4, num_layers=1):
        super(PyTorchLSTMRegressor, self).__init__()
        self.hidden_dim = hidden_dim
        self.num_layers = num_layers
        
        self.lstm = nn.LSTM(input_dim, hidden_dim, num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_dim, output_dim)
        
    def forward(self, x):
        # x shape: (batch_size, sequence_length, input_dim)
        h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_dim).to(x.device)
        c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_dim).to(x.device)
        
        # Forward propagate LSTM
        out, _ = self.lstm(x, (h0, c0))
        
        # Decode the hidden state of the last time step
        out = self.fc(out[:, -1, :])
        return out


# =====================================================================
# PART 3: TENSORFLOW / KERAS IMPLEMENTATION
# =====================================================================
# Commented imports to avoid import failures if TensorFlow is not installed.
# To run this code, ensure you run: pip install tensorflow
"""
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, LSTM, Input

def build_keras_mlp_classifier():
    model = Sequential([
        Input(shape=(16,)),
        Dense(12, activation='relu'),
        Dense(8, activation='relu'),
        Dense(3, activation='sigmoid') # output layer (probabilities)
    ])
    model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
    return model

def build_keras_lstm_regressor(sequence_length=4, features=4):
    model = Sequential([
        Input(shape=(sequence_length, features)),
        LSTM(8, activation='tanh', return_sequences=False),
        Dense(features) # outputs [chol, systolic, diastolic, sugar] prediction
    ])
    model.compile(optimizer='adam', loss='mse')
    return model
"""


# =====================================================================
# PART 4: PYTORCH TRAINING DEMO WORKFLOW
# =====================================================================
if __name__ == "__main__":
    print("--- Running Deep Learning Model Offline Demo ---")
    
    # 1. Create a dummy tabular patient batch (representing preprocessed outputs)
    # Shape: (5 patients, 16 features)
    dummy_input_tabular = torch.randn(5, 16)
    
    # Initialize PyTorch MLP
    mlp_model = PyTorchMLPClassifier()
    mlp_model.eval()
    
    with torch.no_grad():
        mlp_predictions = mlp_model(dummy_input_tabular)
        
    print("\n[MLP CLASSIFIER INFERENCE TARGETS]")
    for i, pred in enumerate(mlp_predictions):
        h_risk, d_risk, c_risk = pred.numpy()
        print(f"Patient {i+1} Risks -> Hypertension: {h_risk*100:.1f}%, Diabetes: {d_risk*100:.1f}%, Heart Disease: {c_risk*100:.1f}%")
        
    # 2. Create a dummy sequence batch for LSTM
    # Shape: (Batch Size=1, Sequence Length=4 weeks, Features=4)
    # Features: [Cholesterol, Systolic BP, Diastolic BP, Blood Sugar]
    dummy_sequence = torch.randn(1, 4, 4)
    
    # Initialize PyTorch LSTM
    lstm_model = PyTorchLSTMRegressor()
    lstm_model.eval()
    
    with torch.no_grad():
        lstm_prediction = lstm_model(dummy_sequence)
        
    print("\n[LSTM TIME-SERIES INFERENCE TARGETS]")
    print(f"Projected metrics for next week -> {lstm_prediction.numpy()[0]}")
    print("\nDeep Learning architectures mapped successfully!")
