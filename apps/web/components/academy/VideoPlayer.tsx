import React, { useEffect, useRef, useState } from 'react';
import { IoPlayOutline, IoCheckmarkCircleOutline } from 'react-icons/io5';

interface VideoPlayerProps {
    videoUrl: string;
    moduleId: string;
    videoWatched: boolean;
    onVideoEnded: () => void;
}

const extractYouTubeId = (url: string): string | null => {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /^([a-zA-Z0-9_-]{11})$/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
};

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, moduleId, videoWatched, onVideoEnded }) => {
    const playerRef = useRef<any>(null);
    const containerRef = useRef<string>(`yt-player-${moduleId}`);
    const [isReady, setIsReady] = useState(false);
    const [hasEnded, setHasEnded] = useState(videoWatched);

    const youtubeId = extractYouTubeId(videoUrl);

    useEffect(() => {
        if (!youtubeId) return;
        if (videoWatched) {
            setHasEnded(true);
            return;
        }

        // Load YouTube IFrame API if not already loaded
        if (!(window as any).YT) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScript = document.getElementsByTagName('script')[0];
            firstScript.parentNode?.insertBefore(tag, firstScript);
        }

        const initPlayer = () => {
            if (playerRef.current) {
                playerRef.current.destroy();
            }

            playerRef.current = new (window as any).YT.Player(containerRef.current, {
                videoId: youtubeId,
                playerVars: {
                    modestbranding: 1,
                    rel: 0,
                },
                events: {
                    onReady: () => setIsReady(true),
                    onStateChange: (event: any) => {
                        if (event.data === (window as any).YT.PlayerState.ENDED) {
                            setHasEnded(true);
                            onVideoEnded();
                        }
                    },
                },
            });
        };

        if ((window as any).YT && (window as any).YT.Player) {
            initPlayer();
        } else {
            (window as any).onYouTubeIframeAPIReady = initPlayer;
        }

        return () => {
            if (playerRef.current && typeof playerRef.current.destroy === 'function') {
                playerRef.current.destroy();
            }
        };
    }, [youtubeId, moduleId]);

    // Non-YouTube fallback: generic iframe embed
    if (!youtubeId) {
        return (
            <div className="space-y-3">
                <div className="aspect-video bg-black rounded-xl overflow-hidden">
                    <iframe
                        src={videoUrl}
                        className="w-full h-full"
                        allow="autoplay; fullscreen"
                        allowFullScreen
                    />
                </div>
                {!videoWatched && !hasEnded && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-700">
                        Watch the full video to unlock the quiz.
                        <button
                            onClick={() => { setHasEnded(true); onVideoEnded(); }}
                            className="ml-2 underline font-medium"
                        >
                            Mark as watched
                        </button>
                    </div>
                )}
                {(videoWatched || hasEnded) && (
                    <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                        <IoCheckmarkCircleOutline size={18} />
                        Video completed
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="aspect-video bg-black rounded-xl overflow-hidden relative">
                <div id={containerRef.current} className="w-full h-full" />
                {!isReady && !videoWatched && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </div>
            {!videoWatched && !hasEnded && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-700 flex items-center gap-2">
                    <IoPlayOutline size={16} />
                    Watch the full video to unlock the quiz
                </div>
            )}
            {(videoWatched || hasEnded) && (
                <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                    <IoCheckmarkCircleOutline size={18} />
                    Video completed
                </div>
            )}
        </div>
    );
};

export default VideoPlayer;
