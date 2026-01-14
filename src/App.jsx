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
            <VideoPlayer
              videoFile={videoFile}
              onVideoInfoLoaded={handleVideoInfoLoaded}
            />

            {videoInfo && (
              <ScreenshotConfig
                videoDuration={videoInfo.duration}
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

            <div className="app-actions">
              <button onClick={handleReset} className="btn-reset">
                Cargar Otro Video
              </button>
            </div>
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
