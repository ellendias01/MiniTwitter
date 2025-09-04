import React, { useState, useEffect } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { PostDetailScreen } from './components/PostDetailScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { SearchScreen } from './components/SearchScreen';
import { NotificationsScreen } from './components/NotificationsScreen';
import { EnhancedAdminDashboard } from './components/EnhancedAdminDashboard';
import { LoginScreen } from './components/LoginScreen';
import { EditProfileScreen } from './components/EditProfileScreen';
import { metricsService, type EnhancedABTestMetrics } from './services/firebase';
import { usePerformanceTracking, useWebVitals, useNetworkMonitoring, useMemoryMonitoring } from './hooks/usePerformanceTracking';

export type Screen = 'login' | 'home' | 'post' | 'profile' | 'edit-profile' | 'search' | 'notifications' | 'admin';
export type ABVariant = 'A' | 'B';

export interface Post {
  id: string;
  author: {
    name: string;
    handle: string;
    avatar: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  isLiked: boolean;
}

export interface Comment {
  id: string;
  author: {
    name: string;
    handle: string;
    avatar: string;
  };
  content: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention';
  user: {
    name: string;
    handle: string;
    avatar: string;
  };
  content?: string;
  postId?: string;
  timestamp: string;
  isRead: boolean;
}

export interface ABTestMetrics {
  variant: ABVariant;
  userId: string;
  sessionStart: number;
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
}

// Enhanced metrics for detailed tracking
export interface EnhancedMetrics {
  pageAccesses: Array<{
    pageName: string;
    variant: ABVariant;
    timestamp: number;
    renderTime: number;
    loadTime: number;
    isHeavy: boolean;
  }>;
  buttonClicks: Array<{
    buttonId: string;
    buttonText: string;
    pageName: string;
    variant: ABVariant;
    timestamp: number;
  }>;
  webVitals: Array<{
    variant: ABVariant;
    timestamp: number;
    lcp: number;
    fid: number;
    cls: number;
    tti: number;
  }>;
}

export default function App() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [abVariant, setAbVariant] = useState<ABVariant>('A');
  const [userId] = useState(() => `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [sessionStart] = useState(() => Date.now());
  const [metrics, setMetrics] = useState<ABTestMetrics[]>(() => {
    const saved = localStorage.getItem('ab_test_metrics');
    return saved ? JSON.parse(saved) : [];
  });
  const [enhancedMetrics, setEnhancedMetrics] = useState<EnhancedMetrics>({
    pageAccesses: [],
    buttonClicks: [],
    webVitals: []
  });
  const [currentMetrics, setCurrentMetrics] = useState<ABTestMetrics>({
    variant: abVariant,
    userId,
    sessionStart,
    interactions: {
      postLikes: 0,
      postViews: 0,
      commentsAdded: 0,
      postsCreated: 0,
      profileViews: 0,
      searchQueries: 0,
      notificationViews: 0,
      sessionDuration: 0,
      buttonClicks: {},
      pageViews: {},
      pageLoadTimes: {},
      errorCount: 0,
      networkRequests: 0
    }
  });

  // Performance tracking hooks with error boundaries
  const performanceHookResult = usePerformanceTracking({
    variant: abVariant,
    userId,
    sessionId,
    pageName: currentScreen
  });
  
  const { trackButtonClick } = performanceHookResult || { trackButtonClick: () => {} };

  const webVitals = useWebVitals(abVariant, userId, sessionId) || { lcp: 0, fid: 0, cls: 0, tti: 0 };
  const networkInfo = useNetworkMonitoring() || { effectiveType: '4g', downlink: 10, rtt: 50, saveData: false };
  const memoryInfo = useMemoryMonitoring() || { usedJSHeapSize: 0, totalJSHeapSize: 0, jsHeapSizeLimit: 0 };

  // Randomly assign A/B variant on first load
  useEffect(() => {
    const savedVariant = localStorage.getItem('ab_variant');
    if (!savedVariant) {
      const randomVariant: ABVariant = Math.random() < 0.5 ? 'A' : 'B';
      setAbVariant(randomVariant);
      localStorage.setItem('ab_variant', randomVariant);
    } else {
      setAbVariant(savedVariant as ABVariant);
    }
  }, []);

  // Update session duration periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMetrics(prev => ({
        ...prev,
        interactions: {
          ...prev.interactions,
          sessionDuration: Date.now() - sessionStart
        }
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [sessionStart]);

  // Load enhanced metrics from localStorage
  useEffect(() => {
    const loadEnhancedMetrics = () => {
      const pageAccesses = JSON.parse(localStorage.getItem('page_access_tracking') || '[]');
      const buttonClicks = JSON.parse(localStorage.getItem('button_click_tracking') || '[]');
      const webVitalsData = JSON.parse(localStorage.getItem('web_vitals_tracking') || '[]');
      
      setEnhancedMetrics({
        pageAccesses,
        buttonClicks,
        webVitals: webVitalsData
      });
    };

    loadEnhancedMetrics();
    const interval = setInterval(loadEnhancedMetrics, 5000); // Refresh every 5 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Save metrics when component unmounts or user leaves
  useEffect(() => {
    const saveMetrics = async () => {
      const finalMetrics = {
        ...currentMetrics,
        interactions: {
          ...currentMetrics.interactions,
          sessionDuration: Date.now() - sessionStart
        }
      };
      
      // Save to localStorage (fallback)
      const existingMetrics = JSON.parse(localStorage.getItem('ab_test_metrics') || '[]');
      const updatedMetrics = [...existingMetrics, finalMetrics];
      localStorage.setItem('ab_test_metrics', JSON.stringify(updatedMetrics));
      setMetrics(updatedMetrics);

      // Try to save to Firebase
      try {
        const enhancedFinalMetrics = {
          variant: abVariant,
          userId,
          sessionId,
          sessionStart,
          sessionEnd: Date.now(),
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
          viewport: {
            width: typeof window !== 'undefined' ? window.innerWidth : 375,
            height: typeof window !== 'undefined' ? window.innerHeight : 667
          },
          interactions: finalMetrics.interactions,
          performanceMetrics: {
            pageRenderTime: {},
            largestContentfulPaint: webVitals?.lcp || 0,
            firstInputDelay: webVitals?.fid || 0,
            cumulativeLayoutShift: webVitals?.cls || 0,
            timeToInteractive: webVitals?.tti || 0,
            memoryUsage: memoryInfo?.usedJSHeapSize || 0
          }
        };

        await metricsService.create(enhancedFinalMetrics);
      } catch (error) {
        console.warn('Failed to save to Firebase, using localStorage fallback:', error);
      }
    };

    window.addEventListener('beforeunload', saveMetrics);
    return () => {
      window.removeEventListener('beforeunload', saveMetrics);
      saveMetrics();
    };
  }, [currentMetrics, sessionStart, abVariant, userId, sessionId, webVitals, memoryInfo]);

  const trackInteraction = (type: keyof ABTestMetrics['interactions'], data?: any) => {
    setCurrentMetrics(prev => {
      const updatedInteractions = { ...prev.interactions };
      
      if (typeof updatedInteractions[type] === 'number') {
        updatedInteractions[type] = (updatedInteractions[type] as number) + 1;
      } else if (type === 'buttonClicks' && data?.buttonId) {
        updatedInteractions.buttonClicks[data.buttonId] = (updatedInteractions.buttonClicks[data.buttonId] || 0) + 1;
        
        // Track button click in localStorage for dashboard
        const buttonClickData = {
          buttonId: data.buttonId,
          buttonText: data.buttonText || data.buttonId,
          pageName: currentScreen,
          variant: abVariant,
          timestamp: Date.now()
        };
        
        const stored = localStorage.getItem('button_click_tracking') || '[]';
        const buttonClicks = JSON.parse(stored);
        buttonClicks.push(buttonClickData);
        localStorage.setItem('button_click_tracking', JSON.stringify(buttonClicks));
        
        // Also use the performance tracking hook
        trackButtonClick(data.buttonId, data.buttonText || data.buttonId);
      } else if (type === 'pageViews') {
        const pageName = data?.pageName || currentScreen;
        if (!updatedInteractions.pageViews[pageName]) {
          updatedInteractions.pageViews[pageName] = { count: 0, totalTime: 0, averageTime: 0 };
        }
        updatedInteractions.pageViews[pageName].count += 1;
      }
      
      return {
        ...prev,
        interactions: updatedInteractions
      };
    });
  };

  // Mock data
  const [posts, setPosts] = useState<Post[]>([
    {
      id: '1',
      author: {
        name: 'Maria Silva',
        handle: '@mariasilva',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b789?w=40&h=40&fit=crop&crop=face'
      },
      content: 'Acabei de terminar um projeto incrível! A sensação de completar algo que você estava trabalhando há semanas é indescritível. 🚀',
      timestamp: '5m',
      likes: 12,
      comments: 3,
      isLiked: false
    },
    {
      id: '2',
      author: {
        name: 'João Santos',
        handle: '@joaosantos',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face'
      },
      content: 'Dica do dia: sempre documente seu código. Seu eu do futuro vai te agradecer! 📝',
      timestamp: '15m',
      likes: 8,
      comments: 2,
      isLiked: true
    },
    {
      id: '3',
      author: {
        name: 'Ana Costa',
        handle: '@anacosta',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face'
      },
      content: 'O café da manhã hoje estava perfeito! Nada como começar o dia com energia positiva ☀️☕',
      timestamp: '1h',
      likes: 15,
      comments: 5,
      isLiked: false
    },
    {
      id: '4',
      author: {
        name: 'Pedro Lima',
        handle: '@pedrolima',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'
      },
      content: 'Aprendendo React hooks hoje. A curva de aprendizado está sendo interessante, mas já vejo o potencial!',
      timestamp: '2h',
      likes: 6,
      comments: 1,
      isLiked: false
    },
    {
      id: '5',
      author: {
        name: 'Carla Rodrigues',
        handle: '@carlarodrigues',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=40&h=40&fit=crop&crop=face'
      },
      content: 'Alguém mais acha que JavaScript está ficando cada vez mais poderoso? As novas funcionalidades são incríveis!',
      timestamp: '3h',
      likes: 23,
      comments: 8,
      isLiked: false
    },
    {
      id: '6',
      author: {
        name: 'Rafael Oliveira',
        handle: '@rafaeloliveira',
        avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=40&h=40&fit=crop&crop=face'
      },
      content: 'Trabalhando no fim de semana, mas é por uma boa causa! Novo produto chegando em breve 🔥',
      timestamp: '4h',
      likes: 18,
      comments: 4,
      isLiked: false
    }
  ]);

  const [comments] = useState<Record<string, Comment[]>>({
    '1': [
      {
        id: 'c1',
        author: {
          name: 'Carlos Ferreira',
          handle: '@carlosf',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face'
        },
        content: 'Parabéns! Qual foi o projeto?',
        timestamp: '3m'
      },
      {
        id: 'c2',
        author: {
          name: 'Lucia Mendes',
          handle: '@luciam',
          avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=40&h=40&fit=crop&crop=face'
        },
        content: 'Essa sensação é a melhor mesmo! 👏',
        timestamp: '2m'
      }
    ],
    '2': [
      {
        id: 'c3',
        author: {
          name: 'Roberto Silva',
          handle: '@robertosilva',
          avatar: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=40&h=40&fit=crop&crop=face'
        },
        content: 'Verdade absoluta! Documentação salva vidas 😄',
        timestamp: '10m'
      }
    ]
  });

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 'n1',
      type: 'like',
      user: {
        name: 'Maria Silva',
        handle: '@mariasilva',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b789?w=40&h=40&fit=crop&crop=face'
      },
      postId: '1',
      timestamp: '2m',
      isRead: false
    },
    {
      id: 'n2',
      type: 'comment',
      user: {
        name: 'João Santos',
        handle: '@joaosantos',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face'
      },
      content: 'Parabéns pelo projeto!',
      postId: '1',
      timestamp: '5m',
      isRead: false
    },
    {
      id: 'n3',
      type: 'follow',
      user: {
        name: 'Ana Costa',
        handle: '@anacosta',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face'
      },
      timestamp: '1h',
      isRead: true
    },
    {
      id: 'n4',
      type: 'mention',
      user: {
        name: 'Pedro Lima',
        handle: '@pedrolima',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'
      },
      content: 'Oi @boracodar, que tal colaborarmos em um projeto?',
      timestamp: '2h',
      isRead: true
    },
    {
      id: 'n5',
      type: 'like',
      user: {
        name: 'Carla Rodrigues',
        handle: '@carlarodrigues',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=40&h=40&fit=crop&crop=face'
      },
      postId: '2',
      timestamp: '3h',
      isRead: true
    }
  ]);

  // Check authentication on app load
  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');
    const userData = localStorage.getItem('currentUser');
    
    if (authStatus === 'true' && userData) {
      setIsAuthenticated(true);
      setCurrentUser(JSON.parse(userData));
      setCurrentScreen('home');
    } else {
      setIsAuthenticated(false);
      setCurrentScreen('login');
    }
  }, []);

  // Authentication handlers
  const handleLogin = (user: any) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    setCurrentScreen('home');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('currentUser');
    setCurrentScreen('login');
  };

  const handleProfileUpdate = (updatedUser: any) => {
    setCurrentUser(updatedUser);
    setCurrentScreen('profile');
  };

  const userPosts = posts.filter(post => post.author.handle === currentUser?.handle);
  const unreadNotifications = notifications.filter(n => !n.isRead).length;

  const handlePostClick = (postId: string) => {
    trackInteraction('postViews');
    setSelectedPostId(postId);
    setCurrentScreen('post');
  };

  const handleLikeToggle = (postId: string) => {
    trackInteraction('postLikes');
    setPosts(posts.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            isLiked: !post.isLiked,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1
          }
        : post
    ));
  };

  const handleNewPost = (content: string) => {
    trackInteraction('postsCreated');
    const newPost: Post = {
      id: Date.now().toString(),
      author: currentUser,
      content,
      timestamp: 'agora',
      likes: 0,
      comments: 0,
      isLiked: false
    };
    setPosts([newPost, ...posts]);
  };

  const handleNavigate = (screen: Screen) => {
    // Track page views with enhanced metrics
    trackInteraction('pageViews', { pageName: screen });
    
    if (screen === 'profile') {
      trackInteraction('profileViews');
    }
    if (screen === 'notifications') {
      trackInteraction('notificationViews');
    }
    
    setCurrentScreen(screen);
  };

  const handleSearch = (query: string) => {
    trackInteraction('searchQueries');
    // In a real app, this would perform the actual search
  };

  const handleMarkNotificationAsRead = (notificationId: string) => {
    setNotifications(notifications.map(n => 
      n.id === notificationId ? { ...n, isRead: true } : n
    ));
  };

  const selectedPost = selectedPostId ? posts.find(p => p.id === selectedPostId) : null;
  const postComments = selectedPostId ? comments[selectedPostId] || [] : [];

  const renderScreen = () => {
    if (!isAuthenticated) {
      return (
        <LoginScreen
          onLogin={handleLogin}
          abVariant={abVariant}
        />
      );
    }

    switch (currentScreen) {
      case 'home':
        return (
          <HomeScreen
            posts={posts}
            currentUser={currentUser}
            onPostClick={handlePostClick}
            onLikeToggle={handleLikeToggle}
            onNewPost={handleNewPost}
            onNavigate={handleNavigate}
            abVariant={abVariant}
            unreadNotifications={unreadNotifications}
            userId={userId}
            sessionId={sessionId}
          />
        );
      case 'search':
        return (
          <SearchScreen
            posts={posts}
            onPostClick={handlePostClick}
            onLikeToggle={handleLikeToggle}
            onNavigate={handleNavigate}
            onSearch={handleSearch}
            abVariant={abVariant}
          />
        );
      case 'notifications':
        return (
          <NotificationsScreen
            notifications={notifications}
            posts={posts}
            onNotificationClick={handleMarkNotificationAsRead}
            onPostClick={handlePostClick}
            onNavigate={handleNavigate}
            abVariant={abVariant}
          />
        );
      case 'post':
        return selectedPost ? (
          <PostDetailScreen
            post={selectedPost}
            comments={postComments}
            onBack={() => setCurrentScreen('home')}
            onLikeToggle={handleLikeToggle}
            abVariant={abVariant}
            onCommentAdd={() => trackInteraction('commentsAdded')}
          />
        ) : null;
      case 'profile':
        return (
          <ProfileScreen
            user={currentUser}
            posts={userPosts}
            onBack={() => setCurrentScreen('home')}
            onPostClick={handlePostClick}
            onLikeToggle={handleLikeToggle}
            onNavigate={handleNavigate}
            onEditProfile={() => setCurrentScreen('edit-profile')}
            onLogout={handleLogout}
            abVariant={abVariant}
            unreadNotifications={unreadNotifications}
          />
        );
      case 'edit-profile':
        return (
          <EditProfileScreen
            user={currentUser}
            onBack={() => setCurrentScreen('profile')}
            onSave={handleProfileUpdate}
            abVariant={abVariant}
          />
        );
      case 'admin':
        return (
          <EnhancedAdminDashboard
            metrics={metrics}
            enhancedMetrics={enhancedMetrics}
            webVitals={webVitals}
            networkInfo={networkInfo}
            memoryInfo={memoryInfo}
            onBack={() => setCurrentScreen('home')}
            onVariantSwitch={(variant) => {
              setAbVariant(variant);
              localStorage.setItem('ab_variant', variant);
            }}
            currentVariant={abVariant}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto relative">
      {/* Admin access button - only show when authenticated */}
      {isAuthenticated && (
        <button
          onClick={() => setCurrentScreen('admin')}
          className="fixed top-2 right-2 z-50 w-8 h-8 bg-destructive text-destructive-foreground rounded-full text-xs opacity-20 hover:opacity-100 transition-opacity"
          title="Admin Dashboard (Teste A/B)"
        >
          AB
        </button>
      )}
      {renderScreen()}
    </div>
  );
}