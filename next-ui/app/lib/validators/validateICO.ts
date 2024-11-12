export const validateICO = (ico: string) => {
  if (!/^\d{8}$/.test(ico)) return false;
  let sum = 0;
  const weights = [8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < weights.length; i++) {
    sum += parseInt(ico[i]) * weights[i];
  }
  const checkDigit = 11 - (sum % 11);
  if (checkDigit === 10) return false;
  if (checkDigit === 11) return 0;
  return checkDigit === parseInt(ico[7]);
};
