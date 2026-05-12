import { View } from 'react-native';

type SkeletonCardProps = {
  lines?: number;
  className?: string;
};

export default function SkeletonCard({ lines = 2, className = '' }: SkeletonCardProps) {
  return (
    <View className={`bg-white p-4 rounded-xl mb-3 border border-gray-200 ${className}`.trim()}>
      <View className="h-5 w-32 bg-gray-200 rounded mb-2" />
      {Array.from({ length: lines }).map((_, idx) => (
        <View
          key={idx}
          className={`h-4 bg-gray-200 rounded ${idx === lines - 1 ? 'w-1/2' : 'w-4/5'} ${idx === 0 ? '' : 'mt-2'}`}
        />
      ))}
    </View>
  );
}
