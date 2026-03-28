import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Linking, Image, Share, TextInput
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { 
  getNotice, acknowledgeNotice, deleteNotice, castVote, postComment,
  likeNotice, bookmarkNotice 
} from '../services/api';
import { translateNotice, LANGUAGES } from '../services/translate';
import { useAuth } from './_layout';
import { COLORS, SHADOW } from '../constants/theme';

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
}

export default function NoticeDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user, updateUser } = useAuth();

  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeLang, setActiveLang] = useState('English');
  const [translating, setTranslating] = useState(false);
  const [translated, setTranslated] = useState({ headline: '', body: '' });
  const [acknowledging, setAcknowledging] = useState(false);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [voting, setVoting] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => { fetchNotice(); }, [id]);

  const fetchNotice = async () => {
    try {
      const res = await getNotice(id);
      const n = res.data.data;
      setNotice(n);
      setTranslated({ headline: n.headline, body: n.body });
      setHasAcknowledged(n.hasAcknowledged);
      setIsBookmarked(user?.bookmarks?.includes(id));
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Could not load notice' });
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleTranslate = async (lang) => {
    setActiveLang(lang);
    if (lang === 'English') {
      setTranslated({ headline: notice.headline, body: notice.body });
      return;
    }
    setTranslating(true);
    try {
      const result = await translateNotice(notice.headline, notice.body, lang);
      setTranslated(result);
    } catch {
      Toast.show({ type: 'error', text1: 'Translation failed' });
      setTranslated({ headline: notice.headline, body: notice.body });
    } finally {
      setTranslating(false);
    }
  };

  useEffect(() => {
    if (notice && user?.role === 'resident' && !hasAcknowledged && !acknowledging) {
      handleAutoAcknowledge();
    }
  }, [notice, hasAcknowledged, user]);

  const handleAutoAcknowledge = async () => {
    setAcknowledging(true);
    try {
      await acknowledgeNotice(id);
      setHasAcknowledged(true);
      // Silently acknowledged in background
    } catch {
      console.log('Auto-acknowledge failed');
    } finally {
      setAcknowledging(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `📢 *${notice.headline}*\n\n${notice.body}\n\n- ${notice.societyName}`,
      });
    } catch (error) {
      console.log('Error sharing', error);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Notice', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          setDeleting(true);
          try {
            await deleteNotice(id);
            Toast.show({ type: 'success', text1: 'Notice deleted' });
            router.back();
          } catch {
            Toast.show({ type: 'error', text1: 'Could not delete' });
            setDeleting(false);
          }
        }
      }
    ]);
  };

  const handleVote = async (optionId) => {
    setVoting(true);
    try {
      const res = await castVote(id, optionId);
      setNotice(res.data.data); // Replace state locally with updated schema
      Toast.show({ type: 'success', text1: 'Vote casted!' });
    } catch (err) {
      Toast.show({ type: 'error', text1: err?.response?.data?.message || 'Vote failed' });
    } finally {
      setVoting(false);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await postComment(id, commentText);
      setNotice(prev => ({ ...prev, comments: res.data.data }));
      setCommentText('');
    } catch (err) {
      Toast.show({ type: 'error', text1: err?.response?.data?.message || 'Failed to post comment' });
    } finally {
      setSubmittingComment(false);
    }
  };

  // Attachment open karo browser mein
  const openAttachment = async () => {
    if (!notice.attachment) return;
    try {
      await Linking.openURL(notice.attachment);
    } catch {
      Toast.show({ type: 'error', text1: 'Could not open file' });
    }
  };

  // Check karo attachment image hai ya PDF
  const isImage = (url) => {
    if (!url) return false;
    return /\.(jpg|jpeg|png)$/i.test(url);
  };

  const handleBookmark = async () => {
    try {
      const res = await bookmarkNotice(id);
      setIsBookmarked(!isBookmarked);
      if (updateUser) await updateUser({ bookmarks: res.data.bookmarks });
      Toast.show({ type: 'success', text1: isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks' });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to update bookmark' });
    }
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  if (!notice) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Notice Detail</Text>
        <TouchableOpacity onPress={handleShare} style={styles.headerAction}>
          <Ionicons name="share-social-outline" size={22} color={COLORS.white} />
        </TouchableOpacity>
        {user?.role === 'admin' && (
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/post-notice', params: { id } })}
            style={styles.headerAction}>
            <Ionicons name="create-outline" size={22} color={COLORS.white} />
          </TouchableOpacity>
        )}
        {user?.role === 'admin' && (
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/ack-list', params: { id } })}
            style={styles.headerAction}>
            <Ionicons name="people-outline" size={22} color={COLORS.white} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scroll}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}>

        {/* IMPORTANT badge */}
        {notice.isImportant && (
          <View style={styles.importantBanner}>
            <Ionicons name="alert-circle" size={20} color={COLORS.important} />
            <Text style={styles.importantBannerText}>IMPORTANT NOTICE</Text>
          </View>
        )}

        {/* Date */}
        <View style={styles.dateChip}>
          <Ionicons name="calendar" size={14} color={COLORS.primary} />
          <Text style={styles.dateText}>{formatDate(notice.createdAt)}</Text>
        </View>

        {/* Headline */}
        <View style={styles.headlineCard}>
          {translating
            ? <ActivityIndicator color={COLORS.primary} style={{ paddingVertical: 10 }} />
            : <Text style={styles.headline}>{translated.headline}</Text>
          }
        </View>

        {/* Body */}
        <View style={styles.bodyCard}>
          <Text style={styles.bodyLabel}>Full Notice</Text>
          {translating
            ? <ActivityIndicator color={COLORS.primary} style={{ paddingVertical: 20 }} />
            : <Text style={styles.bodyText}>{translated.body}</Text>
          }

          <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 16 }} />

          <View style={styles.socialRow}>
            <TouchableOpacity onPress={handleBookmark} style={styles.socialBtn}>
              <Ionicons 
                name={isBookmarked ? 'bookmark' : 'bookmark-outline'} 
                size={22} color={isBookmarked ? COLORS.primary : COLORS.textMuted} 
              />
              <Text style={styles.socialText}>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Meta info */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="grid-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.metaText}>{notice.category}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="person-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.metaText}>
              Posted by <Text style={{fontWeight: '700'}}>{notice.postedByName}</Text>
            </Text>
          </View>
          {notice.expiryDate && (
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.metaText}>
                Expires: {new Date(notice.expiryDate).toLocaleDateString('en-IN')}
              </Text>
            </View>
          )}
        </View>

        {/* POLLING INTERFACE */}
        {notice.isPoll && notice.pollOptions && (
          <View style={styles.pollCard}>
            <Text style={styles.pollTitle}>📊 Resident Poll</Text>
            {notice.pollOptions.map((opt, i) => {
              const totalVotes = notice.pollOptions.reduce((acc, curr) => acc + (curr.votes?.length || 0), 0);
              const optVotes = opt.votes?.length || 0;
              const percent = totalVotes === 0 ? 0 : Math.round((optVotes / totalVotes) * 100);
              const hasVotedOpt = opt.votes ? opt.votes.includes(user?._id) : false;
              const hasVotedAny = notice.pollOptions.some(o => o.votes ? o.votes.includes(user?._id) : false);

              return (
                <TouchableOpacity 
                  key={opt._id || Math.random().toString()} 
                  style={[styles.pollOption, hasVotedAny && {opacity: 0.9}]} 
                  disabled={hasVotedAny || voting}
                  onPress={() => handleVote(opt._id)}
                >
                   <View style={[styles.pollBar, { width: `${hasVotedAny ? percent : 0}%` }, hasVotedOpt && styles.pollBarVoted]} />
                   <View style={styles.pollContent}>
                     <Text style={[styles.pollOptText, hasVotedOpt && styles.pollOptTextVoted]}>{opt.text}</Text>
                     {hasVotedAny && <Text style={styles.pollPercent}>{percent}%</Text>}
                   </View>
                </TouchableOpacity>
              )
            })}
            <Text style={styles.pollTotalVotes}>
               {notice.pollOptions.reduce((acc, curr) => acc + (curr.votes?.length || 0), 0)} Total Votes
            </Text>
          </View>
        )}

        {/* Translation buttons */}
        <View style={styles.translateSection}>
          <Text style={styles.translateLabel}>🌐 Translate Notice</Text>
          <View style={styles.langRow}>
            {LANGUAGES.map(lang => (
              <TouchableOpacity
                key={lang}
                style={[styles.langBtn, activeLang === lang && styles.langBtnActive]}
                onPress={() => handleTranslate(lang)}
                disabled={translating}
              >
                <Text style={[styles.langBtnText, activeLang === lang && styles.langBtnTextActive]}>
                  {lang}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Acknowledge button has been removed. Feature is now auto-seen. */}
        {/* Delete button for admin */}
        {user?.role === 'admin' && (
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} disabled={deleting}>
            {deleting
              ? <ActivityIndicator color={COLORS.important} />
              : <>
                <Ionicons name="trash-outline" size={18} color={COLORS.important} />
                <Text style={styles.deleteBtnText}>Delete This Notice</Text>
              </>
            }
          </TouchableOpacity>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center',
    paddingTop: 52, paddingBottom: 14, paddingHorizontal: 16, gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: COLORS.white },
  headerAction: { padding: 4 },
  scroll: { flex: 1 },
  importantBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.importantBg, borderRadius: 12,
    padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#FFCDD2',
  },
  importantBannerText: { fontSize: 13, fontWeight: '800', color: COLORS.important, letterSpacing: 0.5 },
  dateChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#EBF2FF', alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 14,
  },
  dateText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  headlineCard: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 16,
    marginBottom: 12, borderLeftWidth: 4, borderLeftColor: COLORS.primary, ...SHADOW,
  },
  headline: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, lineHeight: 26 },
  bodyCard: { backgroundColor: COLORS.white, borderRadius: 14, padding: 16, marginBottom: 12, ...SHADOW },
  bodyLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  bodyText: { fontSize: 15, color: COLORS.textSecondary, lineHeight: 24 },
  attachmentCard: { backgroundColor: COLORS.white, borderRadius: 14, padding: 16, marginBottom: 12, ...SHADOW },
  attachmentImage: { width: '100%', height: 200, borderRadius: 10, marginTop: 8 },
  attachmentHint: { fontSize: 11, color: COLORS.textMuted, textAlign: 'center', marginTop: 6 },
  pdfBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFF3E0', borderRadius: 12, padding: 14, marginTop: 8,
  },
  pdfBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  pdfBtnHint: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  metaRow: { gap: 6, marginBottom: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13, color: COLORS.textMuted },
  socialRow: { flexDirection: 'row', gap: 24 },
  socialBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  socialText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  translateSection: { backgroundColor: COLORS.white, borderRadius: 14, padding: 14, marginBottom: 14, ...SHADOW },
  translateLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  langRow: { flexDirection: 'row', gap: 8 },
  langBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 2, borderColor: COLORS.border, alignItems: 'center',
  },
  langBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  langBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  langBtnTextActive: { color: COLORS.white },
  ackBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: COLORS.success, borderRadius: 14, paddingVertical: 16, marginBottom: 12,
  },
  ackBtnDone: { backgroundColor: '#4CAF50' },
  ackBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 2, borderColor: COLORS.important, borderRadius: 14, paddingVertical: 14,
  },
  deleteBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.important },
  pollCard: { backgroundColor: COLORS.white, borderRadius: 14, padding: 16, marginBottom: 12, ...SHADOW, borderWidth: 1, borderColor: '#E3F2FD' },
  pollTitle: { fontSize: 13, fontWeight: '800', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 },
  pollOption: { backgroundColor: '#F5F7FA', borderRadius: 8, marginBottom: 8, overflow: 'hidden', position: 'relative' },
  pollOptionVoted: { backgroundColor: '#EBF2FF' },
  pollBar: { position: 'absolute', top: 0, left: 0, bottom: 0, backgroundColor: '#E0E0E0', zIndex: 0 },
  pollBarVoted: { backgroundColor: '#BBDEFB' },
  pollContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, zIndex: 1 },
  pollOptText: { fontSize: 15, color: COLORS.textPrimary, fontWeight: '600' },
  pollOptTextVoted: { color: COLORS.primary, fontWeight: '800' },
  pollPercent: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '700' },
  pollTotalVotes: { fontSize: 11, color: COLORS.textMuted, textAlign: 'right', marginTop: 4, fontWeight: '600' },
  commentsCard: { backgroundColor: COLORS.white, borderRadius: 14, padding: 16, marginBottom: 12, ...SHADOW },
  commentsTitle: { fontSize: 13, fontWeight: '800', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 },
  commentItem: { marginBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 10 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  commentName: { fontSize: 12, fontWeight: '700', color: COLORS.textPrimary },
  commentTime: { fontSize: 10, color: COLORS.textMuted, marginLeft: 'auto' },
  commentText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  commentInput: { flex: 1, backgroundColor: '#F5F7FA', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: COLORS.textPrimary },
  commentPostBtn: { backgroundColor: COLORS.primary, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
});