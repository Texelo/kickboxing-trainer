import React from 'react';
import { render, screen } from '@testing-library/react-native';
import HistoryScreen from '../(tabs)/history';
import { getWorkouts, clearStats } from '../../utils/stats';

// React Native Paper Mocks
jest.mock('react-native-paper', () => {
    const React = require('react');
    const { Text, View } = require('react-native');
    return {
        useTheme: () => ({ colors: { primary: 'blue', background: 'white' } }),
        Surface: ({children}: any) => <View>{children}</View>,
        Text: ({children, variant}: any) => <Text>{children}</Text>,
        Card: ({children}: any) => <View>{children}</View>,
        List: {
            Item: (props: any) => <View>{props.title}</View>,
            Icon: () => null
        },
        Divider: () => null,
        IconButton: () => null
    };
});

// Expo Router Mock
jest.mock('expo-router', () => ({
    useFocusEffect: (cb: any) => React.useEffect(cb, [])
}));

// Stats helper mock
jest.mock('../../utils/stats');

describe('History Screen Rendering', () => {
    const mockSessions = [
        { date: '2025-01-01T10:00:00Z', duration: 300, rounds: 3, group: 'Combo 1' },
        { date: '2025-01-02T10:00:00Z', duration: 600, rounds: 6, group: 'Combo 2' }
    ];

    beforeEach(() => {
        (getWorkouts as jest.Mock).mockResolvedValue(mockSessions);
    });

    it('should correctly calculate and display total rounds', async () => {
        // Render
        render(<HistoryScreen />);
        
        // Wait for focus effect to run
        expect(await screen.findByText('9')).toBeTruthy(); // 3 + 6 = 9
    });

    it('should correctly calculate and display total time', async () => {
        render(<HistoryScreen />);
        
        // 900 seconds total = 15.0 minutes
        expect(await screen.findByText('15.0m')).toBeTruthy();
    });

    it('should show empty state if no history', async () => {
        (getWorkouts as jest.Mock).mockResolvedValue([]);
        render(<HistoryScreen />);
        
        expect(await screen.findByText('Start training to see your history!')).toBeTruthy();
    });
});
