import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Alert, Platform } from "react-native";
import type { ExerciseGroup } from "./types";

const MOVE_ENCODING: Record<string, string> = {
	"jab": "j",
	"cross": "c",
	"left hook": "lh",
	"right hook": "rh",
	"left uppercut": "lu",
	"right uppercut": "ru",
	"lead knee": "lk",
	"rear knee": "rk",
	"lead roundhouse": "lr",
	"rear roundhouse": "rr",
	"lead side kick": "ls",
	"rear side kick": "rs",
	"lead push kick": "lp",
	"rear push kick": "rp",
	"slip": "s",
	"roll": "ro",
	"left elbow": "le",
	"right elbow": "re"
};

const MOVE_DECODING: Record<string, string> = Object.entries(MOVE_ENCODING).reduce((acc, [k, v]) => ({ ...acc, [v]: k }), {});

export function encodeGroup(group: ExerciseGroup): string {
	const minified = {
		n: group.name,
		e: group.exercises.map(ex => ({
			m: ex.moves.map(m => MOVE_ENCODING[m.toLowerCase()] || m).join(","),
			d: ex.repDelay
		}))
	};
	return JSON.stringify(minified);
}

export function decodeGroup(encoded: string): Partial<ExerciseGroup> {
	try {
		const parsed = JSON.parse(encoded);
		if (!parsed.n || !parsed.e) throw new Error("Invalid format");
		
		return {
			name: parsed.n,
			exercises: parsed.e.map((ex: any, idx: number) => ({
				id: `imported-${idx}-${Date.now()}`,
				moves: ex.m.split(",").map((m: string) => MOVE_DECODING[m] || m),
				repDelay: ex.d
			}))
		};
	} catch (e) {
		console.error("Decode error", e);
		throw new Error("Failed to decode training sequence");
	}
}

export async function shareBackupFile(groups: ExerciseGroup[], movePool: string[], enabledMoves: string[]) {
	const backupData = {
		version: 1,
		timestamp: new Date().toISOString(),
		groups,
		movePool,
		enabledMoves
	};

	const fileName = `kickboxing-backup-${new Date().toISOString().split('T')[0]}.kbx`;
	const fileUri = `${FileSystem.documentDirectory}${fileName}`;

	try {
		if (Platform.OS === 'web') {
			// Web doesn't support expo-sharing in the same way
			const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = fileName;
			a.click();
			URL.revokeObjectURL(url);
		} else {
			await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(backupData, null, 2));
			await Sharing.shareAsync(fileUri, {
				mimeType: 'application/json',
				dialogTitle: 'Share Workout Backup',
				UTI: 'public.json'
			});
		}
	} catch (e) {
		Alert.alert("Error", "Failed to create or share backup file");
		console.error(e);
	}
}

export async function importBackupFile(): Promise<{ groups: ExerciseGroup[], movePool: string[], enabledMoves: string[] } | null> {
	try {
		const result = await DocumentPicker.getDocumentAsync({
			type: 'application/json',
			copyToCacheDirectory: true
		});

		if (result.canceled || !result.assets || result.assets.length === 0) return null;

		const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
		const data = JSON.parse(fileContent);

		if (!data.groups || !Array.isArray(data.groups)) {
			throw new Error("Invalid backup file format");
		}

		return {
			groups: data.groups,
			movePool: data.movePool || [],
			enabledMoves: data.enabledMoves || []
		};
	} catch (e) {
		Alert.alert("Error", "Failed to import backup file. Ensure it is a valid kickboxing-trainer backup.");
		console.error(e);
		return null;
	}
}
