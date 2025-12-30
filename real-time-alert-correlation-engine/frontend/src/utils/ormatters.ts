// frontend/src/utils/formatters.ts
export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString();
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat().format(num);
};