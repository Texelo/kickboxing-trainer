import React, { useEffect, useState, useMemo } from "react";
import { StyleSheet, ToastAndroid, View, Text as RNText } from "react-native";
import { ActivityIndicator, Button, Card, Divider, FAB, IconButton, Text, TextInput, Title, useTheme } from "react-native-paper";
import { v4 as uuidv4 } from "uuid";
import Slider from "@react-native-community/slider";
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from "react-native-draggable-flatlist";
import { TouchableOpacity } from "react-native-gesture-handler";
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { copyToClipboard, getValueFor, save } from "../../utils/settings";
import type { Exercise, ExerciseGroup } from "../../utils/types";

// ... existing code ...
type ListItem = 
	| { type: 'group'; renderId: string; id: string; name: string }
	| { type: 'exercise'; renderId: string; id: string; groupId: string; moves: string; repDelay: number };

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

export default function SettingsScreen() {
	const theme = useTheme();
	const [groups, setGroups] = useState<Array<ExerciseGroup>>([]);
	const [loading, setLoading] = useState(true);
	const [importData, setImportData] = useState<string>("");

	// Inline editing states
	const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
	const [groupNameEdit, setGroupNameEdit] = useState<string>("");

	const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
	const [movesEdit, setMovesEdit] = useState<string>("");
	const [delayEdit, setDelayEdit] = useState<number>(1.5);

	useEffect(() => {
		getValueFor("groups", (val) => {
			if (!val) {
				setGroups(DEFAULT_GROUPS);
			} else {
				try {
					const parsed = JSON.parse(val);
					if (parsed && parsed.length > 0) {
						setGroups(parsed);
					} else {
						setGroups(DEFAULT_GROUPS);
					}
				} catch(e) { 
					setGroups(DEFAULT_GROUPS);
				}
			}
			setLoading(false);
		});
	}, []);

	useEffect(() => {
		if (loading) return;
		save("groups", JSON.stringify(groups));
	}, [groups, loading]);

	const flattenedData = useMemo(() => {
		const flat: ListItem[] = [];
		groups.forEach(g => {
			flat.push({ type: 'group', renderId: `g-${g.id}`, id: g.id, name: g.name });
			g.exercises.forEach(e => {
				flat.push({ type: 'exercise', renderId: `e-${e.id}`, id: e.id, groupId: g.id, moves: e.moves, repDelay: e.repDelay ?? 1000 });
			});
		});
		return flat;
	}, [groups]);

	const updateGroupsFromFlat = (data: ListItem[]) => {
		const newGroups: ExerciseGroup[] = [];
		let currentGroup: ExerciseGroup | null = null;
		
		data.forEach(item => {
			if (item.type === 'group') {
				currentGroup = { id: item.id, name: item.name, exercises: [] };
				newGroups.push(currentGroup);
			} else if (item.type === 'exercise') {
				const ex: Exercise = { id: item.id, moves: item.moves, repDelay: item.repDelay };
				if (currentGroup) {
					currentGroup.exercises.push(ex);
				} else {
					// Dragged an exercise to the very top above any group
					const orphanGroup = { id: uuidv4(), name: "Unassigned", exercises: [ex] };
					newGroups.push(orphanGroup);
					currentGroup = orphanGroup;
				}
			}
		});

		// Clean up empty unassigned groups if they happen
		setGroups(newGroups.filter(g => g.exercises.length > 0 || g.name !== "Unassigned"));
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
					exercises: [...grp.exercises, { id: exId, moves: "new combo", repDelay: 1500 }]
				};
			}
			return grp;
		}));
		setEditingExerciseId(exId);
		setMovesEdit("new combo");
		setDelayEdit(1.5);
	};

	const saveGroupEdit = (id: string) => {
		setGroups(g => g.map(grp => grp.id === id ? { ...grp, name: groupNameEdit } : grp));
		setEditingGroupId(null);
	};

	const saveExerciseEdit = (groupId: string, exerciseId: string) => {
		setGroups(g => g.map(grp => {
			if (grp.id === groupId) {
				return {
					...grp,
					exercises: grp.exercises.map(ex => ex.id === exerciseId ? { ...ex, moves: movesEdit, repDelay: delayEdit * 1000 } : ex)
				};
			}
			return grp;
		}));
		setEditingExerciseId(null);
	};

	const deleteExercise = (groupId: string, exerciseId: string) => {
		setGroups(g => g.map(grp => {
			if (grp.id === groupId) {
				return { ...grp, exercises: grp.exercises.filter(e => e.id !== exerciseId) };
			}
			return grp;
		}).filter(g => g.exercises.length > 0 || g.name !== "Unassigned")); // Auto cleanup empty groups? Let's leave empty manual groups for now unless unassigned
	};

	const deleteGroup = (groupId: string) => {
		setGroups(g => g.filter(grp => grp.id !== groupId));
	};



	const renderItem = ({ item, drag, isActive }: RenderItemParams<ListItem>) => {
		if (item.type === 'group') {
			const isEditing = editingGroupId === item.id;
			return (
				<ScaleDecorator>
					<Card style={[styles.groupCard, { backgroundColor: isActive ? theme.colors.elevation.level3 : theme.colors.elevation.level1 }]} mode="elevated">
						<Card.Title 
							titleVariant="titleLarge"
							title={isEditing ? "" : item.name} 
							left={(props) => (
								<TouchableOpacity onPressIn={drag} hitSlop={{top:15,bottom:15,left:15,right:15}} style={{justifyContent: 'center', alignItems: 'center', width: 45, height: 45}}>
									<FontAwesome name="bars" size={20} color={theme.colors.onSurfaceVariant} />
								</TouchableOpacity>
							)}
							right={(props) => (
								<View style={{flexDirection:'row', alignItems: 'center'}}>
									<Button compact onPress={() => addExerciseToGroup(item.id)}>+ Combo</Button>
									{!isEditing && <IconButton {...props} icon="pencil" onPress={() => { setEditingGroupId(item.id); setGroupNameEdit(item.name); }} />}
									{!isEditing && <IconButton {...props} iconColor={theme.colors.error} icon="delete" onPress={() => deleteGroup(item.id)} />}
								</View>
							)}
						/>
						{isEditing && (
							<Card.Content>
								<TextInput label="Group Name" value={groupNameEdit} onChangeText={setGroupNameEdit} style={styles.input} />
								<Button mode="contained" onPress={() => saveGroupEdit(item.id)}>Save Group</Button>
							</Card.Content>
						)}
					</Card>
				</ScaleDecorator>
			);
		}

		// Exercise Row
		const isEditingEx = editingExerciseId === item.id;
		return (
			<ScaleDecorator>
				<View style={[styles.exerciseRow, { backgroundColor: isActive ? theme.colors.elevation.level2 : "transparent" }]}>
					<TouchableOpacity onPressIn={drag} hitSlop={{top:15,bottom:15,left:15,right:15}} style={{justifyContent: 'center', alignItems: 'center', width: 45, height: 45}}>
						<FontAwesome name="arrows-v" size={20} color={theme.colors.onSurfaceVariant} />
					</TouchableOpacity>
					
					{isEditingEx ? (
							<View style={styles.editorContainer}>
								<TextInput label="Moves" value={movesEdit} onChangeText={setMovesEdit} style={styles.input} />
								<Text style={{ marginTop: 10 }}>Delay: {delayEdit.toFixed(1)}s</Text>
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
									<Button mode="contained" onPress={() => saveExerciseEdit(item.groupId, item.id)}>Save Combo</Button>
								</View>
							</View>
						) : (
							<>
								<View style={{flex: 1, paddingLeft: 10}}>
									<Text variant="titleMedium">{item.moves}</Text>
									<Text variant="bodySmall" style={{ color: theme.colors.secondary }}>{(item.repDelay/1000).toFixed(1)}s delay</Text>
								</View>
								<IconButton icon="pencil-outline" size={20} onPress={() => {
									setEditingExerciseId(item.id);
									setMovesEdit(item.moves);
									setDelayEdit(item.repDelay / 1000);
								}} />
								<IconButton icon="delete-outline" iconColor={theme.colors.error} size={20} onPress={() => deleteExercise(item.groupId, item.id)}/>
							</>
						)}
					</View>
			</ScaleDecorator>
		);
	};

	if (loading) return <View style={{flex: 1, justifyContent:'center'}}><ActivityIndicator /></View>;

	return (
		<View style={{ flex: 1, backgroundColor: theme.colors.background }}>
			<DraggableFlatList
				data={flattenedData}
				onDragEnd={({ data }) => updateGroupsFromFlat(data)}
				keyExtractor={(item) => item.renderId}
				renderItem={renderItem}
				containerStyle={{ flex: 1, paddingHorizontal: 15 }}
				contentContainerStyle={{ paddingBottom: 100 }}
				ListHeaderComponent={() => (
					<View style={{ marginTop: 20, marginBottom: 20 }}>
						<Title>Training Groups Config</Title>
						<Text style={{color: theme.colors.secondary, marginBottom: 15}}>Drag right-side handles to rearrange elements. Click Edit to modify.</Text>
						
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
				)}
			/>
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
	groupCard: { marginTop: 25, marginBottom: 5, borderRadius: 12 },
	exerciseRow: { flexDirection: "row", alignItems: "center", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#ccc", paddingVertical: 10, paddingLeft: 10 },
	editorContainer: { flex: 1, paddingRight: 15, paddingVertical: 10 },
	input: { marginBottom: 10, backgroundColor: 'transparent' },
	fab: { position: 'absolute', margin: 16, right: 0, bottom: 0 }
});
