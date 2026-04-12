import React from 'react';

export default function Test() {
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
        <h1>Test Page - React is Working!</h1>
        <p>If you can see this, React is loading properly.</p>
      </div>
    </div>
  );
}
