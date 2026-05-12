import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { View, Text, Pressable } from 'react-native';
import * as Haptic from 'expo-haptics';

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const handleReset = () => {
    void Haptic.notificationAsync(Haptic.NotificationFeedbackType.Error);
    resetErrorBoundary();
  };

  return (
    <View className="flex-1 bg-gray-50 justify-center items-center p-6">
      <Text className="text-3xl mb-4">⚠️</Text>
      <Text className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</Text>
      <Text className="text-gray-600 text-center mb-6 text-sm leading-5">
        {error?.message || 'An unexpected error occurred. Please try again.'}
      </Text>
      <Pressable
        className="bg-orange-500 px-6 py-3 rounded-xl active:opacity-80"
        onPress={handleReset}
      >
        <Text className="text-white font-semibold">Try Again</Text>
      </Pressable>
    </View>
  );
}

export function AppErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // TODO: Log boundary reset to telemetry (Sentry/Firebase Analytics) post-launch.
      }}
      onError={(_error, _info) => {
        // TODO: Log boundary exception details to telemetry post-launch.
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
