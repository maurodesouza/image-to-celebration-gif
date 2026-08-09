import { useEffect, useId, useState } from "react";
import {
	type ConfettiSettings,
	type ConfettiShape,
	DEFAULT_CONFETTI_SETTINGS,
} from "#/features/confetti/confettiSettings";
import { useConfettiSettings } from "#/features/confetti/useConfettiSettings";

const BURST_OPTIONS = [1, 2, 3] as const;

interface ColorEntry {
	id: string;
	value: string;
}

function createColorEntry(value: string): ColorEntry {
	return {
		id: Math.random().toString(36).slice(2),
		value,
	};
}

export function ConfettiSettingsPanel() {
	const { settings, setSettings, resetToDefaults } = useConfettiSettings();
	const groupId = useId();
	const [newColor, setNewColor] = useState("#ffffff");
	const [colorEntries, setColorEntries] = useState<ColorEntry[]>(() =>
		settings.colors.map(createColorEntry),
	);

	useEffect(() => {
		const current = colorEntries.map((entry) => entry.value);
		if (JSON.stringify(current) === JSON.stringify(settings.colors)) {
			return;
		}
		setColorEntries(settings.colors.map(createColorEntry));
	}, [settings.colors, colorEntries]);

	const updateNumber = (
		field: keyof ConfettiSettings,
		min: number,
		max: number,
	) => {
		return (event: React.ChangeEvent<HTMLInputElement>) => {
			let value = event.target.valueAsNumber;
			if (Number.isNaN(value)) {
				return;
			}
			value = Math.min(Math.max(value, min), max);
			setSettings({ [field]: value } as Partial<ConfettiSettings>);
		};
	};

	const updateColor = (index: number, value: string) => {
		const nextEntries = colorEntries.map((entry, i) =>
			i === index ? { ...entry, value } : entry,
		);
		setColorEntries(nextEntries);
		setSettings({ colors: nextEntries.map((entry) => entry.value) });
	};

	const removeColor = (index: number) => {
		if (colorEntries.length <= 1) {
			return;
		}
		const nextEntries = colorEntries.filter((_, i) => i !== index);
		setColorEntries(nextEntries);
		setSettings({ colors: nextEntries.map((entry) => entry.value) });
	};

	const addColor = () => {
		const nextEntries = [...colorEntries, createColorEntry(newColor)];
		setColorEntries(nextEntries);
		setSettings({ colors: nextEntries.map((entry) => entry.value) });
	};

	const resetColors = () => {
		setSettings({ colors: [...DEFAULT_CONFETTI_SETTINGS.colors] });
	};

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				<NumberField
					id={`${groupId}-particleCount`}
					label="Particle count"
					value={settings.particleCount}
					min={1}
					max={1000}
					onChange={updateNumber("particleCount", 1, 1000)}
				/>

				<div className="space-y-2">
					<span
						id={`${groupId}-burstCount`}
						className="block text-sm font-medium text-slate-300"
					>
						Burst count
					</span>
					<div
						className="flex flex-wrap gap-4"
						role="radiogroup"
						aria-labelledby={`${groupId}-burstCount`}
					>
						{BURST_OPTIONS.map((option) => (
							<label
								key={option}
								className="flex items-center gap-2 text-slate-300 has-checked:text-indigo-400"
							>
								<input
									type="radio"
									name={`${groupId}-burstCount`}
									value={option}
									checked={settings.burstCount === option}
									onChange={() => setSettings({ burstCount: option })}
									className="h-4 w-4 accent-indigo-500"
								/>
								{option}
							</label>
						))}
					</div>
				</div>

				<NumberField
					id={`${groupId}-burstIntervalMs`}
					label="Burst interval (ms)"
					value={settings.burstIntervalMs}
					min={1}
					max={5000}
					onChange={updateNumber("burstIntervalMs", 1, 5000)}
				/>

				<NumberField
					id={`${groupId}-gifDurationMs`}
					label="GIF duration (ms)"
					value={settings.gifDurationMs}
					min={1}
					max={30000}
					onChange={updateNumber("gifDurationMs", 1, 30000)}
				/>

				<NumberField
					id={`${groupId}-fallDurationMs`}
					label="Fall duration (ms)"
					value={settings.fallDurationMs}
					min={1}
					max={30000}
					onChange={updateNumber("fallDurationMs", 1, 30000)}
				/>

				<div className="flex items-center gap-2">
					<input
						id={`${groupId}-infiniteFalling`}
						type="checkbox"
						checked={settings.infiniteFalling}
						onChange={(event) =>
							setSettings({ infiniteFalling: event.target.checked })
						}
						className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-indigo-600 accent-indigo-500 focus:ring-indigo-500"
					/>
					<label
						htmlFor={`${groupId}-infiniteFalling`}
						className="text-sm font-medium text-slate-300"
					>
						Infinite falling
					</label>
				</div>

				<div className="space-y-2">
					<label
						htmlFor={`${groupId}-shape`}
						className="block text-sm font-medium text-slate-300"
					>
						Shape
					</label>
					<select
						id={`${groupId}-shape`}
						value={settings.shape}
						onChange={(event) =>
							setSettings({ shape: event.target.value as ConfettiShape })
						}
						className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
					>
						<option value="square">Square</option>
						<option value="circle">Circle</option>
					</select>
				</div>

				<RangeField
					id={`${groupId}-gravity`}
					label="Gravity"
					value={settings.gravity}
					min={1}
					max={5000}
					onChange={updateNumber("gravity", 1, 5000)}
				/>

				<RangeField
					id={`${groupId}-speed`}
					label="Speed"
					value={settings.speed}
					min={1}
					max={5000}
					onChange={updateNumber("speed", 1, 5000)}
				/>

				<RangeField
					id={`${groupId}-spread`}
					label="Spread (radians)"
					value={settings.spread}
					min={0}
					max={Math.PI}
					step={0.01}
					onChange={updateNumber("spread", 0, Math.PI)}
					formatValue={(value) => value.toFixed(2)}
				/>

				<NumberField
					id={`${groupId}-particleSize`}
					label="Particle size"
					value={settings.particleSize}
					min={1}
					max={50}
					onChange={updateNumber("particleSize", 1, 50)}
				/>

				<RangeField
					id={`${groupId}-originX`}
					label="Origin X"
					value={settings.originX}
					min={0}
					max={1}
					step={0.01}
					onChange={updateNumber("originX", 0, 1)}
					formatValue={(value) => `${Math.round(value * 100)}%`}
				/>

				<RangeField
					id={`${groupId}-originY`}
					label="Origin Y"
					value={settings.originY}
					min={0}
					max={1}
					step={0.01}
					onChange={updateNumber("originY", 0, 1)}
					formatValue={(value) => `${Math.round(value * 100)}%`}
				/>
			</div>

			<div className="space-y-2 md:col-span-2">
				<span className="block text-sm font-medium text-slate-300">Colors</span>
				<div className="flex flex-wrap items-center gap-2">
					{colorEntries.map((entry, index) => (
						<div
							key={entry.id}
							className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 p-1"
						>
							<input
								type="color"
								value={entry.value}
								onChange={(event) => updateColor(index, event.target.value)}
								aria-label={`Color ${index + 1}`}
								className="h-8 w-8 cursor-pointer appearance-none rounded border-0 bg-transparent p-0"
							/>
							<button
								type="button"
								onClick={() => removeColor(index)}
								disabled={colorEntries.length <= 1}
								aria-label={`Remove color ${index + 1}`}
								className="h-6 w-6 rounded text-slate-400 hover:bg-slate-800 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
							>
								&times;
							</button>
						</div>
					))}
					<div className="flex items-center gap-2">
						<input
							type="color"
							value={newColor}
							onChange={(event) => setNewColor(event.target.value)}
							aria-label="New color"
							className="h-8 w-8 cursor-pointer appearance-none rounded border-0 bg-transparent p-0"
						/>
						<button
							type="button"
							onClick={addColor}
							className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700"
						>
							Add
						</button>
						<button
							type="button"
							onClick={resetColors}
							className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700"
						>
							Reset
						</button>
					</div>
				</div>
			</div>

			<button
				type="button"
				onClick={resetToDefaults}
				className="w-full rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
			>
				Reset to defaults
			</button>
		</div>
	);
}

interface NumberFieldProps {
	id: string;
	label: string;
	value: number;
	min: number;
	max: number;
	onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

function NumberField({
	id,
	label,
	value,
	min,
	max,
	onChange,
}: NumberFieldProps) {
	return (
		<div className="space-y-2">
			<label htmlFor={id} className="block text-sm font-medium text-slate-300">
				{label}
			</label>
			<input
				id={id}
				type="number"
				inputMode="decimal"
				min={min}
				max={max}
				value={value}
				onChange={onChange}
				className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
			/>
		</div>
	);
}

interface RangeFieldProps {
	id: string;
	label: string;
	value: number;
	min: number;
	max: number;
	step?: number;
	onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
	formatValue?: (value: number) => string;
}

function RangeField({
	id,
	label,
	value,
	min,
	max,
	step,
	onChange,
	formatValue,
}: RangeFieldProps) {
	return (
		<div className="space-y-2">
			<label htmlFor={id} className="block text-sm font-medium text-slate-300">
				{label}
			</label>
			<div className="flex items-center gap-4">
				<input
					id={id}
					type="range"
					min={min}
					max={max}
					step={step ?? 1}
					value={value}
					onChange={onChange}
					className="w-full accent-indigo-500"
				/>
				<span className="min-w-[3ch] text-right text-sm text-slate-400">
					{formatValue ? formatValue(value) : value}
				</span>
			</div>
		</div>
	);
}
