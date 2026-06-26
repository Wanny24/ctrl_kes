// Preprocessing helper for health metrics.
// Defines normal ranges for scaling and provides functions to transform raw objects to normalized feature arrays.

export const HealthRanges = {
  age: { min: 10, max: 100, default: 45 },
  height: { min: 100, max: 220, default: 165 },
  weight: { min: 30, max: 200, default: 70 },
  bmi: { min: 10, max: 50, default: 24.2 },
  systolic: { min: 80, max: 220, default: 120 },
  diastolic: { min: 50, max: 130, default: 80 },
  cholesterol: { min: 100, max: 400, default: 200 },
  sugar: { min: 60, max: 300, default: 100 },
  heartRate: { min: 40, max: 160, default: 75 },
};

/**
 * Normalizes a value between 0 and 1 based on its logical medical range.
 */
export function normalize(value, bounds) {
  if (value === undefined || value === null || isNaN(value)) {
    return 0.5; // Impute missing values with normalized midpoint
  }
  const clamped = Math.max(bounds.min, Math.min(bounds.max, value));
  return (clamped - bounds.min) / (bounds.max - bounds.min);
}

/**
 * Reverses normalization to get actual units from standard [0,1] value.
 */
export function denormalize(normValue, bounds) {
  return normValue * (bounds.max - bounds.min) + bounds.min;
}

/**
 * Preprocesses a raw health data object into a standardized MLP input vector.
 * Expected input fields:
 * - age (number)
 * - gender ('Laki-laki' / 'Perempuan')
 * - height (number)
 * - weight (number)
 * - systolic (number)
 * - diastolic (number)
 * - cholesterol (number)
 * - sugar (number)
 * - heartRate (number)
 * - smoke (boolean / 'Ya' / 'Tidak')
 * - activity ('Jarang' / 'Sedang' / 'Sering')
 * - diet ('Sehat' / 'Cukup Sehat' / 'Kurang Sehat')
 * - history (object with boolean values: hypertension, diabetes, heartDisease)
 * 
 * Output: Array of normalized floats [0..1]
 */
export function preprocessInput(data) {
  // 1. Calculate BMI if not directly provided
  let heightM = (data.height || HealthRanges.height.default) / 100;
  let weight = data.weight || HealthRanges.weight.default;
  let bmi = weight / (heightM * heightM);
  if (isNaN(bmi) || bmi <= 0) bmi = HealthRanges.bmi.default;

  // 2. Continuous variables normalization
  const nAge = normalize(data.age, HealthRanges.age);
  const nHeight = normalize(data.height, HealthRanges.height);
  const nWeight = normalize(data.weight, HealthRanges.weight);
  const nBmi = normalize(bmi, HealthRanges.bmi);
  const nSystolic = normalize(data.systolic, HealthRanges.systolic);
  const nDiastolic = normalize(data.diastolic, HealthRanges.diastolic);
  const nCholesterol = normalize(data.cholesterol, HealthRanges.cholesterol);
  const nSugar = normalize(data.sugar, HealthRanges.sugar);
  const nHeartRate = normalize(data.heartRate, HealthRanges.heartRate);

  // 3. Categorical encoding (0 to 1 scaling)
  // Gender: Laki-laki = 1, Perempuan = 0
  const nGender = data.gender === 'Laki-laki' || data.gender === 'Pria' ? 1.0 : 0.0;

  // Smoking: Ya = 1, Tidak = 0
  const nSmoke = data.smoke === 'Ya' || data.smoke === true ? 1.0 : 0.0;

  // Physical Activity: Sering = 0 (low risk), Sedang = 0.5, Jarang = 1 (high risk)
  let nActivity = 0.5;
  if (data.activity === 'Sering') nActivity = 0.0;
  else if (data.activity === 'Sedang') nActivity = 0.5;
  else if (data.activity === 'Jarang') nActivity = 1.0;

  // Diet: Sehat = 0 (low risk), Cukup Sehat = 0.5, Kurang Sehat = 1 (high risk)
  let nDiet = 0.5;
  if (data.diet === 'Sehat') nDiet = 0.0;
  else if (data.diet === 'Cukup Sehat') nDiet = 0.5;
  else if (data.diet === 'Kurang Sehat') nDiet = 1.0;

  // History indicators (each 0 or 1)
  const hHypertension = data.history?.hypertension ? 1.0 : 0.0;
  const hDiabetes = data.history?.diabetes ? 1.0 : 0.0;
  const hHeartDisease = data.history?.heartDisease ? 1.0 : 0.0;

  // Total features = 16
  return [
    nAge,          // 0
    nGender,       // 1
    nHeight,       // 2
    nWeight,       // 3
    nBmi,          // 4
    nSystolic,     // 5
    nDiastolic,    // 6
    nCholesterol,  // 7
    nSugar,        // 8
    nHeartRate,    // 9
    nSmoke,        // 10
    nActivity,     // 11
    nDiet,         // 12
    hHypertension, // 13
    hDiabetes,     // 14
    hHeartDisease  // 15
  ];
}

/**
 * Returns feature names for visualization
 */
export const FeatureNames = [
  "Umur",
  "Jenis Kelamin",
  "Tinggi Badan",
  "Berat Badan",
  "BMI (IMT)",
  "Tekanan Darah (Sistolik)",
  "Tekanan Darah (Diastolik)",
  "Kolesterol Total",
  "Gula Darah",
  "Denyut Nadi",
  "Kebiasaan Merokok",
  "Aktivitas Fisik",
  "Pola Makan",
  "Riwayat Hipertensi Kel.",
  "Riwayat Diabetes Kel.",
  "Riwayat Jantung Kel."
];
