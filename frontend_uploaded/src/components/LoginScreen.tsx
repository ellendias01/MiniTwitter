import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Eye, EyeOff, Twitter, Users, TrendingUp, Zap } from 'lucide-react';
import { ABVariant } from '../App';

interface LoginScreenProps {
  onLogin: (user: any) => void;
  abVariant: ABVariant;
}

interface LoginForm {
  email: string;
  password: string;
}

interface RegisterForm {
  name: string;
  handle: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export function LoginScreen({ onLogin, abVariant }: LoginScreenProps) {
  const [activeTab, setActiveTab] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [loginForm, setLoginForm] = useState<LoginForm>({
    email: '',
    password: ''
  });

  const [registerForm, setRegisterForm] = useState<RegisterForm>({
    name: '',
    handle: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Mock users database (localStorage)
  const saveUser = (user: any) => {
    const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const userWithDefaults = {
      ...user,
      id: Date.now().toString(),
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&crop=face`,
      bio: 'Novo no MiniTwitter! 🚀',
      postsCount: 0,
      followersCount: Math.floor(Math.random() * 100),
      followingCount: Math.floor(Math.random() * 50),
      joinDate: new Date().toISOString()
    };
    existingUsers.push(userWithDefaults);
    localStorage.setItem('users', JSON.stringify(existingUsers));
    return userWithDefaults;
  };

  const findUser = (email: string, password: string) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    return users.find((user: any) => user.email === email && user.password === password);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 1000));

      const user = findUser(loginForm.email, loginForm.password);
      
      if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('isAuthenticated', 'true');
        onLogin(user);
      } else {
        setError('Email ou senha incorretos');
      }
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validações
      if (registerForm.password !== registerForm.confirmPassword) {
        setError('As senhas não coincidem');
        return;
      }

      if (registerForm.password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres');
        return;
      }

      if (!registerForm.handle.startsWith('@')) {
        setError('O handle deve começar com @');
        return;
      }

      // Verificar se usuário já existe
      const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const userExists = existingUsers.some((user: any) => 
        user.email === registerForm.email || user.handle === registerForm.handle
      );

      if (userExists) {
        setError('Email ou handle já estão em uso');
        return;
      }

      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newUser = saveUser({
        name: registerForm.name,
        handle: registerForm.handle,
        email: registerForm.email,
        password: registerForm.password
      });

      setSuccess('Conta criada com sucesso! Você pode fazer login agora.');
      setActiveTab('login');
      setLoginForm({ email: registerForm.email, password: '' });
      setRegisterForm({
        name: '',
        handle: '',
        email: '',
        password: '',
        confirmPassword: ''
      });

    } catch (err) {
      setError('Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = () => {
    setLoginForm({
      email: 'demo@minitwitter.com',
      password: 'demo123'
    });
    
    // Create demo user if doesn't exist
    const demoUser = {
      name: 'Demo User',
      handle: '@demo',
      email: 'demo@minitwitter.com',
      password: 'demo123'
    };
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userExists = users.some((user: any) => user.email === demoUser.email);
    
    if (!userExists) {
      saveUser(demoUser);
    }
  };

  const features = [
    { icon: Users, title: 'Conecte-se', desc: 'Siga pessoas interessantes' },
    { icon: TrendingUp, title: 'Descubra', desc: 'Veja o que está acontecendo' },
    { icon: Zap, title: 'Compartilhe', desc: 'Publique seus pensamentos' },
  ];

  const isVariantB = abVariant === 'B';

  return (
    <div className={`min-h-screen flex flex-col ${isVariantB 
      ? 'bg-gradient-to-br from-blue-50 via-white to-purple-50' 
      : 'bg-background'
    }`}>
      {/* Header */}
      <div className={`p-6 ${isVariantB ? 'text-center' : ''}`}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Twitter className={`w-8 h-8 ${isVariantB ? 'text-blue-500' : 'text-primary'}`} />
          <h1 className={`text-2xl font-bold ${isVariantB ? 'text-gray-800' : 'text-foreground'}`}>
            MiniTwitter
          </h1>
        </div>
        <p className={`text-sm ${isVariantB ? 'text-gray-600' : 'text-muted-foreground'}`}>
          Conecte-se com o mundo ao seu redor
        </p>
      </div>

      <div className="flex-1 px-6 pb-6">
        <div className="max-w-md mx-auto">
          {/* Features Preview (Variant B) */}
          {isVariantB && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              {features.map((feature, index) => (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-2">
                    <feature.icon className="w-6 h-6 text-blue-500" />
                  </div>
                  <h3 className="text-xs font-medium text-gray-800">{feature.title}</h3>
                  <p className="text-xs text-gray-600">{feature.desc}</p>
                </div>
              ))}
            </div>
          )}

          {/* Login/Register Card */}
          <Card className={`${isVariantB ? 'shadow-xl border-0 bg-white/80 backdrop-blur-sm' : ''}`}>
            <CardHeader className="space-y-1">
              <CardTitle className="text-center">
                {activeTab === 'login' ? 'Fazer Login' : 'Criar Conta'}
              </CardTitle>
              <CardDescription className="text-center">
                {activeTab === 'login' 
                  ? 'Entre com sua conta para continuar' 
                  : 'Crie sua conta e junte-se à conversa'
                }
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Registrar</TabsTrigger>
                </TabsList>

                {/* Alerts */}
                {error && (
                  <Alert className="mb-4 border-destructive/50 text-destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="mb-4 border-green-500/50 text-green-700 bg-green-50">
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                {/* Login Form */}
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                        required
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Senha</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Sua senha"
                          value={loginForm.password}
                          onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                          required
                          className="h-11 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-11" 
                      disabled={loading}
                    >
                      {loading ? 'Entrando...' : 'Entrar'}
                    </Button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">ou</span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-11"
                      onClick={demoLogin}
                    >
                      Usar Conta Demo
                    </Button>
                  </form>
                </TabsContent>

                {/* Register Form */}
                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome Completo</Label>
                      <Input
                        id="name"
                        placeholder="Seu nome"
                        value={registerForm.name}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, name: e.target.value }))}
                        required
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="handle">Handle (usuário)</Label>
                      <Input
                        id="handle"
                        placeholder="@seunome"
                        value={registerForm.handle}
                        onChange={(e) => {
                          let value = e.target.value;
                          if (!value.startsWith('@')) {
                            value = '@' + value.replace('@', '');
                          }
                          setRegisterForm(prev => ({ ...prev, handle: value }));
                        }}
                        required
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                        required
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-password">Senha</Label>
                      <div className="relative">
                        <Input
                          id="register-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Mínimo 6 caracteres"
                          value={registerForm.password}
                          onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                          required
                          className="h-11 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirmar Senha</Label>
                      <div className="relative">
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Digite a senha novamente"
                          value={registerForm.confirmPassword}
                          onChange={(e) => setRegisterForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          required
                          className="h-11 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-11" 
                      disabled={loading}
                    >
                      {loading ? 'Criando conta...' : 'Criar Conta'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-xs text-muted-foreground">
              MiniTwitter v2.0 - Teste A/B em execução (Variante {abVariant})
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}