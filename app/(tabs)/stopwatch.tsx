import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as Speech from "expo-speech";
import { Button, IconButton, Text, Surface, useTheme } from "react-native-paper";

import { getValueFor } from "../../utils/settings";
import trainer from "../../utils/trainer";
import type { ExerciseGroup } from "../../utils/types";

function formatTime(timeVal: number) {
	const totalSeconds = Math.floor(timeVal / 100); // Because time state updates every 10ms
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	// Calculate hundredths of a second
	const hundredths = timeVal % 100;
	return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${hundredths.toString().padStart(2, "0")}`;
}

export default function TrainerScreen() {
	const theme = useTheme();
	const [time, setTime] = useState(0);
	/* -1 => stopped, 0 => paused, 1 => playing */
	const [status, setStatus] = useState(-1);
	const [groups, setGroups] = useState<Array<ExerciseGroup>>([]);
	const [groupName, setGroupName] = useState<string>();

	const reset = () => setTime(0);
	const handleStart = () => setStatus(1);
	const handlePause = () => setStatus(status === 0 ? 1 : 0);
	const handleStop = () => {
		setStatus(-1);
		Speech.stop();
		reset();
	};

	useEffect(() => {
		let timerID: ReturnType<typeof setInterval>;
		if (status === 1) {
			timerID = setInterval(() => setTime((t) => t + 1), 10); // +1 roughly 10ms
		} else {
			if (status === -1) reset();
		}
		return () => clearInterval(timerID);
	}, [status]);

	const DEFAULT_GROUPS: Array<ExerciseGroup> = [
		{
			id: "default-1",
			name: "🥊 Beginner Combos",
			exercises: [
				{ id: "1", moves: "jab cross", repDelay: 1500 },
				{ id: "2", moves: "jab cross lead hook", repDelay: 2000 },
				{ id: "3", moves: "jab cross rear kick", repDelay: 2500 }
			]
		},
		{
			id: "default-2",
			name: "🥋 Advanced Flow",
			exercises: [
				{ id: "4", moves: "jab cross slip cross hook", repDelay: 3000 },
				{ id: "5", moves: "lead hook cross rear knee", repDelay: 3000 },
				{ id: "6", moves: "jab rear uppercut lead hook rear kick", repDelay: 3500 }
			]
		}
	];

	const loadGroups = () => {
		getValueFor("groups", (val) => {
			let parsed = DEFAULT_GROUPS;
			if (val) {
				try {
					const p = JSON.parse(val);
					if (p && p.length > 0) parsed = p;
				} catch(e) {}
			}
			setGroups(parsed);
			
			if (parsed.length > 0 && !groupName) {
				setGroupName(parsed[0].name);
			}
		});
	};

	useEffect(() => {
		loadGroups();
	}, []);

	const selectedGroup = groups.find((g) => g.name === groupName);

	return (
		<View style={[styles.container, { backgroundColor: theme.colors.background }]}>
			<Surface style={styles.timeSurface} elevation={2}>
				<Text variant="displayLarge" style={{ fontFamily: "monospace", fontWeight: "bold", fontSize: 60, color: theme.colors.primary }}>
					{formatTime(time)}
				</Text>
			</Surface>
			
			<View style={styles.controlsRow}>
				{status !== 1 && (
					<IconButton icon="play-circle" size={60} iconColor={theme.colors.primary} onPress={handleStart} />
				)}
				{status === 1 && (
					<IconButton icon="pause-circle" size={60} iconColor={theme.colors.secondary} onPress={handlePause} />
				)}
				<IconButton icon="stop-circle" size={60} iconColor={theme.colors.error} onPress={handleStop} disabled={status === -1} />
			</View>

			<View style={styles.trainerSetup}>
				<Picker
					selectedValue={groupName}
					onValueChange={setGroupName}
					style={styles.picker}
				>
					{groups.length === 0 && <Picker.Item label="No groups available" value="" />}
					{groups.map((g) => (
						<Picker.Item key={g.id} label={g.name} value={g.name} />
					))}
				</Picker>
				
				<Button 
					mode="contained" 
					icon="bullhorn"
					style={styles.actionButton}
					disabled={!selectedGroup || selectedGroup.exercises.length === 0}
					onPress={() => {
						if (selectedGroup) {
							Speech.stop(); // Stop anything ongoing
							trainer(selectedGroup.exercises);
						}
					}}
				>
					Start AI Callouts
				</Button>

				<Button 
					mode="outlined" 
					icon="sync" 
					style={styles.actionButton}
					onPress={loadGroups}
				>
					Refresh Config
				</Button>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, padding: 20, alignItems: "center", justifyContent: "flex-start"},
	timeSurface: { width: "100%", paddingVertical: 40, alignItems: "center", borderRadius: 20, marginVertical: 20 },
	controlsRow: { flexDirection: "row", justifyContent: "center", width: "100%", gap: 20, marginVertical: 10},
	trainerSetup: { width: "100%", marginTop: 30, gap: 15 },
	picker: { backgroundColor: "rgba(128,128,128,0.1)", borderRadius: 10 },
	actionButton: { paddingVertical: 5 }
});
