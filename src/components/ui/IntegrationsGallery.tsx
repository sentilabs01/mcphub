import React, { useState } from 'react';
import { PROVIDERS, ProviderMeta } from '../../data/providers';
import { ProviderPortalModal } from './ProviderPortalModal';

interface IntegrationsGalleryProps {
  darkMode?: boolean;
  onSelect?: (provider: ProviderMeta) => void;
}

export const IntegrationsGallery: React.FC<IntegrationsGalleryProps> = ({ darkMode, onSelect }) => {
  const [selectedProvider, setSelectedProvider] = useState<ProviderMeta | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleSelect = (provider: ProviderMeta) => {
    setSelectedProvider(provider);
    setModalOpen(true);
    if (onSelect) onSelect(provider);
  };

  return (
    <ProviderPortalModal
      isOpen={modalOpen}
      onClose={() => setModalOpen(false)}
      provider={selectedProvider}
      darkMode={darkMode}
    />
  );
}; 