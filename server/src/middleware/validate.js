import { ZodError } from "zod";

export function validate(schema) {
    return (req, res, next) => {
        try {
            // Parse and validate — also strips unknown fields (security!)
            const parsed = schema.parse({
                body: req.body,
                query: req.query,
                params: req.params,
            });

            // Replace req data with the validated/cleaned version
            req.body = parsed.body || req.body;
            req.query = parsed.query || req.query;
            req.params = parsed.params || req.params;

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                // Format Zod errors into readable messages
                const errors = error.errors.map((e) => ({
                    field: e.path.slice(1).join("."), // remove "body." prefix
                    message: e.message,
                }));

                return res.status(422).json({
                    success: false,
                    message: "Validation failed. Please check your input.",
                    code: "VALIDATION_ERROR",
                    errors,
                });
            }
            next(error);
        }
    };
}