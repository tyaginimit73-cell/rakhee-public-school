export const paginate = (req) => ({
  page: Math.max(1, parseInt(req.query.page, 10) || 1),
  limit: Math.min(50, parseInt(req.query.limit, 10) || 10),
});
export const paged = async (query, req, countQuery) => {
  const { page, limit } = paginate(req);
  const [items, total] = await Promise.all([
    query.skip((page - 1) * limit).limit(limit),
    countQuery,
  ]);
  return { items, total, page, pages: Math.ceil(total / limit) || 1 };
};
