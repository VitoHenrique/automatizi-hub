import { Agent, AgentVersion, Task } from "@/domain/types";

const DEFAULT_ORG_ID = "11111111-1111-1111-1111-111111111111";
const DBX_COMPANY_ID = "22222222-2222-2222-2222-222222222222";

export const AGENT_GESTOR_TRAFEGO_ID = "33333333-3333-3333-3333-333333333331";
export const AGENT_SDR_RESPOSTA_ID = "33333333-3333-3333-3333-333333333332";
export const AGENT_SPLIT_LEADS_ID = "33333333-3333-3333-3333-333333333333";

const initialAgents: Agent[] = [
  {
    id: AGENT_GESTOR_TRAFEGO_ID,
    organization_id: DEFAULT_ORG_ID,
    company_id: DBX_COMPANY_ID,
    name: "Gestor de Tráfego",
    slug: "gestor-de-trafego",
    kind: "agent",
    role_description: "Gerenciar campanhas pagas de aquisição, otimizar orçamento e alimentar o funil com novos leads qualificados.",
    problem_solved: "Dispersão de verba de anúncios e atraso na otimização de criativos de alta conversão.",
    lifecycle_status: "producao",
    health: "saudavel",
    health_score: 98,
    health_reasons: ["Taxa de conversão e latência de webhook dentro dos parâmetros ideais."],
    current_version: "1.2.0",
    owner_name: "Equipe de Performance",
    flow_summary: "Recebe metas de ROAS e orçamento → Consulta Meta Ads API → Identifica criativos de topo → Ajusta lances → Emite relatório diário.",
    inputs_definition: [
      { name: "orcamento_diario", type: "number", desc: "Verba alocada por campanha" },
      { name: "meta_cpl", type: "number", desc: "Custo por lead máximo aceitável" },
    ],
    decisions_definition: [
      { rule: "Pausar anúncio se CPL > 1.5x da meta por 48h consecutivas" },
      { rule: "Escalar orçamento em 15% para criativos com CTR > 3%" },
    ],
    actions_definition: [
      { action: "Ajustar bid no Meta Ads Marketing API" },
      { action: "Gerar alerta no canal de tráfego caso haja rejeição de criativo" },
    ],
    outputs_definition: [
      { name: "leads_captados", desc: "Novos leads inseridos no CRM DBX" },
      { name: "relatorio_performance", desc: "Resumo executivo de métricas de tráfego" },
    ],
    accessed_systems: ["Meta Ads", "CRM DBX", "Google Sheets"],
    operational_limits: "Orçamento máximo autônomo de R$ 500/dia por conjunto de anúncios sem aprovação humana.",
    human_intervention_rules: "Qualquer alteração de criativo principal ou novo público exige validação do gestor.",
    key_indicators: [
      { kpi: "CPL Médio", target: "R$ 15,00" },
      { kpi: "ROAS Estimado", target: "4.5x" },
    ],
    risks: "Bloqueio temporário de conta de anúncios por revisão da Meta.",
    is_demo: true,
    archived_at: null,
    created_at: "2026-10-07T10:00:00.000Z",
    updated_at: "2026-10-07T12:00:00.000Z",
  },
  {
    id: AGENT_SDR_RESPOSTA_ID,
    organization_id: DEFAULT_ORG_ID,
    company_id: DBX_COMPANY_ID,
    name: "SDR de Resposta Imediata",
    slug: "sdr-resposta-imediata",
    kind: "agent",
    role_description: "Realizar primeiro contato instantâneo via WhatsApp em menos de 60 segundos, qualificar dores e agendar reuniões.",
    problem_solved: "Leads esfriando pelo tempo excessivo de resposta manual de corretores/closers.",
    lifecycle_status: "operacao_assistida",
    health: "saudavel",
    health_score: 94,
    health_reasons: ["98% dos leads abordados em menos de 45 segundos."],
    current_version: "1.0.0",
    owner_name: "Equipe Comercial",
    flow_summary: "Recebe lead do webhook → Inicia diálogo no WhatsApp → Aplica roteiro consultivo BANT → Verifica agenda → Confirma reunião.",
    inputs_definition: [
      { name: "dados_lead", type: "object", desc: "Nome, telefone, interesse e origem da campanha" },
    ],
    decisions_definition: [
      { rule: "Se lead não responder em 15 minutos, disparar follow-up 1" },
      { rule: "Se qualificado com faturamento > R$ 50k, oferecer horário prioritário" },
    ],
    actions_definition: [
      { action: "Enviar mensagem via WhatsApp Cloud API" },
      { action: "Criar convite no Google Calendar" },
    ],
    outputs_definition: [
      { name: "reuniao_agendada", desc: "Evento confirmado na agenda do closer" },
      { name: "score_qualificacao", desc: "Nota de fit comercial de 1 a 10" },
    ],
    accessed_systems: ["WhatsApp Cloud API", "CRM DBX", "Google Calendar"],
    operational_limits: "Não promete preços fixos sem consulta prévia ao comitê de vendas.",
    human_intervention_rules: "Se o lead solicitar contato humano ou fizer pergunta fora do escopo, transborda para o atendente.",
    key_indicators: [
      { kpi: "Tempo Médio de 1ª Resposta", target: "< 60 segundos" },
      { kpi: "Taxa de Agendamento", target: "18%" },
    ],
    risks: "Banimento de número no WhatsApp por denúncias de spam.",
    is_demo: true,
    archived_at: null,
    created_at: "2026-10-07T10:00:00.000Z",
    updated_at: "2026-10-07T12:00:00.000Z",
  },
  {
    id: AGENT_SPLIT_LEADS_ID,
    organization_id: DEFAULT_ORG_ID,
    company_id: DBX_COMPANY_ID,
    name: "Split de Leads",
    slug: "split-de-leads",
    kind: "agent",
    role_description: "Distribuir leads qualificados entre executivos de vendas com base em nicho, capacidade, taxa de fechamento e plantão.",
    problem_solved: "Distribuição desigual ou atrasada que sobrecarrega closers e perde vendas.",
    lifecycle_status: "construcao",
    health: "sem_dados",
    health_score: 0,
    health_reasons: ["Agente ainda em fase de construção; telemetria não ativada."],
    current_version: "0.9.0",
    owner_name: "Operações",
    flow_summary: "Recebe lead qualificado pelo SDR → Avalia matriz de closers disponíveis → Aplica regra de round-robin ponderado → Notifica closer.",
    inputs_definition: [
      { name: "lead_qualificado", type: "object", desc: "Perfil, localização e valor potencial" },
    ],
    decisions_definition: [
      { rule: "Direcionar leads Enterprise exclusivamente para closers Senior" },
    ],
    actions_definition: [
      { action: "Atribuir lead no CRM DBX" },
      { action: "Enviar notificação direta no Slack do closer" },
    ],
    outputs_definition: [
      { name: "atribuicao_closer", desc: "Responsável definido com SLA de atendimento" },
    ],
    accessed_systems: ["CRM DBX", "Slack"],
    operational_limits: "Máximo de 8 novos leads simultâneos por closer por dia.",
    human_intervention_rules: "Permite reatribuição manual de leads pelo coordenador a qualquer momento.",
    key_indicators: [
      { kpi: "SLA de Aceite do Lead", target: "< 10 minutos" },
    ],
    risks: "Closer indisponível por motivo de força maior.",
    is_demo: true,
    archived_at: null,
    created_at: "2026-10-07T10:00:00.000Z",
    updated_at: "2026-10-07T12:00:00.000Z",
  },
];

const initialVersions: AgentVersion[] = [
  {
    id: "ver-1",
    organization_id: DEFAULT_ORG_ID,
    agent_id: AGENT_GESTOR_TRAFEGO_ID,
    version: "1.2.0",
    change_summary: "Otimização do algoritmo de alocação de bid no Meta Ads e proteção de orçamento.",
    config_snapshot: { max_daily_budget: 500, target_cpl: 15 },
    is_production: true,
    promoted_at: "2026-10-07T10:00:00.000Z",
    created_at: "2026-10-07T10:00:00.000Z",
  },
  {
    id: "ver-2",
    organization_id: DEFAULT_ORG_ID,
    agent_id: AGENT_SDR_RESPOSTA_ID,
    version: "1.0.0",
    change_summary: "Primeira versão para operação assistida com script BANT.",
    config_snapshot: { response_timeout_seconds: 60 },
    is_production: false,
    promoted_at: null,
    created_at: "2026-10-07T10:00:00.000Z",
  },
];

const initialTasks: Task[] = [
  {
    id: "task-1",
    organization_id: DEFAULT_ORG_ID,
    company_id: DBX_COMPANY_ID,
    agent_id: AGENT_GESTOR_TRAFEGO_ID,
    title: "Conectar token da conta de anúncios da Meta",
    description: "Homologar chaves de API da conta DBX Business Manager.",
    kind: "milestone",
    status: "done",
    priority: "high",
    assignee_name: "Vito",
    due_date: "2026-10-06",
    completed_at: "2026-10-06T18:00:00.000Z",
    created_at: "2026-10-06T10:00:00.000Z",
    updated_at: "2026-10-06T18:00:00.000Z",
  },
  {
    id: "task-2",
    organization_id: DEFAULT_ORG_ID,
    company_id: DBX_COMPANY_ID,
    agent_id: AGENT_GESTOR_TRAFEGO_ID,
    title: "Revisar teto de orçamento diário com diretoria",
    description: "Confirmar se o limite de R$ 500/dia pode ser elevado para R$ 1.000/dia no feriado.",
    kind: "decision",
    status: "in_progress",
    priority: "urgent",
    assignee_name: "Diretoria DBX",
    due_date: "2026-10-10",
    completed_at: null,
    created_at: "2026-10-07T09:00:00.000Z",
    updated_at: "2026-10-07T09:00:00.000Z",
  },
  {
    id: "task-3",
    organization_id: DEFAULT_ORG_ID,
    company_id: DBX_COMPANY_ID,
    agent_id: AGENT_SDR_RESPOSTA_ID,
    title: "Cadastrar novos templates de mensagem aprovados pela Meta",
    description: "Submeter 3 variações de quebra de gelo no WhatsApp Cloud API.",
    kind: "task",
    status: "todo",
    priority: "medium",
    assignee_name: "Operações",
    due_date: "2026-10-12",
    completed_at: null,
    created_at: "2026-10-07T11:00:00.000Z",
    updated_at: "2026-10-07T11:00:00.000Z",
  },
  {
    id: "task-4",
    organization_id: DEFAULT_ORG_ID,
    company_id: DBX_COMPANY_ID,
    agent_id: AGENT_SPLIT_LEADS_ID,
    title: "Finalizar matriz de ponderação por closer",
    description: "Definir pontuação para cada closer com base no histórico de conversão.",
    kind: "blocker",
    status: "in_progress",
    priority: "high",
    assignee_name: "Vito",
    due_date: "2026-10-14",
    completed_at: null,
    created_at: "2026-10-07T11:30:00.000Z",
    updated_at: "2026-10-07T11:30:00.000Z",
  },
];

let agentsStore: Agent[] = [...initialAgents];
let versionsStore: AgentVersion[] = [...initialVersions];
let tasksStore: Task[] = [...initialTasks];

export const agentRepository = {
  list(orgId: string, companyId?: string, statusFilter?: string, search?: string): Agent[] {
    return agentsStore.filter((a) => {
      if (a.organization_id !== orgId) return false;
      if (a.archived_at) return false;
      if (companyId && a.company_id !== companyId) return false;
      if (statusFilter && statusFilter !== "all" && a.lifecycle_status !== statusFilter) return false;
      if (search) {
        const query = search.toLowerCase();
        return a.name.toLowerCase().includes(query) || a.role_description.toLowerCase().includes(query);
      }
      return true;
    });
  },

  findById(id: string, orgId: string): Agent | null {
    const found = agentsStore.find((a) => a.id === id && a.organization_id === orgId);
    return found || null;
  },

  findBySlug(slug: string, companyId: string, orgId: string): Agent | null {
    const found = agentsStore.find((a) => a.slug === slug && a.company_id === companyId && a.organization_id === orgId);
    return found || null;
  },

  create(agent: Omit<Agent, "id" | "created_at" | "updated_at">): Agent {
    const now = new Date().toISOString();
    const newAgent: Agent = {
      ...agent,
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
    };
    agentsStore.push(newAgent);

    // Cria versão inicial 1.0.0
    versionsStore.push({
      id: crypto.randomUUID(),
      organization_id: newAgent.organization_id,
      agent_id: newAgent.id,
      version: newAgent.current_version,
      change_summary: "Versão inicial cadastrada no HUB.",
      config_snapshot: {},
      is_production: false,
      promoted_at: null,
      promoted_by: null,
      created_at: now,
    });

    return newAgent;
  },

  update(id: string, orgId: string, updates: Partial<Agent>): Agent | null {
    const index = agentsStore.findIndex((a) => a.id === id && a.organization_id === orgId);
    if (index === -1) return null;

    const updated: Agent = {
      ...agentsStore[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    agentsStore[index] = updated;
    return updated;
  },

  promoteToProduction(
    id: string,
    orgId: string,
    version: string,
    changeSummary: string,
    userId?: string
  ): { agent: Agent; versionRecord: AgentVersion } | null {
    const agent = this.findById(id, orgId);
    if (!agent) return null;

    const now = new Date().toISOString();

    // Marcar versões anteriores como não-produção
    versionsStore.forEach((v) => {
      if (v.agent_id === id) v.is_production = false;
    });

    const newVersionRecord: AgentVersion = {
      id: crypto.randomUUID(),
      organization_id: orgId,
      agent_id: id,
      version,
      change_summary: changeSummary,
      config_snapshot: {
        inputs: agent.inputs_definition,
        decisions: agent.decisions_definition,
        actions: agent.actions_definition,
        outputs: agent.outputs_definition,
        limits: agent.operational_limits,
      },
      is_production: true,
      promoted_at: now,
      promoted_by: userId || null,
      created_at: now,
    };
    versionsStore.push(newVersionRecord);

    const updatedAgent = this.update(id, orgId, {
      lifecycle_status: "producao",
      current_version: version,
      health: agent.health === "sem_dados" ? "saudavel" : agent.health,
    });

    if (!updatedAgent) return null;

    return { agent: updatedAgent, versionRecord: newVersionRecord };
  },

  getVersions(agentId: string, orgId: string): AgentVersion[] {
    return versionsStore
      .filter((v) => v.agent_id === agentId && v.organization_id === orgId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  getTasks(agentId: string, orgId: string): Task[] {
    return tasksStore
      .filter((t) => t.agent_id === agentId && t.organization_id === orgId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  createTask(task: Omit<Task, "id" | "created_at" | "updated_at">): Task {
    const now = new Date().toISOString();
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
    };
    tasksStore.unshift(newTask);
    return newTask;
  },

  updateTaskStatus(taskId: string, orgId: string, status: Task["status"]): Task | null {
    const idx = tasksStore.findIndex((t) => t.id === taskId && t.organization_id === orgId);
    if (idx === -1) return null;
    const task = tasksStore[idx];
    const now = new Date().toISOString();
    const updated: Task = {
      ...task,
      status,
      completed_at: status === "done" ? now : null,
      updated_at: now,
    };
    tasksStore[idx] = updated;
    return updated;
  },

  resetForTests() {
    agentsStore = [...initialAgents];
    versionsStore = [...initialVersions];
    tasksStore = [...initialTasks];
  },
};
