import Slider from "@react-native-community/slider";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Chip, IconButton, Text, TextInput, useTheme } from "react-native-paper";
import type { Exercise, ExerciseGroup } from "../../utils/types";

interface Props {
	item: Exercise;
	allGroups: ExerciseGroup[];
	isEditing: boolean;
	movesEdit: string;
	delayEdit: number;
	targetGroupEdit: string;
	onStartEdit: () => void;
	onSave: () => void;
	onCancel: () => void;
	onDelete: () => void;
	onMovesChange: (v: string) => void;
	onDelayChange: (v: number) => void;
	onTargetGroupChange: (v: string) => void;
}

export default function ExerciseRow({
	item, allGroups, isEditing, movesEdit, delayEdit, targetGroupEdit,
	onStartEdit, onSave, onCancel, onDelete, onMovesChange, onDelayChange, onTargetGroupChange
}: Props) {
	const theme = useTheme();
	return (
		<View style={[styles.exerciseRow, { backgroundColor: isEditing ? theme.colors.elevation.level2 : "transparent" }]}>
			{isEditing ? (
				<View style={styles.editorContainer}>
					<TextInput label="Moves (comma-sep, + for add-on)" value={movesEdit} onChangeText={onMovesChange} style={styles.input} />
					<Text style={{ marginTop: 15, marginBottom: 5 }}>Transfer to Group:</Text>
					<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 5 }}>
						{allGroups.map((g) => (
							<Chip
								key={g.id}
								mode={targetGroupEdit === g.id ? "flat" : "outlined"}
								selected={targetGroupEdit === g.id}
								onPress={() => onTargetGroupChange(g.id)}
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
						onValueChange={onDelayChange}
						minimumValue={0.5}
						maximumValue={5}
						step={0.1}
						minimumTrackTintColor={theme.colors.primary}
					/>
					<View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
						<Button onPress={onCancel}>Cancel</Button>
						<Button mode="contained" onPress={onSave}>Save Combo</Button>
					</View>
				</View>
			) : (
				<>
					<View style={{ flex: 1, paddingLeft: 10, paddingVertical: 5 }}>
						<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 5, marginBottom: 5 }}>
							{item.moves.map((combo, ci) => (
								<React.Fragment key={ci}>
									{ci > 0 && <Text style={{ color: theme.colors.secondary, alignSelf: 'center' }}>+</Text>}
									{combo.map((m, mi) => (
										<Chip key={`${ci}-${mi}`} compact style={{ backgroundColor: theme.colors.elevation.level3 }} textStyle={{ fontSize: 12 }}>{m}</Chip>
									))}
								</React.Fragment>
							))}
						</View>
						<Text variant="bodySmall" style={{ color: theme.colors.secondary }}>{((item.repDelay ?? 1000) / 1000).toFixed(1)}s delay</Text>
					</View>
					<IconButton icon="pencil-outline" size={20} onPress={onStartEdit} />
					<IconButton icon="delete-outline" iconColor={theme.colors.error} size={20} onPress={onDelete} />
				</>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	exerciseRow: { flexDirection: "row", alignItems: "center", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#555", paddingVertical: 10, paddingLeft: 10 },
	editorContainer: { flex: 1, paddingRight: 15, paddingVertical: 10 },
	input: { marginBottom: 10, backgroundColor: 'transparent' },
});
