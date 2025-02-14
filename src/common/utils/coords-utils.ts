
import { CoordsDto } from "src/modules/restaurants/dto/restaurants.dto";

export const formatCoords = (coords: any): CoordsDto | null => {
    if (coords) {
      return {
        id: coords.id,
        title: coords.title,
        latitude: Number(coords.latitude),
        longitude: Number(coords.longitude),
        address: coords.address,
        latitudeDelta: coords.latitudeDelta || 0.0122,
        longitudeDelta: coords.longitudeDelta || 0.0122,
      };
    }
    return null;
  };
  