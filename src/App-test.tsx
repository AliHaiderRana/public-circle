// Temporary test to see if React renders at all
import React from 'react';

export default function TestApp() {
  return (
    <div style={{ padding: '20px', background: '#f0f0f0', minHeight: '100vh' }}>
      <h1 style={{ color: 'red', fontSize: '24px' }}>TEST APP - IF YOU SEE THIS, REACT IS WORKING</h1>
      <p>Current URL: {window.location.href}</p>
      <p>Time: {new Date().toLocaleString()}</p>
    </div>
  );
}
