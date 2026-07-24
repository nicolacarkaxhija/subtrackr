import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Subscription } from '@subtrackr/domain';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import {
  cycleLabel,
  formatMoney,
  sampleInput,
  subscriptionService,
  todayDateOnly,
} from '@/lib/subscriptions';

const ACCENT = '#208AEF';

export default function SubscriptionsScreen() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [addIndex, setAddIndex] = useState(0);
  const today = useMemo(() => todayDateOnly(), []);

  const refresh = useCallback(async () => {
    setSubs(await subscriptionService.list());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addSample = useCallback(async () => {
    await subscriptionService.add(sampleInput(addIndex));
    setAddIndex((index) => index + 1);
    await refresh();
  }, [addIndex, refresh]);

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
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <ThemedText type="subtitle">Subscriptions</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {subs.length === 0
              ? 'Nothing tracked yet'
              : `${subs.length} tracked · ${activeCount} active`}
          </ThemedText>
        </View>

        <Pressable
          onPress={() => void addSample()}
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

        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {subs.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
              Tap “Add subscription” to try it. This demo uses in-memory storage, so the list resets
              when you reload.
            </ThemedText>
          ) : (
            subs.map((sub) => (
              <ThemedView key={sub.id} type="backgroundElement" style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.titleBlock}>
                    <ThemedText type="smallBold">{sub.name}</ThemedText>
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
  root: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: Spacing.three },
  header: { paddingTop: Spacing.three, paddingBottom: Spacing.two, gap: Spacing.half },
  addButton: {
    borderRadius: 12,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  addButtonLabel: { color: '#ffffff' },
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
  priceBlock: { alignItems: 'flex-end' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actions: { flexDirection: 'row', gap: Spacing.four, paddingTop: Spacing.one },
  accentAction: { color: ACCENT },
  badge: { textTransform: 'capitalize' },
});
