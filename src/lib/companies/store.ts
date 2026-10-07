import { Company, CompanyOnboardingStep, Activity } from "@/domain/types";
import { generateInitialOnboardingSteps } from "@/domain/company-lifecycle";

// Seed controlado para DBX Global (Empresa Piloto marcada explicitamente como demo - docs/12-seed-data.md)
const INITIAL_DEMO_COMPANY_ID = "22222222-2222-2222-2222-222222222222";
const DEFAULT_ORG_ID = "11111111-1111-1111-1111-111111111111";

const initialCompanies: Company[] = [
  {
    id: INITIAL_DEMO_COMPANY_ID,
    organization_id: DEFAULT_ORG_ID,
    name: "DBX Global",
    slug: "dbx-global",
    sector: "Tecnologia / Comunicação",
    lifecycle_status: "implantacao",
    health: "saudavel",
    contracted_scope: "Operação comercial completa com Gestor de Tráfego, SDR de Resposta Imediata e Split de Leads.",
    objectives: "Centralizar captação de leads, qualificar em tempo recorde e distribuir para closers.",
    owner_id: "00000000-0000-0000-0000-000000000001",
    owner_name: "Vito",
    primary_contact_name: "Diretoria DBX",
    primary_contact_email: "operacao@dbxglobal.com",
    connected_systems: ["Meta Ads", "CRM DBX", "WhatsApp", "Google Calendar"],
    risks: "Volume alto no lançamento da campanha exigindo escalabilidade do webhook.",
    next_action: "Validar homologação do agente Gestor de Tráfego com a API da Meta.",
    next_review_date: "2026-10-15",
    is_demo: true,
    archived_at: null,
    created_at: "2026-10-07T10:00:00.000Z",
    updated_at: "2026-10-07T12:00:00.000Z",
  },
];

let companiesStore: Company[] = [...initialCompanies];

let onboardingStore: CompanyOnboardingStep[] = generateInitialOnboardingSteps(
  INITIAL_DEMO_COMPANY_ID,
  DEFAULT_ORG_ID
).map((step, idx) => ({
  ...step,
  id: `step-${idx + 1}-${INITIAL_DEMO_COMPANY_ID}`,
  is_completed: idx < 2, // os primeiros dois passos completos para DBX
  completed_at: idx < 2 ? "2026-10-07T11:00:00.000Z" : null,
  completed_by: idx < 2 ? "00000000-0000-0000-0000-000000000001" : null,
  created_at: "2026-10-07T10:00:00.000Z",
  updated_at: "2026-10-07T11:00:00.000Z",
}));

let activitiesStore: Activity[] = [
  {
    id: "act-1",
    organization_id: DEFAULT_ORG_ID,
    company_id: INITIAL_DEMO_COMPANY_ID,
    actor_id: "00000000-0000-0000-0000-000000000001",
    actor_name: "Vito",
    action_type: "company.created",
    title: "Empresa cadastrada",
    description: "DBX Global cadastrada como empresa piloto do HUB.",
    created_at: "2026-10-07T10:00:00.000Z",
  },
  {
    id: "act-2",
    organization_id: DEFAULT_ORG_ID,
    company_id: INITIAL_DEMO_COMPANY_ID,
    actor_id: "00000000-0000-0000-0000-000000000001",
    actor_name: "Vito",
    action_type: "onboarding.step_completed",
    title: "Escopo contratado definido",
    description: "Objetivos e escopo da DBX Global foram validados.",
    created_at: "2026-10-07T10:30:00.000Z",
  },
];

export const companyRepository = {
  list(orgId: string, statusFilter?: string, search?: string): Company[] {
    return companiesStore.filter((c) => {
      if (c.organization_id !== orgId) return false;
      if (c.archived_at) return false;
      if (statusFilter && statusFilter !== "all" && c.lifecycle_status !== statusFilter) return false;
      if (search) {
        const query = search.toLowerCase();
        return c.name.toLowerCase().includes(query) || c.sector.toLowerCase().includes(query);
      }
      return true;
    });
  },

  findById(id: string, orgId: string): Company | null {
    const found = companiesStore.find((c) => c.id === id && c.organization_id === orgId);
    return found || null;
  },

  findBySlug(slug: string, orgId: string): Company | null {
    const found = companiesStore.find((c) => c.slug === slug && c.organization_id === orgId);
    return found || null;
  },

  create(company: Omit<Company, "id" | "created_at" | "updated_at">): Company {
    const now = new Date().toISOString();
    const newCompany: Company = {
      ...company,
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
    };

    companiesStore.push(newCompany);

    // Inicializar checklist padrão de onboarding
    const initialSteps = generateInitialOnboardingSteps(newCompany.id, newCompany.organization_id);
    const stepsWithId: CompanyOnboardingStep[] = initialSteps.map((step) => ({
      ...step,
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
    }));
    onboardingStore.push(...stepsWithId);

    return newCompany;
  },

  update(id: string, orgId: string, updates: Partial<Company>): Company | null {
    const index = companiesStore.findIndex((c) => c.id === id && c.organization_id === orgId);
    if (index === -1) return null;

    const updated: Company = {
      ...companiesStore[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    companiesStore[index] = updated;
    return updated;
  },

  getOnboardingSteps(companyId: string, orgId: string): CompanyOnboardingStep[] {
    return onboardingStore
      .filter((s) => s.company_id === companyId && s.organization_id === orgId)
      .sort((a, b) => a.step_order - b.step_order);
  },

  toggleOnboardingStep(
    stepId: string,
    companyId: string,
    orgId: string,
    isCompleted: boolean,
    userId?: string
  ): CompanyOnboardingStep | null {
    const index = onboardingStore.findIndex(
      (s) => s.id === stepId && s.company_id === companyId && s.organization_id === orgId
    );
    if (index === -1) return null;

    const step = onboardingStore[index];
    const now = new Date().toISOString();
    const updated: CompanyOnboardingStep = {
      ...step,
      is_completed: isCompleted,
      completed_at: isCompleted ? now : null,
      completed_by: isCompleted ? userId || null : null,
      updated_at: now,
    };

    onboardingStore[index] = updated;
    return updated;
  },

  listAllActivities(orgId: string, limit: number = 50): Activity[] {
    return activitiesStore
      .filter((a) => a.organization_id === orgId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  },

  getActivities(companyId: string, orgId: string): Activity[] {
    return activitiesStore
      .filter((a) => a.company_id === companyId && a.organization_id === orgId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  addActivity(activity: Omit<Activity, "id" | "created_at">): Activity {
    const newActivity: Activity = {
      ...activity,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    activitiesStore.unshift(newActivity);
    return newActivity;
  },

  resetForTests() {
    companiesStore = [...initialCompanies];
    activitiesStore = [
      {
        id: "act-1",
        organization_id: DEFAULT_ORG_ID,
        company_id: INITIAL_DEMO_COMPANY_ID,
        actor_id: "00000000-0000-0000-0000-000000000001",
        actor_name: "Vito",
        action_type: "company.created",
        title: "Empresa cadastrada",
        description: "DBX Global cadastrada como empresa piloto do HUB.",
        created_at: "2026-10-07T10:00:00.000Z",
      },
      {
        id: "act-2",
        organization_id: DEFAULT_ORG_ID,
        company_id: INITIAL_DEMO_COMPANY_ID,
        actor_id: "00000000-0000-0000-0000-000000000001",
        actor_name: "Vito",
        action_type: "onboarding.step_completed",
        title: "Escopo contratado definido",
        description: "Objetivos e escopo da DBX Global foram validados.",
        created_at: "2026-10-07T10:30:00.000Z",
      },
    ];
  },
};

export const companiesRepository = companyRepository;

