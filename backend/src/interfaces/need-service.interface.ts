import { Role } from '../constants/user.constants.js';
import {
  CreateNeedInput,
  NeedSearchResponse,
  PublicNeed,
  PublicNeedWithMatchCount,
  SearchNeedsInput,
  UpdateNeedInput
} from './need.types.js';
import { NeedMatch } from './need.types.js';

// Quién hace la consulta: determina si ve el teléfono del autor (regla de privacidad de HU-11)
export interface RequesterContext {
  userId: number | null;
  role: Role | null;
}

export interface INeedService {
  create(
    userId: number,
    input: CreateNeedInput
  ): Promise<{ need: PublicNeed; matchCount: number; topMatches: NeedMatch[] }>;
  getById(id: number, requester: RequesterContext): Promise<PublicNeed>;
  update(id: number, userId: number, input: UpdateNeedInput): Promise<PublicNeed>;
  listMine(userId: number): Promise<PublicNeedWithMatchCount[]>;
  search(input: SearchNeedsInput, requester: RequesterContext): Promise<NeedSearchResponse>;
}
