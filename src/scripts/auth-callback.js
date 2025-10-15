// Handle OAuth callback
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("auth-callback-container");
  const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get("error");
  const errorDescription = urlParams.get("error_description");

  if (container) {
    // Show loading state
    container.innerHTML =
      '<div class="text-center space-y-4">' +
      '<div class="mx-auto w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>' +
      '<p class="text-muted-foreground">Przetwarzanie autoryzacji...</p>' +
      "</div>";

    // Simulate OAuth processing
    setTimeout(() => {
      if (error) {
        container.innerHTML =
          '<div class="text-center space-y-4">' +
          '<div class="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">' +
          '<svg class="w-6 h-6 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
          '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>' +
          "</svg>" +
          "</div>" +
          "<div>" +
          '<h3 class="text-lg font-semibold text-destructive">Błąd autoryzacji</h3>' +
          '<p class="text-sm text-muted-foreground">' +
          (errorDescription || error) +
          "</p>" +
          "</div>" +
          '<button onclick="window.location.href=\'/auth/login\'" class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">' +
          "Powrót do logowania" +
          "</button>" +
          "</div>";
      } else {
        // Success - redirect to dashboard or home
        container.innerHTML =
          '<div class="text-center space-y-4">' +
          '<div class="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">' +
          '<svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
          '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>' +
          "</svg>" +
          "</div>" +
          "<div>" +
          '<h3 class="text-lg font-semibold">Autoryzacja pomyślna!</h3>' +
          '<p class="text-sm text-muted-foreground">Przekierowywanie...</p>' +
          "</div>" +
          "</div>";

        // Redirect after a short delay
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1500);
      }
    }, 2000);
  }
});
