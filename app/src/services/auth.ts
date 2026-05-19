/**
 * 90Minutes — Authentication Service
 * Per services-and-data.md: uses AWS Cognito for user management.
 * Per coding-standards.md: tokens stored in SecureStore, never AsyncStorage.
 *
 * For hackathon demo: guest mode creates a local-only session.
 */

// TODO: uncomment when amazon-cognito-identity-js is properly installed
// import {
//   CognitoUserPool,
//   CognitoUser,
//   AuthenticationDetails,
//   CognitoUserAttribute,
// } from 'amazon-cognito-identity-js';

/** Auth configuration — values come from CDK outputs */
interface AuthConfig {
  userPoolId: string;
  clientId: string;
  region: string;
}

/** Authenticated user session */
export interface AuthSession {
  userId: string;
  username: string;
  email?: string;
  isGuest: boolean;
  token?: string;
}

/** Current session stored in memory */
let currentSession: AuthSession | null = null;

/**
 * Get the current auth config from environment variables.
 */
function getConfig(): AuthConfig {
  return {
    userPoolId: process.env.EXPO_PUBLIC_USER_POOL_ID || '',
    clientId: process.env.EXPO_PUBLIC_CLIENT_ID || '',
    region: process.env.EXPO_PUBLIC_API_REGION || 'us-east-1',
  };
}

/**
 * Register a new user with Cognito.
 * @param username - Fan display name
 * @param email - Email address
 * @param password - Password (min 8 chars, uppercase, lowercase, number)
 */
export async function signUp(
  username: string,
  email: string,
  password: string,
): Promise<AuthSession> {
  // TODO: implement with Cognito SDK when sandbox is configured
  // For now, create a local session for development
  const session: AuthSession = {
    userId: `user_${Date.now()}`,
    username,
    email,
    isGuest: false,
  };
  currentSession = session;
  return session;
}

/**
 * Sign in an existing user.
 * @param email - Email address
 * @param password - Password
 */
export async function signIn(
  email: string,
  password: string,
): Promise<AuthSession> {
  // TODO: implement with Cognito SDK
  const session: AuthSession = {
    userId: `user_${Date.now()}`,
    username: email.split('@')[0] || 'Fan',
    email,
    isGuest: false,
  };
  currentSession = session;
  return session;
}

/**
 * Create a guest session (no Cognito account).
 * Used for the jury demo — instant access without registration.
 * @param fanName - Display name chosen by the user
 */
export function createGuestSession(fanName?: string): AuthSession {
  const id = `guest_${Date.now().toString(36)}`;
  const session: AuthSession = {
    userId: id,
    username: fanName || `Fan_${id.slice(-4)}`,
    isGuest: true,
  };
  currentSession = session;
  return session;
}

/**
 * Get the current authenticated session.
 * Returns null if not authenticated.
 */
export function getCurrentSession(): AuthSession | null {
  return currentSession;
}

/**
 * Sign out the current user.
 */
export function signOut(): void {
  // TODO: call Cognito signOut when implemented
  currentSession = null;
}

/**
 * Check if a user is currently authenticated.
 */
export function isAuthenticated(): boolean {
  return currentSession !== null;
}
