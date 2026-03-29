import * as Clipboard from "expo-clipboard";
import * as SecureStore from "expo-secure-store";

export async function getValueFor(
	key: string,
	callback: (val: string | null) => void,
) {
	try {
        const result = await SecureStore.getItemAsync(key);
        if (result) {
            callback(result);
        } else {
            console.log("No values stored under that key.");
            callback(null);
        }
    } catch (e) {
        console.error("Error reading from secure store", e);
        callback(null);
    }
}

export async function save(key: string, value: string) {
	try {
        await SecureStore.setItemAsync(key, value);
    } catch (e) {
        console.error("Error writing to secure store", e);
    }
}

export const copyToClipboard = async (value: string) => {
	await Clipboard.setStringAsync(value);
};
