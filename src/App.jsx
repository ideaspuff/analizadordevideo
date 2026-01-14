import { useState, useRef } from 'react';
import { isVideoFrameSupported } from './utils/videoFrameExtractor';
import VideoUploader from './components/VideoUploader/VideoUploaderSimple';
import VideoPlayer from './components/VideoPlayer/VideoPlayer';
import ScreenshotConfig from './components/ScreenshotConfig/ScreenshotConfig';
import ProcessingEngine from './components/ProcessingEngine/ProcessingEngine';
import ScreenshotGallery from './components/ScreenshotGallery/ScreenshotGallery';
import ErrorDashboard from './components/ErrorDashboard/ErrorDashboard';
import { cleanupUrls } from './utils/downloadHelpers';
import './App.css';

function App() {
  const [videoFile, setVideoFile] = useState(null);
  const [videoInfo, setVideoInfo] = useState(null);
  const [screenshots, setScreenshots] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [processingConfig, setProcessingConfig] = useState({});
  const processingEngineRef = useRef(null);

  const isSupported = isVideoFrameSupported();
  console.log('[App] VideoFrame API supported:', isSupported);

  const handleVideoUpload = (file) => {
    console.log('handleVideoUpload called with:', file);
    // Limpiar estado anterior
    if (screenshots.length > 0) {
      cleanupUrls(screenshots.map(s => s.url));
    }
    setScreenshots([]);
    setError(null);
    setVideoFile(file);
  };

  const handleVideoInfoLoaded = (info) => {
    setVideoInfo(info);
  };

  const handleStartProcessing = (config) => {
    setIsProcessing(true);
    setError(null);
    setProcessingConfig(config);

    // Iniciar el procesamiento
    if (processingEngineRef.current) {
      processingEngineRef.current.startProcessing();
    }
  };

  const handleProcessingComplete = (newScreenshots) => {
    setScreenshots(newScreenshots);
    setIsProcessing(false);
  };

  const handleProcessingError = (errorMessage) => {
    setError(errorMessage);
    setIsProcessing(false);
  };

  const handleClearScreenshots = () => {
    if (screenshots.length > 0) {
      cleanupUrls(screenshots.map(s => s.url));
    }
    setScreenshots([]);
  };

  const handleReset = () => {
    handleClearScreenshots();
    setVideoFile(null);
    setVideoInfo(null);
    setError(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Analizador de Videos</h1>
        <p className="subtitle">Extrae capturas de pantalla de tus videos localmente</p>

        {!isSupported && (
          <div className="ffmpeg-status error">
            Tu navegador no soporta VideoFrame API. Usa Chrome 94+, Safari 16.4+, o Firefox 116+
          </div>
        )}

        {isSupported && (
          <div className="ffmpeg-status success">
            ✓ Navegador compatible
          </div>
        )}
      </header>

      <main className="app-content">
        {error && (
          <div className="error-message card">
            <h3>Error</h3>
            <p>{error}</p>
          </div>
        )}

        {!videoFile ? (
          <VideoUploader
            onVideoUpload={handleVideoUpload}
            disabled={!isSupported}
          />
        ) : (
          <>
            <div className="video-header-actions">
              <div className="privacy-badge">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1L3 3V7C3 10.5 5.5 13.5 8 14.5C10.5 13.5 13 10.5 13 7V3L8 1Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                  <path d="M6 8L7.5 9.5L10 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span>100% Local - Procesamiento Privado</span>
                <div className="privacy-tooltip">
                  Tu video se procesa completamente en tu navegador.
                  Nada se sube a servidores externos.
                </div>
              </div>
              <button onClick={handleReset} className="btn-change-video">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8C3 5.24 5.24 3 8 3C9.66 3 11.1 3.83 12 5.09M13 8C13 10.76 10.76 13 8 13C6.34 13 4.9 12.17 4 10.91" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M12 2V5H9M4 14V11H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Cambiar Video
              </button>
            </div>

            <VideoPlayer
              videoFile={videoFile}
              onVideoInfoLoaded={handleVideoInfoLoaded}
            />

            {videoInfo && (
              <ScreenshotConfig
                videoDuration={videoInfo.duration}
                videoFileSize={videoFile?.size}
                onStartProcessing={handleStartProcessing}
                isProcessing={isProcessing}
              />
            )}

            {videoInfo && (
              <ProcessingEngine
                ref={processingEngineRef}
                videoFile={videoFile}
                config={processingConfig}
                onComplete={handleProcessingComplete}
                onError={handleProcessingError}
              />
            )}

            {screenshots.length > 0 && (
              <ScreenshotGallery
                screenshots={screenshots}
                onClear={handleClearScreenshots}
              />
            )}
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>
          Procesamiento 100% local - Tus videos nunca salen de tu navegador
        </p>
      </footer>

      <ErrorDashboard />
    </div>
  );
}

export default App;
