import { ITelemetryService } from '../interfaces/telemetry-service.interface.js';
import { ITelemetryRepository } from '../interfaces/telemetry-repository.interface.js';
import { IProductRepository } from '../interfaces/product-repository.interface.js';
import { TelemetryEventInput } from '../interfaces/telemetry.types.js';
import { Category } from '../constants/catalog.constants.js';
import { CoordinatesTuple } from '../interfaces/geo.types.js';
import { TelemetryMapper, ResolvedTelemetryContext } from '../mappers/telemetry.mapper.js';
import { localityCentroid, nearestLocality } from '../utils/geo.js';

// Caso de uso "telemetría de demanda": nunca falla de cara al cliente (fire-and-forget).
// Depende únicamente de abstracciones (DIP), lo que permite testearlo con dobles sin tocar Sequelize.
export class TelemetryService implements ITelemetryService {
  // Productos de muestra para inferir la categoría más frecuente de un término buscado
  private static readonly CATEGORY_SAMPLE_LIMIT = 100;

  constructor(
    private readonly telemetryRepository: ITelemetryRepository,
    private readonly productRepository: IProductRepository
  ) {}

  async recordEvent(input: TelemetryEventInput, userId: number | null): Promise<void> {
    try {
      const resolved = await this.resolve(input);
      if (!resolved) {
        // Combinación inválida (ej: el producto no pertenece al productor indicado): se
        // descarta en silencio, para no darle a un cliente malicioso pistas sobre otro productor.
        return;
      }

      await this.telemetryRepository.create(TelemetryMapper.toPersistence(input, userId, resolved));
    } catch (error) {
      console.error('No se pudo registrar el evento de telemetría:', error);
    }
  }

  async clearActivity(userId: number): Promise<void> {
    await this.telemetryRepository.clearUserActivity(userId);
  }

  private async resolve(input: TelemetryEventInput): Promise<ResolvedTelemetryContext | null> {
    let category = input.category ?? null;

    if (input.eventType === 'WHATSAPP_CLICK' && input.productId) {
      const product = await this.productRepository.findById(input.productId);
      if (!product || (input.producerId !== undefined && product.producerId !== input.producerId)) {
        return null;
      }
      category = product.category;
    }

    if (input.eventType === 'SEARCH_HIT' && !category && input.queryTerm) {
      category = await this.inferCategoryFromQuery(input.queryTerm);
    }

    const { locality, coordinates } = this.resolveGeo(input);
    return { category, locality, coordinates };
  }

  // Si viene locality sin coordenadas, usa su centroide. Si vienen coordenadas sin
  // locality, asigna la localidad más cercana. Si vienen ambos, se respetan tal cual.
  private resolveGeo(input: TelemetryEventInput): { locality: string | null; coordinates: CoordinatesTuple | null } {
    const hasCoords = input.lat !== undefined && input.lng !== undefined;

    if (hasCoords && input.locality) {
      return { locality: input.locality, coordinates: [input.lng!, input.lat!] };
    }
    if (hasCoords) {
      return { locality: nearestLocality(input.lat!, input.lng!), coordinates: [input.lng!, input.lat!] };
    }
    if (input.locality) {
      const centroid = localityCentroid(input.locality);
      return { locality: input.locality, coordinates: centroid ? [centroid.lng, centroid.lat] : null };
    }
    return { locality: null, coordinates: null };
  }

  private async inferCategoryFromQuery(queryTerm: string): Promise<Category | null> {
    const { items } = await this.productRepository.search({
      q: queryTerm,
      limit: TelemetryService.CATEGORY_SAMPLE_LIMIT,
      offset: 0
    });
    if (items.length === 0) {
      return null;
    }

    const counts = new Map<Category, number>();
    for (const item of items) {
      counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
    }

    let best = items[0].category;
    let bestCount = 0;
    for (const [category, count] of counts) {
      if (count > bestCount) {
        best = category;
        bestCount = count;
      }
    }
    return best;
  }
}
