import { Request, Response } from 'express';
export declare const getMoods: (req: Request, res: Response) => Promise<void>;
export declare const getMood: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createMood: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateMood: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteMood: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=moodController.d.ts.map