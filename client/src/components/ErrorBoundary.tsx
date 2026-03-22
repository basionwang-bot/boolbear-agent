import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: "" };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log detailed error info for debugging
    const info = [
      "Error: " + String(error),
      "Message: " + (error.message || "N/A"),
      "Name: " + (error.name || "N/A"),
      "Component Stack: " + (errorInfo.componentStack || "N/A"),
      "UA: " + navigator.userAgent,
    ].join("\n\n");
    this.setState({ errorInfo: info });
  }

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error
        ? String(this.state.error.message || this.state.error)
        : "Unknown error";
      const errorStack = this.state.error?.stack || "";

      return (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "32px",
          backgroundColor: "#faf8f5",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}>
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            maxWidth: "640px",
            padding: "32px",
          }}>
            <div style={{ color: "#e53e3e", marginBottom: "24px", fontSize: "48px" }}>
              ⚠️
            </div>

            <h2 style={{ fontSize: "20px", marginBottom: "8px", color: "#333" }}>
              页面加载出错
            </h2>
            <p style={{ fontSize: "14px", marginBottom: "16px", color: "#666" }}>
              {errorMessage}
            </p>

            <div style={{
              padding: "16px",
              width: "100%",
              borderRadius: "8px",
              backgroundColor: "#f0ede8",
              overflow: "auto",
              marginBottom: "16px",
              maxHeight: "300px",
            }}>
              <pre style={{
                fontSize: "11px",
                color: "#666",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                margin: 0,
              }}>
                {errorStack || this.state.errorInfo || "No stack trace available"}
              </pre>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 20px",
                  borderRadius: "8px",
                  backgroundColor: "#8B6914",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                🔄 重新加载
              </button>
              <button
                onClick={() => {
                  window.location.href = "/";
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 20px",
                  borderRadius: "8px",
                  backgroundColor: "#e8e4dc",
                  color: "#333",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                🏠 返回首页
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
