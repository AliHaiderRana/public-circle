import { Navigate } from 'react-router-dom';
import { paths } from '@/routes/paths';

export default function DashboardPage() {
  return <Navigate to={paths.dashboard.analytics} replace />;
}
