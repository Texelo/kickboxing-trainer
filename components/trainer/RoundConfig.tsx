import React from "react";
import { View } from "react-native";
import { Button, Card, Divider, Text, useTheme } from "react-native-paper";
import CounterControl from "./CounterControl";

interface Props {
	numRounds: number;
	workMins: number;
	restSecs: number;
	reps: number;
	repeatCombo: boolean;
	onRoundsChange: (v: number) => void;
	onWorkMinsChange: (v: number) => void;
	onRestSecsChange: (v: number) => void;
	onRepsChange: (v: number) => void;
	onRepeatComboChange: (v: boolean) => void;
}

export default function RoundConfig({ numRounds, workMins, restSecs, reps, repeatCombo, onRoundsChange, onWorkMinsChange, onRestSecsChange, onRepsChange, onRepeatComboChange }: Props) {
	const theme = useTheme();
	const separator = <View style={{ width: 1, backgroundColor: theme.colors.outlineVariant, height: '80%', alignSelf: 'center' }} />;
	return (
		<Card style={{ backgroundColor: theme.colors.elevation.level1, marginBottom: 10 }} mode="contained">
			<Card.Content style={{ flexDirection: 'column' }}>
				<View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
					<CounterControl label="Rounds" value={numRounds} onDecrement={() => onRoundsChange(Math.max(1, numRounds - 1))} onIncrement={() => onRoundsChange(numRounds + 1)} />
					{separator}
					<CounterControl label="Work (min)" value={workMins} onDecrement={() => onWorkMinsChange(Math.max(0.5, workMins - 0.5))} onIncrement={() => onWorkMinsChange(workMins + 0.5)} />
					{separator}
					<CounterControl label="Rest (sec)" value={restSecs} onDecrement={() => onRestSecsChange(Math.max(10, restSecs - 10))} onIncrement={() => onRestSecsChange(restSecs + 10)} />
				</View>

				<Divider style={{ marginVertical: 12 }} />

				<View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
					<CounterControl label="Reps" value={reps} onDecrement={() => onRepsChange(Math.max(1, reps - 1))} onIncrement={() => onRepsChange(reps + 1)} />
					{separator}
					<View style={{ alignItems: 'center' }}>
						<Text variant="labelSmall">Repeat combo</Text>
						<Button mode={repeatCombo ? "contained" : "contained-tonal"} icon="repeat" onPress={() => onRepeatComboChange(!repeatCombo)} compact>
							{repeatCombo ? "On" : "Off"}
						</Button>
					</View>
				</View>
			</Card.Content>
		</Card>
	);
}
