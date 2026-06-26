import { useState } from 'react';
import { ArrowRight, Columns, Code, CheckCircle, Database } from 'lucide-react';
import { preprocessInput, FeatureNames } from '../utils/preprocessor';

export default function PreprocessingBoard({ inputData }) {
  const [activeStep, setActiveStep] = useState(0);

  if (!inputData) return null;

  const preprocessedArray = preprocessInput(inputData);

  const steps = [
    {
      title: "1. Missing Value Check",
      desc: "Mengevaluasi jika ada nilai kosong, lalu diimputasi dengan nilai median / tengah.",
      icon: Database,
      content: (
        <div>
          <div style={{ color: 'var(--color-healthy)', marginBottom: '8px', fontSize: '13px', fontWeight: '500' }}>
            ✓ Semua kolom terisi penuh (0 missing values ditemukan).
          </div>
          <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: 'var(--text-secondary)', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <th style={{ padding: '6px' }}>Parameter</th>
                <th style={{ padding: '6px' }}>Status</th>
                <th style={{ padding: '6px' }}>Nilai Imputasi</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '6px' }}>Kolesterol</td>
                <td style={{ padding: '6px', color: 'var(--color-healthy)' }}>Valid</td>
                <td style={{ padding: '6px', color: 'var(--text-muted)' }}>-</td>
              </tr>
              <tr>
                <td style={{ padding: '6px' }}>Tekanan Darah</td>
                <td style={{ padding: '6px', color: 'var(--color-healthy)' }}>Valid</td>
                <td style={{ padding: '6px', color: 'var(--text-muted)' }}>-</td>
              </tr>
            </tbody>
          </table>
        </div>
      )
    },
    {
      title: "2. MinMax Normalisasi",
      desc: "Mengubah nilai kontinu menjadi skala [0, 1] menggunakan formula: x_norm = (x - min) / (max - min)",
      icon: Columns,
      content: (
        <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
          <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: 'var(--text-secondary)', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <th style={{ padding: '4px' }}>Fitur</th>
                <th style={{ padding: '4px' }}>Nilai Asli</th>
                <th style={{ padding: '4px' }}>Normalisasi</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '4px' }}>Umur</td>
                <td style={{ padding: '4px' }}>{inputData.age} thn</td>
                <td style={{ padding: '4px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{preprocessedArray[0]?.toFixed(4)}</td>
              </tr>
              <tr>
                <td style={{ padding: '4px' }}>Tekanan Darah (Sistolik)</td>
                <td style={{ padding: '4px' }}>{inputData.systolic} mmHg</td>
                <td style={{ padding: '4px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{preprocessedArray[5]?.toFixed(4)}</td>
              </tr>
              <tr>
                <td style={{ padding: '4px' }}>Kolesterol Total</td>
                <td style={{ padding: '4px' }}>{inputData.cholesterol} mg/dL</td>
                <td style={{ padding: '4px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{preprocessedArray[7]?.toFixed(4)}</td>
              </tr>
              <tr>
                <td style={{ padding: '4px' }}>Gula Darah</td>
                <td style={{ padding: '4px' }}>{inputData.sugar} mg/dL</td>
                <td style={{ padding: '4px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{preprocessedArray[8]?.toFixed(4)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )
    },
    {
      title: "3. Categorical Encoding",
      desc: "Mengonversi variabel kategori (Laki-laki, Merokok, dll) menjadi representasi biner numerik.",
      icon: Code,
      content: (
        <div>
          <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: 'var(--text-secondary)', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <th style={{ padding: '6px' }}>Kategori</th>
                <th style={{ padding: '6px' }}>Nilai Asli</th>
                <th style={{ padding: '6px' }}>Encoding</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '6px' }}>Jenis Kelamin</td>
                <td style={{ padding: '6px' }}>{inputData.gender}</td>
                <td style={{ padding: '6px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{inputData.gender === 'Laki-laki' ? '1.0 (Pria)' : '0.0 (Wanita)'}</td>
              </tr>
              <tr>
                <td style={{ padding: '6px' }}>Merokok</td>
                <td style={{ padding: '6px' }}>{inputData.smoke}</td>
                <td style={{ padding: '6px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{inputData.smoke === 'Ya' ? '1.0' : '0.0'}</td>
              </tr>
              <tr>
                <td style={{ padding: '6px' }}>Aktivitas Fisik</td>
                <td style={{ padding: '6px' }}>{inputData.activity}</td>
                <td style={{ padding: '6px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{preprocessedArray[11]?.toFixed(1)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )
    },
    {
      title: "4. Output Tensor",
      desc: "Menghasilkan vector numerik 1D (size=16) yang siap dikomputasi oleh model Deep Learning.",
      icon: CheckCircle,
      content: (
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Tensor Shape: <strong style={{ color: 'var(--accent-purple)' }}>[16, 1]</strong>
          </div>
          <div
            style={{
              background: 'rgba(0,0,0,0.3)',
              padding: '10px',
              borderRadius: '8px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--accent-cyan)',
              wordBreak: 'break-all',
              maxHeight: '100px',
              overflowY: 'auto'
            }}
          >
            [{preprocessedArray.map(v => v.toFixed(3)).join(', ')}]
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '30px' }}>
      <h3 style={{ fontSize: '18px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        ⚙️ Pipeline Preprocessing Data
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <button
                key={idx}
                onClick={() => setActiveStep(idx)}
                style={{
                  background: activeStep === idx ? 'rgba(157, 78, 221, 0.1)' : 'rgba(255,255,255,0.02)',
                  border: '1px solid',
                  borderColor: activeStep === idx ? 'var(--accent-purple)' : 'var(--border-light)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  color: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
              >
                <Icon size={18} color={activeStep === idx ? 'var(--accent-purple)' : 'var(--text-secondary)'} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: activeStep === idx ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {step.title}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div
          className="glass-panel"
          style={{
            padding: '20px',
            background: 'rgba(0,0,0,0.15)',
            borderColor: 'var(--border-light)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <h4 style={{ color: 'var(--text-primary)', fontSize: '15px', marginBottom: '6px' }}>
              {steps[activeStep].title}
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12.5px', marginBottom: '16px' }}>
              {steps[activeStep].desc}
            </p>
            {steps[activeStep].content}
          </div>
        </div>
      </div>
    </div>
  );
}
