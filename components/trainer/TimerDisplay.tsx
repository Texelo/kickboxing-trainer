import React from "react";
import { Surface, Text, useTheme } from "react-native-paper";

function formatTime(timeVal: number) {
	const totalSeconds = Math.floor(timeVal / 100);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	const hundredths = timeVal % 100;
	return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${hundredths.toString().padStart(2, "0")}`;
}

interface Props {
	currentRound: number;
	numRounds: number;
	time: number;
	phase: 'work' | 'rest';
}

export default function TimerDisplay({ currentRound, numRounds, time, phase }: Props) {
	const theme = useTheme();
	return (
		<Surface
			style={{ width: "100%", paddingVertical: 40, alignItems: "center", borderRadius: 20, marginVertical: 20, backgroundColor: phase === 'rest' ? '#4a148c' : theme.colors.elevation.level2 }}
			elevation={4}
		>
			<Text variant="labelLarge" style={{ color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 2 }}>
				Round {currentRound} of {numRounds}
			</Text>
			<Text variant="displayLarge" style={{ fontFamily: "monospace", fontWeight: "bold", fontSize: 60, color: phase === 'rest' ? '#e1bee7' : theme.colors.primary }}>
				{formatTime(time)}
			</Text>
			<Text variant="titleMedium" style={{ color: theme.colors.secondary, textTransform: 'uppercase', fontWeight: '800' }}>
				{phase}
			</Text>
		</Surface>
	);
}
