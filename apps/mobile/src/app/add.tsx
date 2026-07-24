import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BillingCycle, DateOnly, Money, type CycleUnit } from '@subtrackr/domain';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { subscriptionService, todayDateOnly } from '@/lib/subscriptions';

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

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [cycle, setCycle] = useState<CycleUnit>('monthly');
  const [customDays, setCustomDays] = useState('30');
  const [category, setCategory] = useState('');
  const [firstCharge, setFirstCharge] = useState(todayDateOnly().toISO());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const inputStyle = [
    styles.input,
    { backgroundColor: theme.backgroundElement, color: theme.text },
  ];

  const submit = async () => {
    setError(null);
    setSaving(true);
    try {
      const parsedAmount = Money.parse(amount, currency);
      const anchorDate = DateOnly.fromISO(firstCharge.trim());
      await subscriptionService.add({
        name,
        amount: parsedAmount,
        cycle: buildCycle(cycle, customDays),
        anchorDate,
        ...(category.trim() !== '' ? { category: category.trim() } : {}),
      });
      router.back();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not add subscription');
      setSaving(false);
    }
  };

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.column} edges={['top', 'bottom']}>
        <View style={styles.inner}>
          <View style={styles.header}>
            <ThemedText type="subtitle">Add subscription</ThemedText>
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
                onChangeText={setName}
                placeholder="Netflix"
                placeholderTextColor={theme.textSecondary}
                style={inputStyle}
                accessibilityLabel="Name"
              />
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
                Add subscription
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
