import { View, Text, TouchableOpacity, ScrollView, Alert, Modal, TextInput } from 'react-native';
import { useState } from 'react';
import { useStore } from '../../lib/store';
import {
  canCashout,
  getCashoutMinimum,
  isPaidTier,
  violatesRetainedBalanceRule,
} from '../../lib/business-rules';
import { requestCashout as requestCashoutApi } from '../../lib/backend';
import { logAnalyticsEvent } from '../../lib/telemetry';

interface Transaction {
  id: string;
  type: 'wager' | 'earnings' | 'cashout';
  amount: number;
  description: string;
  timestamp: string;
}

export default function Wallet() {
  const user = useStore((s) => s.user);
  const setUser = useStore((s) => s.setUser);

  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: '1', type: 'earnings', amount: 0.25, description: 'Match win payout', timestamp: '2 hours ago' },
    { id: '2', type: 'wager', amount: -0.25, description: 'Stake entry', timestamp: '4 hours ago' },
  ]);
  const [cashoutModalVisible, setCashoutModalVisible] = useState(false);
  const [cashoutAmount, setCashoutAmount] = useState('');

  if (!user) return <Text className="p-4">Please sign in</Text>;

  const paid = isPaidTier(user.tier);
  const cashoutCheck = canCashout(user.tier, user.earnedBalance);
  const minCashout = getCashoutMinimum(user.tier);

  const handleCashout = async () => {
    const amount = Number.parseFloat(cashoutAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Enter a valid amount.');
      return;
    }

    if (!paid || minCashout === null) {
      Alert.alert('Cashout disabled', 'Cashout is available only for paid tiers.');
      return;
    }

    if (amount < minCashout) {
      Alert.alert('Minimum not met', `Minimum cashout for ${user.tier} is $${minCashout.toFixed(2)}.`);
      return;
    }

    if (amount > user.earnedBalance) {
      Alert.alert('Error', 'Insufficient earned balance.');
      return;
    }

    if (violatesRetainedBalanceRule(user.earnedBalance, amount)) {
      Alert.alert('Rule enforced', 'You must keep at least $1.00 in earned balance after cashout.');
      return;
    }

    const tx: Transaction = {
      id: Date.now().toString(),
      type: 'cashout',
      amount: -amount,
      description: 'Cashout to bank account',
      timestamp: new Date().toLocaleTimeString(),
    };

    try {
      await requestCashoutApi(amount);
      await logAnalyticsEvent('cashout_requested', {
        amount,
        tier: user.tier,
        retainedBalance: user.earnedBalance - amount,
      });

      setTransactions([tx, ...transactions]);
      setUser({ ...user, earnedBalance: user.earnedBalance - amount });
      Alert.alert('Cashout requested', `$${amount.toFixed(2)} is processing.`);
      setCashoutModalVisible(false);
      setCashoutAmount('');
    } catch (error: any) {
      Alert.alert('Cashout failed', error?.message || 'Unable to process cashout right now.');
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="px-6 pt-8">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Wallet</Text>
        <Text className="text-gray-600 mb-6">No ads. Subscription and real competition only.</Text>

        <View className="bg-white rounded-2xl p-5 mb-4 border border-gray-200">
          <Text className="text-xs text-gray-500 font-semibold">GAMEPLAY BALANCE</Text>
          <Text className="text-3xl font-bold text-gray-900 mt-1">${user.gameplayBalance.toFixed(2)}</Text>
          <Text className="text-xs text-gray-600 mt-1">One-time grant only. Never auto-replenished.</Text>
        </View>

        <View className="bg-white rounded-2xl p-5 mb-4 border border-gray-200">
          <Text className="text-xs text-gray-500 font-semibold">EARNED BALANCE</Text>
          {paid ? (
            <>
              <Text className="text-3xl font-bold text-orange-500 mt-1">${user.earnedBalance.toFixed(2)}</Text>
              <Text className="text-xs text-gray-600 mt-1">
                Min cashout: ${minCashout?.toFixed(2)} | Must leave $1.00 after cashout.
              </Text>
            </>
          ) : (
            <>
              <Text className="text-xl font-bold text-gray-400 mt-2">Hidden for Rookie</Text>
              <Text className="text-xs text-gray-600 mt-1">Upgrade to Hoopster/Elite for payouts.</Text>
            </>
          )}
        </View>

        <TouchableOpacity
          onPress={() => {
            if (!cashoutCheck.allowed) {
              Alert.alert('Cashout unavailable', cashoutCheck.reason ?? 'Not available yet.');
              return;
            }
            setCashoutModalVisible(true);
          }}
          className={`rounded-2xl py-4 mb-6 ${cashoutCheck.allowed ? 'bg-orange-500' : 'bg-gray-300'}`}
        >
          <Text className={`text-center font-bold ${cashoutCheck.allowed ? 'text-white' : 'text-gray-500'}`}>
            Cash Out Earnings
          </Text>
        </TouchableOpacity>

        <Text className="text-lg font-bold text-gray-900 mb-3">Recent Activity</Text>
        {transactions.map((tx) => {
          const positive = tx.amount > 0;
          return (
            <View key={tx.id} className="bg-white rounded-xl border border-gray-200 p-4 mb-2 flex-row justify-between items-center">
              <View>
                <Text className="font-bold text-gray-900">{tx.description}</Text>
                <Text className="text-xs text-gray-500">{tx.timestamp}</Text>
              </View>
              <Text className={`font-bold ${positive ? 'text-green-600' : 'text-red-600'}`}>
                {positive ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
              </Text>
            </View>
          );
        })}

        <View className="bg-orange-50 border border-orange-200 rounded-xl p-4 mt-6 mb-10">
          <Text className="font-bold text-gray-900 mb-2">Rules</Text>
          <Text className="text-sm text-gray-700">
            • Paid users must play with stakes{`\n`}
            • Gameplay balance is not replenished{`\n`}
            • Cashout keeps at least $1 retained balance
          </Text>
        </View>
      </View>

      <Modal visible={cashoutModalVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 pb-10">
            <Text className="text-2xl font-bold text-gray-900 mb-2">Cash Out</Text>
            <Text className="text-gray-600 mb-4">Available: ${user.earnedBalance.toFixed(2)}</Text>

            <TextInput
              value={cashoutAmount}
              onChangeText={setCashoutAmount}
              placeholder={`Minimum $${(minCashout ?? 0).toFixed(2)}`}
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
              className="border border-gray-300 rounded-lg p-3 text-gray-900 mb-4"
            />

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setCashoutModalVisible(false)}
                className="flex-1 bg-gray-300 rounded-lg py-3"
              >
                <Text className="text-center font-bold text-gray-900">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCashout} className="flex-1 bg-orange-500 rounded-lg py-3">
                <Text className="text-center font-bold text-white">Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
