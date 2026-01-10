import React, { createContext, useContext, useState } from 'react';
import { AuthModal } from './auth/AuthModal';
import SubscriptionModal from './SubscriptionModal';
import PartnerIntakeForm from './partners/PartnerIntakeForm';
import { useAuth } from './auth/AuthProvider';

const ModalContext = createContext();

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

export function ModalProvider({ children }) {
  const { user } = useAuth();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showPartnerApplicationModal, setShowPartnerApplicationModal] = useState(false);
  const [authMode, setAuthMode] = useState('signup');
  const [paymentModalProps, setPaymentModalProps] = useState({});
  const [authModalProps, setAuthModalProps] = useState({});

  const openPaymentModal = (props = {}) => {
    setPaymentModalProps(props);
    if (user) {
      // Signed-in user: show subscription modal
      setShowSubscriptionModal(true);
    } else {
      // Guest user: show auth modal
      setAuthMode('signup');
      setShowAuthModal(true);
    }
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setPaymentModalProps({});
  };

  const closeSubscriptionModal = () => {
    setShowSubscriptionModal(false);
  };

  const openAuthModal = (mode = 'signup', props = {}) => {
    setAuthMode(mode);
    setAuthModalProps(props);
    setShowAuthModal(true);
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
    setAuthModalProps({});
  };

  const openPartnerApplicationModal = () => {
    setShowPartnerApplicationModal(true);
  };

  const closePartnerApplicationModal = () => {
    setShowPartnerApplicationModal(false);
  };

  return (
    <ModalContext.Provider value={{
      openPaymentModal,
      closePaymentModal,
      openAuthModal,
      closeAuthModal,
      openPartnerApplicationModal,
      closePartnerApplicationModal,
      showPaymentModal,
      showAuthModal,
      showSubscriptionModal,
      showPartnerApplicationModal,
      authMode
    }}>
      {children}
      
      {/* Modals rendered at app level */}
      
      <AuthModal
        isOpen={showAuthModal}
        onClose={closeAuthModal}
        defaultMode={authMode}
        redirectPath={authModalProps.redirectPath || null}
        initialEmail={authModalProps.initialEmail || ''}
        {...authModalProps}
      />

      {/* Subscription Modal for signed-in users */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={closeSubscriptionModal}
        currentUploadCount={0}
        {...paymentModalProps}
      />

      {/* Partner Application Modal */}
      <PartnerIntakeForm
        isOpen={showPartnerApplicationModal}
        onClose={closePartnerApplicationModal}
        onSuccess={() => {
          closePartnerApplicationModal();
          // Refresh page or show success message
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        }}
      />
    </ModalContext.Provider>
  );
}
