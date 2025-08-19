import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Time from "@/components/Time";
import TimeControls from "@/components/TimeControls";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Picker } from "@react-native-picker/picker";
import * as Speech from "expo-speech";
import { useEffect, useState } from "react";
import { Button, StyleSheet } from "react-native";
import { getValueFor } from "../../utils/settings";
import trainer from "../../utils/trainer";
import type { ExerciseGroup } from "../../utils/types";

export default function Stopwatch() {
	const [time, setTime] = useState(0);
	/* -1 => stopped, 0 => paused, 1 => playing */
	const [status, setStatus] = useState(-1);
	const [groups, setGroups] = useState<Array<ExerciseGroup>>([]);
	const [group, setGroup] = useState<ExerciseGroup>();

	const reset = () => {
		setTime(0);
	};
	const handleStart = () => {
		setStatus(1);
	};
	const handlePause = () => {
		setStatus(status === 0 ? 1 : 0);
	};
	const handleStop = () => {
		setStatus(-1);
	};

	useEffect(() => {
		let timerID: number = 0;
		if (status === 1) {
			timerID = setInterval(() => {
				setTime((time) => time + 10);
			}, 10);
		} else {
			clearInterval(timerID);
			if (status === -1) reset();
		}
		return () => {
			clearInterval(timerID);
		};
	}, [status]);

	useEffect(() => {
		getValueFor("groups", (val) => setGroups(JSON.parse(val)));
	}, []);

	function getRandomInt(max: number) {
		return Math.floor(Math.random() * max);
	}
	return (
		<ParallaxScrollView
			headerBackgroundColor={{ light: "#D0D0D0", dark: "#353636" }}
			headerImage={
				<IconSymbol
					size={310}
					color="#808080"
					name="stopwatch"
					style={styles.headerImage}
				/>
			}
		>
			<ThemedView style={styles.titleContainer}>
				<ThemedText type="title">Stop Watch</ThemedText>
			</ThemedView>
			<Time time={time} />
			<TimeControls
				status={status}
				handleStart={handleStart}
				handlePause={handlePause}
				handleStop={handleStop}
			/>

			<Button
				title="Refresh Exercises"
				onPress={() => {
					getValueFor("groups", (val) => setGroups(JSON.parse(val)));
				}}
				//onPress={() => {
				//	groups[0] != null && trainer(groups[0].exercises);
				//}}
			/>
			<Picker
				selectedValue={group?.name}
				onValueChange={(itemValue) =>
					setGroup(groups.find((g) => g.name === itemValue))
				}
			>
				{groups.map((g) => {
					return <Picker.Item key={g.name} label={g.name} value={g.name} />;
				})}
			</Picker>
			<Button
				title="Trainer"
				onPress={() => {
					if (group) trainer(group.exercises);
				}}
				//onPress={() => {
				//	groups[0] != null && trainer(groups[0].exercises);
				//}}
			/>

			<Button
				title="Stop"
				onPress={() => {
					Speech.stop();
				}}
				//onPress={() => {
				//	groups[0] != null && trainer(groups[0].exercises);
				//}}
			/>
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
