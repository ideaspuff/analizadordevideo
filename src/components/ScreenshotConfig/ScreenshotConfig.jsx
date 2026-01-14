import { useState } from 'react';
import './ScreenshotConfig.css';

const ScreenshotConfig = ({ videoDuration, onStartProcessing, isProcessing }) => {
  const [config, setConfig] = useState({
    interval: 5,
    format: 'png',
    quality: 2,
    scale: 'original',
    startTime: 0,
    duration: videoDuration || 0
  });

  const handleChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const processConfig = {
      interval: parseInt(config.interval),
      format: config.format,
      quality: parseInt(config.quality),
      scale: config.scale === 'original' ? null : config.scale,
      startTime: parseFloat(config.startTime),
      duration: config.duration > 0 ? parseFloat(config.duration) : null
    };

    onStartProcessing(processConfig);
  };

  const estimatedFrames = Math.floor(
    (config.duration - config.startTime) / config.interval
  );

  return (
    <div className="screenshot-config card">
      <h2>Configuración de Capturas</h2>
      <form onSubmit={handleSubmit} className="config-form">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="interval">
              Intervalo entre capturas (segundos)
            </label>
            <input
              id="interval"
              type="number"
              min="1"
              max="60"
              value={config.interval}
              onChange={(e) => handleChange('interval', e.target.value)}
              disabled={isProcessing}
            />
          </div>

          <div className="form-group">
            <label htmlFor="format">
              Formato de imagen
            </label>
            <select
              id="format"
              value={config.format}
              onChange={(e) => handleChange('format', e.target.value)}
              disabled={isProcessing}
            >
              <option value="png">PNG (mejor calidad)</option>
              <option value="jpg">JPG (menor tamaño)</option>
            </select>
          </div>

          {config.format === 'jpg' && (
            <div className="form-group">
              <label htmlFor="quality">
                Calidad JPG (1-31, menor = mejor)
              </label>
              <input
                id="quality"
                type="number"
                min="1"
                max="31"
                value={config.quality}
                onChange={(e) => handleChange('quality', e.target.value)}
                disabled={isProcessing}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="scale">
              Escala de salida
            </label>
            <select
              id="scale"
              value={config.scale}
              onChange={(e) => handleChange('scale', e.target.value)}
              disabled={isProcessing}
            >
              <option value="original">Original</option>
              <option value="1920:-1">1920px de ancho (Full HD)</option>
              <option value="1280:-1">1280px de ancho (HD)</option>
              <option value="854:-1">854px de ancho (SD)</option>
              <option value="640:-1">640px de ancho (Mobile)</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="startTime">
              Tiempo de inicio (segundos)
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
            <label htmlFor="duration">
              Duración a procesar (segundos, 0 = todo)
            </label>
            <input
              id="duration"
              type="number"
              min="0"
              max={videoDuration || 0}
              step="0.1"
              value={config.duration}
              onChange={(e) => handleChange('duration', e.target.value)}
              disabled={isProcessing}
            />
          </div>
        </div>

        <div className="config-summary">
          <p>Capturas estimadas: <strong>{estimatedFrames}</strong></p>
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={isProcessing}
        >
          {isProcessing ? 'Procesando...' : 'Generar Capturas'}
        </button>
      </form>
    </div>
  );
};

export default ScreenshotConfig;
