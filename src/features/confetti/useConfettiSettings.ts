import { useCallback, useState } from "react";
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

export function useConfettiSettings(): UseConfettiSettingsReturn {
	const [settings, setInternalSettings] = useState<ConfettiSettings>(() =>
		loadStoredSettings(),
	);

	const setSettings = useCallback((partial: Partial<ConfettiSettings>) => {
		setInternalSettings((current) => {
			const next = normalizeSettings({ ...current, ...partial });
			saveStoredSettings(next);
			return next;
		});
	}, []);

	const resetToDefaults = useCallback(() => {
		saveStoredSettings(DEFAULT_CONFETTI_SETTINGS);
		setInternalSettings(DEFAULT_CONFETTI_SETTINGS);
	}, []);

	return { settings, setSettings, resetToDefaults };
}
