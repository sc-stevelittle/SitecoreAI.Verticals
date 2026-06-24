import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Default as Video } from '../components/video/Video';
import { ComponentProps } from 'react';
import { CommonParams, CommonRendering } from './common/commonData';
import { createImageField, createTextField } from './helpers/createFields';

type StoryProps = ComponentProps<typeof Video> & {
  caption?: string;
  hasVideo?: boolean;
};

const meta = {
  title: 'Media/Video',
  component: Video,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    caption: {
      control: 'text',
      description: 'Caption text displayed below the video',
    },
    hasVideo: {
      control: 'boolean',
      description: 'Whether a video source is configured',
    },
  },
} satisfies Meta<StoryProps>;
export default meta;

type Story = StoryObj<StoryProps>;

const baseParams = {
  ...CommonParams,
};

const baseRendering = {
  ...CommonRendering,
  componentName: 'Video',
  params: baseParams,
};

export const Default: Story = {
  args: {
    caption: 'Watch our latest collection showcase',
    hasVideo: true,
  },
  render: ({ caption, hasVideo }) => {
    return (
      <Video
        params={baseParams}
        rendering={baseRendering}
        fields={{
          Video: hasVideo
            ? {
                value: {
                  src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm',
                  alt: 'Sample video',
                },
              }
            : { value: {} },
          PosterImage: createImageField('placeholder'),
          VideoCaption: caption ? createTextField(caption, 1) : { value: '' },
        }}
      />
    );
  },
};
