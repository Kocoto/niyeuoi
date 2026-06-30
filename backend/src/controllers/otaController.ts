import { Request, Response } from 'express';
import { UploadApiResponse } from 'cloudinary';
import cloudinary from '../config/cloudinary';
import AppBundle from '../models/AppBundle';
import logger from '../utils/logger';

const DEFAULT_CHANNEL = 'production';

/**
 * So sánh 2 chuỗi semver dạng "x.y.z".
 * Trả về >0 nếu a mới hơn b, <0 nếu cũ hơn, 0 nếu bằng.
 */
function compareVersions(a: string, b: string): number {
    const pa = a.split('.').map((n) => parseInt(n, 10) || 0);
    const pb = b.split('.').map((n) => parseInt(n, 10) || 0);
    const len = Math.max(pa.length, pb.length);
    for (let i = 0; i < len; i++) {
        const diff = (pa[i] || 0) - (pb[i] || 0);
        if (diff !== 0) return diff;
    }
    return 0;
}

/**
 * POST /api/ota/updates
 * Endpoint Capgo plugin gọi để kiểm tra cập nhật (self-hosted auto-update).
 * Public — app chưa đăng nhập cũng gọi được.
 *
 * Trả { version, url, checksum } nếu có bản mới hơn; trả {} nếu đã mới nhất.
 */
export const checkUpdate = async (req: Request, res: Response) => {
    try {
        const appId = (req.body?.app_id as string) || '';
        const currentVersion = (req.body?.version_name as string) || '0.0.0';

        if (!appId) {
            return res.status(200).json({ message: 'Thieu app_id' });
        }

        const latest = await AppBundle.findOne({ appId, channel: DEFAULT_CHANNEL })
            .sort({ createdAt: -1 })
            .lean();

        if (!latest) {
            return res.status(200).json({});
        }

        // Chỉ trả update khi bản mới hơn bản app đang chạy.
        if (compareVersions(latest.version, currentVersion) <= 0) {
            return res.status(200).json({});
        }

        return res.status(200).json({
            version: latest.version,
            url: latest.url,
            checksum: latest.checksum,
        });
    } catch (err) {
        logger.error('OTA', `checkUpdate failed: ${(err as Error).message}`);
        // Không trả url -> plugin coi như không có update, app vẫn chạy bản hiện tại.
        return res.status(200).json({});
    }
};

/**
 * POST /api/ota/stats  &  /api/ota/channel
 * No-op để plugin không gọi sang Capgo Cloud. Luôn 200.
 */
export const noop = (_req: Request, res: Response) => {
    return res.status(200).json({});
};

/**
 * POST /api/ota/bundles  (multipart: field "bundle" = file zip)
 * Bảo vệ bằng header x-ota-secret = process.env.OTA_PUBLISH_SECRET.
 * Upload zip lên Cloudinary (raw) rồi lưu bản ghi version mới.
 */
export const publishBundle = async (req: Request, res: Response) => {
    try {
        const secret = process.env['OTA_PUBLISH_SECRET'];
        if (!secret || req.headers['x-ota-secret'] !== secret) {
            return res.status(401).json({ success: false, message: 'Khong co quyen phat hanh' });
        }

        const file = (req as Request & { file?: Express.Multer.File }).file;
        const { appId, version, checksum, channel } = req.body as {
            appId?: string;
            version?: string;
            checksum?: string;
            channel?: string;
        };

        if (!file || !appId || !version || !checksum) {
            return res.status(400).json({
                success: false,
                message: 'Thieu bundle/appId/version/checksum',
            });
        }

        // Upload zip lên Cloudinary dưới dạng raw resource.
        const uploaded: UploadApiResponse = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    resource_type: 'raw',
                    folder: 'niyeuoi/ota',
                    public_id: `${appId}_${version}_${Date.now()}.zip`,
                },
                (error, result) => {
                    if (error || !result) reject(error || new Error('Upload that bai'));
                    else resolve(result);
                },
            );
            stream.end(file.buffer);
        });

        const bundle = await AppBundle.create({
            appId,
            channel: channel || DEFAULT_CHANNEL,
            version,
            url: uploaded.secure_url,
            checksum,
            cloudinaryPublicId: uploaded.public_id,
        });

        logger.info('OTA', `Published ${appId} v${version} -> ${uploaded.secure_url}`);

        return res.status(201).json({
            success: true,
            message: `Da phat hanh ban ${version}`,
            bundle: { version: bundle.version, url: bundle.url },
        });
    } catch (err) {
        logger.error('OTA', `publishBundle failed: ${(err as Error).message}`);
        return res.status(500).json({ success: false, error: 'Loi may chu' });
    }
};
