import { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { useStore, canPerformAction } from '../../lib/store';
import { router } from 'expo-router';
import { isPaidTier } from '../../lib/business-rules';
import { getActiveCourts, getNearestActiveCity, isWithinCourtRadius } from '../../lib/geo';
import { GEO_FENCE_RADIUS_METERS } from '../../lib/constants';
import ProfileModal from '../components/ProfileModal';
import SkeletonCard from '../components/SkeletonCard';

const LIVE_HOOPERS = {
  'usd-wellness': [
    { id: 'jamal', username: 'jamal_sg', leo: 82, tier: 'Elite', positionAbbr: 'SG', winStreak: 3 },
    { id: 'ty', username: 'ty_rimrun', leo: 76, tier: 'Hoopster', positionAbbr: 'PF', winStreak: 1 },
  ],
  'mission-valley-ymca': [
    { id: 'leo', username: 'leo_lockdown', leo: 88, tier: 'Elite', positionAbbr: 'PG', winStreak: 5 },
  ],
  'flamingo-park': [
    { id: 'mario', username: 'mario_bucket', leo: 74, tier: 'Hoopster', positionAbbr: 'SF', winStreak: 0 },
  ],
} as const;

export default function GymMap() {
  const user = useStore((s) => s.user);
  const currentGym = useStore((s) => s.currentGym);
  const setCurrentGym = useStore((s) => s.setCurrentGym);
  const activeCourts = useMemo(() => getActiveCourts(), []);
  const [selectedCourtId, setSelectedCourtId] = useState(currentGym ?? activeCourts[0]?.id ?? null);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [scannedQr, setScannedQr] = useState('');
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [resumeCheckInAfterProfile, setResumeCheckInAfterProfile] = useState(false);

  if (!user) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center p-4">
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text className="mt-2 text-gray-500">Loading profile...</Text>
        <View className="w-full mt-4">
          <SkeletonCard lines={2} />
        </View>
      </View>
    );
  }

  const paid = isPaidTier(user.tier);
  const selectedCourt = activeCourts.find((court) => court.id === (selectedCourtId || currentGym)) ?? activeCourts[0];

  const handleCourtSelect = (courtId: string) => {
    setSelectedCourtId(courtId);
  };

  const handleCheckIn = async () => {
    if (!selectedCourt) return;

    if (scannedQr.trim() !== selectedCourt.qrCode) {
      Alert.alert('QR mismatch', 'Scan the gym QR code before checking in.');
      return;
    }

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Location required', 'GPS permission is required to verify this check-in.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
      const inRange = isWithinCourtRadius(coords, selectedCourt, GEO_FENCE_RADIUS_METERS);

      if (!inRange) {
        const nearestCity = getNearestActiveCity(coords);
        Alert.alert('Too far away', `You must be within ${GEO_FENCE_RADIUS_METERS}m of ${selectedCourt.name}. Nearest launch city: ${nearestCity}.`);
        return;
      }

      setCurrentGym(selectedCourt.id);
      setQrModalVisible(false);
      setScannedQr('');
      Alert.alert('Success', `Checked in at ${selectedCourt.name}.`);
    } catch (error: any) {
      Alert.alert('Check-in failed', error?.message || 'Unable to verify your location right now.');
    }
  };

  const selectedLiveHoopers = paid && selectedCourt ? (LIVE_HOOPERS[selectedCourt.id as keyof typeof LIVE_HOOPERS] || []) : [];
  const topPlayer = selectedLiveHoopers.length ? selectedLiveHoopers.reduce((a, b) => (a.leo > b.leo ? a : b)) : null;

  return (
    <ScrollView className="flex-1 bg-white" showsVerticalScrollIndicator={false}>
      <View className="px-6 pt-8 pb-6">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Nearby Gyms</Text>
        <Text className="text-gray-600">Check in with QR + GPS before finding local hoopers.</Text>
      </View>

      <View className="px-6 mb-6">
        <View className="rounded-3xl overflow-hidden border-2 border-gray-200 bg-gradient-to-b from-blue-100 to-blue-50 h-56 items-center justify-center mb-6">
          <View className="items-center">
            <Text className="text-6xl mb-3">📍</Text>
            <Text className="text-gray-800 font-bold text-lg">Interactive Map</Text>
            <Text className="text-gray-600 text-sm mt-1">Only courts in active rollout cities are shown</Text>
          </View>
        </View>

        <Text className="text-lg font-bold text-gray-900 mb-4">Available Gyms</Text>
        <View className="gap-3">
          {activeCourts.map((court) => {
            const isSelected = selectedCourt?.id === court.id;
            return (
              <TouchableOpacity
                key={court.id}
                onPress={() => handleCourtSelect(court.id)}
                className={`rounded-2xl p-4 border-2 ${
                  isSelected
                    ? 'bg-orange-50 border-orange-500'
                    : 'bg-white border-gray-200 active:bg-gray-50'
                }`}
              >
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-row items-center flex-1">
                    <Text className="text-3xl mr-3">🏀</Text>
                    <View className="flex-1">
                      <Text className="text-gray-900 font-bold text-base mb-1">{court.name}</Text>
                      <Text className="text-xs text-gray-500 mb-1">{court.city} | {court.type} | {court.hasAdmin ? 'Admin verified' : 'Player verified'}</Text>
                      <View className="flex-row items-center gap-3">
                        <View className="flex-row items-center gap-1">
                          <Text className="text-sm">📍</Text>
                          <Text className="text-sm text-gray-600">QR: {court.qrCode}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>

                <Text className="text-xs text-gray-500">{isSelected ? 'Selected court' : 'Tap to preview and verify check-in'}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Gym Details Panel */}
      {selectedCourt && (
        <View className="px-6 mb-8">
          <View className="bg-blue-50 rounded-3xl border-2 border-blue-200 p-6">
            <View className="flex-row items-center gap-3 mb-5">
              <Text className="text-4xl">🏀</Text>
              <View className="flex-1">
                <Text className="text-gray-900 font-bold text-xl">{selectedCourt.name}</Text>
                <Text className="text-gray-600 text-sm">{selectedCourt.city} | {selectedCourt.type}</Text>
              </View>
            </View>

            <View className="space-y-3 mb-6 bg-white rounded-2xl p-4">
              <View className="flex-row items-start gap-3 pb-3 border-b border-gray-200">
                <Text className="text-xl">📍</Text>
                <View className="flex-1">
                  <Text className="text-gray-600 text-xs font-semibold mb-1">ADDRESS</Text>
                  <Text className="text-gray-900 font-semibold">{selectedCourt.lat.toFixed(4)}, {selectedCourt.lng.toFixed(4)}</Text>
                </View>
              </View>

              <View className="flex-row items-start gap-3 pb-3 border-b border-gray-200">
                <Text className="text-xl">🕐</Text>
                <View className="flex-1">
                  <Text className="text-gray-600 text-xs font-semibold mb-1">ADMIN</Text>
                  <Text className="text-gray-900 font-semibold">{selectedCourt.hasAdmin ? 'Gym admin available for QR verification' : 'Player-confirmed only'}</Text>
                </View>
              </View>

              <View className="flex-row items-start gap-3">
                <Text className="text-xl">👥</Text>
                <View className="flex-1">
                  <Text className="text-gray-600 text-xs font-semibold mb-1">CHECK-IN RULE</Text>
                  <Text className="text-gray-900 font-semibold">QR scan + GPS within 100m required</Text>
                </View>
              </View>
            </View>

            <View className="gap-2">
              <TouchableOpacity onPress={() => {
                if (!canPerformAction(user, 'check_in')) {
                  setResumeCheckInAfterProfile(true);
                  return setProfileModalVisible(true);
                }
                if (user.age !== undefined && user.age !== null && user.age < 13) return Alert.alert('Sorry', 'HoopStakes is not available for users under 13.');
                setQrModalVisible(true);
              }} className="bg-orange-500 rounded-xl py-4 active:opacity-80 flex-row items-center justify-center gap-2">
                <Text className="text-2xl">📱</Text>
                <Text className="text-white font-bold text-lg">Scan QR Code to Check In</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  if (!canPerformAction(user, 'check_in')) {
                    setResumeCheckInAfterProfile(true);
                    return setProfileModalVisible(true);
                  }
                  if (user.age !== undefined && user.age !== null && user.age < 13) return Alert.alert('Sorry', 'HoopStakes is not available for users under 13.');
                  router.push('/(tabs)/find-game');
                }}
                className="bg-gray-100 border border-gray-300 rounded-xl py-4 active:bg-gray-200 flex-row items-center justify-center gap-2"
              >
                <Text className="text-2xl">🏀</Text>
                <Text className="text-gray-900 font-bold">Find Game Here</Text>
              </TouchableOpacity>
            </View>

            {paid ? (
              <View className="mt-6">
                <Text className="text-lg font-bold text-gray-900 mb-3">Live Hoopers at This Court</Text>
                {selectedLiveHoopers.length === 0 ? (
                  <View className="bg-white rounded-2xl border border-gray-200 p-4">
                    <Text className="text-gray-600 text-sm">No live hoopers posted here right now.</Text>
                  </View>
                ) : (
                  <View className="gap-3">
                    {selectedLiveHoopers.map((hooper) => (
                      <View key={hooper.id} className={`bg-white rounded-2xl border p-4 flex-row justify-between items-center ${topPlayer?.id === hooper.id ? 'border-yellow-400' : 'border-gray-200'}`}>
                        <View>
                          <Text className="font-bold text-gray-900">@{hooper.username}</Text>
                          <Text className="text-xs text-gray-500">{hooper.positionAbbr} | {hooper.tier}</Text>
                        </View>
                        <View className="items-end">
                          <Text className="text-orange-600 font-bold">LEO {hooper.leo}</Text>
                          <Text className="text-xs text-gray-500">{hooper.tier} badge</Text>
                          <Text className="text-xs text-gray-500">Win streak: {hooper.winStreak ?? 0}</Text>
                          {topPlayer?.id === hooper.id && <Text className="text-sm font-bold text-yellow-600">Top Player Today</Text>}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <View className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-4">
                <Text className="font-bold text-gray-900 mb-1">Hoopster+ Preview</Text>
                <Text className="text-sm text-gray-700">Upgrade to see live hoopers at a court with LEO scores and tier badges.</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {!selectedCourt && (
        <View className="px-6 mb-8 items-center py-6">
          <View className="bg-gray-50 rounded-2xl p-6 items-center border border-gray-200 w-full">
            <Text className="text-4xl mb-3">👇</Text>
            <Text className="text-gray-900 font-bold text-lg text-center">Select a court to see details and options</Text>
          </View>
        </View>
      )}

      <Modal visible={qrModalVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 pb-10">
            <Text className="text-2xl font-bold text-gray-900 mb-2">Scan QR Code</Text>
            <Text className="text-gray-600 mb-4">Enter the court QR code and make sure you are within 50m.</Text>
            <TextInput
              value={scannedQr}
              onChangeText={setScannedQr}
              placeholder={selectedCourt?.qrCode ?? 'Enter QR code'}
              placeholderTextColor="#999"
              autoCapitalize="characters"
              className="border border-gray-300 rounded-lg p-3 text-gray-900 mb-4"
            />
            <View className="flex-row gap-3">
              <TouchableOpacity onPress={() => setQrModalVisible(false)} className="flex-1 bg-gray-300 rounded-lg py-3">
                <Text className="text-center font-bold text-gray-900">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => void handleCheckIn()} className="flex-1 bg-orange-500 rounded-lg py-3">
                <Text className="text-center font-bold text-white">Verify Check-In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <ProfileModal
        visible={profileModalVisible}
        onClose={() => {
          setProfileModalVisible(false);
          setResumeCheckInAfterProfile(false);
        }}
        onSaved={() => {
          if (resumeCheckInAfterProfile) {
            setQrModalVisible(true);
          }
        }}
      />
    </ScrollView>
  );
}