import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface ProtectedRouteProps {
  roles?: string[];
  redirectTo?: string;
}

export default function ProtectedRoute({ roles, redirectTo = '/login' }: ProtectedRouteProps) {
  const { activeRole, sessions } = useSelector((s: RootState) => s.auth);
  const location = useLocation();

  const activeSession = activeRole ? sessions[activeRole] : null;
  const user = activeSession?.user ?? null;
  const accessToken = activeSession?.accessToken ?? null;

  if (!accessToken || !user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
