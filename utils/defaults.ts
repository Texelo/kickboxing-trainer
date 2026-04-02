import type { ExerciseGroup } from "./types";

export const DEFAULT_MOVE_POOL = [
	"jab", "cross", "left hook", "right hook", "left uppercut", "right uppercut", 
	"lead knee", "rear knee", 
	"lead roundhouse", "rear roundhouse", 
	"lead side kick", "rear side kick", 
	"lead push kick", "rear push kick", 
	"slip", "roll", "left elbow", "right elbow",
	"low kick", "spinning hook kick", "switch low kick", "right body hook", 
	"step through low kick", "spinning side kick", "recoil low kick"
];

export const DEFAULT_GROUPS: Array<ExerciseGroup> = [
	{
		id: "default-1",
		name: "🥊 Beginner Combos",
		exercises: [
			{ id: "1", moves: ["jab", "cross"], repDelay: 1500 },
			{ id: "2", moves: ["jab", "cross", "left hook"], repDelay: 2000 },
			{ id: "3", moves: ["jab", "cross", "rear roundhouse"], repDelay: 2500 }
		]
	},
	{
		id: "default-2",
		name: "🥋 Advanced Flow",
		exercises: [
			{ id: "4", moves: ["jab", "cross", "slip", "cross", "right hook"], repDelay: 3000 },
			{ id: "5", moves: ["left hook", "cross", "rear knee"], repDelay: 3000 },
			{ id: "6", moves: ["jab", "right uppercut", "left hook", "rear roundhouse"], repDelay: 3500 }
		]
	},
	{
		id: "kicks-1",
		name: "🔥 Kick Combos-1",
		exercises: [
			{ id: "s1-1", moves: ["jab", "jab", "cross", "rear roundhouse", "spinning hook kick"], repDelay: 2000 },
			{ id: "s1-2", moves: ["jab", "jab", "low kick"], repDelay: 2000 },
			{ id: "s1-3", moves: ["jab", "jab", "left hook", "low kick"], repDelay: 2000 },
			{ id: "s1-4", moves: ["low kick", "switch low kick"], repDelay: 2000 },
			{ id: "s1-5", moves: ["slip", "slip", "left hook", "right body hook", "step through low kick"], repDelay: 2000 },
			{ id: "s1-6", moves: ["jab", "jab", "lead side kick", "spinning side kick"], repDelay: 2000 },
			{ id: "s1-7", moves: ["recoil low kick", "low kick"], repDelay: 2000 }
		]
	}
];
