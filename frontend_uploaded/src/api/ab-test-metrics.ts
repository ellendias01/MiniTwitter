// Mock API endpoint for A/B test metrics
// In a real application, this would be implemented in your backend

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

// Simulate network delay
const simulateNetworkDelay = (ms: number = 200) => 
  new Promise(resolve => setTimeout(resolve, ms));

// Mock database storage
let mockDatabase: any[] = [];

// POST /api/ab-test-metrics - Create new metrics
export async function createMetrics(metricsData: any): Promise<APIResponse> {
  await simulateNetworkDelay();
  
  try {
    const newEntry = {
      id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...metricsData,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    mockDatabase.push(newEntry);
    
    return {
      success: true,
      data: newEntry,
      timestamp: Date.now()
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to create metrics',
      timestamp: Date.now()
    };
  }
}

// GET /api/ab-test-metrics - Retrieve metrics
export async function getMetrics(params?: {
  variant?: 'A' | 'B';
  userId?: string;
  startDate?: number;
  endDate?: number;
  limit?: number;
}): Promise<APIResponse> {
  await simulateNetworkDelay();
  
  try {
    let filteredData = [...mockDatabase];
    
    if (params?.variant) {
      filteredData = filteredData.filter(item => item.variant === params.variant);
    }
    
    if (params?.userId) {
      filteredData = filteredData.filter(item => item.userId === params.userId);
    }
    
    if (params?.startDate) {
      filteredData = filteredData.filter(item => item.timestamp >= params.startDate);
    }
    
    if (params?.endDate) {
      filteredData = filteredData.filter(item => item.timestamp <= params.endDate);
    }
    
    if (params?.limit) {
      filteredData = filteredData.slice(0, params.limit);
    }
    
    return {
      success: true,
      data: filteredData,
      timestamp: Date.now()
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to retrieve metrics',
      timestamp: Date.now()
    };
  }
}

// PUT /api/ab-test-metrics/:id - Update metrics
export async function updateMetrics(id: string, updates: any): Promise<APIResponse> {
  await simulateNetworkDelay();
  
  try {
    const index = mockDatabase.findIndex(item => item.id === id);
    
    if (index === -1) {
      return {
        success: false,
        error: 'Metrics not found',
        timestamp: Date.now()
      };
    }
    
    mockDatabase[index] = {
      ...mockDatabase[index],
      ...updates,
      updatedAt: Date.now()
    };
    
    return {
      success: true,
      data: mockDatabase[index],
      timestamp: Date.now()
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to update metrics',
      timestamp: Date.now()
    };
  }
}

// DELETE /api/ab-test-metrics/:id - Delete metrics
export async function deleteMetrics(id: string): Promise<APIResponse> {
  await simulateNetworkDelay();
  
  try {
    const index = mockDatabase.findIndex(item => item.id === id);
    
    if (index === -1) {
      return {
        success: false,
        error: 'Metrics not found',
        timestamp: Date.now()
      };
    }
    
    const deletedItem = mockDatabase.splice(index, 1)[0];
    
    return {
      success: true,
      data: deletedItem,
      timestamp: Date.now()
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to delete metrics',
      timestamp: Date.now()
    };
  }
}

// POST /api/ab-test-metrics/batch - Batch operations
export async function batchCreateMetrics(metricsArray: any[]): Promise<APIResponse> {
  await simulateNetworkDelay(500); // Longer delay for batch operations
  
  try {
    const results = [];
    
    for (const metricsData of metricsArray) {
      const newEntry = {
        id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...metricsData,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      mockDatabase.push(newEntry);
      results.push(newEntry);
    }
    
    return {
      success: true,
      data: results,
      timestamp: Date.now()
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to batch create metrics',
      timestamp: Date.now()
    };
  }
}

// GET /api/ab-test-metrics/analytics - Get analytics data
export async function getAnalytics(params?: {
  variant?: 'A' | 'B';
  timeframe?: 'hour' | 'day' | 'week' | 'month';
}): Promise<APIResponse> {
  await simulateNetworkDelay();
  
  try {
    let data = [...mockDatabase];
    
    if (params?.variant) {
      data = data.filter(item => item.variant === params.variant);
    }
    
    // Calculate analytics
    const analytics = {
      totalSessions: data.length,
      averageSessionDuration: data.reduce((sum, item) => sum + (item.sessionDuration || 0), 0) / data.length,
      topPages: calculateTopPages(data),
      topButtons: calculateTopButtons(data),
      performanceMetrics: calculatePerformanceMetrics(data),
      errorRate: calculateErrorRate(data),
      conversionRate: calculateConversionRate(data)
    };
    
    return {
      success: true,
      data: analytics,
      timestamp: Date.now()
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to calculate analytics',
      timestamp: Date.now()
    };
  }
}

// Helper functions for analytics
function calculateTopPages(data: any[]) {
  const pageViews: Record<string, number> = {};
  
  data.forEach(item => {
    if (item.pageViews) {
      Object.keys(item.pageViews).forEach(page => {
        pageViews[page] = (pageViews[page] || 0) + item.pageViews[page].count;
      });
    }
  });
  
  return Object.entries(pageViews)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([page, views]) => ({ page, views }));
}

function calculateTopButtons(data: any[]) {
  const buttonClicks: Record<string, number> = {};
  
  data.forEach(item => {
    if (item.buttonClicks) {
      Object.keys(item.buttonClicks).forEach(button => {
        buttonClicks[button] = (buttonClicks[button] || 0) + item.buttonClicks[button];
      });
    }
  });
  
  return Object.entries(buttonClicks)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([button, clicks]) => ({ button, clicks }));
}

function calculatePerformanceMetrics(data: any[]) {
  const loadTimes: number[] = [];
  const renderTimes: number[] = [];
  
  data.forEach(item => {
    if (item.pageLoadTimes) {
      Object.values(item.pageLoadTimes).forEach((times: any) => {
        if (Array.isArray(times)) {
          loadTimes.push(...times);
        }
      });
    }
    
    if (item.performanceMetrics?.pageRenderTime) {
      Object.values(item.performanceMetrics.pageRenderTime).forEach((time: any) => {
        if (typeof time === 'number') {
          renderTimes.push(time);
        }
      });
    }
  });
  
  return {
    avgLoadTime: loadTimes.length ? loadTimes.reduce((a, b) => a + b) / loadTimes.length : 0,
    avgRenderTime: renderTimes.length ? renderTimes.reduce((a, b) => a + b) / renderTimes.length : 0,
    slowPagesPercentage: loadTimes.filter(time => time > 2000).length / Math.max(loadTimes.length, 1) * 100
  };
}

function calculateErrorRate(data: any[]) {
  const totalSessions = data.length;
  const errorSessions = data.filter(item => item.errorCount > 0).length;
  
  return totalSessions ? (errorSessions / totalSessions) * 100 : 0;
}

function calculateConversionRate(data: any[]) {
  const totalSessions = data.length;
  const convertedSessions = data.filter(item => item.postsCreated > 0).length;
  
  return totalSessions ? (convertedSessions / totalSessions) * 100 : 0;
}

// Export all functions for use in the application
export const abTestAPI = {
  create: createMetrics,
  get: getMetrics,
  update: updateMetrics,
  delete: deleteMetrics,
  batchCreate: batchCreateMetrics,
  getAnalytics: getAnalytics
};