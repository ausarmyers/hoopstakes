import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useStore } from '../lib/store';
import { logAnalyticsEvent } from '../lib/telemetry';

const PAST_WINNERS = [
  {
    id: 'w1',
    name: 'James Chen',
    tournament: 'Balboa Park Saturday Run',
    proofUrl: 'https://example.com/video-proof/james-chen',
  },
  {
    id: 'w2',
    name: 'Maya Rivers',
    tournament: 'Mission Valley Elite Night',
    proofUrl: 'https://example.com/video-proof/maya-rivers',
  },
];

export default function TournamentHub() {
  const user = useStore((s) => s.user);
  const tournaments = useStore((s) => s.tournaments);

  if (!user) return null;

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      <View className="px-6 pt-10 pb-6">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Tournament Hub</Text>
        <Text className="text-gray-600">Structured 3v3 and 5v5 runs with trust-first video proof.</Text>
      </View>

      <View className="px-6 mb-6 gap-3">
        {tournaments.map((tournament) => (
          <View key={tournament.id} className="bg-white border border-gray-200 rounded-2xl p-4">
            <Text className="font-bold text-gray-900 text-base">{tournament.name}</Text>
            <Text className="text-xs text-gray-600 mt-1">{tournament.minTier}+ | {tournament.stakeLabel}</Text>
            <Text className="text-xs text-gray-600 mt-1">Venue: {tournament.venueType}</Text>
            <TouchableOpacity
              className="mt-3 bg-orange-500 rounded-xl py-3"
              onPress={() =>
                logAnalyticsEvent('tournament_entry', {
                  tournamentId: tournament.id,
                  tier: user.tier,
                  paid: user.tier !== 'Rookie',
                })
              }
            >
              <Text className="text-white text-center font-bold">Enter Tournament</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View className="px-6 pb-10">
        <Text className="text-lg font-bold text-gray-900 mb-3">Past Winners with Video Proof</Text>
        {PAST_WINNERS.map((winner) => (
          <View key={winner.id} className="bg-white border border-gray-200 rounded-2xl p-4 mb-3">
            <Text className="font-bold text-gray-900">{winner.name}</Text>
            <Text className="text-xs text-gray-600 mt-1">{winner.tournament}</Text>
            <TouchableOpacity
              onPress={async () => {
                await logAnalyticsEvent('video_proof_viewed', {
                  winnerId: winner.id,
                  tournament: winner.tournament,
                });
                Linking.openURL(winner.proofUrl);
              }}
              className="mt-3 border border-orange-300 rounded-xl py-2"
            >
              <Text className="text-center text-orange-600 font-semibold">View Video Proof</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
