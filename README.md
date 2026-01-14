# Analizador de Videos

Aplicación web para extraer capturas de pantalla de videos localmente usando FFmpeg.wasm. Todo el procesamiento se realiza en tu navegador, sin enviar datos a ningún servidor.

## Características

- **Drag & Drop**: Arrastra y suelta videos fácilmente
- **100% Local**: Sin servidores, tus videos nunca salen de tu navegador
- **Procesamiento FFmpeg**: Utiliza FFmpeg.wasm para extracción de frames
- **Configuración Flexible**:
  - Intervalo entre capturas configurable
  - Múltiples formatos (PNG, JPG)
  - Escalado de resolución
  - Selección de rango temporal
- **Descarga Fácil**: Descarga capturas individuales o todas en ZIP
- **Interfaz Moderna**: UI responsiva y amigable
- **Sistema de Error Tracking**: Dashboard de errores con blame automático para debugging

## Formatos de Video Soportados

- MP4
- AVI
- MOV
- MKV
- WebM
- FLV

## Instalación

1. Clona o descarga este repositorio

2. Instala las dependencias:
```bash
npm install
```

3. Inicia el servidor de desarrollo:
```bash
npm run dev
```

4. Abre tu navegador en `http://localhost:5173`

## Uso

1. **Cargar Video**: Arrastra y suelta un video en la zona designada o haz clic para seleccionar uno

2. **Configurar Extracción**:
   - Define el intervalo entre capturas (en segundos)
   - Selecciona el formato de salida (PNG o JPG)
   - Ajusta la calidad (para JPG)
   - Elige la resolución de salida
   - Opcionalmente, define un rango temporal específico

3. **Generar Capturas**: Haz clic en "Generar Capturas" y espera el procesamiento

4. **Descargar**:
   - Descarga capturas individuales haciendo clic en el botón de descarga de cada imagen
   - Descarga todas las capturas en un archivo ZIP
   - Haz clic en cualquier captura para verla en pantalla completa

## Tecnologías Utilizadas

- **React 18**: Framework UI
- **Vite**: Build tool y dev server
- **FFmpeg.wasm**: Procesamiento de video en el navegador
- **react-dropzone**: Drag & drop de archivos
- **JSZip**: Creación de archivos ZIP
- **file-saver**: Descarga de archivos

## Requisitos del Navegador

Necesitas un navegador moderno con soporte para:
- WebAssembly (WASM)
- SharedArrayBuffer
- Cross-Origin Isolation

Navegadores compatibles:
- Chrome/Edge 92+
- Firefox 89+
- Safari 15.2+

## Comandos Disponibles

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

## Estructura del Proyecto

```
src/
├── components/
│   ├── VideoUploader/       # Drag & drop de videos
│   ├── VideoPlayer/         # Reproductor y metadata
│   ├── ScreenshotConfig/    # Configuración de extracción
│   ├── ProcessingEngine/    # Motor de procesamiento FFmpeg
│   └── ScreenshotGallery/   # Galería de capturas
├── hooks/
│   └── useFFmpeg.js         # Hook para FFmpeg.wasm
├── utils/
│   ├── ffmpegHelpers.js     # Funciones de procesamiento
│   └── downloadHelpers.js   # Utilidades de descarga
├── App.jsx                  # Componente principal
└── main.jsx                 # Entry point
```

## Debugging y Error Tracking

La aplicación incluye un sistema avanzado de tracking de errores:

- **Error Dashboard**: Botón flotante en la esquina inferior derecha que aparece cuando hay errores
- **Blame Automático**: Cada error identifica el componente y acción responsable
- **Exportación de Logs**: Exporta todos los errores en formato JSON para análisis
- **Metadata Completa**: Información del navegador, contexto de seguridad, y stack traces

Para diagnosticar problemas con FFmpeg.wasm:
1. Abre `http://localhost:5173/diagnostic.html`
2. Verifica que todos los tests pasen (especialmente Cross-Origin Isolation)

## Limitaciones

- Videos muy grandes pueden consumir mucha memoria RAM
- El rendimiento es menor comparado con FFmpeg nativo
- Requiere navegadores con soporte para WebAssembly

## Optimizaciones Futuras

- [ ] Detección automática de cambios de escena
- [ ] Comparación de frames para evitar duplicados
- [ ] Exportar capturas a PDF
- [ ] Anotaciones y marcadores en capturas
- [ ] Historial de proyectos (localStorage)
- [ ] Worker threads para mejor performance

## Privacidad

Esta aplicación procesa todos los videos localmente en tu navegador. No se envía ningún dato a servidores externos. Tus videos permanecen completamente privados.

## Licencia

MIT

## Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue primero para discutir cambios mayores.
