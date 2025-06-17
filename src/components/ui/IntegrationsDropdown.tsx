import React, { useState } from 'react';
import { PROVIDERS, ProviderMeta } from '../../data/providers';
import { ProviderPortalModal } from './ProviderPortalModal';

interface IntegrationsDropdownProps {
  darkMode?: boolean;
}

const HIDDEN_PROVIDER_IDS = new Set(["slack", "chroma", "jupyter"]);
const ACTIVE_PROVIDERS = PROVIDERS.filter(p => !HIDDEN_PROVIDER_IDS.has(p.id));

export const IntegrationsDropdown: React.FC<IntegrationsDropdownProps> = ({ darkMode }) => {
  const [selectedId, setSelectedId] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [provider, setProvider] = useState<ProviderMeta | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (!id) return;
    const found = ACTIVE_PROVIDERS.find(p => p.id === id) || null;
    setProvider(found);
    setModalOpen(!!found);
    // reset dropdown display back to placeholder for next time
    setSelectedId('');
  };

  return (
    <div>
      <select
        value={selectedId}
        onChange={handleChange}
        className={`rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${darkMode ? 'bg-zinc-800 text-white border-zinc-700' : 'bg-white text-gray-700 border border-gray-300'}`}
      >
        <option value="">Integrations…</option>
        {ACTIVE_PROVIDERS.map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>

      <ProviderPortalModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        provider={provider}
        darkMode={darkMode}
      />
    </div>
  );
}; 