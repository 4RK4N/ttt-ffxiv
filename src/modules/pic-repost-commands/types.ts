import { createModuleConfig } from '../../core/moduleConfig.js';
import { DEFAULT_THREAD_FIRST_MESSAGE } from '../../core/threads.js';

export interface PicTexts {
  disabled: string;
  noImages: string;
  notImages: string;
  downloadFailed: string;
  cannotPost: string;
  postFailed: string;
  attribution: string;
  postedSuccess: string;
  threadNote: string;
  threadFirstMessage: string;
}

export interface PicConfig {
  enabled?: boolean;
}

export const CONFIG_DEFAULTS: PicConfig = {
  enabled: true,
};

// Code defaults; data/pic-repost-commands/texts.json overrides these.
export const TEXT_DEFAULTS: PicTexts = {
  disabled: 'This command is currently disabled.',
  noImages: 'You need to attach at least one image.',
  notImages: 'These attachments are not images: {names}. Please attach image files only.',
  downloadFailed:
    'Could not download one of your images. Please try again with a smaller or different file.',
  cannotPost: 'I cannot post in this channel.',
  postFailed:
    'I could not post in this channel. This is usually a file size limit or missing ' +
    '"Send Messages"/"Attach Files" permission.',
  attribution: '{message}\n\nby {mention}',
  postedSuccess: 'Posted {count} {images} to this channel.',
  threadNote:
    '\n\nNote: I could not create the comments thread. I may be missing the ' +
    '"Create Public Threads" / "Send Messages in Threads" permission in this channel.',
  threadFirstMessage: DEFAULT_THREAD_FIRST_MESSAGE,
};

const module = createModuleConfig('pic-repost-commands', CONFIG_DEFAULTS, TEXT_DEFAULTS);

export const NAMESPACE = module.NAMESPACE;
export const config = module.config;
export const texts = module.texts;
