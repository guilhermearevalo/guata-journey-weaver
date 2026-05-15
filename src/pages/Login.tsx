import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, UserCog, Users, Briefcase, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  { label: 'Parceiro', email: 'parceiro@guata.test', icon: Briefcase, color: 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20', redirectTo: '/partner' },
  { label: 'Cliente', email: 'cliente@guata.test', icon: User, color: 'bg-green-500/10 text-green-600 hover:bg-green-500/20', redirectTo: '/minha-conta' },
];

export default function Login() {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

  // Signup state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);

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

    const userId = data?.user?.id;
    if (userId) {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      const role = roleData?.role || 'client';
      const isStaff = ['admin', 'consultant', 'manager'].includes(role);

      toast({ title: 'Bem-vindo de volta!', description: 'Login realizado com sucesso.' });

      if (isStaff) navigate('/admin');
      else if (role === 'partner') navigate('/partner');
      else navigate('/minha-conta');
    } else {
      navigate('/minha-conta');
    }

    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupPassword !== signupConfirm) {
      toast({ title: 'Senhas não conferem', variant: 'destructive' });
      return;
    }
    if (signupPassword.length < 6) {
      toast({ title: 'Senha muito curta', description: 'Mínimo 6 caracteres', variant: 'destructive' });
      return;
    }
    setSignupLoading(true);
    const { error } = await signUp(signupEmail, signupPassword, signupName);
    if (error) {
      toast({ title: 'Erro ao criar conta', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Conta criada!', description: 'Verifique seu e-mail para confirmar o cadastro.' });
      setTab('signin');
      setEmail(signupEmail);
    }
    setSignupLoading(false);
  };

  const handleDemoLogin = async (account: DemoAccount) => {
    setDemoLoading(account.email);

    let { error } = await signIn(account.email, 'teste123');

    if (error) {
      const { error: signUpError } = await signUp(account.email, 'teste123', account.label);
      if (signUpError) {
        toast({ title: 'Erro ao criar conta de teste', description: signUpError.message, variant: 'destructive' });
        setDemoLoading(null);
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 1500));
      const result = await signIn(account.email, 'teste123');
      error = result.error;
      if (!error) await supabase.rpc('update_demo_roles');
    }

    if (error) {
      toast({ title: 'Erro ao entrar', description: 'Não foi possível fazer login.', variant: 'destructive' });
    } else {
      toast({ title: `Logado como ${account.label}`, description: 'Redirecionando...' });
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
            <CardDescription>Acesse sua conta ou crie uma nova</CardDescription>
          </CardHeader>

          <Tabs value={tab} onValueChange={(v) => setTab(v as 'signin' | 'signup')}>
            <div className="px-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Criar conta</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="signin" className="mt-0">
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Senha</Label>
                      <Link to="/recuperar-senha" className="text-sm text-primary hover:underline">Esqueceu a senha?</Link>
                    </div>
                    <div className="relative">
                      <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                      <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Entrar
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    Ainda não tem conta?{' '}
                    <button type="button" onClick={() => setTab('signup')} className="font-medium text-primary hover:underline">
                      Cadastre-se grátis
                    </button>
                    {' '}para acompanhar sua viagem.
                  </p>
                </CardFooter>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-0">
              <form onSubmit={handleSignup}>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nome completo</Label>
                    <Input id="signup-name" value={signupName} onChange={(e) => setSignupName(e.target.value)} placeholder="Seu nome" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} placeholder="seu@email.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <Input id="signup-password" type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">Confirmar senha</Label>
                    <Input id="signup-confirm" type="password" value={signupConfirm} onChange={(e) => setSignupConfirm(e.target.value)} placeholder="Digite novamente" required />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={signupLoading}>
                    {signupLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Criar conta
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Demo Login Section */}
        <Card className="border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Login de Demonstração</CardTitle>
            <CardDescription className="text-xs">Clique para entrar com credenciais de teste</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {demoAccounts.map((account) => {
              const Icon = account.icon;
              const isLoading = demoLoading === account.email;
              return (
                <Button key={account.email} type="button" variant="ghost" className={`h-auto flex-col gap-1 py-3 ${account.color}`} onClick={() => handleDemoLogin(account)} disabled={demoLoading !== null}>
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
                  <span className="text-xs font-medium">{account.label}</span>
                </Button>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
