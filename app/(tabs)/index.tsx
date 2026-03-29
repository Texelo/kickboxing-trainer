import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Button, Card, Paragraph, Text, Title, useTheme } from "react-native-paper";

export default function HomeScreen() {
	const theme = useTheme();
	const router = useRouter();

	return (
		<View style={[styles.container, { backgroundColor: theme.colors.background }]}>
			<View style={styles.header}>
				<Text variant="displaySmall" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>Kickboxing Trainer</Text>
			</View>

			<View style={styles.cards}>
				<Card style={styles.card} mode="elevated" onPress={() => router.push("/stopwatch")}>
					<Card.Content>
						<Title>Start Training</Title>
						<Paragraph>Jump right into your personalized kickboxing routine.</Paragraph>
					</Card.Content>
					<Card.Actions>
						<Button icon="play" mode="contained" onPress={() => router.push("/stopwatch")}>Go</Button>
					</Card.Actions>
				</Card>

				<Card style={styles.card} mode="elevated" onPress={() => router.push("/settings")}>
					<Card.Content>
						<Title>Configure Exercises</Title>
						<Paragraph>Add custom combinations, adjust delays and manage groups.</Paragraph>
					</Card.Content>
					<Card.Actions>
						<Button icon="cog" mode="elevated" onPress={() => router.push("/settings")}>Setup</Button>
					</Card.Actions>
				</Card>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
	},
	header: {
		marginTop: 40,
		marginBottom: 40,
		alignItems: 'center',
	},
	cards: {
		gap: 20,
	},
	card: {
		borderRadius: 12,
	}
});
