import Slider from "@react-native-community/slider";
import { Picker } from "@react-native-picker/picker";
import React from "react";
import { View } from "react-native";
import { Button, Card, Chip, Divider, IconButton, Text, TextInput, useTheme } from "react-native-paper";
import type { ExerciseGroup } from "../../utils/types";

interface Props {
	isManualMode: boolean;
	onToggleMode: () => void;
	isEditingLibrary: boolean;
	onToggleEditLibrary: () => void;
	manualCombos: string[][];
	activeManualComboIdx: number;
	selectedManualGroupId: string;
	manualDelay: number;
	onAddMoveToCombo: (move: string) => void;
	onSetManualCombos: (combos: string[][]) => void;
	onSetActiveManualComboIdx: (idx: number) => void;
	onSetSelectedManualGroupId: (id: string) => void;
	onSetManualDelay: (d: number) => void;
	onSaveManualCombo: () => void;
	movePool: string[];
	enabledMoves: string[];
	newMoveInput: string;
	onNewMoveInputChange: (v: string) => void;
	onAddToMovePool: () => void;
	onRemoveFromMovePool: (m: string) => void;
	onSetEnabledMoves: (moves: string[]) => void;
	groups: ExerciseGroup[];
	onGenerate: () => void;
}

export default function ComboBuilderCard({
	isManualMode, onToggleMode, isEditingLibrary, onToggleEditLibrary,
	manualCombos, activeManualComboIdx, selectedManualGroupId, manualDelay,
	onAddMoveToCombo, onSetManualCombos, onSetActiveManualComboIdx, onSetSelectedManualGroupId, onSetManualDelay, onSaveManualCombo,
	movePool, enabledMoves, newMoveInput, onNewMoveInputChange, onAddToMovePool, onRemoveFromMovePool, onSetEnabledMoves,
	groups, onGenerate
}: Props) {
	const theme = useTheme();

	return (
		<Card style={{ backgroundColor: theme.colors.elevation.level2, marginTop: 20, borderRadius: 12, overflow: 'hidden' }}>
			<Card.Title
				title="Combo Generator & Library"
				subtitle={isManualMode ? "Manual Combo Builder" : "Random Generator Moves"}
				left={(props) => <IconButton {...props} icon="auto-fix" />}
				right={(props) => (
					<View style={{ flexDirection: 'row' }}>
						<IconButton {...props} icon={isEditingLibrary ? "check" : "pencil"} onPress={onToggleEditLibrary} />
						<IconButton {...props} icon={isManualMode ? "dice-5" : "gesture-tap"} onPress={onToggleMode} />
					</View>
				)}
			/>
			<Card.Content>
				{isManualMode ? (
					<View style={{ marginBottom: 20, padding: 10, borderRadius: 10, backgroundColor: theme.colors.elevation.level3 }}>
						<Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>Current Combo Builder</Text>

						{manualCombos.map((combo, comboIdx) => (
							<View key={comboIdx} style={{ marginBottom: 15 }}>
								<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 }}>
									<Text variant="labelSmall" style={{ color: theme.colors.secondary, fontWeight: '600' }}>
										{comboIdx === 0 ? 'Base' : `+ Add-on ${comboIdx}`}
									</Text>
									{comboIdx > 0 && (
										<IconButton
											icon="delete-outline"
											size={16}
											iconColor={theme.colors.error}
											onPress={() => {
												const next = manualCombos.filter((_, i) => i !== comboIdx);
												onSetManualCombos(next);
												if (activeManualComboIdx >= next.length) onSetActiveManualComboIdx(Math.max(0, next.length - 1));
											}}
										/>
									)}
								</View>
								<View style={{
									flexDirection: 'row', flexWrap: 'wrap', gap: 6, minHeight: 30,
									backgroundColor: activeManualComboIdx === comboIdx ? theme.colors.elevation.level2 : 'transparent',
									padding: 8, borderRadius: 6
								}}>
									{combo.map((m, mIdx) => (
										<Chip
											key={`${comboIdx}-${m}-${mIdx}`}
											onClose={activeManualComboIdx === comboIdx ? () => {
												const next = [...manualCombos];
												next[comboIdx] = combo.filter((_, i) => i !== mIdx);
												onSetManualCombos(next);
											} : undefined}
											style={{ backgroundColor: activeManualComboIdx === comboIdx ? theme.colors.primaryContainer : theme.colors.elevation.level1 }}
										>
											{m}
										</Chip>
									))}
									{combo.length === 0 && activeManualComboIdx === comboIdx && (
										<Text style={{ color: theme.colors.secondary, fontStyle: 'italic', alignSelf: 'center' }}>Click moves below...</Text>
									)}
								</View>
							</View>
						))}

						<View style={{ flexDirection: 'row', gap: 8, marginBottom: 15 }}>
							<Button
								mode="contained-tonal"
								icon="plus"
								onPress={() => {
									onSetManualCombos([...manualCombos, []]);
									onSetActiveManualComboIdx(manualCombos.length);
								}}
								style={{ flex: 1 }}
							>
								Add Add-on
							</Button>
						</View>

						<View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 }}>
							<View style={{ flex: 2, borderRadius: 8, overflow: 'hidden', backgroundColor: theme.colors.elevation.level4 }}>
								<Picker
									selectedValue={selectedManualGroupId || (groups.length > 0 ? groups[0].id : "")}
									onValueChange={onSetSelectedManualGroupId}
									style={{ color: theme.colors.onSurface }}
									dropdownIconColor={theme.colors.onSurface}
								>
									{groups.map(g => <Picker.Item key={g.id} label={`Save to: ${g.name}`} value={g.id} />)}
								</Picker>
							</View>
							<Button mode="contained" icon="content-save" onPress={onSaveManualCombo} style={{ flex: 1 }}>Save</Button>
							<IconButton icon="refresh" onPress={() => { onSetManualCombos([[]]); onSetActiveManualComboIdx(0); }} />
						</View>

						<View style={{ marginTop: 15 }}>
							<Text variant="bodySmall">Combo Delay: {manualDelay.toFixed(1)}s</Text>
							<Slider
								style={{ width: "100%", height: 30 }}
								value={manualDelay}
								onValueChange={onSetManualDelay}
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
						onPress={onGenerate}
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
							onChangeText={onNewMoveInputChange}
							style={{ flex: 1, height: 45 }}
							mode="outlined"
						/>
						<IconButton
							icon="plus-circle"
							size={32}
							iconColor={theme.colors.primary}
							onPress={onAddToMovePool}
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
										onAddMoveToCombo(m);
									} else {
										onSetEnabledMoves(isEnabled ? enabledMoves.filter(x => x !== m) : [...enabledMoves, m]);
									}
								}}
								onClose={isEditingLibrary ? () => onRemoveFromMovePool(m) : undefined}
								mode={isEnabled ? "flat" : "outlined"}
							>
								{m}
							</Chip>
						);
					})}
				</View>
			</Card.Content>
		</Card>
	);
}
