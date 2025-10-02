import { BlockquoteElementStatic } from '@op/modules/plate/plate-ui/blockquote-element-static';
import { CodeBlockElementStatic } from '@op/modules/plate/plate-ui/code-block-element-static';
import { CodeLeafStatic } from '@op/modules/plate/plate-ui/code-leaf-static';
import { CodeLineElementStatic } from '@op/modules/plate/plate-ui/code-line-element-static';
import { CodeSyntaxLeafStatic } from '@op/modules/plate/plate-ui/code-syntax-leaf-static';
import { ColumnElementStatic } from '@op/modules/plate/plate-ui/column-element-static';
import { ColumnGroupElementStatic } from '@op/modules/plate/plate-ui/column-group-element-static';
import { DateElementStatic } from '@op/modules/plate/plate-ui/date-element-static';
import { EditorStatic } from '@op/modules/plate/plate-ui/editor-static';
import { HeadingElementStatic } from '@op/modules/plate/plate-ui/heading-element-static';
import { HrElementStatic } from '@op/modules/plate/plate-ui/hr-element-static';
import { ImageElementStatic } from '@op/modules/plate/plate-ui/image-element-static';
import { KbdLeafStatic } from '@op/modules/plate/plate-ui/kbd-leaf-static';
import { LinkElementStatic } from '@op/modules/plate/plate-ui/link-element-static';
import { MediaAudioElementStatic } from '@op/modules/plate/plate-ui/media-audio-element-static';
import { MediaFileElementStatic } from '@op/modules/plate/plate-ui/media-file-element-static';
import { MediaVideoElementStatic } from '@op/modules/plate/plate-ui/media-video-element-static';
import { MentionElementStatic } from '@op/modules/plate/plate-ui/mention-element-static';
import { ParagraphElementStatic } from '@op/modules/plate/plate-ui/paragraph-element-static';
import {
    TableCellElementStatic,
    TableCellHeaderStaticElement,
} from '@op/modules/plate/plate-ui/table-cell-element-static';
import { TableElementStatic } from '@op/modules/plate/plate-ui/table-element-static';
import { TableRowElementStatic } from '@op/modules/plate/plate-ui/table-row-element-static';
import { TocElementStatic } from '@op/modules/plate/plate-ui/toc-element-static';
import { ToggleElementStatic } from '@op/modules/plate/plate-ui/toggle-element-static';
import { withProps } from '@udecode/cn';
import { AlignPlugin } from '@udecode/plate-alignment/react';
import {
    BaseBoldPlugin,
    BaseCodePlugin,
    BaseItalicPlugin,
    BaseStrikethroughPlugin,
    BaseSubscriptPlugin,
    BaseSuperscriptPlugin,
    BaseUnderlinePlugin,
} from '@udecode/plate-basic-marks';
import { BaseBlockquotePlugin } from '@udecode/plate-block-quote';
import {
    BaseCodeBlockPlugin,
    BaseCodeLinePlugin,
    BaseCodeSyntaxPlugin,
} from '@udecode/plate-code-block';
import { BaseParagraphPlugin, createSlateEditor, SlateLeaf, } from '@udecode/plate-common';
import { BaseDatePlugin } from '@udecode/plate-date';
import {
    FontBackgroundColorPlugin,
    FontColorPlugin,
    FontSizePlugin
} from '@udecode/plate-font/react';
import {
    BaseHeadingPlugin,
    BaseTocPlugin,
    HEADING_KEYS,
    HEADING_LEVELS,
} from '@udecode/plate-heading';
import { BaseHorizontalRulePlugin } from '@udecode/plate-horizontal-rule';
import { BaseIndentPlugin } from '@udecode/plate-indent';
import { BaseIndentListPlugin } from '@udecode/plate-indent-list';
import { BaseKbdPlugin } from '@udecode/plate-kbd';
import { BaseColumnItemPlugin, BaseColumnPlugin } from '@udecode/plate-layout';
import { BaseLinkPlugin } from '@udecode/plate-link';
import {
    BaseAudioPlugin,
    BaseFilePlugin,
    BaseImagePlugin,
    BaseMediaEmbedPlugin,
    BaseVideoPlugin,
} from '@udecode/plate-media';
import { BaseMentionPlugin } from '@udecode/plate-mention';
import {
    BaseTableCellHeaderPlugin,
    BaseTableCellPlugin,
    BaseTablePlugin,
    BaseTableRowPlugin,
} from '@udecode/plate-table';
import { BaseTogglePlugin } from '@udecode/plate-toggle';
import { type Value } from "@udecode/slate";
import React from 'react';

import { Prism } from '../plate-ui/prism'
import { FireLiComponent, FireMarker } from '../plate-ui/indent-fire-marker';
import { TodoLiStatic, TodoMarkerStatic } from '../plate-ui/indent-todo-marker-static';

const components = {
    [BaseAudioPlugin.key]: MediaAudioElementStatic,
    [BaseBlockquotePlugin.key]: BlockquoteElementStatic,
    [BaseBoldPlugin.key]: withProps(SlateLeaf, { as: 'strong' }),
    [BaseCodeBlockPlugin.key]: CodeBlockElementStatic,
    [BaseCodeLinePlugin.key]: CodeLineElementStatic,
    [BaseCodePlugin.key]: CodeLeafStatic,
    [BaseCodeSyntaxPlugin.key]: CodeSyntaxLeafStatic,
    [BaseColumnItemPlugin.key]: ColumnElementStatic,
    [BaseColumnPlugin.key]: ColumnGroupElementStatic,
    [BaseDatePlugin.key]: DateElementStatic,
    [BaseFilePlugin.key]: MediaFileElementStatic,
    [BaseHorizontalRulePlugin.key]: HrElementStatic,
    [BaseImagePlugin.key]: ImageElementStatic,
    [BaseItalicPlugin.key]: withProps(SlateLeaf, { as: 'em' }),
    [BaseKbdPlugin.key]: KbdLeafStatic,
    [BaseLinkPlugin.key]: LinkElementStatic,
    [BaseMentionPlugin.key]: MentionElementStatic,
    [BaseParagraphPlugin.key]: ParagraphElementStatic,
    [BaseStrikethroughPlugin.key]: withProps(SlateLeaf, { as: 'del' }),
    [BaseSubscriptPlugin.key]: withProps(SlateLeaf, { as: 'sub' }),
    [BaseSuperscriptPlugin.key]: withProps(SlateLeaf, { as: 'sup' }),
    [BaseTableCellHeaderPlugin.key]: TableCellHeaderStaticElement,
    [BaseTableCellPlugin.key]: TableCellElementStatic,
    [BaseTablePlugin.key]: TableElementStatic,
    [BaseTableRowPlugin.key]: TableRowElementStatic,
    [BaseTocPlugin.key]: TocElementStatic,
    [BaseTogglePlugin.key]: ToggleElementStatic,
    [BaseUnderlinePlugin.key]: withProps(SlateLeaf, { as: 'u' }),
    [BaseVideoPlugin.key]: MediaVideoElementStatic,
    [HEADING_KEYS.h1]: withProps(HeadingElementStatic, { variant: 'h1' }),
    [HEADING_KEYS.h2]: withProps(HeadingElementStatic, { variant: 'h2' }),
    [HEADING_KEYS.h3]: withProps(HeadingElementStatic, { variant: 'h3' }),
    [HEADING_KEYS.h4]: withProps(HeadingElementStatic, { variant: 'h4' }),
    [HEADING_KEYS.h5]: withProps(HeadingElementStatic, { variant: 'h5' }),
    [HEADING_KEYS.h6]: withProps(HeadingElementStatic, { variant: 'h6' }),
};

const createEditor = (value: any) => createSlateEditor({
    plugins: [
        BaseColumnPlugin,
        BaseColumnItemPlugin,
        BaseTocPlugin,
        BaseVideoPlugin,
        BaseAudioPlugin,
        BaseParagraphPlugin,
        BaseHeadingPlugin,
        BaseMediaEmbedPlugin,
        BaseBoldPlugin,
        BaseCodePlugin,
        BaseItalicPlugin,
        BaseStrikethroughPlugin,
        BaseSubscriptPlugin,
        BaseSuperscriptPlugin,
        BaseUnderlinePlugin,
        BaseBlockquotePlugin,
        BaseDatePlugin,
        BaseCodeBlockPlugin.configure({
            options: {
                prism: Prism,
            },
        }),
        BaseIndentPlugin.extend({
            inject: {
                targetPlugins: [
                    BaseParagraphPlugin.key,
                    BaseBlockquotePlugin.key,
                    BaseCodeBlockPlugin.key,
                ],
            },
        }),
        BaseIndentListPlugin.extend({
            inject: {
                targetPlugins: [
                    BaseParagraphPlugin.key,
                    ...HEADING_LEVELS,
                    BaseBlockquotePlugin.key,
                    BaseCodeBlockPlugin.key,
                    BaseTogglePlugin.key,
                ],
            },
            options: {
                listStyleTypes: {
                    fire: {
                        liComponent: FireLiComponent,
                        markerComponent: FireMarker,
                        type: 'fire',
                    },
                    todo: {
                        liComponent: TodoLiStatic,
                        markerComponent: TodoMarkerStatic,
                        type: 'todo',
                    },
                },
            },
        }),
        BaseLinkPlugin,
        BaseTableRowPlugin,
        BaseTablePlugin,
        BaseTableCellPlugin,
        BaseHorizontalRulePlugin,
        FontColorPlugin,
        FontBackgroundColorPlugin,
        FontSizePlugin,
        BaseKbdPlugin,
        AlignPlugin.extend({
            inject: {
                targetPlugins: [
                    BaseParagraphPlugin.key,
                    BaseMediaEmbedPlugin.key,
                    ...HEADING_LEVELS,
                    BaseImagePlugin.key,
                ],
            },
        }),
        BaseFilePlugin,
        BaseImagePlugin,
        BaseMentionPlugin,
        BaseTogglePlugin,
    ],
    value
});

interface IStaticEditorProps extends React.HTMLAttributes<HTMLDivElement> {
    value: Value
}

export const StaticEditor: React.FC<IStaticEditorProps> = ({ value = [], ...props }) => {
    const editor = createEditor(value);
    return (
      <EditorStatic
        components={components}
        editor={editor}
        {...props}
      />
    );
};