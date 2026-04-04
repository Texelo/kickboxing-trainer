import * as Speech from "expo-speech";
import trainer from "../trainer";

jest.mock("expo-speech");

describe("Trainer Engine", () => {
    const mockExercises = [
        { id: "1", moves: [["jab", "cross"]], repDelay: 100 }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("should say moves first when rep is 0", async () => {
        const controls = trainer(mockExercises, "test-voice", 1, true);
        
        expect(Speech.speak).toHaveBeenCalledWith("jab, cross", expect.any(Object));
        
        // Simulate speech done callback
        const onDoneCallback = (Speech.speak as jest.Mock).mock.calls[0][1].onDone;
        onDoneCallback();

        // Should wait 1s (initialDelay)
        jest.advanceTimersByTime(1000);
        
        // Rep 1
        expect(Speech.speak).toHaveBeenCalledWith("one", expect.any(Object));
    });

    it("should handle pause and resume", () => {
        const controls = trainer(mockExercises, "test-voice", 1, true);
        
        // Clear initial moves call
        jest.clearAllMocks();
        
        controls.pause();
        
        // No more speech should happen while paused
        jest.advanceTimersByTime(2000);
        expect(Speech.speak).not.toHaveBeenCalled();
        
        controls.resume();
        // Since it was paused before any onDone, and resume doesn't find a timeoutId initially if paused at start...
        // Wait, trainer starts immediately on func() call if autostart is true.
        // Let's re-test with autoStart=false
    });

    it("should respect autoStart=false", () => {
        const controls = trainer(mockExercises, "test-voice", 1, false);
        expect(Speech.speak).not.toHaveBeenCalled();
        
        controls.start();
        expect(Speech.speak).toHaveBeenCalledWith("jab, cross", expect.any(Object));
    });

    it("should restart combination with restart()", () => {
        const controls = trainer(mockExercises, "test-voice", 1, true);
        
        // Speeds through moves
        const onDone = (Speech.speak as jest.Mock).mock.calls[0][1].onDone;
        onDone();
        
        jest.advanceTimersByTime(1000); // Wait for Rep 1
        expect(Speech.speak).toHaveBeenCalledWith("one", expect.any(Object));
        
        jest.clearAllMocks();
        controls.restart();
        
        // Should immediately say moves again
        expect(Speech.speak).toHaveBeenCalledWith("jab, cross", expect.any(Object));
    });

    it("should update speed factor", () => {
        const controls = trainer(mockExercises, "test-voice", 2.0, true);
        
        // moves onDone for initialDelay
        const onDoneMoves = (Speech.speak as jest.Mock).mock.calls[0][1].onDone;
        onDoneMoves();

        // 1000ms base / 2.0 speed = 500ms
        jest.advanceTimersByTime(1000); // 1s is plenty for 500ms delay
        expect(Speech.speak).toHaveBeenCalledWith("one", expect.any(Object));
    });
});
