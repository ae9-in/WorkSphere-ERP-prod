import React, { useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  isOpen:      boolean;
  onClose:     () => void;
  title?:      string;
  description?:string;
  children:    React.ReactNode;
  maxWidth?:   'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showClose?:  boolean;
}

const maxWidthMap = {
  sm:  'max-w-sm',
  md:  'max-w-md',
  lg:  'max-w-lg',
  xl:  'max-w-xl',
  '2xl': 'max-w-2xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
  showClose = true,
}: ModalProps) {
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
          <Dialog.Portal static>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 bg-ag-ink/40 backdrop-blur-sm z-[100]"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 overflow-y-auto">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className={cn(
                    'w-full bg-ag-surface rounded-xl border border-ag-border shadow-modal p-6 relative focus:outline-none',
                    maxWidthMap[maxWidth]
                  )}
                >
                  {(title || showClose) && (
                    <div className="flex items-start justify-between mb-4 gap-4">
                      <div>
                        {title && (
                          <Dialog.Title className="font-display font-bold text-xl text-ag-ink">
                            {title}
                          </Dialog.Title>
                        )}
                        {description && (
                          <Dialog.Description className="text-sm text-ag-ink-3 mt-1">
                            {description}
                          </Dialog.Description>
                        )}
                      </div>
                      {showClose && (
                        <Dialog.Close asChild>
                          <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-md flex items-center justify-center text-ag-ink-3 hover:text-ag-ink hover:bg-ag-surface-2 transition-colors"
                          >
                            <X size={18} />
                          </button>
                        </Dialog.Close>
                      )}
                    </div>
                  )}
                  {children}
                </motion.div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
