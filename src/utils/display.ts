export function displayName(name: string): string {
  return name ? name.charAt(0).toUpperCase() + name.slice(1) : name
}

export function displayRealm(realm: string): string {
  return realm
    .split('-')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ')
}
