import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOW } from '../constants/theme';

// Format date nicely: "17 Mar 2026 · 04:30 PM"
function formatDate(dateString) {
  if (!dateString) return 'No Date';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'Invalid Date';
    const date = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${date}  ·  ${time}`;
  } catch {
    return 'Date Error';
  }
}

// Category theme mapping
const CATEGORY_THEMES = {
  Water: { icon: 'water', color: '#2196F3', bg: '#E3F2FD' },
  Electricity: { icon: 'flash', color: '#FF9800', bg: '#FFF3E0' },
  Maintenance: { icon: 'construct', color: '#795548', bg: '#EFEBE9' },
  Meeting: { icon: 'people', color: '#4CAF50', bg: '#E8F5E9' },
  Election: { icon: 'how-to-vote', color: '#9C27B0', bg: '#F3E5F5' },
  Security: { icon: 'shield-checkmark', color: '#F44336', bg: '#FFEBEE' },
  General: { icon: 'megaphone', color: '#607D8B', bg: '#ECEFF1' },
  Other: { icon: 'document-text', color: '#9E9E9E', bg: '#F5F5F5' },
};

export default function NoticeCard({ notice, onPress }) {
  if (!notice) return null;

  const category = notice.category || 'General';
  const theme = CATEGORY_THEMES[category] || CATEGORY_THEMES.Other;
  
  // Dynamic visual read receipt: Mutes the border color if notice is acknowledged
  const borderLeftColor = notice.hasAcknowledged ? COLORS.textMuted : theme.color;

  return (
    <TouchableOpacity style={[styles.card, { borderLeftColor }]} onPress={onPress} activeOpacity={0.85}>
      {/* Top row: date column (left) + IMPORTANT badge (right) */}
      {/* Top row: Date + Attribution */}
      <View style={styles.topRow}>
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={12} color={COLORS.textMuted} />
          <Text style={styles.dateText}>{formatDate(notice.createdAt)}</Text>
        </View>

        <View style={styles.attribution}>
          {notice.isImportant && <View style={styles.miniImportant}><Ionicons name="alert-circle" size={10} color={COLORS.white} /></View>}
          {notice.isPoll && <View style={styles.miniPoll}><Ionicons name="stats-chart" size={10} color={COLORS.white} /></View>}
        </View>
      </View>

      {/* Headline — shown first, bold */}
      <Text style={styles.headline} numberOfLines={2}>{notice.headline}</Text>

      {/* Body preview — shown after headline */}
      <Text style={styles.bodyPreview} numberOfLines={2}>{notice.body}</Text>
 
      {/* Attachment Bar — Prominent link for documents/links */}
      {notice.externalLink && (
        <TouchableOpacity 
          activeOpacity={0.7}
          style={styles.attachmentBar} 
          onPress={() => Linking.openURL(notice.externalLink)}
        >
          <View style={styles.attachmentIcon}>
            <Ionicons name="document-attach-outline" size={16} color={COLORS.primary} />
          </View>
          <Text style={styles.attachmentText} numberOfLines={1}>
            View Attached Document / Link
          </Text>
          <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} />
        </TouchableOpacity>
      )}

      {/* Bottom row: category chip */}
      <View style={styles.bottomRow}>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <View style={[styles.categoryChip, { backgroundColor: theme.bg }]}>
            <Ionicons name={theme.icon} size={12} color={theme.color} />
            <Text style={[styles.categoryText, { color: theme.color }]}>{notice.category}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    ...SHADOW,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginLeft: 3,
  },
  importantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.importantBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 3,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  importantText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.important,
    letterSpacing: 0.5,
    marginLeft: 2,
  },
  headline: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 22,
    marginBottom: 6,
  },
  bodyPreview: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
    marginBottom: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 4,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 2,
    textTransform: 'uppercase',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  attachmentBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4FB',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 4,
  },
  attachmentIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    ...SHADOW,
  },
  attachmentText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primaryDark,
  },
  attribution: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  postedByText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '700',
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleAdmin: { backgroundColor: '#FFF3E0' },
  roleResident: { backgroundColor: '#F5F5F5' },
  roleText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  miniImportant: {
    backgroundColor: COLORS.important,
    borderRadius: 10,
    padding: 2,
    marginRight: 4,
  },
  miniPoll: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 2,
    marginRight: 4,
  },
});
