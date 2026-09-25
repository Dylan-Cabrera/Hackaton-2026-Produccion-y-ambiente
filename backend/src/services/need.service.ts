import { INeedService, RequesterContext } from '../interfaces/need-service.interface.js';
import { INeedMatchingService } from '../interfaces/need-matching-service.interface.js';
import { INeedRepository } from '../interfaces/need-repository.interface.js';
import { IUserRepository } from '../interfaces/user-repository.interface.js';
import {
  CreateNeedInput,
  NeedMatch,
  NeedSearchResponse,
  PublicNeed,
  PublicNeedWithMatchCount,
  SearchNeedsInput,
  UpdateNeedInput
} from '../interfaces/need.types.js';
import { NeedMapper } from '../mappers/need.mapper.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../errors/app-error.js';

// Caso de uso "publicación de necesidades" (HU-11): alta, edición, listados y detalle.
// El algoritmo de matching vive aparte, en INeedMatchingService (responsabilidad única).
export class NeedService implements INeedService {
  private static readonly TOP_MATCHES_ON_CREATE = 3;
  private static readonly DEFAULT_SEARCH_LIMIT = 24;

  constructor(
    private readonly needRepository: INeedRepository,
    private readonly userRepository: IUserRepository,
    private readonly matchingService: INeedMatchingService
  ) {}

  async create(userId: number, input: CreateNeedInput): Promise<{ need: PublicNeed; matchCount: number; topMatches: NeedMatch[] }> {
    const author = await this.userRepository.findById(userId);
    if (!author) {
      throw new NotFoundError('Usuario no encontrado');
    }
    if (!author.phone) {
      throw new ValidationError('Agregá un teléfono a tu perfil para que puedan contactarte');
    }

    const persistence = NeedMapper.toCreatePersistence(userId, input, {
      locality: author.locality,
      coordinates: author.coordinates
    });
    const record = await this.needRepository.create(persistence);

    const { matches, total } = await this.matchingService.getTopMatchesWithCount(record, NeedService.TOP_MATCHES_ON_CREATE);
    const withAuthor = await this.needRepository.findByIdWithAuthor(record.id);

    return {
      need: NeedMapper.toPublic(withAuthor!, { userId, role: null }),
      matchCount: total,
      topMatches: matches
    };
  }

  async getById(id: number, requester: RequesterContext): Promise<PublicNeed> {
    const record = await this.needRepository.findByIdWithAuthor(id);
    if (!record) {
      throw new NotFoundError('Necesidad no encontrada');
    }
    return NeedMapper.toPublic(record, requester);
  }

  async update(id: number, userId: number, input: UpdateNeedInput): Promise<PublicNeed> {
    const existing = await this.needRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Necesidad no encontrada');
    }
    if (existing.userId !== userId) {
      throw new ForbiddenError('No tiene permisos para editar esta necesidad');
    }

    const patch = NeedMapper.toUpdatePersistence(input);
    const updated = await this.needRepository.update(id, patch);
    if (!updated) {
      throw new NotFoundError('Necesidad no encontrada');
    }

    const withAuthor = await this.needRepository.findByIdWithAuthor(id);
    return NeedMapper.toPublic(withAuthor!, { userId, role: null });
  }

  async listMine(userId: number): Promise<PublicNeedWithMatchCount[]> {
    const records = await this.needRepository.findAllByUser(userId);

    return Promise.all(
      records.map(async (record) => {
        const withAuthor = await this.needRepository.findByIdWithAuthor(record.id);
        const { total } = await this.matchingService.getTopMatchesWithCount(record, 0);
        return NeedMapper.toPublicWithMatchCount(withAuthor!, { userId, role: null }, total);
      })
    );
  }

  async search(input: SearchNeedsInput, requester: RequesterContext): Promise<NeedSearchResponse> {
    const limit = input.limit ?? NeedService.DEFAULT_SEARCH_LIMIT;
    const offset = input.offset ?? 0;

    const { items, total } = await this.needRepository.search({
      status: 'OPEN',
      category: input.category,
      locality: input.locality,
      lat: input.lat,
      lng: input.lng,
      limit,
      offset
    });

    return {
      items: items.map((item) => NeedMapper.toPublic(item, requester)),
      limit,
      offset,
      total
    };
  }
}
