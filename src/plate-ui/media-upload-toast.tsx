'use client';

import { useEffect } from 'react';

import { useEditorRef } from '@udecode/plate-common/react';
import { PlaceholderPlugin, UploadErrorCode } from '@udecode/plate-media/react';
import { useNotify } from "@oneplatformdev/ui/Toast";
import i18n from "i18next";

export const useUploadErrorToast = () => {
	const editor = useEditorRef();
	const { notifyToast } = useNotify();

	const toast = (msg: string) => {
		notifyToast(msg, 'destructive')
	}

	const uploadError = editor.useOption(PlaceholderPlugin, 'error');

	useEffect(() => {
		if (!uploadError) return;
		console.log('useUploadErrorToast => uploadError', uploadError);

		const { code, data } = uploadError;

		switch (code) {
			case UploadErrorCode.INVALID_FILE_SIZE: {
				toast(
					i18n.t('plate.media.invalidFileSize', {
						ns: 'lms',
						fileNames: data.files.map((f) => f.name).join(', ')
					})
				)
				break;
			}
			case UploadErrorCode.INVALID_FILE_TYPE: {
				toast(
					i18n.t('plate.media.invalidFileType', {
						ns: 'lms',
						fileNames: data.files.map((f) => f.name).join(', ')
					})
				)
				break;
			}
			case UploadErrorCode.TOO_LARGE: {
				toast(
					i18n.t('plate.media.invalidFileTooLarge', {
						ns: 'lms',
						fileNames: data.files.map((f) => f.name).join(', '),
						maxFileSize: data.maxFileSize
					})
				)
				break;
			}
			case UploadErrorCode.TOO_LESS_FILES: {
				toast(
					i18n.t('plate.media.invalidFileTooLessFiles', {
						ns: 'lms',
						minFileCount: data.minFileCount,
						fileType: data.fileType
					})
				)
				break;
			}
			case UploadErrorCode.TOO_MANY_FILES: {
				toast(
					i18n.t('plate.media.invalidFileTooManyFiles', {
						ns: 'lms',
						maxFileCount: data.maxFileCount,
						fileType: data.fileType
					})
				)
				break;
			}
		}
	}, [ uploadError ]);
};

export const MediaUploadToast = () => {
	useUploadErrorToast();

	return null;
};
