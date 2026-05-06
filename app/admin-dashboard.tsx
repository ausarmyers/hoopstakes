import { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { getAdminKpis } from '../lib/backend';

const BASE_METRICS = [
  { key: 'matchSubmitted', label: 'Match submissions (30d)', target: 'Increase weekly' },
  { key: 'disputesOpened', label: 'Match disputes opened', target: 'Keep low' },
  { key: 'trustRate', label: 'Trust score (no-dispute match rate)', target: '>= 80%' },
  { key: 'videoViews', label: 'Video proof views', target: 'Increase' },
  { key: 'tournamentEntry', label: 'Tournament entries', target: '>= 5 / 16 to paid' },
] as const;

export default function AdminDashboard() {
  const [kpis, setKpis] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    let mounted = true;
    getAdminKpis()
      .then((result) => {
        if (!mounted) return;
        setKpis(result.kpis as Record<string, number>);
      })
      .catch(() => {
        if (!mounted) return;
        setKpis(null);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      <View className="px-6 pt-10 pb-6">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</Text>
        <Text className="text-gray-600">Monitor growth, trust, and serious-hooper retention.</Text>
      </View>

      <View className="px-6 pb-10 gap-3">
        {BASE_METRICS.map((metric) => (
          <View key={metric.key} className="bg-white border border-gray-200 rounded-2xl p-4">
            <Text className="font-bold text-gray-900">{metric.label}</Text>
            <Text className="text-xs text-gray-600 mt-1">Target: {metric.target}</Text>
            <Text className="text-sm text-orange-600 mt-2">
              Current: {kpis ? String(kpis[metric.key] ?? '-') : 'Unavailable'}
            </Text>
          </View>
        ))}

        <View className="bg-white border border-gray-200 rounded-2xl p-4">
          <Text className="font-bold text-gray-900 mb-2">Tracking Dimensions</Text>
          <Text className="text-sm text-gray-700">
            • LEO distribution by court{`\n`}
            • Cashout velocity vs gameplay balance{`\n`}
            • Video proof engagement (views/shares){`\n`}
            • Tiered tournament participation
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
