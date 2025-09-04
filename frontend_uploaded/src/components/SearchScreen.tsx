import React, { useState, useMemo } from 'react';
import { ArrowLeft, Search, TrendingUp, Hash, Users, MessageSquare } from 'lucide-react';
import { PostCard } from './PostCard';
import { BottomNavigation } from './BottomNavigation';
import type { Post, Screen, ABVariant } from '../App';

interface SearchScreenProps {
  posts: Post[];
  onPostClick: (postId: string) => void;
  onLikeToggle: (postId: string) => void;
  onNavigate: (screen: Screen) => void;
  onSearch: (query: string) => void;
  abVariant: ABVariant;
}

interface TrendingItem {
  id: string;
  type: 'hashtag' | 'topic';
  content: string;
  posts: number;
  category?: string;
}

export function SearchScreen({ 
  posts, 
  onPostClick, 
  onLikeToggle, 
  onNavigate, 
  onSearch,
  abVariant 
}: SearchScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'users' | 'posts'>('all');
  const isVariantB = abVariant === 'B';

  // Mock trending data
  const trendingItems: TrendingItem[] = [
    {
      id: 't1',
      type: 'hashtag',
      content: '#React',
      posts: 1243,
      category: 'Tecnologia'
    },
    {
      id: 't2',
      type: 'hashtag',
      content: '#JavaScript',
      posts: 2156,
      category: 'Programação'
    },
    {
      id: 't3',
      type: 'topic',
      content: 'Inteligência Artificial',
      posts: 892,
      category: 'Tecnologia'
    },
    {
      id: 't4',
      type: 'hashtag',
      content: '#Frontend',
      posts: 675,
      category: 'Desenvolvimento'
    },
    {
      id: 't5',
      type: 'topic',
      content: 'Design System',
      posts: 523,
      category: 'Design'
    }
  ];

  // Mock suggested users
  const suggestedUsers = [
    {
      id: 'u1',
      name: 'Tech Guru',
      handle: '@techguru',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
      bio: 'CTO & Tech Enthusiast',
      followers: '12.5K'
    },
    {
      id: 'u2',
      name: 'Design Pro',
      handle: '@designpro',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b789?w=40&h=40&fit=crop&crop=face',
      bio: 'UI/UX Designer at StartupCorp',
      followers: '8.2K'
    },
    {
      id: 'u3',
      name: 'Code Master',
      handle: '@codemaster',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
      bio: 'Full Stack Developer | Open Source',
      followers: '15.8K'
    }
  ];

  // Filter posts based on search query
  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    return posts.filter(post => 
      post.content.toLowerCase().includes(query) ||
      post.author.name.toLowerCase().includes(query) ||
      post.author.handle.toLowerCase().includes(query)
    );
  }, [posts, searchQuery]);

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    return suggestedUsers.filter(user =>
      user.name.toLowerCase().includes(query) ||
      user.handle.toLowerCase().includes(query) ||
      user.bio.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value.trim()) {
      onSearch(value);
    }
  };

  const showResults = searchQuery.trim().length > 0;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top Bar */}
      <header className={`sticky top-0 bg-background border-b border-border px-4 py-3 z-10 ${
        isVariantB ? 'backdrop-blur-md bg-background/90' : ''
      }`}>
        <div className="flex items-center gap-3">
          {isVariantB && (
            <button 
              onClick={() => onNavigate('home')}
              className="p-2 hover:bg-muted rounded-full transition-colors -ml-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Buscar no MiniTwitter"
              className="w-full pl-10 pr-4 py-2 bg-muted rounded-full border-none outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
              autoFocus
            />
          </div>
        </div>
      </header>

      <div className="flex-1 pb-16">
        {!showResults ? (
          // Default view - Trending and Suggestions
          <div className="space-y-6">
            {/* Trending Topics */}
            <div className="p-4">
              <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Trending para você
              </h2>
              <div className="space-y-3">
                {trendingItems.map((item) => (
                  <div 
                    key={item.id}
                    className="p-3 hover:bg-muted/30 rounded-lg transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {item.type === 'hashtag' ? (
                            <Hash className="w-4 h-4 text-primary" />
                          ) : (
                            <MessageSquare className="w-4 h-4 text-primary" />
                          )}
                          <span className="text-sm text-muted-foreground">{item.category}</span>
                        </div>
                        <p className="font-medium text-foreground">{item.content}</p>
                        <p className="text-sm text-muted-foreground">{item.posts.toLocaleString()} posts</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggested Users */}
            <div className="border-t border-border p-4">
              <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Quem seguir
              </h2>
              <div className="space-y-4">
                {suggestedUsers.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 p-3 hover:bg-muted/30 rounded-lg transition-colors">
                    <img 
                      src={user.avatar} 
                      alt={user.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-foreground truncate">{user.name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{user.handle}</p>
                      <p className="text-sm text-muted-foreground truncate">{user.bio}</p>
                      <p className="text-xs text-muted-foreground">{user.followers} seguidores</p>
                    </div>
                    <button className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      isVariantB 
                        ? 'bg-primary text-primary-foreground hover:opacity-90' 
                        : 'bg-[#1DA1F2] text-white hover:bg-[#1a91da]'
                    }`}>
                      Seguir
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Search results
          <div>
            {/* Search Tabs - Only in Variant B */}
            {isVariantB && (
              <div className="border-b border-border">
                <div className="flex px-4">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-4 font-medium transition-colors relative ${
                      activeTab === 'all' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Tudo
                    {activeTab === 'all' && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full"></div>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('posts')}
                    className={`px-4 py-4 font-medium transition-colors relative ${
                      activeTab === 'posts' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Posts
                    {activeTab === 'posts' && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full"></div>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('users')}
                    className={`px-4 py-4 font-medium transition-colors relative ${
                      activeTab === 'users' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Pessoas
                    {activeTab === 'users' && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full"></div>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Results */}
            <div className="p-4">
              {filteredPosts.length === 0 && filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-2">Nenhum resultado encontrado</p>
                  <p className="text-sm text-muted-foreground">Tente buscar por outros termos</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Users Results */}
                  {(activeTab === 'all' || activeTab === 'users') && filteredUsers.length > 0 && (
                    <div>
                      <h3 className="font-medium text-foreground mb-3">Pessoas</h3>
                      <div className="space-y-3">
                        {filteredUsers.map((user) => (
                          <div key={user.id} className="flex items-center gap-3 p-3 hover:bg-muted/30 rounded-lg transition-colors">
                            <img 
                              src={user.avatar} 
                              alt={user.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="font-medium text-foreground truncate">{user.name}</span>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">{user.handle}</p>
                              <p className="text-xs text-muted-foreground truncate">{user.bio}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Posts Results */}
                  {(activeTab === 'all' || activeTab === 'posts') && filteredPosts.length > 0 && (
                    <div className={filteredUsers.length > 0 ? 'border-t border-border pt-4' : ''}>
                      <h3 className="font-medium text-foreground mb-3">Posts</h3>
                      <div>
                        {filteredPosts.map((post) => (
                          <PostCard
                            key={post.id}
                            post={post}
                            onPostClick={onPostClick}
                            onLikeToggle={onLikeToggle}
                            abVariant={abVariant}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation activeScreen="search" onNavigate={onNavigate} abVariant={abVariant} />
    </div>
  );
}