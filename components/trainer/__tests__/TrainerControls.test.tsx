import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import TrainerControls from '../TrainerControls';

jest.mock('react-native-paper', () => {
	const React = require('react');
	const { View, TouchableOpacity, Text } = require('react-native');
	return {
		useTheme: () => ({
			colors: { primary: '#6200ee', secondary: '#888', error: '#b00020' }
		}),
		IconButton: ({ onPress, icon, disabled }: any) => (
			<TouchableOpacity onPress={onPress} testID={`icon-${icon}`} accessibilityState={{ disabled: !!disabled }}>
				<Text>{icon}</Text>
			</TouchableOpacity>
		),
	};
});

const defaultProps = {
	status: -1,
	canStart: true,
	onStart: jest.fn(),
	onPause: jest.fn(),
	onStop: jest.fn(),
	onSkip: jest.fn(),
	onRewind: jest.fn(),
};

describe('TrainerControls', () => {
	beforeEach(() => jest.clearAllMocks());

	it('shows play button when not active', () => {
		render(<TrainerControls {...defaultProps} status={-1} />);
		expect(screen.getByTestId('icon-play-circle')).toBeTruthy();
		expect(screen.queryByTestId('icon-pause-circle')).toBeNull();
	});

	it('shows pause button when active (status === 1)', () => {
		render(<TrainerControls {...defaultProps} status={1} />);
		expect(screen.getByTestId('icon-pause-circle')).toBeTruthy();
		expect(screen.queryByTestId('icon-play-circle')).toBeNull();
	});

	it('shows play button when paused (status === 0)', () => {
		render(<TrainerControls {...defaultProps} status={0} />);
		expect(screen.getByTestId('icon-play-circle')).toBeTruthy();
	});

	it('calls onStart when play is pressed', () => {
		render(<TrainerControls {...defaultProps} status={-1} />);
		fireEvent.press(screen.getByTestId('icon-play-circle'));
		expect(defaultProps.onStart).toHaveBeenCalledTimes(1);
	});

	it('calls onPause when pause is pressed', () => {
		render(<TrainerControls {...defaultProps} status={1} />);
		fireEvent.press(screen.getByTestId('icon-pause-circle'));
		expect(defaultProps.onPause).toHaveBeenCalledTimes(1);
	});

	it('calls onStop when stop is pressed', () => {
		render(<TrainerControls {...defaultProps} status={1} />);
		fireEvent.press(screen.getByTestId('icon-stop-circle'));
		expect(defaultProps.onStop).toHaveBeenCalledTimes(1);
	});

	it('calls onSkip when skip-next is pressed', () => {
		render(<TrainerControls {...defaultProps} status={1} />);
		fireEvent.press(screen.getByTestId('icon-skip-next'));
		expect(defaultProps.onSkip).toHaveBeenCalledTimes(1);
	});

	it('calls onRewind when skip-previous is pressed', () => {
		render(<TrainerControls {...defaultProps} status={1} />);
		fireEvent.press(screen.getByTestId('icon-skip-previous'));
		expect(defaultProps.onRewind).toHaveBeenCalledTimes(1);
	});

	it('disables play button when canStart is false', () => {
		render(<TrainerControls {...defaultProps} status={-1} canStart={false} />);
		expect(screen.getByTestId('icon-play-circle')).toBeDisabled();
	});

	it('disables stop and skip buttons when status is -1', () => {
		render(<TrainerControls {...defaultProps} status={-1} />);
		expect(screen.getByTestId('icon-stop-circle')).toBeDisabled();
		expect(screen.getByTestId('icon-skip-next')).toBeDisabled();
		expect(screen.getByTestId('icon-skip-previous')).toBeDisabled();
	});
});
