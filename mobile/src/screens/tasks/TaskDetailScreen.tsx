import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getErrorMessage } from '@/api/client';
import { useAddComment, useComments, useDeleteTask, useSetTaskStatus, useTask } from '@/api/hooks';
import { useAuth } from '@/auth/AuthProvider';
import { DetailHeader } from '@/components/headers';
import { Icon } from '@/components/Icon';
import { Avatar, Badge, Button, Card, ErrorState, IconButton, LoadingState } from '@/components/primitives';
import { Text } from '@/components/Text';
import { useToast } from '@/components/Toast';
import { StatusSheet } from '@/features/tasks/StatusSheet';
import { TaskFormSheet } from '@/features/tasks/TaskFormSheet';
import { colors, fonts, radius, spacing } from '@/theme';
import { daysLeftLabel, daysUntil, formatDate, formatDateLong, timeAgo } from '@/utils/format';
import { PRIORITY_COLOR, PRIORITY_LABEL, STATUS_COLOR, STATUS_LABEL } from '@/utils/labels';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();

  const task = useTask(id);
  const comments = useComments(id);
  const setStatus = useSetTaskStatus();
  const addComment = useAddComment(id);
  const deleteTask = useDeleteTask();

  const [editing, setEditing] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [text, setText] = useState('');

  if (!user) return <Redirect href="/login" />;

  const t = task.data;
  const done = t?.status === 'DONE';
  const days = daysUntil(t?.dueDate);
  const list = comments.data ?? [];

  const sendComment = () => {
    const value = text.trim();
    if (!value) return;
    addComment.mutate(value, {
      onSuccess: () => setText(''),
      onError: (e) => toast.show(getErrorMessage(e), 'error'),
    });
  };

  const toggleDone = () =>
    t && setStatus.mutate({ id: t.id, status: done ? 'TODO' : 'DONE' }, {
      onSuccess: () => toast.show(done ? 'Tarefa reaberta' : 'Tarefa concluída'),
      onError: (e) => toast.show(getErrorMessage(e), 'error'),
    });

  const confirmDelete = () =>
    Alert.alert('Eliminar tarefa', 'Tem a certeza? Os comentários também serão eliminados.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () =>
          deleteTask.mutate(id, {
            onSuccess: () => { toast.show('Tarefa eliminada'); router.back(); },
            onError: (e) => toast.show(getErrorMessage(e), 'error'),
          }),
      },
    ]);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <DetailHeader
        title={t ? t.code : 'Tarefa'}
        right={t ? (
          <>
            <IconButton icon="edit" label="Editar tarefa" size={38} bg={colors.surface} color={colors.onSurfaceVariant} onPress={() => setEditing(true)} />
            <IconButton icon="delete-outline" label="Eliminar tarefa" size={38} bg={colors.surface} color={colors.onSurfaceVariant} onPress={confirmDelete} />
          </>
        ) : undefined}
      />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: spacing.screen, paddingBottom: 120 + insets.bottom, gap: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={task.isRefetching} onRefresh={() => { void task.refetch(); void comments.refetch(); }} tintColor={colors.primaryContainer} />}
      >
        {task.isLoading ? <LoadingState /> : null}
        {task.isError ? <ErrorState message={getErrorMessage(task.error)} onRetry={() => task.refetch()} /> : null}

        {t ? (
          <>
            {/* Título e contexto */}
            <View style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Pressable onPress={() => router.push(`/project/${t.project.id}`)}>
                  <Badge label={t.project.title} icon="folder-open" fg={colors.onSecondaryFixed} bg={colors.secondaryFixed} />
                </Pressable>
                <Text variant="labelMd" color={colors.onSurfaceVariant}>• #{t.code}</Text>
              </View>
              <Text variant="headlineLg" style={{ fontSize: 22, lineHeight: 30 }}>{t.title}</Text>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                <Pressable onPress={() => setStatusOpen(true)} style={[styles.pill, { backgroundColor: STATUS_COLOR[t.status].bg }]} accessibilityLabel="Alterar estado">
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: STATUS_COLOR[t.status].fg }} />
                  <Text variant="labelLg" color={STATUS_COLOR[t.status].fg}>{STATUS_LABEL[t.status]}</Text>
                  <Icon name="expand-more" size={16} color={STATUS_COLOR[t.status].fg} />
                </Pressable>
                <View style={[styles.pill, { backgroundColor: PRIORITY_COLOR[t.priority].bg }]}>
                  <Icon name="flag" size={15} color={PRIORITY_COLOR[t.priority].fg} />
                  <Text variant="labelLg" color={PRIORITY_COLOR[t.priority].fg}>Prioridade {PRIORITY_LABEL[t.priority]}</Text>
                </View>
              </View>
            </View>

            {/* Atributos */}
            <Card style={{ gap: 14 }}>
              <Attr label="Responsável">
                {t.assignee ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Avatar name={t.assignee.name} uri={t.assignee.avatarUrl} size={28} />
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text variant="labelLg">{t.assignee.name}</Text>
                      {t.assignee.jobTitle ? <Text variant="labelSm" color={colors.onSurfaceVariant}>{t.assignee.jobTitle}</Text> : null}
                    </View>
                  </View>
                ) : <Text variant="bodySm" color={colors.onSurfaceVariant}>Sem responsável</Text>}
              </Attr>
              <Line />
              <Attr label="Prazo de Entrega">
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Icon name="event" size={17} color={colors.primary} />
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text variant="labelLg">{t.dueDate ? formatDateLong(t.dueDate) : 'Sem prazo'}</Text>
                    {t.dueDate && !done ? <Text variant="labelSm" color={t.isOverdue ? colors.error : colors.secondary}>{daysLeftLabel(days)}</Text> : null}
                    {done && t.completedAt ? <Text variant="labelSm" color={colors.success}>Concluída em {formatDate(t.completedAt)}</Text> : null}
                  </View>
                </View>
              </Attr>
              <Line />
              <Attr label="Criado por">
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Icon name="person-outline" size={16} color={colors.onSurfaceVariant} />
                  <Text variant="bodySm">{t.createdBy.name} <Text variant="labelSm" color={colors.onSurfaceVariant}>({formatDate(t.createdAt)})</Text></Text>
                </View>
              </Attr>
            </Card>

            {/* Descrição */}
            <Card style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon name="description" size={18} color={colors.secondary} />
                <Text variant="headlineSm">Descrição</Text>
              </View>
              <Text variant="bodyMd" color={t.description ? colors.onSurfaceVariant : colors.outline} style={{ lineHeight: 22 }}>
                {t.description || 'Sem descrição.'}
              </Text>
            </Card>

            {/* Comentários */}
            <Card style={{ gap: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Icon name="chat-bubble-outline" size={18} color={colors.secondary} />
                  <Text variant="headlineSm">Comentários da Equipa</Text>
                </View>
                <View style={styles.counter}>
                  <Text variant="labelSm" color={colors.onSurfaceVariant}>{list.length} {list.length === 1 ? 'nota' : 'notas'}</Text>
                </View>
              </View>

              {comments.isLoading ? <LoadingState /> : null}
              {list.map((c) => (
                <View key={c.id} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                  <Avatar name={c.author.name} uri={c.author.avatarUrl} size={32} />
                  <View style={styles.bubble}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <Text variant="labelLg">{c.authorId === user.id ? 'Você' : c.author.name}</Text>
                      <Text variant="labelSm" color={colors.onSurfaceVariant}>{timeAgo(c.createdAt)}</Text>
                    </View>
                    <Text variant="bodySm" color={colors.onSurfaceVariant}>{c.text}</Text>
                  </View>
                </View>
              ))}
              {comments.data && list.length === 0 ? <Text variant="bodySm" color={colors.outline}>Ainda não há comentários. Seja o primeiro.</Text> : null}

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TextInput
                  value={text}
                  onChangeText={setText}
                  placeholder="Escrever um comentário..."
                  placeholderTextColor={colors.outline}
                  style={styles.input}
                  returnKeyType="send"
                  onSubmitEditing={sendComment}
                />
                <Pressable onPress={sendComment} disabled={addComment.isPending || !text.trim()} accessibilityLabel="Enviar comentário"
                  style={[styles.send, (!text.trim() || addComment.isPending) && { opacity: 0.5 }]}>
                  <Icon name="send" size={18} color={colors.onPrimary} />
                </Pressable>
              </View>
            </Card>
          </>
        ) : null}
      </ScrollView>

      {t ? (
        <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Button
            label={done ? 'Reabrir Tarefa' : 'Concluir Tarefa'}
            icon={done ? 'undo' : 'check'}
            variant={done ? 'secondary' : 'primary'}
            onPress={toggleDone}
            loading={setStatus.isPending}
          />
        </View>
      ) : null}

      {t ? (
        <>
          <StatusSheet visible={statusOpen} onClose={() => setStatusOpen(false)} current={t.status} onSelect={(s) => setStatus.mutate({ id: t.id, status: s }, { onError: (e) => toast.show(getErrorMessage(e), 'error') })} />
          <TaskFormSheet visible={editing} onClose={() => setEditing(false)} task={t} />
        </>
      ) : null}
    </KeyboardAvoidingView>
  );
}

function Attr({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <Text variant="labelLg" color={colors.onSurfaceVariant}>{label}</Text>
      {children}
    </View>
  );
}

const Line = () => <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.surfaceHigh }} />;

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full },
  counter: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full, backgroundColor: colors.surface },
  bubble: { flex: 1, backgroundColor: colors.surfaceLow, borderRadius: radius.xl, padding: 10 },
  input: { flex: 1, height: 44, paddingHorizontal: 16, borderRadius: radius.full, backgroundColor: colors.surfaceLow, fontFamily: fonts.regular, fontSize: 14, color: colors.onSurface },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center' },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.screen, paddingTop: 10, backgroundColor: 'rgba(248,249,251,0.96)' },
});
