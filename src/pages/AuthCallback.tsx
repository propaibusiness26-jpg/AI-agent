import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { error } = await supabase.auth.exchangeCodeForSession();

        if (error) {
          console.error('Auth callback error:', error);
          navigate('/?auth=error');
          return;
        }

        navigate('/');
      } catch (error) {
        console.error('Unexpected error during auth callback:', error);
        navigate('/?auth=error');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm text-slate-400 font-medium">Completing authentication...</p>
      </div>
    </div>
  );
}
