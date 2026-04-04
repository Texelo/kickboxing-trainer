import { Picker } from "@react-native-picker/picker";
import * as Speech from "expo-speech";
import React from "react";
import { View } from "react-native";
import { Button, Card, IconButton, useTheme } from "react-native-paper";
import { save } from "../../utils/settings";

interface Props {
	voices: Speech.Voice[];
	selectedVoice: string;
	onVoiceChange: (voice: string) => void;
}

export default function VoiceSelector({ voices, selectedVoice, onVoiceChange }: Props) {
	const theme = useTheme();
	return (
		<Card style={{ backgroundColor: theme.colors.elevation.level2, marginTop: 10, borderRadius: 12, overflow: 'hidden' }}>
			<Card.Title title="Voice Selection" subtitle="Choose your trainer's voice" left={(props) => <IconButton {...props} icon="account-voice" />} />
			<Card.Content>
				<View style={{ borderRadius: 10, overflow: 'hidden', backgroundColor: theme.colors.elevation.level3, marginBottom: 10 }}>
					<Picker
						selectedValue={selectedVoice}
						onValueChange={(val) => {
							onVoiceChange(val);
							save("selectedVoice", val);
						}}
						style={{ color: theme.colors.onSurface }}
						dropdownIconColor={theme.colors.onSurface}
					>
						<Picker.Item label="System Default Voice" value="" />
						{voices.map((v) => (
							<Picker.Item key={v.identifier} label={`${v.name} (${v.language})`} value={v.identifier} />
						))}
					</Picker>
				</View>
				<Button mode="outlined" icon="volume-high" onPress={() => Speech.speak("Ready to train!", { voice: selectedVoice })}>Test Voice</Button>
			</Card.Content>
		</Card>
	);
}
