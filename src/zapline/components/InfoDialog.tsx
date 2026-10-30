import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DialogKey, DIALOG_COPY } from '../types';

interface InfoDialogProps {
  activeKey: DialogKey | null;
  onClose: () => void;
  onExploreDashboard: () => void;
}

export const InfoDialog: React.FC<InfoDialogProps> = ({
  activeKey,
  onClose,
  onExploreDashboard,
}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (activeKey) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [activeKey]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };

    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [onClose]);

  if (!activeKey) return <dialog ref={dialogRef} id="details" aria-labelledby="dialog-title" aria-describedby="dialog-copy" />;

  const [title, copy] = DIALOG_COPY[activeKey];

  const handleOpenFullApp = () => {
    onClose();
    navigate('/dashboard');
  };

  return (
    <dialog
      ref={dialogRef}
      id="details"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-copy"
    >
      <div className="dialog-top">
        <span className="dialog-tag">EduBuddy / Institute OS</span>
        <button
          type="button"
          className="close"
          aria-label="Close dialog"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <h2 id="dialog-title">{title}</h2>
      <p id="dialog-copy">{copy}</p>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '16px' }}>
        <button
          type="button"
          className="pill primary"
          id="dialog-action"
          onClick={() => {
            onClose();
            onExploreDashboard();
          }}
        >
          Explore Live Terminal ↓
        </button>
        <button
          type="button"
          className="pill secondary"
          style={{ background: '#1c1726', color: '#ded7e6', border: '1px solid #ffffff1c' }}
          onClick={handleOpenFullApp}
        >
          Open EduBuddy App ↗
        </button>
      </div>
    </dialog>
  );
};
