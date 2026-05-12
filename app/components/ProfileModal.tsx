import React, { useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useStore, isProfileComplete, canChangePosition, User } from '../../lib/store';
import { ACTIVE_CITIES } from '../../lib/constants';
import { createUserProfile } from '../../lib/userProfile';

const positions = ['PG', 'SG', 'SF', 'PF', 'C'] as const;

export default function ProfileModal({
  visible,
  onClose,
  onSaved,
}: {
  visible: boolean;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const user = useStore((s) => s.user);
  const setUser = useStore((s) => s.setUser);

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [city, setCity] = useState(user?.city ?? '');
  const [position, setPosition] = useState<User['positionAbbr']>(user?.positionAbbr ?? 'SG');
  const [ageStr, setAgeStr] = useState(user?.age ? String(user.age) : '');

  const handleSubmit = async () => {
    const age = ageStr ? parseInt(ageStr, 10) : undefined;
    if (!displayName.trim()) return Alert.alert('Please enter a display name');
    if (!ACTIVE_CITIES.includes(city)) return Alert.alert('City must be in our launch cities');
    if (!positions.includes(position as any)) return Alert.alert('Select a valid position');
    if (age !== undefined && age < 13) return Alert.alert('Sorry — HoopStakes is not available for users under 13.');

    if (!user) return Alert.alert('Missing user', 'Please sign in again.');

    try {
      await createUserProfile(user.uid, {
        displayName: displayName.trim(),
        city: city.trim(),
        position: position,
        age,
      });

      setUser((prev) =>
        prev
          ? {
              ...prev,
              displayName: displayName.trim(),
              city: city.trim(),
              positionAbbr: position,
              age,
              profile: {
                displayName: displayName.trim(),
                city: city.trim(),
                position,
                age,
              },
              profileComplete: true,
            }
          : prev
      );

      onSaved?.();
      onClose();
    } catch (error: any) {
      Alert.alert('Save failed', error?.message || 'Unable to save your profile right now.');
    }
  };

  const positionChangeAllowed = canChangePosition(user as any);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Complete your profile to start earning Stakes!</Text>

          <TextInput placeholder="Display name" value={displayName} onChangeText={setDisplayName} style={styles.input} />
          <TextInput placeholder={`City (e.g. ${ACTIVE_CITIES.join(', ')})`} value={city} onChangeText={setCity} style={styles.input} />

          <View style={styles.positions}>
            {positions.map((p) => (
              <TouchableOpacity key={p} style={[styles.posBtn, position === p && styles.posBtnActive, !positionChangeAllowed && { opacity: 0.5 }]} onPress={() => positionChangeAllowed && setPosition(p as any)}>
                <Text style={position === p ? styles.posTextActive : styles.posText}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {!positionChangeAllowed && (
            <Text style={{ color: '#666', fontSize: 12, marginBottom: 8 }}>Position is locked until you play 5 games.</Text>
          )}

          <TextInput placeholder="Age (optional)" value={ageStr} keyboardType="numeric" onChangeText={setAgeStr} style={styles.input} />

          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose} style={styles.cancel}>
              <Text>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSubmit} style={styles.save}>
              <Text style={{ color: 'white' }}>Save profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  container: { width: '90%', backgroundColor: 'white', borderRadius: 12, padding: 16 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8, marginBottom: 10 },
  positions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  posBtn: { padding: 8, borderWidth: 1, borderColor: '#ccc', borderRadius: 6 },
  posBtnActive: { backgroundColor: '#111' },
  posText: { color: '#111' },
  posTextActive: { color: 'white' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  cancel: { padding: 10 },
  save: { padding: 10, backgroundColor: '#0a84ff', borderRadius: 6 },
});
