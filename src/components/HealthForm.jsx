import { useState, useEffect } from 'react';
import { User, Activity, AlertCircle } from 'lucide-react';
import { HealthRanges } from '../utils/preprocessor';

export default function HealthForm({ onSubmit, initialData }) {
  const [formData, setFormData] = useState(initialData || {
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
  });

  const [bmi, setBmi] = useState(0);
  const [bmiCategory, setBmiCategory] = useState('');

  // Auto calculate BMI
  useEffect(() => {
    const heightM = formData.height / 100;
    const computedBmi = formData.weight / (heightM * heightM);
    setBmi(computedBmi);

    if (computedBmi < 18.5) setBmiCategory('Kekurangan Berat Badan (Underweight)');
    else if (computedBmi < 25) setBmiCategory('Normal (Healthy Weight)');
    else if (computedBmi < 30) setBmiCategory('Kelebihan Berat Badan (Overweight)');
    else setBmiCategory('Obesitas (Obese)');
  }, [formData.height, formData.weight]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleHistoryChange = (field) => {
    setFormData((prev) => ({
      ...prev,
      history: {
        ...prev.history,
        [field]: !prev.history[field]
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const loadExampleData = () => {
    setFormData({
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
    });
  };

  return (
    <form onSubmit={handleSubmit} className="glass-panel form-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={22} color="var(--accent-purple)" /> Isi Data Kesehatan Anda
        </h2>
        <button
          type="button"
          onClick={loadExampleData}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px dashed var(--accent-cyan)',
            color: 'var(--accent-cyan)',
            padding: '6px 12px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '500'
          }}
        >
          Muat Contoh Kasus (Risiko Tinggi)
        </button>
      </div>

      <div className="form-grid">
        {/* Umur */}
        <div className="form-group">
          <label>
            Umur <span className="label-val">{formData.age} Tahun</span>
          </label>
          <input
            type="range"
            min={HealthRanges.age.min}
            max={HealthRanges.age.max}
            value={formData.age}
            onChange={(e) => handleChange('age', parseInt(e.target.value))}
            className="slider-input"
          />
        </div>

        {/* Jenis Kelamin */}
        <div className="form-group">
          <label>Jenis Kelamin</label>
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            {['Laki-laki', 'Perempuan'].map((g) => (
              <button
                key={g}
                type="button"
                className={`checkbox-tile ${formData.gender === g ? 'checked' : ''}`}
                style={{ flex: 1, justifyContent: 'center', padding: '10px' }}
                onClick={() => handleChange('gender', g)}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Tinggi Badan */}
        <div className="form-group">
          <label>
            Tinggi Badan <span className="label-val">{formData.height} cm</span>
          </label>
          <input
            type="range"
            min={HealthRanges.height.min}
            max={HealthRanges.height.max}
            value={formData.height}
            onChange={(e) => handleChange('height', parseInt(e.target.value))}
            className="slider-input"
          />
        </div>

        {/* Berat Badan */}
        <div className="form-group">
          <label>
            Berat Badan <span className="label-val">{formData.weight} kg</span>
          </label>
          <input
            type="range"
            min={HealthRanges.weight.min}
            max={HealthRanges.weight.max}
            value={formData.weight}
            onChange={(e) => handleChange('weight', parseInt(e.target.value))}
            className="slider-input"
          />
        </div>

        {/* BP Systolic */}
        <div className="form-group">
          <label>
            Tekanan Darah Sistolik <span className="label-val" style={{ color: formData.systolic >= 140 ? 'var(--color-danger)' : 'var(--accent-cyan)' }}>{formData.systolic} mmHg</span>
          </label>
          <input
            type="range"
            min={HealthRanges.systolic.min}
            max={HealthRanges.systolic.max}
            value={formData.systolic}
            onChange={(e) => handleChange('systolic', parseInt(e.target.value))}
            className="slider-input"
          />
        </div>

        {/* BP Diastolic */}
        <div className="form-group">
          <label>
            Tekanan Darah Diastolik <span className="label-val" style={{ color: formData.diastolic >= 90 ? 'var(--color-danger)' : 'var(--accent-cyan)' }}>{formData.diastolic} mmHg</span>
          </label>
          <input
            type="range"
            min={HealthRanges.diastolic.min}
            max={HealthRanges.diastolic.max}
            value={formData.diastolic}
            onChange={(e) => handleChange('diastolic', parseInt(e.target.value))}
            className="slider-input"
          />
        </div>

        {/* Cholesterol */}
        <div className="form-group">
          <label>
            Kolesterol Total <span className="label-val" style={{ color: formData.cholesterol >= 200 ? 'var(--color-danger)' : 'var(--accent-cyan)' }}>{formData.cholesterol} mg/dL</span>
          </label>
          <input
            type="range"
            min={HealthRanges.cholesterol.min}
            max={HealthRanges.cholesterol.max}
            value={formData.cholesterol}
            onChange={(e) => handleChange('cholesterol', parseInt(e.target.value))}
            className="slider-input"
          />
        </div>

        {/* Gula Darah */}
        <div className="form-group">
          <label>
            Gula Darah <span className="label-val" style={{ color: formData.sugar >= 126 ? 'var(--color-danger)' : 'var(--accent-cyan)' }}>{formData.sugar} mg/dL</span>
          </label>
          <input
            type="range"
            min={HealthRanges.sugar.min}
            max={HealthRanges.sugar.max}
            value={formData.sugar}
            onChange={(e) => handleChange('sugar', parseInt(e.target.value))}
            className="slider-input"
          />
        </div>

        {/* Heart Rate */}
        <div className="form-group">
          <label>
            Denyut Nadi <span className="label-val">{formData.heartRate} bpm</span>
          </label>
          <input
            type="range"
            min={HealthRanges.heartRate.min}
            max={HealthRanges.heartRate.max}
            value={formData.heartRate}
            onChange={(e) => handleChange('heartRate', parseInt(e.target.value))}
            className="slider-input"
          />
        </div>

        {/* Merokok */}
        <div className="form-group">
          <label>Kebiasaan Merokok</label>
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            {['Ya', 'Tidak'].map((sm) => (
              <button
                key={sm}
                type="button"
                className={`checkbox-tile ${formData.smoke === sm ? 'checked' : ''}`}
                style={{ flex: 1, justifyContent: 'center', padding: '10px' }}
                onClick={() => handleChange('smoke', sm)}
              >
                {sm}
              </button>
            ))}
          </div>
        </div>

        {/* Aktivitas Fisik */}
        <div className="form-group">
          <label>Aktivitas Fisik</label>
          <select
            value={formData.activity}
            onChange={(e) => handleChange('activity', e.target.value)}
            className="form-input"
          >
            <option value="Jarang">Jarang Berolahraga</option>
            <option value="Sedang">Olahraga Sedang (1-3x seminggu)</option>
            <option value="Sering">Olahraga Rutin (5x+ seminggu)</option>
          </select>
        </div>

        {/* Pola Makan */}
        <div className="form-group">
          <label>Pola Makan</label>
          <select
            value={formData.diet}
            onChange={(e) => handleChange('diet', e.target.value)}
            className="form-input"
          >
            <option value="Sehat">Sehat (Banyak Sayur & Buah)</option>
            <option value="Cukup Sehat">Cukup Sehat</option>
            <option value="Kurang Sehat">Kurang Sehat (Tinggi Lemak & Gula)</option>
          </select>
        </div>
      </div>

      {/* BMI Display */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid var(--border-light)',
          borderRadius: '12px',
          padding: '12px 18px',
          marginBottom: '24px',
          fontSize: '14px'
        }}
      >
        <AlertCircle size={20} color="var(--accent-cyan)" />
        <div>
          Indeks Massa Tubuh (IMT / BMI) Anda: <strong style={{ color: 'var(--accent-cyan)' }}>{bmi.toFixed(1)}</strong>. Kategori: <strong style={{ color: bmi >= 25 ? 'var(--color-warning)' : 'var(--color-healthy)' }}>{bmiCategory}</strong>
        </div>
      </div>

      {/* Family Disease History Checkbox */}
      <div style={{ marginBottom: '30px' }}>
        <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)' }}>
          Riwayat Penyakit Keluarga (Genetis)
        </label>
        <div className="checkbox-grid">
          <div
            className={`checkbox-tile ${formData.history.hypertension ? 'checked' : ''}`}
            onClick={() => handleHistoryChange('hypertension')}
          >
            <input
              type="checkbox"
              checked={formData.history.hypertension}
              readOnly
              style={{ display: 'none' }}
            />
            <span>Hipertensi (Tekanan Darah Tinggi)</span>
          </div>

          <div
            className={`checkbox-tile ${formData.history.diabetes ? 'checked' : ''}`}
            onClick={() => handleHistoryChange('diabetes')}
          >
            <input
              type="checkbox"
              checked={formData.history.diabetes}
              readOnly
              style={{ display: 'none' }}
            />
            <span>Diabetes Mellitus</span>
          </div>

          <div
            className={`checkbox-tile ${formData.history.heartDisease ? 'checked' : ''}`}
            onClick={() => handleHistoryChange('heartDisease')}
          >
            <input
              type="checkbox"
              checked={formData.history.heartDisease}
              readOnly
              style={{ display: 'none' }}
            />
            <span>Penyakit Jantung</span>
          </div>
        </div>
      </div>

      <button type="submit" className="btn-primary">
        <Activity size={18} />
        Proses & Menganalisis dengan Deep Learning
      </button>
    </form>
  );
}
