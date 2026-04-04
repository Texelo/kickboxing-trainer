import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import GroupSelector from '../GroupSelector';
import type { ExerciseGroup } from '../../../utils/types';

jest.mock('react-native-paper', () => {
	const React = require('react');
	const { Text, TouchableOpacity } = require('react-native');
	return {
		useTheme: () => ({
			colors: {
				primary: '#6200ee', outline: '#999',
				primaryContainer: '#e8d5fd', elevation: { level1: '#f5f5f5', level2: '#eee' },
				secondary: '#888',
			}
		}),
		Text: ({ children }: any) => <Text>{children}</Text>,
		Chip: ({ children, onPress, selected }: any) => (
			<TouchableOpacity onPress={onPress} testID={`chip-${children}`} accessibilityState={{ selected }}>
				<Text>{children}</Text>
			</TouchableOpacity>
		),
	};
});

const groups: ExerciseGroup[] = [
	{
		id: 'g1', name: 'Beginners',
		exercises: [{ id: 'e1', moves: [['jab', 'cross']], repDelay: 1500 }]
	},
	{ id: 'g2', name: 'Advanced', exercises: [] },
];

describe('GroupSelector', () => {
	const onSelect = jest.fn();

	beforeEach(() => jest.clearAllMocks());

	it('renders a chip for each group', () => {
		render(<GroupSelector groups={groups} selectedGroupName={undefined} onSelect={onSelect} />);
		expect(screen.getByTestId('chip-Beginners')).toBeTruthy();
		expect(screen.getByTestId('chip-Advanced')).toBeTruthy();
	});

	it('shows empty-state chip when there are no groups', () => {
		render(<GroupSelector groups={[]} selectedGroupName={undefined} onSelect={onSelect} />);
		expect(screen.getByText('No groups available')).toBeTruthy();
	});

	it('calls onSelect with group name when chip is pressed', () => {
		render(<GroupSelector groups={groups} selectedGroupName={undefined} onSelect={onSelect} />);
		fireEvent.press(screen.getByTestId('chip-Beginners'));
		expect(onSelect).toHaveBeenCalledWith('Beginners');
	});

	it('shows exercise preview chips for the selected group', () => {
		render(<GroupSelector groups={groups} selectedGroupName="Beginners" onSelect={onSelect} />);
		expect(screen.getByText('jab • cross')).toBeTruthy();
	});

	it('does not show exercise chips when no group is selected', () => {
		render(<GroupSelector groups={groups} selectedGroupName={undefined} onSelect={onSelect} />);
		expect(screen.queryByText('jab • cross')).toBeNull();
	});

	it('does not show exercise chips for a group with no exercises', () => {
		render(<GroupSelector groups={groups} selectedGroupName="Advanced" onSelect={onSelect} />);
		expect(screen.queryByText('jab • cross')).toBeNull();
	});

	it('joins add-on combos with " + " separator', () => {
		const groupWithAddon: ExerciseGroup[] = [{
			id: 'g1', name: 'Group',
			exercises: [{ id: 'e1', moves: [['jab'], ['cross']], repDelay: 1500 }]
		}];
		render(<GroupSelector groups={groupWithAddon} selectedGroupName="Group" onSelect={onSelect} />);
		expect(screen.getByText('jab + cross')).toBeTruthy();
	});
});
