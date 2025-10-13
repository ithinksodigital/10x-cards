import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';

type AuthMode = 'login' | 'register' | 'forgot-password';

interface AuthContainerProps {
  initialMode?: AuthMode;
  onSuccess?: (mode: AuthMode) => void;
}

export const AuthContainer: React.FC<AuthContainerProps> = ({
  initialMode = 'login',
  onSuccess,
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  const handleLogin = async (data: { email: string; password: string }) => {
    setIsLoading(true);
    setError('');
    
    try {
      // TODO: Implement actual login logic
      console.log('Login attempt:', data);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
      
      setSuccess(true);
      onSuccess?.('login');
      
      // Redirect to dashboard after successful login
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd logowania');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: { email: string; password: string; confirmPassword: string }) => {
    setIsLoading(true);
    setError('');
    
    try {
      // TODO: Implement actual registration logic
      console.log('Registration attempt:', data);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
      
      setSuccess(true);
      onSuccess?.('register');
      
      // Redirect to dashboard after successful registration
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd rejestracji');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (data: { email: string }) => {
    setIsLoading(true);
    setError('');
    
    try {
      // TODO: Implement actual password reset logic
      console.log('Password reset attempt:', data);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
      
      setSuccess(true);
      onSuccess?.('forgot-password');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd resetowania hasła');
    } finally {
      setIsLoading(false);
    }
  };

  const switchToLogin = () => {
    setMode('login');
    setError('');
    setSuccess(false);
  };

  const switchToRegister = () => {
    setMode('register');
    setError('');
    setSuccess(false);
  };

  const switchToForgotPassword = () => {
    setMode('forgot-password');
    setError('');
    setSuccess(false);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {mode === 'login' && (
        <LoginForm
          onSubmit={handleLogin}
          isLoading={isLoading}
          error={error}
          onSwitchToRegister={switchToRegister}
          onSwitchToForgotPassword={switchToForgotPassword}
        />
      )}
      
      {mode === 'register' && (
        <RegisterForm
          onSubmit={handleRegister}
          isLoading={isLoading}
          error={error}
          onSwitchToLogin={switchToLogin}
        />
      )}
      
      {mode === 'forgot-password' && (
        <ForgotPasswordForm
          onSubmit={handleForgotPassword}
          isLoading={isLoading}
          error={error}
          success={success}
          onBackToLogin={switchToLogin}
        />
      )}
    </div>
  );
};
