import type { Meta, StoryObj } from '@storybook/react';
import { IntegrationsDropdown } from '../components/ui/IntegrationsDropdown';
import { AuthContext } from '../hooks/useAuth';

// Mock auth context so dropdown's modal can render
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const withMockAuth = (Story: any, context: any) => {
  const mockAuth = {
    user: { id: 'storybook-user', email: 'dev@example.com', user_metadata: {} } as any,
    session: null,
    loading: false,
    signInWithGoogle: async () => {},
    signOut: async () => {},
  } as any;
  return (
    <AuthContext.Provider value={mockAuth}>
      <Story {...context} />
    </AuthContext.Provider>
  );
};

const meta = {
  title: 'Integrations/Dropdown',
  component: IntegrationsDropdown,
  args: { darkMode: false },
  argTypes: {
    darkMode: { control: 'boolean' },
  },
  parameters: { layout: 'padded' },
  decorators: [withMockAuth],
} satisfies Meta<typeof IntegrationsDropdown>;

export default meta;

type Story = StoryObj<typeof IntegrationsDropdown>;

export const Light: Story = { args: { darkMode: false } };
export const Dark: Story = { args: { darkMode: true } }; 