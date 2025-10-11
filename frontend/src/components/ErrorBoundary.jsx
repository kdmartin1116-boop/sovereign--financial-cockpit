import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      errorId: Date.now().toString(36)
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // You could also send error to an error reporting service here
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService = (error, errorInfo) => {
    // In a real application, you would send this to an error reporting service
    // like Sentry, LogRocket, or Bugsnag
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.log('Error Report:', errorReport);
    
    // Example: Send to API endpoint
    // fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorReport)
    // }).catch(err => console.warn('Failed to log error:', err));
  };

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div className="error-boundary">
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <h1>Oops! Something went wrong</h1>
            <p className="error-message">
              We're sorry, but something unexpected happened. 
              The error has been logged and we'll look into it.
            </p>
            
            <div className="error-id">
              <small>Error ID: {this.state.errorId}</small>
            </div>

            <div className="error-actions">
              <button 
                onClick={this.handleReset}
                className="btn btn-primary"
              >
                Try Again
              </button>
              <button 
                onClick={this.handleReload}
                className="btn btn-secondary"
              >
                Reload Page
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <details className="error-details">
                <summary>Technical Details (Development Mode)</summary>
                <div className="error-stack">
                  <h4>Error:</h4>
                  <pre>{this.state.error && this.state.error.toString()}</pre>
                  
                  <h4>Component Stack:</h4>
                  <pre>{this.state.errorInfo.componentStack}</pre>
                  
                  <h4>Stack Trace:</h4>
                  <pre>{this.state.error && this.state.error.stack}</pre>
                </div>
              </details>
            )}
          </div>

          <style jsx>{`
            .error-boundary {
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
              background-color: #f8f9fa;
            }

            .error-container {
              max-width: 600px;
              width: 100%;
              background: white;
              border-radius: 8px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              padding: 40px;
              text-align: center;
            }

            .error-icon {
              font-size: 4rem;
              margin-bottom: 20px;
            }

            .error-container h1 {
              color: #dc3545;
              margin-bottom: 16px;
              font-size: 2rem;
            }

            .error-message {
              color: #6c757d;
              margin-bottom: 24px;
              font-size: 1.1rem;
              line-height: 1.5;
            }

            .error-id {
              margin-bottom: 24px;
              padding: 8px 12px;
              background-color: #f8f9fa;
              border-radius: 4px;
              font-family: monospace;
            }

            .error-actions {
              display: flex;
              gap: 12px;
              justify-content: center;
              margin-bottom: 32px;
            }

            .btn {
              padding: 10px 20px;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 1rem;
              transition: background-color 0.2s;
            }

            .btn-primary {
              background-color: #007bff;
              color: white;
            }

            .btn-primary:hover {
              background-color: #0056b3;
            }

            .btn-secondary {
              background-color: #6c757d;
              color: white;
            }

            .btn-secondary:hover {
              background-color: #545b62;
            }

            .error-details {
              text-align: left;
              margin-top: 24px;
              padding: 16px;
              background-color: #f8f9fa;
              border-radius: 4px;
            }

            .error-details summary {
              cursor: pointer;
              font-weight: bold;
              margin-bottom: 12px;
            }

            .error-stack h4 {
              margin: 16px 0 8px 0;
              color: #495057;
            }

            .error-stack pre {
              background-color: #343a40;
              color: #f8f9fa;
              padding: 12px;
              border-radius: 4px;
              overflow-x: auto;
              font-size: 0.85rem;
              white-space: pre-wrap;
              word-wrap: break-word;
            }

            @media (max-width: 768px) {
              .error-container {
                padding: 24px;
              }
              
              .error-actions {
                flex-direction: column;
              }
              
              .btn {
                width: 100%;
              }
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;