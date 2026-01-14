import { useState } from 'react';
import { downloadImage, downloadAllAsZip } from '../../utils/downloadHelpers';
import './ScreenshotGallery.css';

const formatTimestamp = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
};

const ScreenshotGallery = ({ screenshots, onClear }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadAll = async () => {
    setDownloading(true);
    try {
      await downloadAllAsZip(screenshots, 'video-screenshots.zip');
    } catch (error) {
      console.error('Error downloading zip:', error);
      alert('Error al descargar el archivo ZIP');
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadSingle = (screenshot) => {
    downloadImage(screenshot.url, screenshot.fileName);
  };

  if (!screenshots || screenshots.length === 0) {
    return null;
  }

  return (
    <div className="screenshot-gallery card">
      <div className="gallery-header">
        <h2>Capturas Generadas ({screenshots.length})</h2>
        <div className="gallery-actions">
          <button
            onClick={handleDownloadAll}
            disabled={downloading}
            className="btn-download"
          >
            {downloading ? 'Descargando...' : 'Descargar Todo (ZIP)'}
          </button>
          <button
            onClick={onClear}
            className="btn-clear"
          >
            Limpiar
          </button>
        </div>
      </div>

      <div className="gallery-grid">
        {screenshots.map((screenshot) => (
          <div key={screenshot.id} className="gallery-item">
            <div
              className="image-wrapper"
              onClick={() => setSelectedImage(screenshot)}
            >
              <img
                src={screenshot.url}
                alt={`Frame at ${formatTimestamp(screenshot.timestamp)}`}
                loading="lazy"
              />
              <div className="image-overlay">
                <span className="timestamp">
                  {formatTimestamp(screenshot.timestamp)}
                </span>
              </div>
            </div>
            <button
              onClick={() => handleDownloadSingle(screenshot)}
              className="btn-download-single"
              title="Descargar esta imagen"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                width="20"
                height="20"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {selectedImage && (
        <div
          className="lightbox"
          onClick={() => setSelectedImage(null)}
        >
          <div className="lightbox-content">
            <button
              className="lightbox-close"
              onClick={() => setSelectedImage(null)}
            >
              ×
            </button>
            <img
              src={selectedImage.url}
              alt={`Frame at ${formatTimestamp(selectedImage.timestamp)}`}
            />
            <div className="lightbox-info">
              <p>Timestamp: {formatTimestamp(selectedImage.timestamp)}</p>
              <p>Archivo: {selectedImage.fileName}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScreenshotGallery;
