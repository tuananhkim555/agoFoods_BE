// foodFieldParser.ts

export class FoodFieldParser {
    static parseJSONSafely(data: any): any[] {
      // Ensure the data is a string before calling trim
      if (typeof data !== 'string') {
        return [];  // Return an empty array if the data is not a string
      }
  
      if (!data.trim()) {
        return [];  // If the data is empty or just whitespace, return an empty array
      }
  
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error("Error parsing JSON", e, "Data:", data);
        return [];
      }
    }
  
    static parseFoodFields(food: any): any {
      return {
        ...food,
        foodTags: FoodFieldParser.parseJSONSafely(food.foodTags),
        foodType: FoodFieldParser.parseJSONSafely(food.foodType),
        additives: FoodFieldParser.parseJSONSafely(food.additives),
      };
    }
  }
  

  