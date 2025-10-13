import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ForgotPasswordSchema } from '../../lib/schemas';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2Icon, ArrowLeftIcon } from 'lucide-react';

interface ForgotPasswordFormProps {
  onSubmit?: (data: { email: string }) => Promise<void>;
  isLoading?: boolean;
  error?: string;
  success?: boolean;
  onBackToLogin?: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onSubmit,
  isLoading = false,
  error,
  success = false,
  onBackToLogin,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(ForgotPasswordSchema),
  });

  const handleFormSubmit = async (data: { email: string }) => {
    if (onSubmit) {
      await onSubmit(data);
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Sprawdź swoją skrzynkę</CardTitle>
          <CardDescription>
            Wysłaliśmy link do resetowania hasła na podany adres email
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Alert>
            <AlertDescription>
              Jeśli nie widzisz wiadomości, sprawdź folder spam lub spróbuj ponownie.
            </AlertDescription>
          </Alert>
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={onBackToLogin}
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Powrót do logowania
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Zapomniałeś hasła?</CardTitle>
        <CardDescription>
          Wprowadź swój adres email, a wyślemy Ci link do resetowania hasła
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              {...register('email')}
              type="email"
              placeholder="twoj@email.com"
              disabled={isLoading}
              aria-invalid={errors.email ? 'true' : 'false'}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Wysyłanie...
              </>
            ) : (
              'Wyślij link resetujący'
            )}
          </Button>

          <div className="text-center">
            <Button
              type="button"
              variant="link"
              className="text-sm"
              onClick={onBackToLogin}
              disabled={isLoading}
            >
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Powrót do logowania
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
