import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ArrowLeft, Camera, Save, User } from 'lucide-react';
import { ABVariant } from '../App';

interface EditProfileScreenProps {
  user: any;
  onBack: () => void;
  onSave: (updatedUser: any) => void;
  abVariant: ABVariant;
}

interface ProfileForm {
  name: string;
  handle: string;
  bio: string;
  avatar: string;
}

export function EditProfileScreen({ user, onBack, onSave, abVariant }: EditProfileScreenProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState<ProfileForm>({
    name: user.name || '',
    handle: user.handle || '',
    bio: user.bio || '',
    avatar: user.avatar || ''
  });

  const [previewAvatar, setPreviewAvatar] = useState(user.avatar || '');

  // Available avatar options
  const avatarOptions = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1494790108755-2616b612b789?w=80&h=80&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=80&h=80&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face',
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validações
      if (!form.name.trim()) {
        setError('Nome é obrigatório');
        return;
      }

      if (!form.handle.startsWith('@')) {
        setError('Handle deve começar com @');
        return;
      }

      if (form.handle.length < 4) {
        setError('Handle deve ter pelo menos 3 caracteres além do @');
        return;
      }

      // Verificar se handle já está em uso (exceto pelo usuário atual)
      const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const handleExists = existingUsers.some((u: any) => 
        u.handle === form.handle && u.id !== user.id
      );

      if (handleExists) {
        setError('Este handle já está em uso');
        return;
      }

      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedUser = {
        ...user,
        name: form.name.trim(),
        handle: form.handle.trim(),
        bio: form.bio.trim(),
        avatar: previewAvatar
      };

      // Atualizar no localStorage
      const users = existingUsers.map((u: any) => 
        u.id === user.id ? updatedUser : u
      );
      localStorage.setItem('users', JSON.stringify(users));
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));

      setSuccess('Perfil atualizado com sucesso!');
      setTimeout(() => {
        onSave(updatedUser);
      }, 1500);

    } catch (err) {
      setError('Erro ao salvar perfil. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarSelect = (avatarUrl: string) => {
    setPreviewAvatar(avatarUrl);
    setForm(prev => ({ ...prev, avatar: avatarUrl }));
  };

  const isVariantB = abVariant === 'B';

  return (
    <div className={`min-h-screen ${isVariantB 
      ? 'bg-gradient-to-br from-blue-50 via-white to-purple-50' 
      : 'bg-background'
    }`}>
      {/* Header */}
      <div className={`sticky top-0 z-10 border-b ${isVariantB 
        ? 'bg-white/80 backdrop-blur-md' 
        : 'bg-background/80 backdrop-blur-md'
      }`}>
        <div className="flex items-center gap-4 p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Editar Perfil</h1>
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto">
        <Card className={`${isVariantB ? 'shadow-xl border-0 bg-white/80 backdrop-blur-sm' : ''}`}>
          <CardHeader>
            <CardTitle className="text-center">Suas Informações</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              {/* Alerts */}
              {error && (
                <Alert className="border-destructive/50 text-destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-500/50 text-green-700 bg-green-50">
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              {/* Avatar Selection */}
              <div className="space-y-3">
                <Label>Foto de Perfil</Label>
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={previewAvatar} alt={form.name} />
                      <AvatarFallback>
                        <User className="w-8 h-8" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <Camera className="w-4 h-4 text-primary-foreground" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2 w-full">
                    {avatarOptions.map((avatar, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleAvatarSelect(avatar)}
                        className={`relative rounded-full overflow-hidden border-2 transition-all ${
                          previewAvatar === avatar 
                            ? 'border-primary shadow-md scale-105' 
                            : 'border-transparent hover:border-muted-foreground/50'
                        }`}
                      >
                        <Avatar className="w-14 h-14">
                          <AvatarImage src={avatar} alt={`Avatar ${index + 1}`} />
                          <AvatarFallback>
                            <User className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  placeholder="Seu nome"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="h-11"
                  maxLength={50}
                />
                <p className="text-xs text-muted-foreground">
                  {form.name.length}/50 caracteres
                </p>
              </div>

              {/* Handle */}
              <div className="space-y-2">
                <Label htmlFor="handle">Handle (usuário)</Label>
                <Input
                  id="handle"
                  placeholder="@seunome"
                  value={form.handle}
                  onChange={(e) => {
                    let value = e.target.value;
                    if (!value.startsWith('@')) {
                      value = '@' + value.replace('@', '');
                    }
                    setForm(prev => ({ ...prev, handle: value.toLowerCase() }));
                  }}
                  required
                  className="h-11"
                  maxLength={20}
                />
                <p className="text-xs text-muted-foreground">
                  Seu handle único no MiniTwitter
                </p>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Conte um pouco sobre você..."
                  value={form.bio}
                  onChange={(e) => setForm(prev => ({ ...prev, bio: e.target.value }))}
                  className="min-h-[80px] resize-none"
                  maxLength={160}
                />
                <p className="text-xs text-muted-foreground">
                  {form.bio.length}/160 caracteres
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Save className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Profile Preview */}
        <Card className={`mt-4 ${isVariantB ? 'shadow-lg border-0 bg-white/60 backdrop-blur-sm' : ''}`}>
          <CardHeader>
            <CardTitle className="text-center text-sm">Prévia do Perfil</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={previewAvatar} alt={form.name} />
                <AvatarFallback>
                  <User className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">
                  {form.name || 'Seu Nome'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {form.handle || '@handle'}
                </p>
                {form.bio && (
                  <p className="text-sm mt-2 leading-relaxed">
                    {form.bio}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}