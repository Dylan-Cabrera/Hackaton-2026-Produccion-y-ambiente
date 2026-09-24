// Coordenadas aproximadas; verificar antes de la demo. Para otra provincia, alcanza con
// reemplazar esta lista (la telemetría, las necesidades y los dashboards agrupan por localidad).
export const LOCALITIES = [
  { name: 'Formosa', lat: -26.18, lng: -58.17 },
  { name: 'Clorinda', lat: -25.28, lng: -57.72 },
  { name: 'Pirané', lat: -25.73, lng: -59.11 },
  { name: 'El Colorado', lat: -26.31, lng: -59.37 },
  { name: 'Ibarreta', lat: -25.21, lng: -59.86 },
  { name: 'Las Lomitas', lat: -24.71, lng: -60.59 },
  { name: 'Laguna Blanca', lat: -25.13, lng: -58.25 },
  { name: 'Ingeniero Juárez', lat: -23.9, lng: -61.85 }
] as const;

export type LocalityName = (typeof LOCALITIES)[number]['name'];
