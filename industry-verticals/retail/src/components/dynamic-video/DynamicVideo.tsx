'use client';

import {
  Field,
  ImageField,
  NextImage as ContentSdkImage,
  Text,
  useSitecore,
} from '@sitecore-content-sdk/nextjs';
import React from 'react';
import { ComponentProps } from 'lib/component-props';

interface DynamicVideoFields {
  Video: ImageField;
  PosterImage?: ImageField;
  VideoCaption?: Field<string>;
}

interface DynamicVideoProps extends ComponentProps {
  fields: DynamicVideoFields;
}

const getVideoMimeType = (src?: string): string | undefined => {
  if (!src) {
    return undefined;
  }

  const extension = src.split('.').pop()?.split('?')[0]?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    mp4: 'video/mp4',
    webm: 'video/webm',
    ogg: 'video/ogg',
  };

  return extension ? mimeTypes[extension] : undefined;
};

const VideoWrapper: React.FC<{ className: string; id?: string; children: React.ReactNode }> = ({
  className,
  id,
  children,
}) => (
  <div className={className.trim()} id={id}>
    <div className="component-content">{children}</div>
  </div>
);

const DynamicVideoDefault: React.FC<DynamicVideoProps> = ({ params }) => (
  <VideoWrapper className={`component dynamic-video ${params.styles}`}>
    <span className="is-empty-hint">Dynamic Video</span>
  </VideoWrapper>
);

export const Default: React.FC<DynamicVideoProps> = (props) => {
  const { page } = useSitecore();
  const { fields, params } = props;
  const { styles, RenderingIdentifier: id } = params;
  const isEditing = page.mode.isEditing;

  if (!fields) {
    return <DynamicVideoDefault {...props} />;
  }

  const videoSrc = fields.Video?.value?.src;
  const mimeType = getVideoMimeType(videoSrc);

  return (
    <VideoWrapper className={`component dynamic-video ${styles}`} id={id}>
      <figure className="video-player">
        {videoSrc && !isEditing ? (
          <video
            className="video-player__element"
            controls
            playsInline
            preload="metadata"
            poster={fields.PosterImage?.value?.src}
          >
            <source src={videoSrc} type={mimeType} />
            Your browser does not support the video tag.
          </video>
        ) : (
          <div className="video-player__poster">
            {fields.PosterImage?.value?.src || fields.Video?.value?.src ? (
              <ContentSdkImage field={fields.PosterImage ?? fields.Video} />
            ) : (
              <span className="is-empty-hint">Select a video from the media library</span>
            )}
          </div>
        )}
        {(fields.VideoCaption?.value || isEditing) && (
          <Text tag="figcaption" className="video-caption" field={fields.VideoCaption} />
        )}
      </figure>
    </VideoWrapper>
  );
};
