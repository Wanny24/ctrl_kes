import { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, LineChart, Cpu, TrendingDown } from 'lucide-react';
import { LSTMForecaster } from '../utils/lstm';
import { supabase } from '../utils/supabaseClient';

export default function FuturePrediction() {
  // Initial historical logs (similar to the user's example)
  const [logs, setLogs] = useState([
    { week: 1, cholesterol: 240, systolic: 150, diastolic: 95, sugar: 125 },
    { week: 2, cholesterol: 230, systolic: 145, diastolic: 90, sugar: 120 },
    { week: 3, cholesterol: 220, systolic: 140, diastolic: 85, sugar: 115 },
    { week: 4, cholesterol: 205, systolic: 135, diastolic: 82, sugar: 110 }
  ]);

  const [forecastResults, setForecastResults] = useState([]);
  const [activeMetric, setActiveMetric] = useState('cholesterol'); // 'cholesterol', 'systolic', 'sugar'
  
  // Form state for adding new weekly logs
  const [newChol, setNewChol] = useState(200);
  const [newSys, setNewSys] = useState(130);
  const [newDia, setNewDia] = useState(80);
  const [newSugar, setNewSugar] = useState(105);

  // Load logs from Supabase on mount
  useEffect(() => {
    async function loadLogs() {
      if (!supabase) return;
      try {
        const { data, error } = await supabase
          .from('health_logs')
          .select('*')
          .order('week', { ascending: true });

        if (error) {
          console.error("Gagal mengambil log kesehatan dari Supabase:", error);
          return;
        }

        if (data && data.length > 0) {
          setLogs(data);
          console.log("Berhasil memuat log mingguan dari database Supabase!");
        }
      } catch (err) {
        console.error("Gagal terhubung ke database Supabase:", err);
      }
    }
    loadLogs();
  }, []);

  const handleAddLog = async () => {
    const nextWeek = logs.length > 0 ? Math.max(...logs.map(l => l.week)) + 1 : 1;
    const newEntry = {
      week: nextWeek,
      cholesterol: parseInt(newChol),
      systolic: parseInt(newSys),
      diastolic: parseInt(newDia),
      sugar: parseInt(newSugar)
    };

    // Update local state first for immediate UI response
    setLogs(prev => [...prev, newEntry]);

    if (supabase) {
      try {
        const { error } = await supabase
          .from('health_logs')
          .insert([newEntry]);

        if (error) {
          console.error("Gagal menyimpan entri baru ke Supabase:", error);
        } else {
          // Sync state with database to get actual IDs
          const { data } = await supabase
            .from('health_logs')
            .select('*')
            .order('week', { ascending: true });
          if (data) {
            setLogs(data);
          }
        }
      } catch (err) {
        console.error("Kesalahan jaringan saat menyimpan log ke Supabase:", err);
      }
    }
  };

  const handleRemoveLog = async (weekToRemove) => {
    const targetLog = logs.find(l => l.week === weekToRemove);
    const updatedLocalLogs = logs.filter(l => l.week !== weekToRemove).map((l, idx) => ({ ...l, week: idx + 1 }));
    
    setLogs(updatedLocalLogs);
    setForecastResults([]);

    if (supabase) {
      try {
        if (targetLog && targetLog.id) {
          // Delete from database by id
          await supabase.from('health_logs').delete().eq('id', targetLog.id);
        } else {
          // Fallback delete by week number
          await supabase.from('health_logs').delete().eq('week', weekToRemove);
        }

        // Update the week indexes of the remaining logs in Supabase to keep them sequential
        for (const item of updatedLocalLogs) {
          if (item.id) {
            await supabase
              .from('health_logs')
              .update({ week: item.week })
              .eq('id', item.id);
          }
        }
      } catch (err) {
        console.error("Gagal menghapus log dari Supabase:", err);
      }
    }
  };

  const handlePredict = () => {
    if (logs.length < 2) {
      alert("Masukkan minimal 2 minggu data log untuk memproyeksikan tren!");
      return;
    }

    const lstm = new LSTMForecaster();
    // Prep history matrix: [[chol, sys, dia, sugar], ...]
    const historyData = logs.map(l => [l.cholesterol, l.systolic, l.diastolic, l.sugar]);
    const steps = 8; // Predict 8 weeks (2 months) in future

    const forecast = lstm.forecast(historyData, steps);
    setForecastResults(forecast);
  };

  // SVG Chart drawing helper
  const renderSvgChart = () => {
    const width = 600;
    const height = 280;
    const padding = 40;
    const chartW = width - padding * 2;
    const chartH = height - padding * 2;

    const actualData = logs.map(l => ({ val: l[activeMetric], label: `W${l.week}`, type: 'actual' }));
    const projectedData = forecastResults.map((f, idx) => ({
      val: f[activeMetric],
      label: `W${logs.length + idx + 1}`,
      type: 'projected'
    }));

    const combined = [...actualData, ...projectedData];
    if (combined.length === 0) return null;

    // Define Y scale
    const values = combined.map(d => d.val);
    const minVal = Math.min(...values) * 0.95;
    const maxVal = Math.max(...values) * 1.05;
    const valRange = maxVal - minVal;

    const getX = (index) => padding + (index / (combined.length - 1)) * chartW;
    const getY = (value) => padding + chartH - ((value - minVal) / valRange) * chartH;

    // Path generators
    let actualPoints = [];
    let projectedPoints = [];

    actualData.forEach((d, idx) => {
      actualPoints.push(`${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(d.val)}`);
    });

    if (actualData.length > 0 && projectedData.length > 0) {
      // Connect actual to projected
      projectedPoints.push(`M ${getX(actualData.length - 1)} ${getY(actualData[actualData.length - 1].val)}`);
      projectedData.forEach((d, idx) => {
        projectedPoints.push(`L ${getX(actualData.length + idx)} ${getY(d.val)}`);
      });
    }

    const metricColor = activeMetric === 'cholesterol' 
      ? '#9d4edd' 
      : activeMetric === 'systolic' 
      ? '#06b6d4' 
      : '#10b981';

    return (
      <div style={{ position: 'relative' }}>
        <svg className="chart-svg" viewBox={`0 0 ${width} ${height}`}>
          {/* Y Axes lines & grid */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const val = minVal + ratio * valRange;
            const y = padding + chartH - ratio * chartH;
            return (
              <g key={ratio}>
                <line x1={padding} y1={y} x2={width - padding} y2={y} className="chart-grid-line" />
                <text x={padding - 10} y={y + 3} fill="var(--text-muted)" fontSize={10} textAnchor="end" fontFamily="var(--font-mono)">
                  {Math.round(val)}
                </text>
              </g>
            );
          })}

          {/* X Axis Labels */}
          {combined.map((d, idx) => (
            <text key={idx} x={getX(idx)} y={height - padding + 20} fill="var(--text-secondary)" fontSize={10} textAnchor="middle">
              {d.label}
            </text>
          ))}

          {/* Actual line */}
          {actualPoints.length > 0 && (
            <path
              d={actualPoints.join(' ')}
              className="chart-line"
              stroke={metricColor}
              style={{ filter: `drop-shadow(0 0 4px ${metricColor})` }}
            />
          )}

          {/* Projected line (Dashed) */}
          {projectedPoints.length > 0 && (
            <path
              d={projectedPoints.join(' ')}
              className="chart-line"
              stroke={metricColor}
              strokeDasharray="5,5"
              style={{ filter: `drop-shadow(0 0 2px ${metricColor})` }}
            />
          )}

          {/* Data Points */}
          {combined.map((d, idx) => (
            <circle
              key={idx}
              cx={getX(idx)}
              cy={getY(d.val)}
              r={d.type === 'actual' ? 4 : 3}
              fill={d.type === 'actual' ? metricColor : 'transparent'}
              stroke={metricColor}
              strokeWidth={1.5}
              className="chart-node"
            />
          ))}

          {/* Divider between Actual and Forecast */}
          {forecastResults.length > 0 && (
            <line
              x1={getX(actualData.length - 1)}
              y1={padding - 10}
              x2={getX(actualData.length - 1)}
              y2={height - padding + 5}
              stroke="rgba(255,255,255,0.15)"
              strokeDasharray="2,2"
            />
          )}
        </svg>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Card: Input Log berkala */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
            <Calendar size={20} color="var(--accent-purple)" /> Log Kesehatan Berkala (Mingguan)
          </h3>
          
          <table className="log-table">
            <thead>
              <tr>
                <th>Minggu</th>
                <th>Kolesterol</th>
                <th>Tekanan Darah</th>
                <th>Gula Darah</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.week}>
                  <td>Minggu {log.week}</td>
                  <td style={{ color: 'var(--accent-purple)', fontWeight: '600' }}>{log.cholesterol}</td>
                  <td style={{ color: 'var(--accent-cyan)', fontWeight: '600' }}>{log.systolic}/{log.diastolic}</td>
                  <td style={{ color: 'var(--accent-emerald)', fontWeight: '600' }}>{log.sugar}</td>
                  <td>
                    <button
                      onClick={() => handleRemoveLog(log.week)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-danger)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Quick Add Section */}
          <div
            style={{
              marginTop: '20px',
              padding: '16px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-light)',
              borderRadius: '12px'
            }}
          >
            <h4 style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '12px' }}>
              Tambah Log Mingguan Baru
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '15px' }}>
              <div className="form-group">
                <label style={{ fontSize: '11px' }}>Kolesterol (mg/dL)</label>
                <input
                  type="number"
                  value={newChol}
                  onChange={(e) => setNewChol(e.target.value)}
                  className="form-input"
                  style={{ padding: '6px 10px', fontSize: '12px' }}
                />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '11px' }}>Sistolik (BP)</label>
                <input
                  type="number"
                  value={newSys}
                  onChange={(e) => setNewSys(e.target.value)}
                  className="form-input"
                  style={{ padding: '6px 10px', fontSize: '12px' }}
                />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '11px' }}>Diastolik (BP)</label>
                <input
                  type="number"
                  value={newDia}
                  onChange={(e) => setNewDia(e.target.value)}
                  className="form-input"
                  style={{ padding: '6px 10px', fontSize: '12px' }}
                />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '11px' }}>Gula (mg/dL)</label>
                <input
                  type="number"
                  value={newSugar}
                  onChange={(e) => setNewSugar(e.target.value)}
                  className="form-input"
                  style={{ padding: '6px 10px', fontSize: '12px' }}
                />
              </div>
            </div>

            <button
              onClick={handleAddLog}
              className="btn-primary"
              style={{ padding: '10px 16px', fontSize: '13px', display: 'flex', gap: '6px', margin: 0 }}
            >
              <Plus size={16} /> Tambah Entri
            </button>
          </div>
        </div>

        {/* Right Card: Predict Controls & Table */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Cpu size={20} color="var(--accent-cyan)" /> Proyeksi Masa Depan (LSTM)
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              LSTM Recurrent Neural Network mempelajari laju penurunan/peningkatan dari log Anda dan memproyeksikan perubahannya di masa depan.
            </p>
          </div>

          <button onClick={handlePredict} className="btn-primary">
            <LineChart size={18} /> Prediksi Tren Masa Depan (LSTM)
          </button>

          {forecastResults.length > 0 && (
            <div
              className="glass-panel"
              style={{
                padding: '16px',
                background: 'rgba(6, 182, 212, 0.03)',
                borderColor: 'rgba(6, 182, 212, 0.2)',
                borderRadius: '12px'
              }}
            >
              <h4 style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', color: 'var(--accent-cyan)' }}>
                <TrendingDown size={18} /> Proyeksi Dalam 2 Bulan (Minggu {logs.length + forecastResults.length})
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '13px' }}>
                <div>
                  Kolesterol Diperkirakan: <strong style={{ color: 'var(--accent-purple)' }}>{forecastResults[forecastResults.length - 1].cholesterol} mg/dL</strong>
                </div>
                <div>
                  Tekanan Darah: <strong style={{ color: 'var(--accent-cyan)' }}>{forecastResults[forecastResults.length - 1].systolic}/{forecastResults[forecastResults.length - 1].diastolic} mmHg</strong>
                </div>
                <div>
                  Gula Darah: <strong style={{ color: 'var(--accent-emerald)' }}>{forecastResults[forecastResults.length - 1].sugar} mg/dL</strong>
                </div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '10px' }}>
                *Hasil estimasi model LSTM berdasarkan pemeliharaan pola latihan dan pola konsumsi sehat secara konsisten.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chart Section */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📈 Visualisasi Grafik Tren dan Prediksi
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              Garis solid menggambarkan data log mingguan Anda; garis putus-putus menggambarkan proyeksi dari model LSTM.
            </p>
          </div>

          {/* Metric Selector Toggles */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '4px', border: '1px solid var(--border-light)' }}>
            {[
              { id: 'cholesterol', name: 'Kolesterol' },
              { id: 'systolic', name: 'Tekanan Darah (Sistolik)' },
              { id: 'sugar', name: 'Gula Darah' }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveMetric(m.id)}
                style={{
                  background: activeMetric === m.id ? 'rgba(255,255,255,0.08)' : 'transparent',
                  border: 'none',
                  color: activeMetric === m.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>

        {renderSvgChart() || (
          <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
            Klik tombol "Prediksi Tren Masa Depan" di atas untuk melihat grafik prediksi LSTM.
          </div>
        )}
      </div>

    </div>
  );
}
