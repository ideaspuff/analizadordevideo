/**
 * Utilidades para análisis inteligente de video
 * - Detección de cambios de escena
 * - Comparación de frames similares
 * - Detección de movimiento
 */

/**
 * Calcula la diferencia entre dos frames usando histograma
 * @returns {number} Diferencia entre 0 (idénticos) y 1 (completamente diferentes)
 */
const calculateFrameDifference = (imageData1, imageData2) => {
  if (!imageData1 || !imageData2) return 1;
  if (imageData1.length !== imageData2.length) return 1;

  let diff = 0;
  const pixels = imageData1.length / 4; // 4 bytes por pixel (RGBA)

  // Comparar píxeles usando diferencia euclidiana
  for (let i = 0; i < imageData1.length; i += 4) {
    const r = imageData1[i] - imageData2[i];
    const g = imageData1[i + 1] - imageData2[i + 1];
    const b = imageData1[i + 2] - imageData2[i + 2];

    // Diferencia euclidiana normalizada
    diff += Math.sqrt(r * r + g * g + b * b) / 441.67; // 441.67 = sqrt(255^2 * 3)
  }

  return diff / pixels;
};

/**
 * Obtiene el ImageData de un canvas
 */
const getImageData = (canvas) => {
  const ctx = canvas.getContext('2d');
  return ctx.getImageData(0, 0, canvas.width, canvas.height).data;
};

/**
 * Crea un canvas desde una imagen
 */
const createCanvasFromImage = (image, width, height) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0, width, height);
  return canvas;
};

/**
 * Detecta si hay cambio de escena entre dos frames
 * @param {Canvas} canvas1 - Frame anterior
 * @param {Canvas} canvas2 - Frame actual
 * @param {number} threshold - Umbral de diferencia (0-1, default 0.3)
 * @returns {boolean} true si hay cambio de escena
 */
export const detectSceneChange = (canvas1, canvas2, threshold = 0.3) => {
  if (!canvas1 || !canvas2) return false;

  const imageData1 = getImageData(canvas1);
  const imageData2 = getImageData(canvas2);
  const difference = calculateFrameDifference(imageData1, imageData2);

  console.log('[VideoAnalyzer] Scene change detection:', difference, '> threshold:', threshold, '=', difference > threshold);

  return difference > threshold;
};

/**
 * Verifica si dos frames son similares (para evitar duplicados)
 * @param {Canvas} canvas1 - Frame anterior
 * @param {Canvas} canvas2 - Frame actual
 * @param {number} threshold - Umbral de similitud (0-1, default 0.05)
 * @returns {boolean} true si los frames son similares
 */
export const areSimilarFrames = (canvas1, canvas2, threshold = 0.05) => {
  if (!canvas1 || !canvas2) return false;

  const imageData1 = getImageData(canvas1);
  const imageData2 = getImageData(canvas2);
  const difference = calculateFrameDifference(imageData1, imageData2);

  return difference < threshold;
};

/**
 * Calcula el nivel de movimiento en un frame comparado con el anterior
 * @param {Canvas} canvas1 - Frame anterior
 * @param {Canvas} canvas2 - Frame actual
 * @returns {number} Nivel de movimiento (0-1)
 */
export const calculateMovement = (canvas1, canvas2) => {
  if (!canvas1 || !canvas2) return 0;

  const imageData1 = getImageData(canvas1);
  const imageData2 = getImageData(canvas2);

  return calculateFrameDifference(imageData1, imageData2);
};

/**
 * Extrae frames con detección inteligente de escenas
 * @param {HTMLVideoElement} video - Elemento de video
 * @param {Object} options - Opciones de análisis
 * @returns {Promise<Array>} Timestamps de frames interesantes
 */
export const detectInterestingFrames = async (video, options = {}) => {
  const {
    minInterval = 1, // Mínimo 1 segundo entre frames
    sceneChangeThreshold = 0.3,
    movementThreshold = 0.15,
    sampleWidth = 160, // Reducir resolución para análisis más rápido
    sampleHeight = 90
  } = options;

  console.log('[VideoAnalyzer] Analyzing video for interesting frames...');

  const duration = video.duration;
  const timestamps = [0]; // Siempre incluir el primer frame

  let lastCanvas = null;
  let lastCaptureTime = 0;

  // Samplear el video cada 0.5 segundos
  const sampleInterval = 0.5;

  for (let time = sampleInterval; time < duration; time += sampleInterval) {
    // Buscar frame en este timestamp
    video.currentTime = time;

    await new Promise((resolve) => {
      video.onseeked = resolve;
    });

    // Crear canvas del frame actual
    const canvas = document.createElement('canvas');
    canvas.width = sampleWidth;
    canvas.height = sampleHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, sampleWidth, sampleHeight);

    if (lastCanvas) {
      // Verificar si hay cambio de escena
      const isSceneChange = detectSceneChange(lastCanvas, canvas, sceneChangeThreshold);

      // Verificar si hay movimiento significativo
      const movement = calculateMovement(lastCanvas, canvas);
      const hasMovement = movement > movementThreshold;

      // Capturar si hay cambio de escena O movimiento significativo
      // Y ha pasado el intervalo mínimo
      if ((isSceneChange || hasMovement) && (time - lastCaptureTime >= minInterval)) {
        timestamps.push(time);
        lastCaptureTime = time;
        console.log(`[VideoAnalyzer] Interesting frame at ${time.toFixed(2)}s - Scene:${isSceneChange} Movement:${movement.toFixed(3)}`);
      }
    }

    lastCanvas = canvas;
  }

  // Siempre incluir el último frame
  if (timestamps[timestamps.length - 1] !== duration) {
    timestamps.push(duration - 0.1);
  }

  console.log(`[VideoAnalyzer] Found ${timestamps.length} interesting frames`);

  return timestamps;
};

/**
 * Filtra frames duplicados de una lista
 * @param {Array} frames - Array de {canvas, timestamp}
 * @param {number} threshold - Umbral de similitud
 * @returns {Array} Frames únicos
 */
export const filterDuplicateFrames = (frames, threshold = 0.05) => {
  if (frames.length <= 1) return frames;

  const uniqueFrames = [frames[0]];

  for (let i = 1; i < frames.length; i++) {
    const currentFrame = frames[i];
    const previousFrame = uniqueFrames[uniqueFrames.length - 1];

    if (!areSimilarFrames(previousFrame.canvas, currentFrame.canvas, threshold)) {
      uniqueFrames.push(currentFrame);
    } else {
      console.log(`[VideoAnalyzer] Skipping similar frame at ${currentFrame.timestamp.toFixed(2)}s`);
    }
  }

  console.log(`[VideoAnalyzer] Filtered ${frames.length - uniqueFrames.length} duplicate frames`);

  return uniqueFrames;
};
