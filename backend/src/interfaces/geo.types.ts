export type CoordinatesTuple = [number, number]; // [longitud, latitud]

export interface GeoJSONPoint {
  type: 'Point';
  coordinates: CoordinatesTuple;
}
