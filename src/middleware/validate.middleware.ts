import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validateParams = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = await schema.parseAsync(req.params);
      req.params = validated as any;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          version: 1,
          status: 'ERROR',
          message: 'Invalid request parameters',
          errors: err.issues.map((e) => ({ field: e.path.join('.'), message: e.message })),
        });
        return;
      }
      next(err);
    }
  };
};
