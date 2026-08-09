import type { ConfettiSettings } from "./confettiSettings";

export interface ConfettiParticle {
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

const BURST_TIME_TOLERANCE_MS = 1;

function createBurst(
	settings: ConfettiSettings,
	canvasWidth: number,
	canvasHeight: number,
): ConfettiParticle[] {
	const originX = canvasWidth * settings.originX;
	const originY = canvasHeight * settings.originY;
	const particles: ConfettiParticle[] = [];

	for (let i = 0; i < settings.particleCount; i++) {
		const angle = -Math.PI / 2 + (Math.random() - 0.5) * settings.spread;
		const speed = settings.speed * (0.5 + Math.random());
		const gravity = settings.gravity * (0.5 + Math.random());
		const size = settings.particleSize * (0.5 + Math.random());

		particles.push({
			x: originX,
			y: originY,
			vx: Math.cos(angle) * speed,
			vy: Math.sin(angle) * speed,
			gravity,
			color:
				settings.colors[Math.floor(Math.random() * settings.colors.length)],
			size,
			rotation: Math.random() * Math.PI * 2,
			rotationSpeed: (Math.random() - 0.5) * 10,
		});
	}

	return particles;
}

function isBurstMoment(settings: ConfettiSettings, time: number): boolean {
	if (time < 0) {
		return false;
	}

	for (let i = 0; i < settings.burstCount; i++) {
		const burstTime = i * settings.burstIntervalMs;
		if (Math.abs(time - burstTime) <= BURST_TIME_TOLERANCE_MS) {
			return true;
		}
	}

	return false;
}

export function initParticles(
	settings: ConfettiSettings,
	canvasWidth: number,
	canvasHeight: number,
	time: number,
): ConfettiParticle[] {
	if (!isBurstMoment(settings, time)) {
		return [];
	}

	return createBurst(settings, canvasWidth, canvasHeight);
}

export function updateParticles(
	particles: ConfettiParticle[],
	dt: number,
	settings: ConfettiSettings,
	time: number,
) {
	if (dt <= 0 || settings.particleCount <= 0 || time < 0) {
		return;
	}

	for (const particle of particles) {
		particle.vy += particle.gravity * dt;
		particle.x += particle.vx * dt;
		particle.y += particle.vy * dt;
		particle.rotation += particle.rotationSpeed * dt;
	}
}

export function renderFrame(
	ctx: CanvasRenderingContext2D,
	image: CanvasImageSource,
	width: number,
	height: number,
	particles: ConfettiParticle[],
	settings: ConfettiSettings,
) {
	ctx.clearRect(0, 0, width, height);
	ctx.drawImage(image, 0, 0, width, height);

	for (const particle of particles) {
		ctx.save();
		ctx.translate(particle.x, particle.y);
		ctx.rotate(particle.rotation);
		ctx.fillStyle = particle.color;

		if (settings.shape === "circle") {
			ctx.beginPath();
			ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
			ctx.fill();
		} else {
			ctx.fillRect(
				-particle.size / 2,
				-particle.size / 2,
				particle.size,
				particle.size,
			);
		}

		ctx.restore();
	}
}
