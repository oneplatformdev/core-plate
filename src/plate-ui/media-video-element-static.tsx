import { cn } from '@udecode/cn';
import type { TCaptionElement } from '@udecode/plate-caption';
import type { SlateElementProps } from '@udecode/plate-common';
import { getNodeString, SlateElement } from '@udecode/plate-common';
import type { TVideoElement } from '@udecode/plate-media';
import i18n from "i18next";
import { FC, useEffect, useState } from "react";

const isYouTube = (url: string) => {
	return url.includes("youtube.com") || url.includes("youtu.be");
};

const getYouTubeEmbedUrl = (url: string) => {
	try {
		const videoId = new URL(url).searchParams.get("v");
		return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
	} catch {
		return url;
	}
};


const checkVideoType = async (url: string): Promise<"video" | "iframe" | "error" | 'youtube'> => {
	try {
		const response = await fetch(url, { method: "HEAD" });

		if (!response.ok) {
			return isYouTube(url) ? 'youtube' : 'error';
		}

		const contentType = response.headers.get("Content-Type") || "";
		return contentType.startsWith("video/") ? "video" : "iframe";
	} catch (err) {
		console.error(err);
		return isYouTube(url) ? 'youtube' : 'error';
	}
};

const RenderVideo: FC<SlateElementProps> = (props) => {
	const {
		url,
		width,
	} = props.element as TVideoElement &
		TCaptionElement & {
		width: number;
	};

	const [ videoType, setVideoType ] = useState<"video" | "iframe" | "error" | "youtube" | "loading">("loading");

	useEffect(() => {
		checkVideoType(url)
			.then(setVideoType)
			.catch(() => setVideoType('error'));
	}, [ url ]);

	if (videoType === "loading") {
		return <p className="text-gray-500">...</p>;
	}

	if (videoType === "video") {
		return (
			<video
				className={cn("w-full max-w-full object-cover px-0", "rounded-sm")}
				src={url}
				controls
			/>
		);
	}

	if(videoType === 'error') {
		return <p className="text-red-500">{i18n.t('invalid_video_url')}</p>;
	}

	if(videoType === 'youtube') {
		return (
			<iframe
				className="w-full max-w-full object-cover px-0 rounded-sm"
				width={width}
				src={getYouTubeEmbedUrl(url)}
				frameBorder="0"
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
				allowFullScreen
			/>
		);
	}

	return (
		<iframe
			className="w-full max-w-full object-cover px-0 rounded-sm"
			width={width}
			src={url.includes("youtube.com") || url.includes("youtu.be") ?
				`https://www.youtube.com/embed/${new URL(url).searchParams.get("v")}` : url}
			frameBorder="0"
			allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
			allowFullScreen
		/>
	);
};

export function MediaVideoElementStatic(props: SlateElementProps) {
	const {
		children,
		className,
		...rest
	} = props;
	const {
		align = 'center',
		caption,
		width,
	} = rest.element as TVideoElement &
		TCaptionElement & {
		width: number;
	};

	return (
		<SlateElement className={cn(className, 'py-2.5')} {...props}>
			<div style={{ textAlign: align }}>
				<figure
					className="group relative m-0 inline-block cursor-default"
					style={{ width }}
				>
					<RenderVideo {...props}/>
					{caption && <figcaption>{getNodeString(caption[0])}</figcaption>}
				</figure>
			</div>
			{children}
		</SlateElement>
	);
}
