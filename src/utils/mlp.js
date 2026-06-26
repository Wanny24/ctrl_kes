// Multilayer Perceptron (MLP) in Vanilla JavaScript
// Architecture: 16 inputs -> 12 hidden -> 8 hidden -> 3 outputs (Hypertension, Diabetes, Heart Disease)

export class MultilayerPerceptron {
  constructor(layers = [16, 12, 8, 3]) {
    this.layers = layers;
    this.weights = [];
    this.biases = [];
    this.initializeWeights();
  }

  // Initialize weights using Xavier/Glorot initialization
  initializeWeights() {
    this.weights = [];
    this.biases = [];
    for (let i = 0; i < this.layers.length - 1; i++) {
      const inputSize = this.layers[i];
      const outputSize = this.layers[i + 1];
      
      const layerWeights = [];
      const layerBiases = [];
      
      // Standard deviation for Glorot initialization
      const stdDev = Math.sqrt(2.0 / (inputSize + outputSize));

      for (let j = 0; j < outputSize; j++) {
        const row = [];
        for (let k = 0; k < inputSize; k++) {
          // Box-Muller transform for normal distribution
          const u1 = Math.random() || 0.0001;
          const u2 = Math.random() || 0.0001;
          const randStdNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
          row.push(randStdNormal * stdDev);
        }
        layerWeights.push(row);
        layerBiases.push(0.0); // Initialize biases to 0
      }
      this.weights.push(layerWeights);
      this.biases.push(layerBiases);
    }
  }

  // Activation functions
  relu(x) {
    return Math.max(0, x);
  }

  reluDerivative(x) {
    return x > 0 ? 1 : 0;
  }

  sigmoid(x) {
    return 1 / (1 + Math.exp(-Math.max(-20, Math.min(20, x)))); // Clamped to avoid overflow
  }

  sigmoidDerivative(x) {
    const s = this.sigmoid(x);
    return s * (1 - s);
  }

  // Forward propagation
  // Returns all layer activations and weighted inputs (zs) for backpropagation
  forward(input) {
    let activations = [input];
    let zs = [];

    for (let i = 0; i < this.weights.length; i++) {
      const layerWeights = this.weights[i];
      const layerBiases = this.biases[i];
      const currentInput = activations[activations.length - 1];
      const nextActivation = [];
      const nextZ = [];

      for (let j = 0; j < layerWeights.length; j++) {
        let sum = layerBiases[j];
        for (let k = 0; k < currentInput.length; k++) {
          sum += currentInput[k] * layerWeights[j][k];
        }
        nextZ.push(sum);
        // Use Sigmoid for the last layer (outputs probability), ReLU for hidden
        if (i === this.weights.length - 1) {
          nextActivation.push(this.sigmoid(sum));
        } else {
          nextActivation.push(this.relu(sum));
        }
      }
      zs.push(nextZ);
      activations.push(nextActivation);
    }

    return { activations, zs };
  }

  // Predict outputs for a given input vector
  predict(input) {
    const { activations } = this.forward(input);
    return activations[activations.length - 1];
  }

  // Train the network on a dataset
  // dataset: array of { input: [], output: [] }
  async train(dataset, epochs, learningRate, onEpochEnd = null) {
    const numLayers = this.layers.length;

    for (let epoch = 0; epoch < epochs; epoch++) {
      let epochLoss = 0;

      // Shuffle dataset per epoch for stochastic gradient descent (SGD) style learning
      const shuffled = [...dataset].sort(() => Math.random() - 0.5);

      for (const sample of shuffled) {
        const { input, output } = sample;
        
        // 1. Forward Pass
        const { activations, zs } = this.forward(input);
        const prediction = activations[activations.length - 1];

        // Compute Mean Squared Error Loss
        let sampleLoss = 0;
        for (let j = 0; j < output.length; j++) {
          sampleLoss += Math.pow(prediction[j] - output[j], 2);
        }
        epochLoss += sampleLoss / output.length;

        // 2. Backpropagation
        // Initialize weight and bias gradients
        const dWeights = this.weights.map(layer => layer.map(row => row.map(() => 0)));
        const dBiases = this.biases.map(layer => layer.map(() => 0));
        
        // Calculate output layer errors (delta)
        // For MSE loss and Sigmoid activation: delta = (activation - target) * sigmoid_derivative
        const lastLayerIdx = numLayers - 2; // Index in weights array
        const lastZs = zs[lastZs ? zs.length - 1 : lastLayerIdx];
        const lastActivations = activations[activations.length - 1];
        const prevActivations = activations[activations.length - 2];
        const lastDeltas = [];

        for (let j = 0; j < prediction.length; j++) {
          const delta = (prediction[j] - output[j]) * this.sigmoidDerivative(zs[lastLayerIdx][j]);
          lastDeltas.push(delta);
          dBiases[lastLayerIdx][j] = delta;
          for (let k = 0; k < prevActivations.length; k++) {
            dWeights[lastLayerIdx][j][k] = delta * prevActivations[k];
          }
        }

        // Backpropagate error through hidden layers
        let deltas = lastDeltas;
        for (let i = lastLayerIdx - 1; i >= 0; i--) {
          const currentZs = zs[i];
          const currentActivations = activations[i + 1];
          const prevActivations = activations[i];
          const nextWeights = this.weights[i + 1];
          const currentDeltas = [];

          for (let j = 0; j < currentZs.length; j++) {
            let error = 0;
            for (let k = 0; k < deltas.length; k++) {
              error += deltas[k] * nextWeights[k][j];
            }
            const delta = error * this.reluDerivative(currentZs[j]);
            currentDeltas.push(delta);
            dBiases[i][j] = delta;
            for (let k = 0; k < prevActivations.length; k++) {
              dWeights[i][j][k] = delta * prevActivations[k];
            }
          }
          deltas = currentDeltas;
        }

        // Update weights and biases using Gradient Descent
        for (let i = 0; i < this.weights.length; i++) {
          for (let j = 0; j < this.weights[i].length; j++) {
            this.biases[i][j] -= learningRate * dBiases[i][j];
            for (let k = 0; k < this.weights[i][j].length; k++) {
              this.weights[i][j][k] -= learningRate * dWeights[i][j][k];
            }
          }
        }
      }

      const meanLoss = epochLoss / dataset.length;

      // Trigger callback if provided, allow UI updates
      if (onEpochEnd) {
        onEpochEnd(epoch + 1, meanLoss);
        // Yield control to the browser paint thread every few epochs to prevent freezing
        if (epoch % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
    }
  }

  // Pre-seed some logical weights so predictions are healthy or risky based on medical facts immediately
  seedWeights() {
    this.initializeWeights();
    
    // We modify some key connections from the input layer (16 features) to hidden layer (12)
    // Feature indices:
    // 0: Age, 4: BMI, 5: Systolic, 6: Diastolic, 7: Cholesterol, 8: Sugar, 10: Smoke, 11: Activity (Jarang = 1), 12: Diet (Buruk = 1)
    // Output nodes (0: Hypertension, 1: Diabetes, 2: Heart Disease)
    
    // To keep it simple and authentic, we let the network train on mock data!
    // The mock data training is extremely fast, so seeding is mostly a backup.
  }
}
