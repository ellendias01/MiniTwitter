import React, { useState } from 'react';
import { ArrowLeft, Heart, MessageCircle, UserPlus, AtSign, MoreHorizontal } from 'lucide-react';
import { BottomNavigation } from './BottomNavigation';
import type { Notification, Post, Screen, ABVariant } from '../App';

interface NotificationsScreenProps {
  notifications: Notification[];
  posts: Post[];
  onNotificationClick: (notificationId: string) => void;
  onPostClick: (postId: string) => void;
  onNavigate: (screen: Screen) => void;
  abVariant: ABVariant;
}

export function NotificationsScreen({ 
  notifications, 
  posts,
  onNotificationClick, 
  onPostClick, 
  onNavigate,
  abVariant 
}: NotificationsScreenProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'mentions'>('all');
  const isVariantB = abVariant === 'B';

  const filteredNotifications = activeTab === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === 'mention');

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" fill="currentColor" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-primary" />;
      case 'follow':
        return <UserPlus className="w-5 h-5 text-primary" />;
      case 'mention':
        return <AtSign className="w-5 h-5 text-primary" />;
      default:
        return <Heart className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case 'like':
        return 'curtiu seu post';
      case 'comment':
        return 'comentou no seu post';
      case 'follow':
        return 'começou a seguir você';
      case 'mention':
        return 'mencionou você';
      default:
        return 'interagiu com você';
    }
  };

  const getRelatedPost = (postId?: string) => {
    if (!postId) return null;
    return posts.find(p => p.id === postId);
  };

  const handleNotificationClick = (notification: Notification) => {
    onNotificationClick(notification.id);
    
    if (notification.postId) {
      onPostClick(notification.postId);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top Bar */}
      <header className={`sticky top-0 bg-background border-b border-border px-4 py-3 z-10 ${
        isVariantB ? 'backdrop-blur-md bg-background/90' : ''
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={() => onNavigate('home')}
              className="p-2 hover:bg-muted rounded-full transition-colors -ml-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="ml-4 font-bold text-foreground">Notificações</h1>
          </div>
          <button className="p-2 hover:bg-muted rounded-full transition-colors">
            <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* Tabs - Only in Variant B */}
      {isVariantB && (
        <div className="border-b border-border">
          <div className="flex px-4">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-4 font-medium transition-colors relative ${
                activeTab === 'all' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Todas
              {activeTab === 'all' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('mentions')}
              className={`px-4 py-4 font-medium transition-colors relative ${
                activeTab === 'mentions' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Menções
              {activeTab === 'mentions' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full"></div>
              )}
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 pb-16">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-muted-foreground opacity-50" />
            </div>
            <p className="text-muted-foreground mb-2">Nenhuma notificação</p>
            <p className="text-sm text-muted-foreground">
              {activeTab === 'mentions' 
                ? 'Quando alguém mencionar você, aparecerá aqui.'
                : 'Quando você tiver notificações, elas aparecerão aqui.'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredNotifications.map((notification) => {
              const relatedPost = getRelatedPost(notification.postId);
              
              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 hover:bg-muted/30 transition-colors cursor-pointer ${
                    !notification.isRead ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Notification Icon */}
                    <div className="flex-shrink-0 pt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3">
                        {/* User Avatar */}
                        <img 
                          src={notification.user.avatar} 
                          alt={notification.user.name}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                        
                        {/* Notification Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-1">
                            <span className="font-medium text-foreground truncate">
                              {notification.user.name}
                            </span>
                            <span className="text-muted-foreground text-sm">
                              {getNotificationText(notification)}
                            </span>
                            <span className="text-muted-foreground text-sm">•</span>
                            <span className="text-muted-foreground text-sm flex-shrink-0">
                              {notification.timestamp}
                            </span>
                          </div>
                          
                          {/* Notification specific content */}
                          {notification.content && (
                            <p className="text-muted-foreground text-sm mb-2">
                              "{notification.content}"
                            </p>
                          )}
                          
                          {/* Related post preview */}
                          {relatedPost && (
                            <div className={`mt-2 p-3 rounded-lg border border-border bg-muted/30 ${
                              isVariantB ? 'hover:bg-muted/50' : 'hover:bg-muted/40'
                            } transition-colors`}>
                              <p className="text-sm text-foreground line-clamp-2">
                                {relatedPost.content}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation 
        activeScreen="notifications" 
        onNavigate={onNavigate} 
        abVariant={abVariant}
        unreadNotifications={notifications.filter(n => !n.isRead).length}
      />
    </div>
  );
}