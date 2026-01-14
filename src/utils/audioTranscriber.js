/**
 * Utilidad para transcripción de audio usando Whisper.wasm
 * Procesa audio localmente en el navegador
 */

import {
  canUseWhisperWeb,
  downloadWhisperModel,
  resampleTo16Khz,
  transcribe
} from '@remotion/whisper-web';

/**
 * Modelos disponibles de Whisper
 * tiny: ~75MB, más rápido pero menos preciso
 * base: ~142MB, balance entre velocidad y precisión
 * small: ~466MB, mejor precisión pero más lento
 */
export const WHISPER_MODELS = {
  'tiny': { size: '75 MB', speed: 'Muy rápido', quality: 'Básica' },
  'tiny.en': { size: '75 MB', speed: 'Muy rápido', quality: 'Básica (solo inglés)' },
  'base': { size: '142 MB', speed: 'Rápido', quality: 'Buena' },
  'base.en': { size: '142 MB', speed: 'Rápido', quality: 'Buena (solo inglés)' },
  'small': { size: '466 MB', speed: 'Moderado', quality: 'Excelente' },
  'small.en': { size: '466 MB', speed: 'Moderado', quality: 'Excelente (solo inglés)' }
};

/**
 * Idiomas soportados por Whisper
 */
export const WHISPER_LANGUAGES = {
  'auto': 'Detectar automáticamente',
  'es': 'Español',
  'en': 'Inglés',
  'fr': 'Francés',
  'de': 'Alemán',
  'it': 'Italiano',
  'pt': 'Portugués',
  'nl': 'Holandés',
  'ru': 'Ruso',
  'zh': 'Chino',
  'ja': 'Japonés',
  'ko': 'Coreano',
  'ar': 'Árabe',
  'hi': 'Hindi',
  'tr': 'Turco',
  'pl': 'Polaco',
  'uk': 'Ucraniano',
  'sv': 'Sueco',
  'no': 'Noruego',
  'da': 'Danés',
  'fi': 'Finlandés'
};

/**
 * Verifica si el navegador soporta Whisper Web
 */
export const checkWhisperSupport = () => {
  try {
    return canUseWhisperWeb();
  } catch (error) {
    console.error('[AudioTranscriber] Error checking Whisper support:', error);
    return false;
  }
};

/**
 * Extrae audio de un archivo de video
 * @param {File} videoFile - Archivo de video
 * @returns {Promise<AudioBuffer>} Buffer de audio
 */
export const extractAudioFromVideo = async (videoFile) => {
  console.log('[AudioTranscriber] Extrayendo audio del video...');

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(videoFile);
    video.muted = true;

    video.onloadedmetadata = async () => {
      try {
        const audioContext = new AudioContext();

        // Crear un MediaElementSource desde el video
        const source = audioContext.createMediaElementSource(video);
        const destination = audioContext.createMediaStreamDestination();
        source.connect(destination);

        // Crear MediaRecorder para capturar el audio
        const mediaRecorder = new MediaRecorder(destination.stream);
        const chunks = [];

        mediaRecorder.ondataavailable = (e) => {
          chunks.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(chunks, { type: 'audio/webm' });
          const arrayBuffer = await audioBlob.arrayBuffer();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

          URL.revokeObjectURL(video.src);
          resolve(audioBuffer);
        };

        // Iniciar grabación y reproducción
        mediaRecorder.start();
        video.play();

        // Detener cuando termine el video
        video.onended = () => {
          mediaRecorder.stop();
          audioContext.close();
        };

      } catch (error) {
        URL.revokeObjectURL(video.src);
        reject(error);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Error al cargar el video para extraer audio'));
    };
  });
};

/**
 * Extrae audio de forma alternativa usando Web Audio API
 * @param {File} videoFile - Archivo de video
 * @returns {Promise<Float32Array>} Datos de audio en formato Float32Array
 */
export const extractAudioData = async (videoFile) => {
  console.log('[AudioTranscriber] Extrayendo datos de audio...');

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const audioContext = new AudioContext({ sampleRate: 16000 });

    video.onloadedmetadata = () => {
      video.currentTime = 0;
    };

    video.onseeked = async () => {
      try {
        // Crear un canvas offline para procesar el audio
        const offlineCtx = new OfflineAudioContext(
          1, // mono
          Math.floor(video.duration * 16000),
          16000
        );

        // Crear source desde el video
        const source = offlineCtx.createMediaElementSource(video);
        source.connect(offlineCtx.destination);

        video.play();
        const audioBuffer = await offlineCtx.startRendering();

        // Obtener datos del canal 0 (mono)
        const audioData = audioBuffer.getChannelData(0);

        URL.revokeObjectURL(video.src);
        audioContext.close();
        resolve(audioData);

      } catch (error) {
        URL.revokeObjectURL(video.src);
        audioContext.close();
        reject(error);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      audioContext.close();
      reject(new Error('Error al cargar el video'));
    };

    video.src = URL.createObjectURL(videoFile);
  });
};

/**
 * Descarga y prepara el modelo de Whisper
 * @param {string} modelName - Nombre del modelo ('tiny', 'base', 'small', etc.)
 * @param {Function} onProgress - Callback de progreso (0-100)
 * @returns {Promise<string>} URL del modelo descargado
 */
export const prepareWhisperModel = async (modelName, onProgress = null) => {
  console.log('[AudioTranscriber] Descargando modelo:', modelName);

  try {
    const modelUrl = await downloadWhisperModel({
      model: modelName,
      onProgress: (progress) => {
        const percentage = Math.round(progress * 100);
        console.log(`[AudioTranscriber] Descarga del modelo: ${percentage}%`);
        onProgress?.(percentage);
      }
    });

    console.log('[AudioTranscriber] Modelo descargado:', modelUrl);
    return modelUrl;

  } catch (error) {
    console.error('[AudioTranscriber] Error descargando modelo:', error);
    throw new Error(`Error al descargar el modelo ${modelName}: ${error.message}`);
  }
};

/**
 * Transcribe audio usando Whisper
 * @param {Float32Array} audioData - Datos de audio en 16kHz
 * @param {string} modelUrl - URL del modelo de Whisper
 * @param {Object} options - Opciones de transcripción
 * @param {string} options.language - Código de idioma ('es', 'en', etc.) o 'auto'
 * @param {Function} options.onProgress - Callback de progreso
 * @returns {Promise<Object>} Resultado de la transcripción
 */
export const transcribeAudio = async (audioData, modelUrl, options = {}) => {
  const { language = 'auto', onProgress = null } = options;

  console.log('[AudioTranscriber] Iniciando transcripción...');
  console.log('[AudioTranscriber] Idioma:', language);

  try {
    // Resamplear audio a 16kHz si es necesario
    const resampledAudio = await resampleTo16Khz({
      audioData,
      sampleRate: 16000, // Ya está en 16kHz
      onProgress: (progress) => {
        const percentage = Math.round(progress * 50); // 0-50%
        onProgress?.(percentage);
      }
    });

    // Transcribir
    const result = await transcribe({
      modelUrl,
      audioData: resampledAudio,
      language: language === 'auto' ? undefined : language,
      onProgress: (progress) => {
        const percentage = 50 + Math.round(progress * 50); // 50-100%
        onProgress?.(percentage);
      }
    });

    console.log('[AudioTranscriber] Transcripción completada');
    return result;

  } catch (error) {
    console.error('[AudioTranscriber] Error en transcripción:', error);
    throw new Error(`Error al transcribir: ${error.message}`);
  }
};

/**
 * Convierte el resultado de transcripción a formato SRT
 * @param {Array} segments - Segmentos de transcripción de Whisper
 * @returns {string} Contenido en formato SRT
 */
export const convertToSRT = (segments) => {
  let srt = '';

  segments.forEach((segment, index) => {
    const startTime = formatTimestamp(segment.start);
    const endTime = formatTimestamp(segment.end);

    srt += `${index + 1}\n`;
    srt += `${startTime} --> ${endTime}\n`;
    srt += `${segment.text.trim()}\n\n`;
  });

  return srt;
};

/**
 * Convierte el resultado de transcripción a formato VTT
 * @param {Array} segments - Segmentos de transcripción de Whisper
 * @returns {string} Contenido en formato VTT
 */
export const convertToVTT = (segments) => {
  let vtt = 'WEBVTT\n\n';

  segments.forEach((segment, index) => {
    const startTime = formatTimestamp(segment.start);
    const endTime = formatTimestamp(segment.end);

    vtt += `${index + 1}\n`;
    vtt += `${startTime} --> ${endTime}\n`;
    vtt += `${segment.text.trim()}\n\n`;
  });

  return vtt;
};

/**
 * Convierte el resultado de transcripción a texto plano
 * @param {Array} segments - Segmentos de transcripción de Whisper
 * @returns {string} Texto plano
 */
export const convertToText = (segments) => {
  return segments.map(s => s.text.trim()).join(' ');
};

/**
 * Formatea un timestamp en segundos a formato SRT/VTT (HH:MM:SS,mmm)
 * @param {number} seconds - Tiempo en segundos
 * @returns {string} Timestamp formateado
 */
const formatTimestamp = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
};

/**
 * Pipeline completo de transcripción
 * @param {File} videoFile - Archivo de video
 * @param {Object} config - Configuración
 * @param {string} config.model - Modelo de Whisper ('tiny', 'base', 'small')
 * @param {string} config.language - Idioma ('es', 'en', 'auto', etc.)
 * @param {Function} config.onProgress - Callback de progreso
 * @returns {Promise<Object>} Resultado de transcripción
 */
export const transcribeVideo = async (videoFile, config = {}) => {
  const {
    model = 'base',
    language = 'auto',
    onProgress = null
  } = config;

  try {
    // 1. Verificar soporte
    if (!checkWhisperSupport()) {
      throw new Error('Tu navegador no soporta Whisper Web. Necesitas un navegador moderno con soporte para SharedArrayBuffer.');
    }

    // 2. Descargar modelo (0-30%)
    onProgress?.({ step: 'download', progress: 0, message: 'Descargando modelo de Whisper...' });
    const modelUrl = await prepareWhisperModel(model, (progress) => {
      onProgress?.({ step: 'download', progress: progress * 0.3, message: `Descargando modelo: ${progress}%` });
    });

    // 3. Extraer audio (30-50%)
    onProgress?.({ step: 'extract', progress: 30, message: 'Extrayendo audio del video...' });
    const audioData = await extractAudioData(videoFile);
    onProgress?.({ step: 'extract', progress: 50, message: 'Audio extraído correctamente' });

    // 4. Transcribir (50-100%)
    onProgress?.({ step: 'transcribe', progress: 50, message: 'Transcribiendo audio...' });
    const result = await transcribeAudio(audioData, modelUrl, {
      language,
      onProgress: (progress) => {
        onProgress?.({ step: 'transcribe', progress: 50 + (progress * 0.5), message: `Transcribiendo: ${progress}%` });
      }
    });

    onProgress?.({ step: 'complete', progress: 100, message: 'Transcripción completada' });

    return result;

  } catch (error) {
    console.error('[AudioTranscriber] Error en pipeline de transcripción:', error);
    throw error;
  }
};
