import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    if (!store.initialized) {
      store.initialize();
    }
  }, [store.initialized]);

  return {
    session: store.session,
    user: store.user,
    profile: store.profile,
    loading: store.loading,
    initialized: store.initialized,
    isAuthenticated: !!store.session,
    signInWithEmail: store.signInWithEmail,
    signUpWithEmail: store.signUpWithEmail,
    signOut: store.signOut,
    updateProfile: store.updateProfile,
  };
}
