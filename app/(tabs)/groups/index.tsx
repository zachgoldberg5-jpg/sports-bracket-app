import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { useGroups } from '../../../hooks/useGroups';
import { GroupCard } from '../../../components/groups/GroupCard';
import { EmptyState } from '../../../components/ui/EmptyState';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING } from '../../../constants/theme';

export default function GroupsScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? COLORS.dark : COLORS.light;
  const { groups, loading, refresh } = useGroups();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <Stack.Screen
        options={{
          title: 'My Groups',
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={() => router.push('/(tabs)/groups/join')}>
                <Text style={[styles.headerAction, { color: COLORS.primary }]}>Join</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/(tabs)/groups/create')}>
                <Text style={[styles.headerAction, { color: COLORS.primary }]}>+ Create</Text>
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <GroupCard
            group={item}
            onPress={() => router.push(`/(tabs)/groups/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="👥"
              title="No groups yet"
              subtitle="Create a group or join one with an invite code to start competing with friends."
              actionLabel="Create a Group"
              onAction={() => router.push('/(tabs)/groups/create')}
            />
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={COLORS.primary} />
        }
        contentContainerStyle={groups.length === 0 ? styles.emptyList : styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingTop: SPACING.sm, paddingBottom: SPACING['2xl'] },
  emptyList: { flex: 1 },
  headerActions: { flexDirection: 'row', gap: SPACING.md, marginRight: SPACING.xs },
  headerAction: { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.medium },
});
