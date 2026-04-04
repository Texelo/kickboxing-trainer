import React from "react";
import { ScrollView, View } from "react-native";
import { Chip, Text, useTheme } from "react-native-paper";
import type { ExerciseGroup } from "../../utils/types";

interface Props {
	groups: ExerciseGroup[];
	selectedGroupName: string | undefined;
	onSelect: (name: string) => void;
}

export default function GroupSelector({ groups, selectedGroupName, onSelect }: Props) {
	const theme = useTheme();
	const selectedGroup = groups.find(g => g.name === selectedGroupName);
	return (
		<>
			<Text variant="titleSmall" style={{ alignSelf: 'center', marginBottom: 10, color: theme.colors.outline }}>Select Training Sequence</Text>
			<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 15, marginBottom: 20 }}>
				{groups.length === 0 && <Chip icon="alert">No groups available</Chip>}
				{groups.map((g) => (
					<Chip
						key={g.id}
						mode={selectedGroupName === g.name ? "flat" : "outlined"}
						selected={selectedGroupName === g.name}
						onPress={() => onSelect(g.name)}
						style={selectedGroupName === g.name ? { backgroundColor: theme.colors.primaryContainer } : { backgroundColor: theme.colors.elevation.level1 }}
					>
						{g.name}
					</Chip>
				))}
			</ScrollView>
			{selectedGroup && selectedGroup.exercises.length > 0 && (
				<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 15, marginBottom: 20, justifyContent: 'center' }}>
					{selectedGroup.exercises.map(ex => (
						<Chip key={ex.id} compact style={{ backgroundColor: theme.colors.elevation.level2 }} textStyle={{ fontSize: 13, color: theme.colors.secondary }}>
							{ex.moves.map((combo, ci) => (ci > 0 ? ` + ${combo.join(" • ")}` : combo.join(" • "))).join("")}
						</Chip>
					))}
				</View>
			)}
		</>
	);
}
