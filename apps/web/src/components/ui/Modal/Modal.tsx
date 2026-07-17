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
  maxWidth?:   'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  showClose?:  boolean;
  /** On mobile, render as bottom sheet instead of centered dialog */
  mobileSheet?: boolean;
}

const maxWidthMap = {
  sm:    'sm:max-w-sm',
  md:    'sm:max-w-md',
  lg:    'sm:max-w-lg',
  xl:    'sm:max-w-xl',
  '2xl': 'sm:max-w-2xl',
  full:  'sm:max-w-full',
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
  showClose = true,
  mobileSheet = true,
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
          <Dialog.Portal>
            {/* Backdrop */}
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
              {/* On mobile: bottom sheet. On sm+: centered dialog */}
              <div className={cn(
                'fixed z-[101]',
                mobileSheet
                  ? 'inset-x-0 bottom-0 flex flex-col sm:inset-0 sm:flex-row sm:items-center sm:justify-center sm:p-4'
                  : 'inset-0 flex items-center justify-center p-4'
              )}>
                <motion.div
                  initial={mobileSheet
                    ? { opacity: 0, y: '100%' }
                    : { opacity: 0, scale: 0.95, y: 10 }
                  }
                  animate={mobileSheet
                    ? { opacity: 1, y: 0 }
                    : { opacity: 1, scale: 1, y: 0 }
                  }
                  exit={mobileSheet
                    ? { opacity: 0, y: '100%' }
                    : { opacity: 0, scale: 0.95, y: 10 }
                  }
                  transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className={cn(
                    'w-full bg-ag-surface border border-ag-border shadow-modal relative focus:outline-none overflow-y-auto',
                    // Mobile: bottom sheet style
                    mobileSheet && 'rounded-t-2xl sm:rounded-xl max-h-[92vh] sm:max-h-[90vh]',
                    // sm+: centered dialog
                    !mobileSheet && 'rounded-xl',
                    // Max width on sm+ screens
                    maxWidthMap[maxWidth],
                    // Padding
                    'p-5 sm:p-6',
                    // Safe area at bottom on mobile
                    mobileSheet && '[padding-bottom:max(20px,env(safe-area-inset-bottom))] sm:pb-6'
                  )}
                >
                  {/* Bottom sheet drag handle (mobile only) */}
                  {mobileSheet && (
                    <div className="sm:hidden w-9 h-1 bg-ag-border-strong rounded-full mx-auto mb-4" aria-hidden="true" />
                  )}

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
                            aria-label="Close dialog"
                            className="w-9 h-9 min-w-[36px] rounded-md flex items-center justify-center text-ag-ink-3 hover:text-ag-ink hover:bg-ag-surface-2 transition-colors flex-shrink-0"
                          >
                            <X size={18} />
                          </button>
                        </Dialog.Close>
                      )}
                    </div>
                  )}
                  <>{children}</>
                </motion.div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
