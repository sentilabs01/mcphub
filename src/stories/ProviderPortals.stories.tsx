import type { Meta, StoryObj } from '@storybook/react';
import { ProviderPortalModal } from '../components/ui/ProviderPortalModal';
import providers from '../data/providers';
import { AuthContext } from '../hooks/useAuth';

const meta = {
  title: 'Integrations/Provider Portals',
  component: ProviderPortalModal,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ProviderPortalModal>;

export default meta;

function Portal(id: string) {
  const prov = providers.find(p => p.id === id);
  // Minimal mock auth so modal can render in Storybook
  const mockAuth = {
    user: { id: 'storybook-user', email: 'dev@example.com', user_metadata: {} } as any,
    session: null,
    loading: false,
    signInWithGoogle: async () => {},
    signOut: async () => {},
  } as any;
  return (
    <AuthContext.Provider value={mockAuth}>
      {prov ? (
        <ProviderPortalModal isOpen onClose={() => {}} provider={prov} />
      ) : (
        <>Provider not found</>
      )}
    </AuthContext.Provider>
  );
}

type Story = StoryObj;

export const OpenAI: Story = { render: () => Portal('openai') };
export const Zapier: Story = { render: () => Portal('zapier') };
export const Github: Story = { render: () => Portal('github') };
export const Gmail: Story = { render: () => Portal('gmail') };
export const Drive: Story = { render: () => Portal('google_drive') };
export const Anthropic: Story = { render: () => Portal('anthropic') };
export const Gemini: Story = { render: () => Portal('google') };
export const Figma: Story = { render: () => Portal('figma') };
export const Slack: Story = { render: () => Portal('slack') };
export const Chroma: Story = { render: () => Portal('chroma') };
export const Jupyter: Story = { render: () => Portal('jupyter') };
export const Make: Story = { render: () => Portal('make_com') };
export const N8n: Story = { render: () => Portal('n8n') };
export const ZapierCLI: Story = { render: () => Portal('zapier_cli') };
export const Calendar: Story = { render: () => Portal('google_calendar') };
export const Bolt: Story = { render: () => Portal('bolt') };
export const Loveable: Story = { render: () => Portal('loveable') };
export const Cursor: Story = { render: () => Portal('cursor') };
export const TwentyFirstDev: Story = { render: () => Portal('21st_dev') }; 