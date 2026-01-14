import { useState } from 'react';
import './VideoUploader.css';

const VideoUploaderSimple = ({ onVideoUpload, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('video/')) {
        onVideoUpload(file);
      } else {
        alert('Por favor selecciona un archivo de video válido');
      }
    }
  };

  const handleFileSelect = (e) => {
    if (disabled) return;

    const files = e.target.files;
    if (files && files.length > 0) {
      onVideoUpload(files[0]);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      document.getElementById('video-file-input').click();
    }
  };

  return (
    <div className="video-uploader card">
      <div
        className={`dropzone ${isDragging ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          id="video-file-input"
          type="file"
          accept="video/mp4,video/x-msvideo,video/quicktime,video/x-matroska,video/webm,video/x-flv"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          disabled={disabled}
        />
        <div className="dropzone-content">
          <svg
            className="upload-icon"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          {isDragging ? (
            <p className="dropzone-text">Suelta el video aquí...</p>
          ) : (
            <>
              <p className="dropzone-text">
                Arrastra y suelta un video aquí, o haz clic para seleccionar
              </p>
              <p className="dropzone-hint">
                Formatos soportados: MP4, AVI, MOV, MKV, WebM, FLV
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoUploaderSimple;
