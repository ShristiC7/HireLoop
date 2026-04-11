export const sendSuccess = (res, { message = "Success", data = null, statusCode = 200, meta = null } = {}) => {
    const response = { success: true, message };
    if (data !== null) response.data = data;
    if (meta !== null) response.meta = meta; // pagination info etc.
    return res.status(statusCode).json(response);
};

export const sendCreated = (res, { message = "Created successfully", data = null } = {}) => {
    return sendSuccess(res, { message, data, statusCode: 201 });
};

export const sendPaginated = (res, { message = "Success", data, page, limit, total }) => {
    return res.status(200).json({
        success: true,
        message,
        data,
        meta: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1,
        },
    });
};