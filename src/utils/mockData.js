import { preprocessInput } from './preprocessor.js';

/**
 * Dynamically generates a high-quality synthetic patient dataset for MLP training.
 * Returns an array of { raw: {}, input: [], output: [] }
 * 
 * Target outputs:
 * 0: Hypertension Risk (0.0 to 1.0)
 * 1: Diabetes Risk (0.0 to 1.0)
 * 2: Heart Disease Risk (0.0 to 1.0)
 */
export function generateDataset(size = 300) {
  const dataset = [];

  for (let i = 0; i < size; i++) {
    // Generate features based on clusters to simulate medical correlations
    const age = Math.round(18 + Math.random() * 70); // 18 to 88
    const gender = Math.random() > 0.5 ? 'Laki-laki' : 'Perempuan';
    const height = gender === 'Laki-laki' 
      ? Math.round(155 + Math.random() * 30) // 155 - 185
      : Math.round(145 + Math.random() * 30); // 145 - 175
    
    let bmiCategory = 'Normal'; // Normal, Overweight, Obese, Underweight
    const rand = Math.random();
    if (rand < 0.1) bmiCategory = 'Underweight';
    else if (rand < 0.5) bmiCategory = 'Normal';
    else if (rand < 0.8) bmiCategory = 'Overweight';
    else bmiCategory = 'Obese';

    let weight = 70;
    const heightM = height / 100;
    if (bmiCategory === 'Underweight') weight = Math.round(16 * heightM * heightM + Math.random() * 5);
    else if (bmiCategory === 'Normal') weight = Math.round(20 * heightM * heightM + Math.random() * 10);
    else if (bmiCategory === 'Overweight') weight = Math.round(26 * heightM * heightM + Math.random() * 10);
    else weight = Math.round(32 * heightM * heightM + Math.random() * 20);

    const bmi = weight / (heightM * heightM);

    // Activity & Diet & Smoking
    const activity = Math.random() > 0.6 ? 'Sering' : Math.random() > 0.4 ? 'Sedang' : 'Jarang';
    const diet = Math.random() > 0.6 ? 'Sehat' : Math.random() > 0.3 ? 'Cukup Sehat' : 'Kurang Sehat';
    const smoke = Math.random() > 0.7 ? 'Ya' : 'Tidak';

    // Family history
    const history = {
      hypertension: Math.random() > 0.8,
      diabetes: Math.random() > 0.8,
      heartDisease: Math.random() > 0.85
    };

    // Correlated health metrics
    let systolic = 120;
    let diastolic = 80;
    let cholesterol = 190;
    let sugar = 95;
    let heartRate = 72;

    // Output probabilities
    let hypertensionRisk = 0.1;
    let diabetesRisk = 0.1;
    let heartDiseaseRisk = 0.1;

    // Cluster 1: Healthy Young profile
    if (age < 35 && bmiCategory === 'Normal' && activity !== 'Jarang' && diet === 'Sehat' && smoke === 'Tidak') {
      systolic = Math.round(105 + Math.random() * 15);
      diastolic = Math.round(70 + Math.random() * 10);
      cholesterol = Math.round(130 + Math.random() * 50);
      sugar = Math.round(75 + Math.random() * 20);
      heartRate = Math.round(60 + Math.random() * 15);
      
      hypertensionRisk = 0.05 + Math.random() * 0.1;
      diabetesRisk = 0.05 + Math.random() * 0.1;
      heartDiseaseRisk = 0.05 + Math.random() * 0.1;
    } 
    // Cluster 2: Hypertensive Profile (High Blood Pressure)
    else if (age > 45 && (bmiCategory === 'Obese' || bmiCategory === 'Overweight') && smoke === 'Ya') {
      systolic = Math.round(140 + Math.random() * 40);
      diastolic = Math.round(90 + Math.random() * 20);
      cholesterol = Math.round(210 + Math.random() * 80);
      sugar = Math.round(100 + Math.random() * 40);
      heartRate = Math.round(75 + Math.random() * 20);

      hypertensionRisk = 0.75 + Math.random() * 0.2;
      diabetesRisk = 0.35 + Math.random() * 0.3;
      heartDiseaseRisk = 0.60 + Math.random() * 0.3;
    }
    // Cluster 3: Diabetic Profile (High Blood Sugar)
    else if (bmiCategory === 'Obese' && diet === 'Kurang Sehat' && activity === 'Jarang') {
      systolic = Math.round(120 + Math.random() * 30);
      diastolic = Math.round(80 + Math.random() * 15);
      cholesterol = Math.round(200 + Math.random() * 70);
      sugar = Math.round(140 + Math.random() * 100);
      heartRate = Math.round(70 + Math.random() * 20);

      hypertensionRisk = 0.40 + Math.random() * 0.3;
      diabetesRisk = 0.80 + Math.random() * 0.18;
      heartDiseaseRisk = 0.50 + Math.random() * 0.25;
    }
    // Cluster 4: High Cardiovascular Risk Profile (Elderly, high cholesterol, history)
    else if (age > 60 || history.heartDisease || (cholesterol > 250 && systolic > 140)) {
      systolic = Math.round(130 + Math.random() * 35);
      diastolic = Math.round(85 + Math.random() * 15);
      cholesterol = Math.round(230 + Math.random() * 90);
      sugar = Math.round(110 + Math.random() * 50);
      heartRate = Math.round(70 + Math.random() * 25);

      hypertensionRisk = 0.60 + Math.random() * 0.3;
      diabetesRisk = 0.40 + Math.random() * 0.3;
      heartDiseaseRisk = 0.75 + Math.random() * 0.2;
    }
    // Cluster 5: Average / Mixed Profile
    default_branch: {
      if (systolic === 120) { // If it wasn't caught by the special blocks
        systolic = Math.round(115 + Math.random() * 20);
        diastolic = Math.round(75 + Math.random() * 12);
        cholesterol = Math.round(160 + Math.random() * 60);
        sugar = Math.round(85 + Math.random() * 35);
        heartRate = Math.round(65 + Math.random() * 15);

        // Calculate risks using a simple logical linear heuristic + noise
        const ageScore = age / 80;
        const bmiScore = bmi / 35;
        const bpScore = (systolic + diastolic * 1.5) / 300;
        const cholScore = cholesterol / 300;
        const sugarScore = sugar / 200;
        const smokeScore = smoke === 'Ya' ? 0.3 : 0.0;
        const activeScore = activity === 'Jarang' ? 0.15 : activity === 'Sering' ? -0.1 : 0;
        const dietScore = diet === 'Kurang Sehat' ? 0.15 : diet === 'Sehat' ? -0.1 : 0;

        hypertensionRisk = Math.max(0.05, Math.min(0.95, bpScore * 0.5 + ageScore * 0.2 + bmiScore * 0.15 + (history.hypertension ? 0.2 : 0) + (Math.random() * 0.1 - 0.05)));
        diabetesRisk = Math.max(0.05, Math.min(0.95, sugarScore * 0.5 + bmiScore * 0.3 + dietScore * 0.1 + (history.diabetes ? 0.2 : 0) + (Math.random() * 0.1 - 0.05)));
        heartDiseaseRisk = Math.max(0.05, Math.min(0.95, cholScore * 0.3 + bpScore * 0.25 + ageScore * 0.2 + smokeScore + activeScore + (history.heartDisease ? 0.2 : 0) + (Math.random() * 0.1 - 0.05)));
      }
    }

    const raw = {
      age,
      gender,
      height,
      weight,
      systolic,
      diastolic,
      cholesterol,
      sugar,
      heartRate,
      smoke,
      activity,
      diet,
      history
    };

    const input = preprocessInput(raw);
    const output = [hypertensionRisk, diabetesRisk, heartDiseaseRisk];

    dataset.push({ raw, input, output });
  }

  return dataset;
}

// Fixed validation samples that correspond to standard user examples to ensure perfect calibration
export const ValidationSamples = [
  {
    // The user's example profile: Age 45, Male, 85kg, 168cm, BP 150/95, Chol 245, Sugar 125, smoker, sedentary
    raw: {
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
      history: { hypertension: true, diabetes: false, heartDisease: false }
    },
    output: [0.92, 0.71, 0.65] // Expected Hypertension 92%, Diabetes 71%, Heart Disease 65%
  }
];
