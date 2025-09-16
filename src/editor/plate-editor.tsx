'use client';
import { IUseCreateEditorProps, useCreateEditor } from '@op/modules/plate/editor/use-create-editor';
import { pinToolbar } from "@op/modules/plate/lib/pitToolbar.ts";
import { Editor, EditorContainer, EditorProps } from '@op/modules/plate/plate-ui/editor';
import { Plate } from '@udecode/plate-common/react';
import { FC, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import { UploadStateProvider } from '../context/UploadStateProvider';
import {
	FileUploadContext,
	IFileUploadContextValue
} from "@op/modules/plate/context/FileUploadContext.ts";

export interface PlateEditorProps
	extends Pick<EditorProps, 'onChangeValues'>,
		Pick<IFileUploadContextValue, 'onUploadFile'>,
		Pick<IUseCreateEditorProps, 'initialValue'> {
	isSimpleEditor?: boolean;
	className?: React.HTMLAttributes<HTMLDivElement>["className"];
}

export const PlateEditor: FC<PlateEditorProps> = (props) => {
	const {
		initialValue,
		onUploadFile,
		onChangeValues,
		isSimpleEditor = false,
		className
	} = props;
	const editor = useCreateEditor({ initialValue, isSimpleEditor });

	useEffect(() => {
		const cleanup = pinToolbar({
			containerSelector: `#${global.CONTAINER_LAYOUT_ID || 'container-layout'}`,
		});
		return cleanup;
	}, []);

	return (
		<div
			role='toolbar-wrapper'
			className='border rounded-sm box-border relative overflow-hidden min-h-full'
		>
			<UploadStateProvider>
				<FileUploadContext.Provider value={{ onUploadFile }}>
					<DndProvider backend={HTML5Backend}>
						<Plate editor={editor}>
							<EditorContainer>
								<Editor
									isSimpleEditor={isSimpleEditor}
									onChangeValues={onChangeValues}
									variant='fullWidth'
									className={className}
								/>
							</EditorContainer>
						</Plate>
					</DndProvider>
				</FileUploadContext.Provider>
			</UploadStateProvider>
		</div>
	);
};
