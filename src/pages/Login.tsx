import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, UserCog, Users, Briefcase, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import logo from '@/assets/logo-guata.png';

const demoAccounts = [
  { label: 'Admin', email: 'admin@guata.test', icon: UserCog, color: 'bg-red-500/10 text-red-600 hover:bg-red-500/20' },
  { label: 'Consultor', email: 'consultor@guata.test', icon: Users, color: 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20' },
  { label: 'Parceiro', email: 'parceiro@guata.test', icon: Briefcase, color: 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20' },
  { label: 'Cliente', email: 'cliente@guata.test', icon: User, color: 'bg-green-500/10 text-green-600 hover:bg-green-500/20' },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: 'Erro ao entrar',
        description: 'Email ou senha incorretos. Tente novamente.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Bem-vindo de volta!',
        description: 'Login realizado com sucesso.',
      });
      navigate('/');
    }

    setLoading(false);
  };

  const handleDemoLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('teste123');
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
              return (
                <Button
                  key={account.email}
                  type="button"
                  variant="ghost"
                  className={`h-auto flex-col gap-1 py-3 ${account.color}`}
                  onClick={() => handleDemoLogin(account.email)}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{account.label}</span>
                </Button>
              );
            })}
          </CardContent>
          <CardFooter className="pt-0">
            <p className="text-xs text-muted-foreground">
              ⚠️ Crie as contas primeiro em <Link to="/cadastro" className="text-primary hover:underline">/cadastro</Link> com os emails acima
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}