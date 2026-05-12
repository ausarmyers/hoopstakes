import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { getUserProfile, UserProfile } from '../lib/userProfile';

export const useUserProfile = (user: User | null) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      if (!user?.uid) return;
      try {
        const data = await getUserProfile(user.uid);
        if (mounted && data) setProfile(data as UserProfile);
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadProfile();
    return () => {
      mounted = false;
    };
  }, [user?.uid]);

  return { profile, loading };
};
