import React, { useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getErrorMessage } from '@/api/client';
import { useProjects } from '@/api/hooks';
import type { ProjectStatus } from '@/api/types';
import { AppHeader } from '@/components/headers';
import { Icon } from '@/components/Icon';
import { Chip, ChipRow, EmptyState, ErrorState, Fab, IconButton, LoadingState } from '@/components/primitives';
import { Text } from '@/components/Text';
import { useToast } from '@/components/Toast';
import { ProjectCard } from '@/components/cards';
import { ProjectFormSheet } from '@/features/projects/ProjectSheets';
import { colors, fonts, radius, shadow, spacing } from '@/theme';

type Filter = 'ALL' | ProjectStatus;

export default function ProjectsScreen() {
  const router = useRouter();
  const toast = useToast();
  const params = useLocalSearchParams<{ new?: string }>();

  const [filter, setFilter] = useState<Filter>('ALL');
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);

  // pesquisa com pequeno atraso (debounce) para não chamar a API a cada letra
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchText.trim()), 350);
    return () => clearTimeout(t);
  }, [searchText]);

  // Atalho "Projecto" no ecrã Início abre a folha de criação
  useEffect(() => {
    if (params.new === '1') {
      setCreating(true);
      router.setParams({ new: undefined });
    }
  }, [params.new, router]);

  const projects = useProjects({ status: filter === 'ALL' ? undefined : filter, search: search || undefined });
  const counts = projects.data?.counts;
  const items = projects.data?.items ?? [];

  return (
    <View style={{ flex: 1 }}>
      <AppHeader title="Projectos" />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.screen, paddingBottom: 180, gap: 16 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={projects.isRefetching} onRefresh={() => { void projects.refetch(); }} tintColor={colors.primaryContainer} />}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text variant="headlineLg">Os meus projectos</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.secondary }} />
              <Text variant="bodySm" color={colors.onSurfaceVariant}>{counts?.active ?? 0} projectos em andamento</Text>
            </View>
          </View>
          <IconButton icon="insights" label="Estatísticas" bg={colors.surface} color={colors.onSurface} onPress={() => router.push('/stats')} />
        </View>

        {/* Pesquisa */}
        <View style={styles.search}>
          <Icon name="search" size={20} color={colors.outline} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Pesquisar projectos ou tarefas..."
            placeholderTextColor={colors.outline}
            style={styles.searchInput}
            returnKeyType="search"
            autoCorrect={false}
          />
          {searchText ? (
            <Pressable onPress={() => setSearchText('')} hitSlop={10} accessibilityLabel="Limpar pesquisa">
              <Icon name="cancel" size={18} color={colors.outline} />
            </Pressable>
          ) : null}
        </View>

        <ChipRow>
          <Chip label="Todos" count={counts?.all} active={filter === 'ALL'} onPress={() => setFilter('ALL')} />
          <Chip label="Activos" count={counts?.active} active={filter === 'ACTIVE'} onPress={() => setFilter('ACTIVE')} />
          <Chip label="Concluídos" count={counts?.completed} active={filter === 'COMPLETED'} onPress={() => setFilter('COMPLETED')} />
          <Chip label="Arquivo" icon="archive" active={filter === 'ARCHIVED'} onPress={() => setFilter('ARCHIVED')} />
        </ChipRow>

        {projects.isLoading ? <LoadingState /> : null}
        {projects.isError && !projects.data ? <ErrorState message={getErrorMessage(projects.error)} onRetry={() => projects.refetch()} /> : null}
        {projects.data && items.length === 0 ? (
          <EmptyState
            icon="folder-open"
            title={search ? 'Nenhum projecto encontrado' : 'Ainda não há projectos aqui'}
            text={search ? 'Experimente outro termo de pesquisa.' : 'Crie o seu primeiro projecto com o botão “Novo projecto”.'}
          />
        ) : null}

        {items.map((p) => (
          <ProjectCard key={p.id} project={p} onPress={() => router.push(`/project/${p.id}`)} />
        ))}
      </ScrollView>

      <Fab label="Novo projecto" onPress={() => setCreating(true)} />
      <ProjectFormSheet visible={creating} onClose={() => setCreating(false)} onCreated={(p) => router.push(`/project/${p.id}`)} />
    </View>
  );
}

const styles = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, height: 46, borderRadius: radius.full, backgroundColor: colors.surfaceLowest, ...shadow.card },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 14, color: colors.onSurface, paddingVertical: 0 },
});
