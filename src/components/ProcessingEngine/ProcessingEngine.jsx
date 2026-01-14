import { useState, useImperativeHandle, forwardRef } from 'react';
import { extractFrames } from '../../utils/videoFrameExtractor';
import { trackError } from '../../utils/errorTracking';
import './ProcessingEngine.css';

const ProcessingEngine = forwardRef(({ videoFile, config, onComplete, onError }, ref) => {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');

  const startProcessing = async () => {
    if (!videoFile) {
      onError?.('No hay video cargado');
      return;
    }

    setProcessing(true);
    setProgress(0);
    setCurrentStep('Iniciando extracción de frames...');

    try {
      setCurrentStep('Extrayendo frames del video...');

      const screenshots = await extractFrames(
        videoFile,
        config,
        (progressValue) => {
          setProgress(progressValue);
        }
      );

      setProgress(100);
      setCurrentStep('¡Extracción completada!');

      setTimeout(() => {
        onComplete?.(screenshots);
        setProcessing(false);
      }, 500);

    } catch (error) {
      console.error('[ProcessingEngine] Error:', error);

      trackError('ProcessingEngine', 'extractFrames', error, {
        videoFileName: videoFile.name,
        videoSize: videoFile.size,
        config
      });

      setCurrentStep('Error durante el procesamiento');
      onError?.(error.message);
      setProcessing(false);
    }
  };

  useImperativeHandle(ref, () => ({
    startProcessing
  }));

  return (
    <div className="processing-engine">
      {processing && (
        <div className="processing-overlay">
          <div className="processing-modal">
            <div className="spinner"></div>
            <h3>{currentStep}</h3>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="progress-text">{progress}%</p>
          </div>
        </div>
      )}
    </div>
  );
});

ProcessingEngine.displayName = 'ProcessingEngine';

export default ProcessingEngine;
