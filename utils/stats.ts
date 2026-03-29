import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export interface WorkoutSession {
    date: string; // ISO string
    duration: number; // seconds
    rounds: number;
    group: string;
}

const STORAGE_KEY = 'workout_stats';

export async function saveWorkout(session: WorkoutSession) {
    try {
        let existing: string | null = null;
        if (Platform.OS === 'web') {
            existing = localStorage.getItem(STORAGE_KEY);
        } else {
            existing = await SecureStore.getItemAsync(STORAGE_KEY);
        }

        const stats: WorkoutSession[] = existing ? JSON.parse(existing) : [];
        stats.push(session);
        // Keep last 100 sessions to avoid overflow
        const trimmed = stats.slice(-100);
        const value = JSON.stringify(trimmed);

        if (Platform.OS === 'web') {
            localStorage.setItem(STORAGE_KEY, value);
        } else {
            await SecureStore.setItemAsync(STORAGE_KEY, value);
        }
    } catch (e) {
        console.error("Failed to save stats", e);
    }
}

export async function getWorkouts(): Promise<WorkoutSession[]> {
    try {
        let existing: string | null = null;
        if (Platform.OS === 'web') {
            existing = localStorage.getItem(STORAGE_KEY);
        } else {
            existing = await SecureStore.getItemAsync(STORAGE_KEY);
        }
        return existing ? JSON.parse(existing) : [];
    } catch (e) {
        return [];
    }
}

export async function clearStats() {
    if (Platform.OS === 'web') {
        localStorage.removeItem(STORAGE_KEY);
    } else {
        await SecureStore.deleteItemAsync(STORAGE_KEY);
    }
}
