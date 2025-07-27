'use client';

// ============ Imports ============
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
// Simple className concatenation utility
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
import { Button } from './Button';

// ============ Types ============
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  className?: string;
  overlayClassName?: string;
}

interface ModalHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * @title Modal
 * @notice Accessible modal component with portal rendering
 * @dev Includes keyboard navigation and focus management
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = '',
  overlayClassName = '',
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  // ============ Effects ============
  
  // Handle client-side mounting for portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Handle focus management
  useEffect(() => {
    if (!isOpen) return;

    const previousActiveElement = document.activeElement as HTMLElement;
    
    // Focus the modal
    modalRef.current?.focus();

    // Trap focus within modal
    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const modal = modalRef.current;
      if (!modal) return;

      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          event.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          event.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleTab);

    return () => {
      document.removeEventListener('keydown', handleTab);
      previousActiveElement?.focus();
    };
  }, [isOpen]);

  // Handle body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // ============ Handlers ============
  
  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  // ============ Size Classes ============
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl', 
    xl: 'max-w-4xl',
    full: 'max-w-none m-4',
  };

  // ============ Render ============
  if (!mounted || !isOpen) return null;

  const modalContent = (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4",
        overlayClassName
      )}
      onClick={handleOverlayClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" />
      
      {/* Modal */}
      <div
        ref={modalRef}
        className={cn(
          "relative bg-white rounded-lg shadow-xl w-full max-h-[90vh] overflow-y-auto",
          "animate-fade-in",
          sizeClasses[size],
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        aria-describedby={description ? "modal-description" : undefined}
        tabIndex={-1}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              {title && (
                <h2 
                  id="modal-title" 
                  className="text-xl font-semibold text-gray-900"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p 
                  id="modal-description" 
                  className="text-sm text-gray-600 mt-1"
                >
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close modal"
              >
                <XMarkIcon className="h-5 w-5" />
              </Button>
            )}
          </div>
        )}

        {/* Content */}
        {children}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

// ============ Modal Subcomponents ============

export function ModalHeader({ children, className = '' }: ModalHeaderProps) {
  return (
    <div className={cn("px-6 py-4 border-b border-gray-200", className)}>
      {children}
    </div>
  );
}

export function ModalBody({ children, className = '' }: ModalBodyProps) {
  return (
    <div className={cn("px-6 py-4", className)}>
      {children}
    </div>
  );
}

export function ModalFooter({ children, className = '' }: ModalFooterProps) {
  return (
    <div className={cn("px-6 py-4 border-t border-gray-200 flex justify-end space-x-3", className)}>
      {children}
    </div>
  );
}

// ============ Confirmation Modal ============
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  isLoading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  isLoading = false,
}: ConfirmationModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      showCloseButton={false}
    >
      <ModalBody>
        <p className="text-gray-600">{message}</p>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isLoading}
        >
          {cancelText}
        </Button>
        <Button
          variant={variant === 'destructive' ? 'destructive' : 'default'}
          onClick={onConfirm}
          loading={isLoading}
        >
          {confirmText}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// ============ Alert Modal ============
interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  buttonText?: string;
  variant?: 'info' | 'success' | 'warning' | 'error';
}

export function AlertModal({
  isOpen,
  onClose,
  title,
  message,
  buttonText = 'OK',
  variant = 'info',
}: AlertModalProps) {
  const variantStyles = {
    info: 'text-blue-600',
    success: 'text-green-600', 
    warning: 'text-yellow-600',
    error: 'text-red-600',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      showCloseButton={false}
    >
      <ModalBody className="text-center py-8">
        <div className={cn("text-4xl mb-4", variantStyles[variant])}>
          {variant === 'success' && '✅'}
          {variant === 'warning' && '⚠️'}
          {variant === 'error' && '❌'}
          {variant === 'info' && 'ℹ️'}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600">{message}</p>
      </ModalBody>
      <ModalFooter className="justify-center">
        <Button onClick={onClose}>
          {buttonText}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// ============ Drawer Modal (Slide from side) ============
interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  side?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  title?: string;
}

export function Drawer({
  isOpen,
  onClose,
  children,
  side = 'right',
  size = 'md',
  title,
}: DrawerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const sizeClasses = {
    sm: 'w-80',
    md: 'w-96',
    lg: 'w-1/2',
  };

  const slideClasses = {
    left: 'left-0',
    right: 'right-0',
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={cn(
        "relative bg-white shadow-xl h-full overflow-y-auto",
        "animate-slide-in",
        sizeClasses[size],
        slideClasses[side],
        side === 'left' ? 'ml-0' : 'ml-auto'
      )}>
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close drawer"
            >
              <XMarkIcon className="h-5 w-5" />
            </Button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
}