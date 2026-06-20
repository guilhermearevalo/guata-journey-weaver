import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';
import ChangePasswordForm from '@/components/auth/ChangePasswordForm';
import { useAuth } from '@/lib/auth';
import { useMustChangePassword } from '@/hooks/useMustChangePassword';

export default function PartnerConta() {
  const { user } = useAuth();
  const { mustChangePassword, refetch } = useMustChangePassword();
  const navigate = useNavigate();
  const forcedChange = mustChangePassword;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Minha conta</h1>
        <p className="text-muted-foreground">Gerencie a segurança do seu acesso ao portal.</p>
      </div>

      {mustChangePassword && (
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Troca de senha obrigatória</AlertTitle>
          <AlertDescription>
            Este é seu primeiro acesso (ou sua senha foi redefinida). Defina uma nova senha para continuar usando o portal.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Segurança</CardTitle>
          <CardDescription>
            Conta: <span className="font-medium text-foreground">{user?.email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm
            email={user?.email}
            requireCurrentPassword={!mustChangePassword}
            title={mustChangePassword ? 'Defina sua senha' : 'Alterar senha'}
            description={
              mustChangePassword
                ? 'A senha temporária não pode ser usada permanentemente.'
                : 'Informe a senha atual para confirmar a alteração.'
            }
            onSuccess={async () => {
              await refetch();
              if (forcedChange) navigate('/partner', { replace: true });
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
