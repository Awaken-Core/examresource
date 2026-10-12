import { createStore } from 'zustand/vanilla';
import { persist } from 'zustand/middleware';

export type AuthMode = 'login' | 'signup';

type AuthState = {
	mode: AuthMode;
	isLoading: boolean;
	message: string | null;
	user: { id: string; name: string; email: string } | null;
	setMode: (mode: AuthMode) => void;
	setLoading: (isLoading: boolean) => void;
	setMessage: (message: string | null) => void;
	setUser: (user: AuthState['user']) => void;
};

export const authStore = createStore<AuthState>()(persist((set) => ({
	mode: 'login',
	isLoading: false,
	message: null,
	user: null,
	setMode: (mode) => set({ mode, message: null }),
	setLoading: (isLoading) => set({ isLoading }),
	setMessage: (message) => set({ message }),
	setUser: (user) => set({ user }),
}), {
	name: 'exam-resource-auth',
	partialize: (state) => ({ user: state.user }),
}));
