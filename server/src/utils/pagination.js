export function parsePagination(query, { defaultLimit = 10, maxLimit = 100 } = {}) {
    let page = parseInt(query.page) || 1;
    let limit = parseInt(query.limit) || defaultLimit;

    // Guard rails
    if (page < 1) page = 1;
    if (limit < 1) limit = 1;
    if (limit > maxLimit) limit = maxLimit;

    const skip = (page - 1) * limit;

    return { page, limit, skip };
}

export function buildPaginationMeta(total, page, limit) {
    const totalPages = Math.ceil(total / limit);
    return {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
    };
}