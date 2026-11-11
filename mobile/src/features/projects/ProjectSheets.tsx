import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { getErrorMessage } from '@/api/client';
import { useAddMember, useCreateProject, useUserSearch } from '@/api/hooks';
import type { Priority, Project } from '@/api/types';
import { BottomSheet } from '@/components/BottomSheet';
import { DateField, PrioritySelector, TextField } from '@/components/forms';
import { Avatar, Button } from '@/components/primitives';
import { Text } from '@/components/Text';
import { useToast } from '@/components/Toast';
import { colors, radius } from '@/theme';
import { toIsoNoon } from '@/utils/format';

// ------------------------------------------------------------------ Criar projecto
export function ProjectFormSheet({ visible, onClose, onCreated }: { visible: boolean; onClose: () => void; onCreated?: (p: Project) => void }) {
  const toast = useToast();
  const create = useCreateProject();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (visible) {
      setTitle(''); setDescription(''); setDeadline(null); setPriority('MEDIUM'); setError(undefined);
    }
  }, [visible]);

  const submit = async () => {
    if (!title.trim()) return setError('Indique o título do projecto');
    try {
      const project = await create.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        deadline: deadline ? toIsoNoon(deadline) : undefined,
      });
      toast.show('Projecto criado com sucesso!');
      onCreated?.(project);
      onClose();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} icon="create-new-folder" title="Criar novo projecto">
      <TextField label="Título do projecto" required value={title} onChangeText={setTitle} placeholder="Ex: Campanha Digital M-Pesa" error={error && !title.trim() ? error : undefined} />
      <TextField label="Descrição breve" value={description} onChangeText={setDescription} multiline placeholder="Objectivos centrais, escopo e entregáveis principais..." />
      <DateField label="Data de entrega" value={deadline} onChange={setDeadline} />
      <PrioritySelector value={priority} onChange={setPriority} />
      <Text variant="bodySm" color={colors.onSurfaceVariant}>Pode convidar a equipa depois de criar o projecto.</Text>
      {error && title.trim() ? <Text variant="bodySm" color={colors.error}>{error}</Text> : null}
      <Button label="Criar projecto" trailingIcon="check" onPress={submit} loading={create.isPending} />
    </BottomSheet>
  );
}

// ------------------------------------------------------------------ Convidar membro
export function InviteSheet({ visible, onClose, projectId }: { visible: boolean; onClose: () => void; projectId: string }) {
  const toast = useToast();
  const add = useAddMember(projectId);
  const [email, setEmail] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [error, setError] = useState<string | undefined>();
  const search = useUserSearch(email.includes('@') && email.split('@')[1]?.includes('.') ? '' : email);

  useEffect(() => {
    if (visible) { setEmail(''); setJobTitle(''); setError(undefined); }
  }, [visible]);

  const submit = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Indique um email válido');
    try {
      await add.mutateAsync({ email: email.trim(), jobTitle: jobTitle.trim() || undefined });
      toast.show('Membro adicionado ao projecto');
      onClose();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} icon="person-add" title="Convidar membro" subtitle="A pessoa precisa de ter conta no ProjetoEmDia">
      <TextField label="Email ou nome" icon="mail-outline" value={email} onChangeText={(t) => { setEmail(t); setError(undefined); }} autoCapitalize="none" keyboardType="email-address" placeholder="edson.macuacua@empresa.co.mz" />

      {(search.data ?? []).length > 0 ? (
        <View style={{ gap: 6 }}>
          {search.data!.map((u) => (
            <Pressable key={u.id} onPress={() => setEmail(u.email)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: radius.xl, backgroundColor: colors.surfaceLow }}>
              <Avatar name={u.name} uri={u.avatarUrl} size={32} />
              <View style={{ flex: 1 }}>
                <Text variant="headlineSm" style={{ fontSize: 14 }}>{u.name}</Text>
                <Text variant="bodySm" color={colors.onSurfaceVariant}>{u.email}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}

      <TextField label="Função no projecto (opcional)" value={jobTitle} onChangeText={setJobTitle} placeholder="Ex: Frontend Dev" />
      {error ? <Text variant="bodySm" color={colors.error}>{error}</Text> : null}
      <Button label="Convidar" icon="person-add" onPress={submit} loading={add.isPending} />
    </BottomSheet>
  );
}
