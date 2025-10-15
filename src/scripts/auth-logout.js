// Call backend logout API, then redirect
document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("logout-container");
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    // ignore, we still proceed to cleanup and redirect
  } finally {
    try {
      localStorage.removeItem("anonymous_session");
      sessionStorage.clear();
    } catch {
      // ignore cleanup errors
    }
    if (container) {
      container.innerHTML =
        '<div class="text-center space-y-4">' +
        '<div class="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">' +
        '<svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>' +
        "</svg>" +
        "</div>" +
        "<div>" +
        '<h3 class="text-lg font-semibold">Wylogowano pomyślnie</h3>' +
        '<p class="text-sm text-muted-foreground">Przekierowywanie...</p>' +
        "</div>" +
        "</div>";
    }
    setTimeout(() => {
      window.location.href = "/";
    }, 800);
  }
});
