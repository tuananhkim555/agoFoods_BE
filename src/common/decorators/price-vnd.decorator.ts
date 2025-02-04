import { Transform } from 'class-transformer';

export function PriceVND() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      const parsedValue = parseFloat(value.replace(/[^0-9.-]+/g, '')); // Loại bỏ các ký tự không phải số
      if (isNaN(parsedValue)) {
        throw new Error('Price must be a valid number.');
      }
      return parsedValue;
    }
    return value; // Giữ nguyên nếu đã là số
  });
}
