import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import ChangePasswordForm from '@/components/auth/ChangePasswordForm';
import logo from '@/assets/logo-guata.png';

export default function RedefinirSenha() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (!mounted) return;
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setReady(true);
        setChecking(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session) {
        setReady(true);
      }
      setChecking(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <Link to="/" className="mx-auto block">
            <img src={logo} alt="Guatá Viagens e Turismo" className="mx-auto h-16 w-auto" />
          </Link>
          <div>
            <CardTitle className="font-display text-2xl">Redefinir senha</CardTitle>
            <CardDescription>
              {checking
                ? 'Validando link de recuperação...'
                : ready
                  ? 'Defina sua nova senha abaixo.'
                  : 'Link inválido ou expirado.'}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {checking ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : ready ? (
            <ChangePasswordForm
              requireCurrentPassword={false}
              title="Nova senha"
              description="Escolha uma senha com pelo menos 8 caracteres."
              submitLabel="Confirmar nova senha"
              onSuccess={() => navigate('/login')}
            />
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              Solicite um novo link em{' '}
              <Link to="/recuperar-senha" className="text-primary hover:underline">
                Recuperar senha
              </Link>
              .
            </p>
          )}
        </CardContent>

        <CardFooter className="justify-center border-t pt-4">
          <Link
            to="/login"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para o login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
