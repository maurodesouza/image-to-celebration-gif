import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useId, useRef, useState } from "react";

export const Route = createFileRoute("/")({
	component: Home,
});

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function Home() {
	const inputId = useId();
	const dragCounter = useRef(0);

	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isDragging, setIsDragging] = useState(false);

	useEffect(() => {
		if (!selectedFile) {
			setPreviewUrl(null);
			return;
		}

		const url = URL.createObjectURL(selectedFile);
		setPreviewUrl(url);

		return () => URL.revokeObjectURL(url);
	}, [selectedFile]);

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
					disabled={!selectedFile}
					className="mt-8 w-full rounded-xl bg-blue-600 px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
				>
					Generate Celebration GIF
				</button>
			</div>
		</main>
	);
}
