import React, { useState } from 'react';
import { ArrowLeft, Heart, MessageCircle, Share, Bookmark } from 'lucide-react';
import type { Post, Comment, ABVariant } from '../App';

interface PostDetailScreenProps {
  post: Post;
  comments: Comment[];
  onBack: () => void;
  onLikeToggle: (postId: string) => void;
  abVariant: ABVariant;
  onCommentAdd: () => void;
}

export function PostDetailScreen({ 
  post, 
  comments, 
  onBack, 
  onLikeToggle, 
  abVariant,
  onCommentAdd 
}: PostDetailScreenProps) {
  const [newComment, setNewComment] = useState('');
  const isVariantB = abVariant === 'B';

  const formatDetailedTimestamp = (timestamp: string) => {
    if (timestamp === 'agora') return 'agora mesmo';
    if (timestamp.includes('m')) return `há ${timestamp}`;
    if (timestamp.includes('h')) return `há ${timestamp}`;
    return '10:32 AM · 26 de out de 2023';
  };

  const handleSubmitComment = () => {
    if (newComment.trim()) {
      onCommentAdd();
      setNewComment('');
    }
  };

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
        <h1 className="ml-4 font-bold text-foreground">Post</h1>
      </header>

      <div className="flex-1 pb-20">
        {/* Main Post */}
        <div className="p-4 border-b border-border">
          <div className="flex gap-3 mb-4">
            <img 
              src={post.author.avatar} 
              alt={post.author.name}
              className={`${isVariantB ? 'w-14 h-14 ring-2 ring-primary/20' : 'w-12 h-12'} rounded-full object-cover flex-shrink-0`}
            />
            <div className="flex-1">
              <div className="flex flex-col">
                <span className="font-bold text-foreground">{post.author.name}</span>
                <span className="text-muted-foreground text-sm">{post.author.handle}</span>
              </div>
            </div>
          </div>
          
          <div className="text-foreground leading-relaxed mb-4 text-lg">
            {post.content}
          </div>
          
          <div className="text-muted-foreground text-sm mb-4 pb-4 border-b border-border">
            {formatDetailedTimestamp(post.timestamp)}
          </div>
          
          <div className="space-y-4">
            <div className="flex gap-6 text-muted-foreground text-sm">
              <span><strong className="text-foreground">{post.likes}</strong> Curtidas</span>
              <span><strong className="text-foreground">{post.comments}</strong> Comentários</span>
              {isVariantB && <span><strong className="text-foreground">12</strong> Compartilhamentos</span>}
            </div>
            
            <div className={`flex items-center pt-2 border-t border-border ${
              isVariantB ? 'justify-around' : 'gap-8'
            }`}>
              <button 
                onClick={() => {/* Handle comment action */}}
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group"
              >
                <div className="p-3 rounded-full group-hover:bg-primary/10 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                </div>
                {!isVariantB && <span className="text-sm">Comentar</span>}
              </button>
              
              <button 
                onClick={() => onLikeToggle(post.id)}
                className={`flex items-center gap-2 transition-colors group ${
                  post.isLiked 
                    ? 'text-red-500' 
                    : 'text-muted-foreground hover:text-red-500'
                }`}
              >
                <div className="p-3 rounded-full group-hover:bg-red-500/10 transition-colors">
                  <Heart 
                    className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`}
                  />
                </div>
                {!isVariantB && <span className="text-sm">Curtir</span>}
              </button>

              {isVariantB && (
                <>
                  <button className="text-muted-foreground hover:text-primary transition-colors group">
                    <div className="p-3 rounded-full group-hover:bg-primary/10 transition-colors">
                      <Share className="w-5 h-5" />
                    </div>
                  </button>
                  <button className="text-muted-foreground hover:text-primary transition-colors group">
                    <div className="p-3 rounded-full group-hover:bg-primary/10 transition-colors">
                      <Bookmark className="w-5 h-5" />
                    </div>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="p-4">
          <h2 className="font-bold text-foreground mb-4">Comentários</h2>
          
          {comments.length === 0 ? (
            <div className="text-muted-foreground text-center py-8">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="mb-1">Nenhum comentário ainda</p>
              <p className="text-sm">Seja o primeiro a comentar!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                  <img 
                    src={comment.author.avatar} 
                    alt={comment.author.name}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="font-bold text-foreground text-sm">{comment.author.name}</span>
                      <span className="text-muted-foreground text-sm">{comment.author.handle}</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground text-sm">{comment.timestamp}</span>
                    </div>
                    <div className="text-foreground text-sm leading-relaxed">
                      {comment.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Comment Form */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4">
        <div className="flex gap-3 max-w-md mx-auto">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Adicione seu comentário..."
            className={`flex-1 p-3 border border-border rounded-full outline-none focus:border-primary transition-colors bg-transparent ${
              isVariantB ? 'bg-muted/50' : ''
            }`}
          />
          <button
            onClick={handleSubmitComment}
            disabled={!newComment.trim()}
            className={`px-6 py-3 rounded-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isVariantB 
                ? 'bg-primary text-primary-foreground hover:opacity-90' 
                : 'bg-[#1DA1F2] text-white hover:bg-[#1a91da]'
            }`}
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}