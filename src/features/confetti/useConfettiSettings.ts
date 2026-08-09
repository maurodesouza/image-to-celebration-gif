import { useCallback, useSyncExternalStore } from "react";
import {
	type ConfettiSettings,
	DEFAULT_CONFETTI_SETTINGS,
	loadStoredSettings,
	normalizeSettings,
	saveStoredSettings,
} from "./confettiSettings";

export interface UseConfettiSettingsReturn {
	settings: ConfettiSettings;
	setSettings: (partial: Partial<ConfettiSettings>) => void;
	resetToDefaults: () => void;
}

type Listener = () => void;

const listeners = new Set<Listener>();
let settingsStore = loadStoredSettings();

function notify() {
	for (const listener of listeners) {
		listener();
	}
}

function updateSettingsStore(partial: Partial<ConfettiSettings>) {
	settingsStore = normalizeSettings({ ...settingsStore, ...partial });
	saveStoredSettings(settingsStore);
	notify();
}

function resetSettingsStore() {
	settingsStore = { ...DEFAULT_CONFETTI_SETTINGS };
	saveStoredSettings(settingsStore);
	notify();
}

export function useConfettiSettings(): UseConfettiSettingsReturn {
	const settings = useSyncExternalStore(
		(callback) => {
			listeners.add(callback);
			return () => {
				listeners.delete(callback);
			};
		},
		() => settingsStore,
		() => DEFAULT_CONFETTI_SETTINGS,
	);

	const setSettings = useCallback((partial: Partial<ConfettiSettings>) => {
		updateSettingsStore(partial);
	}, []);

	const resetToDefaults = useCallback(() => {
		resetSettingsStore();
	}, []);

	return { settings, setSettings, resetToDefaults };
}
