import { cn } from '@oneplatformdev/utils';
import type { TCaptionElement } from '@udecode/plate-caption';
import type { SlateElementProps } from '@udecode/plate-common';
import { getNodeString, SlateElement } from '@udecode/plate-common';
import type { TVideoElement } from '@udecode/plate-media';
import { useEffect, useMemo, useState } from 'react';

const isYouTube = (url: string) => url.includes('youtube.com') || url.includes('youtu.be');

const getYouTubeEmbedUrl = (url: string) => {
	try {
		const u = new URL(url);

		// youtu.be/<id>
		if (u.hostname.includes('youtu.be')) {
			const id = u.pathname.replace('/', '').trim();
			return id ? `https://www.youtube.com/embed/${id}` : url;
		}

		// youtube.com/watch?v=<id>
		const v = u.searchParams.get('v');
		if (v) return `https://www.youtube.com/embed/${v}`;

		// youtube.com/shorts/<id>
		const shortsMatch = u.pathname.match(/\/shorts\/([^/?#]+)/);
		if (shortsMatch?.[1]) return `https://www.youtube.com/embed/${shortsMatch[1]}`;

		// youtube.com/embed/<id> (leave as is)
		if (u.pathname.startsWith('/embed/')) return url;

		return url;
	} catch {
		return url;
	}
};

type VideoType = 'video' | 'iframe' | 'youtube' | 'error';

/**
 * Variant A (no network requests):
 * - Avoids CORS by not doing fetch HEAD from the browser.
 * - Uses simple heuristics based on URL/extension.
 */
const guessVideoType = (url: string): Exclude<VideoType, 'error'> => {
	if (isYouTube(url)) return 'youtube';

	const lower = url.toLowerCase();

	// Try to read pathname to avoid querystring affecting extension checks
	const pathname = (() => {
		try {
			return new URL(url).pathname.toLowerCase();
		} catch {
			return lower;
		}
	})();

	// Common direct video file extensions
	if (
		pathname.endsWith('.mp4') ||
		pathname.endsWith('.webm') ||
		pathname.endsWith('.ogg') ||
		pathname.endsWith('.mov') ||
		pathname.endsWith('.m4v')
	) {
		return 'video';
	}

	return 'iframe';
};

const RenderVideo = (props: SlateElementProps) => {
	const { url, width } = props.element as TVideoElement &
		TCaptionElement & {
		width: number;
	};

	const [videoType, setVideoType] = useState<VideoType>('iframe');

	useEffect(() => {
		// No async fetch => no CORS failures
		setVideoType(guessVideoType(url));
	}, [url]);

	const iframeSrc = useMemo(() => {
		if (videoType === 'youtube') return getYouTubeEmbedUrl(url);
		return url;
	}, [url, videoType]);

	// Optional: basic invalid URL guard (keeps behavior close to your original "error" branch)
	useEffect(() => {
		if (!url || typeof url !== 'string') {
			setVideoType('error');
			return;
		}
		try {
			// Accept relative? If you want strictly absolute URLs, keep this.
			new URL(url);
		} catch {
			// If it's YouTube but not parseable, still try to render as iframe
			setVideoType(isYouTube(url) ? 'youtube' : 'error');
		}
	}, [url]);

	if (videoType === 'error') {
		return <p className="text-red-500">Invalid video URL</p>;
	}

	if (videoType === 'video') {
		return (
			<video className={cn('w-full max-w-full object-cover px-0', 'rounded-sm')} src={url} controls />
		);
	}

	return (
		<iframe
			className="w-full max-w-full object-cover px-0 rounded-sm"
			width={width}
			src={iframeSrc}
			frameBorder="0"
			allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
			allowFullScreen
		/>
	);
};

export function MediaVideoElementStatic(props: SlateElementProps) {
	const { children, className, ...rest } = props;

	const { align = 'center', caption, width } = rest.element as TVideoElement &
		TCaptionElement & {
		width: number;
	};

	return (
		<SlateElement className={cn(className, 'py-2.5')} {...props}>
			<div style={{ textAlign: align }}>
				<figure className="group relative m-0 inline-block cursor-default" style={{ width }}>
					<RenderVideo {...props} />
					{caption && <figcaption>{getNodeString(caption[0])}</figcaption>}
				</figure>
			</div>
			{children}
		</SlateElement>
	);
}
