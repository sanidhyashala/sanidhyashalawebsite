export function getSignInUrl() {
  if (typeof window === "undefined") {
    return "/sign-in";
  }

  const currentUrl =
    window.location.pathname +
    window.location.search;

  return `/sign-in?redirect_url=${encodeURIComponent(
    currentUrl
  )}`;
}