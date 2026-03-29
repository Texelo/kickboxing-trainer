import React, { useEffect, useState, useRef } from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import * as Speech from "expo-speech";
import { Button, IconButton, Text, Surface, useTheme, Chip, Card, Divider } from "react-native-paper";
import Slider from "@react-native-community/slider";
import { useFocusEffect } from "expo-router";

import { getValueFor } from "../../utils/settings";
import trainer from "../../utils/trainer";
import { saveWorkout } from "../../utils/stats";
import type { ExerciseGroup } from "../../utils/types";

function formatTime(timeVal: number) {
	const totalSeconds = Math.floor(timeVal / 100); 
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	const hundredths = timeVal % 100;
	return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${hundredths.toString().padStart(2, "0")}`;
}

export default function TrainerScreen() {
	const theme = useTheme();
	const [time, setTime] = useState(0);
	const [status, setStatus] = useState(-1);
	const [groups, setGroups] = useState<Array<ExerciseGroup>>([]);
	const [groupName, setGroupName] = useState<string>();
	const [activeVoice, setActiveVoice] = useState<string>();
	const [isCountdown, setIsCountdown] = useState(false);
	const [isShuffle, setIsShuffle] = useState(false);
	const [intensity, setIntensity] = useState(1);
	const [numRounds, setNumRounds] = useState(3);
	const [workMins, setWorkMins] = useState(3);
	const [restSecs, setRestSecs] = useState(60);
	const [currentRound, setCurrentRound] = useState(1);
	const [phase, setPhase] = useState<'work' | 'rest'>('work');
	
	const trainerRef = useRef<any>(null); 
	const statusRef = useRef(status);
	const totalDurationRef = useRef(0);
	useEffect(() => { statusRef.current = status; }, [status]);

	const selectedGroup = groups.find((g) => g.name === groupName);

	const reset = () => {
		setTime(0);
		setIsCountdown(false);
		setCurrentRound(1);
		setPhase('work');
		totalDurationRef.current = 0;
	};

	const handleStart = () => {
		if (status === 0) {
			if (trainerRef.current) trainerRef.current.resume();
			setStatus(1);
		} else if (selectedGroup) {
			if (trainerRef.current) trainerRef.current.stop();
			
			let targetExercises = selectedGroup.exercises;
			if (isShuffle) {
				targetExercises = [...targetExercises].sort(() => Math.random() - 0.5);
			}

			trainerRef.current = trainer(targetExercises, activeVoice, intensity, false);
			reset();
			setTime(workMins * 60 * 100);
			setIsCountdown(true);
			setStatus(1);

			Speech.stop();
			Speech.speak("Round 1", {
				voice: activeVoice,
				onDone: () => {
					setTimeout(() => {
						if (statusRef.current === 1 && trainerRef.current) {
							trainerRef.current.restart();
							trainerRef.current.resume();
						}
					}, 1000);
				}
			});
		}
	};

	const handlePause = () => {
		setStatus(0);
		if (trainerRef.current) trainerRef.current.pause();
	};

	const handleStop = () => {
		if (status !== -1 && totalDurationRef.current > 50) { 
			saveWorkout({
				date: new Date().toISOString(),
				duration: Math.floor(totalDurationRef.current / 100),
				rounds: currentRound,
				group: selectedGroup?.name || "Freestyle"
			});
		}
		setStatus(-1);
		if (trainerRef.current) {
			trainerRef.current.stop();
			trainerRef.current = null;
		}
		Speech.stop();
		reset();
	};

	const handleSkip = () => {
		if (trainerRef.current) trainerRef.current.skip();
	};

	const handleRewind = () => {
		if (trainerRef.current) trainerRef.current.rewind();
	};

	const startRest = (seconds: number) => {
		handleStop(); 
		setTime(seconds * 100);
		setIsCountdown(true);
		setStatus(1); 
	};

	useEffect(() => {
		let timerID: ReturnType<typeof setInterval>;
		if (status === 1) {
			timerID = setInterval(() => {
				setTime((t) => (isCountdown ? (t > 0 ? t - 1 : 0) : t + 1));
				totalDurationRef.current += 1;
			}, 10); 
		} else if (status === -1) {
			reset();
		}
		return () => clearInterval(timerID);
	}, [status, isCountdown]);

	useEffect(() => {
		if (status === 1 && isCountdown && time === 0 && totalDurationRef.current > 0) {
			if (phase === 'work') {
				if (currentRound >= numRounds) {
					if (trainerRef.current) trainerRef.current.stop();
					Speech.speak("Workout complete!", { voice: activeVoice });
					
					saveWorkout({
						date: new Date().toISOString(),
						duration: Math.floor(totalDurationRef.current / 100),
						rounds: currentRound,
						group: selectedGroup?.name || "Freestyle"
					});

					setStatus(-1);
				} else {
					Speech.speak(`Round over! ${restSecs} seconds rest.`, { voice: activeVoice });
					if (trainerRef.current) trainerRef.current.pause();
					setPhase('rest');
					setTime(restSecs * 100);
				}
			} else if (phase === 'rest') {
				const nextRound = currentRound + 1;
				setCurrentRound(nextRound);
				setPhase('work');
				Speech.stop(); 
				Speech.speak(`Round ${nextRound}`, { 
					voice: activeVoice,
					onDone: () => {
						setTimeout(() => {
							if (statusRef.current === 1 && trainerRef.current) {
								trainerRef.current.restart();
								trainerRef.current.resume();
							}
						}, 1000);
					}
				});
				setTime(workMins * 60 * 100);
			}
		}
	}, [time, status, isCountdown, phase, currentRound, numRounds, restSecs, workMins, activeVoice, selectedGroup]);

	const DEFAULT_GROUPS: Array<ExerciseGroup> = [
		{
			id: "default-1",
			name: "🥊 Beginner Combos",
			exercises: [
				{ id: "1", moves: ["jab", "cross"], repDelay: 1500 },
				{ id: "2", moves: ["jab", "cross", "left hook"], repDelay: 2000 },
				{ id: "3", moves: ["jab", "cross", "rear roundhouse"], repDelay: 2500 }
			]
		},
		{
			id: "default-2",
			name: "🥋 Advanced Flow",
			exercises: [
				{ id: "4", moves: ["jab", "cross", "slip", "cross", "right hook"], repDelay: 3000 },
				{ id: "5", moves: ["left hook", "cross", "rear knee"], repDelay: 3000 },
				{ id: "6", moves: ["jab", "right uppercut", "left hook", "rear roundhouse"], repDelay: 3500 }
			]
		}
	];

	const loadGroups = React.useCallback(() => {
		getValueFor("selectedVoice", (v) => {
			if (v) setActiveVoice(v);
		});
		getValueFor("groups", (val) => {
			let parsed = DEFAULT_GROUPS;
			if (val) {
				try {
					const p = JSON.parse(val);
					if (p && p.length > 0) {
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
	}, [groupName]);

	useFocusEffect(
		React.useCallback(() => {
			loadGroups();
		}, [loadGroups])
	);

	useEffect(() => {
		if (trainerRef.current) {
			trainerRef.current.updateSpeed(intensity);
		}
	}, [intensity]);

	return (
		<View style={[styles.container, { backgroundColor: theme.colors.background }]}>
			<Surface style={[styles.timeSurface, { backgroundColor: phase === 'rest' ? '#4a148c' : theme.colors.elevation.level2 }]} elevation={4}>
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
			
			<View style={{ width: '100%', paddingVertical: 15, alignItems: 'center' }}>
				<Text variant="labelLarge" style={{ color: theme.colors.secondary, marginBottom: 5 }}>
					Intensity: {intensity === 1.0 ? 'Normal' : intensity > 1 ? 'Pro (Faster)' : 'Beginner (Slower)'}
				</Text>
				<Slider
					style={{ width: 280, height: 40 }}
					minimumValue={0.5}
					maximumValue={1.5}
					step={0.1}
					value={intensity}
					onValueChange={(val: number) => setIntensity(val)}
					minimumTrackTintColor={theme.colors.primary}
					maximumTrackTintColor={theme.colors.secondary}
				/>
			</View>

			<View style={styles.controlsRow}>
				<IconButton icon="skip-previous" size={40} iconColor={theme.colors.secondary} onPress={handleRewind} disabled={status === -1} />
				
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
				
				<IconButton icon="skip-next" size={40} iconColor={theme.colors.secondary} onPress={handleSkip} disabled={status === -1} />
			</View>

			<View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center' }}>
				<Button mode={isShuffle ? "contained" : "contained-tonal"} icon="shuffle" onPress={() => setIsShuffle(!isShuffle)}>Shuffle</Button>
				<Button mode="contained-tonal" icon="timer" onPress={() => startRest(30)}>30s</Button>
				<Button mode="contained-tonal" icon="timer" onPress={() => startRest(60)}>60s</Button>
			</View>

			<View style={styles.trainerSetup}>
				<Card style={{ backgroundColor: theme.colors.elevation.level1, marginBottom: 10 }} mode="contained">
					<Card.Content style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
						<View style={{ alignItems: 'center' }}>
							<Text variant="labelSmall">Rounds</Text>
							<View style={{ flexDirection: 'row', alignItems: 'center' }}>
								<IconButton icon="minus" size={16} onPress={() => setNumRounds(Math.max(1, numRounds - 1))} />
								<Text variant="titleMedium">{numRounds}</Text>
								<IconButton icon="plus" size={16} onPress={() => setNumRounds(numRounds + 1)} />
							</View>
						</View>
						<View style={{ width: 1, backgroundColor: theme.colors.outlineVariant, height: '80%', alignSelf: 'center' }} />
						<View style={{ alignItems: 'center' }}>
							<Text variant="labelSmall">Work (min)</Text>
							<View style={{ flexDirection: 'row', alignItems: 'center' }}>
								<IconButton icon="minus" size={16} onPress={() => setWorkMins(Math.max(0.2, workMins - 0.5))} />
								<Text variant="titleMedium">{workMins}</Text>
								<IconButton icon="plus" size={16} onPress={() => setWorkMins(workMins + 0.5)} />
							</View>
						</View>
						<View style={{ width: 1, backgroundColor: theme.colors.outlineVariant, height: '80%', alignSelf: 'center' }} />
						<View style={{ alignItems: 'center' }}>
							<Text variant="labelSmall">Rest (sec)</Text>
							<View style={{ flexDirection: 'row', alignItems: 'center' }}>
								<IconButton icon="minus" size={16} onPress={() => setRestSecs(Math.max(10, restSecs - 10))} />
								<Text variant="titleMedium">{restSecs}</Text>
								<IconButton icon="plus" size={16} onPress={() => setRestSecs(restSecs + 10)} />
							</View>
						</View>
					</Card.Content>
				</Card>

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
