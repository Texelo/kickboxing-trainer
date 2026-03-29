import React, { useEffect, useState } from "react";
import { StyleSheet, ToastAndroid, View, ScrollView } from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as Speech from "expo-speech";
import { ActivityIndicator, Button, Card, Divider, FAB, IconButton, Text, TextInput, Title, useTheme, Chip } from "react-native-paper";
import { v4 as uuidv4 } from "uuid";
import Slider from "@react-native-community/slider";

import { copyToClipboard, getValueFor, save } from "../../utils/settings";
import type { Exercise, ExerciseGroup } from "../../utils/types";

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
				} catch(e) { 
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
	}, []);

	useEffect(() => {
		if (loading) return;
		save("groups", JSON.stringify(groups));
	}, [groups, loading]);

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

	if (loading) return <View style={{flex: 1, justifyContent:'center'}}><ActivityIndicator /></View>;

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

					<Title style={{marginTop: 20}}>Training Groups Config</Title>
					<Text style={{color: theme.colors.secondary, marginBottom: 15}}>Click Edit on any combo to modify or move it to a different group.</Text>
					
					<Card mode="outlined">
						<Card.Title title="Data Tools" subtitle="Export or overwrite configs" />
						<Card.Content>
							<View style={{flexDirection: "row", gap: 10, marginBottom: 10}}>
								<Button compact mode="contained-tonal" icon="export" onPress={() => { copyToClipboard(JSON.stringify(groups)); ToastAndroid.show("Copied raw data to clipboard", ToastAndroid.SHORT); }}>
									Export
								</Button>
								<Button compact mode="outlined" icon="delete" onPress={() => { setGroups([]); ToastAndroid.show("Config wiped", ToastAndroid.SHORT); }}>
									Clear All
								</Button>
							</View>
							<Divider style={{marginVertical: 10}} />
							<TextInput
								label="Paste Config to Import"
								value={importData}
								onChangeText={setImportData}
								mode="outlined"
								style={[styles.input, {height: 45, fontSize: 13}]}
							/>
							<Button mode="contained" onPress={() => {
								try {
									const val = JSON.parse(importData);
									setGroups(val);
									ToastAndroid.show("Imported config successfully", ToastAndroid.SHORT);
								} catch (e) {
									ToastAndroid.show("Invalid JSON configuration", ToastAndroid.SHORT);
								}
							}}>Import</Button>
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
									<View style={{flexDirection:'row', alignItems: 'center'}}>
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

							{group.exercises.length > 0 && <View style={styles.dividerBox}><Divider/></View>}

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
												<View style={{ flexDirection:'row', justifyContent:'flex-end', marginTop: 10}}>
													<Button onPress={() => setEditingExerciseId(null)}>Cancel</Button>
													<Button mode="contained" onPress={() => saveExerciseEdit(group.id, item.id)}>Save Combo</Button>
												</View>
											</View>
										) : (
											<>
												<View style={{flex: 1, paddingLeft: 10, paddingVertical: 5}}>
													<View style={{flexDirection: "row", flexWrap: "wrap", gap: 5, marginBottom: 5}}>
														{item.moves.map((m, i) => <Chip key={i} compact style={{backgroundColor: theme.colors.elevation.level3}} textStyle={{fontSize: 12}}>{m}</Chip>)}
													</View>
													<Text variant="bodySmall" style={{ color: theme.colors.secondary }}>{((item.repDelay ?? 1000)/1000).toFixed(1)}s delay</Text>
												</View>
												<IconButton icon="pencil-outline" size={20} onPress={() => {
													setEditingExerciseId(item.id);
													setMovesEdit(item.moves.join(", "));
													setDelayEdit((item.repDelay ?? 1000) / 1000);
													setTargetGroupEdit(group.id);
												}} />
												<IconButton icon="delete-outline" iconColor={theme.colors.error} size={20} onPress={() => deleteExercise(group.id, item.id)}/>
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
