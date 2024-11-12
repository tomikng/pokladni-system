export function validatePhoneNumber(phoneNumber: string) {
  const pattern = /^\+?\d+$/;
  return pattern.test(phoneNumber);
}
