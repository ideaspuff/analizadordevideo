/**
 * Extractor de frames usando VideoFrame API nativa del navegador
 * Compatible con Chrome 94+, Safari 16.4+, Firefox 116+
 */

import { detectInterestingFrames, areSimilarFrames } from './videoAnalyzer';

/**
 * Verifica si el navegador soporta VideoFrame API
 */
export const isVideoFrameSupported = () => {
  return typeof VideoDecoder !== 'undefined' &&
         typeof VideoFrame !== 'undefined' &&
         typeof OffscreenCanvas !== 'undefined';
};

/**
 * Crea un elemento de video desde un archivo
 */
const createVideoElement = (file) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;

    video.onloadedmetadata = () => {
      resolve(video);
    };

    video.onerror = () => {
      reject(new Error('Error al cargar el video'));
    };

    video.src = URL.createObjectURL(file);
  });
};

/**
 * Extrae un frame del video en un timestamp específico
 */
const extractFrameAtTime = (video, time) => {
  return new Promise((resolve, reject) => {
    try {
      video.currentTime = time;

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Error al crear blob del frame'));
            }
          }, 'image/png');
        } catch (error) {
          reject(error);
        }
      };

      video.onerror = () => {
        reject(new Error(`Error al buscar timestamp ${time}`));
      };
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Extrae múltiples frames del video
 *
 * @param {File} videoFile - Archivo de video
 * @param {Object} config - Configuración
 * @param {number} config.interval - Intervalo en segundos entre capturas
 * @param {string} config.format - Formato de salida (png, jpg)
 * @param {number} config.quality - Calidad para JPG (0-1)
 * @param {number} config.startTime - Tiempo de inicio en segundos
 * @param {number} config.endTime - Tiempo de fin en segundos (0 = hasta el final)
 * @param {Function} onProgress - Callback de progreso (0-100)
 *
 * @returns {Promise<Array>} Array de screenshots
 */
export const extractFrames = async (videoFile, config = {}, onProgress = null) => {
  // Configuración por defecto
  const {
    interval = 5,
    format = 'png',
    quality = 0.92,
    startTime = 0,
    endTime = 0,
    useSmartAnalysis = false,
    detectScenes = false,
    skipSimilar = false,
    sceneThreshold = 0.3,
    similarityThreshold = 0.05
  } = config;

  console.log('[VideoFrameExtractor] Iniciando extracción de frames');
  console.log('[VideoFrameExtractor] Config:', config);

  // Crear elemento de video
  const video = await createVideoElement(videoFile);

  const duration = video.duration;
  const finalEndTime = endTime > 0 ? Math.min(endTime, duration) : duration;

  console.log('[VideoFrameExtractor] Duración del video:', duration);
  console.log('[VideoFrameExtractor] Rango:', startTime, '-', finalEndTime);

  // Calcular timestamps
  let timestamps = [];

  if (useSmartAnalysis && detectScenes) {
    // Usar detección inteligente de escenas
    console.log('[VideoFrameExtractor] Usando análisis inteligente de escenas...');
    timestamps = await detectInterestingFrames(video, {
      minInterval: interval,
      sceneChangeThreshold: sceneThreshold,
      movementThreshold: sceneThreshold * 0.5, // Movimiento más sensible
      sampleWidth: 160,
      sampleHeight: 90
    });

    // Filtrar por rango de tiempo
    timestamps = timestamps.filter(t => t >= startTime && t <= finalEndTime);
  } else {
    // Modo normal: intervalos fijos
    for (let time = startTime; time < finalEndTime; time += interval) {
      timestamps.push(time);
    }
  }

  // Asegurar que siempre hay al menos un frame
  if (timestamps.length === 0) {
    timestamps.push(startTime);
  }

  console.log('[VideoFrameExtractor] Total de frames a extraer:', timestamps.length);

  const screenshots = [];
  const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
  let lastCanvas = null;

  // Extraer frames
  for (let i = 0; i < timestamps.length; i++) {
    const time = timestamps[i];

    try {
      console.log(`[VideoFrameExtractor] Extrayendo frame ${i + 1}/${timestamps.length} en t=${time.toFixed(2)}s`);

      // Crear canvas del frame actual
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      video.currentTime = time;
      await new Promise(resolve => {
        video.onseeked = resolve;
      });

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Verificar si es similar al anterior (si skip similar está activado)
      if (useSmartAnalysis && skipSimilar && lastCanvas) {
        const isSimilar = areSimilarFrames(lastCanvas, canvas, similarityThreshold);
        if (isSimilar) {
          console.log(`[VideoFrameExtractor] Skipping similar frame at t=${time.toFixed(2)}s`);
          continue; // Saltar este frame
        }
      }

      // Guardar canvas actual para próxima comparación
      lastCanvas = canvas;

      // Convertir canvas a blob
      const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, mimeType, format === 'jpg' ? quality : undefined);
      });

      const url = URL.createObjectURL(blob);
      const fileName = `screenshot_${String(screenshots.length + 1).padStart(4, '0')}_t${time.toFixed(2)}s.${format}`;

      screenshots.push({
        url,
        blob,
        fileName,
        timestamp: time,
        index: screenshots.length,
        width: video.videoWidth,
        height: video.videoHeight
      });

      // Actualizar progreso
      if (onProgress) {
        const progress = Math.round(((i + 1) / timestamps.length) * 100);
        onProgress(progress);
      }

    } catch (error) {
      console.error(`[VideoFrameExtractor] Error extrayendo frame en t=${time}:`, error);
      // Continuar con el siguiente frame
    }
  }

  // Limpiar
  URL.revokeObjectURL(video.src);

  console.log('[VideoFrameExtractor] ✓ Extracción completada:', screenshots.length, 'frames');

  return screenshots;
};

/**
 * Obtiene información del video
 */
export const getVideoInfo = (file) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      const info = {
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      };

      URL.revokeObjectURL(video.src);
      resolve(info);
    };

    video.onerror = () => {
      reject(new Error('Error al cargar metadata del video'));
    };

    video.src = URL.createObjectURL(file);
  });
};
