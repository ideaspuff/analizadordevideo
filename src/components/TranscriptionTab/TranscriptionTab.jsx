import { useState, useRef } from 'react';
import {
  WHISPER_MODELS,
  WHISPER_LANGUAGES,
  checkWhisperSupport,
  transcribeVideo,
  convertToSRT,
  convertToVTT,
  convertToText
} from '../../utils/audioTranscriber';
import { trackError } from '../../utils/errorTracking';
import './TranscriptionTab.css';

const TranscriptionTab = ({ videoFile }) => {
  const [config, setConfig] = useState({
    model: 'base',
    language: 'auto'
  });

  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [transcription, setTranscription] = useState(null);
  const [error, setError] = useState(null);

  const isWhisperSupported = checkWhisperSupport();

  const handleChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleStartTranscription = async () => {
    if (!videoFile) {
      setError('No hay video cargado');
      return;
    }

    if (!isWhisperSupported) {
      setError('Tu navegador no soporta Whisper Web. Necesitas un navegador moderno con soporte para SharedArrayBuffer.');
      return;
    }

    setProcessing(true);
    setProgress(0);
    setCurrentStep('Iniciando transcripción...');
    setError(null);
    setTranscription(null);

    try {
      const result = await transcribeVideo(videoFile, {
        model: config.model,
        language: config.language,
        onProgress: (info) => {
          setProgress(Math.round(info.progress));
          setCurrentStep(info.message);
        }
      });

      setTranscription(result);
      setProgress(100);
      setCurrentStep('¡Transcripción completada!');

      setTimeout(() => {
        setProcessing(false);
      }, 1000);

    } catch (err) {
      console.error('[TranscriptionTab] Error:', err);

      trackError('TranscriptionTab', 'transcribeVideo', err, {
        videoFileName: videoFile.name,
        model: config.model,
        language: config.language
      });

      setError(err.message);
      setProcessing(false);
      setCurrentStep('');
    }
  };

  const handleDownload = (format) => {
    if (!transcription || !transcription.segments) return;

    let content, mimeType, extension;

    switch (format) {
      case 'srt':
        content = convertToSRT(transcription.segments);
        mimeType = 'text/plain';
        extension = 'srt';
        break;
      case 'vtt':
        content = convertToVTT(transcription.segments);
        mimeType = 'text/vtt';
        extension = 'vtt';
        break;
      case 'txt':
        content = convertToText(transcription.segments);
        mimeType = 'text/plain';
        extension = 'txt';
        break;
      default:
        return;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcription.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!videoFile) {
    return (
      <div className="transcription-tab">
        <div className="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="12" y1="19" x2="12" y2="23" strokeWidth="2" strokeLinecap="round"/>
            <line x1="8" y1="23" x2="16" y2="23" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <h3>No hay video cargado</h3>
          <p>Carga un video para comenzar la transcripción de audio</p>
        </div>
      </div>
    );
  }

  return (
    <div className="transcription-tab">
      <div className="transcription-header">
        <h2>Transcripción de Audio</h2>
        {!isWhisperSupported && (
          <div className="warning-badge">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1L1 14h14L8 1zm0 3.5l4.5 8h-9L8 4.5z"/>
              <path d="M7.5 9h1v3h-1V9zm0-2h1v1h-1V7z"/>
            </svg>
            Navegador no compatible
          </div>
        )}
      </div>

      {/* Configuración */}
      <div className="config-card card">
        <h3 className="section-title">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M8 5V8L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Configuración
        </h3>

        <div className="config-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="model">Modelo de Whisper</label>
              <select
                id="model"
                value={config.model}
                onChange={(e) => handleChange('model', e.target.value)}
                disabled={processing}
              >
                {Object.entries(WHISPER_MODELS).map(([key, info]) => (
                  <option key={key} value={key}>
                    {key} - {info.quality} ({info.size}, {info.speed})
                  </option>
                ))}
              </select>
              <span className="hint">Modelos más grandes son más precisos pero más lentos</span>
            </div>

            <div className="form-group">
              <label htmlFor="language">Idioma del audio</label>
              <select
                id="language"
                value={config.language}
                onChange={(e) => handleChange('language', e.target.value)}
                disabled={processing}
              >
                {Object.entries(WHISPER_LANGUAGES).map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
              <span className="hint">Selecciona el idioma del audio o deja en automático</span>
            </div>
          </div>

          <button
            className="btn-primary"
            onClick={handleStartTranscription}
            disabled={processing || !isWhisperSupported}
          >
            {processing ? (
              <>
                <span className="spinner-small"></span>
                Procesando...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8L7 12L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Iniciar Transcripción
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progreso */}
      {processing && (
        <div className="progress-card card">
          <h3>{currentStep}</h3>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="progress-text">{progress}%</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="error-card card">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth="2"/>
            <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" strokeLinecap="round"/>
            <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <div>
            <h3>Error en la transcripción</h3>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Resultado */}
      {transcription && transcription.segments && (
        <div className="result-card card">
          <div className="result-header">
            <h3>Transcripción Completada</h3>
            <div className="download-buttons">
              <button className="btn-download" onClick={() => handleDownload('srt')}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 12L3 7h3V2h4v5h3L8 12z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 14h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Descargar SRT
              </button>
              <button className="btn-download" onClick={() => handleDownload('vtt')}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 12L3 7h3V2h4v5h3L8 12z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 14h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Descargar VTT
              </button>
              <button className="btn-download" onClick={() => handleDownload('txt')}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 12L3 7h3V2h4v5h3L8 12z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 14h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Descargar TXT
              </button>
            </div>
          </div>

          <div className="transcription-text">
            {transcription.segments.map((segment, index) => (
              <div key={index} className="transcript-segment">
                <span className="segment-time">
                  {formatTime(segment.start)} - {formatTime(segment.end)}
                </span>
                <p className="segment-text">{segment.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default TranscriptionTab;
