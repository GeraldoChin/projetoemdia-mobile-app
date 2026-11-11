import React from 'react';
import { Pressable, ScrollView, Share, View } from 'react-native';
import { AppHeader } from '@/components/headers';
import { Card } from '@/components/primitives';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { colors, spacing } from '@/theme';

const FAQ = [
  ['Como convido alguém para um projecto?', 'Abre o projecto, entra na secção Equipa e adiciona a pessoa pelo nome ou email. A pessoa precisa ter uma conta.'],
  ['Como altero a minha foto?', 'No separador Perfil, toca em Editar Perfil e depois em Escolher foto. A imagem fica associada ao teu perfil.'],
  ['Como recupero a palavra-passe?', 'A recuperação automática por email ainda não está configurada. Pede ao responsável pela instalação da app para redefinir o acesso.'],
  ['Onde vejo as datas de entrega?', 'No Início, toca em Prazos para abrir a agenda com as tarefas pendentes ordenadas por data.'],
  ['Como altero os dados da conta?', 'No separador Perfil, escolhe Editar Perfil. Podes atualizar o nome, a função, a cidade e a foto.'],
];

export default function HelpScreen() {
  return (
    <View style={{ flex: 1 }}>
      <AppHeader title="Ajuda" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.screen, paddingBottom: 130, gap: 12 }}>
        <View style={{ gap: 4, marginBottom: 4 }}><Text variant="headlineLg">Centro de ajuda</Text><Text variant="bodySm" color={colors.onSurfaceVariant}>Respostas rápidas sobre o ProjetoEmDia.</Text></View>
        {FAQ.map(([question, answer]) => <Card key={question} style={{ gap: 6 }}><Text variant="labelLg">{question}</Text><Text variant="bodyMd" color={colors.onSurfaceVariant}>{answer}</Text></Card>)}
        <Pressable onPress={() => Share.share({ message: 'Preciso de ajuda com o ProjetoEmDia.\n\nDescreve aqui o problema e a versão da aplicação.' })}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><Icon name="support-agent" color={colors.secondary} /><View style={{ flex: 1 }}><Text variant="labelLg">Pedir apoio</Text><Text variant="bodySm" color={colors.onSurfaceVariant}>Partilha uma mensagem com a tua equipa de suporte.</Text></View><Icon name="chevron-right" /></Card>
        </Pressable>
      </ScrollView>
    </View>
  );
}
