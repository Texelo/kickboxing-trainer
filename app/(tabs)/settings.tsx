import Slider from "@react-native-community/slider";
import { Picker } from "@react-native-picker/picker";
import * as Speech from "expo-speech";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, Card, Chip, Divider, FAB, IconButton, Text, TextInput, Title, useTheme } from "react-native-paper";
import { v4 as uuidv4 } from "uuid";

import { copyToClipboard, getValueFor, save } from "../../utils/settings";
import type { ExerciseGroup } from "../../utils/types";
import { decodeGroup, encodeGroup, shareBackupFile, importBackupFile } from "../../utils/backup";

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

export default function SettingsScreen() {
	const theme = useTheme();
	const [groups, setGroups] = useState<Array<ExerciseGroup>>([]);
	const [voices, setVoices] = useState<Speech.Voice[]>([]);
	const [selectedVoice, setSelectedVoice] = useState<string>("");
	const [loading, setLoading] = useState(true);
	const [importData, setImportData] = useState<string>("");

	// Inline editing states
	const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
	const [groupNameEdit, setGroupNameEdit] = useState<string>("");

	const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
	const [movesEdit, setMovesEdit] = useState<string>("");
	const [delayEdit, setDelayEdit] = useState<number>(1.5);
	const [targetGroupEdit, setTargetGroupEdit] = useState<string>("");

	const DEFAULT_MOVE_POOL = [
		"jab", "cross", "left hook", "right hook", "left uppercut", "right uppercut", 
		"lead knee", "rear knee", 
		"lead roundhouse", "rear roundhouse", 
		"lead side kick", "rear side kick", 
		"lead push kick", "rear push kick", 
		"slip", "roll", "left elbow", "right elbow"
	];

	const [movePool, setMovePool] = useState<string[]>(DEFAULT_MOVE_POOL);
	const [isEditingLibrary, setIsEditingLibrary] = useState(false);
	const [newMoveInput, setNewMoveInput] = useState("");

	const [isManualMode, setIsManualMode] = useState(false);
	const [manualComboMoves, setManualComboMoves] = useState<string[]>([]);
	const [selectedManualGroupId, setSelectedManualGroupId] = useState<string>("");
	const [manualDelay, setManualDelay] = useState(2.0);

	const [enabledMoves, setEnabledMoves] = useState<string[]>(DEFAULT_MOVE_POOL);

	useEffect(() => {
		getValueFor("groups", (val) => {
			if (val) {
				try {
					const parsed = JSON.parse(val);
					if (parsed && parsed.length > 0) {
						// Ensure retro-compatibility with old array strings
						const normalized = parsed.map((g: any) => ({
							...g,
							exercises: g.exercises.map((ex: any) => ({
								...ex,
								moves: Array.isArray(ex.moves) ? ex.moves : (ex.moves ? ex.moves.split(" ") : [])
							}))
						}));
						setGroups(normalized);
					} else {
						setGroups(DEFAULT_GROUPS);
					}
				} catch (e) {
					console.error("Config load error", e);
					setGroups(DEFAULT_GROUPS);
				}
			} else {
				setGroups(DEFAULT_GROUPS);
			}
			setLoading(false);
		});

		// Load available voices and their selected config
		Speech.getAvailableVoicesAsync().then((v) => {
			if (v && v.length) setVoices(v);
		});
		getValueFor("selectedVoice", (v) => {
			if (v) setSelectedVoice(v);
		});
		getValueFor("movePool", (v) => {
			if (v) {
				try { setMovePool(JSON.parse(v)); } catch(e) {}
			}
		});
		getValueFor("enabledMoves", (v) => {
			if (v) {
				try { setEnabledMoves(JSON.parse(v)); } catch(e) {}
			}
		});
	}, []);

	useEffect(() => {
		if (loading) return;
		save("groups", JSON.stringify(groups));
	}, [groups, loading]);

	useEffect(() => {
		if (loading) return;
		save("movePool", JSON.stringify(movePool));
	}, [movePool, loading]);

	const addToMovePool = () => {
		const trimmed = newMoveInput.trim().toLowerCase();
		if (trimmed && !movePool.includes(trimmed)) {
			setMovePool([...movePool, trimmed]);
			setEnabledMoves([...enabledMoves, trimmed]);
			setNewMoveInput("");
		}
	};

	const removeFromMovePool = (move: string) => {
		setMovePool(movePool.filter(m => m !== move));
		setEnabledMoves(enabledMoves.filter(m => m !== move));
	};

	const addMoveToManualCombo = (move: string) => {
		setManualComboMoves([...manualComboMoves, move]);
	};

	const removeMoveFromManualCombo = (index: number) => {
		const next = [...manualComboMoves];
		next.splice(index, 1);
		setManualComboMoves(next);
	};

	const saveManualCombo = () => {
		if (manualComboMoves.length === 0) {
			Alert.alert("Error", "Add some moves to the combo first!");
			return;
		}
		const targetId = selectedManualGroupId || (groups.length > 0 ? groups[0].id : null);
		if (!targetId) {
			Alert.alert("Error", "Please create a training group first.");
			return;
		}

		const newEx = {
			id: uuidv4(),
			moves: manualComboMoves,
			repDelay: manualDelay * 1000
		};

		setGroups(g => g.map(grp => {
			if (grp.id === targetId) {
				return { ...grp, exercises: [...grp.exercises, newEx] };
			}
			return grp;
		}));

		setManualComboMoves([]);
		Alert.alert("Success", "Combo saved to group!");
	};

	const appendNewGroup = () => {
		const nId = uuidv4();
		setGroups([...groups, { id: nId, name: "New Group", exercises: [] }]);
		setEditingGroupId(nId);
		setGroupNameEdit("New Group");
	};

	const addExerciseToGroup = (groupId: string) => {
		const exId = uuidv4();
		setGroups(g => g.map(grp => {
			if (grp.id === groupId) {
				return {
					...grp,
					exercises: [...grp.exercises, { id: exId, moves: ["new", "combo"], repDelay: 1500 }]
				};
			}
			return grp;
		}));
		setEditingExerciseId(exId);
		setMovesEdit("new, combo");
		setDelayEdit(1.5);
		setTargetGroupEdit(groupId);
	};

	const saveGroupEdit = (id: string) => {
		setGroups(g => g.map(grp => grp.id === id ? { ...grp, name: groupNameEdit } : grp));
		setEditingGroupId(null);
	};

	const saveExerciseEdit = (originalGroupId: string, exerciseId: string) => {
		const parsedMoves = movesEdit.split(",").map(m => m.trim()).filter(Boolean);
		// If group hasn't changed, simple update
		if (originalGroupId === targetGroupEdit) {
			setGroups(g => g.map(grp => {
				if (grp.id === originalGroupId) {
					return {
						...grp,
						exercises: grp.exercises.map(ex => ex.id === exerciseId ? { ...ex, moves: parsedMoves, repDelay: delayEdit * 1000 } : ex)
					};
				}
				return grp;
			}));
		} else {
			// Pull it out of original and push to target
			setGroups(g => {
				let updated = [...g];
				updated = updated.map(grp => {
					if (grp.id === originalGroupId) return { ...grp, exercises: grp.exercises.filter(ex => ex.id !== exerciseId) };
					return grp;
				});
				updated = updated.map(grp => {
					if (grp.id === targetGroupEdit) return { ...grp, exercises: [...grp.exercises, { id: exerciseId, moves: parsedMoves, repDelay: delayEdit * 1000 }] };
					return grp;
				});
				return updated;
			});
		}
		setEditingExerciseId(null);
	};

	const deleteExercise = (groupId: string, exerciseId: string) => {
		setGroups(g => g.map(grp => {
			if (grp.id === groupId) {
				return { ...grp, exercises: grp.exercises.filter(e => e.id !== exerciseId) };
			}
			return grp;
		}));
	};

	const deleteGroup = (groupId: string) => {
		setGroups(g => g.filter(grp => grp.id !== groupId));
	};

	const handleAIGenerate = () => {
		if (enabledMoves.length === 0) {
			Alert.alert("Error", "Please enable some moves first!");
			return;
		}

		const numCombos = 5 + Math.floor(Math.random() * 5); // 5-10 combos
		const newExercises = [];

		for (let i = 0; i < numCombos; i++) {
			const comboLength = 2 + Math.floor(Math.random() * 3); // 2-4 moves
			const chosenMoves = [];
			for (let j = 0; j < comboLength; j++) {
				chosenMoves.push(enabledMoves[Math.floor(Math.random() * enabledMoves.length)]);
			}
			newExercises.push({
				id: uuidv4(),
				moves: chosenMoves,
				repDelay: 2000 + Math.floor(Math.random() * 1000)
			});
		}

		const newGroup: ExerciseGroup = {
			id: uuidv4(),
			name: `🔄 Generated Flow (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
			exercises: newExercises
		};

		setGroups([...groups, newGroup]);
		Alert.alert("Success", "Random Flow Generated!");
	};

	const handleShareGroup = async (group: ExerciseGroup) => {
		const encoded = encodeGroup(group);
		Alert.alert(
			"Share Training Sequence",
			"Choose how you want to share this workout:",
			[
				{ text: "Copy Short Code", onPress: () => { copyToClipboard(encoded); Alert.alert("Copied!", "Short code copied to clipboard. Others can paste this into their import field."); } },
				{ text: "Share as File", onPress: async () => { await shareBackupFile([group], movePool, enabledMoves); } },
				{ text: "Cancel", style: "cancel" }
			]
		);
	};

	const handleFullBackup = async () => {
		await shareBackupFile(groups, movePool, enabledMoves);
	};

	const handleFullImport = async () => {
		const data = await importBackupFile();
		if (data) {
			setGroups(data.groups);
			setMovePool(data.movePool || DEFAULT_MOVE_POOL);
			setEnabledMoves(data.enabledMoves || DEFAULT_MOVE_POOL);
			Alert.alert("Success", "Backup restored successfully!");
		}
	};

	const handlePasteImport = async () => {
		if (!importData.trim()) {
			Alert.alert("Error", "Paste some data first!");
			return;
		}

		try {
			// Try to detect if it's a short code or raw JSON
			if (importData.trim().startsWith('{')) {
				const parsed = JSON.parse(importData);
				// If it's a list of groups
				if (Array.isArray(parsed)) {
					setGroups(parsed);
					Alert.alert("Success", "Imported all groups");
				} else if (parsed.n && parsed.e) {
					// It's a single encoded group (as JSON object)
					const decoded = decodeGroup(importData);
					if (decoded.name && decoded.exercises) {
						setGroups([...groups, decoded as ExerciseGroup]);
						Alert.alert("Success", `Imported "${decoded.name}"`);
						setImportData("");
					}
				} else {
					throw new Error("Unknown format");
				}
			} else {
				// Assume it's an encoded string format if I add one later (not implemented yet)
				throw new Error("Invalid format");
			}
		} catch (e) {
			Alert.alert("Error", "Invalid configuration format.");
		}
	};

	if (loading) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator /></View>;

	return (
		<View style={{ flex: 1, backgroundColor: theme.colors.background }}>
			<ScrollView contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 100 }}>
				<View style={{ marginTop: 20, marginBottom: 20 }}>
					<Title>Settings</Title>

					<Card style={[styles.groupCard, { backgroundColor: theme.colors.elevation.level2, marginTop: 10 }]}>
						<Card.Title title="Voice Selection" subtitle="Choose your trainer's voice" left={(props) => <IconButton {...props} icon="account-voice" />} />
						<Card.Content>
							<View style={{ borderRadius: 10, overflow: 'hidden', backgroundColor: theme.colors.elevation.level3, marginBottom: 10 }}>
								<Picker
									selectedValue={selectedVoice}
									onValueChange={(val) => {
										setSelectedVoice(val);
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

					<Card style={[styles.groupCard, { backgroundColor: theme.colors.elevation.level2, marginTop: 20 }]}>
						<Card.Title 
							title="Combo Generator & Library" 
							subtitle={isManualMode ? "Manual Combo Builder" : "Random Generator Moves"} 
							left={(props) => <IconButton {...props} icon="auto-fix" />}
							right={(props) => (
								<View style={{ flexDirection: 'row' }}>
									<IconButton {...props} icon={isEditingLibrary ? "check" : "pencil"} onPress={() => setIsEditingLibrary(!isEditingLibrary)} />
									<IconButton {...props} icon={isManualMode ? "dice-5" : "gesture-tap"} onPress={() => setIsManualMode(!isManualMode)} />
								</View>
							)}
						/>
						<Card.Content>
							{isManualMode ? (
								<View style={{ marginBottom: 20, padding: 10, borderRadius: 10, backgroundColor: theme.colors.elevation.level3 }}>
									<Title style={{ fontSize: 16 }}>Current Combo Builder</Title>
									<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 10, minHeight: 40 }}>
										{manualComboMoves.map((m, idx) => (
											<Chip key={`${m}-${idx}`} onClose={() => removeMoveFromManualCombo(idx)} style={{ backgroundColor: theme.colors.primaryContainer }}>{m}</Chip>
										))}
										{manualComboMoves.length === 0 && <Text style={{ color: theme.colors.secondary, fontStyle: 'italic' }}>Click moves below to build...</Text>}
									</View>

									<View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 }}>
										<View style={{ flex: 2, borderRadius: 8, overflow: 'hidden', backgroundColor: theme.colors.elevation.level4 }}>
											<Picker
												selectedValue={selectedManualGroupId || (groups.length > 0 ? groups[0].id : "")}
												onValueChange={(v) => setSelectedManualGroupId(v)}
												style={{ color: theme.colors.onSurface }}
												dropdownIconColor={theme.colors.onSurface}
											>
												{groups.map(g => <Picker.Item key={g.id} label={`Save to: ${g.name}`} value={g.id} />)}
											</Picker>
										</View>
										<Button mode="contained" icon="content-save" onPress={saveManualCombo} style={{ flex: 1 }}>Save</Button>
										<IconButton icon="refresh" onPress={() => setManualComboMoves([])} />
									</View>

									<View style={{ marginTop: 15 }}>
										<Text variant="bodySmall">Combo Delay: {manualDelay.toFixed(1)}s</Text>
										<Slider
											style={{ width: "100%", height: 30 }}
											value={manualDelay}
											onValueChange={setManualDelay}
											minimumValue={0.5}
											maximumValue={5}
											step={0.1}
											minimumTrackTintColor={theme.colors.primary}
										/>
									</View>
								</View>
							) : (
								<Button 
									mode="contained" 
									icon="auto-fix" 
									style={{ marginBottom: 20 }} 
									onPress={handleAIGenerate}
									disabled={enabledMoves.length === 0}
								>
									Generate Random Routine
								</Button>
							)}

							<Divider style={{ marginBottom: 15 }} />
							
							{isEditingLibrary && (
								<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 }}>
									<TextInput 
										label="Add New Move" 
										value={newMoveInput} 
										onChangeText={setNewMoveInput} 
										style={{ flex: 1, height: 45 }}
										mode="outlined"
									/>
									<IconButton 
										icon="plus-circle" 
										size={32} 
										iconColor={theme.colors.primary} 
										onPress={addToMovePool}
										disabled={!newMoveInput.trim()}
									/>
								</View>
							)}

							<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
								{movePool.map(m => {
									const isEnabled = enabledMoves.includes(m);
									return (
										<Chip 
											key={m} 
											selected={isEnabled}
											onPress={() => {
												if (isManualMode) {
													addMoveToManualCombo(m);
												} else {
													const next = isEnabled ? enabledMoves.filter(x => x !== m) : [...enabledMoves, m];
													setEnabledMoves(next);
													save("enabledMoves", JSON.stringify(next));
												}
											}}
											onClose={isEditingLibrary ? () => removeFromMovePool(m) : undefined}
											mode={isEnabled ? "flat" : "outlined"}
										>
											{m}
										</Chip>
									);
								})}
							</View>
						</Card.Content>
					</Card>

					<Title style={{ marginTop: 20 }}>Training Groups Config</Title>
					<Text style={{ color: theme.colors.secondary, marginBottom: 15 }}>Click Edit on any combo to modify or move it to a different group.</Text>

					<Title style={{ marginTop: 20 }}>Backup & Data Tools</Title>
					<Card mode="elevated" style={{ backgroundColor: theme.colors.elevation.level1 }}>
						<Card.Title 
							title="Backup & Restore" 
							subtitle="Share sequences or your whole library" 
							left={(props) => <IconButton {...props} icon="cloud-sync" />}
						/>
						<Card.Content>
							<View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
								<Button compact mode="contained" icon="share-variant" onPress={handleFullBackup} style={{ flex: 1 }}>
									Full Backup
								</Button>
								<Button compact mode="outlined" icon="file-import" onPress={handleFullImport} style={{ flex: 1 }}>
									Import File
								</Button>
							</View>
							
							<Divider style={{ marginBottom: 20 }} />

							<Text variant="titleSmall" style={{ marginBottom: 10 }}>Import from Clipboard</Text>
							<TextInput
								label="Paste Code/JSON here"
								value={importData}
								onChangeText={setImportData}
								mode="outlined"
								multiline
								style={[styles.input, { height: 80, fontSize: 12 }]}
							/>
							<View style={{ flexDirection: 'row', gap: 10 }}>
								<Button mode="contained-tonal" icon="clipboard-arrow-down" onPress={handlePasteImport} style={{ flex: 1 }}>
									Import Pasted
								</Button>
								<Button mode="text" icon="delete-sweep" textColor={theme.colors.error} onPress={() => setGroups([])}>
									Clear All
								</Button>
							</View>
						</Card.Content>
					</Card>
				</View>

				{groups.map(group => {
					const isEditingGroup = editingGroupId === group.id;
					return (
						<Card key={group.id} style={styles.groupCard} mode="elevated">
							<Card.Title
								titleVariant="titleLarge"
								title={isEditingGroup ? "" : group.name}
								right={(props) => (
									<View style={{ flexDirection: 'row', alignItems: 'center' }}>
										<IconButton {...props} icon="share-variant-outline" onPress={() => handleShareGroup(group)} />
										<Button compact onPress={() => addExerciseToGroup(group.id)}>+ Combo</Button>
										{!isEditingGroup && <IconButton {...props} icon="pencil" onPress={() => { setEditingGroupId(group.id); setGroupNameEdit(group.name); }} />}
										{!isEditingGroup && <IconButton {...props} iconColor={theme.colors.error} icon="delete" onPress={() => deleteGroup(group.id)} />}
									</View>
								)}
							/>
							{isEditingGroup && (
								<Card.Content>
									<TextInput label="Group Name" value={groupNameEdit} onChangeText={setGroupNameEdit} style={styles.input} />
									<Button mode="contained" onPress={() => saveGroupEdit(group.id)}>Save Group</Button>
								</Card.Content>
							)}

							{group.exercises.length > 0 && <View style={styles.dividerBox}><Divider /></View>}

							{group.exercises.map(item => {
								const isEditingEx = editingExerciseId === item.id;
								return (
									<View key={item.id} style={[styles.exerciseRow, { backgroundColor: isEditingEx ? theme.colors.elevation.level2 : "transparent" }]}>
										{isEditingEx ? (
											<View style={styles.editorContainer}>
												<TextInput label="Moves (comma separated)" value={movesEdit} onChangeText={setMovesEdit} style={styles.input} />

												<Text style={{ marginTop: 15, marginBottom: 5 }}>Transfer to Group:</Text>
												<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 5 }}>
													{groups.map((g) => (
														<Chip
															key={g.id}
															mode={targetGroupEdit === g.id ? "flat" : "outlined"}
															selected={targetGroupEdit === g.id}
															onPress={() => setTargetGroupEdit(g.id)}
															style={targetGroupEdit === g.id ? { backgroundColor: theme.colors.secondaryContainer } : {}}
														>
															{g.name}
														</Chip>
													))}
												</ScrollView>

												<Text style={{ marginTop: 15 }}>Delay: {delayEdit.toFixed(1)}s</Text>
												<Slider
													style={{ width: "100%", height: 40 }}
													value={delayEdit}
													onValueChange={setDelayEdit}
													minimumValue={0.5}
													maximumValue={5}
													step={0.1}
													minimumTrackTintColor={theme.colors.primary}
												/>
												<View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
													<Button onPress={() => setEditingExerciseId(null)}>Cancel</Button>
													<Button mode="contained" onPress={() => saveExerciseEdit(group.id, item.id)}>Save Combo</Button>
												</View>
											</View>
										) : (
											<>
												<View style={{ flex: 1, paddingLeft: 10, paddingVertical: 5 }}>
													<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 5, marginBottom: 5 }}>
														{item.moves.map((m, i) => <Chip key={i} compact style={{ backgroundColor: theme.colors.elevation.level3 }} textStyle={{ fontSize: 12 }}>{m}</Chip>)}
													</View>
													<Text variant="bodySmall" style={{ color: theme.colors.secondary }}>{((item.repDelay ?? 1000) / 1000).toFixed(1)}s delay</Text>
												</View>
												<IconButton icon="pencil-outline" size={20} onPress={() => {
													setEditingExerciseId(item.id);
													setMovesEdit(item.moves.join(", "));
													setDelayEdit((item.repDelay ?? 1000) / 1000);
													setTargetGroupEdit(group.id);
												}} />
												<IconButton icon="delete-outline" iconColor={theme.colors.error} size={20} onPress={() => deleteExercise(group.id, item.id)} />
											</>
										)}
									</View>
								);
							})}
						</Card>
					);
				})}
			</ScrollView>
			<FAB
				icon="folder-plus"
				label="Add Group"
				style={[styles.fab, { backgroundColor: theme.colors.primaryContainer }]}
				onPress={appendNewGroup}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	groupCard: { marginTop: 25, marginBottom: 5, borderRadius: 12, overflow: 'hidden' },
	dividerBox: { paddingHorizontal: 10, paddingBottom: 5 },
	exerciseRow: { flexDirection: "row", alignItems: "center", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#555", paddingVertical: 10, paddingLeft: 10 },
	editorContainer: { flex: 1, paddingRight: 15, paddingVertical: 10 },
	input: { marginBottom: 10, backgroundColor: 'transparent' },
	fab: { position: 'absolute', margin: 16, right: 0, bottom: 0 }
});
