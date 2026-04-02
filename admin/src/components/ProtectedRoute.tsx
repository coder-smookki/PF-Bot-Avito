import { Navigate } from 'react-router-dom';

interface Props {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const username = localStorage.getItem('admin_username');
  const password = localStorage.getItem('admin_password');

  if (!username || !password) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
