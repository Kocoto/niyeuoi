import { Request, Response } from 'express';
export declare const getPlaces: (req: Request, res: Response) => Promise<void>;
export declare const getPlace: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createPlace: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updatePlace: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getRandomPlace: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deletePlace: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=placeController.d.ts.map