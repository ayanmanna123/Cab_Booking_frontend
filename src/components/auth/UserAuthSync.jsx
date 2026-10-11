import React, { useEffect, useRef } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { CONFIG } from '../../constants/config';

export default function UserAuthSync() {
  const { isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const lastSyncedUserRef = useRef(null);

  useEffect(() => {
    if (!isSignedIn || !user) {
      localStorage.removeItem('auth_user');
      return;
    }

    const email = user.primaryEmailAddress?.emailAddress || '';
    const fullName = user.fullName || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || 'Uber Rider';
    const phone = user.primaryPhoneNumber?.phoneNumber || null;
    const avatarUrl = user.imageUrl || null;
    const userId = user.id;

    // Cache locally for instant access across the app and API client
    const authUserData = {
      id: userId,
      email,
      fullName,
      phone,
      avatarUrl
    };
    localStorage.setItem('auth_user', JSON.stringify(authUserData));

    // Avoid duplicate network calls
    if (lastSyncedUserRef.current === userId) return;

    const syncToBackend = async () => {
      try {
        let token = null;
        try {
          token = await getToken();
        } catch {
          // Token retrieval optional fallback
        }

        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || userId}`,
          'x-user-id': userId,
          'x-user-email': email,
          'x-user-name': fullName,
          'x-user-phone': phone || '',
          'x-user-avatar': avatarUrl || ''
        };

        const res = await fetch(`${CONFIG.BACKEND_URL}/auth/sync`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            id: userId,
            email,
            fullName,
            phone,
            avatarUrl,
            role: 'rider'
          })
        });

        if (res.ok) {
          lastSyncedUserRef.current = userId;
          console.log('✅ [AuthSync] Clerk user successfully synced to cb_users in Supabase:', {
            userId,
            email,
            fullName
          });
        }
      } catch (err) {
        console.warn('⚠️ [AuthSync] Could not sync user to database:', err.message);
      }
    };

    syncToBackend();
  }, [isSignedIn, user, getToken]);

  return null;
}
