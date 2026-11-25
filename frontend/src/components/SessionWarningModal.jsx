export default function SessionWarningModal({ show, onStayLoggedIn, onLogout }) {
  if (!show) return null;

  return (
    <div className="session-modal">
      <div className="session-box">
        <h3>⚠ Session Expiring Soon</h3>
        <p>Your session will expire in 2 minutes.</p>
        <div className="session-actions">
          <button onClick={onStayLoggedIn}>Stay Logged In</button>
          <button onClick={onLogout}>Logout Now</button>
        </div>
      </div>
    </div>
  );
}

