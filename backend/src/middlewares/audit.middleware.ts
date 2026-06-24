import { Request, Response, NextFunction } from "express";
import { AuditService } from "../modules/audit/audit.service";

/**
 * Middleware that intercepts requests and logs them asynchronously.
 * Suitable for POST, PATCH, PUT, DELETE methods on specific resources.
 */
export const auditLog = (entityName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Intercept response finish
    res.on("finish", () => {
      // Only log successful operations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        let action = "UNKNOWN";
        switch (req.method) {
          case "POST": action = "CREATE"; break;
          case "PATCH": 
          case "PUT": action = "UPDATE"; break;
          case "DELETE": action = "DELETE"; break;
        }

        // Try to guess the entity ID (from params or response if body was intercepted, but we keep it simple here)
        const rawId = req.params.id || req.params.interventionId || undefined;
        const entityId: string | undefined = Array.isArray(rawId) ? rawId[0] : rawId;

        AuditService.log({
          userId: req.user?.sub,
          action,
          entity: entityName,
          entityId,
          metadata: {
            method: req.method,
            path: req.originalUrl,
            body: req.method !== "DELETE" ? req.body : undefined,
          },
          ip: req.ip,
        });
      }
    });

    next();
  };
};
