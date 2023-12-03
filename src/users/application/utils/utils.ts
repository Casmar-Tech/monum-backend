export function isStrongPassword(password: string): boolean {
  // Length of at least 8 characters and no more than 128 characters
  if (password.length < 8 || password.length > 128) {
    return false;
  }

  // Contains uppercase, lowercase, numbers, and symbols
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSymbols = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  // Should not contain common words or easily guessable sequences (simple example here)
  const commonWords = ["password", "123456", "qwerty"];
  const isCommonWord = commonWords.some((word) =>
    password.toLowerCase().includes(word)
  );

  // Returns true if all criteria are true and the password is not a common word
  return (
    hasUpperCase && hasLowerCase && hasNumbers && hasSymbols && !isCommonWord
  );
}
