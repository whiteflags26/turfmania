export const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;

  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

export const sanitizeString = (str: string): string => {
  if (!str || typeof str !== 'string') return '';
  return str.trim();
};
