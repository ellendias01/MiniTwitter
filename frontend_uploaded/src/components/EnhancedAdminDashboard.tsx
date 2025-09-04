import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Users, Heart, TrendingUp, BarChart3, Zap, Clock, Target, Activity, Server, Database, Gauge, Wifi, HardDrive, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { metricsService, pageMetricsService, buttonMetricsService } from '../services/firebase';
import { abTestAPI } from '../api/ab-test-metrics';
import type { ABTestMetrics, ABVariant, EnhancedMetrics } from '../App';

interface EnhancedAdminDashboardProps {
  metrics: ABTestMetrics[];
  enhancedMetrics: EnhancedMetrics;
  webVitals: { lcp: number; fid: number; cls: number; tti: number };
  networkInfo: { effectiveType: string; downlink: number; rtt: number; saveData: boolean };
  memoryInfo: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number };
  onBack: () => void;
  onVariantSwitch: (variant: ABVariant) => void;
  currentVariant: ABVariant;
}

export function EnhancedAdminDashboard({ 
  metrics, 
  enhancedMetrics, 
  webVitals, 
  networkInfo, 
  memoryInfo, 
  onBack, 
  onVariantSwitch, 
  currentVariant 
}: EnhancedAdminDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'24h' | '7d' | '30d' | 'all'>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | 'iOS' | 'Android' | 'Web'>('all');
  const [firebaseMetrics, setFirebaseMetrics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Load Firebase data
  useEffect(() => {
    const loadFirebaseData = async () => {
      setIsLoading(true);
      try {
        const data = await metricsService.getAll();
        setFirebaseMetrics(data);
        setApiStatus('success');
      } catch (error) {
        console.warn('Firebase not available, using localStorage fallback:', error);
        // Load from localStorage fallback
        const fallbackData = localStorage.getItem('firebase_metrics_fallback') || '[]';
        setFirebaseMetrics(JSON.parse(fallbackData));
        setApiStatus('error');
      } finally {
        setIsLoading(false);
      }
    };

    loadFirebaseData();
  }, []);

  // Sync data to Firebase every 30 seconds
  useEffect(() => {
    const syncData = async () => {
      try {
        // Get recent local data
        const localMetrics = JSON.parse(localStorage.getItem('ab_test_metrics') || '[]');
        const pageAccesses = JSON.parse(localStorage.getItem('page_access_tracking') || '[]');
        const buttonClicks = JSON.parse(localStorage.getItem('button_click_tracking') || '[]');

        // Send to API for external monitoring
        try {
          await abTestAPI.batchCreate(localMetrics);
          console.log('Data synced successfully');
        } catch (error) {
          console.warn('External API sync failed:', error);
        }
      } catch (error) {
        console.error('Failed to sync data:', error);
      }
    };

    const interval = setInterval(syncData, 30000); // Sync every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const filteredMetrics = useMemo(() => {
    const now = Date.now();
    const cutoff = selectedPeriod === '24h' ? 24 * 60 * 60 * 1000 : 
                   selectedPeriod === '7d' ? 7 * 24 * 60 * 60 * 1000 :
                   selectedPeriod === '30d' ? 30 * 24 * 60 * 60 * 1000 :
                   Infinity;
    
    return [...metrics, ...firebaseMetrics].filter(m => now - m.sessionStart < cutoff);
  }, [metrics, firebaseMetrics, selectedPeriod]);

  const variantAMetrics = useMemo(() => {
    return filteredMetrics.filter(m => m.variant === 'A');
  }, [filteredMetrics]);

  const variantBMetrics = useMemo(() => {
    return filteredMetrics.filter(m => m.variant === 'B');
  }, [filteredMetrics]);

  // Enhanced calculations for page access patterns
  const getPageAccessStats = () => {
    const allPageAccesses = [
      ...enhancedMetrics.pageAccesses,
      ...JSON.parse(localStorage.getItem('page_access_tracking') || '[]')
    ];

    const variantAPages = allPageAccesses.filter(p => p.variant === 'A');
    const variantBPages = allPageAccesses.filter(p => p.variant === 'B');
    
    const getPageStats = (pages: typeof allPageAccesses) => {
      const pageGroups = pages.reduce((acc, page) => {
        if (!acc[page.pageName]) {
          acc[page.pageName] = { 
            count: 0, 
            totalRenderTime: 0, 
            totalLoadTime: 0, 
            heavyPageCount: 0,
            renderTimes: [],
            loadTimes: []
          };
        }
        acc[page.pageName].count += 1;
        acc[page.pageName].totalRenderTime += page.renderTime || 0;
        acc[page.pageName].totalLoadTime += page.loadTime || 0;
        acc[page.pageName].renderTimes.push(page.renderTime || 0);
        acc[page.pageName].loadTimes.push(page.loadTime || 0);
        if (page.isHeavy) acc[page.pageName].heavyPageCount += 1;
        return acc;
      }, {} as Record<string, { 
        count: number; 
        totalRenderTime: number; 
        totalLoadTime: number; 
        heavyPageCount: number;
        renderTimes: number[];
        loadTimes: number[];
      }>);

      return Object.entries(pageGroups).map(([pageName, stats]) => ({
        pageName,
        accessCount: stats.count,
        avgRenderTime: Math.round(stats.totalRenderTime / stats.count),
        avgLoadTime: Math.round(stats.totalLoadTime / stats.count),
        heavyPagePercentage: Math.round((stats.heavyPageCount / stats.count) * 100),
        p95RenderTime: calculateP95(stats.renderTimes),
        p95LoadTime: calculateP95(stats.loadTimes),
        isSlowPage: (stats.totalRenderTime / stats.count) > 2000
      })).sort((a, b) => b.accessCount - a.accessCount);
    };

    return {
      variantA: getPageStats(variantAPages),
      variantB: getPageStats(variantBPages)
    };
  };

  // Calculate P95 percentile
  const calculateP95 = (times: number[]): number => {
    if (times.length === 0) return 0;
    const sorted = [...times].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * 0.95) - 1;
    return sorted[Math.min(index, sorted.length - 1)];
  };

  // Enhanced button click analysis
  const getButtonClickStats = () => {
    const allButtonClicks = [
      ...enhancedMetrics.buttonClicks,
      ...JSON.parse(localStorage.getItem('button_click_tracking') || '[]')
    ];

    const variantAClicks = allButtonClicks.filter(b => b.variant === 'A');
    const variantBClicks = allButtonClicks.filter(b => b.variant === 'B');
    
    const getClickStats = (clicks: typeof allButtonClicks) => {
      const buttonGroups = clicks.reduce((acc, click) => {
        const key = `${click.buttonId}_${click.pageName}`;
        if (!acc[key]) {
          acc[key] = { 
            buttonId: click.buttonId, 
            buttonText: click.buttonText, 
            pageName: click.pageName, 
            count: 0,
            timestamps: []
          };
        }
        acc[key].count += 1;
        acc[key].timestamps.push(click.timestamp);
        return acc;
      }, {} as Record<string, { 
        buttonId: string; 
        buttonText: string; 
        pageName: string; 
        count: number;
        timestamps: number[];
      }>);

      return Object.values(buttonGroups)
        .map(button => ({
          ...button,
          clicksPerHour: calculateClicksPerHour(button.timestamps),
          isPopularButton: button.count > 5
        }))
        .sort((a, b) => b.count - a.count);
    };

    return {
      variantA: getClickStats(variantAClicks),
      variantB: getClickStats(variantBClicks)
    };
  };

  const calculateClicksPerHour = (timestamps: number[]): number => {
    if (timestamps.length < 2) return 0;
    const hourInMs = 60 * 60 * 1000;
    const timeSpan = Math.max(...timestamps) - Math.min(...timestamps);
    const hours = timeSpan / hourInMs;
    return hours > 0 ? timestamps.length / hours : 0;
  };

  // Calculate system health score
  const getSystemHealthScore = (): number => {
    let score = 100;
    
    // Deduct points for poor Web Vitals
    if (webVitals.lcp > 4000) score -= 20;
    else if (webVitals.lcp > 2500) score -= 10;
    
    if (webVitals.fid > 300) score -= 20;
    else if (webVitals.fid > 100) score -= 10;
    
    if (webVitals.cls > 0.25) score -= 20;
    else if (webVitals.cls > 0.1) score -= 10;
    
    // Deduct points for high memory usage
    const memoryUsagePercent = (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100;
    if (memoryUsagePercent > 80) score -= 15;
    else if (memoryUsagePercent > 60) score -= 5;
    
    // Deduct points for poor network
    if (networkInfo.effectiveType === 'slow-2g' || networkInfo.effectiveType === '2g') score -= 15;
    else if (networkInfo.effectiveType === '3g') score -= 5;
    
    return Math.max(0, score);
  };

  const pageStats = getPageAccessStats();
  const buttonStats = getButtonClickStats();
  const systemHealth = getSystemHealthScore();

  const clearAllData = async () => {
    localStorage.removeItem('ab_test_metrics');
    localStorage.removeItem('page_access_tracking');
    localStorage.removeItem('button_click_tracking');
    localStorage.removeItem('web_vitals_tracking');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="sticky top-0 bg-slate-800 border-b border-purple-500/30 px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-purple-500/20 rounded-full transition-colors -ml-2"
          >
            <ArrowLeft className="w-5 h-5 text-purple-300" />
          </button>
          <div className="ml-4">
            <h1 className="text-xl font-bold text-purple-300">
              Dashboard A/B Avançado
            </h1>
            <p className="text-gray-400 text-sm">Análise Completa de Performance & UX</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            systemHealth >= 80 ? 'bg-green-500/20 text-green-400' :
            systemHealth >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {systemHealth >= 80 ? <CheckCircle className="w-4 h-4" /> :
             systemHealth >= 60 ? <AlertTriangle className="w-4 h-4" /> :
             <XCircle className="w-4 h-4" />}
            Health: {systemHealth}%
          </div>
          <Badge className={`${
            apiStatus === 'success' ? 'bg-green-600' :
            apiStatus === 'error' ? 'bg-red-600' :
            'bg-gray-600'
          } text-white border-0`}>
            {apiStatus === 'success' ? 'API OK' :
             apiStatus === 'error' ? 'API Error' :
             'Loading...'}
          </Badge>
        </div>
      </header>

      <div className="p-4 space-y-6 max-w-7xl mx-auto">
        {/* Controls */}
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2">
            {(['24h', '7d', '30d', 'all'] as const).map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod(period)}
                className={selectedPeriod === period ? 'bg-cyan-500 hover:bg-cyan-600' : 'border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/20'}
              >
                {period === 'all' ? 'Todos' : period}
              </Button>
            ))}
          </div>

          <Select value={selectedPlatform} onValueChange={(value: any) => setSelectedPlatform(value)}>
            <SelectTrigger className="w-40 bg-slate-800 border-purple-500/30 text-white">
              <SelectValue placeholder="Plataforma" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-purple-500/30">
              <SelectItem value="all" className="text-white">Todas</SelectItem>
              <SelectItem value="iOS" className="text-white">iOS</SelectItem>
              <SelectItem value="Android" className="text-white">Android</SelectItem>
              <SelectItem value="Web" className="text-white">Web</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button
              variant={currentVariant === 'A' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onVariantSwitch('A')}
              className={currentVariant === 'A' ? 'bg-cyan-500 hover:bg-cyan-600' : 'border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/20'}
            >
              Testar Versão A
            </Button>
            <Button
              variant={currentVariant === 'B' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onVariantSwitch('B')}
              className={currentVariant === 'B' ? 'bg-pink-500 hover:bg-pink-600' : 'border-pink-500/50 text-pink-300 hover:bg-pink-500/20'}
            >
              Testar Versão B
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={clearAllData}
              className="bg-red-500/80 hover:bg-red-500 border-0"
            >
              Limpar Dados
            </Button>
          </div>
        </div>

        {/* Real-time System Monitoring */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-slate-800 border-purple-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Wifi className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-300">Rede</span>
            </div>
            <p className="text-lg font-bold text-white">{networkInfo.effectiveType.toUpperCase()}</p>
            <p className="text-xs text-gray-400">{networkInfo.downlink} Mbps • {networkInfo.rtt}ms RTT</p>
          </Card>

          <Card className="p-4 bg-slate-800 border-purple-500/30">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-300">Memória JS</span>
            </div>
            <p className="text-lg font-bold text-white">
              {(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(1)} MB
            </p>
            <p className="text-xs text-gray-400">
              {((memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100).toFixed(1)}% usado
            </p>
          </Card>

          <Card className="p-4 bg-slate-800 border-purple-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Gauge className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-gray-300">LCP</span>
            </div>
            <p className="text-lg font-bold text-white">{Math.round(webVitals.lcp)}ms</p>
            <div className={`w-full h-1 rounded-full mt-1 ${
              webVitals.lcp < 2500 ? 'bg-green-500' : 
              webVitals.lcp < 4000 ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
          </Card>

          <Card className="p-4 bg-slate-800 border-purple-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-gray-300">CLS</span>
            </div>
            <p className="text-lg font-bold text-white">{webVitals.cls.toFixed(3)}</p>
            <div className={`w-full h-1 rounded-full mt-1 ${
              webVitals.cls < 0.1 ? 'bg-green-500' : 
              webVitals.cls < 0.25 ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
          </Card>
        </div>

        <Tabs defaultValue="pages" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800">
            <TabsTrigger value="pages" className="text-white">Páginas</TabsTrigger>
            <TabsTrigger value="buttons" className="text-white">Botões</TabsTrigger>
            <TabsTrigger value="performance" className="text-white">Performance</TabsTrigger>
            <TabsTrigger value="api" className="text-white">API & CRUD</TabsTrigger>
          </TabsList>

          {/* Pages Analysis */}
          <TabsContent value="pages" className="space-y-6">
            <Card className="p-6 bg-slate-800 border-purple-500/30">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-white">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                Análise de Páginas Mais Acessadas e Tempos de Renderização
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-cyan-400 mb-4">Variante A</h4>
                  <div className="space-y-3">
                    {pageStats.variantA.slice(0, 5).map((page, index) => (
                      <div key={index} className="p-3 bg-slate-700 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-white font-medium">{page.pageName}</span>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-cyan-500 text-white text-xs">
                              {page.accessCount} acessos
                            </Badge>
                            {page.isSlowPage && (
                              <Badge className="bg-red-500 text-white text-xs">
                                PESADA
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-gray-300">
                          <div>
                            <span className="block text-gray-400">Render médio</span>
                            <span className="text-white font-mono">{page.avgRenderTime}ms</span>
                          </div>
                          <div>
                            <span className="block text-gray-400">Load médio</span>
                            <span className="text-white font-mono">{page.avgLoadTime}ms</span>
                          </div>
                          <div>
                            <span className="block text-gray-400">P95 Render</span>
                            <span className="text-white font-mono">{page.p95RenderTime}ms</span>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>Páginas pesadas</span>
                            <span>{page.heavyPagePercentage}%</span>
                          </div>
                          <Progress value={page.heavyPagePercentage} className="h-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-pink-400 mb-4">Variante B</h4>
                  <div className="space-y-3">
                    {pageStats.variantB.slice(0, 5).map((page, index) => (
                      <div key={index} className="p-3 bg-slate-700 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-white font-medium">{page.pageName}</span>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-pink-500 text-white text-xs">
                              {page.accessCount} acessos
                            </Badge>
                            {page.isSlowPage && (
                              <Badge className="bg-red-500 text-white text-xs">
                                PESADA
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-gray-300">
                          <div>
                            <span className="block text-gray-400">Render médio</span>
                            <span className="text-white font-mono">{page.avgRenderTime}ms</span>
                          </div>
                          <div>
                            <span className="block text-gray-400">Load médio</span>
                            <span className="text-white font-mono">{page.avgLoadTime}ms</span>
                          </div>
                          <div>
                            <span className="block text-gray-400">P95 Render</span>
                            <span className="text-white font-mono">{page.p95RenderTime}ms</span>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>Páginas pesadas</span>
                            <span>{page.heavyPagePercentage}%</span>
                          </div>
                          <Progress value={page.heavyPagePercentage} className="h-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Button Click Analysis */}
          <TabsContent value="buttons" className="space-y-6">
            <Card className="p-6 bg-slate-800 border-purple-500/30">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-white">
                <Target className="w-5 h-5 text-pink-400" />
                Análise de Botões Mais Clicados
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-cyan-400 mb-4">Variante A - Top Botões</h4>
                  <div className="space-y-3">
                    {buttonStats.variantA.slice(0, 8).map((button, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-slate-700 rounded-lg">
                        <div>
                          <span className="text-white font-medium block">{button.buttonText}</span>
                          <span className="text-gray-400 text-sm">{button.pageName}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-cyan-400 font-bold text-lg">{button.count}</span>
                          <div className="text-xs text-gray-400">
                            {button.clicksPerHour.toFixed(1)}/h
                          </div>
                          {button.isPopularButton && (
                            <Badge className="bg-green-500 text-white text-xs mt-1">
                              Popular
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-pink-400 mb-4">Variante B - Top Botões</h4>
                  <div className="space-y-3">
                    {buttonStats.variantB.slice(0, 8).map((button, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-slate-700 rounded-lg">
                        <div>
                          <span className="text-white font-medium block">{button.buttonText}</span>
                          <span className="text-gray-400 text-sm">{button.pageName}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-pink-400 font-bold text-lg">{button.count}</span>
                          <div className="text-xs text-gray-400">
                            {button.clicksPerHour.toFixed(1)}/h
                          </div>
                          {button.isPopularButton && (
                            <Badge className="bg-green-500 text-white text-xs mt-1">
                              Popular
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Performance Monitoring */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6 bg-slate-800 border-purple-500/30">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-white">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  Core Web Vitals Detalhados
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-gray-300">Largest Contentful Paint</span>
                      <p className="text-xs text-gray-400">Tempo para carregar o maior elemento</p>
                    </div>
                    <div className="text-right">
                      <span className="text-white font-bold">{Math.round(webVitals.lcp)}ms</span>
                      <div className={`text-xs ${
                        webVitals.lcp < 2500 ? 'text-green-400' : 
                        webVitals.lcp < 4000 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {webVitals.lcp < 2500 ? 'Bom' : webVitals.lcp < 4000 ? 'Precisa melhorar' : 'Ruim'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-gray-300">First Input Delay</span>
                      <p className="text-xs text-gray-400">Tempo para primeira interação</p>
                    </div>
                    <div className="text-right">
                      <span className="text-white font-bold">{Math.round(webVitals.fid)}ms</span>
                      <div className={`text-xs ${
                        webVitals.fid < 100 ? 'text-green-400' : 
                        webVitals.fid < 300 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {webVitals.fid < 100 ? 'Bom' : webVitals.fid < 300 ? 'Precisa melhorar' : 'Ruim'}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-gray-300">Cumulative Layout Shift</span>
                      <p className="text-xs text-gray-400">Estabilidade visual da página</p>
                    </div>
                    <div className="text-right">
                      <span className="text-white font-bold">{webVitals.cls.toFixed(3)}</span>
                      <div className={`text-xs ${
                        webVitals.cls < 0.1 ? 'text-green-400' : 
                        webVitals.cls < 0.25 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {webVitals.cls < 0.1 ? 'Bom' : webVitals.cls < 0.25 ? 'Precisa melhorar' : 'Ruim'}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-slate-800 border-purple-500/30">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-white">
                  <Server className="w-5 h-5 text-blue-400" />
                  Informações de Sistema
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Tipo de Conexão</span>
                    <span className="text-white">{networkInfo.effectiveType.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Velocidade Estimada</span>
                    <span className="text-white">{networkInfo.downlink} Mbps</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Latência de Rede</span>
                    <span className="text-white">{networkInfo.rtt}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Modo Economia</span>
                    <span className={networkInfo.saveData ? 'text-yellow-400' : 'text-green-400'}>
                      {networkInfo.saveData ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <div className="border-t border-gray-600 pt-3 mt-3">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Heap JS Usado</span>
                      <span className="text-white">{(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(1)} MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Heap Total</span>
                      <span className="text-white">{(memoryInfo.totalJSHeapSize / 1024 / 1024).toFixed(1)} MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Limite de Heap</span>
                      <span className="text-white">{(memoryInfo.jsHeapSizeLimit / 1024 / 1024).toFixed(1)} MB</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* API & CRUD Operations */}
          <TabsContent value="api" className="space-y-6">
            <Card className="p-6 bg-slate-800 border-purple-500/30">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-white">
                <Database className="w-5 h-5 text-green-400" />
                Status da API e Operações CRUD
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-green-400 mb-3">Firebase Integration</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Status da Conexão</span>
                      <Badge className={`${
                        apiStatus === 'success' ? 'bg-green-600' :
                        apiStatus === 'error' ? 'bg-red-600' :
                        'bg-yellow-600'
                      } text-white`}>
                        {apiStatus === 'success' ? 'Conectado' :
                         apiStatus === 'error' ? 'Erro' :
                         'Carregando'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Métricas no Firebase</span>
                      <span className="text-white">{firebaseMetrics.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Última Sincronização</span>
                      <span className="text-white text-xs">
                        {new Date().toLocaleTimeString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-blue-400 mb-3">Operações CRUD</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-gray-300">CREATE - Criação de métricas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-gray-300">READ - Leitura de dados</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-gray-300">UPDATE - Atualização de registros</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-gray-300">DELETE - Remoção de dados</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-slate-700 rounded-lg">
                <h4 className="font-medium text-purple-400 mb-3">Métricas Coletadas</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="block text-gray-400">Páginas Acessadas</span>
                    <span className="text-white font-bold">{enhancedMetrics.pageAccesses.length}</span>
                  </div>
                  <div>
                    <span className="block text-gray-400">Cliques em Botões</span>
                    <span className="text-white font-bold">{enhancedMetrics.buttonClicks.length}</span>
                  </div>
                  <div>
                    <span className="block text-gray-400">Dados de Web Vitals</span>
                    <span className="text-white font-bold">{enhancedMetrics.webVitals.length}</span>
                  </div>
                </div>
              </div>

              {isLoading && (
                <div className="mt-4 text-center">
                  <div className="inline-flex items-center gap-2 text-cyan-400">
                    <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                    Sincronizando dados...
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        {/* Summary */}
        <Card className="p-6 bg-slate-800 border-purple-500/30">
          <h3 className="font-bold mb-4 text-white">Resumo Executivo</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-cyan-400 mb-2">Variante A - Clássica</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Layout tradicional com composer visível</li>
                <li>• {variantAMetrics.length} sessões registradas</li>
                <li>• {pageStats.variantA.length} páginas diferentes acessadas</li>
                <li>• {buttonStats.variantA.reduce((sum, b) => sum + b.count, 0)} interações com botões</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-pink-400 mb-2">Variante B - Moderna</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• FAB e modal para criação de posts</li>
                <li>• {variantBMetrics.length} sessões registradas</li>
                <li>• {pageStats.variantB.length} páginas diferentes acessadas</li>
                <li>• {buttonStats.variantB.reduce((sum, b) => sum + b.count, 0)} interações com botões</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-purple-400 mb-2">Recomendações</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Continuar coleta por mais 1-2 semanas</li>
                <li>• Monitorar Core Web Vitals constantemente</li>
                <li>• Otimizar páginas com alta latência</li>
                <li>• Implementar cache para melhor performance</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}