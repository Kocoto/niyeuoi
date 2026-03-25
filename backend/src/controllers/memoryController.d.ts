import { Request, Response } from 'express';
export declare const getMemories: (req: Request, res: Response) => Promise<void>;
export declare const getMemory: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createMemory: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateMemory: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteMemory: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=memoryController.d.ts.map