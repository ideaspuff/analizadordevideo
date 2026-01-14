import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import './VideoUploader.css';

const VideoUploader = ({ onVideoUpload, disabled }) => {
  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    console.log('onDrop called', { acceptedFiles, rejectedFiles });
    if (acceptedFiles.length > 0) {
      const videoFile = acceptedFiles[0];
      console.log('Video file selected:', videoFile);
      onVideoUpload(videoFile);
    }
    if (rejectedFiles.length > 0) {
      console.log('Rejected files:', rejectedFiles);
    }
  }, [onVideoUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/mp4': ['.mp4'],
      'video/x-msvideo': ['.avi'],
      'video/quicktime': ['.mov'],
      'video/x-matroska': ['.mkv'],
      'video/webm': ['.webm'],
      'video/x-flv': ['.flv']
    },
    maxFiles: 1,
    disabled,
    noClick: false,
    noKeyboard: false
  });

  return (
    <div className="video-uploader card">
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
      >
        <input {...getInputProps()} />
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
          {isDragActive ? (
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

export default VideoUploader;
