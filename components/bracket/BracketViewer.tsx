import React from 'react';
import { View, Text, StyleSheet, Dimensions, useColorScheme } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  clamp,
} from 'react-native-reanimated';
import { BracketMatch, MATCH_WIDTH, MATCH_HEIGHT } from './BracketMatch';
import { ChampionDisplay } from './ChampionDisplay';
import { COLORS, FONT_SIZE, FONT_WEIGHT } from '../../constants/theme';
import type { Bracket, BracketRound, Match, PredictionMap } from '../../types';

// ─── Layout constants ────────────────────────────────────────────────────────

const MATCH_GAP = 24;
const CONNECTOR_WIDTH = 32;
const LABEL_HEIGHT = 36;
const SIDE_PADDING = 16;
const SLOT_BASE = MATCH_HEIGHT + MATCH_GAP; // 112px — base slot height for round 0

// ─── Types ───────────────────────────────────────────────────────────────────

interface ConnectorLine {
  key: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface BracketViewerProps {
  bracket: Bracket;
  predictions?: PredictionMap;
  onPickTeam?: (matchId: string, teamId: string) => void;
  isLocked?: boolean;
  primaryColor?: string;
}

// ─── Layout helpers ──────────────────────────────────────────────────────────

/**
 * Canvas width formula:
 *   SIDE_PADDING × 2  +  (2 × numSideRounds + 1) × MATCH_WIDTH  +  2 × numSideRounds × CONNECTOR_WIDTH
 *
 * Each round on both sides occupies (MATCH_WIDTH + CONNECTOR_WIDTH) horizontally.
 * The final adds one bare MATCH_WIDTH in the center.
 */
function computeCanvasWidth(numSideRounds: number): number {
  return (
    2 * SIDE_PADDING +
    (2 * numSideRounds + 1) * MATCH_WIDTH +
    2 * numSideRounds * CONNECTOR_WIDTH
  );
}

/** Left edge X of a left-side column (0-indexed round r). */
function leftColX(r: number): number {
  return SIDE_PADDING + r * (MATCH_WIDTH + CONNECTOR_WIDTH);
}

/** Left edge X of a right-side column (0-indexed round r, where r=0 is outermost). */
function rightColX(r: number, canvasWidth: number): number {
  return canvasWidth - SIDE_PADDING - MATCH_WIDTH - r * (MATCH_WIDTH + CONNECTOR_WIDTH);
}

/**
 * Vertical center of match m in a column that holds `colMatchCount` matches
 * within a canvas content area of `contentHeight`.
 * Offset by LABEL_HEIGHT + SIDE_PADDING for the top padding.
 */
function matchCenterY(m: number, colMatchCount: number, contentHeight: number): number {
  const slot = contentHeight / colMatchCount;
  return LABEL_HEIGHT + SIDE_PADDING + m * slot + slot / 2;
}

/** Top Y of the match card given its center. */
function matchTopY(centerY: number): number {
  return centerY - MATCH_HEIGHT / 2;
}

// ─── Connector line builder ───────────────────────────────────────────────────

/**
 * Build all connector lines for one side of the bracket.
 *
 * `colMatchCounts` is ordered from outermost round (index 0) inward.
 * The last entry connects to the final (1 match).
 *
 * Two connector patterns:
 *  - Straight (1:1): same number of matches in adjacent rounds → horizontal line
 *  - Paired (2:1): adjacent round halves → H-stub + V-bridge + H-to-next
 */
function buildSideConnectors(
  side: 'left' | 'right',
  colMatchCounts: number[],
  contentHeight: number,
  canvasWidth: number,
  numSideRounds: number
): ConnectorLine[] {
  const lines: ConnectorLine[] = [];
  const prefix = side === 'left' ? 'l' : 'r';

  const colX = (r: number) =>
    side === 'left' ? leftColX(r) : rightColX(r, canvasWidth);

  const cy = (r: number, m: number) =>
    matchCenterY(m, colMatchCounts[r], contentHeight);

  for (let r = 0; r < numSideRounds; r++) {
    const currN = colMatchCounts[r];
    const nextN = r < numSideRounds - 1 ? colMatchCounts[r + 1] : 1; // final has 1 match

    if (side === 'left') {
      const cardRight = colX(r) + MATCH_WIDTH;
      const bridgeX = cardRight + CONNECTOR_WIDTH / 2;

      if (nextN === currN) {
        // Straight 1:1 connectors
        for (let m = 0; m < currN; m++) {
          lines.push({ key: `${prefix}s${r}_${m}`, x: cardRight, y: cy(r, m), w: CONNECTOR_WIDTH, h: 1 });
        }
      } else if (nextN === Math.ceil(currN / 2)) {
        // Paired connectors
        for (let pair = 0; pair < nextN; pair++) {
          const m0 = pair * 2;
          const m1 = pair * 2 + 1;
          const cy0 = cy(r, m0);
          if (m1 >= currN) {
            // Unpaired edge case: straight connector
            lines.push({ key: `${prefix}s${r}_${pair}u`, x: cardRight, y: cy0, w: CONNECTOR_WIDTH, h: 1 });
          } else {
            const cy1 = cy(r, m1);
            const midY = (cy0 + cy1) / 2;
            lines.push({ key: `${prefix}ht${r}_${pair}`, x: cardRight,  y: cy0,  w: CONNECTOR_WIDTH / 2, h: 1 });
            lines.push({ key: `${prefix}hb${r}_${pair}`, x: cardRight,  y: cy1,  w: CONNECTOR_WIDTH / 2, h: 1 });
            lines.push({ key: `${prefix}v${r}_${pair}`,  x: bridgeX,    y: cy0,  w: 1, h: cy1 - cy0 });
            lines.push({ key: `${prefix}hn${r}_${pair}`, x: bridgeX,    y: midY, w: CONNECTOR_WIDTH / 2, h: 1 });
          }
        }
      }
      // Other ratios: skip connectors
    } else {
      // Right side: connectors go leftward from card left edge
      const cardLeft = colX(r);
      const bridgeX = cardLeft - CONNECTOR_WIDTH / 2;

      if (nextN === currN) {
        // Straight 1:1 connectors
        for (let m = 0; m < currN; m++) {
          lines.push({ key: `${prefix}s${r}_${m}`, x: cardLeft - CONNECTOR_WIDTH, y: cy(r, m), w: CONNECTOR_WIDTH, h: 1 });
        }
      } else if (nextN === Math.ceil(currN / 2)) {
        // Paired connectors
        for (let pair = 0; pair < nextN; pair++) {
          const m0 = pair * 2;
          const m1 = pair * 2 + 1;
          const cy0 = cy(r, m0);
          if (m1 >= currN) {
            lines.push({ key: `${prefix}s${r}_${pair}u`, x: cardLeft - CONNECTOR_WIDTH, y: cy0, w: CONNECTOR_WIDTH, h: 1 });
          } else {
            const cy1 = cy(r, m1);
            const midY = (cy0 + cy1) / 2;
            const nextColRight = rightColX(r + 1 < numSideRounds ? r + 1 : r, canvasWidth) + MATCH_WIDTH;
            lines.push({ key: `${prefix}ht${r}_${pair}`, x: bridgeX,     y: cy0,  w: CONNECTOR_WIDTH / 2, h: 1 });
            lines.push({ key: `${prefix}hb${r}_${pair}`, x: bridgeX,     y: cy1,  w: CONNECTOR_WIDTH / 2, h: 1 });
            lines.push({ key: `${prefix}v${r}_${pair}`,  x: bridgeX,     y: cy0,  w: 1, h: cy1 - cy0 });
            lines.push({ key: `${prefix}hn${r}_${pair}`, x: nextColRight, y: midY, w: CONNECTOR_WIDTH / 2, h: 1 });
          }
        }
      }
    }
  }

  return lines;
}

// ─── Label positions ──────────────────────────────────────────────────────────

interface LabelInfo {
  label: string;
  centerX: number;
}

function buildLabels(
  sideRounds: BracketRound[],
  finalRound: BracketRound,
  canvasWidth: number,
  numSideRounds: number
): LabelInfo[] {
  const labels: LabelInfo[] = [];
  const finalCenterX = canvasWidth / 2;

  sideRounds.forEach((round, r) => {
    // Left column label
    labels.push({
      label: round.label,
      centerX: leftColX(r) + MATCH_WIDTH / 2,
    });
    // Right column label (mirror)
    labels.push({
      label: round.label,
      centerX: rightColX(r, canvasWidth) + MATCH_WIDTH / 2,
    });
  });

  labels.push({ label: finalRound.label, centerX: finalCenterX });
  return labels;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BracketViewer({
  bracket,
  predictions = {},
  onPickTeam,
  isLocked,
  primaryColor = COLORS.primary,
}: BracketViewerProps) {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? COLORS.dark : COLORS.light;

  // Compute layout (always, so hooks below are unconditional)
  const hasRounds = bracket.rounds.length > 0;
  const hasSideRounds = bracket.rounds.length > 1;
  const sideRounds = hasSideRounds ? bracket.rounds.slice(0, -1) : [];
  const finalRound = bracket.rounds[bracket.rounds.length - 1] ?? null;
  const numSideRounds = sideRounds.length;

  const leftMatchesByRound: Match[][] = sideRounds.map((r) =>
    r.matches.slice(0, Math.ceil(r.matches.length / 2))
  );
  const rightMatchesByRound: Match[][] = sideRounds.map((r) =>
    r.matches.slice(Math.ceil(r.matches.length / 2))
  );

  const maxLeftMatches = hasSideRounds ? (leftMatchesByRound[0]?.length ?? 1) : 1;
  const contentHeight = maxLeftMatches * SLOT_BASE;
  const canvasWidth = hasSideRounds
    ? computeCanvasWidth(numSideRounds)
    : SIDE_PADDING * 2 + MATCH_WIDTH;
  const canvasHeight = LABEL_HEIGHT + contentHeight + SIDE_PADDING * 2;

  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const fitScale = hasRounds
    ? Math.min((screenWidth - 8) / canvasWidth, (screenHeight * 0.65) / canvasHeight, 1.0)
    : 1;

  // ── Hooks (never conditional) ─────────────────────────────────────────────
  const scale = useSharedValue(fitScale);
  const savedScale = useSharedValue(fitScale);
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const savedOffsetX = useSharedValue(0);
  const savedOffsetY = useSharedValue(0);

  // Pinch is Simultaneous with everything so it's never blocked by double-tap delay
  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = clamp(savedScale.value * e.scale, 0.2, 2.5);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const pan = Gesture.Pan()
    .minDistance(4)
    .onUpdate((e) => {
      offsetX.value = savedOffsetX.value + e.translationX;
      offsetY.value = savedOffsetY.value + e.translationY;
    })
    .onEnd(() => {
      savedOffsetX.value = offsetX.value;
      savedOffsetY.value = offsetY.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      scale.value = withTiming(fitScale);
      savedScale.value = fitScale;
      offsetX.value = withTiming(0);
      offsetY.value = withTiming(0);
      savedOffsetX.value = 0;
      savedOffsetY.value = 0;
    });

  // Pinch (2-finger) is always simultaneous — never blocked by 1-finger gesture timeout
  const all = Gesture.Simultaneous(
    pinch,
    Gesture.Exclusive(doubleTap, pan)
  );

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: offsetX.value },
      { translateY: offsetY.value },
      { scale: scale.value },
    ],
  }));

  // Early exit after all hooks
  if (!hasRounds || !finalRound) return null;

  // Derived render data (after early exit so finalRound is non-null)
  const leftColMatchCounts = leftMatchesByRound.map((m) => m.length);
  const rightColMatchCounts = rightMatchesByRound.map((m) => m.length);

  const connectorLines: ConnectorLine[] = hasSideRounds
    ? [
        ...buildSideConnectors('left', leftColMatchCounts, contentHeight, canvasWidth, numSideRounds),
        ...buildSideConnectors('right', rightColMatchCounts, contentHeight, canvasWidth, numSideRounds),
      ]
    : [];

  const labels = buildLabels(sideRounds, finalRound, canvasWidth, numSideRounds);

  const finalCenterX = canvasWidth / 2;
  const finalCenterY = LABEL_HEIGHT + SIDE_PADDING + contentHeight / 2;
  const finalX = finalCenterX - MATCH_WIDTH / 2;
  const finalY = matchTopY(finalCenterY);

  return (
    <GestureDetector gesture={all}>
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.canvas,
            { width: canvasWidth, height: canvasHeight },
            animStyle,
          ]}
        >
          {/* ── Round labels ─────────────────────────────────────── */}
          {labels.map((lbl, i) => (
            <Text
              key={`lbl_${i}`}
              style={[styles.roundLabel, { color: theme.textSecondary, left: lbl.centerX - 60, width: 120 }]}
              numberOfLines={1}
            >
              {lbl.label}
            </Text>
          ))}

          {/* ── Connector lines ───────────────────────────────────── */}
          {connectorLines.map((line) => (
            <View
              key={line.key}
              style={{
                position: 'absolute',
                left: line.x,
                top: line.y,
                width: line.w,
                height: Math.max(line.h, 1),
                backgroundColor: theme.border,
              }}
            />
          ))}

          {/* ── Left side matches ─────────────────────────────────── */}
          {sideRounds.map((_round, r) =>
            leftMatchesByRound[r].map((match, m) => {
              const cy = matchCenterY(m, leftMatchesByRound[r].length, contentHeight);
              return (
                <View
                  key={match.id}
                  style={{ position: 'absolute', left: leftColX(r), top: matchTopY(cy) }}
                >
                  <BracketMatch
                    match={match}
                    onPickTeam={onPickTeam}
                    selectedTeamId={predictions[match.id]}
                    isLocked={isLocked}
                    primaryColor={primaryColor}
                  />
                </View>
              );
            })
          )}

          {/* ── Right side matches ────────────────────────────────── */}
          {sideRounds.map((_round, r) =>
            rightMatchesByRound[r].map((match, m) => {
              const cy = matchCenterY(m, rightMatchesByRound[r].length, contentHeight);
              return (
                <View
                  key={match.id}
                  style={{ position: 'absolute', left: rightColX(r, canvasWidth), top: matchTopY(cy) }}
                >
                  <BracketMatch
                    match={match}
                    onPickTeam={onPickTeam}
                    selectedTeamId={predictions[match.id]}
                    isLocked={isLocked}
                    primaryColor={primaryColor}
                    isRightSide
                  />
                </View>
              );
            })
          )}

          {/* ── Final match ───────────────────────────────────────── */}
          <View style={{ position: 'absolute', left: finalX, top: finalY }}>
            <BracketMatch
              match={finalRound.matches[0]}
              onPickTeam={onPickTeam}
              selectedTeamId={predictions[finalRound.matches[0]?.id ?? '']}
              isLocked={isLocked}
              primaryColor={primaryColor}
            />
          </View>

          {/* ── Champion display ──────────────────────────────────── */}
          {bracket.champion && (
            <View
              style={{
                position: 'absolute',
                left: finalCenterX - 100,
                top: finalY + MATCH_HEIGHT + 16,
                width: 200,
                alignItems: 'center',
              }}
            >
              <ChampionDisplay
                champion={bracket.champion}
                leagueName={bracket.leagueId.toUpperCase()}
                season={bracket.season}
                primaryColor={primaryColor}
              />
            </View>
          )}
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvas: {
    position: 'relative',
  },
  roundLabel: {
    position: 'absolute',
    top: 6,
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    textAlign: 'center',
  },
});
