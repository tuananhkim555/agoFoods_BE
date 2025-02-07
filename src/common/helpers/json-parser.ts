export class JsonParser {
    // Phương thức phân tích cú pháp JSON an toàn
    static safeJsonParse<T>(value: unknown): T[] {
      if (!value) return [];
      
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch (error) {
          console.error('JSON parse error:', error);
          return [];
        }
      }
      
      // Nếu giá trị đã là object/array, trả về như hiện tại
      return value as T[];
    }
  }
  