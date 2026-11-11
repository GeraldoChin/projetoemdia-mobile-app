import React from 'react';
import { ScrollView, View } from 'react-native';
import { AppHeader } from '@/components/headers';
import { Card } from '@/components/primitives';
import { Text } from '@/components/Text';
import { colors, spacing } from '@/theme';

const sections: [string, string][] = [
  ['Utilização', 'O ProjetoEmDia ajuda a organizar projectos, tarefas, prazos e colaboração. Usa a tua conta de forma responsável, mantém as credenciais privadas e introduz apenas informação que tens autorização para partilhar.'],
  ['Conteúdo dos projectos', 'Os dados que adicionas — incluindo descrições, tarefas, comentários e imagens usadas como foto de perfil — são enviados para o servidor configurado pela organização responsável pela app. Evita guardar palavras-passe ou informação sensível em descrições e comentários.'],
  ['Acesso e colaboração', 'Os membros de um projecto podem ver o conteúdo desse projecto e os dados de perfil necessários à colaboração, como nome, função e foto. Confirma os membros antes de os adicionares.'],
  ['Dados de perfil', 'A app guarda nome, email, função, cidade, foto de perfil, preferências e dados de actividade associados aos projectos. A palavra-passe é processada pela API e não é apresentada na app.'],
  ['Segurança e disponibilidade', 'Protege o teu dispositivo e termina a sessão quando necessário. A disponibilidade, cópias de segurança e eliminação dos dados dependem do servidor e das políticas da organização que gere esta instalação.'],
  ['Privacidade e pedidos', 'Para corrigir ou remover dados, ou esclarecer como são tratados, contacta o administrador da organização que disponibilizou esta instalação. Esta página descreve o funcionamento actual da app; não substitui uma política jurídica aprovada pela organização.'],
];

export default function TermsScreen() {
  return (
    <View style={{ flex: 1 }}>
      <AppHeader title="Termos e Privacidade" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.screen, paddingBottom: 130, gap: 12 }}>
        <Text variant="headlineLg">Termos de utilização e privacidade</Text>
        <Text variant="bodySm" color={colors.onSurfaceVariant}>Resumo informativo do funcionamento actual do ProjetoEmDia.</Text>
        {sections.map(([title, body]) => <Card key={title} style={{ gap: 6 }}><Text variant="labelLg">{title}</Text><Text variant="bodyMd" color={colors.onSurfaceVariant}>{body}</Text></Card>)}
      </ScrollView>
    </View>
  );
}
