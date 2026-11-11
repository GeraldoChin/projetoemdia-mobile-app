import React, { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { getErrorMessage } from '@/api/client';
import { useChangePassword, useUpdateProfile } from '@/api/hooks';
import type { Me } from '@/api/types';
import { useAuth } from '@/auth/AuthProvider';
import { BottomSheet } from '@/components/BottomSheet';
import { TextField } from '@/components/forms';
import { Avatar, Button } from '@/components/primitives';
import { Text } from '@/components/Text';
import { useToast } from '@/components/Toast';
import { colors } from '@/theme';

export function EditProfileSheet({ visible, onClose, me }: { visible: boolean; onClose: () => void; me?: Me }) {
  const toast = useToast();
  const { updateUser } = useAuth();
  const update = useUpdateProfile();
  const [name, setName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [city, setCity] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (visible && me) {
      setName(me.name); setJobTitle(me.jobTitle ?? ''); setCity(me.city ?? ''); setAvatarUrl(me.avatarUrl ?? ''); setError(undefined);
    }
  }, [visible, me]);

  const choosePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;
    try {
      const resized = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 512, height: 512 } }],
        { compress: 0.72, format: ImageManipulator.SaveFormat.JPEG, base64: true },
      );
      if (!resized.base64 || resized.base64.length > 580_000) {
        Alert.alert('Não foi possível usar esta foto', 'Escolhe outra imagem e tenta novamente.');
        return;
      }
      setAvatarUrl(`data:image/jpeg;base64,${resized.base64}`);
    } catch {
      Alert.alert('Não foi possível ler a foto', 'Escolhe outra imagem e tenta novamente.');
    }
  };

  const submit = async () => {
    if (!name.trim()) return setError('O nome é obrigatório');
    try {
      const updated = await update.mutateAsync({ name: name.trim(), jobTitle: jobTitle.trim() || undefined, city: city.trim() || undefined, avatarUrl: avatarUrl || undefined });
      updateUser(updated);
      toast.show('Perfil actualizado');
      onClose();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} icon="edit" title="Editar perfil">
      <View style={{ alignItems: 'center', gap: 8 }}>
        <Avatar name={name || me?.name || '?'} uri={avatarUrl || null} size={84} />
        <Button label="Escolher foto" variant="secondary" icon="photo-library" onPress={choosePhoto} style={{ alignSelf: 'center' }} />
      </View>
      <TextField label="Nome completo" icon="person-outline" value={name} onChangeText={setName} />
      <TextField label="Função" icon="work-outline" value={jobTitle} onChangeText={setJobTitle} placeholder="Ex: Product Designer" />
      <TextField label="Cidade" icon="location-on" value={city} onChangeText={setCity} placeholder="Ex: Maputo" />
      {error ? <Text variant="bodySm" color={colors.error}>{error}</Text> : null}
      <Button label="Guardar" trailingIcon="check" onPress={submit} loading={update.isPending} />
    </BottomSheet>
  );
}

export function ChangePasswordSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const toast = useToast();
  const change = useChangePassword();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (visible) { setCurrent(''); setNext(''); setConfirm(''); setError(undefined); }
  }, [visible]);

  const submit = async () => {
    if (!current) return setError('Indique a palavra-passe actual');
    if (next.length < 8) return setError('A nova palavra-passe deve ter pelo menos 8 caracteres');
    if (next !== confirm) return setError('A confirmação não coincide com a nova palavra-passe');
    try {
      await change.mutateAsync({ currentPassword: current, newPassword: next });
      toast.show('Palavra-passe alterada com sucesso');
      onClose();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} icon="lock-reset" title="Alterar palavra-passe">
      <TextField label="Palavra-passe actual" icon="lock-outline" secureTextEntry secureToggle value={current} onChangeText={setCurrent} autoCapitalize="none" />
      <TextField label="Nova palavra-passe" icon="lock-outline" secureTextEntry secureToggle value={next} onChangeText={setNext} autoCapitalize="none" />
      <TextField label="Confirmar nova palavra-passe" icon="lock-outline" secureTextEntry secureToggle value={confirm} onChangeText={setConfirm} autoCapitalize="none" />
      {error ? <Text variant="bodySm" color={colors.error}>{error}</Text> : null}
      <Button label="Alterar palavra-passe" onPress={submit} loading={change.isPending} />
    </BottomSheet>
  );
}
