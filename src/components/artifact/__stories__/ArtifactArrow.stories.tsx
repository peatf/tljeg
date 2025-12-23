import type { Meta, StoryObj } from '@storybook/react';
import { ArtifactArrow, ArrowheadMarker } from '../ArtifactArrow';
import { MemoryRouter } from 'react-router-dom';
import { MotionPrefsProvider } from '../MotionPrefsProvider';

const meta: Meta<typeof ArtifactArrow> = {
    title: 'Artifact/ArtifactArrow',
    component: ArtifactArrow,
    decorators: [
        (Story) => (
            <MemoryRouter>
                <MotionPrefsProvider>
                    <div className="p-20 bg-bone-50 min-h-[400px] flex items-center justify-center">
                        <svg width="400" height="200" className="overflow-visible">
                            <ArrowheadMarker />
                            <Story />
                        </svg>
                    </div>
                </MotionPrefsProvider>
            </MemoryRouter>
        ),
    ],
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ArtifactArrow>;

export const Default: Story = {
    args: {
        connection: {
            from: 'safety',
            to: 'clarity',
            enabled: { xs: true, md: true, lg: true, xl: true }
        },
        pathData: 'M 50,100 C 150,50 250,50 350,100',
        pixel: false,
    },
};

export const Pixelated: Story = {
    args: {
        ...Default.args,
        pixel: true,
    },
};

export const Hovered: Story = {
    args: {
        ...Default.args,
    },
    parameters: {
        pseudo: { hover: true },
    },
};
