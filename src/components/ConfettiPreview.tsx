import { useCallback, useEffect, useRef, useState } from "react";
import {
	type ConfettiParticle,
	initParticles,
	renderFrame,
	updateParticles,
} from "#/features/confetti/engine";
import { useConfettiSettings } from "#/features/confetti/useConfettiSettings";

interface ConfettiPreviewProps {
	imageUrl: string | null;
}

const PREVIEW_MAX_WIDTH = 800;
const PREVIEW_MAX_HEIGHT = 600;
const PLACEHOLDER_WIDTH = 640;
const PLACEHOLDER_HEIGHT = 360;
const RESTART_DEBOUNCE_MS = 300;

function createPlaceholder(width: number, height: number): HTMLCanvasElement {
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext("2d");
	if (ctx) {
		ctx.fillStyle = "#1e293b";
		ctx.fillRect(0, 0, width, height);
	}
	return canvas;
}

function loadImage(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = "anonymous";
		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error("Failed to load image preview."));
		img.src = src;
	});
}

function calculatePreviewSize(img: HTMLImageElement) {
	const scale = Math.min(
		PREVIEW_MAX_WIDTH / img.naturalWidth,
		PREVIEW_MAX_HEIGHT / img.naturalHeight,
		1,
	);

	return {
		width: Math.max(1, Math.round(img.naturalWidth * scale)),
		height: Math.max(1, Math.round(img.naturalHeight * scale)),
	};
}

export function ConfettiPreview({ imageUrl }: ConfettiPreviewProps) {
	const { settings } = useConfettiSettings();
	const [isPlaying, setIsPlaying] = useState(true);

	const canvasRef = useRef<HTMLCanvasElement>(null);
	const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
	const imageRef = useRef<HTMLImageElement | HTMLCanvasElement | null>(null);
	const widthRef = useRef(0);
	const heightRef = useRef(0);
	const settingsRef = useRef(settings);
	const isPlayingRef = useRef(isPlaying);
	const rafIdRef = useRef(0);
	const particlesRef = useRef<ConfettiParticle[]>([]);
	const startTimeRef = useRef(0);
	const lastTimeRef = useRef(0);
	const burstIndexRef = useRef(0);
	const nextBurstTimeRef = useRef(0);
	const pendingRestartRef = useRef(0);
	const isInitialSettingsRef = useRef(true);

	settingsRef.current = settings;
	isPlayingRef.current = isPlaying;

	const step = useCallback((now: number) => {
		rafIdRef.current = 0;
		const ctx = ctxRef.current;
		const image = imageRef.current;
		const width = widthRef.current;
		const height = heightRef.current;
		const currentSettings = settingsRef.current;

		if (!ctx || !image || !isPlayingRef.current) {
			return;
		}

		const elapsed = now - startTimeRef.current;
		const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
		lastTimeRef.current = now;

		while (
			burstIndexRef.current < currentSettings.burstCount &&
			elapsed >= nextBurstTimeRef.current
		) {
			const burstTime = nextBurstTimeRef.current;
			particlesRef.current.push(
				...initParticles(currentSettings, width, height, burstTime),
			);
			burstIndexRef.current += 1;
			nextBurstTimeRef.current =
				burstIndexRef.current * currentSettings.burstIntervalMs;
		}

		updateParticles(particlesRef.current, dt, currentSettings, elapsed);

		for (let i = particlesRef.current.length - 1; i >= 0; i--) {
			const particle = particlesRef.current[i];
			if (particle.y - particle.size > height) {
				particlesRef.current.splice(i, 1);
			}
		}

		renderFrame(
			ctx,
			image,
			width,
			height,
			particlesRef.current,
			currentSettings,
		);
		rafIdRef.current = requestAnimationFrame(step);
	}, []);

	const startPreview = useCallback(() => {
		const canvas = canvasRef.current;
		const image = imageRef.current;
		if (!canvas || !image) {
			return;
		}

		const ctx = canvas.getContext("2d");
		if (!ctx) {
			return;
		}

		ctxRef.current = ctx;
		canvas.width = widthRef.current;
		canvas.height = heightRef.current;
		particlesRef.current = [];
		burstIndexRef.current = 0;
		nextBurstTimeRef.current = 0;
		startTimeRef.current = performance.now();
		lastTimeRef.current = startTimeRef.current;
		isPlayingRef.current = true;
		setIsPlaying(true);
		cancelAnimationFrame(rafIdRef.current);
		rafIdRef.current = requestAnimationFrame(step);
	}, [step]);

	useEffect(() => {
		let isCancelled = false;

		if (!imageUrl) {
			const placeholder = createPlaceholder(
				PLACEHOLDER_WIDTH,
				PLACEHOLDER_HEIGHT,
			);
			imageRef.current = placeholder;
			widthRef.current = placeholder.width;
			heightRef.current = placeholder.height;
			startPreview();
			return () => {
				isCancelled = true;
			};
		}

		loadImage(imageUrl)
			.then((img) => {
				if (isCancelled) {
					return;
				}
				const size = calculatePreviewSize(img);
				imageRef.current = img;
				widthRef.current = size.width;
				heightRef.current = size.height;
				startPreview();
			})
			.catch(() => {
				const placeholder = createPlaceholder(
					PLACEHOLDER_WIDTH,
					PLACEHOLDER_HEIGHT,
				);
				imageRef.current = placeholder;
				widthRef.current = placeholder.width;
				heightRef.current = placeholder.height;
				startPreview();
			});

		return () => {
			isCancelled = true;
		};
	}, [imageUrl, startPreview]);

	useEffect(() => {
		settingsRef.current = settings;

		if (isInitialSettingsRef.current) {
			isInitialSettingsRef.current = false;
			return;
		}

		if (pendingRestartRef.current) {
			clearTimeout(pendingRestartRef.current);
		}

		pendingRestartRef.current = window.setTimeout(() => {
			pendingRestartRef.current = 0;
			startPreview();
		}, RESTART_DEBOUNCE_MS);

		return () => {
			if (pendingRestartRef.current) {
				clearTimeout(pendingRestartRef.current);
				pendingRestartRef.current = 0;
			}
		};
	}, [settings, startPreview]);

	useEffect(() => {
		isPlayingRef.current = isPlaying;
		if (isPlaying) {
			if (rafIdRef.current === 0 && startTimeRef.current > 0) {
				lastTimeRef.current = performance.now();
				rafIdRef.current = requestAnimationFrame(step);
			}
		} else {
			cancelAnimationFrame(rafIdRef.current);
			rafIdRef.current = 0;
		}
	}, [isPlaying, step]);

	useEffect(() => {
		return () => {
			if (pendingRestartRef.current) {
				clearTimeout(pendingRestartRef.current);
			}
			cancelAnimationFrame(rafIdRef.current);
		};
	}, []);

	const togglePlay = () => setIsPlaying((playing) => !playing);
	const restart = () => startPreview();

	return (
		<div className="space-y-4 text-center">
			<canvas
				ref={canvasRef}
				className="mx-auto w-full max-h-80 rounded-lg object-contain"
			/>
			<div className="flex items-center justify-center gap-3">
				<button
					type="button"
					onClick={togglePlay}
					className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
				>
					{isPlaying ? "Pause" : "Play"}
				</button>
				<button
					type="button"
					onClick={restart}
					className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
				>
					Restart
				</button>
			</div>
		</div>
	);
}
