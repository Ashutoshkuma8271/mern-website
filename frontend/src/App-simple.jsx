import React from 'react';

export default function AppSimple() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '600px', padding: '20px' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>FaceAttend</h1>
        <p style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>AI-Powered Attendance System</p>
        <div style={{ 
          background: 'rgba(255,255,255,0.1)', 
          padding: '2rem', 
          borderRadius: '10px',
          backdropFilter: 'blur(10px)'
        }}>
          <h2 style={{ marginBottom: '1rem' }}>System Status: ONLINE</h2>
          <p>Frontend server is running successfully!</p>
          <p>All React components are loading properly.</p>
        </div>
      </div>
    </div>
  );
}
