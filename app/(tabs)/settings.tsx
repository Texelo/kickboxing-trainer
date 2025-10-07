/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */

import Slider from "@react-native-community/slider";
import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, ToastAndroid, View } from "react-native";
//import { MultiSelect } from "react-native-element-dropdown";
import { Collapsible } from "@/components/Collapsible";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Button, Text, TextInput } from "react-native-paper";
import { v4 as uuidv4 } from "uuid";
import { copyToClipboard, getValueFor, save } from "../../utils/settings";
import type { Exercise, ExerciseGroup } from "../../utils/types";

export default function TabTwoScreen() {
	const [key] = useState("groups");
	const [newExercise, setNewExercise] = useState<Exercise>();
	const [newMoves, setNewMoves] = useState<string>();
	const [newDelay, setNewDelay] = useState<number>(1.5);
	const [newGroups, setNewGroups] = useState<Array<ExerciseGroup>>([]);
	const [groups, setGroups] = useState<Array<ExerciseGroup>>([]);
	const [importConfig, setImportConfig] = useState<string>("");
	const [customGroup, setCustomGroup] = useState<{ id: string; name: string }>({
		id: "custom",
		name: "",
	});

	useEffect(() => {
		getValueFor(key, (val) => setGroups(JSON.parse(val)));
	}, []);

	useEffect(() => {
		save(
			key,
			JSON.stringify(groups.filter((group) => group.exercises.length > 0)),
		);
	}, [groups]);

	const groupsCollapsibles = useMemo(() => {
		return groups
			?.filter((group) => group.exercises.length > 0)
			.map((group) => {
				return (
					<Collapsible key={group.id} title={group.name}>
						{group.exercises.map((exercise) => {
							return (
								<View
									key={exercise.id}
									style={{
										borderBottomColor: "black",
										borderBottomWidth: StyleSheet.hairlineWidth,
										gap: 8,
										display: "flex",
									}}
								>
									<ThemedText type="subtitle">Exercise</ThemedText>
									<ThemedText>{exercise.moves}</ThemedText>
									<ThemedText type="subtitle">Delay</ThemedText>
									<ThemedText>{`${(exercise.repDelay ?? 1000) / 1000}s`}</ThemedText>
									<Button
										buttonColor="blue"
										mode="contained"
										onPress={() => {
											setNewDelay((exercise.repDelay ?? 1000) / 1000);
											setNewExercise(exercise);
											setNewMoves(exercise.moves);
											setNewGroups(
												groups.filter((group) =>
													group.exercises.some((e) => e.id === exercise.id),
												),
											);
										}}
									>
										Edit
									</Button>

									<Button
										mode="contained"
										buttonColor="red"
										onPress={() => {
											setGroups((oldGroups) => {
												const groups = [...oldGroups];
												const newGroup = groups.find((g) => g.id === group.id);
												if (!newGroup) return groups;

												var index = newGroup.exercises.findIndex(
													(e) => e.id === exercise.id,
												);
												if (index > -1) {
													newGroup.exercises.splice(index, 1);
												}

												return groups;
											});
										}}
									>
										Delete
									</Button>
								</View>
							);
						})}
					</Collapsible>
				);
			});
	}, [groups]);

	return (
		<ParallaxScrollView
			headerBackgroundColor={{ light: "#D0D0D0", dark: "#353636" }}
			headerImage={
				<IconSymbol
					size={310}
					color="#808080"
					name="chevron.left.forwardslash.chevron.right"
					style={styles.headerImage}
				/>
			}
			//ref={scrollRef}
		>
			<ThemedView style={styles.titleContainer}>
				<ThemedText type="title">Settings</ThemedText>
			</ThemedView>
			<ThemedText>Settings</ThemedText>
			<ThemedText type="subtitle">Exercise</ThemedText>
			<TextInput
				value={newMoves}
				onChangeText={(value) => setNewMoves(value)}
			/>
			<Text>Groups</Text>
			{/*<MultiSelect
				data={[...groups, ...(customGroup.name ? [customGroup] : [])]}
				search
				labelField={"name"}
				valueField={"id"}
				value={newGroups.map((group) => group.id)}
				onChangeText={(searchText) => {
					setCustomGroup({ id: "custom", name: searchText });
				}}
				onChange={(selected) => {
					const newNewGroups = selected.map((item) => {
						if (item === "custom") {
							const group = {
								id: uuidv4(),
								name: customGroup.name,
								exercises: [],
							};
							setGroups([...groups, group]);
							setCustomGroup({ id: "custom", name: "" });
							return group;
						}
						return (
							groups.find((group) => group.id === item) ?? {
								id: uuidv4(),
								name: "blah",
								exercises: [],
							}
						);
					});
					setNewGroups(newNewGroups);
				}}
			/>*/}
			{/*<TextInput
				value={newGroup}
				onChangeText={(value) => setNewGroup(value)}
			/>*/}
			<ThemedText type="subtitle">Delay</ThemedText>
			<ThemedText>{newDelay}</ThemedText>
			<Slider
				style={{ width: "100%", height: 40 }}
				value={newDelay}
				onValueChange={(value) => setNewDelay(value)}
				step={0.1}
				minimumValue={0}
				maximumValue={10}
			/>
			<Button
				mode="contained"
				onPress={() => {
					if (!newDelay || !newMoves?.trim().toLowerCase()) {
						ToastAndroid.show("Delay or exercise not set", ToastAndroid.SHORT);
						return;
					}

					const exercise = newExercise ?? {
						id: uuidv4(),
						moves: newMoves.trim().toLowerCase(),
						repDelay: newDelay * 1000,
					};

					exercise.repDelay = newDelay * 1000;
					exercise.moves = newMoves.trim().toLowerCase();

					setGroups((oldGroups) => {
						const groups = [...oldGroups];

						groups.forEach((group) => {
							const exerciseIndex = group.exercises.findIndex(
								(e) => e.id === exercise.id,
							);
							if (newGroups.some((g) => group.id === g.id)) {
								if (exerciseIndex > -1) {
									group.exercises[exerciseIndex] = exercise;
								} else {
									group.exercises.push(exercise);
								}
							} else if (exerciseIndex > -1) {
								group.exercises.splice(exerciseIndex, 1);
							}
						});

						return groups;
					});
					ToastAndroid.show("Saved exercise", ToastAndroid.SHORT);
					setNewDelay(1);
					setNewExercise(undefined);
					setNewGroups([]);
					setNewMoves(undefined);
				}}
			>
				Save settings
			</Button>
			<Button
				mode="contained"
				onPress={() => {
					copyToClipboard(JSON.stringify(groups));
					ToastAndroid.show("Copied to clipboard", ToastAndroid.SHORT);
					//getValueFor(key);
				}}
			>
				Export
			</Button>
			<ThemedText>import</ThemedText>
			<TextInput onChangeText={(value) => setImportConfig(value)} />
			<Button
				mode="contained"
				onPress={() => {
					const trimmedConfig = importConfig.trim();
					if (!trimmedConfig) {
						ToastAndroid.show("Nothing to import", ToastAndroid.SHORT);
						return;
					}
					try {
						const parsed = JSON.parse(trimmedConfig);
						setGroups(parsed);
						console.log("imported config");
						console.log(trimmedConfig);
						console.log(parsed);
						ToastAndroid.show("Imported new config", ToastAndroid.SHORT);
					} catch (error) {
						ToastAndroid.show("Config not valid", ToastAndroid.SHORT);
					}
				}}
			>
				Import
			</Button>
			<Button
				mode="contained"
				buttonColor="red"
				onPress={() => {
					setGroups([]);
					ToastAndroid.show("Cleared config", ToastAndroid.SHORT);
				}}
			>
				Clear
			</Button>
			{groupsCollapsibles}
		</ParallaxScrollView>
	);
}

const styles = StyleSheet.create({
	headerImage: {
		color: "#808080",
		bottom: -90,
		left: -35,
		position: "absolute",
	},
	titleContainer: {
		flexDirection: "row",
		gap: 8,
	},
});
