import React from "react";
import { View } from "react-native";
import { IconButton, useTheme } from "react-native-paper";

interface Props {
	status: number;
	canStart: boolean;
	onStart: () => void;
	onPause: () => void;
	onStop: () => void;
	onSkip: () => void;
	onRewind: () => void;
}

export default function TrainerControls({ status, canStart, onStart, onPause, onStop, onSkip, onRewind }: Props) {
	const theme = useTheme();
	return (
		<View style={{ flexDirection: "row", justifyContent: "center", width: "100%", gap: 20, marginVertical: 10 }}>
			<IconButton icon="skip-previous" size={40} iconColor={theme.colors.secondary} onPress={onRewind} disabled={status === -1} />
			{status !== 1 ? (
				<IconButton icon="play-circle" size={60} iconColor={theme.colors.primary} disabled={!canStart} onPress={onStart} />
			) : (
				<IconButton icon="pause-circle" size={60} iconColor={theme.colors.secondary} onPress={onPause} />
			)}
			<IconButton icon="stop-circle" size={60} iconColor={theme.colors.error} onPress={onStop} disabled={status === -1} />
			<IconButton icon="skip-next" size={40} iconColor={theme.colors.secondary} onPress={onSkip} disabled={status === -1} />
		</View>
	);
}
