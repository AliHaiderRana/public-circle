import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { paths } from '@/routes/paths';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4 text-gray-900">404</h1>
        <p className="text-xl text-gray-500 mb-8">Page not found</p>
        <Button onClick={() => navigate(paths.auth.jwt.signIn)}>
          Go to Sign In
        </Button>
      </div>
    </div>
  );
}
