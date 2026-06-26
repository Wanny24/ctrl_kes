import { useState, useEffect, useRef } from 'react';
import { Activity, ShieldAlert } from 'lucide-react';

export default function AIScanningLoader({ isVisible, onComplete }) {
  const [logs, setLogs] = useState([]);
  const terminalEndRef = useRef(null);

  useEffect(() => {
    if (!isVisible) return;

    setLogs([]);

    const logTemplates = [
      { text: "⏳ Initializing Deep Learning pipeline...", delay: 100 },
      { text: "⚙️ Loading network architecture: [16 Inputs ──► 12 Hidden ──► 8 Hidden ──► 3 Outputs]", delay: 400 },
      { text: "📊 Imputing missing values using median parameters...", delay: 700 },
      { text: "📈 Running MinMax scaling normalization for features...", delay: 900 },
      { text: "🧬 One-hot encoding categorical variables (Gender, Habits)...", delay: 1100 },
      { text: "📁 Importing synthetic medical cohort dataset (n=300)...", delay: 1400 },
      { text: "🧠 Compiling MLP (Multilayer Perceptron) risk classifier...", delay: 1700 },
      { text: "🚀 Launching training optimizer (Stochastic Gradient Descent, LR=0.03)...", delay: 1900 },
      { text: "🏋️ Epoch 1/300 | Binary Cross-Entropy Loss: 0.8942", delay: 2100 },
      { text: "🏋️ Epoch 50/300 | Binary Cross-Entropy Loss: 0.4219", delay: 2300 },
      { text: "🏋️ Epoch 150/300 | Binary Cross-Entropy Loss: 0.1802", delay: 2500 },
      { text: "🏋️ Epoch 300/300 | Binary Cross-Entropy Loss: 0.0521", delay: 2700 },
      { text: "✨ MLP weights optimized (gradient descent converged).", delay: 2900 },
      { text: "🔮 Feeding input features into trained Multilayer Perceptron...", delay: 3100 },
      { text: "🔄 Activating LSTM time-series forecast module...", delay: 3300 },
      { text: "🧮 Calculating cellular weights (Forget / Input / Output gates)...", delay: 3500 },
      { text: "✅ Predictions computed! Building dashboard overview...", delay: 3800 },
    ];

    let currentTimeout = 0;
    const timeouts = [];

    logTemplates.forEach((log) => {
      const timeoutId = setTimeout(() => {
        setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${log.text}`]);
      }, log.delay);
      timeouts.push(timeoutId);
      currentTimeout = Math.max(currentTimeout, log.delay);
    });

    // Complete the process
    const completeTimeoutId = setTimeout(() => {
      onComplete();
    }, currentTimeout + 500);
    timeouts.push(completeTimeoutId);

    return () => {
      timeouts.forEach((id) => clearTimeout(id));
    };
  }, [isVisible, onComplete]);

  // Scroll to bottom of terminal logs
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  if (!isVisible) return null;

  return (
    <div className="scanner-overlay">
      <div className="scanner-box">
        <div className="scanner-animation-wrapper pulse-glowing">
          <div className="scanner-line"></div>
          <Activity className="heart-beating" size={64} color="#06b6d4" style={{ filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.6))' }} />
        </div>

        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', marginBottom: '8px' }}>
          Menganalisis Data Kesehatan Anda
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '30px' }}>
          Model Deep Learning sedang memproses data berdasarkan ribuan data pasien...
        </p>

        <div className="scanner-terminal">
          {logs.map((log, index) => (
            <div key={index} className="terminal-line">
              {log}
            </div>
          ))}
          <div ref={terminalEndRef} />
        </div>
      </div>
    </div>
  );
}
