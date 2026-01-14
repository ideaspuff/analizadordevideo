import { fetchFile } from '@ffmpeg/util';

export const extractFrames = async (ffmpeg, videoFile, options = {}) => {
  const {
    interval = 5,        // Segundos entre capturas
    format = 'png',      // png o jpg
    quality = 2,         // 1-31 para jpg (menor = mejor calidad)
    scale = null,        // ej: '1280:-1' para ancho fijo
    startTime = 0,       // Tiempo de inicio en segundos
    duration = null      // Duración a procesar (null = todo el video)
  } = options;

  try {
    // Escribir el video en el sistema de archivos virtual de FFmpeg
    const inputFileName = 'input.mp4';
    await ffmpeg.writeFile(inputFileName, await fetchFile(videoFile));

    // Construir comando FFmpeg
    const fps = `1/${interval}`;
    let filterComplex = `fps=${fps}`;

    if (scale) {
      filterComplex += `,scale=${scale}`;
    }

    const outputPattern = `frame_%04d.${format}`;
    const args = ['-i', inputFileName];

    if (startTime > 0) {
      args.push('-ss', startTime.toString());
    }

    if (duration) {
      args.push('-t', duration.toString());
    }

    args.push('-vf', filterComplex);

    if (format === 'jpg') {
      args.push('-q:v', quality.toString());
    }

    args.push(outputPattern);

    // Ejecutar FFmpeg
    await ffmpeg.exec(args);

    // Leer los frames generados
    const files = await ffmpeg.listDir('/');
    const frameFiles = files.filter(file =>
      file.name.startsWith('frame_') && file.name.endsWith(`.${format}`)
    ).sort((a, b) => a.name.localeCompare(b.name));

    // Leer cada frame y convertir a URL
    const screenshots = await Promise.all(
      frameFiles.map(async (file, index) => {
        const data = await ffmpeg.readFile(file.name);
        const blob = new Blob([data.buffer], { type: `image/${format}` });
        const url = URL.createObjectURL(blob);

        // Calcular timestamp aproximado
        const timestamp = startTime + (index * interval);

        return {
          id: index,
          url,
          blob,
          timestamp,
          fileName: file.name
        };
      })
    );

    // Limpiar archivos del sistema virtual
    await ffmpeg.deleteFile(inputFileName);
    for (const file of frameFiles) {
      await ffmpeg.deleteFile(file.name);
    }

    return screenshots;
  } catch (error) {
    console.error('Error extracting frames:', error);
    throw error;
  }
};

export const getVideoInfo = async (ffmpeg, videoFile) => {
  try {
    const inputFileName = 'temp_video.mp4';
    await ffmpeg.writeFile(inputFileName, await fetchFile(videoFile));

    // Ejecutar ffprobe para obtener información
    await ffmpeg.exec(['-i', inputFileName]);

    await ffmpeg.deleteFile(inputFileName);

    // Nota: FFmpeg.wasm no incluye ffprobe, así que usaremos el elemento video HTML
    return null;
  } catch (error) {
    console.error('Error getting video info:', error);
    return null;
  }
};

export const formatTimestamp = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
