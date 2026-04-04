import * as Speech from "expo-speech";
import React, { useEffect, useRef, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { ActivityIndicator, Button, Dialog, FAB, Paragraph, Portal, Snackbar, Text, Title, useTheme } from "react-native-paper";
import { v4 as uuidv4 } from "uuid";

import { copyToClipboard, getValueFor, save } from "../../utils/settings";
import type { ExerciseGroup } from "../../utils/types";
import { decodeGroup, encodeGroup, shareBackupFile, importBackupFile } from "../../utils/backup";
import { DEFAULT_GROUPS, DEFAULT_MOVE_POOL } from "../../utils/defaults";
import { parseGroups } from "../../utils/groupParser";

import VoiceSelector from "../../components/settings/VoiceSelector";
import ComboBuilderCard from "../../components/settings/ComboBuilderCard";
import BackupCard from "../../components/settings/BackupCard";
import GroupCard from "../../components/settings/GroupCard";

export default function SettingsScreen() {
	const theme = useTheme();
	const [groups, setGroups] = useState<ExerciseGroup[]>([]);
	const [voices, setVoices] = useState<Speech.Voice[]>([]);
	const [selectedVoice, setSelectedVoice] = useState<string>("");
	const [loading, setLoading] = useState(true);
	const [importData, setImportData] = useState<string>("");

	// Exercise inline editing state (shared across groups for cross-group transfers)
	const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
	const [movesEdit, setMovesEdit] = useState<string>("");
	const [delayEdit, setDelayEdit] = useState<number>(1.5);
	const [targetGroupEdit, setTargetGroupEdit] = useState<string>("");

	const [movePool, setMovePool] = useState<string[]>(DEFAULT_MOVE_POOL);
	const [isEditingLibrary, setIsEditingLibrary] = useState(false);
	const [newMoveInput, setNewMoveInput] = useState("");

	const scrollViewRef = useRef<ScrollView>(null);
	const [isManualMode, setIsManualMode] = useState(true);
	const [manualCombos, setManualCombos] = useState<string[][]>([[]]);
	const [activeManualComboIdx, setActiveManualComboIdx] = useState(0);
	const [selectedManualGroupId, setSelectedManualGroupId] = useState<string>("");
	const [manualDelay, setManualDelay] = useState(2.0);

	const [enabledMoves, setEnabledMoves] = useState<string[]>(DEFAULT_MOVE_POOL);
	const [shareModalVisible, setShareModalVisible] = useState(false);
	const [groupToShare, setGroupToShare] = useState<ExerciseGroup | null>(null);
	const [snackbarVisible, setSnackbarVisible] = useState(false);
	const [snackbarMsg, setSnackbarMsg] = useState("");
	const [newlyCreatedGroupId, setNewlyCreatedGroupId] = useState<string | null>(null);

	useEffect(() => {
		getValueFor("groups", (val) => {
			setGroups(parseGroups(val));
			setLoading(false);
		});
		Speech.getAvailableVoicesAsync().then((v) => { if (v?.length) setVoices(v); });
		getValueFor("selectedVoice", (v) => { if (v) setSelectedVoice(v); });
		getValueFor("movePool", (v) => {
			let current = DEFAULT_MOVE_POOL;
			if (v) {
				try {
					const parsed = JSON.parse(v);
					if (Array.isArray(parsed)) {
						const missing = DEFAULT_MOVE_POOL.filter(m => !parsed.includes(m));
						current = [...parsed, ...missing];
					}
				} catch(e) {}
			}
			setMovePool(current);
		});
		getValueFor("enabledMoves", (v) => {
			let current = DEFAULT_MOVE_POOL;
			if (v) {
				try {
					const parsed = JSON.parse(v);
					if (Array.isArray(parsed)) {
						const missing = DEFAULT_MOVE_POOL.filter(m => !parsed.includes(m));
						current = [...parsed, ...missing];
					}
				} catch(e) {}
			}
			setEnabledMoves(current);
		});
	}, []);

	useEffect(() => { if (!loading) save("groups", JSON.stringify(groups)); }, [groups, loading]);
	useEffect(() => { if (!loading) save("movePool", JSON.stringify(movePool)); }, [movePool, loading]);

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
		const next = [...manualCombos];
		next[activeManualComboIdx] = [...next[activeManualComboIdx], move];
		setManualCombos(next);
	};

	const saveManualCombo = () => {
		const moves = manualCombos.filter(c => c.length > 0);
		if (moves.length === 0) { Alert.alert("Error", "Add some moves to the combo first!"); return; }
		const targetId = selectedManualGroupId || (groups.length > 0 ? groups[0].id : null);
		if (!targetId) { Alert.alert("Error", "Please create a training group first."); return; }
		setGroups(g => g.map(grp => grp.id === targetId
			? { ...grp, exercises: [...grp.exercises, { id: uuidv4(), moves, repDelay: manualDelay * 1000 }] }
			: grp
		));
		setManualCombos([[]]);
		setActiveManualComboIdx(0);
		Alert.alert("Success", "Combo saved to group!");
	};

	const appendNewGroup = () => {
		const nId = uuidv4();
		setGroups([...groups, { id: nId, name: "New Group", exercises: [] }]);
		setNewlyCreatedGroupId(nId);
		setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
	};

	const addExerciseToGroup = (groupId: string) => {
		const exId = uuidv4();
		setGroups(g => g.map(grp => grp.id === groupId
			? { ...grp, exercises: [...grp.exercises, { id: exId, moves: [["new", "combo"]], repDelay: 1500 }] }
			: grp
		));
		setEditingExerciseId(exId);
		setMovesEdit("new, combo");
		setDelayEdit(1.5);
		setTargetGroupEdit(groupId);
	};

	const saveExerciseEdit = (originalGroupId: string, exerciseId: string) => {
		const moves = movesEdit.split("+").map(part => part.split(",").map(m => m.trim()).filter(Boolean)).filter(c => c.length > 0);
		if (originalGroupId === targetGroupEdit) {
			setGroups(g => g.map(grp => grp.id === originalGroupId
				? { ...grp, exercises: grp.exercises.map(ex => ex.id === exerciseId ? { ...ex, moves, repDelay: delayEdit * 1000 } : ex) }
				: grp
			));
		} else {
			setGroups(g => {
				let updated = g.map(grp => grp.id === originalGroupId
					? { ...grp, exercises: grp.exercises.filter(ex => ex.id !== exerciseId) }
					: grp
				);
				updated = updated.map(grp => grp.id === targetGroupEdit
					? { ...grp, exercises: [...grp.exercises, { id: exerciseId, moves, repDelay: delayEdit * 1000 }] }
					: grp
				);
				return updated;
			});
		}
		setEditingExerciseId(null);
	};

	const handleAIGenerate = () => {
		if (enabledMoves.length === 0) { Alert.alert("Error", "Please enable some moves first!"); return; }
		const numCombos = 5 + Math.floor(Math.random() * 5);
		const newExercises = Array.from({ length: numCombos }, () => ({
			id: uuidv4(),
			moves: [Array.from({ length: 2 + Math.floor(Math.random() * 3) }, () => enabledMoves[Math.floor(Math.random() * enabledMoves.length)])],
			repDelay: 2000 + Math.floor(Math.random() * 1000)
		}));
		setGroups([...groups, {
			id: uuidv4(),
			name: `🔄 Generated Flow (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
			exercises: newExercises
		}]);
		Alert.alert("Success", "Random Flow Generated!", [{ text: "OK", onPress: () => scrollViewRef.current?.scrollToEnd({ animated: true }) }]);
	};

	const showSnack = (msg: string) => { setSnackbarMsg(msg); setSnackbarVisible(true); };

	const handlePasteImport = async () => {
		if (!importData.trim()) { Alert.alert("Error", "Paste some data first!"); return; }
		try {
			const trimmed = importData.trim();
			let importedGroup: ExerciseGroup | null = null;
			let isFullBackup = false;
			let backupData: any = null;

			if (trimmed.startsWith('KBX1|')) {
				const decoded = decodeGroup(trimmed);
				if (decoded.name && decoded.exercises) importedGroup = decoded as ExerciseGroup;
			} else if (trimmed.startsWith('{')) {
				const parsed = JSON.parse(trimmed);
				if (Array.isArray(parsed)) { isFullBackup = true; backupData = { groups: parsed }; }
				else if (parsed.n && parsed.e) { const d = decodeGroup(trimmed); if (d.name && d.exercises) importedGroup = d as ExerciseGroup; }
				else if (parsed.groups && Array.isArray(parsed.groups)) { isFullBackup = true; backupData = parsed; }
			}

			if (importedGroup) {
				setGroups([...groups, importedGroup]);
				const newMoves = importedGroup.exercises.flatMap(ex => ex.moves.flat()).map(m => m.toLowerCase());
				const updatedPool = Array.from(new Set([...movePool, ...newMoves]));
				const updatedEnabled = Array.from(new Set([...enabledMoves, ...newMoves]));
				setMovePool(updatedPool);
				setEnabledMoves(updatedEnabled);
				save("movePool", JSON.stringify(updatedPool));
				save("enabledMoves", JSON.stringify(updatedEnabled));
				Alert.alert("Success", `Imported "${importedGroup.name}" and updated move library.`);
				setImportData("");
			} else if (isFullBackup) {
				Alert.alert("Import Backup", "This will replace your current library and moves. Continue?", [
					{ text: "Cancel", style: "cancel" },
					{ text: "Replace All", onPress: () => {
						setGroups(backupData.groups);
						if (backupData.movePool) { setMovePool(backupData.movePool); save("movePool", JSON.stringify(backupData.movePool)); }
						if (backupData.enabledMoves) { setEnabledMoves(backupData.enabledMoves); save("enabledMoves", JSON.stringify(backupData.enabledMoves)); }
						Alert.alert("Success", "Full library restored.");
						setImportData("");
					}}
				]);
			} else {
				throw new Error("Invalid format");
			}
		} catch (e) {
			Alert.alert("Error", "Invalid configuration format.");
		}
	};

	if (loading) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator /></View>;

	return (
		<View style={{ flex: 1, backgroundColor: theme.colors.background }}>
			<ScrollView ref={scrollViewRef} contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 100 }}>
				<View style={{ marginTop: 20, marginBottom: 20 }}>
					<Title>Settings</Title>

					<VoiceSelector voices={voices} selectedVoice={selectedVoice} onVoiceChange={setSelectedVoice} />

					<ComboBuilderCard
						isManualMode={isManualMode}
						onToggleMode={() => setIsManualMode(!isManualMode)}
						isEditingLibrary={isEditingLibrary}
						onToggleEditLibrary={() => setIsEditingLibrary(!isEditingLibrary)}
						manualCombos={manualCombos}
						activeManualComboIdx={activeManualComboIdx}
						selectedManualGroupId={selectedManualGroupId}
						manualDelay={manualDelay}
						onAddMoveToCombo={addMoveToManualCombo}
						onSetManualCombos={setManualCombos}
						onSetActiveManualComboIdx={setActiveManualComboIdx}
						onSetSelectedManualGroupId={setSelectedManualGroupId}
						onSetManualDelay={setManualDelay}
						onSaveManualCombo={saveManualCombo}
						movePool={movePool}
						enabledMoves={enabledMoves}
						newMoveInput={newMoveInput}
						onNewMoveInputChange={setNewMoveInput}
						onAddToMovePool={addToMovePool}
						onRemoveFromMovePool={removeFromMovePool}
						onSetEnabledMoves={(moves) => {
							setEnabledMoves(moves);
							save("enabledMoves", JSON.stringify(moves));
						}}
						groups={groups}
						onGenerate={handleAIGenerate}
					/>

					<Title style={{ marginTop: 20 }}>Training Groups Config</Title>
					<Text style={{ color: theme.colors.secondary, marginBottom: 15 }}>Click Edit on any combo to modify or move it to a different group.</Text>

					<Title style={{ marginTop: 20 }}>Backup & Data Tools</Title>
					<BackupCard
						importData={importData}
						onImportDataChange={setImportData}
						onFullBackup={() => shareBackupFile(groups, movePool, enabledMoves)}
						onFullImport={async () => {
							const data = await importBackupFile();
							if (data) {
								setGroups(data.groups);
								setMovePool(data.movePool || DEFAULT_MOVE_POOL);
								setEnabledMoves(data.enabledMoves || DEFAULT_MOVE_POOL);
								Alert.alert("Success", "Backup restored successfully!");
							}
						}}
						onPasteImport={handlePasteImport}
						onClearAll={() => setGroups([])}
					/>
				</View>

				{groups.map(group => (
					<GroupCard
						key={group.id}
						group={group}
						allGroups={groups}
						initiallyEditing={group.id === newlyCreatedGroupId}
						editingExerciseId={editingExerciseId}
						movesEdit={movesEdit}
						delayEdit={delayEdit}
						targetGroupEdit={targetGroupEdit}
						onShare={() => { setGroupToShare(group); setShareModalVisible(true); }}
						onAddExercise={() => addExerciseToGroup(group.id)}
						onDeleteGroup={() => setGroups(g => g.filter(grp => grp.id !== group.id))}
						onSaveGroupEdit={(name) => setGroups(g => g.map(grp => grp.id === group.id ? { ...grp, name } : grp))}
						onStartEditExercise={(id, movesStr, delay, targetId) => {
							setEditingExerciseId(id);
							setMovesEdit(movesStr);
							setDelayEdit(delay);
							setTargetGroupEdit(targetId);
						}}
						onSaveExerciseEdit={(exerciseId) => saveExerciseEdit(group.id, exerciseId)}
						onDeleteExercise={(exerciseId) => setGroups(g => g.map(grp => grp.id === group.id
							? { ...grp, exercises: grp.exercises.filter(e => e.id !== exerciseId) }
							: grp
						))}
						onCancelEditExercise={() => setEditingExerciseId(null)}
						onMovesChange={setMovesEdit}
						onDelayChange={setDelayEdit}
						onTargetGroupChange={setTargetGroupEdit}
					/>
				))}
			</ScrollView>

			<FAB
				icon="folder-plus"
				label="Add Group"
				style={{ position: 'absolute', margin: 16, right: 0, bottom: 0, backgroundColor: theme.colors.primaryContainer }}
				onPress={appendNewGroup}
			/>

			<Portal>
				<Dialog visible={shareModalVisible} onDismiss={() => setShareModalVisible(false)} theme={{ colors: { elevation: { level3: theme.colors.elevation.level2 } } }}>
					<Dialog.Title>Share Training Sequence</Dialog.Title>
					<Dialog.Content>
						<Paragraph>Choose how you want to share "{groupToShare?.name}":</Paragraph>
					</Dialog.Content>
					<Dialog.Actions style={{ flexDirection: 'column', gap: 8, paddingHorizontal: 20, paddingBottom: 20 }}>
						<Button mode="contained" icon="content-copy" style={{ width: '100%' }} onPress={() => {
							if (groupToShare) {
								copyToClipboard(encodeGroup(groupToShare));
								setShareModalVisible(false);
								showSnack("Short code copied to clipboard!");
							}
						}}>Copy Short Code</Button>
						<Button mode="contained-tonal" icon="file-download" style={{ width: '100%' }} onPress={async () => {
							if (groupToShare) {
								await shareBackupFile([groupToShare], movePool, enabledMoves);
								setShareModalVisible(false);
							}
						}}>Share as File (.kbx)</Button>
						<Button onPress={() => setShareModalVisible(false)} style={{ width: '100%' }}>Cancel</Button>
					</Dialog.Actions>
				</Dialog>
			</Portal>

			<Snackbar
				visible={snackbarVisible}
				onDismiss={() => setSnackbarVisible(false)}
				duration={3000}
				style={{ backgroundColor: theme.colors.inverseSurface }}
				action={{ label: 'OK', onPress: () => setSnackbarVisible(false) }}
			>
				{snackbarMsg}
			</Snackbar>
		</View>
	);
}
