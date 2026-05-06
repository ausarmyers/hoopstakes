import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useStore } from '../../lib/store';
import { router } from 'expo-router';

const MOCK_GYM_LIST = [
  { id: '1', name: 'USD Recreation Center', distance: '0.2 mi', players: 8, icon: '🏢', address: '5998 Alcalá Park, San Diego, CA', hours: '6am - 10pm' },
  { id: '2', name: 'Civic Center Courts', distance: '1.2 mi', players: 12, icon: '🏀', address: '1200 Third Ave, San Diego, CA', hours: '7am - 9pm' },
  { id: '3', name: 'Ocean Beach Hardcourt', distance: '2.1 mi', players: 5, icon: '🌊', address: 'Ocean Beach, San Diego, CA', hours: '8am - Sunset' },
  { id: '4', name: 'Downtown Sports Arena', distance: '3.4 mi', players: 15, icon: '🎯', address: 'Downtown, San Diego, CA', hours: '5am - Midnight' },
];

export default function GymMap() {
  const user = useStore((s) => s.user);
  const currentGym = useStore((s) => s.currentGym);
  const setCurrentGym = useStore((s) => s.setCurrentGym);

  if (!user) return <Text className="text-center mt-10">Loading...</Text>;

  const selectedGymData = MOCK_GYM_LIST.find(g => g.id === currentGym);

  const handleCheckIn = (gymId: string) => {
    setCurrentGym(gymId);
    Alert.alert('Success', 'Checked in! You can now challenge nearby hoopers.');
  };

  const handleQRScan = () => {
    Alert.alert('Camera Access', 'Camera would open here to scan QR code at the gym.');
  };

  return (
    <ScrollView className="flex-1 bg-white" showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View className="px-6 pt-8 pb-6">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Nearby Gyms</Text>
        <Text className="text-gray-600">Check in and find local hoopers</Text>
      </View>

      <View className="px-6 mb-6">
        {/* Map Placeholder */}
        <View className="rounded-3xl overflow-hidden border-2 border-gray-200 bg-gradient-to-b from-blue-100 to-blue-50 h-56 items-center justify-center mb-6">
          <View className="items-center">
            <Text className="text-6xl mb-3">📍</Text>
            <Text className="text-gray-800 font-bold text-lg">Interactive Map</Text>
            <Text className="text-gray-600 text-sm mt-1">Tap a gym to check in</Text>
          </View>
        </View>

        {/* Gym List */}
        <Text className="text-lg font-bold text-gray-900 mb-4">Available Gyms</Text>
        <View className="gap-3">
          {MOCK_GYM_LIST.map((gym) => {
            const isSelected = currentGym === gym.id;
            return (
              <TouchableOpacity
                key={gym.id}
                onPress={() => handleCheckIn(gym.id)}
                className={`rounded-2xl p-4 border-2 ${
                  isSelected
                    ? 'bg-orange-50 border-orange-500'
                    : 'bg-white border-gray-200 active:bg-gray-50'
                }`}
              >
                {/* Gym Header */}
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-row items-center flex-1">
                    <Text className="text-3xl mr-3">{gym.icon}</Text>
                    <View className="flex-1">
                      <Text className="text-gray-900 font-bold text-base mb-1">{gym.name}</Text>
                      <View className="flex-row items-center gap-3">
                        <View className="flex-row items-center gap-1">
                          <Text className="text-sm">📍</Text>
                          <Text className="text-sm text-gray-600">{gym.distance}</Text>
                        </View>
                        <View className="flex-row items-center gap-1">
                          <Text className="text-sm">👥</Text>
                          <Text className="text-sm text-gray-600">{gym.players} active</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Check In Status */}
                {isSelected ? (
                  <View className="bg-green-100 border border-green-400 rounded-xl px-3 py-2 flex-row items-center gap-2">
                    <Text className="text-lg">✓</Text>
                    <Text className="text-green-700 font-semibold text-sm">Checked In</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => handleCheckIn(gym.id)}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl py-3 active:opacity-80"
                  >
                    <Text className="text-white text-center font-bold">Check In</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Gym Details Panel */}
      {selectedGymData && (
        <View className="px-6 mb-8">
          <View className="bg-blue-50 rounded-3xl border-2 border-blue-200 p-6">
            {/* Title */}
            <View className="flex-row items-center gap-3 mb-5">
              <Text className="text-4xl">{selectedGymData.icon}</Text>
              <View className="flex-1">
                <Text className="text-gray-900 font-bold text-xl">{selectedGymData.name}</Text>
                <Text className="text-gray-600 text-sm">{selectedGymData.distance} away</Text>
              </View>
            </View>

            {/* Details */}
            <View className="space-y-3 mb-6 bg-white rounded-2xl p-4">
              <View className="flex-row items-start gap-3 pb-3 border-b border-gray-200">
                <Text className="text-xl">📍</Text>
                <View className="flex-1">
                  <Text className="text-gray-600 text-xs font-semibold mb-1">ADDRESS</Text>
                  <Text className="text-gray-900 font-semibold">{selectedGymData.address}</Text>
                </View>
              </View>

              <View className="flex-row items-start gap-3 pb-3 border-b border-gray-200">
                <Text className="text-xl">🕐</Text>
                <View className="flex-1">
                  <Text className="text-gray-600 text-xs font-semibold mb-1">HOURS</Text>
                  <Text className="text-gray-900 font-semibold">{selectedGymData.hours}</Text>
                </View>
              </View>

              <View className="flex-row items-start gap-3">
                <Text className="text-xl">👥</Text>
                <View className="flex-1">
                  <Text className="text-gray-600 text-xs font-semibold mb-1">ACTIVE PLAYERS</Text>
                  <Text className="text-gray-900 font-semibold">{selectedGymData.players} hoopers playing now</Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="gap-2">
              <TouchableOpacity
                onPress={handleQRScan}
                className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl py-4 active:opacity-80 flex-row items-center justify-center gap-2"
              >
                <Text className="text-2xl">📱</Text>
                <Text className="text-white font-bold text-lg">Scan QR Code to Check In</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/(tabs)/find-game')}
                className="bg-gray-100 border border-gray-300 rounded-xl py-4 active:bg-gray-200 flex-row items-center justify-center gap-2"
              >
                <Text className="text-2xl">🏀</Text>
                <Text className="text-gray-900 font-bold">Find Game Here</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Empty State */}
      {!selectedGymData && (
        <View className="px-6 mb-8 items-center py-6">
          <View className="bg-gray-50 rounded-2xl p-6 items-center border border-gray-200 w-full">
            <Text className="text-4xl mb-3">👇</Text>
            <Text className="text-gray-900 font-bold text-lg text-center">Select a gym to see details and options</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}