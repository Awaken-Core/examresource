import Image from '@tiptap/extension-image';
import { BulletList } from '@tiptap/extension-list';

export const bulletStyles = ['disc', 'circle', 'square'] as const;
export type BulletStyle = (typeof bulletStyles)[number];

export const ArticleBulletList = BulletList.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      bullet: {
        default: 'disc',
        parseHTML: (element) => element.getAttribute('data-bullet') || 'disc',
        renderHTML: (attributes) => {
          const bullet = bulletStyles.includes(attributes.bullet) ? attributes.bullet : 'disc';
          return { 'data-bullet': bullet };
        },
      },
    };
  },
});

export const imageAlignments = ['left', 'center', 'right'] as const;
export type ImageAlignment = (typeof imageAlignments)[number];

export const imageLayouts = ['content', 'wide', 'full', 'left', 'center', 'right'] as const;
export type ImageLayout = (typeof imageLayouts)[number];

export const ArticleImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      align: {
        default: 'center',
        parseHTML: (element) => element.getAttribute('data-align') || 'center',
        renderHTML: (attributes) => {
          const align = imageAlignments.includes(attributes.align) ? attributes.align : 'center';
          return { 'data-align': align };
        },
      },
      layout: {
        default: 'full',
        parseHTML: (element) => {
          const value = element.getAttribute('data-layout');
          return imageLayouts.includes(value as ImageLayout) ? value : 'full';
        },
        renderHTML: (attributes) => {
          const layout = imageLayouts.includes(attributes.layout) ? attributes.layout : 'full';
          return { 'data-layout': layout };
        },
      },
    };
  },
}).configure({
  resize: {
    enabled: true,
    directions: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
    minWidth: 80,
    alwaysPreserveAspectRatio: true,
  },
  HTMLAttributes: {
    class: 'article-media',
  },
});
