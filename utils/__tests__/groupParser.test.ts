import { parseGroups } from '../groupParser';
import { DEFAULT_GROUPS } from '../defaults';

describe('parseGroups', () => {
	it('returns DEFAULT_GROUPS for null', () => {
		expect(parseGroups(null)).toEqual(DEFAULT_GROUPS);
	});

	it('returns DEFAULT_GROUPS for an empty array', () => {
		expect(parseGroups('[]')).toEqual(DEFAULT_GROUPS);
	});

	it('returns DEFAULT_GROUPS and logs error for invalid JSON', () => {
		const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
		expect(parseGroups('not valid json')).toEqual(DEFAULT_GROUPS);
		expect(consoleSpy).toHaveBeenCalled();
		consoleSpy.mockRestore();
	});

	it('preserves group id and name', () => {
		const group = { id: 'g1', name: 'Beginners', exercises: [] };
		const result = parseGroups(JSON.stringify([group]));
		expect(result[0].id).toBe('g1');
		expect(result[0].name).toBe('Beginners');
	});

	it('preserves already-nested moves (new format)', () => {
		const group = {
			id: '1', name: 'Test',
			exercises: [{ id: 'a', moves: [['jab', 'cross'], ['hook']], repDelay: 1500 }]
		};
		const result = parseGroups(JSON.stringify([group]));
		expect(result[0].exercises[0].moves).toEqual([['jab', 'cross'], ['hook']]);
	});

	it('wraps flat string array into nested array (old array format)', () => {
		const group = {
			id: '1', name: 'Test',
			exercises: [{ id: 'a', moves: ['jab', 'cross'], repDelay: 1500 }]
		};
		const result = parseGroups(JSON.stringify([group]));
		expect(result[0].exercises[0].moves).toEqual([['jab', 'cross']]);
	});

	it('splits space-separated string into nested array (old string format)', () => {
		const group = {
			id: '1', name: 'Test',
			exercises: [{ id: 'a', moves: 'jab cross', repDelay: 1500 }]
		};
		const result = parseGroups(JSON.stringify([group]));
		expect(result[0].exercises[0].moves).toEqual([['jab', 'cross']]);
	});

	it('handles null/undefined moves with empty nested array', () => {
		const group = {
			id: '1', name: 'Test',
			exercises: [{ id: 'a', moves: null, repDelay: 1500 }]
		};
		const result = parseGroups(JSON.stringify([group]));
		expect(result[0].exercises[0].moves).toEqual([[]]);
	});

	it('parses multiple groups', () => {
		const groups = [
			{ id: '1', name: 'Group A', exercises: [] },
			{ id: '2', name: 'Group B', exercises: [] },
		];
		const result = parseGroups(JSON.stringify(groups));
		expect(result).toHaveLength(2);
		expect(result[1].name).toBe('Group B');
	});
});
