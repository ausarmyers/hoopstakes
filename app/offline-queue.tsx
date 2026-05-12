import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import * as Haptic from 'expo-haptics';
import { router } from 'expo-router';
import { clearQueue, getQueue, getQueueStatus, type QueuedAction } from '../lib/offlineQueue';
import { logAnalyticsEvent } from '../lib/telemetry';

const formatAge = (timestamp: number) => {
  const minutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));
  if (minutes < 1) return 'just now';
  if (minutes === 1) return '1 min ago';
  if (minutes < 60) return `${minutes} mins ago`;
  const hours = Math.floor(minutes / 60);
  return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
};

export default function OfflineQueueScreen() {
  const [queue, setQueue] = useState<QueuedAction[]>([]);
  const [pending, setPending] = useState(0);
  const [oldest, setOldest] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const [items, status] = await Promise.all([getQueue(), getQueueStatus()]);
    setQueue(items);
    setPending(status.pending);
    setOldest(status.oldest);
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const handleClear = async () => {
    await Haptic.notificationAsync(Haptic.NotificationFeedbackType.Warning);
    await clearQueue();
    void logAnalyticsEvent('offline_queue_cleared', { pendingBeforeClear: pending });
    await refresh();
  };

  return (
    <ScrollView className="flex-1 bg-slate-950" contentContainerClassName="pb-10">
      <View className="px-6 pt-16 pb-6 bg-gradient-to-b from-orange-500 to-orange-600">
        <Pressable onPress={() => router.back()} className="mb-5 self-start rounded-full bg-white/15 px-4 py-2">
          <Text className="text-sm font-semibold text-white">Back</Text>
        </Pressable>
        <Text className="text-3xl font-bold text-white">Offline Queue</Text>
        <Text className="mt-2 text-white/85">
          Pending actions are stored locally and replayed when Firebase is reachable again.
        </Text>
      </View>

      <View className="-mt-4 rounded-t-3xl bg-slate-950 px-6 pt-6">
        <View className="flex-row gap-3">
          <View className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-4">
            <Text className="text-xs font-bold uppercase tracking-[1px] text-orange-300">Pending</Text>
            <Text className="mt-2 text-3xl font-bold text-white">{loading ? '...' : pending}</Text>
          </View>
          <View className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-4">
            <Text className="text-xs font-bold uppercase tracking-[1px] text-orange-300">Oldest</Text>
            <Text className="mt-2 text-lg font-semibold text-white">
              {oldest ? formatAge(oldest) : 'none'}
            </Text>
          </View>
        </View>

        <View className="mt-4 flex-row gap-3">
          <Pressable onPress={() => void refresh()} className="flex-1 rounded-2xl bg-white px-4 py-3 active:opacity-80">
            <Text className="text-center text-sm font-bold text-slate-950">Refresh</Text>
          </Pressable>
          <Pressable onPress={() => void handleClear()} className="flex-1 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 active:opacity-80">
            <Text className="text-center text-sm font-bold text-red-300">Clear Queue</Text>
          </Pressable>
        </View>

        <Text className="mt-6 text-lg font-bold text-white">Queued Actions</Text>

        <View className="mt-3 gap-3">
          {queue.length === 0 ? (
            <View className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <Text className="text-center text-sm text-slate-300">No pending actions right now.</Text>
            </View>
          ) : (
            queue.map((item, index) => (
              <View key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-base font-bold text-white">
                    {index + 1}. {item.type.replace('_', ' ')}
                  </Text>
                  <Text className="text-xs font-semibold text-orange-300">Retry {item.retryCount}/3</Text>
                </View>
                <Text className="mt-1 text-xs text-slate-300">Queued {formatAge(item.timestamp)}</Text>
                <Text className="mt-1 text-xs text-slate-400">ID: {item.id}</Text>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}