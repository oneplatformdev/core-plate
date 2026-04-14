'use client';

import { useContext, useEffect } from 'react';

import { useEditorRef } from '@udecode/plate-common/react';
import { PlaceholderPlugin, UploadErrorCode } from '@udecode/plate-media/react';

import { FileUploadContext } from "@op/modules/plate/context/FileUploadContext.ts";

export const useUploadErrorToast = () => {
	const editor = useEditorRef();
	const { onUploadValidateError } = useContext(FileUploadContext);

	const uploadError = editor.useOption(PlaceholderPlugin, 'error');

	useEffect(() => {
		if (!uploadError) return;

		if (onUploadValidateError) {
			onUploadValidateError(uploadError);
		} else {
			const { code, data } = uploadError;

			switch (code) {
				case UploadErrorCode.INVALID_FILE_SIZE: {
					alert(`Невірний розмір файлу: ${data.files.map((f) => f.name).join(', ')}`);
					break;
				}
				case UploadErrorCode.INVALID_FILE_TYPE: {
					alert(`Невірний тип файлу: ${data.files.map((f) => f.name).join(', ')}`);
					break;
				}
				case UploadErrorCode.TOO_LARGE: {
					alert(`Розмір файлу перевищує максимально допустимий ліміт (${data.maxFileSize}): ${data.files.map((f) => f.name).join(', ')}`);
					break;
				}
				case UploadErrorCode.TOO_LESS_FILES: {
					alert(`Мінімальна кількість файлів: ${data.minFileCount}`);
					break;
				}
				case UploadErrorCode.TOO_MANY_FILES: {
					alert(`Максимальна кількість файлів: ${data.maxFileCount}`);
					break;
				}
			}
		}

		editor.setOption(PlaceholderPlugin, 'error', null);
	}, [uploadError]);
};

export const MediaUploadToast = () => {
	useUploadErrorToast();

	return null;
};
