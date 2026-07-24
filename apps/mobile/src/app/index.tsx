import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { monthlyTotalsByCurrency, type Subscription } from '@subtrackr/domain';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { cycleLabel, formatMoney, subscriptionService, todayDateOnly } from '@/lib/subscriptions';

const ACCENT = '#208AEF';
const CONTENT_MAX_WIDTH = 560;

export default function SubscriptionsScreen() {
  const router = useRouter();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const today = useMemo(() => todayDateOnly(), []);
  const monthlyTotals = useMemo(() => monthlyTotalsByCurrency(subs), [subs]);

  const refresh = useCallback(async () => {
    setSubs(await subscriptionService.list());
  }, []);

  // Reload whenever the screen regains focus (e.g. returning from the add form).
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const togglePause = useCallback(
    async (sub: Subscription) => {
      if (sub.status === 'active') {
        await subscriptionService.pause(sub.id);
      } else if (sub.status === 'paused') {
        await subscriptionService.resume(sub.id);
      }
      await refresh();
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      await subscriptionService.remove(id);
      await refresh();
    },
    [refresh],
  );

  const activeCount = subs.filter((sub) => sub.status === 'active').length;

  return (
    <ThemedView style={styles.root}>
      <View style={styles.column}>
        <SafeAreaView style={styles.inner} edges={['top', 'bottom']}>
          <View style={styles.header}>
            <ThemedText type="smallBold" style={styles.brand}>
              subtrackr
            </ThemedText>
            <ThemedText type="subtitle">Subscriptions</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {subs.length === 0
                ? 'Nothing tracked yet'
                : `${subs.length} tracked · ${activeCount} active`}
            </ThemedText>
          </View>

          {monthlyTotals.length > 0 ? (
            <ThemedView type="backgroundElement" style={styles.summary}>
              <ThemedText type="small" themeColor="textSecondary">
                Monthly spend
              </ThemedText>
              <ThemedText type="subtitle">
                {monthlyTotals.map((total) => formatMoney(total)).join('  +  ')}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {monthlyTotals.map((total) => formatMoney(total.times(12))).join('  +  ')} per year
              </ThemedText>
            </ThemedView>
          ) : null}

          <Pressable
            onPress={() => router.push('/add')}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.addButton,
              { backgroundColor: ACCENT, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <ThemedText type="smallBold" style={styles.addButtonLabel}>
              + Add subscription
            </ThemedText>
          </Pressable>

          <ScrollView
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            style={styles.scroll}
          >
            {subs.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
                Add a subscription to start tracking. Everything stays on this device.
              </ThemedText>
            ) : (
              subs.map((sub) => (
                <ThemedView key={sub.id} type="backgroundElement" style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.titleBlock}>
                      <ThemedText type="smallBold" numberOfLines={1}>
                        {sub.name}
                      </ThemedText>
                      {sub.category ? (
                        <ThemedText type="small" themeColor="textSecondary">
                          {sub.category}
                        </ThemedText>
                      ) : null}
                    </View>
                    <View style={styles.priceBlock}>
                      <ThemedText type="smallBold">{formatMoney(sub.amount)}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {cycleLabel(sub.cycle)}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={styles.metaRow}>
                    <ThemedText type="small" themeColor="textSecondary">
                      Renews {sub.nextRenewalOnOrAfter(today).toISO()}
                    </ThemedText>
                    <StatusBadge status={sub.status} />
                  </View>

                  <View style={styles.actions}>
                    {sub.status !== 'cancelled' ? (
                      <Pressable onPress={() => void togglePause(sub)} accessibilityRole="button">
                        <ThemedText type="small" style={styles.accentAction}>
                          {sub.status === 'active' ? 'Pause' : 'Resume'}
                        </ThemedText>
                      </Pressable>
                    ) : null}
                    <Pressable onPress={() => void remove(sub.id)} accessibilityRole="button">
                      <ThemedText type="small" themeColor="textSecondary">
                        Remove
                      </ThemedText>
                    </Pressable>
                  </View>
                </ThemedView>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    </ThemedView>
  );
}

function StatusBadge({ status }: { status: Subscription['status'] }) {
  const color = status === 'active' ? '#1a7f37' : status === 'paused' ? '#9a6700' : '#82071e';
  return (
    <ThemedText type="small" style={[styles.badge, { color }]}>
      {status}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  // Explicit width:'100%' at each level so Yoga can resolve the percentages (a bare
  // flex:1 leaves the cross-axis width indefinite, which made the column snap to its
  // maxWidth and overflow narrow viewports). The parent centers; the column caps width.
  root: { flex: 1, width: '100%', alignItems: 'center' },
  column: { flex: 1, width: '100%', maxWidth: CONTENT_MAX_WIDTH },
  inner: { flex: 1, width: '100%', paddingHorizontal: Spacing.three },
  header: { paddingTop: Spacing.four, paddingBottom: Spacing.three, gap: Spacing.half },
  brand: { color: ACCENT, letterSpacing: 1, textTransform: 'uppercase' },
  summary: {
    borderRadius: 14,
    padding: Spacing.three,
    gap: Spacing.half,
    marginBottom: Spacing.three,
  },
  addButton: {
    borderRadius: 12,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  addButtonLabel: { color: '#ffffff' },
  scroll: { flex: 1 },
  list: { gap: Spacing.two, paddingBottom: Spacing.five },
  empty: {
    textAlign: 'center',
    marginTop: Spacing.five,
    paddingHorizontal: Spacing.four,
    lineHeight: 22,
  },
  card: { borderRadius: 14, padding: Spacing.three, gap: Spacing.two },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  titleBlock: { gap: 2, flexShrink: 1, paddingRight: Spacing.two },
  priceBlock: { alignItems: 'flex-end', flexShrink: 0 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actions: { flexDirection: 'row', gap: Spacing.four, paddingTop: Spacing.one },
  accentAction: { color: ACCENT },
  badge: { textTransform: 'capitalize' },
});
