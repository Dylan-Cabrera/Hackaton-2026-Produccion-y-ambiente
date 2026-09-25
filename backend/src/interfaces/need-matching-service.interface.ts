import { RequesterContext } from './need-service.interface.js';
import { GetMatchesOptions, NeedMatch, NeedMatchesResponse, ForProducerNeed, NeedRecord } from './need.types.js';

// Caso de uso del algoritmo de matching de HU-11, separado de INeedService (CRUD) por responsabilidad.
export interface INeedMatchingService {
  // GET /api/needs/:id/matches: solo el autor o un ADMIN pueden verlos (403 si no).
  // Permite pisar el radiusKm/limit de la necesidad.
  getMatchesFor(needId: number, requester: RequesterContext, options: GetMatchesOptions): Promise<NeedMatchesResponse>;
  // Usado por POST /api/needs y GET /api/needs/mine: los `limit` mejores + el total de candidatos
  getTopMatchesWithCount(need: NeedRecord, limit: number): Promise<{ matches: NeedMatch[]; total: number }>;
  getForProducer(producerId: number): Promise<ForProducerNeed[]>;
}
