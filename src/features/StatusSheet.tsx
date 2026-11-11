import React from 'react';
import { Pressable, View } from 'react-native';
import type { TaskStatus } from '@/api/types';
import { BottomSheet } from '@/components/BottomSheet';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { colors, radius } from '@/theme';
import { STATUS_COLOR, STATUS_LABEL, STATUS_ORDER } from '@/utils/labels';

export function StatusSheet({ visible, onClose, current, onSelect }: {
  visible: boolean;
  onClose: () => void;
  current: TaskStatus;
  onSelect: (s: TaskStatus) => void;
}) {
  return (
    <BottomSheet visible={visible} onClose={onClose} icon="flag" title="Estado da tarefa">
      {STATUS_ORDER.map((s) => {
        const c = STATUS_COLOR[s];
        const active = s === current;
        return (
          <Pressable
            key={s}
            onPress={() => { onSelect(s); onClose(); }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.xl, backgroundColor: active ? c.bg : colors.surfaceLow }}
          >
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c.fg }} />
            <Text variant="headlineSm" style={{ flex: 1, fontSize: 14 }}>{STATUS_LABEL[s]}</Text>
            {active ? <Icon name="check" size={20} color={c.fg} /> : null}
          </Pressable>
        );
      })}
    </BottomSheet>
  );
}
