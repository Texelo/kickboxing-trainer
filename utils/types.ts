// utils/types.ts
export interface Move {
	id: string;
	movement: string;
	side: "left" | "right";
	type: string;
}

export interface Exercise {
	id: string;
	moves: string;
	repDelay?: number;
	enabled?: boolean;
}

export interface ExerciseGroup {
	id: string;
	name: string;
	exercises: Array<Exercise>;
	enabled?: boolean;
}
