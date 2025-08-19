//export enum Movement {
//	JAB, CROSS, UPPERCUT, HEAD_HOOK, BODY_HOOK, ROUNDHOUSE
//}

////export enum PUNCH {
////	JAB, CROSS
////}

//const PUNCH = ['', 'diamonds', 'spades', 'clubs'] as const;
//type SuitTuple = typeof PUNCH;
//type Suit = SuitTuple[number];

//function isSuit(value: string): value is Suit {
//	return ALL_SUITS.includes(value as Suit)
//}

//if ("jab".i)

//export enum MovementType {
//	PUNCH, KICK, ELBOW, BLOCK, EVASION 
//}

export interface Move {
	id: string
	movement: string,
	side: "left" | "right"
	type: string
}


export interface Exercise {
	id: string
	moves: string;
	repDelay?: number;
	enabled?: boolean
}

export interface ExerciseGroup {
	id: string
	name: string
	exercises: Array<Exercise>
	enabled?: boolean
}