// Sistema de tracking de errores con blame
class ErrorTracker {
  constructor() {
    this.errors = [];
    this.maxErrors = 50;
  }

  log(component, action, error, metadata = {}) {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      component,
      action,
      error: {
        message: error.message || error,
        stack: error.stack,
        name: error.name
      },
      metadata,
      blame: this.getBlame(component, action)
    };

    this.errors.unshift(errorEntry);

    // Limitar el número de errores almacenados
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Log a consola con formato
    console.error(
      `%c[ERROR] ${component}:${action}`,
      'color: red; font-weight: bold',
      '\n',
      `Message: ${errorEntry.error.message}`,
      '\n',
      `Blame: ${errorEntry.blame}`,
      '\n',
      `Metadata:`, metadata,
      '\n',
      `Stack:`, error.stack
    );

    return errorEntry;
  }

  getBlame(component, action) {
    const blameMap = {
      'useFFmpeg': {
        'load': 'FFmpeg.wasm initialization - Check network connection and CORS headers',
        'default': 'FFmpeg hook'
      },
      'VideoUploader': {
        'upload': 'File upload validation',
        'default': 'Video uploader component'
      },
      'ProcessingEngine': {
        'extractFrames': 'FFmpeg processing - Check video format and FFmpeg availability',
        'default': 'Video processing engine'
      },
      'ScreenshotGallery': {
        'download': 'File download system',
        'default': 'Screenshot gallery'
      }
    };

    const componentMap = blameMap[component];
    if (!componentMap) return 'Unknown component';

    return componentMap[action] || componentMap.default;
  }

  getErrors() {
    return this.errors;
  }

  clearErrors() {
    this.errors = [];
  }

  getErrorsByComponent(component) {
    return this.errors.filter(e => e.component === component);
  }

  exportErrors() {
    return JSON.stringify(this.errors, null, 2);
  }
}

export const errorTracker = new ErrorTracker();

// Helper para usar en componentes
export const trackError = (component, action, error, metadata) => {
  return errorTracker.log(component, action, error, metadata);
};

// Hook para obtener errores en componentes
export const useErrorTracking = () => {
  return {
    trackError,
    getErrors: () => errorTracker.getErrors(),
    clearErrors: () => errorTracker.clearErrors(),
    exportErrors: () => errorTracker.exportErrors()
  };
};
