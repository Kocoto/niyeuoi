import mongoose from 'mongoose';
import Wallet, { IWallet } from '../models/Wallet';
import logger from '../utils/logger';

const DEFAULT_WALLETS = [
    { name: 'Quỹ chung',    owner: 'shared',      color: 'rose',   icon: 'heart-handshake' },
    { name: 'Ví của Được',  owner: 'boyfriend',   color: 'blue',   icon: 'wallet'          },
    { name: 'Ví của Ni',    owner: 'girlfriend',  color: 'pink',   icon: 'wallet'          },
] as const;

class ExpenseWalletService {
    async seedDefaults(): Promise<void> {
        const count = await Wallet.countDocuments({ isDefault: true });
        if (count >= DEFAULT_WALLETS.length) return;

        logger.info('Wallet', 'Seeding ví mặc định...');
        for (const w of DEFAULT_WALLETS) {
            await Wallet.findOneAndUpdate(
                { name: w.name, isDefault: true },
                { ...w, isDefault: true, balance: 0, createdBy: 'boyfriend' },
                { upsert: true, new: true },
            );
        }
        logger.success('Wallet', `Đã seed ${DEFAULT_WALLETS.length} ví mặc định`);
    }

    async getAllWallets(): Promise<IWallet[]> {
        logger.info('Wallet', 'Lấy danh sách ví');
        const wallets = await Wallet.find().sort({ isDefault: -1, createdAt: 1 });
        logger.success('Wallet', `Trả về ${wallets.length} ví`);
        return wallets;
    }

    async createWallet(data: Partial<IWallet>): Promise<IWallet> {
        logger.info('Wallet', 'Tạo ví mới', { name: data.name });
        try {
            const wallet = await Wallet.create({ ...data, isDefault: false, balance: 0 });
            logger.success('Wallet', 'Tạo ví thành công', { id: wallet._id });
            return wallet;
        } catch (error: any) {
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map((v: any) => v.message);
                throw new Error(`VALIDATION_ERROR: ${messages.join(', ')}`);
            }
            throw error;
        }
    }

    async updateWallet(id: string, data: Partial<IWallet>): Promise<IWallet> {
        logger.info('Wallet', 'Cập nhật ví', { id });
        const wallet = await Wallet.findById(id);
        if (!wallet) throw new Error('NOT_FOUND');

        const { balance: _b, isDefault: _d, ...safeData } = data as any;
        Object.assign(wallet, safeData);
        await wallet.save();
        logger.success('Wallet', 'Đã cập nhật ví', { id });
        return wallet;
    }

    async deleteWallet(id: string): Promise<void> {
        logger.info('Wallet', 'Xóa ví', { id });
        const wallet = await Wallet.findById(id);
        if (!wallet) throw new Error('NOT_FOUND');
        if (wallet.isDefault) throw new Error('CANNOT_DELETE_DEFAULT');
        await wallet.deleteOne();
        logger.success('Wallet', 'Đã xóa ví', { id });
    }

    async adjustBalance(walletId: string, delta: number, session?: mongoose.ClientSession): Promise<void> {
        const opts = session ? { session } : {};
        await Wallet.findByIdAndUpdate(
            walletId,
            { $inc: { balance: delta } },
            opts,
        );
    }
}

export default new ExpenseWalletService();
