import { useState } from 'react';
import './ScreenshotConfig.css';

const ScreenshotConfig = ({ videoDuration, videoFileSize, onStartProcessing, isProcessing }) => {
  const [config, setConfig] = useState({
    interval: 5,
    format: 'png',
    quality: 0.92,
    startTime: 0,
    endTime: videoDuration || 0
  });

  const handleChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const processConfig = {
      interval: parseFloat(config.interval),
      format: config.format,
      quality: parseFloat(config.quality),
      startTime: parseFloat(config.startTime),
      endTime: parseFloat(config.endTime) || videoDuration
    };

    onStartProcessing(processConfig);
  };

  const estimatedFrames = Math.max(
    1,
    Math.floor((config.endTime - config.startTime) / config.interval)
  );

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="screenshot-config card">
      <div className="config-header">
        <h2>Configuración de Capturas</h2>
        {videoFileSize && (
          <div className="file-size-indicator">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M14 10V12.5C14 13.3 13.3 14 12.5 14H3.5C2.7 14 2 13.3 2 12.5V3.5C2 2.7 2.7 2 3.5 2H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <rect x="7" y="2" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            <span>Procesando localmente: <strong>{formatFileSize(videoFileSize)}</strong></span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="config-form">
        {/* Sección Básica */}
        <div className="config-section">
          <h3 className="section-title">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 5V8L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Configuración Básica
          </h3>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="interval">
                Intervalo entre capturas
                <span className="label-hint">segundos</span>
              </label>
              <input
                id="interval"
                type="number"
                min="0.5"
                max="60"
                step="0.5"
                value={config.interval}
                onChange={(e) => handleChange('interval', e.target.value)}
                disabled={isProcessing}
              />
            </div>

            <div className="form-group">
              <label htmlFor="startTime">
                Inicio
                <span className="label-hint">segundos</span>
              </label>
              <input
                id="startTime"
                type="number"
                min="0"
                max={videoDuration || 0}
                step="0.1"
                value={config.startTime}
                onChange={(e) => handleChange('startTime', e.target.value)}
                disabled={isProcessing}
              />
            </div>

            <div className="form-group">
              <label htmlFor="endTime">
                Fin
                <span className="label-hint">0 = hasta el final</span>
              </label>
              <input
                id="endTime"
                type="number"
                min="0"
                max={videoDuration || 0}
                step="0.1"
                value={config.endTime}
                onChange={(e) => handleChange('endTime', e.target.value)}
                disabled={isProcessing}
                placeholder={videoDuration?.toFixed(1) || '0'}
              />
            </div>
          </div>
        </div>

        {/* Sección Formato y Calidad */}
        <div className="config-section">
          <h3 className="section-title">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="6" cy="6" r="1.5" fill="currentColor"/>
              <path d="M14 10L11 7L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Formato y Calidad
          </h3>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="format">Formato de imagen</label>
              <select
                id="format"
                value={config.format}
                onChange={(e) => handleChange('format', e.target.value)}
                disabled={isProcessing}
              >
                <option value="png">PNG (sin pérdida, mejor calidad)</option>
                <option value="jpg">JPG (menor tamaño de archivo)</option>
              </select>
            </div>

            {config.format === 'jpg' && (
              <div className="form-group">
                <label htmlFor="quality">
                  Calidad JPG
                  <span className="label-hint">0.0 - 1.0 (mayor = mejor)</span>
                </label>
                <input
                  id="quality"
                  type="number"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={config.quality}
                  onChange={(e) => handleChange('quality', e.target.value)}
                  disabled={isProcessing}
                />
              </div>
            )}
          </div>
        </div>

        {/* Resumen */}
        <div className="config-summary">
          <div className="summary-item">
            <span className="summary-label">Capturas estimadas:</span>
            <span className="summary-value">{estimatedFrames}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Duración a procesar:</span>
            <span className="summary-value">
              {((config.endTime || videoDuration) - config.startTime).toFixed(1)}s
            </span>
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <span className="spinner-small"></span>
              Procesando...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8L7 12L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Generar Capturas
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default ScreenshotConfig;
