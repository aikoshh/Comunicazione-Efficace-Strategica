import React, { useEffect, useRef } from 'react';
import { COLORS } from '../constants';
import { CloseIcon } from './Icons';
import { soundService } from '../services/soundService';

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoSrc: string;
}

const hoverStyle = `
  .video-close-button:hover {
    background-color: #333;
  }
`;

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ isOpen, onClose, videoSrc }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.focus();
      videoRef.current?.play().catch(error => console.warn("Video autoplay was prevented:", error));
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          handleClose();
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    } else {
        videoRef.current?.pause();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    soundService.playClick();
    onClose();
  };

  return (
    <div style={styles.overlay} onClick={handleClose}>
       <style>{hoverStyle}</style>
      <div 
        style={styles.modal} 
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="video-player-title"
        tabIndex={-1}
      >
        <header style={styles.header}>
            <button onClick={handleClose} style={styles.closeButton} className="video-close-button" aria-label="Chiudi video">
              <CloseIcon />
              <span>Chiudi</span>
            </button>
        </header>
        <div style={styles.content}>
            <video 
                ref={videoRef}
                src={videoSrc}
                style={styles.video}
                controls
                autoPlay
                playsInline
            />
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    zIndex: 2000, padding: '20px'
  },
  modal: {
    backgroundColor: '#000',
    borderRadius: '16px',
    width: '100%', maxWidth: '900px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
    animation: 'popIn 0.3s ease-out',
    display: 'flex', flexDirection: 'column',
    maxHeight: '90vh',
    border: `1px solid #333`,
    outline: 'none',
    overflow: 'hidden'
  },
  header: {
    padding: '12px 20px',
    display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
    flexShrink: 0,
    backgroundColor: '#111',
  },
  closeButton: {
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '8px 12px', color: '#eee', display: 'flex',
    alignItems: 'center', gap: '8px', fontSize: '16px',
    borderRadius: '8px',
    transition: 'background-color 0.2s ease',
  },
  content: {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  video: {
      width: '100%',
      height: '100%',
      maxHeight: 'calc(90vh - 60px)',
  }
};