import React, { useEffect, useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { Text, Card, List, Divider, useTheme, Surface, IconButton } from "react-native-paper";
import { getWorkouts, clearStats, WorkoutSession } from "../../utils/stats";
import { useFocusEffect } from "expo-router";

function formatDuration(sec: number) {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins}m ${s}s`;
}

export default function HistoryScreen() {
    const theme = useTheme();
    const [history, setHistory] = useState<WorkoutSession[]>([]);
    
    const load = async () => {
        const h = await getWorkouts();
        setHistory(h.reverse()); // Show most recent first
    };

    useFocusEffect(
        React.useCallback(() => {
            load();
        }, [])
    );

    const totalSeconds = history.reduce((acc, curr) => acc + curr.duration, 0);
    const totalRounds = history.reduce((acc, curr) => acc + curr.rounds, 0);

    // Heatmap Logic: Simplified 30-day view
    const last30Days = Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
    }).reverse();

    const statsMap: Record<string, number> = {};
    history.forEach(s => {
        const day = s.date.split('T')[0];
        statsMap[day] = (statsMap[day] || 0) + s.duration;
    });

    const getIntensity = (day: string) => {
        const dur = statsMap[day] || 0;
        if (dur === 0) return '#222';
        if (dur < 300) return '#004d40';
        if (dur < 600) return '#00897b';
        if (dur < 1200) return '#26a69a';
        return '#80cbc4';
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={{ padding: 20 }}>
            <Text variant="headlineMedium" style={{ marginTop: 20, marginBottom: 10 }}>Training Stats</Text>
            
            <View style={{ flexDirection: 'row', gap: 15, marginBottom: 20 }}>
                <Surface style={styles.statCard} elevation={1}>
                    <Text variant="labelSmall">Total Time</Text>
                    <Text variant="titleLarge">{(totalSeconds / 60).toFixed(1)}m</Text>
                </Surface>
                <Surface style={styles.statCard} elevation={1}>
                    <Text variant="labelSmall">Total Rounds</Text>
                    <Text variant="titleLarge">{totalRounds}</Text>
                </Surface>
            </View>

            <Card style={{ marginBottom: 20, padding: 10 }}>
                <Text variant="labelLarge" style={{ marginBottom: 10, opacity: 0.7 }}>Last 30 Days Activity</Text>
                <View style={styles.heatmap}>
                    {last30Days.map(day => (
                        <View key={day} style={[styles.cell, { backgroundColor: getIntensity(day) }]} />
                    ))}
                </View>
            </Card>

            <Text variant="titleLarge" style={{ marginBottom: 15 }}>Recent Sessions</Text>
            {history.length === 0 ? (
                <Text variant="bodyMedium" style={{ textAlign: 'center', opacity: 0.5, marginTop: 40 }}>Start training to see your history!</Text>
            ) : (
                history.slice(0, 10).map((item, index) => (
                    <Card key={index} style={{ marginBottom: 10 }}>
                        <List.Item
                            title={item.group}
                            description={`${new Date(item.date).toLocaleDateString()} • ${formatDuration(item.duration)} • ${item.rounds} rounds`}
                            left={props => <List.Icon {...props} icon="calendar-check" />}
                        />
                    </Card>
                ))
            )}

            <Divider style={{ marginVertical: 30 }} />
            <IconButton icon="delete-outline" iconColor={theme.colors.error} style={{ alignSelf: 'center' }} onPress={async () => { await clearStats(); load(); }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    statCard: { flex: 1, padding: 15, borderRadius: 12, alignItems: 'center' },
    heatmap: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'center' },
    cell: { width: 18, height: 18, borderRadius: 3 }
});
