import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { confirmMatchResult, openMatchDispute } from '../lib/backend';
import { logAnalyticsEvent } from '../lib/telemetry';

export default function MatchDisputes() {
  const [matchId, setMatchId] = useState('');
  const [reason, setReason] = useState('');

  const handleConfirm = async () => {
    if (!matchId.trim()) {
      Alert.alert('Missing match id', 'Enter a match id to confirm.');
      return;
    }

    try {
      await confirmMatchResult(matchId.trim());
      await logAnalyticsEvent('match_confirmed', { matchId: matchId.trim() });
      Alert.alert('Confirmed', 'Your confirmation has been recorded.');
    } catch (error: any) {
      Alert.alert('Confirmation failed', error?.message || 'Unable to confirm this match.');
    }
  };

  const handleDispute = async () => {
    if (!matchId.trim() || !reason.trim()) {
      Alert.alert('Missing data', 'Enter match id and dispute reason.');
      return;
    }

    try {
      await openMatchDispute(matchId.trim(), reason.trim());
      await logAnalyticsEvent('match_dispute_opened', {
        matchId: matchId.trim(),
        reasonLength: reason.trim().length,
      });
      Alert.alert('Dispute opened', 'Gym admin review is now required before settlement.');
    } catch (error: any) {
      Alert.alert('Dispute failed', error?.message || 'Unable to open dispute.');
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      <View className="px-6 pt-10 pb-6">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Match Trust Center</Text>
        <Text className="text-gray-600">Dual-confirmation and dispute escalation for fair outcomes.</Text>
      </View>

      <View className="px-6 pb-10 gap-4">
        <View className="bg-white border border-gray-200 rounded-2xl p-4">
          <Text className="text-xs font-semibold text-gray-500 mb-2">MATCH ID</Text>
          <TextInput
            value={matchId}
            onChangeText={setMatchId}
            placeholder="Enter match id"
            placeholderTextColor="#999"
            className="border border-gray-300 rounded-xl px-3 py-3 text-gray-900"
          />
          <TouchableOpacity onPress={handleConfirm} className="mt-3 bg-green-600 rounded-xl py-3">
            <Text className="text-white text-center font-bold">Confirm Match Result</Text>
          </TouchableOpacity>
        </View>

        <View className="bg-white border border-gray-200 rounded-2xl p-4">
          <Text className="text-xs font-semibold text-gray-500 mb-2">DISPUTE REASON</Text>
          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder="Explain why this result is incorrect"
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            className="border border-gray-300 rounded-xl px-3 py-3 text-gray-900"
          />
          <TouchableOpacity onPress={handleDispute} className="mt-3 bg-orange-500 rounded-xl py-3">
            <Text className="text-white text-center font-bold">Open Dispute</Text>
          </TouchableOpacity>
        </View>

        <View className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
          <Text className="font-bold text-gray-900 mb-2">Trust Rules</Text>
          <Text className="text-sm text-gray-700">
            1. Match is pending until both players confirm.{`\n`}
            2. Any dispute pauses payout and rank update settlement.{`\n`}
            3. Gym admin can resolve disputed outcomes with video review.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
