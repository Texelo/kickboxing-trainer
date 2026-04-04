import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import ExerciseRow from '../ExerciseRow';
import type { Exercise, ExerciseGroup } from '../../../utils/types';

jest.mock('react-native-paper', () => {
	const React = require('react');
	const { Text, TouchableOpacity, TextInput: RNTextInput } = require('react-native');
	return {
		useTheme: () => ({
			colors: {
				primary: '#6200ee', secondary: '#888', error: '#b00020',
				elevation: { level2: '#eee', level3: '#e0e0e0' },
				secondaryContainer: '#c8f4ef',
			}
		}),
		Text: ({ children }: any) => <Text>{children}</Text>,
		Button: ({ children, onPress }: any) => (
			<TouchableOpacity onPress={onPress} testID={`btn-${children}`}><Text>{children}</Text></TouchableOpacity>
		),
		Chip: ({ children, onPress }: any) => (
			<TouchableOpacity onPress={onPress} testID={`chip-${children}`}><Text>{children}</Text></TouchableOpacity>
		),
		IconButton: ({ onPress, icon }: any) => (
			<TouchableOpacity onPress={onPress} testID={`icon-${icon}`}><Text>{icon}</Text></TouchableOpacity>
		),
		TextInput: ({ value, onChangeText, label }: any) => (
			<RNTextInput testID={`input-${label}`} value={value} onChangeText={onChangeText} placeholder={label} />
		),
	};
});

jest.mock('@react-native-community/slider', () => ({
	__esModule: true,
	default: (props: any) => {
		const React = require('react');
		const { View } = require('react-native');
		return React.createElement(View, { testID: 'slider' });
	},
}));

const item: Exercise = {
	id: 'e1',
	moves: [['jab', 'cross'], ['hook']],
	repDelay: 2000,
};

const groups: ExerciseGroup[] = [
	{ id: 'g1', name: 'Beginners', exercises: [] },
	{ id: 'g2', name: 'Advanced', exercises: [] },
];

const baseProps = {
	item,
	allGroups: groups,
	isEditing: false,
	movesEdit: 'jab, cross + hook',
	delayEdit: 2.0,
	targetGroupEdit: 'g1',
	onStartEdit: jest.fn(),
	onSave: jest.fn(),
	onCancel: jest.fn(),
	onDelete: jest.fn(),
	onMovesChange: jest.fn(),
	onDelayChange: jest.fn(),
	onTargetGroupChange: jest.fn(),
};

describe('ExerciseRow — view mode', () => {
	beforeEach(() => jest.clearAllMocks());

	it('renders each move as a chip', () => {
		render(<ExerciseRow {...baseProps} />);
		expect(screen.getByText('jab')).toBeTruthy();
		expect(screen.getByText('cross')).toBeTruthy();
		expect(screen.getByText('hook')).toBeTruthy();
	});

	it('shows the rep delay in seconds', () => {
		render(<ExerciseRow {...baseProps} />);
		expect(screen.getByText('2.0s delay')).toBeTruthy();
	});

	it('calls onStartEdit when pencil icon is pressed', () => {
		render(<ExerciseRow {...baseProps} />);
		fireEvent.press(screen.getByTestId('icon-pencil-outline'));
		expect(baseProps.onStartEdit).toHaveBeenCalledTimes(1);
	});

	it('calls onDelete when delete icon is pressed', () => {
		render(<ExerciseRow {...baseProps} />);
		fireEvent.press(screen.getByTestId('icon-delete-outline'));
		expect(baseProps.onDelete).toHaveBeenCalledTimes(1);
	});

	it('uses default delay of 1.0s when repDelay is undefined', () => {
		const noDelay: Exercise = { id: 'x', moves: [['jab']] };
		render(<ExerciseRow {...baseProps} item={noDelay} />);
		expect(screen.getByText('1.0s delay')).toBeTruthy();
	});
});

describe('ExerciseRow — edit mode', () => {
	const editingProps = { ...baseProps, isEditing: true };

	beforeEach(() => jest.clearAllMocks());

	it('shows the moves text input', () => {
		render(<ExerciseRow {...editingProps} />);
		expect(screen.getByTestId('input-Moves (comma-sep, + for add-on)')).toBeTruthy();
	});

	it('shows group chips for transfer', () => {
		render(<ExerciseRow {...editingProps} />);
		expect(screen.getByTestId('chip-Beginners')).toBeTruthy();
		expect(screen.getByTestId('chip-Advanced')).toBeTruthy();
	});

	it('calls onSave when Save Combo is pressed', () => {
		render(<ExerciseRow {...editingProps} />);
		fireEvent.press(screen.getByTestId('btn-Save Combo'));
		expect(editingProps.onSave).toHaveBeenCalledTimes(1);
	});

	it('calls onCancel when Cancel is pressed', () => {
		render(<ExerciseRow {...editingProps} />);
		fireEvent.press(screen.getByTestId('btn-Cancel'));
		expect(editingProps.onCancel).toHaveBeenCalledTimes(1);
	});

	it('calls onTargetGroupChange when a group chip is pressed', () => {
		render(<ExerciseRow {...editingProps} />);
		fireEvent.press(screen.getByTestId('chip-Advanced'));
		expect(editingProps.onTargetGroupChange).toHaveBeenCalledWith('g2');
	});

	it('calls onMovesChange when text input changes', () => {
		render(<ExerciseRow {...editingProps} />);
		fireEvent.changeText(screen.getByTestId('input-Moves (comma-sep, + for add-on)'), 'jab, hook');
		expect(editingProps.onMovesChange).toHaveBeenCalledWith('jab, hook');
	});

	it('does not show view-mode icons in edit mode', () => {
		render(<ExerciseRow {...editingProps} />);
		expect(screen.queryByTestId('icon-pencil-outline')).toBeNull();
		expect(screen.queryByTestId('icon-delete-outline')).toBeNull();
	});
});
