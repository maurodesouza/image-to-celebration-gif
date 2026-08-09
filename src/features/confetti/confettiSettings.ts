export type ConfettiShape = "square" | "circle";

export interface ConfettiSettings {
	particleCount: number;
	burstCount: number;
	burstIntervalMs: number;
	gifDurationMs: number;
	fallDurationMs: number;
	infiniteFalling: boolean;
	shape: ConfettiShape;
	colors: string[];
	gravity: number;
	speed: number;
	spread: number;
	originX: number;
	originY: number;
	particleSize: number;
}

const DEFAULT_CONFETTI_COLORS = [
	"#ef4444",
	"#f97316",
	"#eab308",
	"#22c55e",
	"#06b6d4",
	"#3b82f6",
	"#8b5cf6",
	"#ec4899",
];

export const DEFAULT_CONFETTI_SETTINGS: ConfettiSettings = {
	particleCount: 120,
	burstCount: 1,
	burstIntervalMs: 300,
	gifDurationMs: 5000,
	fallDurationMs: 5000,
	infiniteFalling: false,
	shape: "square",
	colors: DEFAULT_CONFETTI_COLORS,
	gravity: 750,
	speed: 700,
	spread: Math.PI * 0.75,
	originX: 0.5,
	originY: 0.85,
	particleSize: 6,
};

const STORAGE_KEY = "confetti-settings-v1";

const isPositiveNumber = (value: unknown): value is number =>
	typeof value === "number" && Number.isFinite(value) && value > 0;

const isColorArray = (value: unknown): value is string[] =>
	Array.isArray(value) &&
	value.length > 0 &&
	value.every((item) => typeof item === "string" && item.startsWith("#"));

export function normalizeSettings(
	input: Partial<ConfettiSettings> | null,
): ConfettiSettings {
	const normalized: ConfettiSettings = { ...DEFAULT_CONFETTI_SETTINGS };

	if (!input || typeof input !== "object") {
		return normalized;
	}

	if (isPositiveNumber(input.particleCount)) {
		normalized.particleCount = Math.round(input.particleCount);
	}

	if (
		typeof input.burstCount === "number" &&
		Number.isFinite(input.burstCount)
	) {
		normalized.burstCount = Math.min(
			Math.max(Math.round(input.burstCount), 1),
			3,
		);
	}

	if (isPositiveNumber(input.burstIntervalMs)) {
		normalized.burstIntervalMs = Math.round(input.burstIntervalMs);
	}

	if (isPositiveNumber(input.gifDurationMs)) {
		normalized.gifDurationMs = Math.round(input.gifDurationMs);
	}

	if (isPositiveNumber(input.fallDurationMs)) {
		normalized.fallDurationMs = Math.round(input.fallDurationMs);
	}

	if (typeof input.infiniteFalling === "boolean") {
		normalized.infiniteFalling = input.infiniteFalling;
	}

	if (input.shape === "square" || input.shape === "circle") {
		normalized.shape = input.shape;
	}

	if (isColorArray(input.colors)) {
		normalized.colors = input.colors;
	}

	if (isPositiveNumber(input.gravity)) {
		normalized.gravity = input.gravity;
	}

	if (isPositiveNumber(input.speed)) {
		normalized.speed = input.speed;
	}

	if (isPositiveNumber(input.spread)) {
		normalized.spread = input.spread;
	}

	if (typeof input.originX === "number" && Number.isFinite(input.originX)) {
		normalized.originX = Math.min(Math.max(input.originX, 0), 1);
	}

	if (typeof input.originY === "number" && Number.isFinite(input.originY)) {
		normalized.originY = Math.min(Math.max(input.originY, 0), 1);
	}

	if (isPositiveNumber(input.particleSize)) {
		normalized.particleSize = input.particleSize;
	}

	return normalized;
}

export function loadStoredSettings(): ConfettiSettings {
	if (typeof localStorage === "undefined") {
		return DEFAULT_CONFETTI_SETTINGS;
	}

	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) {
			return DEFAULT_CONFETTI_SETTINGS;
		}

		const parsed = JSON.parse(raw) as Partial<ConfettiSettings>;
		return normalizeSettings(parsed);
	} catch {
		return DEFAULT_CONFETTI_SETTINGS;
	}
}

export function saveStoredSettings(settings: ConfettiSettings): void {
	if (typeof localStorage === "undefined") {
		return;
	}

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
	} catch {
		// Storage may be disabled or full; ignore persistence failures.
	}
}
