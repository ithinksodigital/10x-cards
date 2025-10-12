// src/lib/services/set.service.ts
import type { SupabaseClient } from '../../db/supabase.client';
import type { SetDto, CreateSetCommand, UpdateSetCommand, PaginationDto } from '../../types';
import { NotFoundError, ConflictError } from '../errors';

/**
 * Query parameters for listing sets
 */
export interface ListSetsQuery {
  page?: number;
  limit?: number;
  search?: string;
  sort?: 'created_at' | 'updated_at' | 'name';
  order?: 'asc' | 'desc';
}

/**
 * Service for managing flashcard sets
 */
export class SetService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * List sets for a user with pagination and filtering
   */
  async listSets(
    userId: string,
    query: ListSetsQuery
  ): Promise<{ data: SetDto[]; pagination: PaginationDto }> {
    const {
      page = 1,
      limit = 50,
      search,
      sort = 'created_at',
      order = 'desc',
    } = query;

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build base query
    let baseQuery = this.supabase
      .from('sets')
      .select('id, user_id, name, language, cards_count, created_at, updated_at', { count: 'exact' })
      .eq('user_id', userId);

    // Apply search filter if provided
    if (search) {
      baseQuery = baseQuery.ilike('name', `%${search}%`);
    }

    // Apply sorting
    baseQuery = baseQuery.order(sort, { ascending: order === 'asc' });

    // Apply pagination
    baseQuery = baseQuery.range(offset, offset + limit - 1);

    // Execute query
    const { data, error, count } = await baseQuery;

    if (error) {
      throw error;
    }

    // Calculate pagination metadata
    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data: data ?? [],
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
      },
    };
  }

  /**
   * Get a single set by ID
   * @throws {NotFoundError} If set not found or doesn't belong to user
   */
  async getSet(setId: string, userId: string): Promise<SetDto> {
    const { data, error } = await this.supabase
      .from('sets')
      .select('id, user_id, name, language, cards_count, created_at, updated_at')
      .eq('id', setId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new NotFoundError('Set');
    }

    return data;
  }

  /**
   * Create a new set
   * @throws {ConflictError} If set name already exists for user
   */
  async createSet(command: CreateSetCommand, userId: string): Promise<SetDto> {
    const { data, error } = await this.supabase
      .from('sets')
      .insert({
        user_id: userId,
        name: command.name,
        language: command.language,
      })
      .select('id, user_id, name, language, cards_count, created_at, updated_at')
      .single();

    if (error) {
      // Check for unique constraint violation (duplicate name)
      if (error.code === '23505') {
        throw new ConflictError('Set with this name already exists', 'DUPLICATE_SET_NAME');
      }
      throw error;
    }

    return data;
  }

  /**
   * Update a set's name
   * @throws {NotFoundError} If set not found
   * @throws {ConflictError} If new name conflicts with existing set
   */
  async updateSet(
    setId: string,
    command: UpdateSetCommand,
    userId: string
  ): Promise<SetDto> {
    const { data, error } = await this.supabase
      .from('sets')
      .update({
        name: command.name,
        updated_at: new Date().toISOString(),
      })
      .eq('id', setId)
      .eq('user_id', userId)
      .select('id, user_id, name, language, cards_count, created_at, updated_at')
      .single();

    if (error) {
      // Check for unique constraint violation
      if (error.code === '23505') {
        throw new ConflictError('Set with this name already exists', 'DUPLICATE_SET_NAME');
      }
      throw error;
    }

    if (!data) {
      throw new NotFoundError('Set');
    }

    return data;
  }

  /**
   * Delete a set and all its cards (CASCADE)
   * @throws {NotFoundError} If set not found
   */
  async deleteSet(setId: string, userId: string): Promise<{ cardsCount: number }> {
    // First, get the cards count before deletion
    const set = await this.getSet(setId, userId);
    const cardsCount = set.cards_count;

    // Delete the set (cards will be deleted via CASCADE)
    const { error } = await this.supabase
      .from('sets')
      .delete()
      .eq('id', setId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return { cardsCount };
  }

  /**
   * Verify set ownership (helper method for other services)
   * @throws {NotFoundError} If set not found or doesn't belong to user
   */
  async verifySetOwnership(setId: string, userId: string): Promise<void> {
    await this.getSet(setId, userId);
  }
}

