import * as Clipboard from "expo-clipboard";
import * as FileSystem from "expo-file-system";
import * as SecureStore from "expo-secure-store";
import * as Sharing from "expo-sharing";

const cacheDir = FileSystem.cacheDirectory;

export async function getValueFor(
	key: string,
	callback: (val: string) => void,
) {
	const result = await SecureStore.getItemAsync(key);
	if (result) {
		//const resultObj = JSON.parse(result);
		console.log("🔐 Here's your value 🔐");
		console.log(result);
		callback(result);
	} else {
		console.log("No values stored under that key.");
	}
}

export async function save(key: string, value: string) {
	console.log(`set ${key} to ${value}`);
	await SecureStore.setItemAsync(key, value);
}

const getFileUri = (fileName: string, extension: string) =>
	`${cacheDir}${fileName}`;

export async function share(data: string) {
	const uri = getFileUri("trainer", "txt");
	await FileSystem.writeAsStringAsync(uri, data, {
		encoding: FileSystem.EncodingType.UTF8,
	});
	//const read = await FileSystem.readAsStringAsync(uri)

	//console.log(read)
	Sharing.shareAsync(uri);
	//Share.open({
	//	title: "trainer config",
	//	subject: "trainer config",
	//	message: `${message}`,
	//});
}

export const copyToClipboard = async (value: string) => {
	await Clipboard.setStringAsync(value);
};
