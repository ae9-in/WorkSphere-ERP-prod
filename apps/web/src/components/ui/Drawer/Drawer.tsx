import React, { useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface DrawerProps {
  isOpen:      boolean;
  onClose:     () => void;
  title?:      string;
  description?:string;
  children:    React.ReactNode;
  width?:      'sm' | 'md' | 'lg' | 'xl';
}

const widthMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export function Drawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  width = 'md',
}: DrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-ag-ink/40 backdrop-blur-sm z-[100]"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                className={cn(
                  'fixed top-0 right-0 bottom-0 w-full bg-ag-surface shadow-modal z-[101] flex flex-col focus:outline-none border-l border-ag-border',
                  widthMap[width]
                )}
              >
                {title && (
                  <div className="flex items-center justify-between px-6 py-4 border-b border-ag-border">
                    <div>
                      <Dialog.Title className="font-display font-bold text-lg text-ag-ink">
                        {title}
                      </Dialog.Title>
                      {description && (
                        <Dialog.Description className="text-xs text-ag-ink-3 mt-0.5">
                          {description}
                        </Dialog.Description>
                      )}
                    </div>
                    <Dialog.Close asChild>
                      <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-md flex items-center justify-center text-ag-ink-3 hover:text-ag-ink hover:bg-ag-surface-2 transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </Dialog.Close>
                  </div>
                )}
                <div className="flex-1 overflow-y-auto p-6">{children}</div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
