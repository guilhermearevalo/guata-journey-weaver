import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useMustChangePassword } from '@/hooks/useMustChangePassword';
import { Loader2 } from 'lucide-react';

interface ProtectedPartnerRouteProps {
  children: React.ReactNode;
}

export function ProtectedPartnerRoute({ children }: ProtectedPartnerRouteProps) {
  const { user, loading, hasRole } = useAuth();
  const { mustChangePassword, loading: passwordFlagLoading } = useMustChangePassword();
  const location = useLocation();

  if (loading || passwordFlagLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Allow partners or staff (staff can also access for testing/support)
  if (!hasRole('partner') && !hasRole('admin') && !hasRole('consultant') && !hasRole('manager')) {
    return <Navigate to="/" replace />;
  }

  if (hasRole('partner') && mustChangePassword && location.pathname !== '/partner/conta') {
    return <Navigate to="/partner/conta" replace />;
  }

  return <>{children}</>;
}
