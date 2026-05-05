/**
 * Dummy auth store – replace with real auth (AsyncStorage, context, etc.)
 */
export let isLoggedIn = false;

export interface AuthUser {
  name?: string;
  phone: string;
  id: string;
}

export let user: AuthUser | null = null;

export function setLoggedIn(value: boolean): void {
  isLoggedIn = value;
}

export function setUser(u: AuthUser | null): void {
  user = u;
}
