const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '';

function joinUrl(baseUrl: string, path: string): string {
  if (!baseUrl) {
    return path;
  }

  return `${baseUrl.replace(/\/$/, '')}${path}`;
}

export function getGoogleLoginUrl(): string {
  return joinUrl(apiBaseUrl, '/api/auth/google/login');
}

export function bindAuthLinks(root: ParentNode): void {
  const loginUrl = getGoogleLoginUrl();
  const links = root.querySelectorAll<HTMLAnchorElement>('[data-auth-link]');

  links.forEach((link) => {
    link.href = loginUrl;
  });
}
