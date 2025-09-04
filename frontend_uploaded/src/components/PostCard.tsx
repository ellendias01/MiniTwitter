import React from 'react';
import { Heart, MessageCircle, Share, Bookmark } from 'lucide-react';
import type { Post, ABVariant } from '../App';

interface PostCardProps {
  post: Post;
  onPostClick: (postId: string) => void;
  onLikeToggle: (postId: string) => void;
  showDivider?: boolean;
  abVariant: ABVariant;
}

export function PostCard({ post, onPostClick, onLikeToggle, showDivider = true, abVariant }: PostCardProps) {
  const isVariantB = abVariant === 'B';

  return (
    <div 
      className={`bg-background hover:bg-muted/30 transition-colors cursor-pointer ${
        showDivider ? 'border-b border-border' : ''
      }`}
    >
      <div className="p-4">
        <div className="flex gap-3">
          {/* Avatar */}
          <img 
            src={post.author.avatar} 
            alt={post.author.name}
            className={`${isVariantB ? 'w-12 h-12' : 'w-10 h-10'} rounded-full object-cover flex-shrink-0 ${
              isVariantB ? 'ring-2 ring-primary/20' : ''
            }`}
          />
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Author info and timestamp */}
            <div className="flex items-center gap-1 mb-1">
              <span className="font-bold text-foreground truncate">{post.author.name}</span>
              <span className="text-muted-foreground truncate text-sm">{post.author.handle}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground flex-shrink-0 text-sm">{post.timestamp}</span>
            </div>
            
            {/* Post content */}
            <div 
              onClick={() => onPostClick(post.id)}
              className="text-foreground mb-3 leading-relaxed"
            >
              {post.content}
            </div>
            
            {/* Action buttons */}
            <div className={`flex items-center ${isVariantB ? 'justify-between' : 'gap-6'}`}>
              {/* Comment button */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onPostClick(post.id);
                }}
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group"
              >
                <div className={`${isVariantB ? 'p-1.5' : 'p-2'} rounded-full group-hover:bg-primary/10 transition-colors`}>
                  <MessageCircle className="w-4 h-4" />
                </div>
                {!isVariantB && <span className="text-sm">{post.comments}</span>}
              </button>
              
              {/* Like button */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onLikeToggle(post.id);
                }}
                className={`flex items-center gap-2 transition-colors group ${
                  post.isLiked 
                    ? 'text-red-500' 
                    : 'text-muted-foreground hover:text-red-500'
                }`}
              >
                <div className={`${isVariantB ? 'p-1.5' : 'p-2'} rounded-full group-hover:bg-red-500/10 transition-colors`}>
                  <Heart 
                    className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`}
                  />
                </div>
                {!isVariantB && <span className="text-sm">{post.likes}</span>}
              </button>

              {/* Variant B: Additional actions */}
              {isVariantB && (
                <>
                  <button className="text-muted-foreground hover:text-primary transition-colors group">
                    <div className="p-1.5 rounded-full group-hover:bg-primary/10 transition-colors">
                      <Share className="w-4 h-4" />
                    </div>
                  </button>
                  <button className="text-muted-foreground hover:text-primary transition-colors group">
                    <div className="p-1.5 rounded-full group-hover:bg-primary/10 transition-colors">
                      <Bookmark className="w-4 h-4" />
                    </div>
                  </button>
                </>
              )}
            </div>

            {/* Variant B: Stats row */}
            {isVariantB && (
              <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                <span>{post.likes} curtidas</span>
                <span>{post.comments} comentários</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}