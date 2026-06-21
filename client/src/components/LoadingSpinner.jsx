const LoadingSpinner = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #fdfcfb 0%, #f7f7f7 100%)'
  }}>
    <div style={{
      width: '60px',
      height: '60px',
      border: '5px solid rgba(237, 53, 69, 0.1)',
      borderTopColor: '#ed3545',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }} />
    <style>{`
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

export default LoadingSpinner;