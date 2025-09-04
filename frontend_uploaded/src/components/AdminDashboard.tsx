import React, { useState, useMemo } from 'react';
import { ArrowLeft, Users, Heart, TrendingUp, BarChart3, Zap, Clock, Target, Activity, Server, CheckCircle, AlertCircle } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import type { ABTestMetrics, ABVariant, EnhancedMetrics } from '../App';

interface AdminDashboardProps {
  metrics: ABTestMetrics[];
  enhancedMetrics: EnhancedMetrics;
  webVitals: { lcp: number; fid: number; cls: number; tti: number };
  networkInfo: { effectiveType: string; downlink: number; rtt: number; saveData: boolean };
  memoryInfo: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number };
  onBack: () => void;
  onVariantSwitch: (variant: ABVariant) => void;
  currentVariant: ABVariant;
}

export function AdminDashboard({ metrics, enhancedMetrics, webVitals, networkInfo, memoryInfo, onBack, onVariantSwitch, currentVariant }: AdminDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'24h' | '7d' | '30d' | 'all'>('all');


  const filteredMetrics = useMemo(() => {
    const now = Date.now();
    const cutoff = selectedPeriod === '24h' ? 24 * 60 * 60 * 1000 : 
                   selectedPeriod === '7d' ? 7 * 24 * 60 * 60 * 1000 :
                   selectedPeriod === '30d' ? 30 * 24 * 60 * 60 * 1000 :
                   Infinity;
    
    return metrics.filter(m => now - m.sessionStart < cutoff);
  }, [metrics, selectedPeriod]);

  const variantAMetrics = useMemo(() => {
    return filteredMetrics.filter(m => m.variant === 'A');
  }, [filteredMetrics]);

  const variantBMetrics = useMemo(() => {
    return filteredMetrics.filter(m => m.variant === 'B');
  }, [filteredMetrics]);

  const calculateStats = (metricsList: ABTestMetrics[]) => {
    if (metricsList.length === 0) return {
      users: 0,
      avgSessionDuration: 0,
      totalLikes: 0,
      totalViews: 0,
      totalComments: 0,
      totalPosts: 0,
      engagementRate: 0,
      conversionRate: 0,
      avgApiLatency: 0,
      retentionD1: 0,
      retentionD7: 0,
      retentionD30: 0
    };

    const totalLikes = metricsList.reduce((sum, m) => sum + m.interactions.postLikes, 0);
    const totalViews = metricsList.reduce((sum, m) => sum + m.interactions.postViews, 0);
    const totalComments = metricsList.reduce((sum, m) => sum + m.interactions.commentsAdded, 0);
    const totalPosts = metricsList.reduce((sum, m) => sum + m.interactions.postsCreated, 0);
    const totalSessionDuration = metricsList.reduce((sum, m) => sum + m.interactions.sessionDuration, 0);

    return {
      users: metricsList.length,
      avgSessionDuration: Math.round(totalSessionDuration / metricsList.length / 1000),
      totalLikes,
      totalViews,
      totalComments,
      totalPosts,
      engagementRate: totalViews > 0 ? Math.round((totalLikes + totalComments) / totalViews * 100) : 0,
      conversionRate: metricsList.length > 0 ? Math.round(totalPosts / metricsList.length * 100) : 0,
      avgApiLatency: Math.round(45 + Math.random() * 30), // Mock API latency
      retentionD1: Math.round(65 + Math.random() * 20), // Mock retention rates
      retentionD7: Math.round(35 + Math.random() * 15),
      retentionD30: Math.round(15 + Math.random() * 10)
    };
  };

  // Calculate page access statistics
  const getPageAccessStats = () => {
    const variantAPages = enhancedMetrics.pageAccesses.filter(p => p.variant === 'A');
    const variantBPages = enhancedMetrics.pageAccesses.filter(p => p.variant === 'B');
    
    const getPageStats = (pages: typeof enhancedMetrics.pageAccesses) => {
      const pageGroups = pages.reduce((acc, page) => {
        if (!acc[page.pageName]) {
          acc[page.pageName] = { count: 0, totalRenderTime: 0, totalLoadTime: 0, heavyPageCount: 0 };
        }
        acc[page.pageName].count += 1;
        acc[page.pageName].totalRenderTime += page.renderTime;
        acc[page.pageName].totalLoadTime += page.loadTime;
        if (page.isHeavy) acc[page.pageName].heavyPageCount += 1;
        return acc;
      }, {} as Record<string, { count: number; totalRenderTime: number; totalLoadTime: number; heavyPageCount: number }>);

      return Object.entries(pageGroups).map(([pageName, stats]) => ({
        pageName,
        accessCount: stats.count,
        avgRenderTime: Math.round(stats.totalRenderTime / stats.count),
        avgLoadTime: Math.round(stats.totalLoadTime / stats.count),
        heavyPagePercentage: Math.round((stats.heavyPageCount / stats.count) * 100)
      })).sort((a, b) => b.accessCount - a.accessCount);
    };

    return {
      variantA: getPageStats(variantAPages),
      variantB: getPageStats(variantBPages)
    };
  };

  // Calculate button click statistics
  const getButtonClickStats = () => {
    const variantAClicks = enhancedMetrics.buttonClicks.filter(b => b.variant === 'A');
    const variantBClicks = enhancedMetrics.buttonClicks.filter(b => b.variant === 'B');
    
    const getClickStats = (clicks: typeof enhancedMetrics.buttonClicks) => {
      const buttonGroups = clicks.reduce((acc, click) => {
        const key = `${click.buttonId}_${click.pageName}`;
        if (!acc[key]) {
          acc[key] = { buttonId: click.buttonId, buttonText: click.buttonText, pageName: click.pageName, count: 0 };
        }
        acc[key].count += 1;
        return acc;
      }, {} as Record<string, { buttonId: string; buttonText: string; pageName: string; count: number }>);

      return Object.values(buttonGroups).sort((a, b) => b.count - a.count);
    };

    return {
      variantA: getClickStats(variantAClicks),
      variantB: getClickStats(variantBClicks)
    };
  };

  const pageStats = getPageAccessStats();
  const buttonStats = getButtonClickStats();

  const statsA = calculateStats(variantAMetrics);
  const statsB = calculateStats(variantBMetrics);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getWinner = (metricA: number, metricB: number) => {
    if (metricA > metricB) return 'A';
    if (metricB > metricA) return 'B';
    return 'tie';
  };

  const getVerdictIcon = () => {
    const engagementWinner = getWinner(statsA.engagementRate, statsB.engagementRate);
    const conversionWinner = getWinner(statsA.conversionRate, statsB.conversionRate);
    
    if (engagementWinner === 'B' && conversionWinner === 'B') {
      return <TrendingUp className="w-5 h-5 text-pink-400" />;
    } else if (engagementWinner === 'A' && conversionWinner === 'A') {
      return <Activity className="w-5 h-5 text-cyan-400" />;
    }
    return <BarChart3 className="w-5 h-5 text-purple-400" />;
  };

  const getVerdictText = () => {
    const engagementWinner = getWinner(statsA.engagementRate, statsB.engagementRate);
    const conversionWinner = getWinner(statsA.conversionRate, statsB.conversionRate);
    
    if (engagementWinner === 'B' && conversionWinner === 'B') {
      return "Variante B liderando";
    } else if (engagementWinner === 'A' && conversionWinner === 'A') {
      return "Variante A liderando";
    }
    return "Resultados mistos";
  };

  const clearData = () => {
    localStorage.removeItem('ab_test_metrics');
    window.location.reload();
  };

  // Mock data for API performance
  const apiMethods = [
    { name: 'load_feed', timeA: 120, timeB: 95, successA: 99.2, successB: 99.8 },
    { name: 'create_post', timeA: 85, timeB: 78, successA: 98.5, successB: 99.1 },
    { name: 'send_dm', timeA: 95, timeB: 88, successA: 99.0, successB: 99.3 },
    { name: 'upload_media', timeA: 245, timeB: 210, successA: 96.8, successB: 97.9 },
    { name: 'fetch_notifications', timeA: 65, timeB: 52, successA: 99.5, successB: 99.7 }
  ];

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
                Sparkle A/B Dashboard
              </h1>
              <p className="text-gray-400 text-sm">Análise de Performance</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getVerdictIcon()}
            <Badge className="bg-purple-600 text-white border-0">
              {getVerdictText()}
            </Badge>
          </div>
        </header>

        <div className="p-4 space-y-6 max-w-4xl mx-auto">
          {/* Controls */}
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant={selectedPeriod === '24h' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('24h')}
                className={selectedPeriod === '24h' ? 'bg-cyan-500 hover:bg-cyan-600' : 'border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/20'}
              >
                24h
              </Button>
              <Button
                variant={selectedPeriod === '7d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('7d')}
                className={selectedPeriod === '7d' ? 'bg-cyan-500 hover:bg-cyan-600' : 'border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/20'}
              >
                7 dias
              </Button>
              <Button
                variant={selectedPeriod === '30d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('30d')}
                className={selectedPeriod === '30d' ? 'bg-cyan-500 hover:bg-cyan-600' : 'border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/20'}
              >
                30 dias
              </Button>
              <Button
                variant={selectedPeriod === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('all')}
                className={selectedPeriod === 'all' ? 'bg-cyan-500 hover:bg-cyan-600' : 'border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/20'}
              >
                Todos
              </Button>
            </div>

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
                onClick={clearData}
                className="bg-red-500/80 hover:bg-red-500 border-0"
              >
                Limpar Dados
              </Button>
            </div>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-slate-800 border-purple-500/30">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span className="text-sm text-gray-300">Engajamento</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {Math.round(((statsA.engagementRate * statsA.users) + (statsB.engagementRate * statsB.users)) / (statsA.users + statsB.users) || 0)}%
              </p>
              <span className="text-xs text-cyan-400">
                B: +{Math.abs(statsB.engagementRate - statsA.engagementRate)}%
              </span>
            </Card>
            
            <Card className="p-4 bg-slate-800 border-purple-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-pink-400" />
                <span className="text-sm text-gray-300">Conversão</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {Math.round(((statsA.conversionRate * statsA.users) + (statsB.conversionRate * statsB.users)) / (statsA.users + statsB.users) || 0)}%
              </p>
              <span className="text-xs text-pink-400">Posts criados</span>
            </Card>
            
            <Card className="p-4 bg-slate-800 border-purple-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-gray-300">API Latência</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {Math.round((statsA.avgApiLatency + statsB.avgApiLatency) / 2)}ms
              </p>
              <span className="text-xs text-yellow-400">P95</span>
            </Card>
            
            <Card className="p-4 bg-slate-800 border-purple-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-green-400" />
                <span className="text-sm text-gray-300">Usuários</span>
              </div>
              <p className="text-2xl font-bold text-white">{statsA.users + statsB.users}</p>
              <span className="text-xs text-green-400">Total</span>
            </Card>
          </div>

          {/* A/B Comparison */}
          <Tabs defaultValue="comparison" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-800">
              <TabsTrigger value="comparison" className="text-white">Comparação</TabsTrigger>
              <TabsTrigger value="variant-a" className="text-white">Versão A</TabsTrigger>
              <TabsTrigger value="variant-b" className="text-white">Versão B</TabsTrigger>
            </TabsList>
            
            <TabsContent value="comparison" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Variant A */}
                <Card className="p-6 bg-slate-800 border-cyan-500/30">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-white">Versão A (Clássica)</h3>
                    <Badge className="bg-cyan-500 text-white">A</Badge>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-300">Usuários</span>
                      <span className="font-medium text-white">{statsA.users}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-300">Tempo Médio</span>
                      <span className="font-medium text-white">{formatDuration(statsA.avgSessionDuration)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-300">Taxa de Engajamento</span>
                      <span className="font-medium text-white">{statsA.engagementRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-300">Taxa de Conversão</span>
                      <span className="font-medium text-white">{statsA.conversionRate}%</span>
                    </div>
                    <Progress value={statsA.engagementRate} className="h-2" />
                  </div>
                </Card>

                {/* Variant B */}
                <Card className="p-6 bg-slate-800 border-pink-500/30">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-white">Versão B (Moderna)</h3>
                    <Badge className="bg-pink-500 text-white">B</Badge>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-300">Usuários</span>
                      <span className="font-medium text-white">{statsB.users}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-300">Tempo Médio</span>
                      <span className="font-medium text-white">{formatDuration(statsB.avgSessionDuration)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-300">Taxa de Engajamento</span>
                      <span className="font-medium text-white">{statsB.engagementRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-300">Taxa de Conversão</span>
                      <span className="font-medium text-white">{statsB.conversionRate}%</span>
                    </div>
                    <Progress value={statsB.engagementRate} className="h-2" />
                  </div>
                </Card>
              </div>

              {/* Results Summary */}
              <Card className="p-6 bg-slate-800 border-purple-500/30">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-white">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  Resultados do Teste
                </h3>
                <div className="grid md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-300">Engajamento</p>
                    <p className="font-bold text-white">
                      Versão {getWinner(statsA.engagementRate, statsB.engagementRate).toUpperCase()} vence
                    </p>
                    <p className="text-xs text-gray-400">
                      {Math.abs(statsA.engagementRate - statsB.engagementRate)}% diferença
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">Tempo de Sessão</p>
                    <p className="font-bold text-white">
                      Versão {getWinner(statsA.avgSessionDuration, statsB.avgSessionDuration).toUpperCase()} vence
                    </p>
                    <p className="text-xs text-gray-400">
                      {Math.abs(statsA.avgSessionDuration - statsB.avgSessionDuration)}s diferença
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">Conversão</p>
                    <p className="font-bold text-white">
                      Versão {getWinner(statsA.conversionRate, statsB.conversionRate).toUpperCase()} vence
                    </p>
                    <p className="text-xs text-gray-400">
                      {Math.abs(statsA.conversionRate - statsB.conversionRate)}% diferença
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">API Performance</p>
                    <p className="font-bold text-white">
                      Versão {getWinner(statsA.avgApiLatency, statsB.avgApiLatency) === 'A' ? 'B' : 'A'} vence
                    </p>
                    <p className="text-xs text-gray-400">
                      {Math.abs(statsA.avgApiLatency - statsB.avgApiLatency)}ms diferença
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="variant-a">
              <Card className="p-6 bg-slate-800 border-cyan-500/30">
                <h3 className="font-bold mb-4 text-white">Detalhes da Versão A</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Usuários únicos</span>
                      <span className="font-medium text-white">{statsA.users}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Visualizações de posts</span>
                      <span className="font-medium text-white">{statsA.totalViews}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Curtidas</span>
                      <span className="font-medium text-white">{statsA.totalLikes}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Comentários</span>
                      <span className="font-medium text-white">{statsA.totalComments}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Posts criados</span>
                      <span className="font-medium text-white">{statsA.totalPosts}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Tempo médio de sessão</span>
                      <span className="font-medium text-white">{formatDuration(statsA.avgSessionDuration)}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="variant-b">
              <Card className="p-6 bg-slate-800 border-pink-500/30">
                <h3 className="font-bold mb-4 text-white">Detalhes da Versão B</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Usuários únicos</span>
                      <span className="font-medium text-white">{statsB.users}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Visualizações de posts</span>
                      <span className="font-medium text-white">{statsB.totalViews}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Curtidas</span>
                      <span className="font-medium text-white">{statsB.totalLikes}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Comentários</span>
                      <span className="font-medium text-white">{statsB.totalComments}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Posts criados</span>
                      <span className="font-medium text-white">{statsB.totalPosts}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Tempo médio de sessão</span>
                      <span className="font-medium text-white">{formatDuration(statsB.avgSessionDuration)}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Enhanced Performance Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Page Access & Performance */}
            <Card className="p-6 bg-slate-800 border-purple-500/30">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-white">
                <Activity className="w-5 h-5 text-cyan-400" />
                Páginas Mais Acessadas & Performance
              </h3>
              <Tabs defaultValue="variant-a" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-slate-700">
                  <TabsTrigger value="variant-a" className="text-cyan-400">Variante A</TabsTrigger>
                  <TabsTrigger value="variant-b" className="text-pink-400">Variante B</TabsTrigger>
                </TabsList>
                <TabsContent value="variant-a" className="space-y-3 mt-4">
                  {pageStats.variantA.slice(0, 5).map((page, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 font-medium">{page.pageName}</span>
                        <span className="text-cyan-400">{page.accessCount} acessos</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400">Render: {page.avgRenderTime}ms</span>
                        <span className="text-gray-400">Load: {page.avgLoadTime}ms</span>
                        <span className={page.heavyPagePercentage > 20 ? 'text-red-400' : 'text-green-400'}>
                          {page.heavyPagePercentage}% pesadas
                        </span>
                      </div>
                    </div>
                  ))}
                </TabsContent>
                <TabsContent value="variant-b" className="space-y-3 mt-4">
                  {pageStats.variantB.slice(0, 5).map((page, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 font-medium">{page.pageName}</span>
                        <span className="text-pink-400">{page.accessCount} acessos</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400">Render: {page.avgRenderTime}ms</span>
                        <span className="text-gray-400">Load: {page.avgLoadTime}ms</span>
                        <span className={page.heavyPagePercentage > 20 ? 'text-red-400' : 'text-green-400'}>
                          {page.heavyPagePercentage}% pesadas
                        </span>
                      </div>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </Card>

            {/* Button Click Analysis */}
            <Card className="p-6 bg-slate-800 border-purple-500/30">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-white">
                <Target className="w-5 h-5 text-pink-400" />
                Botões Mais Clicados
              </h3>
              <Tabs defaultValue="variant-a" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-slate-700">
                  <TabsTrigger value="variant-a" className="text-cyan-400">Variante A</TabsTrigger>
                  <TabsTrigger value="variant-b" className="text-pink-400">Variante B</TabsTrigger>
                </TabsList>
                <TabsContent value="variant-a" className="space-y-3 mt-4">
                  {buttonStats.variantA.slice(0, 5).map((button, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <span className="text-gray-300 font-medium block">{button.buttonText}</span>
                        <span className="text-gray-400 text-xs">{button.pageName}</span>
                      </div>
                      <span className="text-cyan-400 font-bold">{button.count} cliques</span>
                    </div>
                  ))}
                </TabsContent>
                <TabsContent value="variant-b" className="space-y-3 mt-4">
                  {buttonStats.variantB.slice(0, 5).map((button, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <span className="text-gray-300 font-medium block">{button.buttonText}</span>
                        <span className="text-gray-400 text-xs">{button.pageName}</span>
                      </div>
                      <span className="text-pink-400 font-bold">{button.count} cliques</span>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* Core Web Vitals & System Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 bg-slate-800 border-purple-500/30">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-white">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Core Web Vitals
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-400">LCP</p>
                  <p className="text-xl font-bold text-white">{Math.round(webVitals.lcp)}ms</p>
                  <div className={`w-full h-2 rounded-full mt-2 ${webVitals.lcp < 2500 ? 'bg-green-500' : webVitals.lcp < 4000 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400">FID</p>
                  <p className="text-xl font-bold text-white">{Math.round(webVitals.fid)}ms</p>
                  <div className={`w-full h-2 rounded-full mt-2 ${webVitals.fid < 100 ? 'bg-green-500' : webVitals.fid < 300 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400">CLS</p>
                  <p className="text-xl font-bold text-white">{webVitals.cls.toFixed(3)}</p>
                  <div className={`w-full h-2 rounded-full mt-2 ${webVitals.cls < 0.1 ? 'bg-green-500' : webVitals.cls < 0.25 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400">TTI</p>
                  <p className="text-xl font-bold text-white">{Math.round(webVitals.tti)}ms</p>
                  <div className={`w-full h-2 rounded-full mt-2 ${webVitals.tti < 3800 ? 'bg-green-500' : webVitals.tti < 7300 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-slate-800 border-purple-500/30">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-white">
                <Server className="w-5 h-5 text-blue-400" />
                Informações do Sistema
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Tipo de Rede</span>
                  <span className="text-white font-medium">{networkInfo.effectiveType.toUpperCase()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Velocidade Download</span>
                  <span className="text-white font-medium">{networkInfo.downlink} Mbps</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">RTT</span>
                  <span className="text-white font-medium">{networkInfo.rtt}ms</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Economia de Dados</span>
                  <span className={networkInfo.saveData ? 'text-yellow-400' : 'text-green-400'}>
                    {networkInfo.saveData ? 'Ativada' : 'Desativada'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Memória JS Usada</span>
                  <span className="text-white font-medium">
                    {(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(1)} MB
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Insights */}
          <Card className="p-6 bg-slate-800 border-purple-500/30">
            <h3 className="font-bold mb-4 text-white">Insights e Recomendações</h3>
            <div className="space-y-3 text-sm">
              {statsA.users === 0 && statsB.users === 0 ? (
                <p className="text-gray-400">
                  Nenhum dado coletado ainda. Use o app para gerar métricas do teste A/B.
                </p>
              ) : (
                <>
                  <div className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-pink-400 rounded-full mt-2 flex-shrink-0"></span>
                    <p className="text-gray-300">
                      <strong className="text-pink-400">Diferenças principais:</strong> A Versão A usa layout clássico com composer sempre visível, 
                      enquanto a Versão B usa FAB e modal para criação de posts.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></span>
                    <p className="text-gray-300">
                      <strong className="text-cyan-400">Interface:</strong> A Versão B inclui mais opções de navegação e ações (busca, notificações, compartilhar, salvar).
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></span>
                    <p className="text-gray-300">
                      <strong className="text-purple-400">Recomendação:</strong> Continue o teste por mais tempo para obter dados estatisticamente significativos.
                    </p>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>
    </div>
  );
}