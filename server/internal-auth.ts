import { Request, Response, NextFunction } from "express";

/**
 * Simple Bearer token authentication middleware for ZHI API
 * 
 * Validates requests using shared ZHI_PRIVATE_KEY as a Bearer token.
 * 
 * Required header:
 * - Authorization: Bearer <ZHI_PRIVATE_KEY>
 * 
 * Security Note: This is a simplified authentication method.
 * Consider implementing rate limiting and IP whitelisting for production use.
 */
export function verifyZhiAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const privateKey = process.env.ZHI_PRIVATE_KEY;
  
  if (!privateKey) {
    console.error("ZHI_PRIVATE_KEY not configured");
    return res.status(500).json({ 
      error: "Internal configuration error" 
    });
  }

  // Extract Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    console.log('[ZHI Auth] Rejected: Missing Authorization header');
    return res.status(401).json({ 
      error: "Authentication required"
    });
  }

  // Check Bearer token format
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    console.log('[ZHI Auth] Rejected: Invalid Authorization format');
    return res.status(401).json({ 
      error: "Authentication required"
    });
  }

  const token = parts[1];

  // Validate token
  if (token !== privateKey) {
    console.log('[ZHI Auth] Rejected: Invalid token');
    return res.status(401).json({ 
      error: "Authentication required"
    });
  }

  // Audit log for security monitoring
  console.log(`[ZHI Auth] Authenticated request to ${req.originalUrl || req.url}`);

  next();
}
