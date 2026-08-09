import { createFileRoute } from "@tanstack/react-router";
import { encode } from "modern-gif";
import workerUrl from "modern-gif/worker?url";
import { useEffect, useId, useRef, useState } from "react";
import { ConfettiSettingsPanel } from "#/components/ConfettiSettingsPanel";
import { DEFAULT_CONFETTI_SETTINGS } from "#/features/confetti/confettiSettings";
import {
	initParticles,
	renderFrame,
	updateParticles,
} from "#/features/confetti/engine";

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

			const settings = DEFAULT_CONFETTI_SETTINGS;
			const particles = initParticles(settings, width, height, 0);
			let burstIndex = 1;
			let nextBurstTime = settings.burstIntervalMs;
			const frames: Array<{ data: ArrayBuffer; delay: number }> = [];
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

					if (burstIndex < settings.burstCount && elapsed >= nextBurstTime) {
						particles.push(
							...initParticles(settings, width, height, nextBurstTime),
						);
						burstIndex += 1;
						nextBurstTime = burstIndex * settings.burstIntervalMs;
					}

					updateParticles(particles, dt, settings, elapsed);
					renderFrame(ctx, img, width, height, particles, settings);

					if (
						captured < GIF_FRAME_COUNT &&
						elapsed >= captured * frameInterval
					) {
						const imageData = ctx.getImageData(0, 0, width, height);
						frames.push({
							data: imageData.data.buffer as ArrayBuffer,
							delay: GIF_FRAME_DELAY,
						});
						captured += 1;
						setProgress(Math.round((captured / GIF_FRAME_COUNT) * 100));
					}

					if (elapsed < GIF_DURATION_MS) {
						rafId = requestAnimationFrame(step);
					} else {
						while (captured < GIF_FRAME_COUNT) {
							renderFrame(ctx, img, width, height, particles, settings);
							const imageData = ctx.getImageData(0, 0, width, height);
							frames.push({
								data: imageData.data.buffer as ArrayBuffer,
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
		<main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 sm:py-12 lg:px-8">
			<div className="mx-auto w-full max-w-2xl">
				<header className="mb-10 text-center">
					<h1 className="mb-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
						<span className="bg-linear-to-r from-indigo-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
							Image to Celebration GIF
						</span>
					</h1>
					<p className="mx-auto max-w-lg text-slate-400">
						Upload an image and we’ll overlay a colorful confetti explosion,
						turning it into a shareable celebration GIF.
					</p>
				</header>

				<section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
					<h2 className="mb-4 text-lg font-semibold text-white">
						1. Upload your image
					</h2>
					<label
						htmlFor={inputId}
						className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 focus-within:ring-offset-slate-950 has-disabled:cursor-not-allowed has-disabled:opacity-60 sm:p-12 ${
							isDragging
								? "border-indigo-500 bg-slate-800"
								: "border-slate-700 bg-slate-800 hover:border-slate-500"
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
						<div className="flex flex-col items-center gap-1">
							<span className="text-lg font-medium">
								Click or drag an image here
							</span>
							<span className="text-sm text-slate-400">
								PNG, JPEG, WebP, or GIF up to 10 MB
							</span>
						</div>
					</label>

					{error && (
						<p
							className="mt-4 rounded-lg bg-red-950 p-3 text-center text-sm text-red-200"
							role="alert"
						>
							{error}
						</p>
					)}
				</section>

				<section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
					<h2 className="mb-4 text-lg font-semibold text-white">2. Preview</h2>
					<div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
						{previewUrl ? (
							<div>
								<img
									src={previewUrl}
									alt={
										selectedFile
											? `Preview of ${selectedFile.name}`
											: "Image preview"
									}
									className="mx-auto max-h-80 w-full rounded-lg object-contain"
								/>
								<p className="mt-3 text-center text-sm text-slate-400">
									{selectedFile?.name}
								</p>
							</div>
						) : (
							<div className="py-12 text-center">
								<p className="text-slate-500">No image selected</p>
								<p className="mt-1 text-sm text-slate-600">
									Upload an image above to preview it here.
								</p>
							</div>
						)}
					</div>
				</section>

				<section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
					<h2 className="mb-4 text-lg font-semibold text-white">
						3. Confetti settings
					</h2>
					<ConfettiSettingsPanel />
				</section>

				<button
					type="button"
					disabled={!selectedFile || isGenerating}
					onClick={handleGenerate}
					className="mt-8 w-full rounded-xl bg-indigo-600 px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
				>
					{isGenerating
						? `Generating... ${progress}%`
						: "Generate Celebration GIF"}
				</button>

				{isGenerating && (
					<div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
						<div className="mb-4 flex items-center gap-3">
							<div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-indigo-500" />
							<p className="font-medium text-white">
								Assembling confetti frames…
							</p>
						</div>
						<div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
							<div
								className="h-full bg-indigo-500 transition-all duration-200"
								style={{ width: `${progress}%` }}
							/>
						</div>
						<p className="mt-2 text-right text-sm text-slate-400">
							{progress}%
						</p>
					</div>
				)}

				{outputUrl && (
					<section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
						<h2 className="mb-4 text-lg font-semibold text-white">
							4. Download your GIF
						</h2>
						<div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
							<img
								src={outputUrl}
								alt="Generated celebration GIF"
								className="mx-auto max-h-80 w-full rounded-lg object-contain"
							/>
						</div>
						<a
							href={outputUrl}
							download="celebration.gif"
							className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
						>
							Download GIF
						</a>
					</section>
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

function triggerDownload(url: string, filename: string) {
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	link.style.display = "none";
	document.body.appendChild(link);
	link.click();
	link.remove();
}
