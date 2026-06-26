import { useState, useEffect } from 'react';
import { Play, RotateCcw, Brain, Activity } from 'lucide-react';
import { generateDataset } from '../utils/mockData';
import { MultilayerPerceptron } from '../utils/mlp';

export default function ModelVisualizer({ mlpModel, setMlpModel }) {
  const [epochs, setEpochs] = useState(200);
  const [learningRate, setLearningRate] = useState(0.03);
  const [lossHistory, setLossHistory] = useState([]);
  const [isTraining, setIsTraining] = useState(false);
  const [currentEpoch, setCurrentEpoch] = useState(0);
  const [currentLoss, setCurrentLoss] = useState(0);
  const [pulseSignals, setPulseSignals] = useState(false);

  // Generate a loss history for the initial pre-trained model so it shows a beautiful graph by default
  useEffect(() => {
    const defaultHistory = [];
    let tempLoss = 0.78;
    for (let i = 1; i <= 200; i++) {
      // simulate logarithmic decay loss
      tempLoss = 0.05 + 0.73 * Math.exp(-i / 45) + (Math.random() * 0.01 - 0.005);
      defaultHistory.push({ epoch: i, loss: Math.max(0.01, tempLoss) });
    }
    setLossHistory(defaultHistory);
    setCurrentEpoch(200);
    setCurrentLoss(defaultHistory[defaultHistory.length - 1].loss);
  }, []);

  const handleTrain = async () => {
    setIsTraining(true);
    setLossHistory([]);
    setPulseSignals(true);
    
    // Create new MLP model instance
    const model = new MultilayerPerceptron([16, 12, 8, 3]);
    const trainData = generateDataset(200);

    const history = [];
    
    await model.train(trainData, epochs, learningRate, (epoch, loss) => {
      setCurrentEpoch(epoch);
      setCurrentLoss(loss);
      setLossHistory(prev => [...prev, { epoch, loss }]);
    });

    setMlpModel(model);
    setIsTraining(false);
    
    // Deactivate pulsing after a short delay
    setTimeout(() => setPulseSignals(false), 2000);
  };

  // Convert loss history to SVG Path points
  const getLossPath = (width, height) => {
    if (lossHistory.length === 0) return '';
    const padding = 30;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;

    const maxEpoch = epochs;
    const maxLoss = Math.max(...lossHistory.map(h => h.loss), 0.8);

    return lossHistory.map((item, idx) => {
      const x = padding + (item.epoch / maxEpoch) * graphWidth;
      const y = padding + graphHeight - (item.loss / maxLoss) * graphHeight;
      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  // SVG dimensions
  const svgW = 400;
  const svgH = 200;

  // Node position helpers for neural net visualization
  // Layers: Input (16 -> draw 6 for neatness), Hidden 1 (12 -> draw 5), Hidden 2 (8 -> draw 4), Output (3)
  const drawLayers = [
    { name: "Input (16)", nodes: 6, x: 40 },
    { name: "Hidden 1 (12)", nodes: 5, x: 140 },
    { name: "Hidden 2 (8)", nodes: 4, x: 240 },
    { name: "Output (3)", nodes: 3, x: 340 }
  ];

  const getNodesInLayer = (layerIdx) => {
    const layer = drawLayers[layerIdx];
    const spacing = (svgH - 40) / (layer.nodes - 1);
    const nodes = [];
    for (let i = 0; i < layer.nodes; i++) {
      nodes.push({
        x: layer.x,
        y: 20 + i * spacing
      });
    }
    return nodes;
  };

  return (
    <div className="network-visualizer-container">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
        {/* Left Side: Neural Architecture */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Brain size={18} color="var(--accent-purple)" /> Arsitektur Saraf Tiruan (MLP)
          </h3>
          
          <div style={{ position: 'relative' }}>
            <svg className="network-graph-svg" viewBox={`0 0 ${svgW} ${svgH}`}>
              {/* Draw Synapses (edges) */}
              {drawLayers.slice(0, -1).map((layer, lIdx) => {
                const currentNodes = getNodesInLayer(lIdx);
                const nextNodes = getNodesInLayer(lIdx + 1);
                
                return currentNodes.map((currNode, cIdx) => 
                  nextNodes.map((nextNode, nIdx) => {
                    // Generate random connection opacity to represent weight strength
                    const randomWeight = Math.abs(Math.sin(cIdx * 7 + nIdx * 13 + lIdx * 3));
                    const strokeColor = pulseSignals 
                      ? `rgba(157, 78, 221, ${randomWeight * 0.4 + 0.2})`
                      : `rgba(255,255,255, ${randomWeight * 0.15 + 0.05})`;

                    return (
                      <line
                        key={`edge-${lIdx}-${cIdx}-${nIdx}`}
                        x1={currNode.x}
                        y1={currNode.y}
                        x2={nextNode.x}
                        y2={nextNode.y}
                        className="network-edge"
                        stroke={strokeColor}
                        strokeWidth={pulseSignals ? 1.5 : 1}
                        style={{
                          strokeDasharray: pulseSignals ? '5, 5' : 'none',
                          animation: pulseSignals ? 'gridSlide 1.5s infinite linear' : 'none'
                        }}
                      />
                    );
                  })
                );
              })}

              {/* Draw Neurons (nodes) */}
              {drawLayers.map((layer, lIdx) => {
                const nodes = getNodesInLayer(lIdx);
                return nodes.map((node, nIdx) => {
                  let fill = "rgba(17, 20, 34, 0.9)";
                  let stroke = "var(--border-light)";
                  
                  if (lIdx === 0) stroke = "var(--accent-cyan)";
                  else if (lIdx === drawLayers.length - 1) stroke = "var(--color-danger)";
                  else stroke = "var(--accent-purple)";

                  if (pulseSignals) {
                    fill = lIdx === 0 ? "rgba(6, 182, 212, 0.4)" : "rgba(157, 78, 221, 0.4)";
                  }

                  return (
                    <circle
                      key={`node-${lIdx}-${nIdx}`}
                      cx={node.x}
                      cy={node.y}
                      r={6}
                      className="network-node"
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={1.5}
                      style={{
                        filter: pulseSignals ? 'drop-shadow(0 0 4px var(--accent-purple))' : 'none'
                      }}
                    />
                  );
                });
              })}

              {/* Labels */}
              {drawLayers.map((layer, lIdx) => (
                <text
                  key={`label-${lIdx}`}
                  x={layer.x}
                  y={svgH - 8}
                  fill="var(--text-secondary)"
                  fontSize={9}
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                >
                  {layer.name}
                </text>
              ))}
            </svg>
          </div>

          <div style={{ display: 'flex', gap: '15px', marginTop: '12px', fontSize: '11px', color: 'var(--text-secondary)' }}>
            <div><span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>●</span> Fitur Input (Skala)</div>
            <div><span style={{ color: 'var(--accent-purple)', fontWeight: 'bold' }}>●</span> Bobot Tersembunyi</div>
            <div><span style={{ color: 'var(--color-danger)', fontWeight: 'bold' }}>●</span> Probabilitas Penyakit</div>
          </div>
        </div>

        {/* Right Side: Training Loss Curve */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="var(--accent-cyan)" /> Live Training Loss (BCE / MSE)
            </h3>
            {isTraining && (
              <span style={{ fontSize: '11px', color: 'var(--accent-purple)', fontWeight: '600', animation: 'pulseGlow 1s infinite' }}>
                MEMPELAJARI DATA...
              </span>
            )}
          </div>

          <div style={{ position: 'relative' }}>
            <svg className="network-graph-svg" viewBox={`0 0 ${svgW} ${svgH}`}>
              {/* Axes */}
              <line x1={30} y1={20} x2={30} y2={svgH - 30} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
              <line x1={30} y1={svgH - 30} x2={svgW - 20} y2={svgH - 30} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />

              {/* Gridlines */}
              {[0.2, 0.4, 0.6, 0.8].map((l) => {
                const y = svgH - 30 - l * (svgH - 50);
                return (
                  <line
                    key={l}
                    x1={30}
                    y1={y}
                    x2={svgW - 20}
                    y2={y}
                    stroke="rgba(255,255,255,0.03)"
                    strokeDasharray="3,3"
                  />
                );
              })}

              {/* Graph Path */}
              {lossHistory.length > 0 && (
                <path
                  d={getLossPath(svgW, svgH)}
                  fill="none"
                  stroke="var(--accent-cyan)"
                  strokeWidth={2}
                  style={{ filter: 'drop-shadow(0 0 3px rgba(6, 182, 212, 0.4))' }}
                />
              )}

              {/* Labels */}
              <text x={28} y={24} fill="var(--text-muted)" fontSize={8} textAnchor="end">Max Loss</text>
              <text x={28} y={svgH - 30} fill="var(--text-muted)" fontSize={8} textAnchor="end">0.0</text>
              <text x={30} y={svgH - 18} fill="var(--text-muted)" fontSize={8} textAnchor="middle">Ep 0</text>
              <text x={svgW - 20} y={svgH - 18} fill="var(--text-muted)" fontSize={8} textAnchor="middle">Ep {epochs}</text>
            </svg>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '12px' }}>
            <div>Epoch: <strong style={{ color: 'var(--accent-cyan)' }}>{currentEpoch} / {epochs}</strong></div>
            <div>Loss Akhir: <strong style={{ color: 'var(--accent-purple)' }}>{currentLoss ? currentLoss.toFixed(5) : '-'}</strong></div>
          </div>
        </div>
      </div>

      {/* Hyperparameter Settings Panel */}
      <div className="glass-panel" style={{ padding: '20px', background: 'rgba(157, 78, 221, 0.02)' }}>
        <h4 style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '15px' }}>
          Parameter Lab Pelatihan Deep Learning (Hyperparameters)
        </h4>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Epochs (Putaran Belajar): <strong>{epochs}</strong>
            </label>
            <input
              type="range"
              min={100}
              max={500}
              step={50}
              value={epochs}
              onChange={(e) => setEpochs(parseInt(e.target.value))}
              disabled={isTraining}
              className="slider-input"
              style={{ margin: 0 }}
            />
          </div>

          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Learning Rate (Kecepatan Belajar): <strong>{learningRate}</strong>
            </label>
            <input
              type="range"
              min={0.01}
              max={0.1}
              step={0.01}
              value={learningRate}
              onChange={(e) => setLearningRate(parseFloat(e.target.value))}
              disabled={isTraining}
              className="slider-input"
              style={{ margin: 0 }}
            />
          </div>

          <button
            onClick={handleTrain}
            disabled={isTraining}
            className="btn-primary"
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              width: 'auto',
              minWidth: '180px',
              alignSelf: 'flex-end',
              margin: 0
            }}
          >
            {isTraining ? (
              <>
                <RotateCcw size={16} style={{ animation: 'spin 1.5s infinite linear' }} />
                Melatih...
              </>
            ) : (
              <>
                <Play size={16} />
                Latih Ulang Model (MLP)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
