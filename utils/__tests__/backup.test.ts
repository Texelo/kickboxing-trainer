import { encodeGroup, decodeGroup } from '../backup';
import type { ExerciseGroup } from '../types';

jest.mock('expo-document-picker');
jest.mock('expo-file-system/legacy');
jest.mock('expo-sharing');

const makeGroup = (overrides: Partial<ExerciseGroup> = {}): ExerciseGroup => ({
	id: '1',
	name: 'Test Group',
	exercises: [
		{ id: 'a', moves: [['jab', 'cross']], repDelay: 1500 },
	],
	...overrides,
});

describe('encodeGroup', () => {
	it('produces a KBX1 prefixed string', () => {
		expect(encodeGroup(makeGroup())).toMatch(/^KBX1\|/);
	});

	it('includes the group name', () => {
		expect(encodeGroup(makeGroup({ name: 'Beginner Combos' }))).toContain('Beginner Combos');
	});

	it('encodes known moves to abbreviations', () => {
		const encoded = encodeGroup(makeGroup());
		expect(encoded).toContain('j,c'); // jab → j, cross → c
	});

	it('passes through unknown moves unchanged', () => {
		const group = makeGroup({ exercises: [{ id: 'a', moves: [['flying_kick']], repDelay: 1000 }] });
		expect(encodeGroup(group)).toContain('flying_kick');
	});

	it('separates exercises with semicolons', () => {
		const group = makeGroup({
			exercises: [
				{ id: 'a', moves: [['jab']], repDelay: 1000 },
				{ id: 'b', moves: [['cross']], repDelay: 2000 },
			]
		});
		expect(encodeGroup(group)).toContain(';');
	});

	it('separates add-on combos with +', () => {
		const group = makeGroup({
			exercises: [{ id: 'a', moves: [['jab'], ['cross']], repDelay: 1500 }]
		});
		expect(encodeGroup(group)).toContain('+');
	});

	it('strips | and ; characters from group name', () => {
		const group = makeGroup({ name: 'My|Group;Name' });
		const encoded = encodeGroup(group);
		// Pipe in name would break the format — should be replaced
		const parts = encoded.split('|');
		expect(parts).toHaveLength(3);
	});

	it('includes repDelay in output', () => {
		const group = makeGroup({ exercises: [{ id: 'a', moves: [['jab']], repDelay: 2500 }] });
		expect(encodeGroup(group)).toContain('2500');
	});
});

describe('decodeGroup', () => {
	it('decodes a KBX1 string back to a group', () => {
		const original = makeGroup({ name: 'Beginners' });
		const decoded = decodeGroup(encodeGroup(original));
		expect(decoded.name).toBe('Beginners');
		expect(decoded.exercises).toHaveLength(1);
	});

	it('restores move names from abbreviations', () => {
		const original = makeGroup();
		const decoded = decodeGroup(encodeGroup(original));
		expect(decoded.exercises![0].moves[0]).toEqual(['jab', 'cross']);
	});

	it('restores repDelay', () => {
		const original = makeGroup({ exercises: [{ id: 'a', moves: [['jab']], repDelay: 2500 }] });
		const decoded = decodeGroup(encodeGroup(original));
		expect(decoded.exercises![0].repDelay).toBe(2500);
	});

	it('roundtrips multi-combo exercises', () => {
		const original = makeGroup({
			exercises: [{
				id: 'a',
				moves: [['jab', 'cross'], ['left hook']],
				repDelay: 3000
			}]
		});
		const decoded = decodeGroup(encodeGroup(original));
		expect(decoded.exercises![0].moves[0]).toEqual(['jab', 'cross']);
		expect(decoded.exercises![0].moves[1]).toEqual(['left hook']);
	});

	it('roundtrips multiple exercises', () => {
		const original = makeGroup({
			exercises: [
				{ id: 'a', moves: [['jab']], repDelay: 1000 },
				{ id: 'b', moves: [['rear roundhouse']], repDelay: 2000 },
			]
		});
		const decoded = decodeGroup(encodeGroup(original));
		expect(decoded.exercises).toHaveLength(2);
		expect(decoded.exercises![1].moves[0]).toEqual(['rear roundhouse']);
	});

	it('passes through unknown move abbreviations as-is', () => {
		const encoded = 'KBX1|Test|customMove:1500';
		const decoded = decodeGroup(encoded);
		expect(decoded.exercises![0].moves[0]).toEqual(['customMove']);
	});

	it('throws on completely invalid input', () => {
		const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
		expect(() => decodeGroup('garbage')).toThrow();
		consoleSpy.mockRestore();
	});

	it('decodes legacy JSON format (n/e structure)', () => {
		const legacy = JSON.stringify({
			n: 'Old Group',
			e: [{ m: ['jab', 'cross'], d: 1200 }]
		});
		const decoded = decodeGroup(legacy);
		expect(decoded.name).toBe('Old Group');
		expect(decoded.exercises![0].repDelay).toBe(1200);
		expect(decoded.exercises![0].moves[0]).toEqual(['jab', 'cross']);
	});
});
