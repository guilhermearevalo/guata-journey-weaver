import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, UserCog, Users, Briefcase, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo-guata.png';

interface DemoAccount {
  label: string;
  email: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  redirectTo: string;
}

const demoAccounts: DemoAccount[] = [
  { label: 'Admin', email: 'admin@guata.test', icon: UserCog, color: 'bg-red-500/10 text-red-600 hover:bg-red-500/20', redirectTo: '/admin' },
  { label: 'Consultor', email: 'consultor@guata.test', icon: Users, color: 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20', redirectTo: '/admin' },
  { label: 'Parceiro', email: 'parceiro@guata.test', icon: Briefcase, color: 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20', redirectTo: '/' },
  { label: 'Cliente', email: 'cliente@guata.test', icon: User, color: 'bg-green-500/10 text-green-600 hover:bg-green-500/20', redirectTo: '/' },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error, data } = await signIn(email, password);

    if (error) {
      toast({
        title: 'Erro ao entrar',
        description: 'Email ou senha incorretos. Tente novamente.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    // Buscar role do usuário para redirecionamento
    const userId = data?.user?.id;
    if (userId) {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      const role = roleData?.role || 'client';
      const isStaff = ['admin', 'consultant', 'manager'].includes(role);

      toast({
        title: 'Bem-vindo de volta!',
        description: 'Login realizado com sucesso.',
      });

      if (isStaff) {
        navigate('/admin');
      } else if (role === 'partner') {
        navigate('/');
      } else {
        navigate('/');
      }
    } else {
      navigate('/');
    }

    setLoading(false);
  };

  const handleDemoLogin = async (account: DemoAccount) => {
    setDemoLoading(account.email);

    // Try to sign in first
    let { error } = await signIn(account.email, 'teste123');

    if (error) {
      // Account doesn't exist, create it
      const { error: signUpError } = await signUp(account.email, 'teste123', account.label);

      if (signUpError) {
        toast({
          title: 'Erro ao criar conta de teste',
          description: signUpError.message,
          variant: 'destructive',
        });
        setDemoLoading(null);
        return;
      }

      // Wait briefly for the trigger to create profile and role
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Try to sign in again
      const result = await signIn(account.email, 'teste123');
      error = result.error;

      if (!error) {
        // Call the function to update demo roles
        await supabase.rpc('update_demo_roles');
      }
    }

    if (error) {
      toast({
        title: 'Erro ao entrar',
        description: 'Não foi possível fazer login. Tente novamente.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: `Logado como ${account.label}`,
        description: 'Redirecionando...',
      });
      navigate(account.redirectTo);
    }

    setDemoLoading(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <Card>
          <CardHeader className="space-y-4 text-center">
            <Link to="/" className="mx-auto block">
              <img src={logo} alt="Guatá Travel Experience" className="mx-auto h-16 w-auto" />
            </Link>
            <div>
              <CardTitle className="font-display text-2xl">Entrar</CardTitle>
              <CardDescription>
                Acesse sua conta para gerenciar suas viagens
              </CardDescription>
            </div>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <Link
                    to="/recuperar-senha"
                    className="text-sm text-primary hover:underline"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Entrar
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Não tem uma conta?{' '}
                <Link to="/cadastro" className="text-primary hover:underline">
                  Criar conta
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>

        {/* Demo Login Section */}
        <Card className="border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Login de Demonstração</CardTitle>
            <CardDescription className="text-xs">
              Clique para preencher as credenciais de teste (senha: teste123)
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {demoAccounts.map((account) => {
              const Icon = account.icon;
              const isLoading = demoLoading === account.email;
              return (
                <Button
                  key={account.email}
                  type="button"
                  variant="ghost"
                  className={`h-auto flex-col gap-1 py-3 ${account.color}`}
                  onClick={() => handleDemoLogin(account)}
                  disabled={demoLoading !== null}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                  <span className="text-xs font-medium">{account.label}</span>
                </Button>
              );
            })}
          </CardContent>
          <CardFooter className="pt-0">
            <p className="text-xs text-muted-foreground">
              ⚠️ Clique em um botão para criar/entrar automaticamente
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}