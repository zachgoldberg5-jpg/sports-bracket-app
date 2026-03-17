import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Image,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useAuthStore } from '../../../store/authStore';
import { Avatar } from '../../../components/ui/Avatar';
import { AVATAR_SECTIONS } from '../../../constants/avatars';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '../../../constants/theme';

export default function SettingsScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? COLORS.dark : COLORS.light;
  const profile = useAuthStore((s) => s.profile);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [username, setUsername] = useState(profile?.username ?? '');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [saveError, setSaveError] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [selectedSection, setSelectedSection] = useState(0);
  const [showPicker, setShowPicker] = useState(false);

  const currentAvatar = profile?.avatarUrl ?? null;

  async function handleSelectAvatar(url: string) {
    await updateProfile({ avatarUrl: url });
    setShowPicker(false);
  }

  async function handleSave() {
    setSaveMsg('');
    setSaveError('');
    if (!displayName.trim()) {
      setSaveError('Display name cannot be empty.');
      return;
    }
    setSaving(true);
    const error = await updateProfile({
      displayName: displayName.trim(),
      username: username.trim().toLowerCase(),
    });
    setSaving(false);
    if (error) {
      setSaveError(error.includes('unique') ? 'That username is already taken.' : 'Failed to save. Please try again.');
    } else {
      setSaveMsg('Profile updated!');
      setShowPicker(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <Stack.Screen options={{ title: 'Settings' }} />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* ── Avatar picker ── */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Profile Picture</Text>
        <View style={[styles.section, { backgroundColor: theme.surface }]}>

          {/* Collapsed row — always visible */}
          <TouchableOpacity style={styles.previewRow} onPress={() => setShowPicker((v) => !v)} activeOpacity={0.8}>
            <Avatar uri={currentAvatar} name={profile?.displayName} size={52} />
            <View style={styles.previewText}>
              <Text style={[styles.previewTitle, { color: theme.text }]}>
                {currentAvatar ? 'Change avatar' : 'Choose an avatar'}
              </Text>
              <Text style={[styles.previewSub, { color: theme.textSecondary }]}>
                {showPicker ? 'Tap a character to select' : 'Tap to browse characters'}
              </Text>
            </View>
            <Text style={[styles.chevron, { color: theme.textTertiary }]}>
              {showPicker ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>

          {/* Expanded picker */}
          {showPicker && (
            <>
              {/* Category tabs */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tabs}
              >
                {AVATAR_SECTIONS.map((section, idx) => (
                  <TouchableOpacity
                    key={section.label}
                    style={[
                      styles.tab,
                      { borderColor: theme.border },
                      selectedSection === idx && { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
                    ]}
                    onPress={() => setSelectedSection(idx)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.tabText, { color: selectedSection === idx ? '#FFF' : theme.textSecondary }]}>
                      {section.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Avatar grid */}
              <View style={styles.grid}>
                {AVATAR_SECTIONS[selectedSection].avatars.map((url) => {
                  const isSelected = currentAvatar === url;
                  return (
                    <TouchableOpacity
                      key={url}
                      style={[styles.avatarCell, isSelected && { borderColor: COLORS.primary, borderWidth: 3 }]}
                      onPress={() => handleSelectAvatar(url)}
                      activeOpacity={0.75}
                    >
                      <Image source={{ uri: url }} style={styles.avatarImg} resizeMode="cover" />
                      {isSelected && (
                        <View style={styles.selectedBadge}>
                          <Text style={styles.selectedCheck}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
        </View>

        {/* ── Profile fields ── */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Profile</Text>
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Display Name</Text>
            <TextInput
              style={[styles.fieldInput, { color: theme.text, borderBottomColor: theme.border }]}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your display name"
              placeholderTextColor={theme.textTertiary}
            />
          </View>
          <View style={[styles.field, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border }]}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Username</Text>
            <TextInput
              style={[styles.fieldInput, { color: theme.text, borderBottomColor: theme.border }]}
              value={username}
              onChangeText={(t) => setUsername(t.toLowerCase())}
              placeholder="@username"
              placeholderTextColor={theme.textTertiary}
              autoCapitalize="none"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#FFF" /> : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>

        {saveMsg ? <Text style={styles.successText}>{saveMsg}</Text> : null}
        {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}

        {/* ── Notifications ── */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Notifications</Text>
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          {[
            { key: 'game_results', label: 'Game Results', sub: 'When games in your brackets finish' },
            { key: 'leaderboard', label: 'Leaderboard Updates', sub: 'When someone passes you in a group' },
            { key: 'deadline', label: 'Pick Deadlines', sub: '24 hours before picks lock' },
            { key: 'friends', label: 'Friend Activity', sub: 'When friends join your group' },
          ].map((item, idx) => (
            <View
              key={item.key}
              style={[styles.switchRow, idx > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border }]}
            >
              <View style={styles.switchContent}>
                <Text style={[styles.switchLabel, { color: theme.text }]}>{item.label}</Text>
                <Text style={[styles.switchSub, { color: theme.textSecondary }]}>{item.sub}</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: theme.border, true: COLORS.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          ))}
        </View>

        {/* ── About ── */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>About</Text>
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: theme.textSecondary }]}>Version</Text>
            <Text style={[styles.aboutValue, { color: theme.text }]}>1.0.0</Text>
          </View>
          <View style={[styles.aboutRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border }]}>
            <Text style={[styles.aboutLabel, { color: theme.textSecondary }]}>Member since</Text>
            <Text style={[styles.aboutValue, { color: theme.text }]}>
              {profile?.createdAt ? new Date(profile.createdAt).getFullYear() : ''}
            </Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const CELL = 64;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: SPACING.base, paddingBottom: SPACING['2xl'], gap: SPACING.xs },
  sectionLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: SPACING.base,
    marginBottom: SPACING.xs,
    paddingHorizontal: SPACING.xs,
  },
  section: { borderRadius: RADIUS.lg, overflow: 'hidden' },
  // Avatar picker
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.base,
    padding: SPACING.base,
  },
  previewText: { flex: 1 },
  previewTitle: { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.semibold },
  previewSub: { fontSize: FONT_SIZE.sm, marginTop: 3, lineHeight: 18 },
  chevron: { fontSize: 12 },
  tabs: {
    flexDirection: 'row',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.sm,
  },
  tab: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  tabText: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.semibold },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.sm,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  avatarCell: {
    width: CELL,
    height: CELL,
    borderRadius: CELL / 2,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  selectedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCheck: { color: '#FFF', fontSize: 11, fontWeight: FONT_WEIGHT.bold },
  // Profile fields
  field: { padding: SPACING.base },
  fieldLabel: { fontSize: FONT_SIZE.xs, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SPACING.xs },
  fieldInput: { fontSize: FONT_SIZE.base, paddingVertical: SPACING.xs, borderBottomWidth: StyleSheet.hairlineWidth },
  saveButton: {
    height: 48,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  saveButtonText: { color: '#FFF', fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold },
  successText: { fontSize: FONT_SIZE.sm, color: '#22C55E', textAlign: 'center', marginTop: SPACING.xs },
  errorText: { fontSize: FONT_SIZE.sm, color: '#EF4444', textAlign: 'center', marginTop: SPACING.xs },
  switchRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.base, gap: SPACING.md },
  switchContent: { flex: 1 },
  switchLabel: { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.medium },
  switchSub: { fontSize: FONT_SIZE.sm, marginTop: 1 },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.base },
  aboutLabel: { fontSize: FONT_SIZE.base },
  aboutValue: { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.medium },
});
