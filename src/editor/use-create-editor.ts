import { BlockquoteElement } from '@op/modules/plate/plate-ui/blockquote-element';
import { CodeBlockElement } from '@op/modules/plate/plate-ui/code-block-element';
import { CodeLeaf } from '@op/modules/plate/plate-ui/code-leaf';
import { CodeLineElement } from '@op/modules/plate/plate-ui/code-line-element';
import { CodeSyntaxLeaf } from '@op/modules/plate/plate-ui/code-syntax-leaf';
import { ColumnElement } from '@op/modules/plate/plate-ui/column-element';
import { ColumnGroupElement } from '@op/modules/plate/plate-ui/column-group-element';
import { DateElement } from '@op/modules/plate/plate-ui/date-element';
import { EmojiInputElement } from '@op/modules/plate/plate-ui/emoji-input-element';
import { ExcalidrawElement } from '@op/modules/plate/plate-ui/excalidraw-element';
import { HeadingElement } from '@op/modules/plate/plate-ui/heading-element';
import { HrElement } from '@op/modules/plate/plate-ui/hr-element';
import { ImageElement } from '@op/modules/plate/plate-ui/image-element';
import { KbdLeaf } from '@op/modules/plate/plate-ui/kbd-leaf';
import { LinkElement } from '@op/modules/plate/plate-ui/link-element';
import { MediaAudioElement } from '@op/modules/plate/plate-ui/media-audio-element';
import { MediaEmbedElement } from '@op/modules/plate/plate-ui/media-embed-element';
import { MediaFileElement } from '@op/modules/plate/plate-ui/media-file-element';
import { MediaPlaceholderElement } from '@op/modules/plate/plate-ui/media-placeholder-element';
import { MediaVideoElement } from '@op/modules/plate/plate-ui/media-video-element';
import { MentionElement } from '@op/modules/plate/plate-ui/mention-element';
import { MentionInputElement } from '@op/modules/plate/plate-ui/mention-input-element';
import { ParagraphElement } from '@op/modules/plate/plate-ui/paragraph-element';
import { withPlaceholders } from '@op/modules/plate/plate-ui/placeholder';
import { SlashInputElement } from '@op/modules/plate/plate-ui/slash-input-element';
import {
  TableCellElement,
  TableCellHeaderElement,
} from '@op/modules/plate/plate-ui/table-cell-element';
import { TableElement } from '@op/modules/plate/plate-ui/table-element';
import { TableRowElement } from '@op/modules/plate/plate-ui/table-row-element';
import { TocElement } from '@op/modules/plate/plate-ui/toc-element';
import { ToggleElement } from '@op/modules/plate/plate-ui/toggle-element';
import { withDraggables } from '@op/modules/plate/plate-ui/with-draggables';
import { withProps } from '@udecode/cn';
import {
  BoldPlugin,
  CodePlugin,
  ItalicPlugin,
  StrikethroughPlugin,
  SubscriptPlugin,
  SuperscriptPlugin,
  UnderlinePlugin,
} from '@udecode/plate-basic-marks/react';
import { BlockquotePlugin } from '@udecode/plate-block-quote/react';
import {
  CodeBlockPlugin,
  CodeLinePlugin,
  CodeSyntaxPlugin,
} from '@udecode/plate-code-block/react';
import { ParagraphPlugin, PlateLeaf, usePlateEditor, } from '@udecode/plate-common/react';
import { DatePlugin } from '@udecode/plate-date/react';
import { EmojiInputPlugin } from '@udecode/plate-emoji/react';
import { ExcalidrawPlugin } from '@udecode/plate-excalidraw/react';
import { HEADING_KEYS } from '@udecode/plate-heading';
import { TocPlugin } from '@udecode/plate-heading/react';
import { HorizontalRulePlugin } from '@udecode/plate-horizontal-rule/react';
import { KbdPlugin } from '@udecode/plate-kbd/react';
import { ColumnItemPlugin, ColumnPlugin } from '@udecode/plate-layout/react';
import { LinkPlugin } from '@udecode/plate-link/react';
import {
  AudioPlugin,
  FilePlugin,
  ImagePlugin,
  MediaEmbedPlugin,
  PlaceholderPlugin,
  VideoPlugin,
} from '@udecode/plate-media/react';
import { MentionInputPlugin, MentionPlugin, } from '@udecode/plate-mention/react';
import { SlashInputPlugin } from '@udecode/plate-slash-command/react';
import {
  TableCellHeaderPlugin,
  TableCellPlugin,
  TablePlugin,
  TableRowPlugin,
} from '@udecode/plate-table/react';
import { TogglePlugin } from '@udecode/plate-toggle/react';
import { type Value } from "@udecode/slate";

import { editorPlugins } from './plugins/editor-plugins';
import { FixedToolbarPlugin } from './plugins/fixed-toolbar-plugin';
import { FixedToolbarSimplePlugin } from './plugins/fixed-toolbar-simple-plugin';
import { FloatingToolbarPlugin } from './plugins/floating-toolbar-plugin';

export interface IUseCreateEditorProps {
  initialValue?: Value;
  isSimpleEditor?: boolean;
  isUploadMediaDisabled?: boolean;
}

export const useCreateEditor = (props?: IUseCreateEditorProps) => {
  const { initialValue, isSimpleEditor = false } = props || {};
  return usePlateEditor({
    override: {
      components: withDraggables(
        withPlaceholders({
          [BlockquotePlugin.key]: BlockquoteElement,
          [BoldPlugin.key]: withProps(PlateLeaf, { as: 'strong' }),
          [CodeBlockPlugin.key]: CodeBlockElement,
          [CodeLinePlugin.key]: CodeLineElement,
          [CodePlugin.key]: CodeLeaf,
          [CodeSyntaxPlugin.key]: CodeSyntaxLeaf,
          [ColumnItemPlugin.key]: ColumnElement,
          [ColumnPlugin.key]: ColumnGroupElement,
          [DatePlugin.key]: DateElement,
          [EmojiInputPlugin.key]: EmojiInputElement,
          [ExcalidrawPlugin.key]: ExcalidrawElement,
          [HEADING_KEYS.h1]: withProps(HeadingElement, { variant: 'h1' }),
          [HEADING_KEYS.h2]: withProps(HeadingElement, { variant: 'h2' }),
          [HEADING_KEYS.h3]: withProps(HeadingElement, { variant: 'h3' }),
          [HEADING_KEYS.h4]: withProps(HeadingElement, { variant: 'h4' }),
          [HEADING_KEYS.h5]: withProps(HeadingElement, { variant: 'h5' }),
          [HEADING_KEYS.h6]: withProps(HeadingElement, { variant: 'h6' }),
          [HorizontalRulePlugin.key]: HrElement,
          [ItalicPlugin.key]: withProps(PlateLeaf, { as: 'em' }),
          [KbdPlugin.key]: KbdLeaf,
          [LinkPlugin.key]: LinkElement,
          [MentionInputPlugin.key]: MentionInputElement,
          [MentionPlugin.key]: MentionElement,
          [ParagraphPlugin.key]: ParagraphElement,
          [SlashInputPlugin.key]: SlashInputElement,
          [StrikethroughPlugin.key]: withProps(PlateLeaf, { as: 's' }),
          [SubscriptPlugin.key]: withProps(PlateLeaf, { as: 'sub' }),
          [SuperscriptPlugin.key]: withProps(PlateLeaf, { as: 'sup' }),
          [TableCellHeaderPlugin.key]: TableCellHeaderElement,
          [TableCellPlugin.key]: TableCellElement,
          [TablePlugin.key]: TableElement,
          [TableRowPlugin.key]: TableRowElement,
          [TocPlugin.key]: TocElement,
          [TogglePlugin.key]: ToggleElement,
          [UnderlinePlugin.key]: withProps(PlateLeaf, { as: 'u' }),

          // media
          [ImagePlugin.key]: ImageElement,
          [VideoPlugin.key]: MediaVideoElement,
          [AudioPlugin.key]: MediaAudioElement,
          [FilePlugin.key]: MediaFileElement,
          [MediaEmbedPlugin.key]: MediaEmbedElement,
          [PlaceholderPlugin.key]: MediaPlaceholderElement,
        })
      ),
    },
    plugins: [
      ...editorPlugins,
      isSimpleEditor ? FixedToolbarSimplePlugin : FixedToolbarPlugin,
      FloatingToolbarPlugin,
    ],
    value: initialValue || [],
  });
};
