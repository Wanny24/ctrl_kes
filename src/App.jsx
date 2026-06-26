import { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  TrendingUp, 
  Bot, 
  Activity, 
  Heart,
  CalendarDays
} from 'lucide-react';
import './App.css';

// Components
import HealthForm from './components/HealthForm';
import PreprocessingBoard from './components/PreprocessingBoard';
import AIScanningLoader from './components/AIScanningLoader';
import DashboardOverview from './components/DashboardOverview';
import FuturePrediction from './components/FuturePrediction';
import AIHealthCoach from './components/AIHealthCoach';

// Logic & Models
import { MultilayerPerceptron } from './utils/mlp';
import { preprocessInput } from './utils/preprocessor';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showScanner, setShowScanner] = useState(false);

  // Initialize the MLP model with pre-calibrated default weights
  const [mlpModel, setMlpModel] = useState(() => {
    const model = new MultilayerPerceptron([16, 12, 8, 3]);
    model.seedWeights();
    return model;
  });

  // Default patient profile (corresponds to the User's example of a high risk profile)
  const defaultProfile = {
    age: 45,
    gender: 'Laki-laki',
    height: 168,
    weight: 85,
    systolic: 150,
    diastolic: 95,
    cholesterol: 245,
    sugar: 125,
    heartRate: 85,
    smoke: 'Ya',
    activity: 'Jarang',
    diet: 'Kurang Sehat',
    history: {
      hypertension: true,
      diabetes: false,
      heartDisease: false
    }
  };

  const [rawData, setRawData] = useState(defaultProfile);

  // Initial calibrated prediction matching the User's exact prompt metrics:
  // Hypertension: 92%, Diabetes: 71%, Heart Disease: 65%
  const [prediction, setPrediction] = useState([0.92, 0.71, 0.65]);

  // Handle form submissions: triggers loading scan animation and executes the MLP network
  const handleFormSubmit = (data) => {
    setRawData(data);
    setShowScanner(true);
  };

  // Run inference and complete the loading animation
  const handleScanComplete = () => {
    setShowScanner(false);
    
    // Process raw inputs into 1D normalized tensor vector (size=16)
    const features = preprocessInput(rawData);
    
    // Predict risks using MLP Model
    const output = mlpModel.predict(features);
    setPrediction(output);
    
    // Switch to Dashboard tab to display results
    setActiveTab('dashboard');
  };

  return (
    <div className="app-container">
      
      {/* Immersive Loading & Training Screen */}
      <AIScanningLoader isVisible={showScanner} onComplete={handleScanComplete} />

      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand-section">
          <Activity className="brand-logo heart-beating" />
          <span className="brand-name text-gradient">DeepHealth AI</span>
        </div>

        <nav className="sidebar-nav">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('input')} 
            className={`nav-item ${activeTab === 'input' ? 'active' : ''}`}
          >
            <ClipboardList size={18} />
            <span>Input Kesehatan</span>
          </button>

          <button 
            onClick={() => setActiveTab('projection')} 
            className={`nav-item ${activeTab === 'projection' ? 'active' : ''}`}
          >
            <TrendingUp size={18} />
            <span>Proyeksi Tren (LSTM)</span>
          </button>

          <button 
            onClick={() => setActiveTab('chat')} 
            className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`}
          >
            <Bot size={18} />
            <span>Asisten AI Coach</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-avatar">US</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13px', fontWeight: '600' }}>Pengguna Umum</span>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Status: Aktif</span>
          </div>
        </div>
      </aside>

      {/* Main Dashboard Workspace */}
      <main className="main-content">
        
        {/* Render Tab Contents */}
        {activeTab === 'dashboard' && (
          <div>
            <div className="header-section">
              <div className="header-title">
                <h1>Overview Kesehatan Anda</h1>
                <p>Estimasi risiko penyakit kardiovaskular & metabolik menggunakan model saraf tiruan (MLP).</p>
              </div>
            </div>
            <DashboardOverview 
              prediction={prediction} 
              rawData={rawData} 
              onBackToForm={() => setActiveTab('input')} 
            />
          </div>
        )}

        {activeTab === 'input' && (
          <div>
            <div className="header-section">
              <div className="header-title">
                <h1>Input & Preprocessing Data</h1>
                <p>Masukkan metrik medis terkini Anda untuk diumpankan ke model prediksi.</p>
              </div>
            </div>
            <HealthForm onSubmit={handleFormSubmit} initialData={rawData} />
            <PreprocessingBoard inputData={rawData} />
          </div>
        )}

        {activeTab === 'projection' && (
          <div>
            <div className="header-section">
              <div className="header-title">
                <h1>Proyeksi Tren Kolesterol & Tensi (LSTM)</h1>
                <p>Log data secara berkala dan gunakan model Recurrent LSTM untuk memperkirakan kesehatan 2 bulan ke depan.</p>
              </div>
            </div>
            <FuturePrediction />
          </div>
        )}

        {activeTab === 'chat' && (
          <div>
            <div className="header-section">
              <div className="header-title">
                <h1>AI Health Coach Chat</h1>
                <p>Konsultasikan rekomendasi makan, pola latihan, dan status risiko Anda dengan asisten gaya hidup AI.</p>
              </div>
            </div>
            <AIHealthCoach rawData={rawData} prediction={prediction} />
          </div>
        )}
      </main>

    </div>
  );
}
