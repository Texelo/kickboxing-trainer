import React from "react";
import { View } from "react-native";
import { IconButton, Text } from "react-native-paper";

interface Props {
	label: string;
	value: number | string;
	onDecrement: () => void;
	onIncrement: () => void;
}

export default function CounterControl({ label, value, onDecrement, onIncrement }: Props) {
	return (
		<View style={{ alignItems: 'center' }}>
			<Text variant="labelSmall">{label}</Text>
			<View style={{ flexDirection: 'row', alignItems: 'center' }}>
				<IconButton icon="minus" size={16} onPress={onDecrement} />
				<Text variant="titleMedium">{value}</Text>
				<IconButton icon="plus" size={16} onPress={onIncrement} />
			</View>
		</View>
	);
}
