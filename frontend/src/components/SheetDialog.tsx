import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

type SheetDialogProps = {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  headerSlot?: React.ReactNode;
  panelClassName?: string;
};

const SheetDialog: React.FC<SheetDialogProps> = ({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
  headerSlot,
  panelClassName = '',
}) => (
  <AnimatePresence>
    {open ? (
      <div className="sheet-shell">
        <motion.button
          type="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="sheet-backdrop"
          onClick={onClose}
          aria-label="Đóng cửa sổ"
        />
        <motion.div
          initial={{ opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 48 }}
          transition={{ type: 'spring', stiffness: 360, damping: 34 }}
          className={`sheet-panel max-h-[88vh] overflow-y-auto ${panelClassName}`.trim()}
        >
          <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-rose-100 md:hidden" />
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              {headerSlot}
              <h2 className="mt-2 text-2xl font-black text-ink">{title}</h2>
              {subtitle ? <p className="mt-2 text-sm leading-6 text-soft">{subtitle}</p> : null}
            </div>
            <button type="button" onClick={onClose} className="rounded-full p-2 text-soft transition hover:bg-rose-50 hover:text-ink">
              <X size={18} />
            </button>
          </div>

          <div>{children}</div>

          {footer ? <div className="mt-6 border-t border-rose-100 pt-5">{footer}</div> : null}
        </motion.div>
      </div>
    ) : null}
  </AnimatePresence>
);

export default SheetDialog;
