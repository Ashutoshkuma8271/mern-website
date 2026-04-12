import React from 'react';

export default function AppTest() {
  return (
    <div style={{ 
      height: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '24px'
    }}>
      <div>
        <h1>FaceAttend - Test Mode</h1>
        <p>React app is loading successfully!</p>
      </div>
    </div>
  );
}
