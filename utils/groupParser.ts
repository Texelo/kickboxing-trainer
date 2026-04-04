import type { ExerciseGroup } from "./types";
import { DEFAULT_GROUPS } from "./defaults";

export function parseGroups(val: string | null): ExerciseGroup[] {
	if (!val) return DEFAULT_GROUPS;
	try {
		const parsed = JSON.parse(val);
		if (!parsed || parsed.length === 0) return DEFAULT_GROUPS;
		return parsed.map((g: any) => ({
			...g,
			exercises: g.exercises.map((ex: any) => ({
				...ex,
				moves: Array.isArray(ex.moves)
					? (Array.isArray(ex.moves[0]) ? ex.moves : [ex.moves])
					: (ex.moves ? [ex.moves.split(" ")] : [[]])
			}))
		}));
	} catch (e) {
		console.error("Groups parse error", e);
		return DEFAULT_GROUPS;
	}
}
