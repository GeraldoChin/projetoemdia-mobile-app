import { PrismaClient, Priority, TaskStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const DAY = 86_400_000;
const inDays = (n: number, hour = 12) => {
  const d = new Date(Date.now() + n * DAY);
  d.setUTCHours(hour, 0, 0, 0);
  return d;
};

async function main() {
  if ((await prisma.project.count()) > 0) {
    console.log('Seed ignorado: já existem projectos na base de dados.');
    return;
  }

  const passwordHash = await bcrypt.hash('Segredo123', 10);
  const mkUser = (name: string, email: string, jobTitle: string, city = 'Maputo') =>
    prisma.user.upsert({
      where: { email },
      update: {},
      create: { name, email, passwordHash, jobTitle, city },
    });

  const samira = await mkUser('Samira Nguenha', 'samira.nguenha@empresa.co.mz', 'Product Designer & Gestora de Projectos');
  const edson = await mkUser('Edson Macuácua', 'edson.macuacua@empresa.co.mz', 'Frontend Dev');
  const tania = await mkUser('Tânia Langa', 'tania.langa@empresa.co.mz', 'Product Manager');

  // ---------------------------------------------------------------- Projecto 1
  const web = await prisma.project.create({
    data: {
      title: 'Redesenho Plataforma Web',
      description:
        'Reestruturação completa da experiência móvel e web para estudantes e equipas em Moçambique, com foco em simplicidade e performance.',
      category: 'Design & Desenvolvimento UI/UX',
      sprint: 'Sprint 03 • Q2',
      location: 'Maputo / Remoto',
      priority: Priority.HIGH,
      deadline: inDays(16),
      ownerId: samira.id,
      members: {
        create: [
          { userId: samira.id, role: 'OWNER', jobTitle: 'Líder de Design' },
          { userId: edson.id, jobTitle: 'Frontend Dev' },
          { userId: tania.id, jobTitle: 'Product Manager' },
        ],
      },
    },
  });

  const task = (
    projectId: string,
    title: string,
    assigneeId: string,
    createdById: string,
    status: TaskStatus,
    priority: Priority,
    dueDate: Date | null,
    extra: { description?: string; tag?: string } = {},
  ) =>
    prisma.task.create({
      data: {
        projectId,
        title,
        assigneeId,
        createdById,
        status,
        priority,
        dueDate,
        completedAt: status === 'DONE' ? new Date(Date.now() - DAY) : null,
        ...extra,
      },
    });

  await task(web.id, 'Desenvolver componentes do Design System', samira.id, tania.id, 'DONE', 'MEDIUM', inDays(-3),
    { description: 'Design Tokens, Botões e Modais', tag: 'Design' });
  await task(web.id, 'Apresentação de protótipo aos clientes', samira.id, tania.id, 'DONE', 'LOW', inDays(-5),
    { tag: 'Geral' });
  await task(web.id, 'Revisar proposta técnica de UX', samira.id, tania.id, 'TODO', 'HIGH', inDays(0, 9),
    { description: 'Rever a proposta antes da reunião de alinhamento', tag: 'Design' });
  const mpesa = await task(web.id, 'Integrar fluxo de pagamentos móveis (M-Pesa)', edson.id, tania.id, 'IN_PROGRESS', 'HIGH', inDays(4),
    { description: 'Configurar webhook de confirmação automática para pagamentos locais via M-Pesa e validação de referência bancária.', tag: 'Backend' });
  await task(web.id, 'Integrar fluxo de autenticação e tokens', edson.id, tania.id, 'IN_PROGRESS', 'MEDIUM', inDays(0, 15),
    { description: 'OAuth2, refresh token e sessão móvel' });
  await task(web.id, 'Testes de usabilidade com freelancers', tania.id, samira.id, 'TODO', 'MEDIUM', inDays(8),
    { description: '5 entrevistas remotas via Google Meet' });
  await task(web.id, 'Documentação final da API', edson.id, tania.id, 'TODO', 'LOW', inDays(13),
    { description: 'Endpoints, Swagger e exemplos curl' });
  await task(web.id, 'Redigir termos de confidencialidade', tania.id, tania.id, 'IN_REVIEW', 'MEDIUM', inDays(12),
    { tag: 'Legal' });

  await prisma.comment.createMany({
    data: [
      { taskId: mpesa.id, authorId: samira.id, text: 'Interface dos modais já actualizada conforme a nova paleta.' },
      { taskId: mpesa.id, authorId: edson.id, text: 'Documentação da API recebida e validada no ambiente de testes.' },
    ],
  });

  // ---------------------------------------------------------------- Projecto 2
  const fintech = await prisma.project.create({
    data: {
      title: 'Lançamento Marca FinTech',
      description: 'Identidade visual, materiais para redes sociais e documentação institucional.',
      category: 'Branding',
      deadline: inDays(35),
      ownerId: samira.id,
      members: {
        create: [
          { userId: samira.id, role: 'OWNER', jobTitle: 'Líder' },
          { userId: edson.id, jobTitle: 'Frontend Dev' },
        ],
      },
    },
  });
  await task(fintech.id, 'Definir paleta e tipografia da marca', samira.id, samira.id, 'DONE', 'MEDIUM', inDays(-7), { tag: 'Design' });
  await task(fintech.id, 'Enviar cotação para cliente de Nampula', samira.id, samira.id, 'TODO', 'MEDIUM', inDays(0, 13), { tag: 'Finanças' });
  await task(fintech.id, 'Preparar materiais para redes sociais', edson.id, samira.id, 'IN_PROGRESS', 'LOW', inDays(20));

  // ---------------------------------------------------------------- Projecto 3 (concluído)
  const research = await prisma.project.create({
    data: {
      title: 'Pesquisa com Utilizadores',
      description: 'Entrevistas qualitativas com 15 estudantes universitários em Maputo.',
      category: 'Investigação',
      status: 'COMPLETED',
      deadline: inDays(-40),
      ownerId: tania.id,
      members: { create: [{ userId: tania.id, role: 'OWNER', jobTitle: 'Líder' }, { userId: samira.id }] },
    },
  });
  await task(research.id, 'Realizar entrevistas', tania.id, tania.id, 'DONE', 'MEDIUM', inDays(-50));
  await task(research.id, 'Sintetizar resultados', samira.id, tania.id, 'DONE', 'MEDIUM', inDays(-42));

  // ---------------------------------------------------------------- Projecto 4
  const reports = await prisma.project.create({
    data: {
      title: 'Automação de Relatórios Mensais',
      description: 'Scripts e dashboards em tempo real para pequenos negócios e micro-empresas.',
      category: 'Dados',
      deadline: inDays(60),
      ownerId: edson.id,
      members: { create: [{ userId: edson.id, role: 'OWNER', jobTitle: 'Líder' }, { userId: samira.id }] },
    },
  });
  await task(reports.id, 'Mapear fontes de dados', edson.id, edson.id, 'DONE', 'MEDIUM', inDays(-2));
  await task(reports.id, 'Desenhar dashboard principal', samira.id, edson.id, 'TODO', 'MEDIUM', inDays(25));

  await prisma.notification.createMany({
    data: [
      { userId: samira.id, type: 'TASK_COMMENTED', title: 'Edson Macuácua comentou numa tarefa', body: mpesa.title, data: { taskId: mpesa.id } },
      { userId: samira.id, type: 'DEADLINE_REMINDER', title: 'Prazo a aproximar-se', body: 'Revisar proposta técnica de UX' },
    ],
  });

  console.log('Seed concluído. Utilizador de teste: samira.nguenha@empresa.co.mz / Segredo123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
