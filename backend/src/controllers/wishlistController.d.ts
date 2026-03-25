import { Request, Response } from 'express';
export declare const getWishlist: (req: Request, res: Response) => Promise<void>;
export declare const getWishlistItem: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createWishlistItem: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateWishlistItem: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteWishlistItem: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=wishlistController.d.ts.map