import React from 'react';
import { Button } from './ui/button';
import type { ABVariant } from '../App';

interface ButtonTrackerProps {
  buttonId: string;
  buttonText: string;
  variant: ABVariant;
  userId: string;
  sessionId: string;
  pageName: string;
  onTrack?: (buttonId: string, buttonText: string) => void;
  children: React.ReactNode;
  className?: string;
  [key: string]: any; // For any additional button props
}

export function ButtonTracker({
  buttonId,
  buttonText,
  variant,
  userId,
  sessionId,
  pageName,
  onTrack,
  children,
  className,
  ...buttonProps
}: ButtonTrackerProps) {
  
  const handleClick = (event: React.MouseEvent) => {
    // Track the button click
    const clickData = {
      buttonId,
      buttonText,
      pageName,
      variant,
      userId,
      sessionId,
      timestamp: Date.now()
    };

    // Store in localStorage for immediate access
    const stored = localStorage.getItem('button_click_tracking') || '[]';
    const buttonClicks = JSON.parse(stored);
    buttonClicks.push(clickData);
    localStorage.setItem('button_click_tracking', JSON.stringify(buttonClicks));

    // Call the tracking callback if provided
    if (onTrack) {
      onTrack(buttonId, buttonText);
    }

    // Call original onClick if it exists
    if (buttonProps.onClick) {
      buttonProps.onClick(event);
    }

    // Send to analytics (in a real app, this would be your analytics service)
    console.log('Button tracked:', clickData);
  };

  return (
    <Button
      {...buttonProps}
      onClick={handleClick}
      className={className}
      data-button-id={buttonId}
      data-button-text={buttonText}
      data-variant={variant}
      data-page={pageName}
    >
      {children}
    </Button>
  );
}

// Higher-order component for automatic button tracking
export function withButtonTracking<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  buttonId: string,
  buttonText: string
) {
  return function TrackedButtonComponent(props: P & {
    variant: ABVariant;
    userId: string;
    sessionId: string;
    pageName: string;
    onTrack?: (buttonId: string, buttonText: string) => void;
  }) {
    const { variant, userId, sessionId, pageName, onTrack, ...otherProps } = props;

    const handleTrack = () => {
      const clickData = {
        buttonId,
        buttonText,
        pageName,
        variant,
        userId,
        sessionId,
        timestamp: Date.now()
      };

      const stored = localStorage.getItem('button_click_tracking') || '[]';
      const buttonClicks = JSON.parse(stored);
      buttonClicks.push(clickData);
      localStorage.setItem('button_click_tracking', JSON.stringify(buttonClicks));

      if (onTrack) {
        onTrack(buttonId, buttonText);
      }
    };

    return (
      <div onClick={handleTrack}>
        <WrappedComponent {...(otherProps as P)} />
      </div>
    );
  };
}

// Hook for programmatic button tracking
export function useButtonTracking(
  variant: ABVariant,
  userId: string,
  sessionId: string,
  pageName: string
) {
  const trackButton = (buttonId: string, buttonText: string, additionalData?: any) => {
    const clickData = {
      buttonId,
      buttonText,
      pageName,
      variant,
      userId,
      sessionId,
      timestamp: Date.now(),
      ...additionalData
    };

    // Store locally
    const stored = localStorage.getItem('button_click_tracking') || '[]';
    const buttonClicks = JSON.parse(stored);
    buttonClicks.push(clickData);
    localStorage.setItem('button_click_tracking', JSON.stringify(buttonClicks));

    // In a real app, also send to your analytics service
    console.log('Button tracked programmatically:', clickData);
  };

  return { trackButton };
}