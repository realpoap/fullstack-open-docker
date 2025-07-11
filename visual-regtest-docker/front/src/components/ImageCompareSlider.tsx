import { Eye, EyeOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface ImageCompareSliderProps {
    image1: string;
    image2: string;
    diffImage?: string;
    className?: string;
}

export const ImageCompareSlider = ({ image1, image2, diffImage, className = '' }: ImageCompareSliderProps) => {
    const [position, setPosition] = useState(50);
    const [showOverlay, setShowOverlay] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleMouseDown = (e: React.MouseEvent) => {
        // Only start dragging if clicking on the slider handle or its container
        const target = e.target as HTMLElement;
        if (target.closest('.slider-handle') || target.closest('.slider-container')) {
            setIsDragging(true);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging || !containerRef.current) return;

        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = (x / rect.width) * 100;

        // Clamp the percentage between 5 and 95 to keep the handle always grabbable
        const clampedPercentage = Math.max(5, Math.min(95, percentage));
        setPosition(clampedPercentage);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    return (
        <div
            ref={containerRef}
            className={`relative w-full h-full select-none ${className}`}
            onMouseDown={handleMouseDown}
            style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
        >
            {/* Floating controls - positioned absolutely */}
            <div className="absolute top-0 left-0 right-0 z-20 flex justify-between p-2 pointer-events-none">
                <div className="px-2 py-1 bg-gray-800/50 text-white text-sm rounded pointer-events-auto">
                    Selected image
                </div>
                <div className="px-2 py-1 bg-gray-800/50 text-white text-sm rounded pointer-events-auto">
                    Current image
                </div>
            </div>

            {/* Overlay Toggle - positioned absolutely */}
            {diffImage && (
                <button
                    onClick={() => setShowOverlay(!showOverlay)}
                    className="absolute bottom-2 right-2 p-2 bg-gray-800/50 text-white rounded-full z-20 hover:bg-gray-800/70 transition-colors pointer-events-auto"
                >
                    {showOverlay ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
            )}

            {/* Scrollable images container */}
            <div className="w-full h-full overflow-auto">
                {/* Images wrapper */}
                <div className="relative w-full">
                    {/* Base image (image2) */}
                    <div className="relative w-full">
                        <img
                            src={image2}
                            alt="Base image"
                            className="w-full object-none pointer-events-none"
                            draggable="false"
                            style={{ display: 'block' }}
                        />
                        {diffImage && showOverlay && (
                            <img
                                src={diffImage}
                                alt="Difference overlay"
                                className="absolute top-0 left-0 w-full object-none opacity-50 pointer-events-none"
                                draggable="false"
                                style={{ display: 'block' }}
                            />
                        )}
                    </div>

                    {/* Sliding image (image1) */}
                    <div
                        className="absolute top-0 left-0 w-full overflow-hidden"
                        style={{
                            clipPath: `inset(0 ${100 - position}% 0 0)`
                        }}
                    >
                        <div className="relative w-full">
                            <img
                                src={image1}
                                alt="Comparison image"
                                className="w-full object-none pointer-events-none"
                                draggable="false"
                                style={{ display: 'block' }}
                            />
                        </div>
                    </div>

                    {/* Slider handle - contained within component */}
                    <div
                        className="absolute top-0 bottom-0 flex items-center justify-center slider-container"
                        style={{
                            left: `${position}%`,
                            transform: 'translateX(-50%)',
                            zIndex: 30,
                            pointerEvents: 'none'
                        }}
                    >
                        <div className="w-1 h-full shadow-xl shadow-stone-800 bg-red-300 cursor-ew-resize slider-handle pointer-events-auto" />
                        <div className="absolute top-50 w-8 h-8 bg-red-200 rounded-full flex items-center justify-center shadow-lg slider-handle pointer-events-auto">
                            <div className="w-6 h-6 bg-red-300 rounded-full" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}; 