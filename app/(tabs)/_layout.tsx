import { Tabs } from "expo-router";
import React from "react";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTheme } from "react-native-paper";

export default function TabLayout() {
	const theme = useTheme();

	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: theme.colors.primary,
				headerShown: true,
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Dashboard",
					tabBarIcon: ({ color }) => (
						<FontAwesome size={28} name="home" color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="stopwatch"
				options={{
					title: "Trainer",
					tabBarIcon: ({ color }) => (
						<FontAwesome size={28} name="clock-o" color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="history"
				options={{
					title: "History",
					tabBarIcon: ({ color }) => (
						<FontAwesome size={28} name="calendar" color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="settings"
				options={{
					title: "Settings",
					tabBarIcon: ({ color }) => (
						<FontAwesome size={28} name="cog" color={color} />
					),
				}}
			/>
		</Tabs>
	);
}
