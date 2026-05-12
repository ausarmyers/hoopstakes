import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { router, usePathname } from 'expo-router';
import { getQueueStatus } from '../../lib/offlineQueue';
import { logAnalyticsEvent } from '../../lib/telemetry';

type BannerState = {
  pending: number;
  isOnline: boolean;
};

export function OfflineQueueBanner() {
  const [state, setState] = useState<BannerState>({ pending: 0, isOnline: true });
  const pathname = usePathname();

  useEffect(() => {
    let mounted = true;

    const refresh = async () => {
      const [status, netInfo] = await Promise.all([getQueueStatus(), NetInfo.fetch()]);
      if (!mounted) return;

      setState({
        pending: status.pending,
        isOnline: netInfo.isConnected && (netInfo.isInternetReachable ?? true),
      });
    };

    void refresh();
    const interval = setInterval(() => {
      void refresh();
    }, 5000);

    const unsubscribe = NetInfo.addEventListener(() => {
      void refresh();
    });

    return () => {
      mounted = false;
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  if (pathname === '/offline-queue' || (state.pending === 0 && state.isOnline)) {
    return null;
  }

  const message = state.isOnline
    ? `${state.pending} queued action${state.pending === 1 ? '' : 's'} waiting to sync.`
    : `${state.pending} queued action${state.pending === 1 ? '' : 's'} saved locally while offline.`;

  const handlePress = () => {
    void logAnalyticsEvent('offline_queue_banner_opened', {
      pending: state.pending,
      isOnline: state.isOnline,
    });
    router.push('/offline-queue');
  };

  return (
    <View className="absolute left-4 right-4 top-14 z-50 rounded-2xl border border-orange-200 bg-white px-4 py-3 shadow-lg">
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <Text className="text-xs font-bold uppercase tracking-[1px] text-orange-600">
            {state.isOnline ? 'Sync queue active' : 'Offline mode'}
          </Text>
          <Text className="mt-1 text-sm font-semibold text-gray-900">{message}</Text>
        </View>

        <Pressable onPress={handlePress} className="rounded-xl bg-orange-500 px-3 py-2 active:opacity-80">
          <Text className="text-xs font-bold text-white">View</Text>
        </Pressable>
      </View>
    </View>
  );
}