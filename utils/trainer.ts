import * as Speech from "expo-speech";
import * as Converter from "number-to-words";
import type { Exercise } from "./types";

export default function trainer(exercises: Array<Exercise>): void {
	const initialDelay = 1000;
	const reps = 3;
	let index = 0;
	let exercise = exercises[index];
	let rep = 0;
	//const voice = "Microsoft Hazel - English (United Kingdom)"
	//const voice = "Microsoft Susan - English (United Kingdom)"
	//const voice = "Microsoft George - English (United Kingdom)"
	//const voice = undefined

	//console.log(Speech.getAvailableVoicesAsync())
	const func = () => {
		if (rep > reps) {
			index++;
			if (index >= exercises.length) {
				Speech.speak("done");
				return;
			}
			rep = 0;
			exercise = exercises[index];
		}

		const phrase = !rep ? exercise.moves : Converter.toWords(rep);
		const delay = !rep ? initialDelay : exercise.repDelay ?? 1000;
		console.log(rep, phrase, delay);
		Speech.speak(phrase, {
			onDone() {
				rep++;
				setTimeout(func, delay);
			},
			//voice: voice
		});
	};

	func();
}
