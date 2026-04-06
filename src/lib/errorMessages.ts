const ERROR_KEY_MAP: Record<string, string> = {
  'Invalid login credentials': 'errors.invalidCredentials',
  'User already registered': 'errors.userExists',
  'Email not confirmed': 'errors.emailNotConfirmed',
  'Password should be at least 6 characters': 'errors.weakPassword',
  'Unable to validate email address': 'errors.invalidEmail',
  'Signup requires a valid password': 'errors.enterPassword',
};

/**
 * Translate a Supabase error message using a next-intl t() function.
 * Falls back to the original message if no mapping is found.
 */
export function translateError(msg: string, t?: (key: string) => string): string {
  const key = ERROR_KEY_MAP[msg];
  if (key && t) {
    return t(key);
  }
  return msg;
}
