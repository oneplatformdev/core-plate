'use client';

import { FixedToolbarPlugin } from '@op/modules/plate/editor/plugins/fixed-toolbar-plugin';
import { FloatingToolbarPlugin } from '@op/modules/plate/editor/plugins/floating-toolbar-plugin';
import { MediaUploadToast } from "@op/modules/plate/plate-ui/media-upload-toast.tsx";
import { CalloutPlugin } from '@udecode/plate-callout/react';
import { ParagraphPlugin } from '@udecode/plate-common/react';
import { DatePlugin } from '@udecode/plate-date/react';
import { DocxPlugin } from '@udecode/plate-docx';
import { EmojiPlugin } from '@udecode/plate-emoji/react';
import {
	FontBackgroundColorPlugin,
	FontColorPlugin,
	FontSizePlugin,
} from '@udecode/plate-font/react';
import { HorizontalRulePlugin } from '@udecode/plate-horizontal-rule/react';
import { JuicePlugin } from '@udecode/plate-juice';
import { KbdPlugin } from '@udecode/plate-kbd/react';
import { ColumnPlugin } from '@udecode/plate-layout/react';
import { MarkdownPlugin } from '@udecode/plate-markdown';
import { EquationPlugin, InlineEquationPlugin, } from '@udecode/plate-math/react';
import {
	AudioPlugin,
	FilePlugin,
	ImagePlugin,
	MediaEmbedPlugin,
	PlaceholderPlugin,
	VideoPlugin,
} from '@udecode/plate-media/react';
import { SelectOnBackspacePlugin } from '@udecode/plate-select';
import { SlashPlugin } from '@udecode/plate-slash-command/react';
import { TogglePlugin } from '@udecode/plate-toggle/react';
import { TrailingBlockPlugin } from '@udecode/plate-trailing-block';

import { alignPlugin } from './align-plugin';
import { autoformatPlugin } from './autoformat-plugin';
import { basicNodesPlugins } from './basic-nodes-plugins';
import { blockMenuPlugins } from './block-menu-plugins';
import { cursorOverlayPlugin } from './cursor-overlay-plugin';
import { deletePlugins } from './delete-plugins';
import { dndPlugins } from './dnd-plugins';
import { exitBreakPlugin } from './exit-break-plugin';
import { indentListPlugins } from './indent-list-plugins';
import { lineHeightPlugin } from './line-height-plugin';
import { linkPlugin } from './link-plugin';
import { mediaPlugins } from './media-plugins';
import { mentionPlugin } from './mention-plugin';
import { resetBlockTypePlugin } from './reset-block-type-plugin';
import { softBreakPlugin } from './soft-break-plugin';
import { tablePlugin } from './table-plugin';
import { tocPlugin } from './toc-plugin';

export const viewPlugins = [
	...basicNodesPlugins,
	HorizontalRulePlugin,
	linkPlugin,
	DatePlugin,
	mentionPlugin,
	tablePlugin,
	TogglePlugin,
	tocPlugin,
	...mediaPlugins,
	InlineEquationPlugin,
	EquationPlugin,
	CalloutPlugin,
	ColumnPlugin,

	// Marks
	FontColorPlugin,
	FontBackgroundColorPlugin,
	FontSizePlugin,
	KbdPlugin,

	// Block Style
	alignPlugin,
	...indentListPlugins,
	lineHeightPlugin,
] as const;

export const editorPlugins = [

	// Nodes
	...viewPlugins,

	// Functionality
	SlashPlugin,
	autoformatPlugin,
	cursorOverlayPlugin,
	...blockMenuPlugins,
	...dndPlugins,
	EmojiPlugin,
	exitBreakPlugin,
	resetBlockTypePlugin,
	...deletePlugins,
	softBreakPlugin,
	TrailingBlockPlugin.configure({ options: { type: ParagraphPlugin.key } }),

	// Deserialization
	DocxPlugin,
	MarkdownPlugin.configure({ options: { indentList: true } }),
	JuicePlugin,

	// UI
	FixedToolbarPlugin,
	FloatingToolbarPlugin,

	// Media
	ImagePlugin,
	VideoPlugin,
	// videoPlugin,
	AudioPlugin,
	FilePlugin,
	MediaEmbedPlugin,
	SelectOnBackspacePlugin.configure({
		options: {
			query: {
				allow: [ ImagePlugin.key, VideoPlugin.key, AudioPlugin.key, FilePlugin.key, MediaEmbedPlugin.key ],
			},
		},
	}),
	PlaceholderPlugin.configure({
		options: {
			disableEmptyPlaceholder: true,
			uploadConfig: {
				[VideoPlugin.key]: {
					mediaType: VideoPlugin.key,
					maxFileSize: '128MB',
					maxFileCount: 1,
					minFileCount: 1,
				},
				image: {
					mediaType: ImagePlugin.key,
					maxFileCount: 1,
					minFileCount: 1,
					maxFileSize: '128MB',
				},
				pdf: {
					mediaType: FilePlugin.key,
					maxFileCount: 1,
					minFileCount: 1,
					maxFileSize: '16MB',
				},
				text: {
					mediaType: FilePlugin.key,
					maxFileCount: 1,
					minFileCount: 1,
					maxFileSize: '16MB',
				},
				blob: {
					mediaType: FilePlugin.key,
					maxFileCount: 1,
					minFileCount: 1,
					maxFileSize: '16MB',
				}
			}
		},
		render: { afterEditable: MediaUploadToast },
	}),
];
