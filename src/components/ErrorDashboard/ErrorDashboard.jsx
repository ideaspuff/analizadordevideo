import { useState } from 'react';
import { useErrorTracking } from '../../utils/errorTracking';
import './ErrorDashboard.css';

const ErrorDashboard = () => {
  const { getErrors, clearErrors, exportErrors } = useErrorTracking();
  const [isOpen, setIsOpen] = useState(false);
  const errors = getErrors();

  const handleExport = () => {
    const errorData = exportErrors();
    const blob = new Blob([errorData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-log-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (errors.length === 0 && !isOpen) return null;

  return (
    <div className="error-dashboard">
      <button
        className="error-dashboard-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        {errors.length > 0 && (
          <span className="error-count">{errors.length}</span>
        )}
        {isOpen ? 'Ocultar Errores' : 'Mostrar Errores'}
      </button>

      {isOpen && (
        <div className="error-dashboard-panel">
          <div className="error-dashboard-header">
            <h3>Error Log ({errors.length})</h3>
            <div className="error-dashboard-actions">
              <button onClick={handleExport}>Exportar</button>
              <button onClick={clearErrors}>Limpiar</button>
            </div>
          </div>

          <div className="error-list">
            {errors.length === 0 ? (
              <p className="no-errors">No hay errores registrados</p>
            ) : (
              errors.map((error, index) => (
                <div key={index} className="error-entry">
                  <div className="error-header">
                    <span className="error-component">{error.component}</span>
                    <span className="error-action">{error.action}</span>
                    <span className="error-time">
                      {new Date(error.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="error-message">{error.error.message}</div>
                  <div className="error-blame">
                    <strong>Blame:</strong> {error.blame}
                  </div>
                  {Object.keys(error.metadata).length > 0 && (
                    <details className="error-metadata">
                      <summary>Metadata</summary>
                      <pre>{JSON.stringify(error.metadata, null, 2)}</pre>
                    </details>
                  )}
                  {error.error.stack && (
                    <details className="error-stack">
                      <summary>Stack Trace</summary>
                      <pre>{error.error.stack}</pre>
                    </details>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ErrorDashboard;
