export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export function parsePagination(query: Record<string, unknown>): PaginationParams {
  const page = Math.max(1, parseInt(String(query.page ?? "1")));
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? "20"))));
  return { page, limit };
}

export function paginate(page: number, limit: number): { skip: number; take: number } {
  return { skip: (page - 1) * limit, take: limit };
}

export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  { page, limit }: PaginationParams,
): PaginatedResult<T> {
  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
