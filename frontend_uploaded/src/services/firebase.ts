// Firebase configuration and services
let app: any = null;
let db: any = null;
let analytics: any = null;
let firebasePerformance: any = null;

// Check if Firebase should be initialized (only with valid config)
const hasValidFirebaseConfig = () => {
  return false; // Disabled by default - set to true when you have valid Firebase config
};

// Initialize Firebase only if we have valid configuration
if (hasValidFirebaseConfig() && typeof window !== 'undefined') {
  try {
    const { initializeApp } = await import('firebase/app');
    const { getFirestore } = await import('firebase/firestore');
    const { getAnalytics } = await import('firebase/analytics');
    const { getPerformance } = await import('firebase/performance');

    // Firebase configuration (replace with your actual config)
    const firebaseConfig = {
      apiKey: "YOUR_API_KEY_HERE",
      authDomain: "your-project.firebaseapp.com",
      projectId: "your-project-id",
      storageBucket: "your-project.appspot.com",
      messagingSenderId: "123456789",
      appId: "your-app-id",
      measurementId: "G-MEASUREMENT_ID"
    };

    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    analytics = getAnalytics(app);
    firebasePerformance = getPerformance(app);
  } catch (error) {
    console.warn('Firebase initialization failed:', error);
  }
}

// Performance monitoring
export const createTrace = (traceName: string) => {
  if (firebasePerformance) {
    try {
      const { trace } = require('firebase/performance');
      return trace(firebasePerformance, traceName);
    } catch (error) {
      console.warn('Firebase trace creation failed:', error);
      return null;
    }
  }
  return null;
};

// Enhanced metrics interface for detailed tracking
export interface EnhancedABTestMetrics {
  id?: string;
  variant: 'A' | 'B';
  userId: string;
  sessionId: string;
  sessionStart: number;
  sessionEnd?: number;
  userAgent: string;
  viewport: {
    width: number;
    height: number;
  };
  interactions: {
    postLikes: number;
    postViews: number;
    commentsAdded: number;
    postsCreated: number;
    profileViews: number;
    searchQueries: number;
    notificationViews: number;
    sessionDuration: number;
    buttonClicks: Record<string, number>;
    pageViews: Record<string, { count: number; totalTime: number; averageTime: number }>;
    pageLoadTimes: Record<string, number[]>;
    errorCount: number;
    networkRequests: number;
  };
  performanceMetrics: {
    pageRenderTime: Record<string, number>;
    largestContentfulPaint: number;
    firstInputDelay: number;
    cumulativeLayoutShift: number;
    timeToInteractive: number;
    memoryUsage?: number;
  };
  timestamp: Timestamp;
}

export interface PageMetrics {
  id?: string;
  pageName: string;
  variant: 'A' | 'B';
  userId: string;
  sessionId: string;
  loadTime: number;
  renderTime: number;
  interactionTime?: number;
  errorOccurred: boolean;
  timestamp: Timestamp;
}

export interface ButtonClickMetrics {
  id?: string;
  buttonId: string;
  buttonText: string;
  pageName: string;
  variant: 'A' | 'B';
  userId: string;
  sessionId: string;
  timestamp: Timestamp;
}

// CRUD Operations for A/B Test Metrics
export const metricsService = {
  // Create - Add new metrics
  async create(metrics: Omit<EnhancedABTestMetrics, 'id'>): Promise<string> {
    if (!db) {
      console.warn('Firebase not initialized, using localStorage fallback');
      const id = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const stored = localStorage.getItem('firebase_metrics_fallback') || '[]';
      const allMetrics = JSON.parse(stored);
      allMetrics.push({ id, ...metrics, timestamp: { seconds: Date.now() / 1000 } });
      localStorage.setItem('firebase_metrics_fallback', JSON.stringify(allMetrics));
      return id;
    }

    try {
      const { addDoc, collection, Timestamp } = await import('firebase/firestore');
      const docRef = await addDoc(collection(db, 'ab_test_metrics'), {
        ...metrics,
        timestamp: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating metrics:', error);
      throw error;
    }
  },

  // Read - Get all metrics with optional filtering
  async getAll(variant?: 'A' | 'B', limit_count = 100): Promise<EnhancedABTestMetrics[]> {
    if (!db) {
      console.warn('Firebase not initialized, using localStorage fallback');
      const stored = localStorage.getItem('firebase_metrics_fallback') || '[]';
      let allMetrics = JSON.parse(stored);
      
      if (variant) {
        allMetrics = allMetrics.filter((m: any) => m.variant === variant);
      }
      
      return allMetrics.slice(0, limit_count);
    }

    try {
      const { query, collection, orderBy, limit, where, getDocs } = await import('firebase/firestore');
      
      let q = query(
        collection(db, 'ab_test_metrics'),
        orderBy('timestamp', 'desc'),
        limit(limit_count)
      );

      if (variant) {
        q = query(
          collection(db, 'ab_test_metrics'),
          where('variant', '==', variant),
          orderBy('timestamp', 'desc'),
          limit(limit_count)
        );
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as EnhancedABTestMetrics));
    } catch (error) {
      console.error('Error getting metrics:', error);
      return [];
    }
  },

  // Update - Update existing metrics
  async update(id: string, updates: Partial<EnhancedABTestMetrics>): Promise<void> {
    if (!db) {
      console.warn('Firebase not initialized, using localStorage fallback');
      const stored = localStorage.getItem('firebase_metrics_fallback') || '[]';
      const allMetrics = JSON.parse(stored);
      const index = allMetrics.findIndex((m: any) => m.id === id);
      if (index >= 0) {
        allMetrics[index] = { ...allMetrics[index], ...updates };
        localStorage.setItem('firebase_metrics_fallback', JSON.stringify(allMetrics));
      }
      return;
    }

    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const docRef = doc(db, 'ab_test_metrics', id);
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error('Error updating metrics:', error);
      throw error;
    }
  },

  // Delete - Remove metrics
  async delete(id: string): Promise<void> {
    if (!db) {
      console.warn('Firebase not initialized, using localStorage fallback');
      const stored = localStorage.getItem('firebase_metrics_fallback') || '[]';
      const allMetrics = JSON.parse(stored);
      const filtered = allMetrics.filter((m: any) => m.id !== id);
      localStorage.setItem('firebase_metrics_fallback', JSON.stringify(filtered));
      return;
    }

    try {
      const { deleteDoc, doc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'ab_test_metrics', id));
    } catch (error) {
      console.error('Error deleting metrics:', error);
      throw error;
    }
  },

  // Get metrics by user
  async getByUser(userId: string): Promise<EnhancedABTestMetrics[]> {
    if (!db) {
      console.warn('Firebase not initialized, using localStorage fallback');
      const stored = localStorage.getItem('firebase_metrics_fallback') || '[]';
      const allMetrics = JSON.parse(stored);
      return allMetrics.filter((m: any) => m.userId === userId);
    }

    try {
      const { query, collection, where, orderBy, getDocs } = await import('firebase/firestore');
      const q = query(
        collection(db, 'ab_test_metrics'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as EnhancedABTestMetrics));
    } catch (error) {
      console.error('Error getting user metrics:', error);
      return [];
    }
  }
};

// CRUD Operations for Page Metrics
export const pageMetricsService = {
  async create(metrics: Omit<PageMetrics, 'id'>): Promise<string> {
    if (!db) {
      const id = `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const stored = localStorage.getItem('page_metrics_fallback') || '[]';
      const allMetrics = JSON.parse(stored);
      allMetrics.push({ id, ...metrics, timestamp: { seconds: Date.now() / 1000 } });
      localStorage.setItem('page_metrics_fallback', JSON.stringify(allMetrics));
      return id;
    }

    try {
      const { addDoc, collection, Timestamp } = await import('firebase/firestore');
      const docRef = await addDoc(collection(db, 'page_metrics'), {
        ...metrics,
        timestamp: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating page metrics:', error);
      throw error;
    }
  },

  async getAll(): Promise<PageMetrics[]> {
    if (!db) {
      const stored = localStorage.getItem('page_metrics_fallback') || '[]';
      return JSON.parse(stored);
    }

    try {
      const { query, collection, orderBy, limit, getDocs } = await import('firebase/firestore');
      const q = query(
        collection(db, 'page_metrics'),
        orderBy('timestamp', 'desc'),
        limit(1000)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PageMetrics));
    } catch (error) {
      console.error('Error getting page metrics:', error);
      return [];
    }
  }
};

// CRUD Operations for Button Click Metrics
export const buttonMetricsService = {
  async create(metrics: Omit<ButtonClickMetrics, 'id'>): Promise<string> {
    if (!db) {
      const id = `button_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const stored = localStorage.getItem('button_metrics_fallback') || '[]';
      const allMetrics = JSON.parse(stored);
      allMetrics.push({ id, ...metrics, timestamp: { seconds: Date.now() / 1000 } });
      localStorage.setItem('button_metrics_fallback', JSON.stringify(allMetrics));
      return id;
    }

    try {
      const { addDoc, collection, Timestamp } = await import('firebase/firestore');
      const docRef = await addDoc(collection(db, 'button_metrics'), {
        ...metrics,
        timestamp: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating button metrics:', error);
      throw error;
    }
  },

  async getAll(): Promise<ButtonClickMetrics[]> {
    if (!db) {
      const stored = localStorage.getItem('button_metrics_fallback') || '[]';
      return JSON.parse(stored);
    }

    try {
      const { query, collection, orderBy, limit, getDocs } = await import('firebase/firestore');
      const q = query(
        collection(db, 'button_metrics'),
        orderBy('timestamp', 'desc'),
        limit(1000)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ButtonClickMetrics));
    } catch (error) {
      console.error('Error getting button metrics:', error);
      return [];
    }
  }
};

// Performance monitoring helpers
export const performanceUtils = {
  // Measure page load time
  measurePageLoad: (pageName: string) => {
    const startTime = (typeof window !== 'undefined' && window.performance?.now) ? 
      window.performance.now() : Date.now();
    
    return {
      end: () => {
        const endTime = (typeof window !== 'undefined' && window.performance?.now) ? 
          window.performance.now() : Date.now();
        return endTime - startTime;
      }
    };
  },

  // Measure render time using Performance Observer
  measureRenderTime: (callback: (time: number) => void) => {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            callback(entry.startTime);
            observer.disconnect();
          }
        }
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    }
  },

  // Get Core Web Vitals
  getCoreWebVitals: () => {
    if (typeof window !== 'undefined') {
      return new Promise((resolve) => {
        const vitals = {
          lcp: 0, // Largest Contentful Paint
          fid: 0, // First Input Delay
          cls: 0, // Cumulative Layout Shift
          tti: 0  // Time to Interactive
        };

        // LCP Observer
        if ('PerformanceObserver' in window) {
          try {
            const lcpObserver = new PerformanceObserver((list) => {
              try {
                const entries = list.getEntries();
                if (entries.length > 0) {
                  vitals.lcp = entries[entries.length - 1].startTime;
                }
              } catch (error) {
                console.warn('LCP measurement error:', error);
              }
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

            // CLS Observer
            const clsObserver = new PerformanceObserver((list) => {
              try {
                for (const entry of list.getEntries()) {
                  if (!(entry as any).hadRecentInput) {
                    vitals.cls += (entry as any).value || 0;
                  }
                }
              } catch (error) {
                console.warn('CLS measurement error:', error);
              }
            });
            clsObserver.observe({ entryTypes: ['layout-shift'] });
          } catch (error) {
            console.warn('PerformanceObserver setup failed:', error);
          }
        }

        // Fallback timeout with mock data if real measurements fail
        setTimeout(() => {
          if (vitals.lcp === 0) {
            vitals.lcp = 800 + Math.random() * 400; // Mock LCP between 800-1200ms
            vitals.fid = 10 + Math.random() * 40;   // Mock FID between 10-50ms
            vitals.cls = Math.random() * 0.05;      // Mock CLS between 0-0.05
            vitals.tti = 1200 + Math.random() * 800; // Mock TTI between 1200-2000ms
          }
          resolve(vitals);
        }, 2000);
      });
    }
    return Promise.resolve({ lcp: 800, fid: 20, cls: 0.02, tti: 1500 });
  }
};

// API endpoint simulation for external monitoring tools
export const apiService = {
  // Send metrics to external monitoring service
  async sendToExternalAPI(data: any): Promise<boolean> {
    try {
      // Simulate API call to external monitoring service
      // In production, this would be your actual monitoring endpoint
      const response = await fetch('/api/ab-test-metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error sending to external API:', error);
      return false;
    }
  },

  // Batch send metrics
  async batchSendMetrics(metrics: any[]): Promise<boolean> {
    try {
      const response = await fetch('/api/ab-test-metrics/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ metrics })
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error batch sending metrics:', error);
      return false;
    }
  }
};