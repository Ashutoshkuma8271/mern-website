import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <>
      <section className="hero-section">
        <div className="hero-badge">🔬 AI-Powered Attendance System</div>
        <h1 className="hero-title">
          <span className="hero-title-gradient">FaceAttend</span>
          <br />
          Smart Attendance Tracking
        </h1>
        <p className="hero-description">
          Transform your attendance management with facial recognition technology.
          Secure, accurate, and completely automated — no manual tracking required.
        </p>
        <div className="hero-actions">
          {user ? (
            <Link to="/dashboard" className="btn btn-primary btn-lg">
              Go to Dashboard →
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary btn-lg">
                Get Started Free →
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg">
                Sign In
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="features-section page-container">
        <h2 className="section-title">Revolutionary Features</h2>
        <p className="section-subtitle">Powered by cutting-edge facial recognition technology</p>

        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">👤</div>
            <h3 className="feature-title">Face Registration</h3>
            <p className="feature-desc">
              Register your face once using advanced face-api.js technology.
              128-dimensional face descriptors ensure unique identification.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📷</div>
            <h3 className="feature-title">Live Recognition</h3>
            <p className="feature-desc">
              Real-time face detection with confidence scoring.
              Automatic check-in/check-out with visual feedback.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3 className="feature-title">Analytics Dashboard</h3>
            <p className="feature-desc">
              Comprehensive attendance analytics with monthly statistics,
              work hours tracking, and export capabilities.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3 className="feature-title">Secure &amp; Private</h3>
            <p className="feature-desc">
              Face data stored as encrypted vectors.
              GDPR compliant with enterprise-grade security.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3 className="feature-title">Mobile Responsive</h3>
            <p className="feature-desc">
              Works seamlessly on all devices.
              Access attendance system from anywhere, anytime.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3 className="feature-title">Lightning Fast</h3>
            <p className="feature-desc">
              Browser-based processing with TensorFlow.js.
              No server delays — instant face recognition.
            </p>
          </div>
        </div>
      </section>

      <section className="steps-section">
        <div className="page-header">
          <h2 className="page-title">How It Works</h2>
          <p className="page-subtitle">Simple three-step process to automate your attendance</p>
        </div>

        <div className="steps-grid">
          <div className="step-item">
            <div className="step-number step-number-1">1</div>
            <h3 className="step-title">Register Face</h3>
            <p className="step-desc">Capture your face once using the webcam to create your unique facial signature</p>
          </div>

          <div className="step-item">
            <div className="step-number step-number-2">2</div>
            <h3 className="step-title">Mark Attendance</h3>
            <p className="step-desc">Simply look at the camera to automatically check in or out with face recognition</p>
          </div>

          <div className="step-item">
            <div className="step-number step-number-3">3</div>
            <h3 className="step-title">Track &amp; Analyze</h3>
            <p className="step-desc">View detailed attendance history, export reports, and monitor work hours</p>
          </div>
        </div>
      </section>
    </>
  );
}
