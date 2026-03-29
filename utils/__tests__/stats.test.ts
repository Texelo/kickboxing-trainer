import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { saveWorkout, getWorkouts, clearStats } from '../stats';

// Mock SecureStore
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// LocalStorage mock for web
const mockStore: any = {};
global.localStorage = {
  getItem: (key: string) => mockStore[key] || null,
  setItem: (key: string, value: string) => { mockStore[key] = value },
  removeItem: (key: string) => { delete mockStore[key] },
  clear: () => { Object.keys(mockStore).forEach(k => delete mockStore[k]) },
  length: 0,
  key: (index: number) => null,
};

describe('Stats Service', () => {
  const session = {
    date: '2025-01-01T12:00:00Z',
    duration: 300,
    rounds: 3,
    group: 'Beginner Combos'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockStore).forEach(k => delete mockStore[k]);
  });

  describe('Native Platform', () => {
    beforeAll(() => {
      Platform.OS = 'android';
    });

    it('should save a workout to SecureStore', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
      await saveWorkout(session);
      
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'workout_stats',
        expect.stringContaining('"group":"Beginner Combos"')
      );
    });

    it('should load workouts from SecureStore', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(JSON.stringify([session]));
      const stats = await getWorkouts();
      expect(stats).toHaveLength(1);
      expect(stats[0].rounds).toBe(3);
    });

    it('should limit stats to last 100 sessions', async () => {
      const longHistory = Array(120).fill(session);
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(JSON.stringify(longHistory));
      
      await saveWorkout({ ...session, group: 'New One' });
      
      const setCall = (SecureStore.setItemAsync as jest.Mock).mock.calls[0][1];
      const saved = JSON.parse(setCall);
      expect(saved).toHaveLength(100);
      expect(saved[99].group).toBe('New One');
    });
  });

  describe('Web Platform', () => {
    beforeAll(() => {
      Platform.OS = 'web';
    });

    it('should save a workout to LocalStorage', async () => {
      await saveWorkout(session);
      const saved = localStorage.getItem('workout_stats');
      expect(saved).not.toBeNull();
      expect(JSON.parse(saved!)[0].duration).toBe(300);
    });

    it('should load workouts from LocalStorage', async () => {
      localStorage.setItem('workout_stats', JSON.stringify([session]));
      const stats = await getWorkouts();
      expect(stats).toHaveLength(1);
    });

    it('should clear stats on web', async () => {
        localStorage.setItem('workout_stats', 'data');
        await clearStats();
        expect(localStorage.getItem('workout_stats')).toBeNull();
    });
  });
});
