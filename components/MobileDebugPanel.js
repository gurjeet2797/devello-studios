import React, { useState, useEffect } from 'react';
import { mobileDebugger } from '../lib/mobileDebugger';

export default function MobileDebugPanel() {
  const [isVisible, setIsVisible] = useState(false);
  const [logs, setLogs] = useState([]);
  const [fileInfo, setFileInfo] = useState(null);

  useEffect(() => {
    // Only show in development or with debug flag
    const isDebugMode = process.env.NODE_ENV === 'development' || 
                       process.env.ENABLE_MOBILE_DEBUG === 'true';
    
    if (!isDebugMode) return;

    // Show debug panel on mobile
    const isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      setIsVisible(true);
    }
  }, []);

  const refreshLogs = () => {
    const debugLogs = mobileDebugger.getDebugLogs();
    setLogs(debugLogs);
  };

  const clearLogs = () => {
    mobileDebugger.clearLogs();
    setLogs([]);
  };

  const exportDebugInfo = () => {
    const debugInfo = mobileDebugger.exportDebugInfo();
    const blob = new Blob([JSON.stringify(debugInfo, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mobile-debug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const logFileInfo = (file) => {
    if (file) {
      setFileInfo({
        name: file.name,
        size: file.size,
        sizeMB: (file.size / (1024 * 1024)).toFixed(2),
        type: file.type,
        lastModified: new Date(file.lastModified).toISOString()
      });
    }
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      width: '300px',
      maxHeight: '400px',
      backgroundColor: 'rgba(0,0,0,0.9)',
      color: 'white',
      padding: '10px',
      borderRadius: '8px',
      fontSize: '12px',
      zIndex: 9999,
      overflow: 'auto'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <h3 style={{ margin: 0, color: '#4CAF50' }}>📱 Mobile Debug</h3>
        <button 
          onClick={() => setIsVisible(false)}
          style={{ background: 'red', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 6px' }}
        >
          ✕
        </button>
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <button onClick={refreshLogs} style={{ marginRight: '5px', padding: '4px 8px' }}>Refresh</button>
        <button onClick={clearLogs} style={{ marginRight: '5px', padding: '4px 8px' }}>Clear</button>
        <button onClick={exportDebugInfo} style={{ padding: '4px 8px' }}>Export</button>
      </div>

      {fileInfo && (
        <div style={{ marginBottom: '10px', padding: '8px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
          <strong>File Info:</strong><br/>
          Name: {fileInfo.name}<br/>
          Size: {fileInfo.sizeMB}MB<br/>
          Type: {fileInfo.type}<br/>
          Modified: {new Date(fileInfo.lastModified).toLocaleString()}
        </div>
      )}

      <div style={{ maxHeight: '200px', overflow: 'auto' }}>
        <strong>Debug Logs:</strong>
        {logs.length === 0 ? (
          <div style={{ color: '#888', fontStyle: 'italic' }}>No logs yet</div>
        ) : (
          logs.slice(-10).map((log, index) => (
            <div key={index} style={{ 
              marginBottom: '4px', 
              padding: '4px', 
              backgroundColor: log.level === 'error' ? 'rgba(255,0,0,0.2)' : 'rgba(255,255,255,0.1)',
              borderRadius: '2px'
            }}>
              <span style={{ color: log.level === 'error' ? '#ff6b6b' : '#4CAF50' }}>
                [{log.level.toUpperCase()}]
              </span> {log.message}
              {log.data && (
                <div style={{ fontSize: '10px', color: '#ccc', marginTop: '2px' }}>
                  {JSON.stringify(log.data, null, 1)}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
