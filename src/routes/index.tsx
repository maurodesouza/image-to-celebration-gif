import { createFileRoute } from "@tanstack/react-router";
import { encode } from "modern-gif";
import workerUrl from "modern-gif/worker?url";
import { useEffect, useId, useRef, useState } from "react";

export const Route = createFileRoute("/")({
	component: Home,
});

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const GIF_MAX_WIDTH = 640;
const GIF_MAX_HEIGHT = 640;
const GIF_FPS = 12;
const GIF_FRAME_DELAY = 8;
const GIF_FRAME_COUNT = 63;
const GIF_DURATION_MS = 5000;
const CONFETTI_COUNT = 120;
const CONFETTI_COLORS = [
	"#ef4444",
	"#f97316",
	"#eab308",
	"#22c55e",
	"#06b6d4",
	"#3b82f6",
	"#8b5cf6",
	"#ec4899",
];

interface ConfettiParticle {
	x: number;
	y: number;
	vx: number;
	vy: number;
	gravity: number;
	color: string;
	size: number;
	rotation: number;
	rotationSpeed: number;
}

function Home() {
	const inputId = useId();
	const dragCounter = useRef(0);

	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [outputUrl, setOutputUrl] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);
	const [progress, setProgress] = useState(0);

	useEffect(() => {
		if (!selectedFile) {
			setPreviewUrl(null);
			return;
		}

		const url = URL.createObjectURL(selectedFile);
		setPreviewUrl(url);

		return () => URL.revokeObjectURL(url);
	}, [selectedFile]);

	useEffect(() => {
		return () => {
			if (outputUrl) {
				URL.revokeObjectURL(outputUrl);
			}
		};
	}, [outputUrl]);

	const validateFile = (file: File): string | null => {
		if (!ACCEPTED_TYPES.includes(file.type)) {
			return "Please upload a PNG, JPEG, WebP, or GIF image.";
		}

		if (file.size > MAX_FILE_SIZE) {
			return "Image must be smaller than 10 MB.";
		}

		return null;
	};

	const handleFile = (file: File | undefined) => {
		setError(null);
		setOutputUrl(null);

		if (!file) {
			return;
		}

		const validationError = validateFile(file);

		if (validationError) {
			setSelectedFile(null);
			setError(validationError);
			return;
		}

		setSelectedFile(file);
	};

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		handleFile(event.target.files?.[0]);
		event.target.value = "";
	};

	const handleDragEnter = (event: React.DragEvent<HTMLLabelElement>) => {
		event.preventDefault();
		dragCounter.current += 1;
		setIsDragging(true);
	};

	const handleDragLeave = (event: React.DragEvent<HTMLLabelElement>) => {
		event.preventDefault();
		dragCounter.current -= 1;

		if (dragCounter.current <= 0) {
			dragCounter.current = 0;
			setIsDragging(false);
		}
	};

	const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
		event.preventDefault();
		dragCounter.current = 0;
		setIsDragging(false);
		handleFile(event.dataTransfer.files[0]);
	};

	const handleGenerate = async () => {
		if (!selectedFile || !previewUrl) {
			return;
		}

		setIsGenerating(true);
		setProgress(0);
		setError(null);
		setOutputUrl(null);

		try {
			const img = await loadImage(previewUrl);
			const { width, height } = calculateGifSize(img);
			const canvas = document.createElement("canvas");
			canvas.width = width;
			canvas.height = height;

			const ctx = canvas.getContext("2d", { willReadFrequently: true });
			if (!ctx) {
				throw new Error("Could not create canvas context.");
			}

			const particles = createConfettiParticles(width, height);
			const frames: Array<{ data: Uint8ClampedArray; delay: number }> = [];
			const frameInterval = 1000 / GIF_FPS;
			const start = performance.now();
			let lastTime = start;
			let captured = 0;

			await new Promise<void>((resolve, reject) => {
				let rafId = 0;

				const step = (now: number) => {
					const elapsed = now - start;
					const dt = Math.min((now - lastTime) / 1000, 0.1);
					lastTime = now;

					updateParticles(particles, dt);
					renderFrame(ctx, img, width, height, particles);

					if (
						captured < GIF_FRAME_COUNT &&
						elapsed >= captured * frameInterval
					) {
						const imageData = ctx.getImageData(0, 0, width, height);
						frames.push({
							data: imageData.data,
							delay: GIF_FRAME_DELAY,
						});
						captured += 1;
						setProgress(Math.round((captured / GIF_FRAME_COUNT) * 100));
					}

					if (elapsed < GIF_DURATION_MS) {
						rafId = requestAnimationFrame(step);
					} else {
						while (captured < GIF_FRAME_COUNT) {
							renderFrame(ctx, img, width, height, particles);
							const imageData = ctx.getImageData(0, 0, width, height);
							frames.push({
								data: imageData.data,
								delay: GIF_FRAME_DELAY,
							});
							captured += 1;
						}

						encode({
							width,
							height,
							frames,
							format: "blob",
							maxColors: 128,
							workerUrl,
						})
							.then((blob) => {
								const url = URL.createObjectURL(blob);
								setOutputUrl(url);
								triggerDownload(url, "celebration.gif");
								resolve();
							})
							.catch(reject)
							.finally(() => cancelAnimationFrame(rafId));
					}
				};

				rafId = requestAnimationFrame(step);
			});
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "An unexpected error occurred while generating the GIF.",
			);
		} finally {
			setIsGenerating(false);
		}
	};

	return (
		<main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-12 text-slate-100">
			<div className="w-full max-w-xl">
				<h1 className="mb-2 text-center text-3xl font-bold sm:text-4xl">
					Image to Celebration GIF
				</h1>
				<p className="mb-8 text-center text-slate-400">
					Upload an image to get started.
				</p>

				<label
					htmlFor={inputId}
					className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 focus-within:ring-offset-slate-950 sm:p-12 ${
						isDragging
							? "border-blue-500 bg-slate-900"
							: "border-slate-700 bg-slate-900 hover:border-slate-500"
					}`}
					onDragEnter={handleDragEnter}
					onDragLeave={handleDragLeave}
					onDragOver={(event) => event.preventDefault()}
					onDrop={handleDrop}
				>
					<input
						id={inputId}
						type="file"
						accept={ACCEPTED_TYPES.join(",")}
						className="sr-only"
						onChange={handleInputChange}
						disabled={isGenerating}
					/>
					<span className="text-lg font-medium">
						Click or drag an image here
					</span>
					<span className="mt-1 text-sm text-slate-400">
						PNG, JPEG, WebP, or GIF up to 10 MB
					</span>
				</label>

				{error && (
					<p
						className="mt-4 rounded-lg bg-red-950 p-3 text-center text-sm text-red-200"
						role="alert"
					>
						{error}
					</p>
				)}

				{previewUrl && (
					<div className="mt-8 rounded-2xl border border-slate-700 bg-slate-900 p-4">
						<img
							src={previewUrl}
							alt={
								selectedFile
									? `Preview of ${selectedFile.name}`
									: "Image preview"
							}
							className="mx-auto max-h-80 w-full rounded-xl object-contain"
						/>
						<p className="mt-2 text-center text-sm text-slate-400">
							{selectedFile?.name}
						</p>
					</div>
				)}

				<button
					type="button"
					disabled={!selectedFile || isGenerating}
					onClick={handleGenerate}
					className="mt-8 w-full rounded-xl bg-blue-600 px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
				>
					{isGenerating
						? `Generating... ${progress}%`
						: "Generate Celebration GIF"}
				</button>

				{outputUrl && (
					<div className="mt-8 rounded-2xl border border-slate-700 bg-slate-900 p-4">
						<img
							src={outputUrl}
							alt="Generated celebration GIF"
							className="mx-auto max-h-80 w-full rounded-xl object-contain"
						/>
						<a
							href={outputUrl}
							download="celebration.gif"
							className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-green-600 px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-slate-950"
						>
							Download GIF
						</a>
					</div>
				)}
			</div>
		</main>
	);
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

function calculateGifSize(img: HTMLImageElement) {
	const scale = Math.min(
		GIF_MAX_WIDTH / img.naturalWidth,
		GIF_MAX_HEIGHT / img.naturalHeight,
		1,
	);

	return {
		width: Math.max(1, Math.round(img.naturalWidth * scale)),
		height: Math.max(1, Math.round(img.naturalHeight * scale)),
	};
}

function createConfettiParticles(
	canvasWidth: number,
	canvasHeight: number,
): ConfettiParticle[] {
	const originX = canvasWidth / 2;
	const originY = canvasHeight * 0.85;
	const particles: ConfettiParticle[] = [];
	const spread = Math.PI * 0.75;

	for (let i = 0; i < CONFETTI_COUNT; i++) {
		const angle = -Math.PI / 2 + (Math.random() - 0.5) * spread;
		const speed = 400 + Math.random() * 600;

		particles.push({
			x: originX,
			y: originY,
			vx: Math.cos(angle) * speed,
			vy: Math.sin(angle) * speed,
			gravity: 500 + Math.random() * 500,
			color:
				CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
			size: 4 + Math.random() * 6,
			rotation: Math.random() * Math.PI * 2,
			rotationSpeed: (Math.random() - 0.5) * 10,
		});
	}

	return particles;
}

function updateParticles(particles: ConfettiParticle[], dt: number) {
	for (const particle of particles) {
		particle.vy += particle.gravity * dt;
		particle.x += particle.vx * dt;
		particle.y += particle.vy * dt;
		particle.rotation += particle.rotationSpeed * dt;
	}
}

function renderFrame(
	ctx: CanvasRenderingContext2D,
	img: HTMLImageElement,
	width: number,
	height: number,
	particles: ConfettiParticle[],
) {
	ctx.clearRect(0, 0, width, height);
	ctx.drawImage(img, 0, 0, width, height);

	for (const particle of particles) {
		ctx.save();
		ctx.translate(particle.x, particle.y);
		ctx.rotate(particle.rotation);
		ctx.fillStyle = particle.color;
		ctx.fillRect(
			-particle.size / 2,
			-particle.size / 2,
			particle.size,
			particle.size,
		);
		ctx.restore();
	}
}

function triggerDownload(url: string, filename: string) {
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	link.style.display = "none";
	document.body.appendChild(link);
	link.click();
	link.remove();
}
