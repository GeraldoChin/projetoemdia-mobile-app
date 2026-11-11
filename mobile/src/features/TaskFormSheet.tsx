import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { getErrorMessage } from '@/api/client';
import { useCreateTask, useProject, useProjects, useUpdateTask } from '@/api/hooks';
import type { Priority, Task } from '@/api/types';
import { BottomSheet } from '@/components/BottomSheet';
import { DateField, PrioritySelector, SelectField, TextField } from '@/components/forms';
import { Button } from '@/components/primitives';
import { Text } from '@/components/Text';
import { useToast } from '@/components/Toast';
import { colors } from '@/theme';
import { toIsoNoon } from '@/utils/format';

const NO_ASSIGNEE = '__none__';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Criar (por omissão) ou editar uma tarefa existente */
  task?: Task;
  /** Fixa o projecto (ecrã de detalhes do projecto) */
  projectId?: string;
  onSaved?: (task: Task) => void;
}

export function TaskFormSheet({ visible, onClose, task, projectId, onSaved }: Props) {
  const editing = !!task;
  const { user } = useAuth();
  const toast = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedProject, setSelectedProject] = useState<string | null>(projectId ?? null);
  const [assigneeId, setAssigneeId] = useState<string>(NO_ASSIGNEE);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [error, setError] = useState<string | undefined>();

  const activeProjects = useProjects({ status: 'ACTIVE' });
  const ownedProjects = useMemo(
    () => (activeProjects.data?.items ?? []).filter((item) => item.ownerId === user?.id),
    [activeProjects.data, user?.id],
  );
  const effectiveProjectId = task?.projectId ?? projectId ?? selectedProject ?? '';
  const project = useProject(effectiveProjectId);
  const canCreate = editing || project.data?.ownerId === user?.id;

  const create = useCreateTask();
  const update = useUpdateTask(task?.id ?? '');
  const saving = create.isPending || update.isPending;

  // Preenche o formulário sempre que abre
  useEffect(() => {
    if (!visible) return;
    setError(undefined);
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? '');
      setAssigneeId(task.assigneeId ?? NO_ASSIGNEE);
      setDueDate(task.dueDate ? new Date(task.dueDate) : null);
      setPriority(task.priority);
    } else {
      setTitle('');
      setDescription('');
      setAssigneeId(user?.id ?? NO_ASSIGNEE);
      setDueDate(null);
      setPriority('MEDIUM');
      setSelectedProject(projectId ?? ownedProjects[0]?.id ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Se o projecto escolhido por omissão só chegar depois, assume-o
  useEffect(() => {
    if (visible && !editing && !selectedProject && ownedProjects[0]) {
      setSelectedProject(ownedProjects[0].id);
    }
  }, [visible, editing, selectedProject, ownedProjects]);

  const assigneeOptions = useMemo(
    () => [
      { value: NO_ASSIGNEE, label: 'Sem responsável' },
      ...(project.data?.members ?? []).map((m) => ({ value: m.id, label: m.name, hint: m.jobTitle ?? undefined })),
    ],
    [project.data],
  );

  const submit = async () => {
    if (!title.trim()) return setError('Indique o título da tarefa');
    if (!effectiveProjectId) return setError('Escolha um projecto');
    setError(undefined);

    try {
      const assignee = assigneeId === NO_ASSIGNEE ? null : assigneeId;
      const saved = editing
        ? await update.mutateAsync({
            title: title.trim(),
            description: description.trim(),
            assigneeId: assignee,
            priority,
            dueDate: dueDate ? toIsoNoon(dueDate) : null,
          })
        : await create.mutateAsync({
            projectId: effectiveProjectId,
            title: title.trim(),
            description: description.trim() || undefined,
            assigneeId: assignee ?? undefined,
            priority,
            dueDate: dueDate ? toIsoNoon(dueDate) : undefined,
          });
      toast.show(editing ? 'Tarefa actualizada' : 'Tarefa criada com sucesso!');
      onSaved?.(saved);
      onClose();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} icon="add-task" title={editing ? 'Editar tarefa' : 'Criar nova tarefa'} subtitle="Adicione detalhes para a sua equipa">
      <TextField label="Título da tarefa" required value={title} onChangeText={setTitle} placeholder="Ex: Rever contratos e comprovativos" error={error && !title.trim() ? error : undefined} />
      <TextField label="Descrição" value={description} onChangeText={setDescription} multiline placeholder="Instruções claras ou links de referência..." />

      {!editing && !projectId ? (
        <SelectField
          label="Projecto"
          icon="folder-open"
          value={selectedProject}
          onChange={(v) => { setSelectedProject(v); setAssigneeId(user?.id ?? NO_ASSIGNEE); }}
          options={ownedProjects.map((p) => ({ value: p.id, label: p.title }))}
          placeholder="Escolher projecto"
        />
      ) : null}

      <SelectField label="Membro responsável" icon="person-outline" value={assigneeId} onChange={setAssigneeId} options={assigneeOptions} />
      <DateField label="Prazo" value={dueDate} onChange={setDueDate} />
      <PrioritySelector value={priority} onChange={setPriority} />

      {error && title.trim() ? <Text variant="bodySm" color={colors.error}>{error}</Text> : null}
      {!editing && !canCreate ? (
        <Text variant="bodySm" color={colors.onSurfaceVariant}>
          {project.isLoading ? 'A verificar permissões…' : 'Só o líder que criou o projecto pode adicionar uma nova tarefa.'}
        </Text>
      ) : <Button label={editing ? 'Guardar alterações' : 'Criar tarefa'} trailingIcon="check" onPress={submit} loading={saving} />}    </BottomSheet>
  );
}
