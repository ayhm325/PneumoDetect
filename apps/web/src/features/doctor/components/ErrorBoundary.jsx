import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // يمكن تسجيل الخطأ هنا
  }

  render() {
    if (this.state.hasError) {
      const fallbackMessage = this.props.fallbackMessage;
      return (
        <div className="rounded-lg border border-(--ui-danger-border) bg-(--ui-danger-bg) p-4 text-(--ui-danger)">
          {fallbackMessage}
        </div>
      );
    }
    return this.props.children;
  }
}