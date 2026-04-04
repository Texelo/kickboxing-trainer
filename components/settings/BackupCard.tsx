import React from "react";
import { View } from "react-native";
import { Button, Card, Divider, IconButton, Text, TextInput, useTheme } from "react-native-paper";

interface Props {
	importData: string;
	onImportDataChange: (v: string) => void;
	onFullBackup: () => void;
	onFullImport: () => void;
	onPasteImport: () => void;
	onClearAll: () => void;
}

export default function BackupCard({ importData, onImportDataChange, onFullBackup, onFullImport, onPasteImport, onClearAll }: Props) {
	const theme = useTheme();
	return (
		<Card mode="elevated" style={{ backgroundColor: theme.colors.elevation.level1 }}>
			<Card.Title
				title="Backup & Restore"
				subtitle="Share sequences or your whole library"
				left={(props) => <IconButton {...props} icon="cloud-sync" />}
			/>
			<Card.Content>
				<View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
					<Button compact mode="contained" icon="share-variant" onPress={onFullBackup} style={{ flex: 1 }}>Full Backup</Button>
					<Button compact mode="outlined" icon="file-import" onPress={onFullImport} style={{ flex: 1 }}>Import File</Button>
				</View>
				<Divider style={{ marginBottom: 20 }} />
				<Text variant="titleSmall" style={{ marginBottom: 10 }}>Import from Clipboard</Text>
				<TextInput
					label="Paste Code/JSON here"
					value={importData}
					onChangeText={onImportDataChange}
					mode="outlined"
					multiline
					style={{ marginBottom: 10, backgroundColor: 'transparent', height: 80, fontSize: 12 }}
				/>
				<View style={{ flexDirection: 'row', gap: 10 }}>
					<Button mode="contained-tonal" icon="clipboard-arrow-down" onPress={onPasteImport} style={{ flex: 1 }}>Import Pasted</Button>
					<Button mode="text" icon="delete-sweep" textColor={theme.colors.error} onPress={onClearAll}>Clear All</Button>
				</View>
			</Card.Content>
		</Card>
	);
}
