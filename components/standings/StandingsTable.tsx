import React from 'react';
import { View, Text, StyleSheet, SectionList, SectionListData } from 'react-native';
import { useColorScheme } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING } from '../../constants/theme';
import { StandingsRow } from './StandingsRow';
import type { ConferenceStandings, StandingsEntry } from '../../types';

interface StandingsTableProps {
  conferences: ConferenceStandings[];
  playoffSpots?: number; // draw a line after this many spots (e.g. 8 for NBA)
}

export function StandingsTable({ conferences, playoffSpots = 8 }: StandingsTableProps) {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? COLORS.dark : COLORS.light;

  const sections: SectionListData<StandingsEntry>[] = conferences.map((c) => ({
    title: c.conference,
    data: c.entries,
  }));

  const hasWinPct = conferences[0]?.entries[0]?.winPct !== undefined;
  const hasGB = conferences[0]?.entries[0]?.gamesBack !== undefined;
  const hasPoints = conferences[0]?.entries[0]?.points !== undefined;

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.team.id}
      renderSectionHeader={({ section }) =>
        conferences.length > 1 ? (
          <View style={[styles.sectionHeader, { backgroundColor: theme.surfaceAlt }]}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              {section.title}
            </Text>
          </View>
        ) : null
      }
      renderSectionFooter={() => <View style={styles.sectionGap} />}
      ListHeaderComponent={
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Text style={[styles.headerCell, { width: 24 }, { color: theme.textTertiary }]}>#</Text>
          <Text style={[styles.headerCell, { width: 30, marginHorizontal: SPACING.sm }]}> </Text>
          <Text style={[styles.headerCell, { flex: 1 }, { color: theme.textTertiary }]}>Team</Text>
          <Text style={[styles.headerCell, { width: 52, textAlign: 'right' }, { color: theme.textTertiary }]}>W-L</Text>
          {hasWinPct && <Text style={[styles.headerCell, { width: 42, textAlign: 'right' }, { color: theme.textTertiary }]}>PCT</Text>}
          {hasGB && <Text style={[styles.headerCell, { width: 42, textAlign: 'right' }, { color: theme.textTertiary }]}>GB</Text>}
          {hasPoints && <Text style={[styles.headerCell, { width: 42, textAlign: 'right' }, { color: theme.textTertiary }]}>PTS</Text>}
        </View>
      }
      renderItem={({ item, index }) => (
        <StandingsRow
          entry={item}
          showDivider
          highlightPlayoffLine={index + 1 === playoffSpots}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerCell: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionHeader: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.xs + 2,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionGap: {
    height: SPACING.base,
  },
});
