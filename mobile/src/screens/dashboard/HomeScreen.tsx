import React from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useDashboard, useProjects, useSetTaskStatus } from '@/api/hooks';
import { getErrorMessage } from '@/api/client';
import { AppHeader } from '@/components/headers';
import { Icon, IconName } from '@/components/Icon';
import { AvatarStack, Badge, Card, ErrorState, IconButton, LoadingState, ProgressBar, ProgressRing, SectionTitle } from '@/components/primitives';
import { Text } from '@/components/Text';
import { useToast } from '@/components/Toast';
import { colors, radius, shadow, spacing } from '@/theme';
import { daysLeftLabel, formatDateLong, formatTime, greeting } from '@/utils/format';
import { PRIORITY_COLOR, PRIORITY_LABEL } from '@/utils/labels';

const TAB_SPACE = 120;

export default function HomeScreen() {
  const router = useRouter();
  const toast = useToast();
  const home = useDashboard();
  const projects = useProjects({ status: 'ACTIVE' });
  const setStatus = useSetTaskStatus();

  const data = home.data;
  const canCreateTask = !!data?.user && !!projects.data?.items.some((project) => project.ownerId === data.user?.id);
  const todayDone = data?.todayTasks.filter((t) => t.status === 'DONE').length ?? 0;

  const toggle = (id: string, status: string) =>
    setStatus.mutate({ id, status: status === 'DONE' ? 'TODO' : 'DONE' }, { onError: (e) => toast.show(getErrorMessage(e), 'error') });

  const quick: { icon: IconName; label: string; onPress: () => void; primary?: boolean }[] = [
    { icon: 'create-new-folder', label: 'Projecto', primary: true, onPress: () => router.push({ pathname: '/projects', params: { new: '1' } }) },
    ...(canCreateTask ? [{ icon: 'add-task' as const, label: 'Nova Tarefa', onPress: () => router.push({ pathname: '/tasks', params: { new: '1' } }) }] : []),
    { icon: 'group', label: 'Equipa', onPress: () => router.push('/team') },
    { icon: 'hourglass-top', label: 'Prazos', onPress: () => router.push('/calendar') },
  ];

  return (
    <View style={{ flex: 1 }}>
      <AppHeader title="Início" />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.screen, paddingBottom: TAB_SPACE, gap: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={home.isRefetching} onRefresh={() => { void home.refetch(); }} tintColor={colors.primaryContainer} />}
      >
        {home.isLoading ? <LoadingState /> : null}
        {home.isError && !data ? <ErrorState message={getErrorMessage(home.error)} onRetry={() => home.refetch()} /> : null}

        {data ? (
          <>
            {/* Saudação */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View>
                  <Text variant="bodySm" color={colors.onSurfaceVariant}>{greeting()} ✨</Text>
                  <Text variant="headlineLg">{data.user?.name}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <IconButton icon="calendar-today" label="Agenda" onPress={() => router.push('/calendar')} color={colors.primary} />
                {data.user?.city ? <Badge label={data.user.city} dot={colors.secondary} style={{ paddingVertical: 5 }} /> : null}
              </View>
            </View>

            {/* Entrega prioritária */}
            {data.highlight ? (
              <Pressable onPress={() => router.push(`/task/${data.highlight!.id}`)} style={[styles.hero, shadow.float]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <View style={{ flex: 1, gap: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      {data.highlight.priority === 'HIGH' ? <Badge label="Urgente" fg={colors.onErrorContainer} bg={colors.errorContainer} /> : <Badge label={PRIORITY_LABEL[data.highlight.priority]} fg={PRIORITY_COLOR[data.highlight.priority].fg} bg={PRIORITY_COLOR[data.highlight.priority].bg} />}
                      <Text variant="labelMd" color={colors.onPrimaryContainer} uppercase>Próxima entrega prioritária</Text>
                    </View>
                    <Text variant="headlineMd" color={colors.onPrimary}>{data.highlight.title}</Text>
                    <Text variant="bodySm" color={colors.onPrimaryContainer}>{data.highlight.project.title}</Text>
                  </View>
                  <View style={styles.heroFlag}>
                    <Icon name="flag" size={20} color={colors.secondaryFixed} />
                  </View>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={styles.heroCal}>
                      <Icon name="event" size={18} color={colors.secondaryFixed} />
                    </View>
                    <View>
                      <Text variant="labelSm" color={colors.onPrimaryContainer}>Prazo limite</Text>
                      <Text variant="labelLg" color={colors.onPrimary}>{data.highlight.dueDate ? formatDateLong(data.highlight.dueDate) : 'Sem prazo'}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <ProgressRing percent={data.highlight.projectProgressPercent} />
                    <View style={styles.heroArrow}>
                      <Icon name="arrow-forward" size={18} color={colors.onSecondaryFixed} />
                    </View>
                  </View>
                </View>
              </Pressable>
            ) : (
              <Card style={{ alignItems: 'center', gap: 6 }} padding={24}>
                <Icon name="celebration" size={32} color={colors.secondary} />
                <Text variant="headlineSm">Sem entregas pendentes</Text>
                <Text variant="bodySm" color={colors.onSurfaceVariant} style={{ textAlign: 'center' }}>Está tudo em dia. Bom trabalho!</Text>
              </Card>
            )}

            {/* Resumo */}
            <View style={{ gap: 10 }}>
              <SectionTitle title="Resumo de Actividades" right={<Text variant="labelSm" color={colors.secondary}>Esta Semana</Text>} />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <SummaryCard icon="folder-open" value={data.summary.activeProjects} label="Projectos Activos" tint={colors.secondaryFixed} />
                <SummaryCard icon="pending-actions" value={data.summary.pendingTasks} label="Pendentes" tint={colors.surfaceHigh} />
                <SummaryCard
                  icon="task-alt" value={data.summary.doneThisWeek} label="Feitas" highlight
                  delta={data.summary.doneDeltaPercent}
                />
              </View>
            </View>

            {/* Acesso rápido */}
            <View style={{ gap: 10 }}>
              <SectionTitle title="Acesso Rápido" />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {quick.map((q) => (
                  <Pressable key={q.label} onPress={q.onPress} style={({ pressed }) => [styles.quick, pressed && { transform: [{ scale: 0.95 }] }]}>
                    <View style={[styles.quickIcon, q.primary && { backgroundColor: colors.primaryContainer }]}>
                      <Icon name={q.icon} size={22} color={q.primary ? colors.onPrimary : colors.onSurfaceVariant} />
                    </View>
                    <Text variant="labelSm" numberOfLines={1} style={{ textAlign: 'center' }}>{q.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Projectos recentes */}
            <View style={{ gap: 12 }}>
              <SectionTitle
                title="Projectos Recentes"
                right={
                  <Pressable onPress={() => router.push('/projects')} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text variant="labelLg" color={colors.secondary}>Ver todos</Text>
                    <Icon name="chevron-right" size={18} color={colors.secondary} />
                  </Pressable>
                }
              />
              {data.recentProjects.length === 0 ? (
                <Text variant="bodySm" color={colors.onSurfaceVariant}>Ainda não tem projectos. Crie o primeiro em “Projecto”.</Text>
              ) : null}
              {data.recentProjects.map((p) => (
                <Card key={p.id} onPress={() => router.push(`/project/${p.id}`)} style={{ gap: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                      <View style={styles.projectIcon}>
                        <Icon name="folder-open" size={20} color={colors.onSecondaryFixed} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text variant="headlineSm" numberOfLines={1}>{p.title}</Text>
                        <Text variant="bodySm" color={colors.onSurfaceVariant} numberOfLines={1}>{p.category ?? p.client ?? 'Projecto'}</Text>
                      </View>
                    </View>
                    <Badge label="Em curso" />
                  </View>
                  <View style={{ gap: 6 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text variant="labelMd" color={colors.onSurfaceVariant}>{p.progress.done} de {p.progress.total} tarefas</Text>
                      <Text variant="labelLg" color={colors.primary}>{p.progress.percent}%</Text>
                    </View>
                    <ProgressBar percent={p.progress.percent} color={colors.secondary} />
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <AvatarStack people={p.members} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Icon name="schedule" size={15} color={colors.onSurfaceVariant} />
                      <Text variant="labelSm" color={colors.onSurfaceVariant}>{daysLeftLabel(p.daysLeft)}</Text>
                    </View>
                  </View>
                </Card>
              ))}
            </View>

            {/* Tarefas para hoje */}
            <View style={{ gap: 12 }}>
              <SectionTitle
                title="Tarefas para Hoje"
                right={<Badge label={`${todayDone} de ${data.todayTasks.length}`} fg={colors.onSecondaryFixed} bg={colors.secondaryFixed} />}
              />
              {data.todayTasks.length === 0 ? (
                <Text variant="bodySm" color={colors.onSurfaceVariant}>Nenhuma tarefa com prazo para hoje.</Text>
              ) : null}
              {data.todayTasks.map((t) => {
                const done = t.status === 'DONE';
                return (
                  <Card key={t.id} onPress={() => router.push(`/task/${t.id}`)} padding={14} style={[{ flexDirection: 'row', alignItems: 'center', gap: 12 }, done && { opacity: 0.7 }]}>
                    <Pressable onPress={() => toggle(t.id, t.status)} hitSlop={10} accessibilityRole="checkbox" accessibilityState={{ checked: done }}
                      style={[styles.check, done ? { backgroundColor: colors.primaryContainer } : { backgroundColor: colors.surface }]}>
                      {done ? <Icon name="check" size={16} color={colors.onPrimary} /> : null}
                    </Pressable>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyMd" numberOfLines={1} color={done ? colors.onSurfaceVariant : colors.onSurface} style={[{ fontFamily: 'Inter_500Medium' }, done && { textDecorationLine: 'line-through' }]}>{t.title}</Text>
                      <Text variant="bodySm" color={colors.onSurfaceVariant} numberOfLines={1}>
                        {t.project.title}{done && t.completedAt ? ` • Concluído às ${formatTime(t.completedAt)}` : t.dueDate ? ` • ${formatTime(t.dueDate)}` : ''}
                      </Text>
                    </View>
                    {t.tag ? <Badge label={t.tag} bg={colors.surfaceHigh} fg={colors.onSurfaceVariant} /> : null}
                  </Card>
                );
              })}
            </View>

            {/* Dica */}
            <View style={styles.tip}>
              <View style={styles.tipIcon}>
                <Icon name="lightbulb-outline" size={18} color={colors.secondary} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="labelLg">Dica de Produtividade</Text>
                <Text variant="bodySm" color={colors.onSurfaceVariant}>
                  {data.highlight
                    ? `Foque na conclusão de “${data.highlight.title}” antes do meio-dia para garantir feedback imediato.`
                    : 'Planeie o dia seguinte antes de terminar: começa com menos fricção.'}
                </Text>
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function SummaryCard({ icon, value, label, tint, highlight, delta }: { icon: IconName; value: number; label: string; tint?: string; highlight?: boolean; delta?: number }) {
  return (
    <View style={[styles.summary, highlight && { backgroundColor: colors.secondaryFixed }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={[styles.summaryIcon, { backgroundColor: highlight ? colors.surfaceLowest : tint }]}>
          <Icon name={icon} size={18} color={highlight ? colors.secondary : colors.onSecondaryFixed} />
        </View>
        {delta !== undefined && delta !== 0 ? (
          <Text variant="labelSm" color={delta > 0 ? colors.secondary : colors.danger}>{delta > 0 ? '+' : ''}{delta}%</Text>
        ) : null}
      </View>
      <View>
        <Text variant="displaySm" color={highlight ? colors.onSecondaryFixed : colors.primary}>{String(value).padStart(2, '0')}</Text>
        <Text variant="labelSm" color={highlight ? colors.onSecondaryFixedVariant : colors.onSurfaceVariant} style={{ marginTop: 2 }}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.primaryContainer, borderRadius: radius.xl, padding: 20, gap: 16 },
  heroFlag: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  heroCal: { width: 32, height: 32, borderRadius: radius.lg, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  heroArrow: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.secondaryFixed, alignItems: 'center', justifyContent: 'center' },
  summary: { flex: 1, minHeight: 112, justifyContent: 'space-between', padding: 14, borderRadius: radius.xl, backgroundColor: colors.surfaceLowest, ...shadow.card },
  summaryIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  quick: { flex: 1, alignItems: 'center', gap: 6, padding: 8, borderRadius: radius.xl, backgroundColor: colors.surfaceLowest, ...shadow.card },
  quickIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  projectIcon: { width: 40, height: 40, borderRadius: radius.lg, backgroundColor: colors.secondaryFixed, alignItems: 'center', justifyContent: 'center' },
  check: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  tip: { flexDirection: 'row', gap: 12, padding: 16, borderRadius: radius.xl, backgroundColor: colors.surfaceLow },
  tipIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceHighest, alignItems: 'center', justifyContent: 'center' },
});
