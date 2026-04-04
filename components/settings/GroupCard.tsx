import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Card, Divider, IconButton, TextInput, useTheme } from "react-native-paper";
import type { ExerciseGroup } from "../../utils/types";
import ExerciseRow from "./ExerciseRow";

interface Props {
	group: ExerciseGroup;
	allGroups: ExerciseGroup[];
	initiallyEditing?: boolean;
	editingExerciseId: string | null;
	movesEdit: string;
	delayEdit: number;
	targetGroupEdit: string;
	onShare: () => void;
	onAddExercise: () => void;
	onDeleteGroup: () => void;
	onSaveGroupEdit: (name: string) => void;
	onStartEditExercise: (id: string, movesStr: string, delay: number, targetGroupId: string) => void;
	onSaveExerciseEdit: (exerciseId: string) => void;
	onDeleteExercise: (exerciseId: string) => void;
	onCancelEditExercise: () => void;
	onMovesChange: (v: string) => void;
	onDelayChange: (v: number) => void;
	onTargetGroupChange: (v: string) => void;
}

export default function GroupCard({
	group, allGroups, initiallyEditing = false, editingExerciseId, movesEdit, delayEdit, targetGroupEdit,
	onShare, onAddExercise, onDeleteGroup, onSaveGroupEdit,
	onStartEditExercise, onSaveExerciseEdit, onDeleteExercise, onCancelEditExercise,
	onMovesChange, onDelayChange, onTargetGroupChange
}: Props) {
	const theme = useTheme();
	const [isEditingName, setIsEditingName] = useState(initiallyEditing);
	const [nameEdit, setNameEdit] = useState(group.name);

	return (
		<Card style={styles.groupCard} mode="elevated">
			<Card.Title
				titleVariant="titleLarge"
				title={isEditingName ? "" : group.name}
				right={(props) => (
					<View style={{ flexDirection: 'row', alignItems: 'center' }}>
						<IconButton {...props} icon="share-variant-outline" onPress={onShare} />
						<Button compact onPress={onAddExercise}>+ Combo</Button>
						{!isEditingName && <IconButton {...props} icon="pencil" onPress={() => { setIsEditingName(true); setNameEdit(group.name); }} />}
						{!isEditingName && <IconButton {...props} iconColor={theme.colors.error} icon="delete" onPress={onDeleteGroup} />}
					</View>
				)}
			/>
			{isEditingName && (
				<Card.Content>
					<TextInput label="Group Name" value={nameEdit} onChangeText={setNameEdit} style={styles.input} />
					<Button mode="contained" onPress={() => { onSaveGroupEdit(nameEdit); setIsEditingName(false); }}>Save Group</Button>
				</Card.Content>
			)}

			{group.exercises.length > 0 && <View style={styles.dividerBox}><Divider /></View>}

			{group.exercises.map(item => (
				<ExerciseRow
					key={item.id}
					item={item}
					allGroups={allGroups}
					isEditing={editingExerciseId === item.id}
					movesEdit={movesEdit}
					delayEdit={delayEdit}
					targetGroupEdit={targetGroupEdit}
					onStartEdit={() => onStartEditExercise(item.id, item.moves.map(c => c.join(", ")).join(" + "), (item.repDelay ?? 1000) / 1000, group.id)}
					onSave={() => onSaveExerciseEdit(item.id)}
					onCancel={onCancelEditExercise}
					onDelete={() => onDeleteExercise(item.id)}
					onMovesChange={onMovesChange}
					onDelayChange={onDelayChange}
					onTargetGroupChange={onTargetGroupChange}
				/>
			))}
		</Card>
	);
}

const styles = StyleSheet.create({
	groupCard: { marginTop: 25, marginBottom: 5, borderRadius: 12, overflow: 'hidden' },
	dividerBox: { paddingHorizontal: 10, paddingBottom: 5 },
	input: { marginBottom: 10, backgroundColor: 'transparent' },
});
