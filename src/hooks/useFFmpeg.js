import { useState, useEffect, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import { trackError } from '../utils/errorTracking';

export const useFFmpeg = () => {
  const ffmpegRef = useRef(new FFmpeg());
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [loadAttempts, setLoadAttempts] = useState(0);

  const load = async () => {
    if (loaded) return;

    setLoading(true);
    setError(null);

    try {
      console.log('[FFmpeg] Iniciando carga de FFmpeg.wasm...');

      // Usar archivos locales desde /public/ffmpeg
      const baseURL = '/ffmpeg/umd';
      const ffmpeg = ffmpegRef.current;

      ffmpeg.on('log', ({ message }) => {
        console.log('[FFmpeg Log]:', message);
      });

      ffmpeg.on('progress', ({ progress: prog }) => {
        const percentage = Math.round(prog * 100);
        console.log('[FFmpeg Progress]:', percentage + '%');
        setProgress(percentage);
      });

      console.log('[FFmpeg] Cargando archivos desde:', baseURL);

      // Cargar desde archivos locales
      const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
      console.log('[FFmpeg] ffmpeg-core.js cargado');

      const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');
      console.log('[FFmpeg] ffmpeg-core.wasm cargado');

      const workerURL = await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript');
      console.log('[FFmpeg] ffmpeg-core.worker.js cargado');

      console.log('[FFmpeg] Inicializando FFmpeg...');
      await ffmpeg.load({
        coreURL,
        wasmURL,
        workerURL
      });

      console.log('[FFmpeg] ✓ FFmpeg cargado exitosamente');
      setLoaded(true);
      setLoadAttempts(0);
    } catch (err) {
      const errorMsg = `Error cargando FFmpeg (intento ${loadAttempts + 1}): ${err.message}`;

      trackError('useFFmpeg', 'load', err, {
        baseURL: '/ffmpeg/umd',
        attempts: loadAttempts + 1,
        userAgent: navigator.userAgent,
        isSecureContext: window.isSecureContext,
        crossOriginIsolated: window.crossOriginIsolated
      });

      setError(errorMsg);
      setLoadAttempts(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return {
    ffmpeg: ffmpegRef.current,
    loaded,
    loading,
    error,
    progress,
    reload: load
  };
};
