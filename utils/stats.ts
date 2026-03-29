import * as SecureStore from 'expo-secure-store';

export interface WorkoutSession {
    date: string; // ISO string
    duration: number; // seconds
    rounds: number;
    group: string;
}

const STORAGE_KEY = 'workout_stats';

export async function saveWorkout(session: WorkoutSession) {
    try {
        const existing = await SecureStore.getItemAsync(STORAGE_KEY);
        const stats: WorkoutSession[] = existing ? JSON.parse(existing) : [];
        stats.push(session);
        // Keep last 100 sessions to avoid overflow
        const trimmed = stats.slice(-100);
        await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(trimmed));
    } catch (e) {
        console.error("Failed to save stats", e);
    }
}

export async function getWorkouts(): Promise<WorkoutSession[]> {
    try {
        const existing = await SecureStore.getItemAsync(STORAGE_KEY);
        return existing ? JSON.parse(existing) : [];
    } catch (e) {
        return [];
    }
}

export async function clearStats() {
    await SecureStore.deleteItemAsync(STORAGE_KEY);
}
