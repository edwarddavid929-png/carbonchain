import { Injectable } from '@nestjs/common';
import { CreditEntity } from './credit.entity';
import { CreditStatus } from '../shared';

export interface PageResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface CursorResult<T> {
  data: T[];
  total: number;
  nextCursor: string | null;
}

export interface CreditFilter {
  status?: CreditStatus;
  methodology?: string;
  geography?: string;
  vintageYear?: number;
  minTonnes?: string;
  maxTonnes?: string;
}

export interface ICreditRepository {
  save(credit: CreditEntity): Promise<CreditEntity>;
  findById(id: string): Promise<CreditEntity | undefined>;
  findByProject(
    projectId: string,
    page: number,
    limit: number,
  ): Promise<PageResult<CreditEntity>>;
  findAll(page: number, limit: number): Promise<PageResult<CreditEntity>>;
  /**
   * Return a paginated list of credits whose status matches `status`.
   * When `status` is omitted the caller is responsible for applying a default.
   */
  findByStatus(
    status: CreditStatus,
    page: number,
    limit: number,
  ): Promise<PageResult<CreditEntity>>;
  /**
   * Return a page-based list of credits matching an arbitrary filter.
   */
  findByFilter(
    filter: CreditFilter,
    page: number,
    limit: number,
  ): Promise<PageResult<CreditEntity>>;
  /**
   * Cursor-based pagination over a filter.  Pass `cursor` = last seen id
   * (or undefined/null for the first page).
   */
  findByFilterCursor(
    filter: CreditFilter,
    cursor: string | null | undefined,
    limit: number,
  ): Promise<CursorResult<CreditEntity>>;
}

export const CREDIT_REPOSITORY = 'CREDIT_REPOSITORY';

/**
 * In-memory credit repository.
 * Replace with a TypeORM repository provider when PostgreSQL is available.
 */
@Injectable()
export class InMemoryCreditRepository implements ICreditRepository {
  private readonly store = new Map<string, CreditEntity>();

  async save(credit: CreditEntity): Promise<CreditEntity> {
    this.store.set(credit.id, credit);
    return credit;
  }

  async findById(id: string): Promise<CreditEntity | undefined> {
    return this.store.get(id);
  }

  async findByProject(
    projectId: string,
    page: number,
    limit: number,
  ): Promise<PageResult<CreditEntity>> {
    const all = Array.from(this.store.values()).filter(
      (c) => c.projectId === projectId,
    );
    return this.paginate(all, page, limit);
  }

  async findAll(
    page: number,
    limit: number,
  ): Promise<PageResult<CreditEntity>> {
    return this.paginate(Array.from(this.store.values()), page, limit);
  }

  async findByStatus(
    status: CreditStatus,
    page: number,
    limit: number,
  ): Promise<PageResult<CreditEntity>> {
    const all = Array.from(this.store.values()).filter(
      (c) => c.status === status,
    );
    return this.paginate(all, page, limit);
  }

  async findByFilter(
    filter: CreditFilter,
    page: number,
    limit: number,
  ): Promise<PageResult<CreditEntity>> {
    const all = this.applyFilter(Array.from(this.store.values()), filter);
    return this.paginate(all, page, limit);
  }

  async findByFilterCursor(
    filter: CreditFilter,
    cursor: string | null | undefined,
    limit: number,
  ): Promise<CursorResult<CreditEntity>> {
    const all = this.applyFilter(Array.from(this.store.values()), filter);
    const total = all.length;

    let startIndex = 0;
    if (cursor) {
      const idx = all.findIndex((c) => c.id === cursor);
      if (idx !== -1) {
        startIndex = idx + 1;
      }
    }

    const data = all.slice(startIndex, startIndex + limit);
    const lastItem = data[data.length - 1];
    const nextCursor =
      data.length === limit && startIndex + limit < total
        ? lastItem.id
        : null;

    return { data, total, nextCursor };
  }

  private applyFilter(
    items: CreditEntity[],
    filter: CreditFilter,
  ): CreditEntity[] {
    let result = items;

    if (filter.status !== undefined) {
      result = result.filter((c) => c.status === filter.status);
    }
    if (filter.methodology !== undefined) {
      result = result.filter(
        (c) => c.methodology.toLowerCase() === filter.methodology!.toLowerCase(),
      );
    }
    if (filter.geography !== undefined) {
      result = result.filter(
        (c) => c.geography.toLowerCase() === filter.geography!.toLowerCase(),
      );
    }
    if (filter.vintageYear !== undefined) {
      result = result.filter((c) => c.vintageYear === filter.vintageYear);
    }
    if (filter.minTonnes !== undefined) {
      const minVal = BigInt(filter.minTonnes);
      result = result.filter((c) => BigInt(c.tonnes) >= minVal);
    }
    if (filter.maxTonnes !== undefined) {
      const maxVal = BigInt(filter.maxTonnes);
      result = result.filter((c) => BigInt(c.tonnes) <= maxVal);
    }

    return result;
  }

  private paginate(
    items: CreditEntity[],
    page: number,
    limit: number,
  ): PageResult<CreditEntity> {
    const offset = (page - 1) * limit;
    return {
      data: items.slice(offset, offset + limit),
      total: items.length,
      page,
      limit,
    };
  }
}
