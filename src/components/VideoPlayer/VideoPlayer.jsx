import { useState, useRef, useEffect } from 'react';
import './VideoPlayer.css';

const VideoPlayer = ({ videoFile, onVideoInfoLoaded }) => {
  const videoRef = useRef(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoInfo, setVideoInfo] = useState(null);

  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile);
      setVideoUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [videoFile]);

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video) {
      const info = {
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        fileName: videoFile.name,
        fileSize: videoFile.size,
        type: videoFile.type
      };
      setVideoInfo(info);
      onVideoInfoLoaded?.(info);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!videoFile) return null;

  return (
    <div className="video-player card">
      <h2>Video Cargado</h2>
      <div className="video-container">
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          onLoadedMetadata={handleLoadedMetadata}
          className="video-element"
        />
      </div>
      {videoInfo && (
        <div className="video-info">
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Nombre:</span>
              <span className="info-value">{videoInfo.fileName}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Duración:</span>
              <span className="info-value">{formatDuration(videoInfo.duration)}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Resolución:</span>
              <span className="info-value">{videoInfo.width} x {videoInfo.height}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Tamaño:</span>
              <span className="info-value">{formatFileSize(videoInfo.fileSize)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
