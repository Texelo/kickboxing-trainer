import * as Clipboard from "expo-clipboard";
import * as SecureStore from "expo-secure-store";
import { Platform } from 'react-native';

export async function getValueFor(
	key: string,
	callback: (val: string | null) => void,
) {
	try {
        let result: string | null = null;
        if (Platform.OS === 'web') {
            result = localStorage.getItem(key);
        } else {
            result = await SecureStore.getItemAsync(key);
        }

        if (result) {
            callback(result);
        } else {
            callback(null);
        }
    } catch (e) {
        console.error("Error reading storage", e);
        callback(null);
    }
}

export async function save(key: string, value: string) {
	try {
        if (Platform.OS === 'web') {
            localStorage.setItem(key, value);
        } else {
            await SecureStore.setItemAsync(key, value);
        }
    } catch (e) {
        console.error("Error writing storage", e);
    }
}

export const copyToClipboard = async (value: string) => {
	await Clipboard.setStringAsync(value);
};
