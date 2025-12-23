import type { Meta, StoryObj } from '@storybook/react';
import { ArtifactNode } from '../ArtifactNode';
import { MemoryRouter } from 'react-router-dom';
import { MotionPrefsProvider } from '../MotionPrefsProvider';

const meta: Meta<typeof ArtifactNode> = {
    title: 'Artifact/ArtifactNode',
    component: ArtifactNode,
    decorators: [
        (Story) => (
            <MemoryRouter>
                <MotionPrefsProvider>
                    <div className="p-10 bg-bone-50 min-h-[300px] flex items-center justify-center">
                        <Story />
                    </div>
                </MotionPrefsProvider>
            </MemoryRouter>
        ),
    ],
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ArtifactNode>;

export const Default: Story = {
    args: {
        node: {
            id: 'safety',
            label: 'Safety',
            to: '/artifact/safety',
            stepIndex: 1,
            ariaLabel: 'Go to Safety (Step 1)',
            angle: 300
        },
        isActive: false,
    },
};

export const Active: Story = {
    args: {
        ...Default.args,
        isActive: true,
    },
};

export const Highlighted: Story = {
    args: {
        ...Default.args,
        isHighlighted: true,
    },
};

export const Void: Story = {
    args: {
        node: {
            id: 'void',
            label: 'VOID',
            to: '/artifact/void',
            stepIndex: 4,
            ariaLabel: 'Go to VOID (Anchor Point)',
            isVoid: true
        },
        isActive: false,
    },
};

export const VoidActive: Story = {
    args: {
        ...Void.args,
        isActive: true,
    },
};
