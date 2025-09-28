'use client';

import React from 'react';
import { Button } from './Button';
import { UnifiedPopout } from './UnifiedPopout';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className = '' }: ModalProps) {
  return (
    <UnifiedPopout isOpen={isOpen} onClose={onClose} width="min(90vw, 600px)" height="auto">
      <div className={`flex flex-col ${className}`}>
        {title && (
          <div className="px-4 py-3 border-b border-neutral-500/20 flex items-center justify-between">
            <h3 className="text-sm font-medium text-neutral-300" style={{ fontFamily: 'Tiempos, serif' }}>
              {title}
            </h3>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="p-4 text-neutral-200">
          {children}
        </div>
      </div>
    </UnifiedPopout>
  );
}

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
}

export function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary'
}: ConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className="mb-6">{message}</p>
      <div className="flex items-center justify-end space-x-3 pt-2">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm bg-neutral-700 hover:bg-neutral-600 border border-neutral-600 text-neutral-300 hover:text-white rounded-md transition-colors duration-200"
        >
          {cancelText}
        </button>
        <button
          onClick={handleConfirm}
          className={`px-6 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-800 ${
            variant === 'danger' 
              ? 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500' 
              : 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500'
          }`}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  variant?: 'info' | 'success' | 'error';
}

export function AlertModal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  variant = 'info' 
}: AlertModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className="mb-6">{message}</p>
      <div className="flex items-center justify-end space-x-3 pt-2">
        <button
          onClick={onClose}
          className="px-6 py-2 text-sm bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-neutral-800"
        >
          OK
        </button>
      </div>
    </Modal>
  );
}
