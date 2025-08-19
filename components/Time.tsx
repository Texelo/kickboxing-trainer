import { StyleSheet, Text, View } from "react-native";

const styles = StyleSheet.create({
	row: {
		display: "flex",
		width: "100%",
		alignItems: "center",
	},
	time: {
		fontSize: 48,
		fontWeight: "bold",
		color: "#272727",
	},
});

interface TimeProps {
	time: number;
}
export default function Time({ time }: TimeProps) {
	const transformMinutes = () => {
		const convertedValue = Math.floor((time / 60000) % 60);
		const formattedValue = ("0" + convertedValue).slice(-2);
		return formattedValue;
	};
	const transformSeconds = () => {
		const convertedValue = Math.floor((time / 1000) % 60);
		const formattedValue = ("0" + convertedValue).slice(-2);
		return formattedValue;
	};
	const transformMilliseconds = () => {
		const convertedValue = Math.floor((time / 10) % 100);
		const formattedValue = ("0" + convertedValue).slice(-2);
		return formattedValue;
	};
	return (
		<View style={styles.row}>
			<Text style={styles.time}>
				{transformMinutes()} :<Text> </Text>
				{transformSeconds()} :<Text> </Text>
				{transformMilliseconds()}
			</Text>
		</View>
	);
}
