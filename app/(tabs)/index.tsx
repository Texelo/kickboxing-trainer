import Slider from "@react-native-community/slider";
import { useFocusEffect } from "expo-router";
import * as Speech from "expo-speech";
import React, { useEffect, useRef, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, Chip, IconButton, Surface, Text, useTheme } from "react-native-paper";
import * as Linking from 'expo-linking';
import * as FileSystem from 'expo-file-system/legacy';
import { decodeGroup } from "../../utils/backup";
import { getValueFor, save } from "../../utils/settings";
import { saveWorkout } from "../../utils/stats";
import trainer from "../../utils/trainer";
import type { ExerciseGroup } from "../../utils/types";
import { Platform } from 'react-native';
import { DEFAULT_GROUPS } from "../../utils/defaults";

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

	// The wake lock sentinel.
	let wakeLock: WakeLockSentinel | null = null;

	// Function that attempts to request a screen wake lock.
	const requestWakeLock = async () => {
		try {
			wakeLock = await navigator.wakeLock.request();
			wakeLock.addEventListener('release', () => {
				console.log('Screen Wake Lock released:', wakeLock?.released);
			});
			console.log('Screen Wake Lock released:', wakeLock?.released);
		} catch (err) {
			if (err instanceof Error) {
				console.error(`${err.name}, ${err.message}`);
			}
		}
	};

	useEffect(() => {
		statusRef.current = status;
		if (status === 1) {
			requestWakeLock();
		}
		else {
			wakeLock?.release();
			wakeLock = null;
		}
	}, [status]);

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
		if (status !== -1 && totalDurationRef.current > 3000) {
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
		if (phase === 'rest') {
			setTime(0);
		} else if (trainerRef.current) {
			trainerRef.current.skip();
		} else if (status === 1 && isCountdown) {
			// Skip standalone rests/countdowns
			setTime(0);
		}
	};

	const handleRewind = () => {
		if (phase === 'rest') {
			setTime(restSecs * 100);
		} else if (trainerRef.current) {
			trainerRef.current.rewind();
		}
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

	const importWorkout = async (content: string) => {
		const trimmed = content.trim();
		if (!trimmed || (!trimmed.startsWith('{') && !trimmed.startsWith('KBX1|'))) return;

		try {
			let group: Partial<ExerciseGroup> | null = null;
			let isFullBackup = false;
			let backupData: any = null;

			if (trimmed.startsWith('KBX1|')) {
				group = decodeGroup(trimmed);
			} else {
				const parsed = JSON.parse(trimmed);
				if (parsed.n && parsed.e) {
					group = decodeGroup(trimmed);
				} else if (parsed.groups && Array.isArray(parsed.groups)) {
					isFullBackup = true;
					backupData = parsed;
				}
			}

			if (group && group.name && group.exercises) {
				const decodedGroup = group as ExerciseGroup;
				const newMoves = decodedGroup.exercises.flatMap(ex => ex.moves.flat()).map(m => m.toLowerCase());

				getValueFor("groups", (val) => {
					let existing = [];
					try { if (val) existing = JSON.parse(val); } catch (e) {}
					const updated = [...existing, decodedGroup];
					save("groups", JSON.stringify(updated));
					setGroups(updated as ExerciseGroup[]);

					// Auto-expand move library
					getValueFor("movePool", (mp) => {
						let pool = [];
						try { if (mp) pool = JSON.parse(mp); } catch(e) {}
						const updatedPool = Array.from(new Set([...pool, ...newMoves]));
						save("movePool", JSON.stringify(updatedPool));

						getValueFor("enabledMoves", (em) => {
							let enabled = [];
							try { if (em) enabled = JSON.parse(em); } catch(e) {}
							const updatedEnabled = Array.from(new Set([...enabled, ...newMoves]));
							save("enabledMoves", JSON.stringify(updatedEnabled));
						});
					});

					Alert.alert("Workout Imported", `"${decodedGroup.name}" added to your library.`);
				});
			} else if (isFullBackup) {
				Alert.alert(
					"Import Backup",
					"This file contains a full backup. Do you want to replace your current library?",
					[
						{ text: "Cancel", style: "cancel" },
						{ text: "Replace All", onPress: () => {
							save("groups", JSON.stringify(backupData.groups));
							setGroups(backupData.groups);
							if (backupData.movePool) save("movePool", JSON.stringify(backupData.movePool));
							if (backupData.enabledMoves) save("enabledMoves", JSON.stringify(backupData.enabledMoves));
							Alert.alert("Success", "Library restored from backup.");
						}}
					]
				);
			}
		} catch (e) {
			console.error("Import parsing error", e);
		}
	};

	useEffect(() => {
		const handleDeepLink = async (url: string | null) => {
			if (!url) return;
			const cleanUrl = decodeURIComponent(url);
			if (cleanUrl.toLowerCase().endsWith('.kbx') || cleanUrl.startsWith('content://')) {
				try {
					const content = await FileSystem.readAsStringAsync(cleanUrl);
					if (content) await importWorkout(content);
				} catch (e) {
					console.error("Deep link import error", e);
				}
			}
		};

		// PWA File Handling support
		if (Platform.OS === 'web' && 'launchQueue' in window) {
			(window as any).launchQueue.setConsumer(async (launchParams: any) => {
				if (launchParams.files && launchParams.files.length > 0) {
					try {
						const fileHandle = launchParams.files[0];
						const file = await fileHandle.getFile();
						const content = await file.text();
						if (content) await importWorkout(content);
					} catch (e) {
						console.error("PWA file handler error", e);
					}
				}
			});
		}

		const subscription = Linking.addEventListener('url', (event) => {
			handleDeepLink(event.url);
		});

		Linking.getInitialURL().then(handleDeepLink);
		return () => subscription.remove();
	}, [groups]);

	useEffect(() => {
		if (status === 1 && isCountdown && time === 0 && totalDurationRef.current > 3000) {
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
								moves: Array.isArray(ex.moves)
									? (Array.isArray(ex.moves[0]) ? ex.moves : [ex.moves])  // new format or old array format
									: (ex.moves ? [ex.moves.split(" ")] : [[]])  // old string format
							}))
						}));
					}
				} catch (e) { }
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

	useEffect(() => {
		if (status !== -1) {
			setStatus(-1);
			if (trainerRef.current) {
				trainerRef.current.stop();
				trainerRef.current = null;
			}
			Speech.stop();
			reset();
		}
	}, [groupName]);

	return (
		<View style={{ flex: 1, backgroundColor: theme.colors.background }}>
			<ScrollView contentContainerStyle={[styles.container, { paddingBottom: 40 }]}>
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
						maximumValue={2.5}
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
									<IconButton icon="minus" size={16} onPress={() => setWorkMins(Math.max(0.5, workMins - 0.5))} />
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
								<View key={ex.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
									{ex.moves.map((combo, ci) => (
										<React.Fragment key={ci}>
											{ci > 0 && <Text style={{ color: theme.colors.secondary, fontWeight: 'bold' }}>+</Text>}
											<Chip compact style={{ backgroundColor: theme.colors.elevation.level2 }} textStyle={{ fontSize: 13, color: theme.colors.secondary }}>
												{combo.join(" • ")}
											</Chip>
										</React.Fragment>
									))}
								</View>
							))}
						</View>
					)}
				</View>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, padding: 20, alignItems: "center", justifyContent: "flex-start" },
	timeSurface: { width: "100%", paddingVertical: 40, alignItems: "center", borderRadius: 20, marginVertical: 20 },
	controlsRow: { flexDirection: "row", justifyContent: "center", width: "100%", gap: 20, marginVertical: 10 },
	trainerSetup: { width: "100%", marginTop: 30, gap: 15 },
	picker: { backgroundColor: "rgba(128,128,128,0.1)", borderRadius: 10 },
	actionButton: { paddingVertical: 5 }
});
