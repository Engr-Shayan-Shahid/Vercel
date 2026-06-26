"use client";

import React from "react";

import { ErrorCard } from "@/components/ui/error-card";

interface SectionErrorBoundaryProps {
  children: React.ReactNode;
  title?: string;
}

interface SectionErrorBoundaryState {
  hasError: boolean;
  message?: string;
}

export class SectionErrorBoundary extends React.Component<
  SectionErrorBoundaryProps,
  SectionErrorBoundaryState
> {
  state: SectionErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): SectionErrorBoundaryState {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error) {
    console.error("[SectionErrorBoundary]", error);
  }

  handleRetry = () => {
    this.setState({ hasError: false, message: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorCard
          title={this.props.title ?? "Something went wrong"}
          message={this.state.message ?? "This section failed to render."}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}
