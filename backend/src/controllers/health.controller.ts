import { Request, Response } from 'express';

export function healthCheck(_req: Request, res: Response): void {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
}
