import { useEffect, useRef, useState, useCallback } from 'react';
import { performanceUtils, createTrace, pageMetricsService, buttonMetricsService } from '../services/firebase';
import type { ABVariant } from '../App';

interface UsePerformanceTrackingProps {
  variant: ABVariant;
  userId: string;
  sessionId: string;
  pageName: string;
}

export const usePerformanceTracking = ({ variant, userId, sessionId, pageName }: UsePerformanceTrackingProps) => {
  const [renderTime, setRenderTime] = useState<number>(0);
  const [loadTime, setLoadTime] = useState<number>(0);
  const [isHeavyPage, setIsHeavyPage] = useState<boolean>(false);
  const pageLoadMeasurer = useRef<{ end: () => number } | null>(null);
  const renderStartTime = useRef<number>(0);
  const buttonClickCounts = useRef<Record<string, number>>({});

  // Start measuring page load time
  useEffect(() => {
    pageLoadMeasurer.current = performanceUtils.measurePageLoad(pageName);
    renderStartTime.current = (typeof window !== 'undefined' && window.performance?.now) ? 
      window.performance.now() : Date.now();

    // Create Firebase Performance trace
    const pageTrace = createTrace(`page_${pageName}_${variant}`);
    if (pageTrace) {
      try {
        pageTrace.start();
      } catch (error) {
        console.warn('Failed to start performance trace:', error);
      }
    }

    return () => {
      if (pageTrace) {
        try {
          pageTrace.stop();
        } catch (error) {
          console.warn('Failed to stop performance trace:', error);
        }
      }
    };
  }, [pageName, variant]);

  // Measure render completion
  useEffect(() => {
    const measureRender = () => {
      const renderEndTime = (typeof window !== 'undefined' && window.performance?.now) ? 
        window.performance.now() : Date.now();
      const calculatedRenderTime = renderEndTime - renderStartTime.current;
      setRenderTime(calculatedRenderTime);

      // Consider a page "heavy" if it takes more than 2 seconds to render
      const isHeavy = calculatedRenderTime > 2000;
      setIsHeavyPage(isHeavy);

      // End page load measurement
      if (pageLoadMeasurer.current) {
        const calculatedLoadTime = pageLoadMeasurer.current.end();
        setLoadTime(calculatedLoadTime);

        // Send page metrics to Firebase
        pageMetricsService.create({
          pageName,
          variant,
          userId,
          sessionId,
          loadTime: calculatedLoadTime,
          renderTime: calculatedRenderTime,
          errorOccurred: false
        }).catch((error) => {
          console.warn('Failed to save page metrics:', error);
        });
      }
    };

    // Use requestAnimationFrame to ensure DOM is ready
    if (typeof window !== 'undefined') {
      const rafId = requestAnimationFrame(measureRender);
      return () => cancelAnimationFrame(rafId);
    } else {
      // Fallback for server-side rendering
      const timeout = setTimeout(measureRender, 100);
      return () => clearTimeout(timeout);
    }
  }, [pageName, variant, userId, sessionId]);

  // Track button clicks
  const trackButtonClick = useCallback((buttonId: string, buttonText: string) => {
    buttonClickCounts.current[buttonId] = (buttonClickCounts.current[buttonId] || 0) + 1;

    // Send button click to Firebase
    buttonMetricsService.create({
      buttonId,
      buttonText,
      pageName,
      variant,
      userId,
      sessionId
    }).catch((error) => {
      console.warn('Failed to save button metrics:', error);
    });
  }, [pageName, variant, userId, sessionId]);

  // Track page access patterns
  const trackPageAccess = useCallback(() => {
    const now = Date.now();
    const accessData = {
      pageName,
      variant,
      userId,
      sessionId,
      timestamp: now,
      renderTime,
      loadTime,
      isHeavy: isHeavyPage
    };

    // Store in localStorage for fallback
    const stored = localStorage.getItem('page_access_tracking') || '[]';
    const pageAccesses = JSON.parse(stored);
    pageAccesses.push(accessData);
    localStorage.setItem('page_access_tracking', JSON.stringify(pageAccesses));
  }, [pageName, variant, userId, sessionId, renderTime, loadTime, isHeavyPage]);

  // Track page access on mount
  useEffect(() => {
    trackPageAccess();
  }, [trackPageAccess]);

  // Monitor performance issues
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleError = (event: ErrorEvent) => {
      console.error('Page error detected:', event.error);
      
      // Send error metrics
      pageMetricsService.create({
        pageName,
        variant,
        userId,
        sessionId,
        loadTime: loadTime || 0,
        renderTime: renderTime || 0,
        errorOccurred: true
      }).catch((error) => {
        console.warn('Failed to save error metrics:', error);
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [pageName, variant, userId, sessionId, loadTime, renderTime]);

  return {
    renderTime,
    loadTime,
    isHeavyPage,
    trackButtonClick,
    buttonClickCounts: buttonClickCounts.current
  };
};

// Hook for tracking Core Web Vitals
export const useWebVitals = (variant: ABVariant, userId: string, sessionId: string) => {
  const [vitals, setVitals] = useState({
    lcp: 0,
    fid: 0,
    cls: 0,
    tti: 0
  });

  useEffect(() => {
    performanceUtils.getCoreWebVitals().then((webVitals) => {
      setVitals(webVitals);
      
      // Store vitals data for dashboard
      const vitalsData = {
        variant,
        userId,
        sessionId,
        timestamp: Date.now(),
        ...webVitals
      };
      
      const stored = localStorage.getItem('web_vitals_tracking') || '[]';
      const allVitals = JSON.parse(stored);
      allVitals.push(vitalsData);
      localStorage.setItem('web_vitals_tracking', JSON.stringify(allVitals));
    });
  }, [variant, userId, sessionId]);

  return vitals;
};

// Hook for network monitoring
export const useNetworkMonitoring = () => {
  const [networkInfo, setNetworkInfo] = useState({
    effectiveType: '4g',
    downlink: 0,
    rtt: 0,
    saveData: false
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && 'connection' in navigator) {
      try {
        const connection = (navigator as any).connection;
        
        const updateNetworkInfo = () => {
          setNetworkInfo({
            effectiveType: connection.effectiveType || '4g',
            downlink: connection.downlink || 10,
            rtt: connection.rtt || 50,
            saveData: connection.saveData || false
          });
        };

        updateNetworkInfo();
        connection.addEventListener('change', updateNetworkInfo);

        return () => {
          connection.removeEventListener('change', updateNetworkInfo);
        };
      } catch (error) {
        console.warn('Network connection API not available:', error);
        // Set fallback values
        setNetworkInfo({
          effectiveType: '4g',
          downlink: 10,
          rtt: 50,
          saveData: false
        });
      }
    } else {
      // Fallback for environments without connection API
      setNetworkInfo({
        effectiveType: '4g',
        downlink: 10,
        rtt: 50,
        saveData: false
      });
    }
  }, []);

  return networkInfo;
};

// Hook for memory monitoring
export const useMemoryMonitoring = () => {
  const [memoryInfo, setMemoryInfo] = useState({
    usedJSHeapSize: 0,
    totalJSHeapSize: 0,
    jsHeapSizeLimit: 0
  });

  useEffect(() => {
    const updateMemoryInfo = () => {
      if (typeof window !== 'undefined' && 'memory' in performance) {
        try {
          const memory = (performance as any).memory;
          setMemoryInfo({
            usedJSHeapSize: memory.usedJSHeapSize || 0,
            totalJSHeapSize: memory.totalJSHeapSize || 0,
            jsHeapSizeLimit: memory.jsHeapSizeLimit || 0
          });
        } catch (error) {
          console.warn('Memory info not available:', error);
          // Provide fallback values
          setMemoryInfo({
            usedJSHeapSize: 10 * 1024 * 1024, // 10MB fallback
            totalJSHeapSize: 15 * 1024 * 1024, // 15MB fallback
            jsHeapSizeLimit: 100 * 1024 * 1024 // 100MB fallback
          });
        }
      } else {
        // Provide fallback values for environments without memory API
        setMemoryInfo({
          usedJSHeapSize: 8 * 1024 * 1024, // 8MB fallback
          totalJSHeapSize: 12 * 1024 * 1024, // 12MB fallback
          jsHeapSizeLimit: 80 * 1024 * 1024 // 80MB fallback
        });
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return memoryInfo;
};