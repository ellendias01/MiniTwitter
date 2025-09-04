import React, { useState, useEffect } from 'react';
import { Home, User, Plus } from 'lucide-react';
import { PostCard } from './PostCard';
import { BottomNavigation } from './BottomNavigation';
import { ButtonTracker } from './ButtonTracker';
import { usePerformanceTracking } from '../hooks/usePerformanceTracking';
import type { Post, Screen, ABVariant } from '../App';

interface HomeScreenProps {
  posts: Post[];
  currentUser: any;
  onPostClick: (postId: string) => void;
  onLikeToggle: (postId: string) => void;
  onNewPost: (content: string) => void;
  onNavigate: (screen: Screen) => void;
  abVariant: ABVariant;
  unreadNotifications?: number;
  userId?: string;
  sessionId?: string;
}

export function HomeScreen({ 
  posts, 
  currentUser, 
  onPostClick, 
  onLikeToggle, 
  onNewPost,
  onNavigate,
  abVariant,
  unreadNotifications = 0,
  userId = '',
  sessionId = ''
}: HomeScreenProps) {
  const [newPostContent, setNewPostContent] = useState('');
  const [showCompose, setShowCompose] = useState(false);

  // Performance tracking for this page
  const { trackButtonClick, renderTime, loadTime, isHeavyPage } = usePerformanceTracking({
    variant: abVariant,
    userId,
    sessionId,
    pageName: 'home'
  });

  const handleSubmitPost = () => {
    if (newPostContent.trim()) {
      onNewPost(newPostContent.trim());
      setNewPostContent('');
      setShowCompose(false);
    }
  };

  const isVariantB = abVariant === 'B';

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Bar */}
      <header className={`sticky top-0 bg-background border-b border-border px-4 py-3 flex items-center justify-between z-10 ${
        isVariantB ? 'bg-gradient-to-r from-primary to-chart-1 text-primary-foreground border-transparent' : ''
      }`}>
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isVariantB ? 'bg-primary-foreground text-primary' : 'bg-[#1DA1F2] text-white'
          }`}>
            <span className="font-bold text-xs">MT</span>
          </div>
          <span className={`ml-2 font-bold ${isVariantB ? 'text-primary-foreground' : 'text-foreground'}`}>
            MiniTwitter
          </span>
        </div>
        <button 
          onClick={() => onNavigate('profile')}
          className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-primary/20"
        >
          <img 
            src={currentUser.avatar} 
            alt={currentUser.name}
            className="w-full h-full object-cover"
          />
        </button>
      </header>

      {/* Compose Section - Variant A: Always visible, Variant B: Modal */}
      {isVariantB ? (
        <>
          {/* Floating Action Button - Variant B */}
          <button
            onClick={() => setShowCompose(true)}
            className="fixed bottom-20 right-4 z-40 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
          >
            <Plus className="w-6 h-6" />
          </button>

          {/* Modal Compose - Variant B */}
          {showCompose && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-background rounded-lg w-full max-w-md max-h-[80vh] overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <h3 className="font-bold">Novo Post</h3>
                  <button
                    onClick={() => setShowCompose(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </button>
                </div>
                <div className="p-4">
                  <div className="flex gap-3">
                    <img 
                      src={currentUser.avatar} 
                      alt={currentUser.name}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1">
                      <textarea
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        placeholder="O que está acontecendo?"
                        className="w-full p-2 text-foreground placeholder-muted-foreground resize-none border-none outline-none bg-transparent min-h-[100px]"
                        maxLength={280}
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-sm text-muted-foreground">
                      {280 - newPostContent.length} caracteres restantes
                    </span>
                    <button
                      onClick={handleSubmitPost}
                      disabled={!newPostContent.trim()}
                      className="bg-primary text-primary-foreground px-6 py-2 rounded-full font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                    >
                      Publicar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Inline Compose - Variant A */
        <div className="border-b border-border p-4 bg-background">
          <div className="flex gap-3">
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1">
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="O que está acontecendo?"
                className="w-full p-2 text-foreground placeholder-muted-foreground resize-none border-none outline-none bg-transparent min-h-[60px]"
                maxLength={280}
              />
              <div className="flex justify-between items-center mt-3">
                <span className="text-xs text-muted-foreground">
                  {280 - newPostContent.length}
                </span>
                <button
                  onClick={handleSubmitPost}
                  disabled={!newPostContent.trim()}
                  className="bg-[#1DA1F2] text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-[#1a91da] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Publicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="flex-1 pb-16">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-2">Nenhum post ainda</p>
            <p className="text-muted-foreground text-sm">Seja o primeiro a publicar algo!</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onPostClick={onPostClick}
              onLikeToggle={onLikeToggle}
              abVariant={abVariant}
            />
          ))
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation 
        activeScreen="home" 
        onNavigate={onNavigate} 
        abVariant={abVariant}
        unreadNotifications={unreadNotifications}
      />

      {/* A/B Test Indicator */}
      <div className="fixed top-12 left-2 bg-muted text-muted-foreground px-2 py-1 rounded text-xs opacity-50">
        Versão {abVariant}
      </div>
    </div>
  );
}