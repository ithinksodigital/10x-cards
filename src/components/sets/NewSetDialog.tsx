import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import type { CreateSetCommand } from "@/types";

interface NewSetDialogProps {
  onCreateSet: (command: CreateSetCommand) => Promise<void>;
  isLoading?: boolean;
  trigger?: React.ReactNode;
}

const languageOptions = [
  { value: "pl", label: "Polski" },
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
];

export function NewSetDialog({ onCreateSet, isLoading = false, trigger }: NewSetDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<CreateSetCommand>({
    name: "",
    language: "pl",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset errors
    setErrors({});

    // Validate form
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nazwa zestawu jest wymagana";
    } else if (formData.name.length > 100) {
      newErrors.name = "Nazwa zestawu nie może przekraczać 100 znaków";
    }

    if (!formData.language) {
      newErrors.language = "Język jest wymagany";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      await onCreateSet(formData);
      // Reset form and close dialog on success
      setFormData({ name: "", language: "pl" });
      setOpen(false);
    } catch (error) {
      // Error handling is done in parent component
      // eslint-disable-next-line no-console
      console.error("Error creating set:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof CreateSetCommand, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      setOpen(newOpen);
      if (!newOpen) {
        // Reset form when closing
        setFormData({ name: "", language: "pl" });
        setErrors({});
      }
    }
  };

  const defaultTrigger = (
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      Utwórz nowy zestaw
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Utwórz nowy zestaw</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="set-name">Nazwa zestawu</Label>
            <Input
              id="set-name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="np. Angielski - Podstawy"
              maxLength={100}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {errors.name && (
              <p id="name-error" className="text-sm text-destructive">
                {errors.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="set-language">Język</Label>
            <Select value={formData.language} onValueChange={(value) => handleInputChange("language", value)}>
              <SelectTrigger
                aria-invalid={!!errors.language}
                aria-describedby={errors.language ? "language-error" : undefined}
              >
                <SelectValue placeholder="Wybierz język" />
              </SelectTrigger>
              <SelectContent>
                {languageOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.language && (
              <p id="language-error" className="text-sm text-destructive">
                {errors.language}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {isSubmitting ? "Tworzenie..." : "Utwórz zestaw"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
