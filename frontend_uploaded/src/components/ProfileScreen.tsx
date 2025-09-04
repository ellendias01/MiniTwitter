import React from 'react';
import { ArrowLeft, MapPin, Calendar, Link, Settings, LogOut } from 'lucide-react';
import { PostCard } from './PostCard';
import { BottomNavigation } from './BottomNavigation';
import { Button } from './ui/button';
import type { Post, Screen, ABVariant } from '../App';

interface User {
  id?: string;
  name: string;
  handle: string;
  avatar: string;
  bio: string;
  postsCount: number;
  followersCount?: number;
  followingCount?: number;
  joinDate?: string;
}

interface ProfileScreenProps {
  user: User;
  posts: Post[];
  onBack: () => void;
  onPostClick: (postId: string) => void;
  onLikeToggle: (postId: string) => void;
  onNavigate: (screen: Screen) => void;
  onEditProfile: () => void;
  onLogout: () => void;
  abVariant: ABVariant;
  unreadNotifications?: number;
}

export function ProfileScreen({ 
  user, 
  posts, 
  onBack, 
  onPostClick, 
  onLikeToggle,
  onNavigate,
  onEditProfile,
  onLogout,
  abVariant,
  unreadNotifications = 0
}: ProfileScreenProps) {
  const isVariantB = abVariant === 'B';

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top Bar */}
      <header className={`sticky top-0 bg-background border-b border-border px-4 py-3 flex items-center z-10 ${
        isVariantB ? 'backdrop-blur-md bg-background/90' : ''
      }`}>
        <button 
          onClick={onBack}
          className="p-2 hover:bg-muted rounded-full transition-colors -ml-2"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="ml-4">
          <h1 className="font-bold text-foreground">{user.name}</h1>
          <p className="text-muted-foreground text-sm">{posts.length} posts</p>
        </div>
      </header>

      <div className="flex-1 pb-16">
        {/* Profile Header */}
        <div className="relative">
          {/* Banner */}
          <div className={`h-32 ${
            isVariantB 
              ? 'bg-gradient-to-br from-primary via-chart-1 to-chart-2' 
              : 'bg-gradient-to-r from-[#1DA1F2] to-[#1a91da]'
          }`}>
            {isVariantB && (
              <div className="absolute inset-0 bg-black/10 backdrop-blur-sm"></div>
            )}
          </div>
          
          {/* Profile Picture */}
          <div className="absolute -bottom-12 left-4">
            <img 
              src={user.avatar} 
              alt={user.name}
              className={`${isVariantB ? 'w-24 h-24 ring-4' : 'w-20 h-20 ring-4'} rounded-full object-cover ring-background`}
            />
          </div>

          {/* Profile Actions */}
          <div className="absolute -bottom-6 right-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onEditProfile}
              className={`${isVariantB ? 'rounded-full' : 'rounded-md'}`}
            >
              <Settings className="w-4 h-4 mr-1" />
              Editar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className={`text-destructive hover:text-destructive hover:bg-destructive/10 ${isVariantB ? 'rounded-full' : 'rounded-md'}`}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Profile Info */}
        <div className="px-4 pt-16 pb-4">
          <div className="mb-3">
            <h2 className="font-bold text-foreground text-xl">{user.name}</h2>
            <p className="text-muted-foreground">{user.handle}</p>
          </div>
          
          <p className="text-foreground mb-4 leading-relaxed">
            {user.bio}
          </p>

          {/* Variant B: Additional profile info */}
          {isVariantB && (
            <div className="flex gap-4 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>São Paulo, Brasil</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Entrou em {user.joinDate ? new Date(user.joinDate).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) : 'Jan 2023'}</span>
              </div>
            </div>
          )}
          
          <div className="flex gap-4 text-sm">
            <span><strong className="text-foreground">{posts.length}</strong> <span className="text-muted-foreground">posts</span></span>
            {isVariantB && (
              <>
                <span><strong className="text-foreground">{user.followingCount || 152}</strong> <span className="text-muted-foreground">seguindo</span></span>
                <span><strong className="text-foreground">{user.followersCount || 1200}</strong> <span className="text-muted-foreground">seguidores</span></span>
              </>
            )}
          </div>
        </div>

        {/* Posts Tab */}
        <div className="border-b border-border">
          <div className="px-4">
            <div className="flex">
              <div className="relative">
                <button className="px-4 py-4 font-medium text-foreground">
                  Posts
                </button>
                <div className={`absolute bottom-0 left-0 right-0 h-1 rounded-full ${
                  isVariantB ? 'bg-primary' : 'bg-[#1DA1F2]'
                }`}></div>
              </div>
              {isVariantB && (
                <>
                  <button className="px-4 py-4 font-medium text-muted-foreground hover:text-foreground transition-colors">
                    Respostas
                  </button>
                  <button className="px-4 py-4 font-medium text-muted-foreground hover:text-foreground transition-colors">
                    Mídia
                  </button>
                  <button className="px-4 py-4 font-medium text-muted-foreground hover:text-foreground transition-colors">
                    Curtidas
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* User Posts */}
        <div>
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl opacity-50">📝</span>
              </div>
              <p className="text-muted-foreground mb-2">Nenhum post ainda</p>
              <p className="text-muted-foreground text-sm">Quando você publicar algo, aparecerá aqui.</p>
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
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation 
        activeScreen="profile" 
        onNavigate={onNavigate} 
        abVariant={abVariant}
        unreadNotifications={unreadNotifications}
      />
    </div>
  );
}