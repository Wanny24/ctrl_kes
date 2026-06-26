import { Activity, ShieldAlert, Heart, RefreshCw, Eye } from 'lucide-react';

export default function DashboardOverview({ prediction, rawData, onBackToForm }) {
  if (!prediction) {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
        <ShieldAlert size={48} color="var(--accent-purple)" style={{ marginBottom: '16px' }} />
        <h3 style={{ marginBottom: '8px' }}>Belum Ada Hasil Analisis</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
          Silakan isi dan kirim data kesehatan Anda pada tab input untuk memulai analisis risiko deep learning.
        </p>
        <button onClick={onBackToForm} className="btn-primary" style={{ width: 'auto', margin: '0 auto' }}>
          Isi Data Sekarang
        </button>
      </div>
    );
  }

  const [hypertensionRisk, diabetesRisk, heartDiseaseRisk] = prediction;

  // Determine overall category
  const maxRisk = Math.max(hypertensionRisk, diabetesRisk, heartDiseaseRisk);
  let statusCategory = 'Risiko Rendah (Sehat)';
  let statusStyle = 'status-healthy';
  let categoryDescription = 'Status kesehatan Anda saat ini optimal. Pertahankan pola hidup sehat Anda!';

  if (maxRisk >= 0.6) {
    statusCategory = 'Risiko Tinggi';
    statusStyle = 'status-high';
    categoryDescription = 'Tingkat risiko Anda terpantau TINGGI. Disarankan untuk segera berkonsultasi dengan dokter dan mengubah pola hidup.';
  } else if (maxRisk >= 0.35) {
    statusCategory = 'Risiko Sedang';
    statusStyle = 'status-medium';
    categoryDescription = 'Tingkat risiko Anda terpantau SEDANG. Perhatikan konsumsi makanan Anda dan tambahkan waktu olahraga.';
  }

  // Calculate target weight (Standard healthy weight range for BMI=22)
  const heightM = rawData.height / 100;
  const targetWeight = Math.round(22 * heightM * heightM);

  // Radial Dial component helper
  const RiskDial = ({ title, percentage, colorGradient }) => {
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
        <h4 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '15px' }}>{title}</h4>
        
        <div className="radial-dial-container">
          <svg className="radial-svg" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle cx="50" cy="50" r={radius} className="radial-bg-circle" />
            {/* Foreground circle with stroke gradient */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              className="radial-progress-circle"
              stroke={`url(#${colorGradient})`}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
            {/* Gradient definition */}
            <defs>
              <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#9d4edd" />
                <stop offset="100%" stopColor="#ff0054" />
              </linearGradient>
              <linearGradient id="cyanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f2fe" />
                <stop offset="100%" stopColor="#00bbf9" />
              </linearGradient>
              <linearGradient id="yellowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
            </defs>
          </svg>
          <div className="dial-center-val">{Math.round(percentage)}%</div>
        </div>

        <div style={{ fontSize: '12px', fontWeight: '500', color: percentage >= 60 ? 'var(--color-danger)' : percentage >= 35 ? 'var(--color-warning)' : 'var(--color-healthy)' }}>
          {percentage >= 60 ? 'Tinggi' : percentage >= 35 ? 'Sedang' : 'Rendah'}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Risk Category Summary */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          marginBottom: '24px',
          background: maxRisk >= 0.6 
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(17, 20, 34, 0.6) 100%)'
            : 'rgba(17, 20, 34, 0.6)',
          borderColor: maxRisk >= 0.6 ? 'rgba(239,68,68,0.2)' : 'var(--border-light)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}
      >
        <div style={{ flex: 1, minWidth: '280px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span className={`status-badge ${statusStyle}`}>
              <ShieldAlert size={14} /> {statusCategory}
            </span>
          </div>
          <h2 style={{ fontSize: '22px', marginBottom: '6px' }}>Hasil Analisis Model Deep Learning</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px' }}>{categoryDescription}</p>
        </div>

        <button
          onClick={onBackToForm}
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-light)',
            color: 'var(--text-primary)',
            padding: '10px 16px',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <RefreshCw size={14} /> Input Ulang Data
        </button>
      </div>

      {/* Row of Gauges */}
      <div className="dials-grid">
        <RiskDial title="Risiko Hipertensi" percentage={hypertensionRisk * 100} colorGradient="yellowGradient" />
        <RiskDial title="Risiko Diabetes" percentage={diabetesRisk * 100} colorGradient="cyanGradient" />
        <RiskDial title="Risiko Penyakit Jantung" percentage={heartDiseaseRisk * 100} colorGradient="purpleGradient" />
      </div>

      {/* Recommendations Card */}
      <div className="glass-panel recommendations-card">
        <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <Heart size={20} color="var(--color-danger)" /> Mesin Rekomendasi Kesehatan
        </h3>

        <div className="rec-list">
          {/* Target Berat Badan */}
          <div className="rec-item" style={{ borderLeftColor: 'var(--accent-cyan)' }}>
            <div className="rec-item-title">🎯 Target Berat Badan</div>
            <div className="rec-item-desc">
              Berat badan ideal Anda adalah <strong style={{ color: 'var(--accent-cyan)' }}>{targetWeight} kg</strong>. 
              {rawData.weight > targetWeight 
                ? ` Kurangi ${rawData.weight - targetWeight} kg untuk mencapai target.` 
                : ' Berat badan Anda sudah dalam rentang ideal.'}
            </div>
          </div>

          {/* Pola Makan */}
          <div className="rec-item" style={{ borderLeftColor: 'var(--accent-purple)' }}>
            <div className="rec-item-title">🥦 Rencana Pola Makan</div>
            <div className="rec-item-desc">
              {rawData.cholesterol >= 200 || rawData.systolic >= 140 ? (
                <span>Kurangi konsumsi <strong>garam</strong> dan <strong>makanan berlemak jenuh</strong>. Tingkatkan serat.</span>
              ) : (
                <span>Kurangi konsumsi karbohidrat olahan dan gula tambahan.</span>
              )}
            </div>
          </div>

          {/* Olahraga */}
          <div className="rec-item" style={{ borderLeftColor: 'var(--color-healthy)' }}>
            <div className="rec-item-title">🏃 Aktivitas & Olahraga</div>
            <div className="rec-item-desc">
              Lakukan latihan aerobik intensitas sedang (seperti jalan cepat, jogging, bersepeda) selama <strong style={{ color: 'var(--color-healthy)' }}>30 menit sehari</strong> (minimal 150 menit seminggu).
            </div>
          </div>

          {/* Kontrol Jadwal */}
          <div className="rec-item" style={{ borderLeftColor: 'var(--color-warning)' }}>
            <div className="rec-item-title">📅 Jadwal Kontrol Medis</div>
            <div className="rec-item-desc">
              {maxRisk >= 0.6 ? (
                <span>Lakukan <strong>kontrol ulang dalam 1 bulan</strong> untuk memantau tekanan darah dan kolesterol.</span>
              ) : (
                <span>Lakukan kontrol ulang rutin dalam 3-6 bulan mendatang.</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
