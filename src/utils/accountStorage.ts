export function getAccountStorageKey(
  key: string,
  email: string
) {
  return `${key}:${encodeURIComponent(email.toLowerCase())}`;
}