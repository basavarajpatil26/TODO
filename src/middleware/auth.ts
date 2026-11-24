import type { NextFunction, Request, Response } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { adminAuth } from '../lib/firebase-admin.ts';
import { getOrCreateUser } from '../db/users.ts';
import type { UserRecord } from '../db/schema.ts';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  dbUser?: UserRecord;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;

    const email = decodedToken.email || `${decodedToken.uid}@taskflow.local`;
    const displayName =
      typeof decodedToken.name === 'string' ? decodedToken.name : null;

    req.dbUser = await getOrCreateUser(decodedToken.uid, email, displayName);
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token or syncing user:', error);
    if (error instanceof Error && error.message.includes('synchronize user')) {
      return res
        .status(500)
        .json({ error: 'Unable to initialize user account.' });
    }
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
