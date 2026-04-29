export const sendError = (res, status, error) => res.status(status).json({ error });

export const normalizeText = (value) => String(value ?? '').trim();

export const normalizeUsername = (value) => normalizeText(value).toLowerCase();

