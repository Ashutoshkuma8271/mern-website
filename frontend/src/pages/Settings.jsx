import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import api from '../api';

function formatBytes(n) {
  if (n == null || Number.isNaN(n)) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export default function Settings() {
  const { settings, setSettings, resetToDefaults } = useSettings();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [storageInfo, setStorageInfo] = useState({ usage: null, quota: null });
  const [localStorageEstimate, setLocalStorageEstimate] = useState(0);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (navigator.storage?.estimate) {
          const est = await navigator.storage.estimate();
          if (!cancelled) {
            setStorageInfo({ usage: est.usage, quota: est.quota });
          }
        }
      } catch {
        /* ignore */
      }
      try {
        let total = 0;
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          total += (k?.length || 0) + (localStorage.getItem(k)?.length || 0);
        }
        if (!cancelled) setLocalStorageEstimate(total * 2);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const pct = settings.confidenceThreshold * 100;

  const runAction = async (key, fn) => {
    setBusy(key);
    setMessage({ type: '', text: '' });
    try {
      await fn();
      setMessage({ type: 'ok', text: 'Done.' });
    } catch (err) {
      setMessage({
        type: 'err',
        text: err.response?.data?.message || err.message || 'Request failed',
      });
    } finally {
      setBusy('');
    }
  };

  const clearToday = () =>
    runAction('today', () => api.delete('/attendance/my-records?scope=today'));

  const clearAllAttendance = () => {
    if (!window.confirm('Delete ALL your attendance history? This cannot be undone.')) return;
    runAction('all', () => api.delete('/attendance/my-records?scope=all'));
  };

  const clearFaceEnrollment = () => {
    if (!window.confirm('Remove your face enrollment? You will need to register your face again to use recognition.')) return;
    runAction('face', () => api.post('/auth/clear-face-data'));
  };

  const deleteAccount = () => {
    if (!deletePassword) {
      setMessage({ type: 'err', text: 'Enter your password to confirm.' });
      return;
    }
    runAction('delete', async () => {
      await api.delete('/auth/account', { data: { password: deletePassword } });
      setDeletePassword('');
      setShowDeleteConfirm(false);
      logout();
      navigate('/login');
    });
  };

  return (
    <div className="settings-page">
      <div className="settings-inner">
        <header className="settings-header">
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">
            Face recognition, attendance behavior, data, and account — similar to FaceTrack controls
          </p>
        </header>

        {message.text && (
          <div className={`alert ${message.type === 'ok' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '1.25rem' }}>
            {message.text}
          </div>
        )}

        <section className="settings-card">
          <h2 className="settings-card-title">Recognition</h2>
          <p className="settings-card-desc">Minimum confidence required before check-in / check-out is allowed (30%–80%).</p>

          <div className="settings-row">
            <label className="settings-label" htmlFor="conf-slider">
              Confidence threshold: <strong>{Math.round(pct)}%</strong>
            </label>
            <input
              id="conf-slider"
              type="range"
              min={30}
              max={80}
              step={1}
              value={Math.round(pct)}
              onChange={(e) =>
                setSettings({ confidenceThreshold: Number(e.target.value) / 100 })
              }
              className="settings-range"
            />
            <div className="settings-range-ticks">
              <span>30%</span>
              <span>80%</span>
            </div>
          </div>

          <div className="settings-row">
            <label className="settings-label" htmlFor="auto-interval">
              Auto-scan interval: <strong>{settings.autoScanIntervalSec}s</strong> (when Auto mode is on at Mark Attendance)
            </label>
            <input
              id="auto-interval"
              type="range"
              min={2}
              max={10}
              step={1}
              value={settings.autoScanIntervalSec}
              onChange={(e) => setSettings({ autoScanIntervalSec: Number(e.target.value) })}
              className="settings-range"
            />
            <div className="settings-range-ticks">
              <span>2s</span>
              <span>10s</span>
            </div>
          </div>

          <label className="settings-toggle">
            <input
              type="checkbox"
              checked={settings.showLandmarks}
              onChange={(e) => setSettings({ showLandmarks: e.target.checked })}
            />
            <span>Show 68-point landmark overlay on camera preview</span>
          </label>

          <label className="settings-toggle">
            <input
              type="checkbox"
              checked={settings.soundOnRecognize}
              onChange={(e) => setSettings({ soundOnRecognize: e.target.checked })}
            />
            <span>Sound beep when face is recognized above threshold</span>
          </label>

          <label className="settings-toggle">
            <input
              type="checkbox"
              checked={settings.attendanceMode === 'auto'}
              onChange={(e) =>
                setSettings({ attendanceMode: e.target.checked ? 'auto' : 'manual' })
              }
            />
            <span>
              <strong>Auto mode</strong> — periodically attempt check-in/out when confidence is high (interval above).
              Turn off for manual-only (tap the button).
            </span>
          </label>
        </section>

        <section className="settings-card">
          <h2 className="settings-card-title">Storage</h2>
          <p className="settings-card-desc">Browser storage used by this site (models cache, tokens, preferences).</p>
          <div className="storage-bars">
            {storageInfo.quota != null && storageInfo.usage != null && (
              <div className="storage-row">
                <span>Origin (IndexedDB &amp; cache)</span>
                <div className="storage-bar">
                  <div
                    className="storage-bar-fill"
                    style={{
                      width: `${Math.min(100, (storageInfo.usage / storageInfo.quota) * 100)}%`,
                    }}
                  />
                </div>
                <span className="storage-meta">
                  {formatBytes(storageInfo.usage)} / {formatBytes(storageInfo.quota)}
                </span>
              </div>
            )}
            <div className="storage-row">
              <span>localStorage (approx.)</span>
              <span className="storage-meta">{formatBytes(localStorageEstimate)}</span>
            </div>
          </div>
        </section>

        <section className="settings-card settings-card-danger">
          <h2 className="settings-card-title">Data &amp; enrollment</h2>

          <div className="settings-actions">
            <button
              type="button"
              className="btn btn-warning"
              disabled={!!busy}
              onClick={clearToday}
            >
              {busy === 'today' ? '…' : "Clear today's attendance"}
            </button>
            <button
              type="button"
              className="btn btn-danger"
              disabled={!!busy}
              onClick={clearAllAttendance}
            >
              {busy === 'all' ? '…' : 'Clear all attendance history'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={!!busy}
              onClick={clearFaceEnrollment}
            >
              {busy === 'face' ? '…' : 'Remove my face enrollment'}
            </button>
          </div>
          <p className="settings-hint">
            “Remove my face enrollment” clears your stored face vectors so others cannot match you until you register again.
          </p>
        </section>

        <section className="settings-card settings-card-danger">
          <h2 className="settings-card-title">Account</h2>
          <button type="button" className="btn btn-ghost" onClick={resetToDefaults}>
            Reset recognition settings to defaults
          </button>

          {!showDeleteConfirm ? (
            <button
              type="button"
              className="btn btn-danger"
              style={{ marginTop: '1rem' }}
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete account &amp; wipe data
            </button>
          ) : (
            <div className="settings-delete-box">
              <p className="settings-card-desc">
                This permanently deletes your user account, all attendance records, and face data. Type your password to confirm.
              </p>
              <input
                type="password"
                className="form-input"
                placeholder="Current password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                autoComplete="current-password"
              />
              <div className="settings-actions" style={{ marginTop: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={!!busy}
                  onClick={deleteAccount}
                >
                  {busy === 'delete' ? '…' : 'Confirm delete forever'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletePassword('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
