import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import CounterControl from '../CounterControl';

jest.mock('react-native-paper', () => {
	const React = require('react');
	const { Text, View, TouchableOpacity } = require('react-native');
	return {
		Text: ({ children }: any) => <Text>{children}</Text>,
		IconButton: ({ onPress, icon, disabled }: any) => (
			<TouchableOpacity onPress={onPress} disabled={disabled} testID={`btn-${icon}`}>
				<Text>{icon}</Text>
			</TouchableOpacity>
		),
	};
});

describe('CounterControl', () => {
	const onDecrement = jest.fn();
	const onIncrement = jest.fn();

	beforeEach(() => jest.clearAllMocks());

	it('renders label and numeric value', () => {
		render(<CounterControl label="Rounds" value={3} onDecrement={onDecrement} onIncrement={onIncrement} />);
		expect(screen.getByText('Rounds')).toBeTruthy();
		expect(screen.getByText('3')).toBeTruthy();
	});

	it('renders string value', () => {
		render(<CounterControl label="Work (min)" value="1.5" onDecrement={onDecrement} onIncrement={onIncrement} />);
		expect(screen.getByText('1.5')).toBeTruthy();
	});

	it('calls onDecrement when minus button is pressed', () => {
		render(<CounterControl label="Rounds" value={3} onDecrement={onDecrement} onIncrement={onIncrement} />);
		fireEvent.press(screen.getByTestId('btn-minus'));
		expect(onDecrement).toHaveBeenCalledTimes(1);
		expect(onIncrement).not.toHaveBeenCalled();
	});

	it('calls onIncrement when plus button is pressed', () => {
		render(<CounterControl label="Rounds" value={3} onDecrement={onDecrement} onIncrement={onIncrement} />);
		fireEvent.press(screen.getByTestId('btn-plus'));
		expect(onIncrement).toHaveBeenCalledTimes(1);
		expect(onDecrement).not.toHaveBeenCalled();
	});
});
