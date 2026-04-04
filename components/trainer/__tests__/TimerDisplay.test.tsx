import React from 'react';
import { render, screen } from '@testing-library/react-native';
import TimerDisplay from '../TimerDisplay';

jest.mock('react-native-paper', () => {
	const React = require('react');
	const { Text, View } = require('react-native');
	return {
		useTheme: () => ({
			colors: { primary: '#6200ee', secondary: '#888', elevation: { level2: '#eee' } }
		}),
		Surface: ({ children }: any) => <View>{children}</View>,
		Text: ({ children }: any) => <Text>{children}</Text>,
	};
});

describe('TimerDisplay', () => {
	it('shows round counter', () => {
		render(<TimerDisplay currentRound={2} numRounds={5} time={0} phase="work" />);
		expect(screen.getByText('Round 2 of 5')).toBeTruthy();
	});

	it('shows phase label', () => {
		render(<TimerDisplay currentRound={1} numRounds={3} time={0} phase="rest" />);
		expect(screen.getByText('rest')).toBeTruthy();
	});

	it('formats zero time as 00:00.00', () => {
		render(<TimerDisplay currentRound={1} numRounds={3} time={0} phase="work" />);
		expect(screen.getByText('00:00.00')).toBeTruthy();
	});

	it('formats 3 minutes correctly (18000 hundredths)', () => {
		render(<TimerDisplay currentRound={1} numRounds={3} time={18000} phase="work" />);
		expect(screen.getByText('03:00.00')).toBeTruthy();
	});

	it('formats mixed time correctly', () => {
		// 12345 hundredths = 123 seconds + 45 hundredths = 2min 3sec .45
		render(<TimerDisplay currentRound={1} numRounds={3} time={12345} phase="work" />);
		expect(screen.getByText('02:03.45')).toBeTruthy();
	});

	it('pads single-digit minutes and seconds', () => {
		// 100 hundredths = 1 second
		render(<TimerDisplay currentRound={1} numRounds={3} time={100} phase="work" />);
		expect(screen.getByText('00:01.00')).toBeTruthy();
	});
});
