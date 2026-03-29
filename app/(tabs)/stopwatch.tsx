import React, { useEffect, useState, useRef } from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import * as Speech from "expo-speech";
import { Button, IconButton, Text, Surface, useTheme, Chip } from "react-native-paper";

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
	const [isCountdown, setIsCountdown] = useState(false);
	
	const trainerRef = useRef<any>(null); // holds TrainerControls

	const reset = () => {
		setTime(0);
		setIsCountdown(false);
	};

	const handleStart = () => {
		if (status === 0) {
			// Resuming
			if (trainerRef.current) trainerRef.current.resume();
			setStatus(1);
		} else if (selectedGroup) {
			// Starting fresh
			if (trainerRef.current) trainerRef.current.stop();
			trainerRef.current = trainer(selectedGroup.exercises);
			reset();
			setStatus(1);
		}
	};

	const handlePause = () => {
		setStatus(0);
		if (trainerRef.current) trainerRef.current.pause();
	};

	const handleStop = () => {
		setStatus(-1);
		if (trainerRef.current) {
			trainerRef.current.stop();
			trainerRef.current = null;
		}
		Speech.stop();
		reset();
	};

	const startRest = (seconds: number) => {
		handleStop(); // Automatically clear everything
		setTime(seconds * 100);
		setIsCountdown(true);
		setStatus(1); // Play
	};

	useEffect(() => {
		let timerID: ReturnType<typeof setInterval>;
		if (status === 1) {
			timerID = setInterval(() => {
				setTime((t) => {
					if (isCountdown) {
						if (t <= 1) {
							Speech.speak("Rest is over, let's get back to work!");
							setStatus(0); // Pause automatically
							setIsCountdown(false);
							return 0;
						}
						return t - 1;
					}
					return t + 1;
				});
			}, 10); // 10ms
		} else if (status === -1) {
			reset();
		}
		return () => clearInterval(timerID);
	}, [status, isCountdown]);

	const DEFAULT_GROUPS: Array<ExerciseGroup> = [
		{
			id: "default-1",
			name: "🥊 Beginner Combos",
			exercises: [
				{ id: "1", moves: ["jab", "cross"], repDelay: 1500 },
				{ id: "2", moves: ["jab", "cross", "lead hook"], repDelay: 2000 },
				{ id: "3", moves: ["jab", "cross", "rear kick"], repDelay: 2500 }
			]
		},
		{
			id: "default-2",
			name: "🥋 Advanced Flow",
			exercises: [
				{ id: "4", moves: ["jab", "cross", "slip", "cross", "hook"], repDelay: 3000 },
				{ id: "5", moves: ["lead hook", "cross", "rear knee"], repDelay: 3000 },
				{ id: "6", moves: ["jab", "rear uppercut", "lead hook", "rear kick"], repDelay: 3500 }
			]
		}
	];

	const loadGroups = () => {
		getValueFor("groups", (val) => {
			let parsed = DEFAULT_GROUPS;
			if (val) {
				try {
					const p = JSON.parse(val);
					if (p && p.length > 0) {
						// Normalize backwards compatibility of old strings
						parsed = p.map((g: any) => ({
							...g,
							exercises: g.exercises.map((ex: any) => ({
								...ex,
								moves: Array.isArray(ex.moves) ? ex.moves : (ex.moves ? ex.moves.split(" ") : [])
							}))
						}));
					}
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
					<IconButton 
						icon="play-circle" 
						size={60} 
						iconColor={theme.colors.primary} 
						disabled={!selectedGroup || selectedGroup.exercises.length === 0}
						onPress={handleStart}
					/>
				)}
				{status === 1 && (
					<IconButton icon="pause-circle" size={60} iconColor={theme.colors.secondary} onPress={handlePause} />
				)}
				<IconButton icon="stop-circle" size={60} iconColor={theme.colors.error} onPress={handleStop} disabled={status === -1} />
			</View>

			<View style={{ flexDirection: 'row', gap: 15, justifyContent: 'center' }}>
				<Button mode="contained-tonal" icon="timer" onPress={() => startRest(30)}>30s Rest</Button>
				<Button mode="contained-tonal" icon="timer" onPress={() => startRest(60)}>60s Rest</Button>
			</View>

			<View style={styles.trainerSetup}>
				<Text variant="titleSmall" style={{ alignSelf: 'center', marginBottom: 10, color: theme.colors.outline }}>Select Training Sequence</Text>
				<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 15, marginBottom: 20 }}>
					{groups.length === 0 && <Chip icon="alert">No groups available</Chip>}
					{groups.map((g) => (
						<Chip
							key={g.id}
							mode={groupName === g.name ? "flat" : "outlined"}
							selected={groupName === g.name}
							onPress={() => setGroupName(g.name)}
							style={groupName === g.name ? { backgroundColor: theme.colors.primaryContainer } : { backgroundColor: theme.colors.elevation.level1 }}
						>
							{g.name}
						</Chip>
					))}
				</ScrollView>

				{selectedGroup && selectedGroup.exercises.length > 0 && (
					<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 15, marginBottom: 20, justifyContent: 'center' }}>
						{selectedGroup.exercises.map(ex => (
							<Chip key={ex.id} compact style={{ backgroundColor: theme.colors.elevation.level2 }} textStyle={{ fontSize: 13, color: theme.colors.secondary }}>
								{ex.moves.join(" • ")}
							</Chip>
						))}
					</View>
				)}
				
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
