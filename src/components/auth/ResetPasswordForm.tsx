import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ResetPasswordSchema } from "../../lib/schemas";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Alert, AlertDescription } from "../ui/alert";
import { EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react";

interface ResetPasswordFormProps {
  onSubmit?: (data: { password: string; confirmPassword: string }) => Promise<void>;
  isLoading?: boolean;
  error?: string;
  success?: boolean;
  token?: string | null;
  type?: string | null;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  onSubmit,
  isLoading = false,
  error,
  success = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(ResetPasswordSchema),
  });

  const handleFormSubmit = async (data: { password: string; confirmPassword: string }) => {
    if (onSubmit) {
      await onSubmit(data);
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Hasło zostało zresetowane</CardTitle>
          <CardDescription>Twoje hasło zostało pomyślnie zmienione</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Alert>
            <AlertDescription>Możesz teraz zalogować się używając nowego hasła.</AlertDescription>
          </Alert>
          <Button className="w-full mt-4" onClick={() => (window.location.href = "/auth/login")}>
            Przejdź do logowania
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Ustaw nowe hasło</CardTitle>
        <CardDescription>Wprowadź nowe hasło dla swojego konta</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Nowe hasło
            </label>
            <div className="relative">
              <Input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                disabled={isLoading}
                aria-invalid={errors.password ? "true" : "false"}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                <span className="sr-only">{showPassword ? "Ukryj hasło" : "Pokaż hasło"}</span>
              </Button>
            </div>
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Potwierdź nowe hasło
            </label>
            <div className="relative">
              <Input
                {...register("confirmPassword")}
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                disabled={isLoading}
                aria-invalid={errors.confirmPassword ? "true" : "false"}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                <span className="sr-only">{showConfirmPassword ? "Ukryj hasło" : "Pokaż hasło"}</span>
              </Button>
            </div>
            {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Resetowanie...
              </>
            ) : (
              "Zresetuj hasło"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
