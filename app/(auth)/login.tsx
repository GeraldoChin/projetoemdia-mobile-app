import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getErrorMessage } from '@/api/client';
import { useAuth } from '@/auth/AuthProvider';
import { TextField } from '@/components/forms';
import { Icon } from '@/components/Icon';
import { Button, Card, Logo, SegmentedControl } from '@/components/primitives';
import { Text } from '@/components/Text';
import { colors, radius, shadow, spacing } from '@/theme';

type Mode = 'login' | 'register';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login, register } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const isRegister = mode === 'register';

  const submit = async () => {
    setError(undefined);
    if (isRegister && !name.trim()) return setError('Indique o seu nome completo');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Indique um email válido');
    if (!password) return setError('Indique a palavra-passe');
    if (isRegister && password.length < 8) return setError('A palavra-passe deve ter pelo menos 8 caracteres');
    if (isRegister && !terms) return setError('Tem de aceitar os Termos e a Política de Privacidade');

    setLoading(true);
    try {
      if (isRegister) await register(name, email, password, true);
      else await login(email, password, remember);
      // o redirecionamento para a app é feito pelo (auth)/_layout assim que há utilizador
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };


  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32, paddingHorizontal: spacing.screen }}
        showsVerticalScrollIndicator={false}
      >
        {/* Marca */}
        <View style={{ alignItems: 'center', gap: 6, marginBottom: 24 }}>
          <View style={styles.logoBox}>
            <Logo size={48} />
          </View>
          <Text variant="headlineLg" color={colors.primary}>ProjetoEmDia</Text>
          <Text variant="bodyMd" color={colors.onSurfaceVariant} style={{ textAlign: 'center', maxWidth: 260 }}>
            Gestão ágil para os seus projectos e tarefas
          </Text>
        </View>

        <SegmentedControl<Mode>
          value={mode}
          onChange={(m) => { setMode(m); setError(undefined); }}
          options={[{ key: 'login', label: 'Entrar' }, { key: 'register', label: 'Criar Conta' }]}
        />

        <Card style={{ marginTop: 24, gap: 16 }} padding={20}>
          {isRegister ? <TextField label="Nome completo" icon="person-outline" value={name} onChangeText={setName} placeholder="Mário Chissano" autoCapitalize="words" /> : null}
          <TextField label="Email profissional" icon="mail-outline" value={email} onChangeText={setEmail} placeholder="exemplo@empresa.co.mz" autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
          <View style={{ gap: 6 }}>
            {!isRegister ? (
              <Pressable onPress={() => router.push('/help')} style={{ alignSelf: 'flex-end', marginBottom: -4 }} hitSlop={8}>
                <Text variant="labelMd" color={colors.secondary}>Esqueceu a palavra-passe?</Text>
              </Pressable>
            ) : null}
            <TextField label="Palavra-passe" icon="lock-outline" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry secureToggle autoCapitalize="none" onSubmitEditing={submit} />
          </View>

          {isRegister ? (
            <Pressable onPress={() => setTerms((t) => !t)} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
              <Checkbox checked={terms} />
              <Text variant="bodySm" color={colors.onSurfaceVariant} style={{ flex: 1 }}>
                Concordo com os <Text variant="labelMd" color={colors.secondary} style={{ textDecorationLine: 'underline' }} onPress={() => router.push('/terms')}>Termos</Text> e a{' '}
                <Text variant="labelMd" color={colors.secondary} style={{ textDecorationLine: 'underline' }} onPress={() => router.push('/terms')}>Política de Privacidade</Text> de Moçambique.
              </Text>
            </Pressable>
          ) : (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Pressable onPress={() => setRemember((r) => !r)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Checkbox checked={remember} />
                <Text variant="bodySm" color={colors.onSurfaceVariant}>Lembrar de mim</Text>
              </Pressable>
              <View style={styles.secure}>
                <Text variant="labelSm" color={colors.onSecondaryFixed}>Seguro • SSL</Text>
              </View>
            </View>
          )}

          {error ? (
            <View style={styles.error}>
              <Icon name="error-outline" size={18} color={colors.error} />
              <Text variant="bodySm" color={colors.onErrorContainer} style={{ flex: 1 }}>{error}</Text>
            </View>
          ) : null}

          <Button label={isRegister ? 'Criar Nova Conta' : 'Entrar na Conta'} trailingIcon="arrow-forward" onPress={submit} loading={loading} />

          <Text variant="bodySm" color={colors.onSurfaceVariant} style={{ textAlign: 'center' }}>Acesso com Google e Apple não está configurado nesta instalação.</Text>
        </Card>

        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 24, flexWrap: 'wrap' }}>
          <Text variant="bodyMd" color={colors.onSurfaceVariant}>{isRegister ? 'Já possui uma conta?' : 'Ainda não tem conta?'}</Text>
          <Pressable onPress={() => { setMode(isRegister ? 'login' : 'register'); setError(undefined); }} hitSlop={8}>
            <Text variant="labelLg" color={colors.secondary} style={{ textDecorationLine: 'underline' }}>
              {isRegister ? 'Iniciar sessão' : 'Registe-se gratuitamente'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <View style={[styles.checkbox, checked && { backgroundColor: colors.primaryContainer, borderColor: colors.primaryContainer }]}>
      {checked ? <Icon name="check" size={14} color={colors.onPrimary} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  logoBox: { width: 64, height: 64, borderRadius: radius.xl, backgroundColor: colors.surfaceLowest, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  secure: { backgroundColor: colors.secondaryFixed, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  error: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', padding: 12, borderRadius: radius.xl, backgroundColor: colors.errorContainer },
  line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.surfaceHigh },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: colors.outline, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
});
