import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useProjects } from '@/api/hooks';
import { useAuth } from '@/auth/AuthProvider';
import { AppHeader } from '@/components/headers';
import { Avatar, Card, EmptyState, ErrorState, LoadingState } from '@/components/primitives';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { colors, radius, spacing } from '@/theme';

export default function TeamScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const projects = useProjects({});
  const [search, setSearch] = useState('');
  const teammates = useMemo(() => {
    const people = new Map<string, { id: string; name: string; avatarUrl: string | null; jobTitle?: string | null; projects: Set<string> }>();
    for (const project of projects.data?.items ?? []) {
      for (const member of project.members) {
        const person = people.get(member.id) ?? { ...member, projects: new Set<string>() };
        person.projects.add(project.id);
        people.set(member.id, person);
      }
    }
    return [...people.values()].filter((person) => person.id !== user?.id && `${person.name} ${person.jobTitle ?? ''}`.toLowerCase().includes(search.toLowerCase().trim()));
  }, [projects.data, search, user?.id]);

  return (
    <View style={{ flex: 1 }}>
      <AppHeader title="Equipa" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.screen, paddingBottom: 130, gap: 16 }} refreshControl={<RefreshControl refreshing={projects.isRefetching} onRefresh={() => { void projects.refetch(); }} tintColor={colors.primaryContainer} />}>
        <View style={{ gap: 4 }}>
          <Text variant="headlineLg">Pessoas da equipa</Text>
          <Text variant="bodySm" color={colors.onSurfaceVariant}>Colegas que colaboram nos teus projectos.</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, minHeight: 48, backgroundColor: colors.surfaceLowest, borderRadius: radius.xl }}>
          <Icon name="search" color={colors.outline} />
          <TextInput value={search} onChangeText={setSearch} placeholder="Pesquisar pessoas..." placeholderTextColor={colors.outline} style={{ flex: 1, color: colors.onSurface }} />
        </View>
        {projects.isLoading ? <LoadingState /> : null}
        {projects.isError && !projects.data ? <ErrorState message="Não foi possível carregar a equipa." onRetry={() => projects.refetch()} /> : null}
        {projects.data && teammates.length === 0 ? <EmptyState icon="groups" title={search ? 'Ninguém encontrado' : 'A equipa ainda está vazia'} text={search ? 'Experimenta outro nome.' : 'Adiciona colegas nos detalhes de um projecto para os veres aqui.'} /> : null}
        {teammates.map((person) => (
          <Card key={person.id} padding={14} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Avatar name={person.name} uri={person.avatarUrl} size={48} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="labelLg">{person.name}</Text>
              <Text variant="bodySm" color={colors.onSurfaceVariant}>{person.jobTitle || 'Membro da equipa'}</Text>
              <Text variant="labelSm" color={colors.secondary}>{person.projects.size} {person.projects.size === 1 ? 'projecto' : 'projectos'}</Text>
            </View>
          </Card>
        ))}
        {projects.data?.items.length ? <Text variant="bodySm" color={colors.secondary} onPress={() => router.push('/projects')}>Gerir membros nos detalhes dos projectos</Text> : null}
      </ScrollView>
    </View>
  );
}
