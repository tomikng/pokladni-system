export const validateDIC = (dic: string) => {
  return /^CZ\d{8,10}$/.test(dic);
};
