// MINIMAL APP FOR DEBUGGING - Replace App.tsx temporarily to test
import React from 'react';

export default function MinimalApp() {
  return (
    <div style={{ 
      padding: '40px', 
      background: '#f0f0f0', 
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: 'red', fontSize: '32px', marginBottom: '20px' }}>
        ✅ REACT IS RENDERING!
      </h1>
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
        <h2>Debug Info:</h2>
        <p><strong>URL:</strong> {window.location.href}</p>
        <p><strong>Time:</strong> {new Date().toLocaleString()}</p>
        <p><strong>User Agent:</strong> {navigator.userAgent}</p>
        
        <h3 style={{ marginTop: '20px' }}>Next Steps:</h3>
        <ol>
          <li>If you see this, React is working</li>
          <li>Check browser console (F12) for errors</li>
          <li>Revert back to original App.tsx</li>
          <li>Debug the actual app components</li>
        </ol>
        
        <button 
          onClick={() => window.location.href = '/auth/jwt/sign-in'}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            background: '#0066cc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Go to Sign In
        </button>
      </div>
    </div>
  );
}
