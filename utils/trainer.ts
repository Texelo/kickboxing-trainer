import * as Speech from "expo-speech";
import * as Converter from "number-to-words";
import type { Exercise } from "./types";

export interface TrainerControls {
	pause: () => void;
	resume: () => void;
	stop: () => void;
	skip: () => void;
	rewind: () => void;
	updateSpeed: (factor: number) => void;
	start: () => void;
	restart: () => void;
}

export default function trainer(exercises: Array<Exercise>, activeVoiceIdentifier?: string, initialSpeed: number = 1, autoStart: boolean = true): TrainerControls {
	let speedFactor = initialSpeed;
	const initialDelay = 1000;
	const reps = 3;
	let index = 0;
	let timeoutId: ReturnType<typeof setTimeout> | null = null;
	let isActive = true;
	let isPaused = !autoStart;

	let resumeTimeout = 0;
	let startTime = 0;

	if (!exercises || exercises.length === 0) return { pause: () => { }, resume: () => { }, stop: () => { }, skip: () => { }, rewind: () => { }, updateSpeed: () => { }, restart: () => { }, start: () => { } };

	let exercise = exercises[index];
	let rep = 0;
	let activelySpeaking = false;
	let addOnIndex = 0;  // 0 = base combo, 1+ = add-on index

	const activeMoves = (): string[] => exercise.moves[addOnIndex] ?? exercise.moves[0];

	const func = () => {
		if (!isActive || isPaused) return;

		if (rep > reps) {
			if (addOnIndex < exercise.moves.length - 1) {
				addOnIndex++;
			} else {
				index++;
				if (index >= exercises.length) {
					index = 0; // Infinite loop the set until the round timer kills us
				}
				exercise = exercises[index];
				addOnIndex = 0;
			}
			rep = 0;
		}

		timeoutId = null; // Clear so we know we're speaking
		activelySpeaking = true;

		const currentMoves = activeMoves();
		const phrase = !rep
			? (addOnIndex > 0 ? `add on, ${currentMoves.join(", ")}` : (currentMoves.join(", ") || "go"))
			: Converter.toWords(rep);
		const delay = !rep ? initialDelay : (exercise.repDelay ?? 1000) / speedFactor;

		Speech.speak(phrase, {
			voice: activeVoiceIdentifier,
			onDone() {
				if (!isActive) return;
				activelySpeaking = false;
				rep++;
				if (!isPaused) {
					startTime = Date.now();
					resumeTimeout = delay;
					timeoutId = setTimeout(func, delay);
				} else {
					// Finished speaking while the app is paused; line up the next timeout
					resumeTimeout = delay;
					timeoutId = 1 as any; // Marker that a functional timeout is queued
				}
			},
			onStopped() {
				activelySpeaking = false;
			}
		});
	};

	if (autoStart) func();

	const jump = (direction: number) => {
		index = Math.max(0, Math.min(exercises.length - 1, index + direction));
		rep = 0;
		addOnIndex = 0;  // Reset to base combo when jumping to a new exercise
		exercise = exercises[index];

		if (timeoutId && timeoutId !== 1 as any) clearTimeout(timeoutId);
		if (activelySpeaking) Speech.stop();

		if (!isPaused) {
			activelySpeaking = false;
			func();
		} else {
			timeoutId = 1 as any;
			resumeTimeout = 0;
		}
	};

	return {
		pause: () => {
			isPaused = true;
			if (timeoutId) {
				clearTimeout(timeoutId);
				// If we have a numerical timer that isn't the marker bit '1'
				if (timeoutId !== 1 as any) {
					const elapsed = Date.now() - startTime;
					resumeTimeout = Math.max(0, resumeTimeout - elapsed);
				}
			}
			// Do not call Speech.pause(), it breaks the Android TTS engine. Let the current word finish natively.
		},
		resume: () => {
			if (!isPaused) return;
			isPaused = false;

			// If timeoutId is present (either an active ID we cleared, or '1' from an onDone marker)
			if (timeoutId) {
				startTime = Date.now();
				timeoutId = setTimeout(func, resumeTimeout);
			} else if (!activelySpeaking) {
				// Initial start or no pending timeout
				func();
			}
		},
		start: () => {
			isActive = true;
			isPaused = false;
			func();
		},
		stop: () => {
			isActive = false;
			if (timeoutId && timeoutId !== 1 as any) clearTimeout(timeoutId);
			Speech.stop();
		},
		skip: () => jump(1),
		rewind: () => jump(-1),
		updateSpeed: (factor: number) => {
			speedFactor = factor;
		},
		restart: () => {
			index = 0;
			rep = 0;
			addOnIndex = 0;
			exercise = exercises[index];

			if (timeoutId && timeoutId !== 1 as any) clearTimeout(timeoutId);
			if (activelySpeaking) Speech.stop();

			if (!isPaused) {
				activelySpeaking = false;
				func();
			} else {
				timeoutId = 1 as any;
				resumeTimeout = 0;
			}
		}
	};
}
