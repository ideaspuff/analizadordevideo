import { useState, useImperativeHandle, forwardRef } from 'react';
import { extractFrames } from '../../utils/ffmpegHelpers';
import './ProcessingEngine.css';

const ProcessingEngine = forwardRef(({ ffmpeg, videoFile, config, onComplete, onError }, ref) => {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');

  const startProcessing = async () => {
    if (!ffmpeg || !videoFile) {
      onError?.('FFmpeg no está cargado o no hay video');
      return;
    }

    setProcessing(true);
    setProgress(0);
    setCurrentStep('Iniciando procesamiento...');

    try {
      setCurrentStep('Extrayendo frames del video...');
      setProgress(20);

      const screenshots = await extractFrames(ffmpeg, videoFile, config);

      setProgress(100);
      setCurrentStep('¡Procesamiento completado!');

      setTimeout(() => {
        onComplete?.(screenshots);
        setProcessing(false);
      }, 500);

    } catch (error) {
      console.error('Error during processing:', error);
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
