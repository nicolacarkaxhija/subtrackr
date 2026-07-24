import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BillingCycle, DateOnly, Money, type CycleUnit } from '@subtrackr/domain';
import { searchCatalog, type CatalogEntry } from '@subtrackr/catalog';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { minorToInputString, subscriptionService, todayDateOnly } from '@/lib/subscriptions';

const ACCENT = '#208AEF';
const CONTENT_MAX_WIDTH = 560;
const CURRENCIES = ['EUR', 'USD', 'GBP'];

const CYCLES: ReadonlyArray<{ key: CycleUnit; label: string }> = [
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'quarterly', label: 'Quarterly' },
  { key: 'semiannual', label: '6 months' },
  { key: 'annual', label: 'Yearly' },
  { key: 'custom', label: 'Custom' },
];

function buildCycle(unit: CycleUnit, customDays: string): BillingCycle {
  switch (unit) {
    case 'weekly':
      return BillingCycle.weekly();
    case 'monthly':
      return BillingCycle.monthly();
    case 'quarterly':
      return BillingCycle.quarterly();
    case 'semiannual':
      return BillingCycle.semiannual();
    case 'annual':
      return BillingCycle.annual();
    case 'custom':
      return BillingCycle.custom(Number(customDays));
  }
}

export default function AddSubscriptionScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const editId = typeof params.id === 'string' && params.id.length > 0 ? params.id : null;

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [cycle, setCycle] = useState<CycleUnit>('monthly');
  const [customDays, setCustomDays] = useState('30');
  const [category, setCategory] = useState('');
  const [sharedWith, setSharedWith] = useState('');
  const [usesPerMonth, setUsesPerMonth] = useState('');
  const [firstCharge, setFirstCharge] = useState(todayDateOnly().toISO());
  const [trialEnds, setTrialEnds] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [picked, setPicked] = useState(false);

  const suggestions = useMemo(
    () => (editId === null && !picked && name.trim() !== '' ? searchCatalog(name, 5) : []),
    [editId, picked, name],
  );

  const applyEntry = (entry: CatalogEntry) => {
    setName(entry.name);
    setAmount(minorToInputString(BigInt(entry.amountMinor)));
    setCurrency(entry.currency);
    setCycle(entry.cycle);
    setCategory(entry.category);
    setPicked(true);
  };

  useEffect(() => {
    if (editId === null) {
      return;
    }
    void (async () => {
      const existing = await subscriptionService.get(editId);
      if (existing === null) {
        setError('This subscription no longer exists.');
        return;
      }
      setName(existing.name);
      setAmount(minorToInputString(existing.amount.amountMinor));
      setCurrency(existing.amount.currency);
      setCycle(existing.cycle.unit);
      setCustomDays(String(existing.cycle.customIntervalDays ?? 30));
      setCategory(existing.category ?? '');
      setSharedWith(existing.sharedWith !== undefined ? String(existing.sharedWith) : '');
      setUsesPerMonth(existing.usesPerMonth !== undefined ? String(existing.usesPerMonth) : '');
      setFirstCharge(existing.anchorDate.toISO());
      setTrialEnds(existing.trialEndsAt !== undefined ? existing.trialEndsAt.toISO() : '');
    })();
  }, [editId]);

  const inputStyle = [
    styles.input,
    { backgroundColor: theme.backgroundElement, color: theme.text },
  ];

  const submit = async () => {
    setError(null);
    setSaving(true);
    try {
      const sharedCount = sharedWith.trim() === '' ? undefined : Number(sharedWith.trim());
      const input = {
        name,
        amount: Money.parse(amount, currency),
        cycle: buildCycle(cycle, customDays),
        anchorDate: DateOnly.fromISO(firstCharge.trim()),
        ...(category.trim() !== '' ? { category: category.trim() } : {}),
        ...(sharedCount !== undefined ? { sharedWith: sharedCount } : {}),
        ...(usesPerMonth.trim() !== '' ? { usesPerMonth: Number(usesPerMonth.trim()) } : {}),
        ...(trialEnds.trim() !== '' ? { trialEndsAt: DateOnly.fromISO(trialEnds.trim()) } : {}),
      };
      if (editId === null) {
        await subscriptionService.add(input);
      } else {
        await subscriptionService.update(editId, input);
      }
      router.back();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save subscription');
      setSaving(false);
    }
  };

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.column} edges={['top', 'bottom']}>
        <View style={styles.inner}>
          <View style={styles.header}>
            <ThemedText type="subtitle">{editId === null ? 'Add subscription' : 'Edit'}</ThemedText>
            <Pressable onPress={() => router.back()} accessibilityRole="button">
              <ThemedText type="small" style={styles.accent}>
                Cancel
              </ThemedText>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
            <Field label="Name">
              <TextInput
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setPicked(false);
                }}
                placeholder="Start typing, e.g. Netflix"
                placeholderTextColor={theme.textSecondary}
                style={inputStyle}
                accessibilityLabel="Name"
              />
              {suggestions.length > 0 ? (
                <ThemedView type="backgroundElement" style={styles.suggestions}>
                  {suggestions.map((entry) => (
                    <Pressable
                      key={entry.id}
                      onPress={() => applyEntry(entry)}
                      accessibilityRole="button"
                      style={styles.suggestion}
                    >
                      <ThemedText type="small">{entry.name}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {entry.category}
                      </ThemedText>
                    </Pressable>
                  ))}
                </ThemedView>
              ) : null}
            </Field>

            <Field label="Price">
              <View style={styles.priceRow}>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="9.99"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="decimal-pad"
                  style={[inputStyle, styles.priceInput]}
                  accessibilityLabel="Price"
                />
                <Chips options={CURRENCIES} selected={currency} onSelect={setCurrency} />
              </View>
            </Field>

            <Field label="Billing cycle">
              <Chips
                options={CYCLES.map((c) => c.key)}
                labels={CYCLES.map((c) => c.label)}
                selected={cycle}
                onSelect={(value) => setCycle(value as CycleUnit)}
              />
              {cycle === 'custom' ? (
                <View style={styles.customRow}>
                  <ThemedText type="small" themeColor="textSecondary">
                    Every
                  </ThemedText>
                  <TextInput
                    value={customDays}
                    onChangeText={setCustomDays}
                    keyboardType="number-pad"
                    style={[inputStyle, styles.daysInput]}
                    accessibilityLabel="Custom interval in days"
                  />
                  <ThemedText type="small" themeColor="textSecondary">
                    days
                  </ThemedText>
                </View>
              ) : null}
            </Field>

            <Field label="Shared plan (optional)">
              <View style={styles.customRow}>
                <ThemedText type="small" themeColor="textSecondary">
                  Split between
                </ThemedText>
                <TextInput
                  value={sharedWith}
                  onChangeText={setSharedWith}
                  keyboardType="number-pad"
                  placeholder="1"
                  placeholderTextColor={theme.textSecondary}
                  style={[inputStyle, styles.daysInput]}
                  accessibilityLabel="Number of people sharing"
                />
                <ThemedText type="small" themeColor="textSecondary">
                  people (incl. you)
                </ThemedText>
              </View>
            </Field>

            <Field label="First charge">
              <TextInput
                value={firstCharge}
                onChangeText={setFirstCharge}
                placeholder="2026-01-15"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                style={inputStyle}
                accessibilityLabel="First charge date"
              />
            </Field>

            <Field label="Usage (optional)">
              <View style={styles.customRow}>
                <ThemedText type="small" themeColor="textSecondary">
                  Used about
                </ThemedText>
                <TextInput
                  value={usesPerMonth}
                  onChangeText={setUsesPerMonth}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={theme.textSecondary}
                  style={[inputStyle, styles.daysInput]}
                  accessibilityLabel="Uses per month"
                />
                <ThemedText type="small" themeColor="textSecondary">
                  times per month
                </ThemedText>
              </View>
            </Field>

            <Field label="Free trial ends (optional)">
              <TextInput
                value={trialEnds}
                onChangeText={setTrialEnds}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                style={inputStyle}
                accessibilityLabel="Free trial end date"
              />
            </Field>

            <Field label="Category (optional)">
              <TextInput
                value={category}
                onChangeText={setCategory}
                placeholder="Streaming"
                placeholderTextColor={theme.textSecondary}
                style={inputStyle}
                accessibilityLabel="Category"
              />
            </Field>

            {error !== null ? (
              <ThemedText type="small" style={styles.error}>
                {error}
              </ThemedText>
            ) : null}

            <Pressable
              onPress={() => void submit()}
              disabled={saving}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.submit,
                { backgroundColor: ACCENT, opacity: pressed || saving ? 0.85 : 1 },
              ]}
            >
              <ThemedText type="smallBold" style={styles.submitLabel}>
                {editId === null ? 'Add subscription' : 'Save changes'}
              </ThemedText>
            </Pressable>
          </ScrollView>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <ThemedText type="smallBold">{label}</ThemedText>
      {children}
    </View>
  );
}

function Chips({
  options,
  labels,
  selected,
  onSelect,
}: {
  options: readonly string[];
  labels?: readonly string[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={styles.chips}>
      {options.map((option, index) => {
        const active = option === selected;
        return (
          <Pressable
            key={option}
            onPress={() => onSelect(option)}
            accessibilityRole="button"
            style={[styles.chip, active ? { backgroundColor: ACCENT } : styles.chipInactive]}
          >
            <ThemedText type="small" style={active ? styles.chipLabelActive : undefined}>
              {labels?.[index] ?? option}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, width: '100%', alignItems: 'center' },
  column: { flex: 1, width: '100%', maxWidth: CONTENT_MAX_WIDTH },
  inner: { flex: 1, width: '100%', paddingHorizontal: Spacing.three },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three,
  },
  accent: { color: ACCENT },
  form: { gap: Spacing.four, paddingBottom: Spacing.five },
  field: { gap: Spacing.two },
  suggestions: { borderRadius: 10, overflow: 'hidden' },
  suggestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  priceRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center', flexWrap: 'wrap' },
  priceInput: { flexGrow: 1, minWidth: 120 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: { borderRadius: 999, paddingHorizontal: Spacing.three, paddingVertical: Spacing.one },
  chipInactive: { borderWidth: StyleSheet.hairlineWidth, borderColor: '#66666655' },
  chipLabelActive: { color: '#ffffff' },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  daysInput: { width: 80, textAlign: 'center' },
  error: { color: '#e5484d' },
  submit: {
    borderRadius: 12,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  submitLabel: { color: '#ffffff' },
});
