import { useState, useEffect, useMemo, useRef } from "react";
import {
  LayoutDashboard, ClipboardList, DollarSign, TrendingUp, Settings,
  LogOut, Plus, Check, X, ChevronRight, Clock, CheckCircle2, XCircle,
  AlertCircle, MessageSquare, Building2, Calendar, Wallet, FileText,
  User, Shield, Eye, ArrowLeft, Edit2, Trash2, Activity,
  Lock, Layers, BarChart2, Paperclip, Image, Upload, RefreshCw, ChevronDown,
  Truck, CreditCard, Send, ExternalLink, Hash, Copy, Search, Download, Users
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend
} from "recharts";

// ─────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);
const now = () => new Date().toISOString();
const fmt = v => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 }).format(v || 0);
const fmtDate = d => d ? new Date(d).toLocaleDateString("pt-BR") : "—";
const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const MONTHS_SHORT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const ROLE_LABELS = { director:"Diretor", area_manager:"Gestor de Área", operator:"Operador", auditor:"Auditor" };
const ROLE_COLORS = { director:"#f59e0b", area_manager:"#60a5fa", operator:"#34d399", auditor:"#c084fc" };
const STATUS_LABELS = { open:"Aberta", in_progress:"Em Andamento", awaiting_approval:"Aguard. Aprovação", completed:"Concluída", rejected:"Rejeitada", cancelled:"Cancelada" };
const STATUS_COLORS = { open:"#64748b", in_progress:"#3b82f6", awaiting_approval:"#f59e0b", completed:"#10b981", rejected:"#ef4444", cancelled:"#475569" };
const COST_CATS = ["CLT","Terceirizado","Transferência","Limpeza","Galpão","Frota","Gasolina","Salário Agr. Casa","Energia","Imposto","Agregados Externos","Outros"];

// ─────────────────────────────────────────────
// SEED
// ─────────────────────────────────────────────
const SEED = {
  areas: [
    { id:"a1", name:"Operações" },
    { id:"a2", name:"Comercial" },
    { id:"a3", name:"Financeiro" },
    { id:"a4", name:"Tecnologia" },
  ],
  users: [
    { id:"u1", name:"Carlos Mendes", email:"carlos@ops.com", password:"123456", phone:"27999990001", role:"director",     areaIds:[], financialAccess:true,  fechamentoAccess:true  },
    { id:"u2", name:"Ana Costa",     email:"ana@ops.com",    password:"123456", role:"area_manager", areaIds:["a1"], financialAccess:false, fechamentoAccess:true  },
    { id:"u3", name:"Bruno Silva",   email:"bruno@ops.com",  password:"123456", role:"area_manager", areaIds:["a2"], financialAccess:false, fechamentoAccess:false },
    { id:"u4", name:"Mariana Neves", email:"mariana@ops.com",password:"123456", role:"area_manager", areaIds:["a3"], financialAccess:true,  fechamentoAccess:true  },
    { id:"u5", name:"Pedro Alves",   email:"pedro@ops.com",  password:"123456", role:"operator",     areaIds:["a1"], financialAccess:false, fechamentoAccess:true  },
    { id:"u6", name:"Lúcia Moraes",  email:"lucia@ops.com",  password:"123456", role:"operator",     areaIds:["a2"], financialAccess:false, fechamentoAccess:false },
    { id:"u7", name:"Ricardo Pinto", email:"ricardo@ops.com",password:"123456", role:"auditor",       areaIds:[], financialAccess:true,  fechamentoAccess:false },
  ],
  clients: [
    { id:"c1", name:"Magazine Logística", code:"MAG", active:true },
    { id:"c2", name:"TechDistrib",        code:"TEC", active:true },
    { id:"c3", name:"FoodExpress",        code:"FOO", active:true },
    { id:"c4", name:"RetailPrime",        code:"RET", active:true },
  ],
  taskTemplates: [
    {
      id:"tt1", name:"Contratação de Fornecedor", description:"Fluxo para contratação de novos fornecedores",
      category:"Comercial", areaIds:["a2"],
      costParams:[
        { id:"cp1", name:"Due Diligence", inputLabel:"Custo estimado (R$)", multiplier:1, multiplierLabel:"valor direto" }
      ],
      steps:[
        { id:"ts1", order:1, name:"Solicitação", description:"Abertura e justificativa", areaId:"a2", requiresApproval:false, approverRole:null },
        { id:"ts2", order:2, name:"Análise Financeira", description:"Avaliação financeira", areaId:"a3", requiresApproval:true, approverRole:"area_manager" },
        { id:"ts3", order:3, name:"Aprovação Diretoria", description:"Aprovação final", areaId:null, requiresApproval:true, approverRole:"director" },
      ]
    },
    {
      id:"tt2", name:"Alteração de Rota", description:"Alteração de rotas operacionais",
      category:"Operações", areaIds:["a1"],
      costParams:[],
      steps:[
        { id:"ts1", order:1, name:"Solicitação", description:"Descrever alteração necessária", areaId:"a1", requiresApproval:false, approverRole:null },
        { id:"ts2", order:2, name:"Validação Operacional", description:"Validação pelo gestor", areaId:"a1", requiresApproval:true, approverRole:"area_manager" },
      ]
    },
    {
      id:"tt3", name:"Contratação de Funcionário", description:"Processo de contratação com cálculo de encargos",
      category:"Operações", areaIds:["a1","a2","a3","a4"],
      costParams:[
        { id:"cp1", name:"Custo com Funcionário", inputLabel:"Salário Base (R$)", multiplier:1.7, multiplierLabel:"× 1.7 (encargos trabalhistas)" },
        { id:"cp2", name:"Equipamentos / Uniformes", inputLabel:"Valor estimado (R$)", multiplier:1, multiplierLabel:"valor direto" }
      ],
      steps:[
        { id:"ts1", order:1, name:"Solicitação", description:"Justificar necessidade da contratação", areaId:null, requiresApproval:false, approverRole:null },
        { id:"ts2", order:2, name:"Aprovação Gestão", description:"Gestor valida a necessidade", areaId:null, requiresApproval:true, approverRole:"area_manager" },
        { id:"ts3", order:3, name:"Aprovação Diretoria", description:"Diretor aprova contratação", areaId:null, requiresApproval:true, approverRole:"director" },
      ]
    },
    {
      id:"tt4", name:"Onboarding de Cliente", description:"Processo completo de onboarding",
      category:"Comercial", areaIds:["a2"],
      costParams:[
        { id:"cp1", name:"Setup Tecnológico", inputLabel:"Horas de setup", multiplier:150, multiplierLabel:"× R$150/h" }
      ],
      steps:[
        { id:"ts1", order:1, name:"Cadastro", description:"Cadastro no sistema", areaId:"a2", requiresApproval:false, approverRole:null },
        { id:"ts2", order:2, name:"Setup Operacional", description:"Configurar fluxos operacionais", areaId:"a1", requiresApproval:false, approverRole:null },
        { id:"ts3", order:3, name:"Aprovação Financeira", description:"Validar condições comerciais", areaId:"a3", requiresApproval:true, approverRole:"area_manager" },
        { id:"ts4", order:4, name:"Aprovação Diretoria", description:"Aprovação final", areaId:null, requiresApproval:true, approverRole:"director" },
      ]
    },
  ],
  tasks: [
    {
      id:"t1", templateId:"tt1", templateName:"Contratação de Fornecedor",
      title:"Contratação Fornecedor Embalagens ABC", description:"Contratar fornecedor de embalagens",
      status:"awaiting_approval", openedBy:"u6", openedAt:"2025-04-10T09:00:00", currentStepIndex:1,
      clientAllocation:[{ clientId:"c1", percent:50 },{ clientId:"c2", percent:50 }],
      costRationals:[{ id:"cr1", description:"Due Diligence", value:1500, category:"Operacional" }],
      attachments:[],
      stepStatuses:[
        { stepId:"ts1", status:"completed", actorId:"u6", actedAt:"2025-04-10T09:30:00", comment:"Solicitação enviada" },
        { stepId:"ts2", status:"pending", actorId:null, actedAt:null, comment:null },
        { stepId:"ts3", status:"pending", actorId:null, actedAt:null, comment:null },
      ],
      comments:[{ id:"cm1", userId:"u6", userName:"Lúcia Moraes", text:"Fornecedor com boas referências", createdAt:"2025-04-10T09:15:00" }]
    },
    {
      id:"t2", templateId:"tt2", templateName:"Alteração de Rota",
      title:"Alteração Rota SP-RJ — FoodExpress", description:"Otimização de rota para redução de frete",
      status:"completed", openedBy:"u5", openedAt:"2025-04-05T10:00:00", currentStepIndex:2,
      clientAllocation:[{ clientId:"c3", percent:100 }],
      costRationals:[],
      attachments:[],
      stepStatuses:[
        { stepId:"ts1", status:"completed", actorId:"u5", actedAt:"2025-04-05T10:30:00", comment:"Rota alternativa identificada" },
        { stepId:"ts2", status:"completed", actorId:"u2", actedAt:"2025-04-06T14:00:00", comment:"Aprovado. Economia de 15%" },
      ],
      comments:[]
    },
    {
      id:"t3", templateId:"tt3", templateName:"Contratação de Funcionário",
      title:"Contratação Motorista SR — RetailPrime", description:"Necessidade de motorista SR para nova rota",
      status:"in_progress", openedBy:"u5", openedAt:"2025-04-12T08:00:00", currentStepIndex:0,
      clientAllocation:[{ clientId:"c4", percent:100 }],
      costRationals:[
        { id:"cr2", description:"Custo com Funcionário", value:4080, category:"Pessoal" },
        { id:"cr3", description:"Equipamentos / Uniformes", value:350, category:"Operacional" }
      ],
      attachments:[],
      stepStatuses:[
        { stepId:"ts1", status:"in_progress", actorId:null, actedAt:null, comment:null },
        { stepId:"ts2", status:"pending",     actorId:null, actedAt:null, comment:null },
        { stepId:"ts3", status:"pending",     actorId:null, actedAt:null, comment:null },
      ],
      comments:[]
    },
  ],
  fixedCosts:[
    { id:"fc1", description:"Aluguel Galpão Principal", value:15000, category:"Infraestrutura", clientAllocation:[{clientId:"c1",percent:30},{clientId:"c2",percent:25},{clientId:"c3",percent:30},{clientId:"c4",percent:15}], active:true, createdBy:"u4" },
    { id:"fc2", description:"Folha Operacional", value:45000, category:"Pessoal", clientAllocation:[{clientId:"c1",percent:35},{clientId:"c2",percent:20},{clientId:"c3",percent:30},{clientId:"c4",percent:15}], active:true, createdBy:"u4" },
    { id:"fc3", description:"Seguro da Frota", value:8000, category:"Seguros", clientAllocation:[{clientId:"c1",percent:25},{clientId:"c2",percent:25},{clientId:"c3",percent:35},{clientId:"c4",percent:15}], active:true, createdBy:"u4" },
  ],
  costEntries:[
    { id:"ce1", description:"Combustível — Abril", value:12000, category:"Combustível", clientAllocation:[{clientId:"c1",percent:30},{clientId:"c2",percent:20},{clientId:"c3",percent:35},{clientId:"c4",percent:15}], month:4, year:2025, createdBy:"u4" },
    { id:"ce2", description:"Manutenção Veículos", value:5500, category:"Manutenção", clientAllocation:[{clientId:"c3",percent:100}], month:4, year:2025, createdBy:"u4" },
    { id:"ce3", description:"Combustível — Março", value:11200, category:"Combustível", clientAllocation:[{clientId:"c1",percent:30},{clientId:"c2",percent:20},{clientId:"c3",percent:35},{clientId:"c4",percent:15}], month:3, year:2025, createdBy:"u4" },
  ],
  revenueEntries:[
    { id:"re1",  clientId:"c1", month:4, year:2025, period:1, value:48000, description:"Faturamento 1ª Quinzena Abril",  createdBy:"u3" },
    { id:"re2",  clientId:"c1", month:4, year:2025, period:2, value:47000, description:"Faturamento 2ª Quinzena Abril",  createdBy:"u3" },
    { id:"re3",  clientId:"c2", month:4, year:2025, period:1, value:30000, description:"Faturamento 1ª Quinzena Abril",  createdBy:"u3" },
    { id:"re4",  clientId:"c2", month:4, year:2025, period:2, value:32000, description:"Faturamento 2ª Quinzena Abril",  createdBy:"u3" },
    { id:"re5",  clientId:"c3", month:4, year:2025, period:1, value:39000, description:"Faturamento 1ª Quinzena Abril",  createdBy:"u3" },
    { id:"re6",  clientId:"c3", month:4, year:2025, period:2, value:39000, description:"Faturamento 2ª Quinzena Abril",  createdBy:"u3" },
    { id:"re7",  clientId:"c4", month:4, year:2025, period:1, value:20500, description:"Faturamento 1ª Quinzena Abril",  createdBy:"u3" },
    { id:"re8",  clientId:"c4", month:4, year:2025, period:2, value:20500, description:"Faturamento 2ª Quinzena Abril",  createdBy:"u3" },
    { id:"re9",  clientId:"c1", month:3, year:2025, period:1, value:44000, description:"Faturamento 1ª Quinzena Março",  createdBy:"u3" },
    { id:"re10", clientId:"c1", month:3, year:2025, period:2, value:44000, description:"Faturamento 2ª Quinzena Março",  createdBy:"u3" },
    { id:"re11", clientId:"c2", month:3, year:2025, period:1, value:29000, description:"Faturamento 1ª Quinzena Março",  createdBy:"u3" },
    { id:"re12", clientId:"c2", month:3, year:2025, period:2, value:29000, description:"Faturamento 2ª Quinzena Março",  createdBy:"u3" },
    { id:"re13", clientId:"c3", month:3, year:2025, period:1, value:36000, description:"Faturamento 1ª Quinzena Março",  createdBy:"u3" },
    { id:"re14", clientId:"c3", month:3, year:2025, period:2, value:36000, description:"Faturamento 2ª Quinzena Março",  createdBy:"u3" },
    { id:"re15", clientId:"c4", month:3, year:2025, period:1, value:19500, description:"Faturamento 1ª Quinzena Março",  createdBy:"u3" },
    { id:"re16", clientId:"c4", month:3, year:2025, period:2, value:19500, description:"Faturamento 2ª Quinzena Março",  createdBy:"u3" },
  ],
  forecastEntries:[
    { id:"fe1",  clientId:"c1", month:4, year:2025, volumetria:950,  ticketMedio:100, comissaoPercent:5, impostoPercent:8.65, fretePrevisto:8000, maoObraTercPrevisto:3000, maoObraCLTBase:2400, cgcPrevisto:1500, growthRate:3,  volumetriaRealizada:920,  observacao:"" },
    { id:"fe2",  clientId:"c2", month:4, year:2025, volumetria:620,  ticketMedio:100, comissaoPercent:5, impostoPercent:8.65, fretePrevisto:5000, maoObraTercPrevisto:2000, maoObraCLTBase:1800, cgcPrevisto:1000, growthRate:2,  volumetriaRealizada:640,  observacao:"" },
    { id:"fe3",  clientId:"c3", month:4, year:2025, volumetria:780,  ticketMedio:100, comissaoPercent:5, impostoPercent:8.65, fretePrevisto:7000, maoObraTercPrevisto:2500, maoObraCLTBase:2000, cgcPrevisto:1200, growthRate:5,  volumetriaRealizada:780,  observacao:"Crescimento acima do esperado" },
    { id:"fe4",  clientId:"c4", month:4, year:2025, volumetria:410,  ticketMedio:100, comissaoPercent:5, impostoPercent:8.65, fretePrevisto:3500, maoObraTercPrevisto:1200, maoObraCLTBase:1200, cgcPrevisto:800,  growthRate:4,  volumetriaRealizada:null, observacao:"" },
    { id:"fe5",  clientId:"c1", month:3, year:2025, volumetria:920,  ticketMedio:100, comissaoPercent:5, impostoPercent:8.65, fretePrevisto:7800, maoObraTercPrevisto:2900, maoObraCLTBase:2400, cgcPrevisto:1500, growthRate:3,  volumetriaRealizada:905,  observacao:"" },
    { id:"fe6",  clientId:"c2", month:3, year:2025, volumetria:605,  ticketMedio:100, comissaoPercent:5, impostoPercent:8.65, fretePrevisto:4800, maoObraTercPrevisto:1900, maoObraCLTBase:1800, cgcPrevisto:950,  growthRate:2,  volumetriaRealizada:590,  observacao:"" },
    { id:"fe7",  clientId:"c3", month:3, year:2025, volumetria:740,  ticketMedio:100, comissaoPercent:5, impostoPercent:8.65, fretePrevisto:6500, maoObraTercPrevisto:2300, maoObraCLTBase:2000, cgcPrevisto:1100, growthRate:5,  volumetriaRealizada:720,  observacao:"" },
    { id:"fe8",  clientId:"c4", month:3, year:2025, volumetria:395,  ticketMedio:100, comissaoPercent:5, impostoPercent:8.65, fretePrevisto:3200, maoObraTercPrevisto:1100, maoObraCLTBase:1200, cgcPrevisto:750,  growthRate:4,  volumetriaRealizada:null, observacao:"" },
  ],
  motoristas:[
    { id:"mt1", nome:"Lorena Bastos Costa",        matricula:"134994", email:"lorena@email.com",    cpf:"111.222.333-44", tipoPagamento:"ambos",  valorDiaria:80,  valorPacote:1.20, ativo:true, codigoAcesso:"AGR-LBC-7841" },
    { id:"mt2", nome:"Luciano Alves Santana",       matricula:"135296", email:"luciano@email.com",   cpf:"222.333.444-55", tipoPagamento:"pacote", valorDiaria:0,   valorPacote:1.50, ativo:true, codigoAcesso:"AGR-LAS-3295" },
    { id:"mt3", nome:"Denis Wallace Teixeira",      matricula:"135349", email:"denis@email.com",     cpf:"333.444.555-66", tipoPagamento:"ambos",  valorDiaria:90,  valorPacote:1.30, ativo:true, codigoAcesso:"AGR-DWT-6612" },
    { id:"mt4", nome:"Carlos Eduardo Neves",        matricula:"135372", email:"carlosn@email.com",   cpf:"444.555.666-77", tipoPagamento:"diaria", valorDiaria:120, valorPacote:0,    ativo:true, codigoAcesso:"AGR-CEN-4407" },
    { id:"mt5", nome:"Murilo Demetre Luz",          matricula:"135652", email:"murilo@email.com",    cpf:"555.666.777-88", tipoPagamento:"pacote", valorDiaria:0,   valorPacote:1.80, ativo:true, codigoAcesso:"AGR-MDL-9930" },
    { id:"mt6", nome:"Wanderson Gomes",             matricula:"135754", email:"wanderson@email.com", cpf:"666.777.888-99", tipoPagamento:"ambos",  valorDiaria:75,  valorPacote:1.10, ativo:true, codigoAcesso:"AGR-WGS-2258" },
    { id:"mt7", nome:"Pedro Lucas Barcelos Lemos",  matricula:"136233", email:"pedrol@email.com",    cpf:"777.888.999-00", tipoPagamento:"pacote", valorDiaria:0,   valorPacote:1.40, ativo:true, codigoAcesso:"AGR-PLB-5573" },
    { id:"mt8", nome:"Webert Ferreira Pinto",       matricula:"136992", email:"webert@email.com",    cpf:"888.999.000-11", tipoPagamento:"ambos",  valorDiaria:85,  valorPacote:1.25, ativo:true, codigoAcesso:"AGR-WFP-8819" },
  ],
  fechamentos:[],
  unidades:[
    { id:"un1", codigo:"000001596", nome:"ALL LOGISTICA E SERVICOS DE MALOTES LTDA" }
  ],
  faturamentosJadlog:[],
};

// ─────────────────────────────────────────────
// STORAGE
// ─────────────────────────────────────────────
// ── Supabase client (configurado via variáveis de ambiente) ──
const getSupabase = () => {
  const url = typeof window !== "undefined" && window.__SUPABASE_URL__;
  const key = typeof window !== "undefined" && window.__SUPABASE_KEY__;
  if (!url || !key || !window.supabase) return null;
  if (!window._supabaseClient) {
    window._supabaseClient = window.supabase.createClient(url, key);
  }
  return window._supabaseClient;
};

// ── Email notification via mailto (opens email client) ──────────────
// For automatic emails, configure EmailJS: https://www.emailjs.com
function notifyUsers(users, subject, body) {
  // Try EmailJS if configured
  if (window.emailjs && window.__EMAILJS_SERVICE__ && window.__EMAILJS_TEMPLATE__) {
    users.forEach(u => {
      if (!u.email) return;
      window.emailjs.send(window.__EMAILJS_SERVICE__, window.__EMAILJS_TEMPLATE__, {
        to_email: u.email, to_name: u.name, subject, message: body
      }).catch(e => console.warn("EmailJS:", e));
    });
    return;
  }
  // Fallback: nothing (mailto would open popups for each user)
  console.log("[Notif]", subject, "→", users.map(u=>u.email).join(", "));
}
// ── Categorias de custo da operação ───────────────────────

const __STORE__ = {};
const __LOADED__ = {}; // tracks which keys have been loaded from Supabase

function useLS(key, init) {
  const k = "ops3_"+(key)+"";

  // Initialize store entry once from localStorage
  if (__STORE__[k] === undefined) {
    let fromLS = null;
    try { const s = localStorage.getItem(k); fromLS = s ? JSON.parse(s) : null; } catch {}
    __STORE__[k] = fromLS !== null ? fromLS : init;
  }

  const [val, setVal] = useState(() => __STORE__[k]);

  const set = v => {
    const nv = typeof v === "function" ? v(__STORE__[k]) : v;
    __STORE__[k] = nv;           // 1. update global store immediately
    setVal(nv);                  // 2. trigger re-render
    __LOADED__[k] = true;        // 3. mark as "user has written" — block Supabase overwrite
    try { localStorage.setItem(k, JSON.stringify(nv)); } catch {}
    // 4. save to Supabase (fire and forget)
    const sb = getSupabase();
    if (sb) {
      sb.from("app_data")
        .upsert({ key: k, value: nv }, { onConflict: "key" })
        .then(({ error }) => { if (error) console.warn("[useLS] save error:", error.message); });
    }
  };

  // Load from Supabase ONCE on first mount — only if user hasn't written yet
  useEffect(() => {
    if (__LOADED__[k]) return; // already loaded or user wrote — skip
    const sb = getSupabase();
    if (!sb) { __LOADED__[k] = true; return; }
    sb.from("app_data").select("value").eq("key", k).single()
      .then(({ data }) => {
        if (__LOADED__[k]) return; // user wrote while we were fetching — discard
        if (data?.value !== undefined && data.value !== null) {
          __STORE__[k] = data.value;
          setVal(data.value);
          try { localStorage.setItem(k, JSON.stringify(data.value)); } catch {}
        }
        __LOADED__[k] = true;
      })
      .catch(() => { __LOADED__[k] = true; });
    // NO polling — never overwrite local state after initial load
  // eslint-disable-next-line
  }, []);

  return [val, set];
}

// ─────────────────────────────────────────────
// SHARED UI
// ─────────────────────────────────────────────
const Badge = ({ color, children }) => (
  <span style={{ color, background: color+"18", border:"1px solid "+(color)+"30" }}
    className="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap">{children}</span>
);
const Card = ({ children, className="" }) => (
  <div className={"bg-slate-800 border border-slate-700 rounded-xl "+(className)+""}>{children}</div>
);
const Btn = ({ onClick, children, variant="primary", size="md", className="", disabled=false, type="button" }) => {
  const base = "inline-flex items-center gap-1.5 font-semibold rounded-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";
  const sizes = { sm:"px-3 py-1.5 text-xs", md:"px-4 py-2 text-sm", lg:"px-5 py-2.5 text-sm" };
  const vars = {
    primary:  "bg-red-600 hover:bg-red-500 text-white",
    secondary:"bg-slate-700 hover:bg-slate-600 text-slate-100",
    danger:   "bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30",
    success:  "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30",
    ghost:    "hover:bg-slate-700 text-slate-400 hover:text-slate-100",
    blue:     "bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30",
    warning:  "bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30",
  };
  return <button type={type} onClick={onClick} disabled={disabled} className={""+(base)+" "+(sizes[size])+" "+(vars[variant])+" "+(className)+""}>{children}</button>;
};
const Input = ({ label, ...p }) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-xs text-slate-400 font-medium">{label}</label>}
    <input {...p} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 w-full" />
  </div>
);
const Sel = ({ label, children, ...p }) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-xs text-slate-400 font-medium">{label}</label>}
    <select {...p} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500 w-full">{children}</select>
  </div>
);
const TA = ({ label, ...p }) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-xs text-slate-400 font-medium">{label}</label>}
    <textarea {...p} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 w-full resize-none" />
  </div>
);
const Modal = ({ title, onClose, children, wide=false }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
    <div onClick={e=>e.stopPropagation()} className={"bg-slate-800 border border-slate-700 rounded-2xl w-full "+(wide?"max-w-3xl":"max-w-lg")+" max-h-[90vh] overflow-y-auto"}>
      <div className="flex items-center justify-between p-5 border-b border-slate-700">
        <h2 className="text-base font-bold text-slate-100">{title}</h2>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400"><X size={16}/></button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
);
const KpiCard = ({ label, value, sub, icon:Icon, color="#DC1426", compact }) => (
  <Card className={compact ? "p-3" : "p-5"}>
    <div className="flex items-center justify-between gap-2">
      <div className="flex-1 min-w-0">
        <p className={"text-slate-400 font-medium uppercase tracking-wider "+(compact?"text-xs mb-0.5":"text-xs mb-1")+""}>{label}</p>
        <p className={"font-bold text-slate-100 leading-tight "+(compact?"text-lg":"text-3xl")+""}>{value}</p>
        {sub && <p className={compact?"text-xs mt-0.5":"text-xs mt-1.5"} style={{color}}>{sub}</p>}
      </div>
      <div className={"flex-shrink-0 rounded-xl flex items-center justify-center shadow "+(compact?"w-8 h-8 rounded-lg":"w-12 h-12 rounded-2xl")+""}
        style={{background:"linear-gradient(135deg, "+(color)+"30 0%, "+(color)+"15 100%)", border:"1px solid "+(color)+"35"}}>
        <Icon size={compact?16:24} style={{color}}/>
      </div>
    </div>
    <div className={compact?"mt-2 h-0.5 rounded-full":"mt-4 h-0.5 rounded-full"} style={{background:"linear-gradient(90deg, "+(color)+"60, transparent)"}}/>
  </Card>
);

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const userHasFinancial  = u => u.role === "director" || u.role === "auditor" || u.financialAccess === true;
const userHasFechamento = u => u.role === "director" || u.fechamentoAccess === true;
const userHasDRE        = u => u.role === "director" || u.dreAccess === true;
const userAreaIds = u => u.areaIds || [];
const userCanSeeTask = (u, task, templates) => {
  if (u.role === "director" || u.role === "auditor") return true;
  if (task.openedBy === u.id) return true;  // sempre vê o que abriu

  const tpl = templates.find(t => t.id === task.templateId);
  if (!tpl) return false;
  const uAreas = userAreaIds(u);

  const curStep = tpl.steps[task.currentStepIndex];

  // Etapa atual designada diretamente a este usuário
  const assignedToMeNow = curStep?.assigneeUserId === u.id;
  if (assignedToMeNow) return true;

  // Etapa atual pertence à área deste usuário
  const curStepMyArea = curStep?.areaId && uAreas.includes(curStep.areaId);
  if (curStepMyArea) return true;

  // Gestor de área: também vê se QUALQUER etapa futura/passada é da sua área
  // (para acompanhamento do fluxo inteiro)
  if (u.role === "area_manager") {
    const hasAreaStep = tpl.steps.some(s => s.areaId && uAreas.includes(s.areaId));
    if (hasAreaStep) return true;
    // Ou se qualquer etapa foi designada a ele
    if (tpl.steps.some(s => s.assigneeUserId === u.id)) return true;
  }

  return false;
};
const userCanSeeTemplate = (u, tpl) => {
  if (u.role === "director" || u.role === "auditor") return true;
  if (!tpl.areaIds || tpl.areaIds.length === 0) return true;
  const uAreas = userAreaIds(u);
  return tpl.areaIds.some(a => uAreas.includes(a));
};

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
function LoginScreen({ users, onLogin, children }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const handle = () => {
    const u = users.find(u => u.email===email && u.password===pass);
    u ? onLogin(u) : setErr("E-mail ou senha incorretos");
  };
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6" style={{fontFamily:"'IBM Plex Sans',sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');`}</style>
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <img src="data:image/webp;base64,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" alt="Grupo All Logística" className="h-16 w-auto mx-auto mb-4"/>
          <p className="text-slate-400 text-sm">Sistema de Gestão Operacional</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-300">Entrar</h3>
            <Input label="E-mail" type="email" placeholder="seu@email.com" value={email} onChange={e=>setEmail(e.target.value)} />
            <Input label="Senha" type="password" placeholder="••••••" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()} />
            {err && <p className="text-red-400 text-xs">{err}</p>}
            <Btn onClick={handle} className="w-full justify-center">Entrar</Btn>
            {children}
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────
const NAV = [
  { id:"dashboard",     label:"Dashboard",      icon:LayoutDashboard, roles:["director","area_manager","operator","auditor"], financial:false },
  { id:"tasks",         label:"Tarefas",         icon:ClipboardList,   roles:["director","area_manager","operator","auditor"], financial:false },
  { id:"atendimento",   label:"Atendimento",     icon:MessageSquare,   roles:["director","area_manager","operator","auditor"],  financial:false },
  { id:"fechamento",    label:"Fechamento",      icon:Truck,           roles:["director","area_manager","operator","auditor"],  financial:false, fechamento:true },
  { id:"mob",           label:"Mão de Obra",     icon:Users,           roles:["director","area_manager","auditor"],              financial:false },
  { id:"pagamentos",    label:"Pagamentos",      icon:CreditCard,      roles:["director","area_manager","auditor"],              financial:true  },
  { id:"admin",         label:"Administração",   icon:Settings,        roles:["director"],                                       financial:false },
];
function Sidebar({ user, view, setView, onLogout, areas, setUsers, users, tasks }) {
  const area = areas.filter(a => userAreaIds(user).includes(a.id)).map(a=>a.name).join(", ");
  const hasF = userHasFinancial(user);
  const [showPwd, setShowPwd] = useState(false);
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [pwdErr, setPwdErr] = useState("");

  const changePwd = () => {
    if (user.password !== oldPwd) { setPwdErr("Senha atual incorreta"); return; }
    if (newPwd.length < 4) { setPwdErr("Nova senha deve ter ao menos 4 caracteres"); return; }
    setUsers(p => p.map(u => u.id === user.id ? {...u, password: newPwd} : u));
    setShowPwd(false); setOldPwd(""); setNewPwd(""); setPwdErr("");
    alert("Senha alterada com sucesso!");
  };

  // Emergency WhatsApp: open wa.me for users with pending tasks
  const sendEmergency = () => {
    const pending = tasks.filter(t => t.status === "awaiting_approval" || t.status === "in_progress");
    const usersToNotify = users.filter(u => {
      if (u.role === "auditor") return false;
      return pending.some(t => {
        const tpl = null; // simplified - notify all active users
        return true;
      });
    });
    const siteUrl = window.location.href.split("#")[0];
    const msg = encodeURIComponent("🚨 AÇÃO URGENTE NECESSÁRIA no sistema Grupo All Logística!\n\nHá tarefas aguardando sua ação. Acesse agora:\n"+(siteUrl)+"\n\nEquipe Grupo All");
    let sent = 0;
    users.filter(u => u.phone && u.role !== "auditor" && u.id !== user.id).forEach(u => {
      const phone = u.phone.replace(/\D/g,"");
      const fullPhone = phone.startsWith("55") ? phone : "55" + phone;
      window.open("https://wa.me/"+(fullPhone)+"?text="+(msg)+"", "_blank");
      sent++;
    });
    if (sent === 0) alert("Nenhum usuário com WhatsApp cadastrado. Adicione o telefone dos usuários em Administração → Usuários.");
    else alert("✅ WhatsApp aberto para "+(sent)+" usuário(s). Confirme o envio em cada aba.");
  };

  return (
    <div className="w-56 bg-slate-950 border-r border-slate-800 flex flex-col flex-shrink-0">
      {/* Change password modal */}
      {showPwd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={()=>setShowPwd(false)}>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm space-y-4 mx-4" onClick={e=>e.stopPropagation()}>
            <h3 className="text-base font-bold text-slate-100">Alterar Senha</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Senha atual</label>
                <input type="password" value={oldPwd} onChange={e=>{setOldPwd(e.target.value);setPwdErr("");}}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-red-500"/>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Nova senha</label>
                <input type="password" value={newPwd} onChange={e=>{setNewPwd(e.target.value);setPwdErr("");}}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-red-500"/>
              </div>
              {pwdErr && <p className="text-xs text-red-400">{pwdErr}</p>}
            </div>
            <div className="flex gap-3">
              <button onClick={changePwd} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold">Salvar</button>
              <button onClick={()=>{setShowPwd(false);setOldPwd("");setNewPwd("");setPwdErr("");}} className="flex-1 py-2.5 rounded-xl bg-slate-700 text-slate-200 text-sm font-semibold">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 border-b border-slate-800">
        <div className="py-1">
          <img src="data:image/webp;base64,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" alt="Grupo All Logística" className="h-8 w-auto"/>
          <p className="text-xs text-slate-600 mt-1">Gestão Operacional</p>
        </div>
      </div>
            <nav className="flex-1 p-3 space-y-1">
        {NAV.filter(n=>n.roles.includes(user.role) && (!n.financial || hasF) && (!n.fechamento || userHasFechamento(user))).map(n=>{
          const Icon=n.icon; const active=view===n.id;
          return (
            <button key={n.id} onClick={()=>setView(n.id)} className={"flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all w-full text-left "+(active?"bg-amber-500/10 text-amber-400 border border-amber-500/20":"text-slate-400 hover:text-slate-100 hover:bg-slate-800")+""}>
              <Icon size={16}/>{n.label}
            </button>
          );
        })}
      </nav>
      <div className="p-3 border-t border-slate-800 space-y-1">
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-amber-400">{user.name[0]}</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">{user.name}</p>
            <p className="text-xs text-slate-500 truncate">{area || ROLE_LABELS[user.role]}</p>
          </div>
        </div>
        <button onClick={()=>setShowPwd(true)} className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-all">
          <Lock size={13}/><span>Alterar Senha</span>
        </button>
        {user.role !== "auditor" && (
          <button onClick={sendEmergency}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-bold text-red-400 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/40 transition-all">
            <span className="text-base leading-none">🚨</span><span>EMERGÊNCIA — WhatsApp</span>
          </button>
        )}
        <button onClick={onLogout} className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-red-400 hover:bg-red-400/5 transition-all">
          <LogOut size={14}/><span>Sair</span>
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// OPERATOR / RESTRICTED DASHBOARD
// ─────────────────────────────────────────────
function TaskTrackingDashboard({ user, tasks, templates, clients, areas, setView, onOpenTask }) {
  const visible = tasks.filter(t => userCanSeeTask(user, t, templates));
  const active = visible.filter(t => !["completed","rejected","cancelled"].includes(t.status));
  const done   = visible.filter(t => t.status==="completed");
  const rejected = visible.filter(t => t.status==="rejected");

  const TaskCard = ({ task }) => {
    const tpl = templates.find(t=>t.id===task.templateId);
    if (!tpl) return null;
    const isTerminal = ["completed","rejected","cancelled"].includes(task.status);
    return (
      <div onClick={()=>{ setView("tasks"); onOpenTask(task.id); }} style={{cursor:"pointer"}}
        className={"bg-slate-800 border rounded-xl p-5 hover:border-red-500/40 group transition-all "+(task.status==="awaiting_approval"?"border-amber-500/30":"border-slate-700")+""}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge color={STATUS_COLORS[task.status]}>{STATUS_LABELS[task.status]}</Badge>
              {task.status==="awaiting_approval"&&<span className="text-xs text-amber-400 font-semibold animate-pulse">● Aguardando</span>}
            </div>
            <p className="text-sm font-bold text-slate-100">{task.title}</p>
            <p className="text-xs text-slate-500 mt-0.5">{task.templateName} · {fmtDate(task.openedAt)}</p>
          </div>
          <span className="text-xs text-amber-400 opacity-0 group-hover:opacity-100 transition-all font-semibold whitespace-nowrap">Ver →</span>
        </div>
        {/* Step bar */}
        <div className="overflow-hidden">
          <div className="relative px-4">
            <div className="absolute left-8 right-8 top-4 h-0.5 bg-slate-700" style={{zIndex:0}}>
              <div className="h-full bg-slate-500 transition-all" style={{width:""+((task.stepStatuses.filter(s=>s.status==="completed").length/Math.max(tpl.steps.length-1,1))*100)+"%"}}/>
            </div>
            <div className="relative flex items-start justify-between" style={{zIndex:1}}>
            {tpl.steps.map((step,i)=>{
              const ss=task.stepStatuses[i];
              const st=ss?.status||"pending";
              const isCur=i===task.currentStepIndex&&!isTerminal;
              const bg=st==="completed"?"#10b981":st==="rejected"?"#ef4444":isCur?"#f59e0b":"#1e293b";
              const border=isCur?"#f59e0b":"#334155";
              const tc=st==="completed"||st==="rejected"||isCur?"#0f172a":"#64748b";
              return (
                <div key={step.id} className="flex flex-col items-center gap-1.5" style={{flex:1}}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all text-xs font-bold"
                    style={{background:bg,borderColor:border,color:isCur?"#0f172a":"#fff",boxShadow:isCur?"0 0 0 3px "+(bg)+"30":"none"}}>
                    {st==="completed"?<Check size={12}/>:st==="rejected"?<X size={12}/>:i+1}
                  </div>
                  <p className={"text-xs font-medium text-center leading-tight px-1 "+(isCur?"text-amber-400":st==="completed"?"text-emerald-400":"text-slate-500")+""}>{step.name}</p>
                  {step.slaDays&&<p className="text-xs text-blue-400/60">⏱{step.slaDays}d</p>}
                  {ss?.slaOverdue&&!isCur&&ss.status==="pending"&&<p className="text-xs text-red-400 font-bold">⚠ SLA</p>}
                  {isCur&&ss?.slaOverdue&&<p className="text-xs text-red-400 animate-pulse font-bold">⚠ SLA</p>}
                  {isCur&&ss?.slaEscalado&&<p className="text-xs text-orange-400 font-bold">📢 Escalado</p>}
                </div>
              );
            })}
            </div>
          </div>
        </div>
            {!isTerminal&&tpl.steps[task.currentStepIndex]&&(
              <div className="mt-4 pt-3 border-t border-slate-700 text-xs text-slate-400">
                <span className="text-amber-400 font-semibold">Atual: </span>{tpl.steps[task.currentStepIndex].name}
                {tpl.steps[task.currentStepIndex].slaDays&&(()=>{
                  const slaDias = Number(tpl.steps[task.currentStepIndex].slaDays);
                  const ss = task.stepStatuses[task.currentStepIndex];
                  if (!ss?.startedAt) return <span className="text-blue-400 ml-2">⏱ SLA: {slaDias}d úteis</span>;
                  // Recalc dias uteis passed
                  const FERIADOS = new Set(["01/01","21/04","01/05","07/09","12/10","02/11","15/11","25/12"]);
                  const isFer = d => { const s=String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0'); return FERIADOS.has(s); };
                  const cur2 = new Date(ss.startedAt); cur2.setDate(cur2.getDate()+1); cur2.setHours(0,0,0,0);
                  const end2 = new Date(); end2.setHours(0,0,0,0);
                  let passed = 0;
                  const tmp = new Date(cur2);
                  while(tmp<=end2){const d=tmp.getDay();if(d!==0&&d!==6&&!isFer(tmp))passed++;tmp.setDate(tmp.getDate()+1);}
                  const restantes = slaDias - passed;
                  if (ss.slaOverdue || restantes < 0) return <span className="text-red-400 font-bold ml-2">⚠ SLA: {Math.abs(restantes)}d úteis atrasado</span>;
                  if (restantes === 0) return <span className="text-orange-400 font-bold ml-2">⏱ SLA: vence hoje</span>;
                  if (restantes <= 1) return <span className="text-orange-400 font-semibold ml-2">⏱ SLA: {restantes}d útil restante</span>;
                  return <span className="text-blue-400 ml-2">⏱ SLA: {restantes}/{slaDias}d úteis restantes</span>;
                })()}
                {task.stepStatuses[task.currentStepIndex]?.slaEscalado&&(
                  <span className="text-orange-400 font-bold ml-2">📢 Escalado para {task.stepStatuses[task.currentStepIndex].slaAcaoTipo==="escalar_diretor"?"Diretor":"Gestor"}</span>
                )}
                {tpl.steps[task.currentStepIndex].slaAcao==="auto_aprovar"&&!task.stepStatuses[task.currentStepIndex]?.slaOverdue&&tpl.steps[task.currentStepIndex].slaDays&&(
                  <span className="text-amber-400/60 ml-2">· auto-aprova se sem ação</span>
                )}
                {tpl.steps[task.currentStepIndex].requiresApproval&&(
                  <span className="text-slate-500"> · aprovação de {tpl.steps[task.currentStepIndex].approverRole==="director"?"Diretor":"Gestor de Área"}</span>
                )}
              </div>
            )}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-xl font-bold text-slate-100">Painel de Acompanhamento</h1>
        <p className="text-sm text-slate-400">{visible.length} tarefa(s) visíveis para você</p></div>
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2">
          <span className="w-2 h-2 rounded-full bg-blue-400"/><span className="text-sm font-semibold text-blue-300">{active.length} em andamento</span>
        </div>
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"/><span className="text-sm font-semibold text-amber-300">{active.filter(t=>t.status==="awaiting_approval").length} aguardando aprovação</span>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"/><span className="text-sm font-semibold text-emerald-300">{done.length} concluídas</span>
        </div>
      </div>
      {active.length>0&&<div className="space-y-3"><h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Em Andamento</h2>{active.map(t=><TaskCard key={t.id} task={t}/>)}</div>}
      {done.length>0&&<div className="space-y-3"><h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Concluídas</h2>{done.map(t=><TaskCard key={t.id} task={t}/>)}</div>}
      {rejected.length>0&&<div className="space-y-3"><h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Rejeitadas</h2>{rejected.map(t=><TaskCard key={t.id} task={t}/>)}</div>}
      {visible.length===0&&(
        <div className="text-center py-20"><ClipboardList size={40} className="text-slate-700 mx-auto mb-3"/>
          <p className="text-slate-500 text-sm">Nenhuma tarefa ainda.</p>
          <Btn className="mt-4" onClick={()=>setView("tasks")}><Plus size={14}/>Abrir Tarefa</Btn>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// FINANCIAL DASHBOARD
// ─────────────────────────────────────────────
function FinancialDashboard({ tasks, fixedCosts, costEntries, revenues, clients, setView }) {
  const curMonth=4; const curYear=2025;
  const totalRev = revenues.filter(r=>r.month===curMonth&&r.year===curYear).reduce((s,r)=>s+r.value,0);
  const totalFixed = fixedCosts.filter(f=>f.active).reduce((s,f)=>s+f.value,0);
  const totalVar = costEntries.filter(c=>c.month===curMonth&&c.year===curYear).reduce((s,c)=>s+c.value,0);
  const taskCosts = tasks.reduce((s,t)=>s+t.costRationals.reduce((a,c)=>a+c.value,0),0);
  const totalCost = totalFixed+totalVar;
  const margin = totalRev>0?((totalRev-totalCost)/totalRev*100):0;
  const pending = tasks.filter(t=>t.status==="awaiting_approval").length;

  const trend = [2,3,4].map(m=>{
    const rev=revenues.filter(r=>r.month===m&&r.year===curYear).reduce((s,r)=>s+r.value,0);
    const fc=fixedCosts.filter(f=>f.active).reduce((s,f)=>s+f.value,0);
    const vc=costEntries.filter(c=>c.month===m&&c.year===curYear).reduce((s,c)=>s+c.value,0);
    return {mes:MONTHS_SHORT[m-1],receita:rev/1000,custo:(fc+vc)/1000,lucro:(rev-fc-vc)/1000};
  });
  const byClient = clients.map(cl=>{
    const rev=revenues.filter(r=>r.clientId===cl.id&&r.month===curMonth&&r.year===curYear).reduce((s,r)=>s+r.value,0);
    const fc=fixedCosts.filter(f=>f.active).reduce((s,f)=>{const a=f.clientAllocation.find(a=>a.clientId===cl.id);return s+(a?f.value*a.percent/100:0);},0);
    const vc=costEntries.filter(c=>c.month===curMonth&&c.year===curYear).reduce((s,c)=>{const a=c.clientAllocation.find(a=>a.clientId===cl.id);return s+(a?c.value*a.percent/100:0);},0);
    const tc=tasks.reduce((s,t)=>s+t.costRationals.reduce((a,cr)=>{const al=t.clientAllocation.find(a=>a.clientId===cl.id);return a+(al?cr.value*al.percent/100:0);},0),0);
    const cost=fc+vc+tc; const profit=rev-cost;
    return {name:cl.code,revenue:rev,cost,profit};
  });

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-xl font-bold text-slate-100">Dashboard</h1>
        <p className="text-sm text-slate-400">{MONTHS_SHORT[curMonth-1]} {curYear}</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Comissão Total" value={fmt(totalRev)} sub="mês corrente" icon={Wallet} color="#10b981"/>
        <KpiCard label="Custo Total" value={fmt(totalCost)} sub={"fixo: "+(fmt(totalFixed))+""} icon={DollarSign} color="#ef4444"/>
        <KpiCard label="Margem" value={""+(margin.toFixed(1))+"%"} sub={fmt(totalRev-totalCost)} icon={TrendingUp} color={margin>20?"#10b981":"#f59e0b"}/>
        <KpiCard label="Tarefas Pendentes" value={pending} sub="aguardando aprovação" icon={ClipboardList} color="#60a5fa"/>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="text-sm font-bold text-slate-300 mb-4">Evolução Mensal (R$ mil)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
              <XAxis dataKey="mes" stroke="#64748b" tick={{fill:"#94a3b8",fontSize:11}}/>
              <YAxis stroke="#64748b" tick={{fill:"#94a3b8",fontSize:11}}/>
              <Tooltip contentStyle={{background:"#1e293b",border:"1px solid #334155",borderRadius:8,color:"#f1f5f9"}}/>
              <Legend wrapperStyle={{fontSize:11,color:"#94a3b8"}}/>
              <Line type="monotone" dataKey="receita" stroke="#10b981" strokeWidth={2} name="Receita"/>
              <Line type="monotone" dataKey="custo"   stroke="#ef4444" strokeWidth={2} name="Custo"/>
              <Line type="monotone" dataKey="lucro"   stroke="#f59e0b" strokeWidth={2} name="Lucro"/>
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-5">
          <h3 className="text-sm font-bold text-slate-300 mb-4">Por Cliente — Abril</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byClient} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
              <XAxis dataKey="name" stroke="#64748b" tick={{fill:"#94a3b8",fontSize:11}}/>
              <YAxis stroke="#64748b" tick={{fill:"#94a3b8",fontSize:11}} tickFormatter={v=>""+((v/1000).toFixed(0))+"k"}/>
              <Tooltip contentStyle={{background:"#1e293b",border:"1px solid #334155",borderRadius:8}} formatter={v=>fmt(v)}/>
              <Legend wrapperStyle={{fontSize:11,color:"#94a3b8"}}/>
              <Bar dataKey="revenue" name="Receita" fill="#10b981" radius={[4,4,0,0]}/>
              <Bar dataKey="cost"    name="Custo"   fill="#ef4444" radius={[4,4,0,0]}/>
              <Bar dataKey="profit"  name="Lucro"   fill="#f59e0b" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
      {pending>0&&(
        <Card className="p-4 border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle size={18} className="text-amber-400"/>
              <p className="text-sm font-semibold text-amber-300">{pending} tarefa(s) aguardando aprovação</p>
            </div>
            <Btn onClick={()=>setView("tasks")} size="sm">Ver Tarefas <ChevronRight size={14}/></Btn>
          </div>
        </Card>
      )}
    </div>
  );
}

function DashboardView({ user, tasks, fixedCosts, costEntries, revenues, clients, templates, areas, setView, onOpenTask }) {
  if (!userHasFinancial(user)) {
    return <TaskTrackingDashboard user={user} tasks={tasks} templates={templates} clients={clients} areas={areas} setView={setView} onOpenTask={onOpenTask}/>;
  }
  if (user.role === "operator") {
    return <TaskTrackingDashboard user={user} tasks={tasks} templates={templates} clients={clients} areas={areas} setView={setView} onOpenTask={onOpenTask}/>;
  }
  return <FinancialDashboard tasks={tasks} fixedCosts={fixedCosts} costEntries={costEntries} revenues={revenues} clients={clients} setView={setView}/>;
}

// ─────────────────────────────────────────────
// ATTACHMENT HELPER
// ─────────────────────────────────────────────
function readFileAsBase64(file) {
  return new Promise((res,rej)=>{
    const r=new FileReader();
    r.onload=()=>res(r.result);
    r.onerror=rej;
    r.readAsDataURL(file);
  });
}
function AttachmentList({ attachments, onRemove }) {
  if (!attachments||attachments.length===0) return null;
  return (
    <div className="space-y-1 mt-2">
      {attachments.map(a=>(
        <div key={a.id} className="flex items-center gap-2 bg-slate-900 rounded-lg px-3 py-2 border border-slate-700">
          {a.type.startsWith("image/")?<Image size={13} className="text-blue-400"/>:<Paperclip size={13} className="text-slate-400"/>}
          <span className="text-xs text-slate-300 flex-1 truncate">{a.name}</span>
          {a.type.startsWith("image/")&&<a href={a.data} target="_blank" rel="noreferrer" className="text-xs text-amber-400 hover:underline">Ver</a>}
          {onRemove&&<button onClick={()=>onRemove(a.id)} className="text-slate-600 hover:text-red-400"><X size={12}/></button>}
        </div>
      ))}
    </div>
  );
}
function AttachmentUpload({ onAdd }) {
  const ref=useRef();
  const handle=async(e)=>{
    const files=Array.from(e.target.files||[]);
    for(const f of files){
      if(f.size>5*1024*1024){alert("Arquivo muito grande (máx 5MB)");continue;}
      const data=await readFileAsBase64(f);
      onAdd({id:uid(),name:f.name,type:f.type,size:f.size,data});
    }
    e.target.value="";
  };
  return (
    <div>
      <input ref={ref} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" className="hidden" onChange={handle}/>
      <button type="button" onClick={()=>ref.current.click()} className="flex items-center gap-2 text-xs text-amber-400 hover:text-amber-300 border border-dashed border-amber-500/30 hover:border-amber-500/60 rounded-lg px-3 py-2 transition-all">
        <Upload size={13}/> Anexar arquivo ou imagem
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// ALLOC EDITOR (reused)
// ─────────────────────────────────────────────
function AllocEditor({ allocation, setAllocation, clients }) {
  const total = allocation.reduce((s,a)=>s+Number(a.percent),0);
  const add=()=>setAllocation(p=>[...p,{clientId:"",percent:0}]);
  const remove=i=>setAllocation(p=>p.filter((_,idx)=>idx!==i));
  const upd=(i,k,v)=>setAllocation(p=>p.map((a,idx)=>idx===i?{...a,[k]:v}:a));

  // Rateio proporcional — divide 100% igualmente entre todos os clientes ativos
  const rateioTodos = () => {
    const ativos = clients.filter(c=>c.active);
    if (!ativos.length) return;
    const base = Math.floor(100 / ativos.length);
    const resto = 100 - base * ativos.length;
    setAllocation(ativos.map((c,i) => ({ clientId: c.id, percent: base + (i === 0 ? resto : 0) })));
  };

  // Rateio proporcional apenas entre os já selecionados
  const rateioSelecionados = () => {
    const validos = allocation.filter(a => a.clientId);
    if (!validos.length) return;
    const base = Math.floor(100 / validos.length);
    const resto = 100 - base * validos.length;
    setAllocation(validos.map((a,i) => ({ ...a, percent: base + (i === 0 ? resto : 0) })));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <label className="text-xs text-slate-400 font-medium">
          Rateio de Clientes <span className={total===100?"text-emerald-400":"text-amber-400"}>({total}%)</span>
        </label>
        <div className="flex gap-1.5 flex-wrap">
          <button type="button" onClick={rateioSelecionados}
            className="text-xs text-blue-400 hover:text-blue-300 border border-blue-500/30 rounded px-2 py-0.5 hover:bg-blue-500/10 transition-all">
            ⚖ Equalizar selecionados
          </button>
          <button type="button" onClick={rateioTodos}
            className="text-xs text-amber-400 hover:text-amber-300 border border-amber-500/30 rounded px-2 py-0.5 hover:bg-amber-500/10 transition-all">
            ⚖ Todos igualmente
          </button>
          <button type="button" onClick={add} className="text-xs text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 rounded px-2 py-0.5 hover:bg-emerald-500/10 transition-all">
            + Adicionar
          </button>
        </div>
      </div>
      {allocation.map((a,i)=>(
        <div key={i} className="flex gap-2 mb-2 items-end">
          <div className="flex-1"><Sel value={a.clientId} onChange={e=>upd(i,"clientId",e.target.value)}>
            <option value="">Cliente...</option>
            {clients.filter(c=>c.active).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </Sel></div>
          <div className="w-20"><Input type="number" min="0" max="100" value={a.percent} onChange={e=>upd(i,"percent",Number(e.target.value))}/></div>
          <span className="text-slate-500 text-sm pb-2">%</span>
          {allocation.length>1&&<button type="button" onClick={()=>remove(i)} className="pb-2 text-red-400"><X size={14}/></button>}
        </div>
      ))}
      {total!==100&&<p className="text-amber-400 text-xs">⚠ Total deve ser 100% (atual: {total}%)</p>}
    </div>
  );
}

// ─────────────────────────────────────────────
// NEW / EDIT TASK MODAL
// ─────────────────────────────────────────────
function TaskFormModal({ user, templates, clients, existing, onClose, onSave }) {
  const isEdit = !!existing;
  const visibleTemplates = templates.filter(t=>userCanSeeTemplate(user,t));

  const [templateId, setTemplateId] = useState(existing?.templateId||"");
  const [title, setTitle] = useState(existing?.title||"");
  const [description, setDescription] = useState(existing?.description||"");
  const [allocation, setAllocation] = useState(existing?.clientAllocation||[{clientId:"",percent:100}]);
  const [costRationals, setCostRationals] = useState(existing?.costRationals||[]);
  const [attachments, setAttachments] = useState(existing?.attachments||[]);
  const [paramValues, setParamValues] = useState({});

  const tpl = templates.find(t=>t.id===templateId);
  const totalPct = allocation.reduce((s,a)=>s+Number(a.percent),0);

  const addCost=()=>setCostRationals(p=>[...p,{id:uid(),description:"",value:0,category:"Operacional"}]);
  const removeCost=id=>setCostRationals(p=>p.filter(c=>c.id!==id));
  const updCost=(id,k,v)=>setCostRationals(p=>p.map(c=>c.id===id?{...c,[k]:v}:c));
  const removeAttach=id=>setAttachments(p=>p.filter(a=>a.id!==id));

  const calcParam=(cp,val)=>{
    const base=parseFloat(val)||0;
    return Math.round(base*cp.multiplier*100)/100;
  };

  const handleParamChange=(cpId,val)=>{
    setParamValues(p=>({...p,[cpId]:val}));
    const cp=tpl?.costParams.find(c=>c.id===cpId);
    if(!cp) return;
    const result=calcParam(cp,val);
    setCostRationals(prev=>{
      const exists=prev.find(c=>c._paramId===cpId);
      if(exists) return prev.map(c=>c._paramId===cpId?{...c,value:result,description:cp.name}:c);
      return [...prev,{id:uid(),_paramId:cpId,description:cp.name,value:result,category:"Operacional"}];
    });
  };

  const handleSave=()=>{
    if(!templateId||!title||totalPct!==100) return;
    if(isEdit){
      onSave({...existing,title,description,clientAllocation:allocation.filter(a=>a.clientId),costRationals,attachments});
    } else {
      onSave({
        id:uid(), templateId, templateName:tpl.name,
        title, description, status:"open",
        openedBy:user.id, openedAt:now(), currentStepIndex:0,
        clientAllocation:allocation.filter(a=>a.clientId),
        costRationals,
        attachments,
        stepStatuses:tpl.steps.map(s=>({stepId:s.id,status:"pending",actorId:null,actedAt:null,comment:null})),
        comments:[],
      });
    }
  };

  return (
    <Modal title={isEdit?"Editar Tarefa":"Abrir Nova Tarefa"} onClose={onClose} wide>
      <div className="space-y-5">
        {!isEdit&&(
          <Sel label="Tipo de Tarefa (Fluxo)" value={templateId} onChange={e=>setTemplateId(e.target.value)}>
            <option value="">Selecione um fluxo...</option>
            {visibleTemplates.map(t=><option key={t.id} value={t.id}>{t.name} — {t.category}</option>)}
          </Sel>
        )}
        {isEdit&&<div className="bg-slate-900 rounded-lg p-3 border border-slate-700"><p className="text-xs text-slate-400">Fluxo</p><p className="text-sm font-semibold text-slate-200">{existing.templateName}</p></div>}

        {tpl&&!isEdit&&(
          <div className="bg-slate-900 rounded-lg p-3 border border-slate-700">
            <p className="text-xs text-slate-400 mb-2">Etapas</p>
            <div className="flex items-center gap-1 flex-wrap">
              {tpl.steps.map((s,i)=>(
                <div key={s.id} className="flex items-center gap-1">
                  <span className={"text-xs px-2 py-1 rounded "+(s.requiresApproval?"bg-amber-500/10 text-amber-400 border border-amber-500/20":"bg-slate-700 text-slate-300")+""}>{s.name}</span>
                  {i<tpl.steps.length-1&&<ChevronRight size={10} className="text-slate-600"/>}
                </div>
              ))}
            </div>
          </div>
        )}

        <Input label="Título *" placeholder="Descreva brevemente a solicitação" value={title} onChange={e=>setTitle(e.target.value)}/>
        <TA label="Descrição / Justificativa" placeholder="Detalhe o motivo e contexto..." rows={3} value={description} onChange={e=>setDescription(e.target.value)}/>

        <AllocEditor allocation={allocation} setAllocation={setAllocation} clients={clients}/>

        {/* Pre-mapped cost params from template */}
        {tpl?.costParams?.length>0&&!isEdit&&(
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 font-medium">Custos Pré-mapeados do Fluxo</label>
              <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded px-2 py-0.5">calculados automaticamente</span>
            </div>
            {tpl.costParams.map(cp=>{
              const val=paramValues[cp.id]||"";
              const result=calcParam(cp,val);
              return (
                <div key={cp.id} className="bg-slate-900 rounded-lg p-3 border border-slate-700">
                  <p className="text-xs font-semibold text-slate-200 mb-1">{cp.name}</p>
                  <p className="text-xs text-slate-500 mb-2">{cp.multiplierLabel}</p>
                  <div className="flex gap-3 items-end">
                    <div className="flex-1"><Input label={cp.inputLabel} type="number" placeholder="0" value={val} onChange={e=>handleParamChange(cp.id,e.target.value)}/></div>
                    {val&&<div className="text-right pb-1"><p className="text-xs text-slate-400">Resultado</p><p className="text-base font-bold text-amber-400">{fmt(result)}</p></div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Manual cost rationals */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-slate-400 font-medium">Custos Adicionais (manual)</label>
            <button type="button" onClick={addCost} className="text-xs text-amber-400 hover:text-amber-300">+ Adicionar</button>
          </div>
          {costRationals.filter(c=>!c._paramId).map(c=>(
            <div key={c.id} className="flex gap-2 mb-2 items-end">
              <div className="flex-1"><Input placeholder="Descrição" value={c.description} onChange={e=>updCost(c.id,"description",e.target.value)}/></div>
              <div className="w-32"><Input type="number" placeholder="R$" value={c.value||""} onChange={e=>updCost(c.id,"value",Number(e.target.value))}/></div>
              <button type="button" onClick={()=>removeCost(c.id)} className="pb-2 text-red-400"><X size={14}/></button>
            </div>
          ))}
          {costRationals.filter(c=>c._paramId).length>0&&(
            <div className="mt-2 bg-slate-900/50 rounded-lg p-2 border border-slate-700">
              <p className="text-xs text-slate-500 mb-1">Custos do fluxo (calculados):</p>
              {costRationals.filter(c=>c._paramId).map(c=>(
                <div key={c.id} className="flex justify-between text-xs py-0.5">
                  <span className="text-slate-400">{c.description}</span>
                  <span className="text-amber-400 font-semibold">{fmt(c.value)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attachments */}
        <div>
          <label className="text-xs text-slate-400 font-medium block mb-2">Anexos</label>
          <AttachmentUpload onAdd={a=>setAttachments(p=>[...p,a])}/>
          <AttachmentList attachments={attachments} onRemove={removeAttach}/>
        </div>

        <div className="flex gap-2 pt-2">
          <Btn onClick={handleSave} disabled={!templateId||!title||totalPct!==100} className="flex-1 justify-center">
            {isEdit?"Salvar Alterações":"Abrir Tarefa"}
          </Btn>
          <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
        </div>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// TASKS VIEW
// ─────────────────────────────────────────────
function TasksView({ user, tasks, setTasks, templates, setTemplates, clients, areas, users, initialOpenId, onClearOpenId }) {
  const [selectedId, setSelectedId] = useState(initialOpenId||null);
  const [showNew, setShowNew] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(()=>{ if(initialOpenId){setSelectedId(initialOpenId);onClearOpenId&&onClearOpenId();}}, [initialOpenId]);

  const [showProposeFlow, setShowProposeFlow] = useState(false);
  const visible = tasks.filter(t => userCanSeeTask(user, t, templates));
  const visibleTemplates = templates.filter(t => userCanSeeTemplate(user,t) && t.status !== "pending_approval");
  const pendingFlows = user.role==="director" ? templates.filter(t=>t.status==="pending_approval") : [];
  const selectedTask = selectedId ? tasks.find(t=>t.id===selectedId) : null;

  const filtered = visible.filter(t=>{
    // Search filter — match by code (#XXXXXX) or title
    if (search.trim()) {
      const q = search.trim().replace(/^#/,"").toLowerCase();
      const code = t.id.slice(-6).toLowerCase();
      const title = t.title.toLowerCase();
      if (!code.includes(q) && !title.includes(q)) return false;
    }
    if(filter==="all") return true;
    if(filter==="mine") return t.openedBy===user.id;
    if(filter==="pending") return t.status==="awaiting_approval";
    return t.status===filter;
  });

  // If search finds exactly one task by code, auto-open it
  useEffect(() => {
    if (!search.trim()) return;
    const q = search.trim().replace(/^#/,"").toLowerCase();
    const exact = visible.find(t => t.id.slice(-6).toLowerCase() === q);
    if (exact) { setSelectedId(exact.id); setSearch(""); }
  }, [search]);

  if(selectedTask) return (
    <TaskDetail task={selectedTask} user={user} tasks={tasks} setTasks={setTasks}
      templates={templates} clients={clients} areas={areas} users={users}
      onBack={()=>setSelectedId(null)}/>
  );

  if(showProposeFlow) return (
    <TemplateBuilder areas={areas} users={users} proposedBy={user.id}
      onCancel={()=>setShowProposeFlow(false)}
      onSave={t=>{ setTemplates(p=>[...p,{...t,id:uid(),status:"pending_approval",proposedBy:user.id}]); setShowProposeFlow(false); }}/>
  );

  return (
    <div className="p-6 space-y-5">
      {/* Inline delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setConfirmDelete(null)}>
          <div className="bg-slate-800 border border-red-500/30 rounded-2xl p-6 w-full max-w-sm space-y-4 mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <Trash2 size={18} className="text-red-400"/>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-100">Excluir tarefa?</p>
                <p className="text-xs text-slate-400 mt-0.5">{confirmDelete.title}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { const id = confirmDelete.id; setTasks(p => p.filter(x => x.id !== id)); setConfirmDelete(null); }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold">
                Sim, excluir
              </button>
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-semibold">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div><h1 className="text-xl font-bold text-slate-100">Tarefas</h1>
          <p className="text-sm text-slate-400">{visible.length} visível(is) para você</p></div>
        <div className="flex gap-2 items-center flex-wrap">
          {/* Search box */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"/>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por #ID ou título..."
              className="pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 w-52"
            />
            {search && <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"><XIcon size={12}/></button>}
          </div>
          {user.role==="area_manager"&&<Btn variant="secondary" size="sm" onClick={()=>setShowProposeFlow(true)}><Layers size={13}/>Propor Fluxo</Btn>}
          {user.role!=="auditor"&&<Btn onClick={()=>setShowNew(true)}><Plus size={14}/>Nova Tarefa</Btn>}
        </div>
      </div>
      {/* Pending flows notification for director */}
      {pendingFlows.length>0&&(
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"/>
            <p className="text-sm font-semibold text-amber-300">{pendingFlows.length} fluxo(s) aguardando sua aprovação</p>
          </div>
          <Btn variant="warning" size="sm" onClick={()=>{ /* navigate to admin > templates */ }}>Ver em Administração →</Btn>
        </div>
      )}
      <div className="flex gap-2 flex-wrap">
        {[["all","Todas"],["mine","Minhas"],["pending","Aguard. Aprovação"],["in_progress","Em Andamento"],["completed","Concluídas"]].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)} className={"text-xs px-3 py-1.5 rounded-full font-medium transition-all border "+(filter===v?"bg-red-600 text-white border-red-600":"bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500")+""}>{l}</button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.length===0&&<div className="text-center py-12 text-slate-500 text-sm">Nenhuma tarefa encontrada</div>}
        {filtered.map(t=>{
          const opener=users.find(u=>u.id===t.openedBy);
          const cNames=t.clientAllocation.map(a=>clients.find(c=>c.id===a.clientId)?.code).filter(Boolean).join(", ");
          const done=t.stepStatuses.filter(s=>s.status==="completed").length;
          const total=t.stepStatuses.length;
          const needsAction=t.status==="awaiting_approval";
          return (
            <div key={t.id} onClick={()=>setSelectedId(t.id)} style={{cursor:"pointer"}}
              className={"bg-slate-800 border rounded-xl p-4 hover:border-red-500/40 group transition-all "+(needsAction?"border-amber-500/30":"border-slate-700")+""}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge color={STATUS_COLORS[t.status]}>{STATUS_LABELS[t.status]}</Badge>
                    <span className="text-xs text-slate-500">{t.templateName}</span>
                    {needsAction&&<span className="text-xs text-amber-400 font-semibold animate-pulse">● Ação necessária</span>}
                    {t.attachments?.length>0&&<span className="text-xs text-slate-500 flex items-center gap-0.5"><Paperclip size={10}/>{t.attachments.length}</span>}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-100 text-sm">{t.title}</p>
                    <span className="text-xs font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">#{t.id.slice(-6).toUpperCase()}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                    <span className="text-xs text-slate-500 flex items-center gap-1"><User size={10}/>{opener?.name}</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1"><Building2 size={10}/>{cNames||"—"}</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1"><Calendar size={10}/>{fmtDate(t.openedAt)}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-amber-400 opacity-0 group-hover:opacity-100 transition-all font-semibold">Abrir →</span>
                    {user.role !== "auditor" && (
                      <button
                        onClick={e=>{e.stopPropagation(); setConfirmDelete(t);}}
                        className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors"
                        title="Excluir tarefa">
                        <Trash2 size={13}/>
                      </button>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">{done}/{total} etapas</span>
                  <div className="w-24 bg-slate-700 rounded-full h-1.5">
                    <div className="bg-red-500 h-1.5 rounded-full" style={{width:""+((done/total)*100)+"%"}}/>
                  </div>
                  {t.costRationals.length>0&&<span className="text-xs text-amber-400/70">{fmt(t.costRationals.reduce((s,c)=>s+c.value,0))}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {showNew&&<TaskFormModal user={user} templates={templates} clients={clients}
        onClose={()=>setShowNew(false)} onSave={t=>{setTasks(p=>[...p,t]);setShowNew(false);}}/>}
    </div>
  );
}

// ─────────────────────────────────────────────
// TASK DETAIL
// ─────────────────────────────────────────────
function TaskDetail({ task, user, tasks, setTasks, templates, clients, areas, users, onBack }) {
  const [comment, setComment] = useState("");
  const [approvalComment, setApprovalComment] = useState("");
  const [showApproval, setShowApproval] = useState(false);
  const [editing, setEditing] = useState(false);

  const tpl = templates.find(t=>t.id===task.templateId);
  const isTerminal = ["completed","rejected","cancelled"].includes(task.status);
  const isAuditor = user.role==="auditor";
  const currentStep = tpl?.steps[task.currentStepIndex];
  const areaMatch = !currentStep?.areaId||userAreaIds(user).includes(currentStep.areaId)||user.role==="director";

  const showStart = task.status==="open"&&!isAuditor;
  const showAdvance = !isTerminal&&!isAuditor&&task.status==="in_progress"&&currentStep&&!currentStep.requiresApproval&&areaMatch;
  const showApproveBtn = !isTerminal&&task.status==="awaiting_approval"&&currentStep?.requiresApproval&&(
    user.role==="director"||(currentStep.approverRole==="area_manager"&&user.role==="area_manager"&&areaMatch)
  );
  const canEdit = !isTerminal&&(task.openedBy===user.id||user.role==="director"||user.role==="area_manager");
  const hasAction = showStart||showAdvance||showApproveBtn;

  const updateTask = u => setTasks(prev=>prev.map(t=>t.id===task.id?{...t,...u}:t));

  const handleStart = () => {
    const fs=tpl?.steps[0];
    updateTask({
      status: fs?.requiresApproval ? "awaiting_approval" : "in_progress",
      currentStepIndex: 0,
      stepStatuses: task.stepStatuses.map((ss,i) => i===0 ? {...ss, startedAt: now()} : ss)
    });
  };

  const advanceToNext = (idx, statuses) => {
    const next=idx+1;
    if(next>=tpl.steps.length){ updateTask({status:"completed",currentStepIndex:next,stepStatuses:statuses}); return; }
    const ns=tpl.steps[next];
    const withStart = statuses.map((ss,i) => i===next ? {...ss, startedAt: now()} : ss);
    updateTask({status:ns.requiresApproval?"awaiting_approval":"in_progress",currentStepIndex:next,stepStatuses:withStart});
    // Email notification
    try {
      const assignee = ns.assigneeUserId ? users.find(u=>u.id===ns.assigneeUserId) : null;
      const toNotify = assignee ? [assignee] : users.filter(u=>
        (ns.areaId ? (u.areaIds||[]).includes(ns.areaId) : true) &&
        ["director","area_manager","operator"].includes(u.role)
      );
      notifyUsers(toNotify,
        `[Grupo All] Tarefa: ${task.title} — Etapa ${next+1}: ${ns.name}`,
        `A tarefa "${task.title}" avançou para a etapa "${ns.name}".\n\nAcesse o sistema para tomar ação: ${window.location.href}`
      );
    } catch(e) {}
  };

  const handleAdvance = () => {
    const s=task.stepStatuses.map((ss,i)=>i===task.currentStepIndex?{...ss,status:"completed",actorId:user.id,actedAt:now(),comment:"Etapa concluída"}:ss);
    advanceToNext(task.currentStepIndex,s);
  };
  const handleApprove = () => {
    const s=task.stepStatuses.map((ss,i)=>i===task.currentStepIndex?{...ss,status:"completed",actorId:user.id,actedAt:now(),comment:approvalComment||"Aprovado"}:ss);
    advanceToNext(task.currentStepIndex,s);
    setShowApproval(false); setApprovalComment("");
  };
  const handleReject = () => {
    const s=task.stepStatuses.map((ss,i)=>i===task.currentStepIndex?{...ss,status:"rejected",actorId:user.id,actedAt:now(),comment:approvalComment||"Rejeitado"}:ss);
    updateTask({status:"rejected",stepStatuses:s});
    setShowApproval(false);
  };
  const handleComment = () => {
    if(!comment.trim()) return;
    updateTask({comments:[...task.comments,{id:uid(),userId:user.id,userName:user.name,text:comment,createdAt:now()}]});
    setComment("");
  };

  // Generate short code from task ID (last 6 chars uppercase)
  const taskCode = "#" + task.id.slice(-6).toUpperCase();

  // Emergency WhatsApp — notify users who should act on current/pending steps
  const sendTaskEmergency = () => {
    if (!tpl) return;
    const siteUrl = window.location.origin || window.location.href.split("#")[0];
    const msg = encodeURIComponent(
      `🚨 URGENTE — Tarefa ${taskCode}\n\n"${task.title}"\n\nSua ação é necessária agora!\n\nAcesse: ${siteUrl}\n\nGrupo All Logística`
    );
    // Find who should be notified: assignee of current step OR area users OR all non-auditors
    const currentStep_ = tpl.steps[task.currentStepIndex];
    let toNotify = [];
    if (currentStep_?.assigneeUserId) {
      toNotify = users.filter(u => u.id === currentStep_.assigneeUserId);
    } else if (currentStep_?.areaId) {
      toNotify = users.filter(u => (u.areaIds||[]).includes(currentStep_.areaId) && u.role !== "auditor" && u.id !== user.id);
    } else {
      toNotify = users.filter(u => u.role !== "auditor" && u.id !== user.id);
    }
    const withPhone = toNotify.filter(u => u.phone);
    if (withPhone.length === 0) {
      alert("Nenhum usuário com WhatsApp cadastrado nessa etapa.\n\nCadastre o telefone em Administração → Usuários.");
      return;
    }
    withPhone.forEach(u => {
      const phone = u.phone.replace(/\D/g,"");
      const full = phone.startsWith("55") ? phone : "55"+phone;
      window.open("https://wa.me/"+(full)+"?text="+(msg)+"", "_blank");
    });
  };

  if(editing) return (
    <TaskFormModal user={user} templates={templates} clients={clients} existing={task}
      onClose={()=>setEditing(false)}
      onSave={updated=>{ updateTask(updated); setEditing(false); }}/>
  );

  return (
    <div className="p-6 space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 flex-shrink-0"><ArrowLeft size={18}/></button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold text-slate-100">{task.title}</h1>
            <span className="text-xs font-mono bg-slate-700 text-slate-300 px-2 py-0.5 rounded select-all cursor-pointer"
              onClick={() => { navigator.clipboard?.writeText(taskCode); }}
              title="Clique para copiar">{taskCode}</span>
          </div>
          <p className="text-xs text-slate-400">{task.templateName}</p>
        </div>
        <Badge color={STATUS_COLORS[task.status]}>{STATUS_LABELS[task.status]}</Badge>
        {canEdit&&<Btn variant="secondary" size="sm" onClick={()=>setEditing(true)}><Edit2 size={13}/>Editar</Btn>}
        {!isTerminal && user.role !== "auditor" && (
          <button onClick={sendTaskEmergency}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-all flex-shrink-0"
            title="Enviar WhatsApp de urgência para os responsáveis desta etapa">
            🚨 Urgência
          </button>
        )}
      </div>

      {/* Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3"><p className="text-xs text-slate-400 mb-1">Aberta em</p><p className="text-sm text-slate-100 font-medium">{fmtDate(task.openedAt)}</p></Card>
        <Card className="p-3"><p className="text-xs text-slate-400 mb-1">Clientes</p><p className="text-xs text-slate-100 font-medium">{task.clientAllocation.map(a=>clients.find(c=>c.id===a.clientId)?.code).filter(Boolean).join(", ")||"—"}</p></Card>
        <Card className="p-3"><p className="text-xs text-slate-400 mb-1">Progresso</p><p className="text-sm text-slate-100 font-medium">{task.stepStatuses.filter(s=>s.status==="completed").length}/{task.stepStatuses.length} etapas</p></Card>
        <Card className="p-3"><p className="text-xs text-slate-400 mb-1">Custos</p><p className="text-sm font-bold text-amber-400">{fmt(task.costRationals.reduce((s,c)=>s+c.value,0))}</p></Card>
      </div>
      {task.description&&<Card className="p-4"><p className="text-xs text-slate-400 mb-1">Descrição</p><p className="text-sm text-slate-200">{task.description}</p></Card>}

      {/* Action panel */}
      {!isTerminal&&(
        <div className={"rounded-xl border-2 p-5 space-y-4 "+(hasAction?"border-amber-500/40 bg-amber-500/5":"border-slate-700 bg-slate-800")+""}>
          <div className="flex items-center gap-2">
            <div className={"w-2 h-2 rounded-full "+(hasAction?"bg-amber-400 animate-pulse":"bg-slate-600")+""}/>
            <h3 className="text-sm font-bold text-slate-200">{hasAction?"Ação necessária":"Aguardando ação de outro usuário"}</h3>
          </div>
          {currentStep&&(
            <div className="bg-slate-900 rounded-lg p-3 border border-slate-700">
              <p className="text-xs text-slate-400 mb-1">Etapa atual</p>
              <p className="text-sm font-bold text-slate-100">{currentStep.name}</p>
              {currentStep.description&&<p className="text-xs text-slate-500 mt-0.5">{currentStep.description}</p>}
              <div className="flex gap-2 mt-2 flex-wrap">
                {currentStep.areaId&&<span className="text-xs text-blue-400 bg-blue-400/10 border border-blue-400/20 rounded px-2 py-0.5">{areas.find(a=>a.id===currentStep.areaId)?.name}</span>}
                {currentStep.requiresApproval&&<span className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded px-2 py-0.5">Aprovação: {currentStep.approverRole==="director"?"Diretor":"Gestor de Área"}</span>}
              </div>
            </div>
          )}
          {!isAuditor&&(
            <div className="space-y-3">
              {showStart&&<Btn onClick={handleStart} size="lg" className="w-full justify-center"><Activity size={16}/>Iniciar Tarefa</Btn>}
              {showAdvance&&(
                <div>
                  <p className="text-xs text-slate-400 mb-2">Você é responsável por esta etapa. Clique para concluir e avançar.</p>
                  <Btn onClick={handleAdvance} variant="success" size="lg" className="w-full justify-center"><CheckCircle2 size={16}/>Concluir Etapa e Avançar</Btn>
                </div>
              )}
              {showApproveBtn&&!showApproval&&(
                <div>
                  <p className="text-xs text-slate-400 mb-2">Esta etapa aguarda a sua aprovação.</p>
                  <div className="flex gap-2">
                    <Btn onClick={handleApprove} variant="success" size="lg" className="flex-1 justify-center"><Check size={16}/>Aprovar e Avançar</Btn>
                    <Btn onClick={()=>setShowApproval(true)} variant="danger" size="md"><X size={14}/>Rejeitar</Btn>
                  </div>
                </div>
              )}
              {showApproval&&(
                <div className="space-y-2">
                  <TA label="Motivo da rejeição *" placeholder="Explique o motivo..." rows={3} value={approvalComment} onChange={e=>setApprovalComment(e.target.value)}/>
                  <div className="flex gap-2">
                    <Btn onClick={handleReject} variant="danger" disabled={!approvalComment.trim()} className="flex-1 justify-center"><X size={14}/>Confirmar Rejeição</Btn>
                    <Btn variant="ghost" onClick={()=>{setShowApproval(false);setApprovalComment("");}}>Cancelar</Btn>
                  </div>
                </div>
              )}
              {!hasAction&&!showApproval&&(
                <p className="text-xs text-slate-500 text-center py-2">
                  {task.status==="awaiting_approval"
                    ?"Aguardando "+(currentStep?.approverRole==="director"?"o Diretor":"Gestor de "+(areas.find(a=>a.id===currentStep?.areaId)?.name||"Área"))+" aprovar."
                    :"Nenhuma ação disponível para o seu perfil nesta etapa."}
                </p>
              )}
            </div>
          )}
          {isAuditor&&<p className="text-xs text-slate-500 text-center py-2">Perfil Auditor — somente visualização.</p>}
        </div>
      )}
      {isTerminal&&(
        <div className={"rounded-xl border p-4 flex items-center gap-3 "+(task.status==="completed"?"border-emerald-500/30 bg-emerald-500/5":"border-red-500/30 bg-red-500/5")+""}>
          {task.status==="completed"?<CheckCircle2 size={18} className="text-emerald-400"/>:<XCircle size={18} className="text-red-400"/>}
          <p className={"text-sm font-semibold "+(task.status==="completed"?"text-emerald-300":"text-red-300")+""}>
            {task.status==="completed"?"Tarefa concluída com sucesso.":"Tarefa "+(STATUS_LABELS[task.status].toLowerCase())+"."}
          </p>
        </div>
      )}

      {/* Flow */}
      <Card className="p-5">
        <h3 className="text-sm font-bold text-slate-300 mb-4">Etapas do Fluxo</h3>
        <div className="space-y-2">
          {tpl?.steps.map((step,i)=>{
            const ss=task.stepStatuses[i];
            const actor=users.find(u=>u.id===ss?.actorId);
            const area=areas.find(a=>a.id===step.areaId);
            const isCur=i===task.currentStepIndex&&!isTerminal;
            const done=ss?.status==="completed"; const rej=ss?.status==="rejected";
            return (
              <div key={step.id} className={"flex items-start gap-3 p-3 rounded-lg border transition-all "+(done?"bg-emerald-500/5 border-emerald-500/20":rej?"bg-red-500/5 border-red-500/20":isCur?"bg-amber-500/5 border-amber-500/30":"bg-slate-900 border-slate-700 opacity-60")+""}>
                <div className={"w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5 "+(done?"bg-emerald-500 text-white":rej?"bg-red-500 text-white":isCur?"bg-amber-500 text-slate-900":"bg-slate-700 text-slate-500")+""}>
                  {done?<Check size={12}/>:rej?<X size={12}/>:i+1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={"text-sm font-semibold "+(isCur?"text-amber-300":done?"text-emerald-300":"text-slate-300")+""}>{step.name}</p>
                    {area&&<Badge color="#60a5fa">{area.name}</Badge>}
                    {step.requiresApproval&&<Badge color="#f59e0b">Aprovação</Badge>}
                    {isCur&&<span className="text-xs text-amber-400 font-semibold">← atual</span>}
                  </div>
                  {step.description&&<p className="text-xs text-slate-500 mt-0.5">{step.description}</p>}
                  {ss?.comment&&<p className="text-xs text-slate-400 mt-1 italic">"{ss.comment}"{actor&&<span className="text-slate-500"> — {actor.name}, {fmtDate(ss.actedAt)}</span>}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Costs */}
      {task.costRationals.length>0&&(
        <Card className="p-4">
          <h3 className="text-sm font-bold text-slate-300 mb-3">Racional de Custos</h3>
          <div className="space-y-2">
            {task.clientAllocation.length>0&&(
              <div className="bg-slate-900 rounded-lg p-2 border border-slate-700 mb-2">
                <p className="text-xs text-slate-500">Rateado para: {task.clientAllocation.map(a=>""+(clients.find(c=>c.id===a.clientId)?.name)+" ("+(a.percent)+"%)").join(" · ")}</p>
              </div>
            )}
            {task.costRationals.map(c=>(
              <div key={c.id} className="flex justify-between items-center py-1.5 border-b border-slate-700 last:border-0">
                <div><p className="text-sm text-slate-200">{c.description}</p><p className="text-xs text-slate-500">{c.category}</p></div>
                <p className="text-sm font-semibold text-amber-400">{fmt(c.value)}</p>
              </div>
            ))}
            <div className="flex justify-between pt-1"><span className="text-sm font-bold text-slate-300">Total</span><span className="text-sm font-bold text-amber-400">{fmt(task.costRationals.reduce((s,c)=>s+c.value,0))}</span></div>
          </div>
        </Card>
      )}

      {/* Attachments */}
      {task.attachments?.length>0&&(
        <Card className="p-4">
          <h3 className="text-sm font-bold text-slate-300 mb-2">Anexos ({task.attachments.length})</h3>
          <AttachmentList attachments={task.attachments}/>
          {!isTerminal&&!isAuditor&&(
            <div className="mt-2">
              <AttachmentUpload onAdd={a=>updateTask({attachments:[...task.attachments,a]})}/>
            </div>
          )}
        </Card>
      )}
      {(!task.attachments||task.attachments.length===0)&&!isTerminal&&!isAuditor&&(
        <Card className="p-4">
          <h3 className="text-sm font-bold text-slate-300 mb-2">Anexos</h3>
          <AttachmentUpload onAdd={a=>updateTask({attachments:[...(task.attachments||[]),a]})}/>
        </Card>
      )}

      {/* Comments */}
      <Card className="p-4">
        <h3 className="text-sm font-bold text-slate-300 mb-3">Comentários ({task.comments.length})</h3>
        <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
          {task.comments.length===0&&<p className="text-xs text-slate-500">Nenhum comentário ainda.</p>}
          {task.comments.map(c=>(
            <div key={c.id} className="bg-slate-900 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-amber-400">{c.userName}</span>
                <span className="text-xs text-slate-500">{fmtDate(c.createdAt)}</span>
              </div>
              <p className="text-sm text-slate-300">{c.text}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={comment} onChange={e=>setComment(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleComment()}
            placeholder="Comentar e pressione Enter..." className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"/>
          <Btn onClick={handleComment} size="sm" disabled={!comment.trim()}><MessageSquare size={14}/></Btn>
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────
// COSTS VIEW
// ─────────────────────────────────────────────
function CostsView({ user, fixedCosts, setFixedCosts, costEntries, setCostEntries, clients }) {
  const [tab, setTab] = useState("variable");
  const [showFixed, setShowFixed] = useState(false);
  const [showVar, setShowVar] = useState(false);
  const [filterMonth, setFilterMonth] = useState(4);
  const canEdit = ["director","area_manager"].includes(user.role);
  const filtered = costEntries.filter(c=>c.month===filterMonth&&c.year===2025);
  const totalVar = filtered.reduce((s,c)=>s+c.value,0);
  const totalFixed = fixedCosts.filter(f=>f.active).reduce((s,f)=>s+f.value,0);

  const saveFixed=fc=>{setFixedCosts(p=>[...p,{...fc,id:uid(),createdBy:user.id}]);setShowFixed(false);};
  const saveVar=ce=>{setCostEntries(p=>[...p,{...ce,id:uid(),createdBy:user.id}]);setShowVar(false);};
  const toggleFixed=id=>setFixedCosts(p=>p.map(f=>f.id===id?{...f,active:!f.active}:f));
  const delVar=id=>setCostEntries(p=>p.filter(c=>c.id!==id));

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-slate-100">Custos</h1><p className="text-sm text-slate-400">Fixos mensais + lançamentos variáveis</p></div>
        {canEdit&&<div className="flex gap-2">
          <Btn variant="secondary" size="sm" onClick={()=>setShowFixed(true)}><Plus size={14}/>Custo Fixo</Btn>
          <Btn size="sm" onClick={()=>setShowVar(true)}><Plus size={14}/>Lançamento</Btn>
        </div>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <KpiCard label="Custos Fixos/Mês" value={fmt(totalFixed)} sub={""+(fixedCosts.filter(f=>f.active).length)+" itens ativos"} icon={Lock} color="#ef4444"/>
        <KpiCard label="Custos Variáveis" value={fmt(totalVar)} sub={""+(MONTHS_SHORT[filterMonth-1])+" · "+(filtered.length)+" lançamentos"} icon={Activity} color="#f59e0b"/>
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex gap-1">
          {[["variable","Variáveis"],["fixed","Fixos"]].map(([v,l])=>(
            <button key={v} onClick={()=>setTab(v)} className={"text-xs px-3 py-1.5 rounded-full font-medium border transition-all "+(tab===v?"bg-red-600 text-white border-red-600":"bg-slate-800 text-slate-400 border-slate-700")+""}>{l}</button>
          ))}
        </div>
        {tab==="variable"&&<Sel value={filterMonth} onChange={e=>setFilterMonth(Number(e.target.value))}>
          {MONTHS_SHORT.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
        </Sel>}
      </div>
      {tab==="variable"&&(
        <div className="space-y-2">
          {filtered.length===0&&<div className="text-center py-10 text-slate-500 text-sm">Nenhum lançamento neste mês</div>}
          {filtered.map(c=>{
            const alloc=c.clientAllocation.map(a=>""+(clients.find(cl=>cl.id===a.clientId)?.code)+" "+(a.percent)+"%").join(" · ");
            return (
              <Card key={c.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div><p className="text-sm font-semibold text-slate-100">{c.description}</p>
                    <div className="flex gap-3 mt-1"><span className="text-xs text-slate-500">{c.category}</span><span className="text-xs text-slate-500">{alloc}</span></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-red-400">{fmt(c.value)}</p>
                    {canEdit&&<button onClick={()=>delVar(c.id)} className="text-slate-600 hover:text-red-400"><Trash2 size={14}/></button>}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      {tab==="fixed"&&(
        <div className="space-y-2">
          {fixedCosts.map(fc=>{
            const alloc=fc.clientAllocation.map(a=>""+(clients.find(cl=>cl.id===a.clientId)?.code)+" "+(a.percent)+"%").join(" · ");
            return (
              <Card key={fc.id} className={"p-4 "+(!fc.active?"opacity-50":"")+""}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2"><p className="text-sm font-semibold text-slate-100">{fc.description}</p><Badge color={fc.active?"#10b981":"#64748b"}>{fc.active?"Ativo":"Inativo"}</Badge></div>
                    <div className="flex gap-3 mt-1"><span className="text-xs text-slate-500">{fc.category}</span><span className="text-xs text-slate-500">{alloc}</span></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-red-400">{fmt(fc.value)}</p>
                    {canEdit&&<button onClick={()=>toggleFixed(fc.id)} className={"text-xs px-2 py-1 rounded border "+(fc.active?"border-red-500/30 text-red-400":"border-emerald-500/30 text-emerald-400")+""}>{fc.active?"Desativar":"Ativar"}</button>}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      {showFixed&&<CostModal title="Novo Custo Fixo" clients={clients} isFixed onClose={()=>setShowFixed(false)} onSave={saveFixed}/>}
      {showVar&&<CostModal title="Novo Lançamento" clients={clients} onClose={()=>setShowVar(false)} onSave={saveVar}/>}
    </div>
  );
}
function CostModal({ title, clients, isFixed=false, onClose, onSave }) {
  const [f, setF] = useState({description:"",value:"",category:"Operacional",clientAllocation:[{clientId:"",percent:100}],month:4,year:2025});
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  const [alloc, setAlloc] = useState([{clientId:"",percent:100}]);
  const totalPct=alloc.reduce((s,a)=>s+Number(a.percent),0);
  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-4">
        <Input label="Descrição" placeholder="Descreva o custo..." value={f.description} onChange={e=>sf("description",e.target.value)}/>
        <Input label="Valor (R$)" type="number" placeholder="0" value={f.value} onChange={e=>sf("value",e.target.value)}/>
        <Sel label="Categoria" value={f.category} onChange={e=>sf("category",e.target.value)}>
          {COST_CATS.map(c=><option key={c}>{c}</option>)}
        </Sel>
        {!isFixed&&<div className="flex gap-2">
          <Sel label="Mês" value={f.month} onChange={e=>sf("month",Number(e.target.value))}>{MONTHS_SHORT.map((m,i)=><option key={i} value={i+1}>{m}</option>)}</Sel>
          <Input label="Ano" type="number" value={f.year} onChange={e=>sf("year",Number(e.target.value))}/>
        </div>}
        <AllocEditor allocation={alloc} setAllocation={setAlloc} clients={clients}/>
        <div className="flex gap-2 pt-1">
          <Btn onClick={()=>f.description&&f.value&&totalPct===100&&onSave({...f,value:Number(f.value),clientAllocation:alloc.filter(a=>a.clientId)})} disabled={!f.description||!f.value||totalPct!==100} className="flex-1 justify-center">Salvar</Btn>
          <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
        </div>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// REVENUE VIEW — with fortnights
// ─────────────────────────────────────────────
function RevenueView({ user, acrescimos, setAcrescimos, clients, faturamentosJadlog }) {
  const [tab, setTab]           = useState("jadlog");
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth()+1);
  const [filterYear, setFilterYear]   = useState(new Date().getFullYear());
  const [showNew, setShowNew]   = useState(false);
  const canEdit = ["director","area_manager"].includes(user.role);

  // Fat. Jadlog — agrupar por cliente/quinzena
  const jadlogRows = (faturamentosJadlog||[]).flatMap(b=>b.rows).filter(r=>r.mes===filterMonth&&r.ano===filterYear);
  const normCnpj = s => String(s||"").replace(/\D/g,"").replace(/^0+/,"");
  const matchClient = cnpj => {
    const nc = normCnpj(cnpj);
    return clients.find(c => {
      // Support both single cnpj and cnpjs array
      const lista = Array.isArray(c.cnpjs) && c.cnpjs.length > 0
        ? c.cnpjs
        : (c.cnpj ? [c.cnpj] : []);
      return lista.some(x => normCnpj(x) === nc);
    });
  };
  const jadlogByClient = {};
  jadlogRows.forEach(r=>{
    const cl = matchClient(r.cnpj);
    const k  = cl ? cl.id : r.cnpj;
    const nm = cl ? (cl.code||cl.name) : "CNPJ "+r.cnpj;
    if (!jadlogByClient[k]) jadlogByClient[k] = {nome:nm, q1:0, q2:0, total:0, ctes:0, matched:!!cl};
    jadlogByClient[k].ctes++;
    jadlogByClient[k].total += r.comissao;
    if (r.quinz===1) jadlogByClient[k].q1 += r.comissao;
    else jadlogByClient[k].q2 += r.comissao;
  });
  const jadlogTotal = jadlogRows.reduce((s,r)=>s+r.comissao,0);

  // Acréscimos avulsos
  const filtAcr = (acrescimos||[]).filter(a=>a.month===filterMonth&&a.year===filterYear);
  const acrTotal = filtAcr.reduce((s,a)=>s+a.value,0);

  const saveAcr = a => { setAcrescimos(p=>[...p,{...a,id:uid(),createdBy:user.id}]); setShowNew(false); };
  const delAcr  = id => setAcrescimos(p=>p.filter(a=>a.id!==id));

  const YEARS = [new Date().getFullYear()-1, new Date().getFullYear()];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-xl font-bold text-slate-100">Faturamento</h1>
          <p className="text-sm text-slate-400">Comissão Jadlog + acréscimos avulsos</p></div>
        <div className="flex gap-2">
          <Sel value={filterMonth} onChange={e=>setFilterMonth(Number(e.target.value))}>
            {MONTHS_SHORT.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
          </Sel>
          <Sel value={filterYear} onChange={e=>setFilterYear(Number(e.target.value))}>
            {YEARS.map(y=><option key={y} value={y}>{y}</option>)}
          </Sel>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Comissão Jadlog" value={fmt(jadlogTotal)} icon={Wallet} color="#10b981"/>
        <KpiCard label="Acréscimos" value={fmt(acrTotal)} icon={Plus} color="#f59e0b"/>
        <KpiCard label="Total Receita" value={fmt(jadlogTotal+acrTotal)} icon={TrendingUp} color="#60a5fa"/>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[["jadlog","📊 Fat. Jadlog"],["acrescimos","➕ Acréscimos Avulsos"]].map(([v,l])=>(
          <button key={v} onClick={()=>setTab(v)}
            className={"text-xs px-3 py-1.5 rounded-full font-semibold border transition-all "+(tab===v?"bg-red-600 text-white border-red-600":"bg-slate-800 text-slate-400 border-slate-700")+""}>{l}</button>
        ))}
      </div>

      {/* Fat. Jadlog por cliente */}
      {tab==="jadlog"&&(
        <div className="space-y-3">
          {Object.keys(jadlogByClient).length===0&&<p className="text-slate-500 text-sm text-center py-10">Nenhum dado para este mês. Importe a planilha em Fat. Jadlog.</p>}
          {Object.entries(jadlogByClient).sort((a,b)=>b[1].total-a[1].total).map(([k,c])=>(
            <Card key={k} className="p-4 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className={"w-2 h-2 rounded-full "+(c.matched?"bg-emerald-400":"bg-amber-400")+""}/>
                <div>
                  <p className="font-semibold text-slate-100">{c.nome}</p>
                  <p className="text-xs text-slate-500">{c.ctes.toLocaleString()} CTEs{!c.matched?" · sem cadastro":""}</p>
                </div>
              </div>
              <div className="flex gap-5 text-right">
                <div><p className="text-xs text-slate-500">1ª Quinzena</p><p className="text-sm font-bold text-emerald-400">{fmt(c.q1)}</p></div>
                <div><p className="text-xs text-slate-500">2ª Quinzena</p><p className="text-sm font-bold text-blue-400">{fmt(c.q2)}</p></div>
                <div><p className="text-xs text-slate-500">Total</p><p className="text-sm font-bold text-slate-100">{fmt(c.total)}</p></div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Acréscimos avulsos */}
      {tab==="acrescimos"&&(
        <div className="space-y-3">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-300">
            💡 Acréscimos somam à comissão Jadlog como receita no Forecast e Rentabilidade. Ex: bônus, ajustes, receitas extras.
          </div>
          {canEdit&&<div className="flex justify-end"><Btn onClick={()=>setShowNew(true)}><Plus size={14}/>Novo Acréscimo</Btn></div>}
          {filtAcr.length===0&&<p className="text-slate-500 text-sm text-center py-6">Nenhum acréscimo neste mês.</p>}
          {filtAcr.map(a=>{
            const cl = clients.find(c=>c.id===a.clientId);
            return (
              <Card key={a.id} className="p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-100">{cl?.name||"—"}</p>
                  <p className="text-xs text-slate-400">{a.description} · {MONTHS_SHORT[a.month-1]}/{a.year}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-bold text-amber-400">{fmt(a.value)}</p>
                  {canEdit&&<button onClick={()=>delAcr(a.id)} className="text-slate-600 hover:text-red-400"><Trash2 size={13}/></button>}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {showNew&&(
        <Modal title="Novo Acréscimo" onClose={()=>setShowNew(false)}>
          <AcrescimoForm clients={clients} onSave={saveAcr} onCancel={()=>setShowNew(false)} defaultMonth={filterMonth} defaultYear={filterYear}/>
        </Modal>
      )}
    </div>
  );
}
function AcrescimoForm({ clients, onSave, onCancel, defaultMonth, defaultYear }) {
  const [f,setF]=useState({clientId:"",value:"",description:"",month:defaultMonth,year:defaultYear});
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  return (
    <div className="space-y-4">
      <Sel label="Cliente" value={f.clientId} onChange={e=>sf("clientId",e.target.value)}>
        <option value="">Selecione...</option>
        {clients.filter(c=>c.active).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
      </Sel>
      <Input label="Valor (R$)" type="number" placeholder="0" value={f.value} onChange={e=>sf("value",e.target.value)}/>
      <Input label="Descrição" placeholder="Ex: Bônus de desempenho..." value={f.description} onChange={e=>sf("description",e.target.value)}/>
      <div className="flex gap-2">
        <Sel label="Mês" value={f.month} onChange={e=>sf("month",Number(e.target.value))}>{MONTHS_SHORT.map((m,i)=><option key={i} value={i+1}>{m}</option>)}</Sel>
        <Input label="Ano" type="number" value={f.year} onChange={e=>sf("year",Number(e.target.value))}/>
      </div>
      <div className="flex gap-2 pt-1">
        <Btn onClick={()=>f.clientId&&f.value&&onSave({...f,value:Number(f.value)})} disabled={!f.clientId||!f.value} className="flex-1 justify-center">Salvar</Btn>
        <Btn variant="secondary" onClick={onCancel}>Cancelar</Btn>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PROFITABILITY — includes task costs
// ─────────────────────────────────────────────
function ProfitabilityView({ clients, fixedCosts, costEntries, revenues, tasks, faturamentosJadlog, acrescimos, forecastEntries }) {
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth()+1);
  const [filterYear,  setFilterYear]  = useState(new Date().getFullYear());
  const [revenueSource, setRevenueSource] = useState("jadlog"); // "jadlog" | "manual"

  // Helper: get Jadlog commission for a client in a given month/year
  const getJadlogComissao = (clientId, month, year) => {
    const cl = clients.find(c=>c.id===clientId);
    if (!cl || !cl.cnpj) return 0;
    const cnpj = cl.cnpj.replace(/\D/g,"").replace(/^0+/,"");
    return (faturamentosJadlog||[]).flatMap(b=>b.rows).filter(r=>{
      if (r.mes!==month || r.ano!==year) return false;
      return r.cnpj.replace(/^0+/,"") === cnpj;
    }).reduce((s,r)=>s+r.comissao,0);
  };

  const data = useMemo(()=>clients.map(cl=>{
    const rev = revenueSource==="jadlog"
      ? getJadlogComissao(cl.id, filterMonth, filterYear)
      : revenues.filter(r=>r.clientId===cl.id&&r.month===filterMonth&&r.year===filterYear).reduce((s,r)=>s+r.value,0);
    const fc=fixedCosts.filter(f=>f.active).reduce((s,f)=>{const a=f.clientAllocation.find(a=>a.clientId===cl.id);return s+(a?f.value*a.percent/100:0);},0);
    const vc=costEntries.filter(c=>c.month===filterMonth&&c.year===filterYear).reduce((s,c)=>{const a=c.clientAllocation.find(a=>a.clientId===cl.id);return s+(a?c.value*a.percent/100:0);},0);
    const tc=tasks.reduce((s,t)=>s+t.costRationals.reduce((a,cr)=>{
      const al=t.clientAllocation.find(x=>x.clientId===cl.id);
      return a+(al?cr.value*al.percent/100:0);
    },0),0);
    // buscar % imposto do forecast entry
    const fEntry = (forecastEntries||[]).find(f=>f.clientId===cl.id&&f.month===filterMonth&&f.year===filterYear);
    const impostoPerc = fEntry?.impostoPercent || 0;
    const totalCost = fc+vc+tc;
    const imposto   = rev * (impostoPerc/100);            // imposto sobre comissão
    const profit    = rev - totalCost - imposto;          // saldo = comissão - custos - impostos
    const margin    = rev>0?(profit/rev*100):0;
    return {...cl,rev,fc,vc,tc,totalCost,imposto,profit,margin};
  // eslint-disable-next-line
  }),[clients,fixedCosts,costEntries,revenues,tasks,filterMonth,filterYear,revenueSource,faturamentosJadlog]);

  const totals=data.reduce((a,c)=>({rev:a.rev+c.rev,cost:a.cost+c.totalCost,profit:a.profit+c.profit}),{rev:0,cost:0,profit:0});
  const totalMargin=totals.rev>0?(totals.profit/totals.rev*100):0;

  const YEARS = [new Date().getFullYear()-1, new Date().getFullYear()];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Rentabilidade</h1>
          <p className="text-sm text-slate-400">Receita − Custos por cliente</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Revenue source toggle */}
          <div className="flex rounded-lg border border-slate-700 overflow-hidden text-xs">
            <button onClick={()=>setRevenueSource("jadlog")}
              className={"px-3 py-1.5 font-semibold transition-all "+(revenueSource==="jadlog"?"bg-emerald-600 text-white":"bg-slate-800 text-slate-400")+""}>
              Fat. Jadlog
            </button>
            <button onClick={()=>setRevenueSource("manual")}
              className={"px-3 py-1.5 font-semibold transition-all "+(revenueSource==="manual"?"bg-emerald-600 text-white":"bg-slate-800 text-slate-400")+""}>
              Manual
            </button>
          </div>
          <Sel value={filterMonth} onChange={e=>setFilterMonth(Number(e.target.value))}>
            {MONTHS_SHORT.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
          </Sel>
          <Sel value={filterYear} onChange={e=>setFilterYear(Number(e.target.value))}>
            {YEARS.map(y=><option key={y} value={y}>{y}</option>)}
          </Sel>
        </div>
      </div>

      {revenueSource==="jadlog"&&(
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-2 text-xs text-blue-300">
          💡 Receita = <strong>Comissão Jadlog</strong> (col. Liquido). Para casar, cadastre o CNPJ do cliente em Administração → Clientes.
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Comissão / Receita" value={fmt(totals.rev)} icon={Wallet} color="#10b981"/>
        <KpiCard label="Custo Total" value={fmt(totals.cost)} icon={DollarSign} color="#ef4444"/>
        <KpiCard label="Lucro / Margem" value={""+(totalMargin.toFixed(1))+"%"} sub={fmt(totals.profit)} icon={TrendingUp} color={totalMargin>20?"#10b981":"#f59e0b"}/>
      </div>
      <Card className="p-5">
        <h3 className="text-sm font-bold text-slate-300 mb-4">Receita vs Custo — {MONTHS_SHORT[filterMonth-1]}</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.map(d=>({name:d.code,Receita:d.rev,Custo:d.totalCost,Lucro:d.profit}))} barSize={20}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
            <XAxis dataKey="name" stroke="#64748b" tick={{fill:"#94a3b8",fontSize:12}}/>
            <YAxis stroke="#64748b" tick={{fill:"#94a3b8",fontSize:11}} tickFormatter={v=>""+((v/1000).toFixed(0))+"k"}/>
            <Tooltip contentStyle={{background:"#1e293b",border:"1px solid #334155",borderRadius:8}} formatter={v=>fmt(v)}/>
            <Legend wrapperStyle={{fontSize:11,color:"#94a3b8"}}/>
            <Bar dataKey="Receita" fill="#10b981" radius={[4,4,0,0]}/>
            <Bar dataKey="Custo"   fill="#ef4444" radius={[4,4,0,0]}/>
            <Bar dataKey="Lucro"   fill="#f59e0b" radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-700">
              {["Cliente","Receita","C. Fixo","C. Variável","C. Tarefas","Custo Total","Lucro","Margem"].map(h=>(
                <th key={h} className="text-left text-xs font-semibold text-slate-400 px-4 py-3 whitespace-nowrap">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {data.map(d=>(
                <tr key={d.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                  <td className="px-4 py-3.5 font-semibold text-slate-100">{d.name} <span className="text-xs text-slate-500 font-normal">{d.code}</span></td>
                  <td className="px-4 py-3.5 text-emerald-400 font-medium">{fmt(d.rev)}</td>
                  <td className="px-4 py-3.5 text-red-400">{fmt(d.fc)}</td>
                  <td className="px-4 py-3.5 text-orange-400">{fmt(d.vc)}</td>
                  <td className="px-4 py-3.5 text-amber-400">{fmt(d.tc)}</td>
                  <td className="px-4 py-3.5 text-red-400 font-semibold">{fmt(d.totalCost)}</td>
                  <td className={"px-4 py-3.5 font-bold "+(d.profit>=0?"text-emerald-400":"text-red-400")+""}>{fmt(d.profit)}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-14 bg-slate-700 rounded-full h-1.5"><div className="h-1.5 rounded-full" style={{width:""+(Math.max(0,Math.min(100,d.margin)))+"%",background:d.margin>20?"#10b981":d.margin>0?"#f59e0b":"#ef4444"}}/></div>
                      <span className={"text-xs font-bold "+(d.margin>20?"text-emerald-400":d.margin>0?"text-amber-400":"text-red-400")+""}>{d.margin.toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr className="bg-slate-700/30">
              <td className="px-4 py-3 font-bold text-slate-200">TOTAL</td>
              <td className="px-4 py-3 text-emerald-400 font-bold">{fmt(totals.rev)}</td>
              <td colSpan={3} className="px-4 py-3"/>
              <td className="px-4 py-3 text-red-400 font-bold">{fmt(totals.cost)}</td>
              <td className={"px-4 py-3 font-bold text-lg "+(totals.profit>=0?"text-emerald-400":"text-red-400")+""}>{fmt(totals.profit)}</td>
              <td className="px-4 py-3 font-bold text-amber-400">{totalMargin.toFixed(1)}%</td>
            </tr></tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────
// TEMPLATE BUILDER
// ─────────────────────────────────────────────
function TemplateBuilder({ areas, users, initial, onSave, onCancel, proposedBy }) {
  const blank={name:"",description:"",category:"Operações",areaIds:[],costParams:[],steps:[],status:proposedBy?"pending_approval":"active",proposedBy:proposedBy||null};
  const [form, setForm]=useState(initial?{...initial,steps:initial.steps.map(s=>({...s})),costParams:initial.costParams||[],areaIds:initial.areaIds||[]}:blank);
  const sf=(k,v)=>setForm(p=>({...p,[k]:v}));
  const CATS=["Operações","Comercial","Financeiro","Tecnologia","RH","Jurídico","Outros"];

  const toggleArea=id=>sf("areaIds",form.areaIds.includes(id)?form.areaIds.filter(a=>a!==id):[...form.areaIds,id]);

  const addStep=()=>sf("steps",[...form.steps,{id:uid(),order:form.steps.length+1,name:"",description:"",areaId:"",requiresApproval:false,approverRole:null,slaDays:"",slaAcao:"notificar",assigneeUserId:""}]);
  const removeStep=id=>sf("steps",form.steps.filter(s=>s.id!==id).map((s,i)=>({...s,order:i+1})));
  const updStep=(id,k,v)=>sf("steps",form.steps.map(s=>{
    if(s.id!==id) return s;
    const u={...s,[k]:v};
    if(k==="requiresApproval"&&!v) u.approverRole=null;
    if(k==="requiresApproval"&&v&&!u.approverRole) u.approverRole="area_manager";
    return u;
  }));
  const moveStep=(id,dir)=>{
    const idx=form.steps.findIndex(s=>s.id===id);
    const ni=idx+dir; if(ni<0||ni>=form.steps.length) return;
    const s=[...form.steps]; [s[idx],s[ni]]=[s[ni],s[idx]];
    sf("steps",s.map((x,i)=>({...x,order:i+1})));
  };

  const addParam=()=>sf("costParams",[...form.costParams,{id:uid(),name:"",inputLabel:"Valor base (R$)",multiplier:1,multiplierLabel:"valor direto"}]);
  const removeParam=id=>sf("costParams",form.costParams.filter(p=>p.id!==id));
  const updParam=(id,k,v)=>sf("costParams",form.costParams.map(p=>p.id===id?{...p,[k]:v}:p));

  const canSave=form.name.trim()&&form.steps.length>0&&form.steps.every(s=>s.name.trim());

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"><ArrowLeft size={18}/></button>
        <div>
          <h1 className="text-xl font-bold text-slate-100">{initial?"Editar Fluxo":"Novo Fluxo de Tarefa"}</h1>
          <p className="text-sm text-slate-400">Defina etapas, SLA, responsáveis e aprovações</p>
        </div>
        {proposedBy&&<Badge color="#f59e0b">Aguardando aprovação do Diretor</Badge>}
      </div>

      <Card className="p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-300">Informações do Fluxo</h3>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Nome *" placeholder="Ex: Contratação de Funcionário" value={form.name} onChange={e=>sf("name",e.target.value)}/>
          <Sel label="Categoria *" value={form.category} onChange={e=>sf("category",e.target.value)}>{CATS.map(c=><option key={c}>{c}</option>)}</Sel>
        </div>
        <TA label="Descrição" placeholder="Objetivo deste fluxo..." rows={2} value={form.description} onChange={e=>sf("description",e.target.value)}/>
        <div>
          <label className="text-xs text-slate-400 font-medium block mb-2">Áreas que podem usar este fluxo <span className="text-slate-500">(nenhuma = todas)</span></label>
          <div className="flex gap-2 flex-wrap">
            {areas.map(a=>(
              <button key={a.id} type="button" onClick={()=>toggleArea(a.id)}
                className={"text-xs px-3 py-1.5 rounded-full font-medium border transition-all "+(form.areaIds.includes(a.id)?"bg-blue-500/20 text-blue-300 border-blue-500/40":"bg-slate-900 text-slate-500 border-slate-700 hover:border-slate-500")+""}>
                {form.areaIds.includes(a.id)&&<Check size={11} className="inline mr-1"/>}{a.name}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Cost Params */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-300">Custos Parametrizados</h3>
            <p className="text-xs text-slate-500 mt-0.5">O sistema calculará automaticamente quando a tarefa for aberta</p>
          </div>
          <Btn onClick={addParam} size="sm" variant="secondary"><Plus size={14}/>Parâmetro</Btn>
        </div>
        {form.costParams.length===0&&(
          <div className="bg-slate-900 border border-dashed border-slate-700 rounded-lg p-4 text-center">
            <p className="text-xs text-slate-500">Nenhum parâmetro. Ex: "Salário Base × 1.7 = custo total com funcionário"</p>
          </div>
        )}
        {form.costParams.map(cp=>(
          <Card key={cp.id} className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-400">Parâmetro de Custo</p>
              <button onClick={()=>removeParam(cp.id)} className="text-slate-600 hover:text-red-400"><Trash2 size={14}/></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Nome do custo" placeholder="Ex: Salário do Funcionário" value={cp.name} onChange={e=>updParam(cp.id,"name",e.target.value)}/>
              <Input label="Label do campo" placeholder="Ex: Salário Base (R$)" value={cp.inputLabel} onChange={e=>updParam(cp.id,"inputLabel",e.target.value)}/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Multiplicador" type="number" step="0.01" value={cp.multiplier} onChange={e=>updParam(cp.id,"multiplier",Number(e.target.value))}/>
              <Input label="Descrição do multiplicador" placeholder="Ex: × 1.7 (encargos)" value={cp.multiplierLabel} onChange={e=>updParam(cp.id,"multiplierLabel",e.target.value)}/>
            </div>
          </Card>
        ))}
      </div>

      {/* Steps */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-300">Etapas do Fluxo *</h3>
            <p className="text-xs text-slate-500 mt-0.5">Executadas na ordem definida abaixo</p>
          </div>
          <Btn onClick={addStep} size="sm"><Plus size={14}/>Etapa</Btn>
        </div>
        {form.steps.length===0&&(
          <Card className="p-8 border-dashed text-center">
            <Layers size={30} className="text-slate-600 mx-auto mb-2"/>
            <p className="text-slate-500 text-sm">Nenhuma etapa. Clique em "Etapa" para começar.</p>
          </Card>
        )}
        {form.steps.map((step,i)=>{
          // Users in the step's area (or all if no area defined)
          const areaUsers = users.filter(u => !step.areaId || (u.areaIds||[]).includes(step.areaId) || u.role==="director");
          return (
          <Card key={step.id} className="p-4 border-slate-600">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{i+1}</div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex-1">Etapa {i+1}</p>
              <div className="flex items-center gap-1">
                <button type="button" onClick={()=>moveStep(step.id,-1)} disabled={i===0} className="p-1.5 rounded hover:bg-slate-700 text-slate-500 disabled:opacity-20 text-xs">▲</button>
                <button type="button" onClick={()=>moveStep(step.id,1)} disabled={i===form.steps.length-1} className="p-1.5 rounded hover:bg-slate-700 text-slate-500 disabled:opacity-20 text-xs">▼</button>
                <button type="button" onClick={()=>removeStep(step.id)} className="p-1.5 rounded hover:bg-red-500/10 text-slate-600 hover:text-red-400 ml-1"><Trash2 size={14}/></button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Input label="Nome da Etapa *" placeholder="Ex: Análise Financeira" value={step.name} onChange={e=>updStep(step.id,"name",e.target.value)}/>
              <Sel label="Área Responsável" value={step.areaId} onChange={e=>updStep(step.id,"areaId",e.target.value)}>
                <option value="">Qualquer área</option>
                {areas.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
              </Sel>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              {/* SLA */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 font-medium">SLA — Prazo (dias úteis)</label>
                <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg overflow-hidden focus-within:border-red-500">
                  <input type="number" min="0" placeholder="Ex: 2" value={step.slaDays||""} onChange={e=>updStep(step.id,"slaDays",e.target.value)}
                    className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-100 focus:outline-none"/>
                  <span className="text-xs text-slate-500 px-2">dias</span>
                </div>
                {step.slaDays&&<p className="text-xs text-blue-400/70">Prazo: {step.slaDays} dia(s) útil(eis)</p>}
              </div>
              {/* SLA Action */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 font-medium">Ação ao ultrapassar SLA</label>
                <select value={step.slaAcao||"notificar"} onChange={e=>updStep(step.id,"slaAcao",e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500">
                  <option value="notificar">🔔 Notificar (alerta visual)</option>
                  <option value="auto_aprovar">⚡ Auto-aprovar e avançar etapa</option>
                  <option value="escalar_gestor">📢 Escalar para Gestor de Área</option>
                  <option value="escalar_diretor">🚨 Escalar para Diretor</option>
                </select>
                {step.slaAcao==="auto_aprovar"&&step.slaDays&&(
                  <p className="text-xs text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded px-2 py-1">
                    ⚡ Se ninguém agir em {step.slaDays} dias úteis, a etapa será aprovada automaticamente.
                  </p>
                )}
              </div>
              {/* Assignee */}
              <Sel label="Responsável fixo (opcional)" value={step.assigneeUserId||""} onChange={e=>updStep(step.id,"assigneeUserId",e.target.value)}>
                <option value="">— Qualquer usuário da área —</option>
                {areaUsers.map(u=><option key={u.id} value={u.id}>{u.name} ({ROLE_LABELS[u.role]})</option>)}
              </Sel>
            </div>
            <div className="mb-3">
              <TA label="Instrução" placeholder="O que deve ser feito nesta etapa?" rows={2} value={step.description} onChange={e=>updStep(step.id,"description",e.target.value)}/>
            </div>
            <div className={"rounded-lg border p-3 transition-all "+(step.requiresApproval?"bg-amber-500/5 border-amber-500/20":"bg-slate-900 border-slate-700")+""}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={"text-sm font-semibold "+(step.requiresApproval?"text-amber-300":"text-slate-300")+""}>Requer aprovação</p>
                  <p className="text-xs text-slate-500 mt-0.5">Tarefa pausa aguardando aprovação</p>
                </div>
                <button type="button" onClick={()=>updStep(step.id,"requiresApproval",!step.requiresApproval)}
                  className={"w-11 h-6 rounded-full transition-all flex items-center px-1 "+(step.requiresApproval?"bg-amber-500":"bg-slate-700")+""}>
                  <span className={"w-4 h-4 rounded-full bg-white transition-all "+(step.requiresApproval?"translate-x-5":"translate-x-0")+""}/>
                </button>
              </div>
              {step.requiresApproval&&(
                <div className="mt-3 pt-3 border-t border-amber-500/20">
                  <label className="text-xs text-amber-400/80 font-medium block mb-2">Quem aprova?</label>
                  <div className="flex gap-2">
                    {[["area_manager","Gestor de Área","#60a5fa"],["director","Diretor","#f59e0b"]].map(([val,label,color])=>(
                      <button key={val} type="button" onClick={()=>updStep(step.id,"approverRole",val)}
                        className={"flex-1 py-2 px-3 rounded-lg border text-sm font-semibold transition-all "+(step.approverRole===val?"border-2":"")+""}
                        style={step.approverRole===val?{borderColor:color,color,background:color+"15"}:{borderColor:"#334155",color:"#64748b",background:"#0f172a"}}>
                        {step.approverRole===val&&<Check size={12} className="inline mr-1"/>}{label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
          );
        })}
      </div>

      {/* Preview */}
      {form.steps.length>0&&(
        <Card className="p-5">
          <h3 className="text-sm font-bold text-slate-300 mb-3">Pré-visualização</h3>
          <div className="flex items-start gap-1 flex-wrap">
            {form.steps.map((s,i)=>{
              const area=areas.find(a=>a.id===s.areaId);
              const assignee=users.find(u=>u.id===s.assigneeUserId);
              return (
                <div key={s.id} className="flex items-center gap-1">
                  <div className={"rounded-lg px-3 py-2 border text-center min-w-[90px] "+(s.requiresApproval?"bg-amber-500/10 border-amber-500/30":"bg-slate-900 border-slate-700")+""}>
                    <p className={"text-xs font-semibold "+(s.requiresApproval?"text-amber-300":"text-slate-200")+""}>{s.name||"Etapa "+(i+1)+""}</p>
                    {area&&<p className="text-xs text-slate-500 mt-0.5">{area.name}</p>}
                    {assignee&&<p className="text-xs text-blue-400 mt-0.5">{assignee.name.split(" ")[0]}</p>}
                    {s.slaDays&&<p className="text-xs text-blue-400/70 mt-0.5">⏱ {s.slaDays}d</p>}
                    {s.requiresApproval&&<p className="text-xs mt-0.5" style={{color:s.approverRole==="director"?"#f59e0b":"#60a5fa"}}>✓ {s.approverRole==="director"?"Dir":"Gest"}</p>}
                  </div>
                  {i<form.steps.length-1&&<ChevronRight size={13} className="text-slate-600 flex-shrink-0"/>}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div className="flex gap-3 pb-8">
        <Btn onClick={()=>canSave&&onSave(form)} disabled={!canSave} className="flex-1 justify-center" size="lg">
          <Check size={16}/>{proposedBy?"Enviar para Aprovação do Diretor":initial?"Salvar Alterações":"Criar Fluxo"}
        </Btn>
        <Btn variant="secondary" onClick={onCancel} size="lg">Cancelar</Btn>
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────
// ADMIN VIEW
// ─────────────────────────────────────────────
function AdminView({ areas, setAreas, users, setUsers, clients, setClients, templates, setTemplates }) {
  const [tab, setTab] = useState("users");
  const [showNewUser, setShowNewUser] = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  const saveUser=u=>{setUsers(p=>[...p,{...u,id:uid()}]);setShowNewUser(false);};
  const saveClient=c=>{setClients(p=>[...p,{...c,id:uid(),active:true}]);setShowNewClient(false);};
  const deleteUser=id=>setUsers(p=>p.filter(u=>u.id!==id));
  const toggleClient=id=>setClients(p=>p.map(c=>c.id===id?{...c,active:!c.active}:c));
  const deleteTemplate=id=>setTemplates(p=>p.filter(t=>t.id!==id));
  const toggleFinancial  = id => setUsers(p=>p.map(u=>u.id===id?{...u,financialAccess:!u.financialAccess}:u));
  const toggleFechamento = id => setUsers(p=>p.map(u=>u.id===id?{...u,fechamentoAccess:!u.fechamentoAccess}:u));
  const toggleDRE        = id => setUsers(p=>p.map(u=>u.id===id?{...u,dreAccess:!u.dreAccess}:u));
  const saveTemplate=tpl=>{
    if(editingTemplate==="new") setTemplates(p=>[...p,{...tpl,id:uid()}]);
    else setTemplates(p=>p.map(t=>t.id===editingTemplate.id?{...tpl,id:t.id}:t));
    setEditingTemplate(null);
  };

  // Areas
  const [newAreaName, setNewAreaName] = useState("");
  const addArea = () => {
    const name = newAreaName.trim(); if (!name) return;
    setAreas(p=>[...p,{id:uid(),name,descricao:""}]);
    setNewAreaName("");
  };
  const deleteArea = id => setAreas(p=>p.filter(a=>a.id!==id));

  // Edit user phone
  const setUserPhone = (id, phone) => setUsers(p=>p.map(u=>u.id===id?{...u,phone}:u));
  const setUserEmail = (id, email) => setUsers(p=>p.map(u=>u.id===id?{...u,email}:u));

  if(editingTemplate!==null) return <TemplateBuilder areas={areas} users={users} initial={editingTemplate==="new"?null:editingTemplate} onSave={saveTemplate} onCancel={()=>setEditingTemplate(null)}/>;

  return (
    <div className="p-6 space-y-5">
      <div><h1 className="text-xl font-bold text-slate-100">Administração</h1>
        <p className="text-sm text-slate-400">Usuários, áreas, clientes e fluxos</p></div>
      <div className="flex gap-2 flex-wrap">
        {[["users","👥 Usuários"],["areas","🏢 Áreas"],["clients","🤝 Clientes"],["templates","📋 Fluxos"]].map(([v,l])=>(
          <button key={v} onClick={()=>setTab(v)} className={"text-xs px-3 py-1.5 rounded-full font-medium border transition-all "+(tab===v?"bg-red-600 text-white border-red-600":"bg-slate-800 text-slate-400 border-slate-700")+""}>{l}</button>
        ))}
      </div>

      {/* ── ÁREAS ── */}
      {tab==="areas"&&(
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input value={newAreaName} onChange={e=>setNewAreaName(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&addArea()}
              placeholder="Nome da nova área (ex: Atendimento)"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-red-500"/>
            <Btn onClick={addArea} disabled={!newAreaName.trim()}><Plus size={14}/>Criar Área</Btn>
          </div>
          {areas.map(a=>(
            <Card key={a.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-100">{a.name}</p>
                <p className="text-xs text-slate-500">{users.filter(u=>u.areaIds?.includes(a.id)).length} usuário(s)</p>
              </div>
              <button onClick={()=>deleteArea(a.id)} className="text-slate-600 hover:text-red-400 p-1.5"><Trash2 size={14}/></button>
            </Card>
          ))}
          {areas.length===0&&<p className="text-slate-500 text-sm text-center py-8">Nenhuma área cadastrada.</p>}
        </div>
      )}

      {tab==="users"&&(
        <div className="space-y-3">
          <div className="flex justify-end"><Btn size="sm" onClick={()=>setShowNewUser(true)}><Plus size={14}/>Novo Usuário</Btn></div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-300 space-y-1">
            <p><span className="font-semibold">💰 Acesso Financeiro</span> — Custos, Faturamento, Rentabilidade e Pagamentos. Diretores e Auditores sempre têm.</p>
            <p><span className="font-semibold">🚚 Acesso Fechamento</span> — Módulo de Fechamento de Entregas e cadastro de Motoristas. Diretores sempre têm.</p>
            <p><span className="font-semibold">📊 Acesso DRE</span> — Aba DRE dentro do Fechamento (Saldo Financeiro). Restrito por padrão. Diretores sempre têm.</p>
          </div>
          {users.map(u=>{
            const userAreas=areas.filter(a=>u.areaIds?.includes(a.id)).map(a=>a.name).join(", ");
            const hasF=userHasFinancial(u);
            return (
              <Card key={u.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center font-bold text-amber-400 flex-shrink-0">{u.name[0]}</div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-100">{u.name}</p>
                        <Badge color={ROLE_COLORS[u.role]}>{ROLE_LABELS[u.role]}</Badge>
                      {hasF&&<Badge color="#10b981">💰 Financeiro</Badge>}
                      {userHasFechamento(u)&&<Badge color="#60a5fa">🚚 Fechamento</Badge>}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{u.email}{userAreas?" · "+(userAreas)+"":""}</p>
                      {u.phone&&<p className="text-xs text-emerald-400/70 mt-0.5">📱 {u.phone}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                    {!["director","auditor"].includes(u.role)&&(
                      <button onClick={()=>toggleFinancial(u.id)}
                        className={"text-xs px-2.5 py-1.5 rounded-lg border font-semibold transition-all "+(hasF?"border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20":"border-slate-600 text-slate-500 hover:border-slate-400")+""}>
                        {hasF?"💰 Revogar $":"💰 Liberar $"}
                      </button>
                    )}
                    {u.role!=="director"&&(
                      <button onClick={()=>toggleFechamento(u.id)}
                        className={"text-xs px-2.5 py-1.5 rounded-lg border font-semibold transition-all "+(userHasFechamento(u)?"border-blue-500/30 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20":"border-slate-600 text-slate-500 hover:border-slate-400")+""}>
                        {userHasFechamento(u)?"🚚 Revogar Fech.":"🚚 Liberar Fech."}
                      </button>
                    )}
                    {u.role!=="director"&&(
                      <button onClick={()=>toggleDRE(u.id)}
                        className={"text-xs px-2.5 py-1.5 rounded-lg border font-semibold transition-all "+(userHasDRE(u)?"border-amber-500/30 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20":"border-slate-600 text-slate-500 hover:border-slate-400")+""}>
                        {userHasDRE(u)?"📊 Revogar DRE":"📊 Liberar DRE"}
                      </button>
                    )}
                    <button onClick={()=>deleteUser(u.id)} className="text-slate-600 hover:text-red-400"><Trash2 size={14}/></button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {tab==="clients"&&(
        <div className="space-y-3">
          <div className="flex justify-end"><Btn size="sm" onClick={()=>setShowNewClient(true)}><Plus size={14}/>Novo Cliente</Btn></div>
          {clients.map(cl=>{
            const cList = Array.isArray(cl.cnpjs)&&cl.cnpjs.length>0 ? cl.cnpjs : (cl.cnpj?[cl.cnpj]:[]);
            return (
            <Card key={cl.id} className="p-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-700 flex items-center justify-center font-bold text-blue-400 text-xs">{cl.code}</div>
                  <div>
                    <p className="text-sm font-semibold text-slate-100">{cl.name}</p>
                    {cList.length>0&&(
                      <div className="flex gap-1 flex-wrap mt-0.5">
                        {cList.map(c=><span key={c} className="text-xs text-blue-400/70 font-mono">{c}</span>)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge color={cl.active?"#10b981":"#64748b"}>{cl.active?"Ativo":"Inativo"}</Badge>
                  <button onClick={()=>toggleClient(cl.id)} className="text-xs px-2 py-1 rounded border border-slate-600 text-slate-400 hover:border-slate-400">{cl.active?"Desativar":"Ativar"}</button>
                </div>
              </div>
            </Card>
            );
          })}
        </div>
      )}

      {tab==="templates"&&(
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">{templates.length} fluxo(s)</p>
            <Btn size="sm" onClick={()=>setEditingTemplate("new")}><Plus size={14}/>Novo Fluxo</Btn>
          </div>
          {templates.length===0&&(
            <Card className="p-10 text-center border-dashed">
              <Layers size={36} className="text-slate-600 mx-auto mb-3"/>
              <p className="text-slate-400 text-sm font-semibold">Nenhum fluxo cadastrado</p>
              <Btn size="sm" className="mt-4" onClick={()=>setEditingTemplate("new")}><Plus size={14}/>Criar Fluxo</Btn>
            </Card>
          )}
          {templates.map(t=>(
            <Card key={t.id} className={"p-5 "+(t.status==="pending_approval"?"border-amber-500/30 bg-amber-500/5":"")+""}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-bold text-slate-100">{t.name}</p>
                    <Badge color="#60a5fa">{t.category}</Badge>
                    <span className="text-xs text-slate-500">{t.steps.length} etapa(s)</span>
                    {t.status==="pending_approval"&&<Badge color="#f59e0b">⏳ Aguardando aprovação</Badge>}
                    {t.status==="active"&&<Badge color="#10b981">✓ Ativo</Badge>}
                    {t.costParams?.length>0&&<span className="text-xs text-amber-400/70">{t.costParams.length} parâm.</span>}
                  </div>
                  {t.proposedBy&&<p className="text-xs text-slate-500 mb-1">Proposto por: {users.find(u=>u.id===t.proposedBy)?.name||t.proposedBy}</p>}
                  {t.areaIds?.length>0&&<p className="text-xs text-slate-500 mb-2">Áreas: {t.areaIds.map(id=>areas.find(a=>a.id===id)?.name).filter(Boolean).join(", ")}</p>}
                  <div className="flex items-center gap-1 flex-wrap">
                    {t.steps.map((s,i)=>{
                      const area=areas.find(a=>a.id===s.areaId);
                      return (
                        <div key={s.id} className="flex items-center gap-1">
                          <span className={"text-xs px-2 py-0.5 rounded border "+(s.requiresApproval?"border-amber-500/30 text-amber-400":"border-slate-700 text-slate-400")+""}>
                            {s.name}{area&&" · "+(area.name)+""}{s.slaDays&&<span className="text-blue-400/70"> ⏱{s.slaDays}d</span>}
                          </span>
                          {i<t.steps.length-1&&<ChevronRight size={10} className="text-slate-600"/>}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
                  {t.status==="pending_approval"&&(
                    <Btn variant="success" size="sm" onClick={()=>setTemplates(p=>p.map(x=>x.id===t.id?{...x,status:"active"}:x))}>
                      <Check size={13}/>Aprovar
                    </Btn>
                  )}
                  <Btn variant="secondary" size="sm" onClick={()=>setEditingTemplate(t)}><Edit2 size={13}/>Editar</Btn>
                  <button onClick={()=>deleteTemplate(t.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-600 hover:text-red-400"><Trash2 size={14}/></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showNewUser&&<NewUserModal areas={areas} onClose={()=>setShowNewUser(false)} onSave={saveUser}/>}
      {showNewClient&&(
        <Modal title="Novo Cliente" onClose={()=>setShowNewClient(false)}>
          <ClientForm onSave={c=>{saveClient(c);setShowNewClient(false);}} onCancel={()=>setShowNewClient(false)}/>
        </Modal>
      )}
    </div>
  );
}

function ClientForm({ onSave, onCancel }) {
  const [name,setName]=useState(""); const [code,setCode]=useState("");
  const [cnpjInput, setCnpjInput] = useState("");
  const [cnpjs, setCnpjs] = useState([]);
  const addCnpj = () => { const v=cnpjInput.trim(); if(!v||cnpjs.includes(v)) return; setCnpjs(p=>[...p,v]); setCnpjInput(""); };
  const removeCnpj = c => setCnpjs(p=>p.filter(x=>x!==c));
  return (
    <div className="space-y-4">
      <Input label="Nome" placeholder="Nome completo do cliente" value={name} onChange={e=>setName(e.target.value)}/>
      <Input label="Sigla / Código" placeholder="Ex: MAG" value={code} onChange={e=>setCode(e.target.value.toUpperCase())}/>
      <div>
        <label className="text-xs text-slate-400 font-medium block mb-1">CNPJs (para casar com Fat. Jadlog)</label>
        <div className="flex gap-2">
          <input value={cnpjInput} onChange={e=>setCnpjInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addCnpj()}
            placeholder="00.000.000/0001-00 + Enter"
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-red-500"/>
          <Btn size="sm" onClick={addCnpj} disabled={!cnpjInput.trim()}><Plus size={13}/>Add</Btn>
        </div>
        {cnpjs.length>0&&(
          <div className="flex gap-2 flex-wrap mt-2">
            {cnpjs.map(c=>(
              <span key={c} className="flex items-center gap-1 text-xs bg-blue-500/10 border border-blue-500/30 text-blue-300 rounded-full px-2.5 py-1">
                {c}<button onClick={()=>removeCnpj(c)} className="hover:text-red-400 ml-1"><XIcon size={11}/></button>
              </span>
            ))}
          </div>
        )}
        <p className="text-xs text-slate-500 mt-1">Vários CNPJs do mesmo cliente são agrupados automaticamente</p>
      </div>
      <div className="flex gap-2 pt-1">
        <Btn onClick={()=>name&&code&&onSave({name,code,cnpjs,cnpj:cnpjs[0]||""})} disabled={!name||!code} className="flex-1 justify-center">Salvar</Btn>
        <Btn variant="secondary" onClick={onCancel}>Cancelar</Btn>
      </div>
    </div>
  );
}

function NewUserModal({ areas, onClose, onSave }) {
  const [f,setF]=useState({name:"",email:"",phone:"",password:"123456",role:"operator",areaIds:[],financialAccess:false,emailNotif:true});
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  const toggleArea=id=>sf("areaIds",f.areaIds.includes(id)?f.areaIds.filter(a=>a!==id):[...f.areaIds,id]);
  const needsArea=["operator","area_manager"].includes(f.role);
  return (
    <Modal title="Novo Usuário" onClose={onClose}>
      <div className="space-y-4">
        <Input label="Nome completo" value={f.name} onChange={e=>sf("name",e.target.value)}/>
        <Input label="E-mail" type="email" value={f.email} onChange={e=>sf("email",e.target.value)}/>
        <Input label="WhatsApp (com DDD)" placeholder="27 99999-9999" value={f.phone} onChange={e=>sf("phone",e.target.value)}/>
        <Input label="Senha inicial" value={f.password} onChange={e=>sf("password",e.target.value)}/>
        <Sel label="Perfil" value={f.role} onChange={e=>sf("role",e.target.value)}>
          <option value="operator">Operador</option>
          <option value="area_manager">Gestor de Área</option>
          <option value="director">Diretor</option>
          <option value="auditor">Auditor</option>
        </Sel>
        {needsArea&&(
          <div>
            <label className="text-xs text-slate-400 font-medium block mb-2">Áreas <span className="text-slate-500">(pode selecionar mais de uma)</span></label>
            <div className="flex gap-2 flex-wrap">
              {areas.map(a=>(
                <button key={a.id} type="button" onClick={()=>toggleArea(a.id)}
                  className={"text-xs px-3 py-1.5 rounded-full font-medium border transition-all "+(f.areaIds.includes(a.id)?"bg-blue-500/20 text-blue-300 border-blue-500/40":"bg-slate-900 text-slate-500 border-slate-700 hover:border-slate-500")+""}>
                  {f.areaIds.includes(a.id)&&<Check size={11} className="inline mr-1"/>}{a.name}
                </button>
              ))}
            </div>
          </div>
        )}
        {!["director","auditor"].includes(f.role)&&(
          <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-700">
            <div><p className="text-sm font-semibold text-slate-200">Acesso Financeiro</p><p className="text-xs text-slate-500">Libera Custos, Faturamento e Rentabilidade</p></div>
            <button type="button" onClick={()=>sf("financialAccess",!f.financialAccess)}
              className={"w-11 h-6 rounded-full transition-all flex items-center px-1 "+(f.financialAccess?"bg-emerald-500":"bg-slate-700")+""}>
              <span className={"w-4 h-4 rounded-full bg-white transition-all "+(f.financialAccess?"translate-x-5":"translate-x-0")+""}/>
            </button>
          </div>
        )}
        <div className="flex gap-2 pt-1">
          <Btn onClick={()=>f.name&&f.email&&onSave(f)} disabled={!f.name||!f.email||(needsArea&&f.areaIds.length===0)} className="flex-1 justify-center">Criar</Btn>
          <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
        </div>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// FORECAST HELPERS (pure functions, defined outside any component)
// ─────────────────────────────────────────────
const FC_YEAR = 2025;
const fcGetEntry  = (entries, clientId, month) => entries.find(f => f.clientId===clientId && f.month===month && f.year===FC_YEAR) || null;
const fcCalcFat   = e => (e?.volumetria||0)*(e?.ticketMedio||0);           // faturamento bruto (só informativo)
const fcCalcCLT   = e => (e?.maoObraCLTBase||0)*1.7;
const fcCalcCost  = e => (e?.fretePrevisto||0)+(e?.maoObraTercPrevisto||0)+fcCalcCLT(e)+(e?.cgcPrevisto||0);
const fcCalcCom   = e => fcCalcFat(e)*((e?.comissaoPercent||0)/100);        // comissão = BASE de tudo
const fcCalcImp   = e => fcCalcCom(e)*((e?.impostoPercent||0)/100);         // imposto SOBRE comissão
const fcCalcSaldo = e => fcCalcCom(e)-fcCalcCost(e)-fcCalcImp(e);          // saldo = comissão - custos - impostos
// Fat. Jadlog comissão real por cliente/mês (usa CNPJ do cliente)
const fcGetFatReal = (revenues, clientId, month, faturamentosJadlog, clients, acrescimos) => {
  // From Jadlog
  const cl = (clients||[]).find(c=>c.id===clientId);
  let jadlogTotal = 0;
  const clLista = Array.isArray(cl?.cnpjs) && cl.cnpjs.length > 0
    ? cl.cnpjs
    : (cl?.cnpj ? [cl.cnpj] : []);
  if (clLista.length > 0 && faturamentosJadlog?.length) {
    const cnpjs = clLista.map(x => String(x).replace(/\D/g,"").replace(/^0+/,""));
    jadlogTotal = faturamentosJadlog.flatMap(b=>b.rows).filter(r=>{
      if (r.mes !== month || r.ano !== FC_YEAR) return false;
      return cnpjs.includes(r.cnpj.replace(/^0+/,""));
    }).reduce((s,r)=>s+r.comissao, 0);
  }
  // Plus manual acrescimos (positive adjustments)
  const acrescimoTotal = (acrescimos||[])
    .filter(a=>a.clientId===clientId&&a.month===month&&a.year===FC_YEAR)
    .reduce((s,a)=>s+a.value, 0);
  return jadlogTotal + acrescimoTotal;
};

// ─────────────────────────────────────────────
// FORECAST — stable helpers at module level (never recreated)
// ─────────────────────────────────────────────
function fcUpsert(setForecastEntries, clientId, month, updates) {
  setForecastEntries(prev => {
    const idx = prev.findIndex(f => f.clientId===clientId && f.month===month && f.year===FC_YEAR);
    if (idx >= 0) return prev.map((f,i) => i===idx ? {...f,...updates} : f);
    return [...prev, { id:uid(), clientId, month, year:FC_YEAR, volumetria:0, ticketMedio:0, comissaoPercent:5, impostoPercent:8.65, fretePrevisto:0, maoObraTercPrevisto:0, maoObraCLTBase:0, cgcPrevisto:0, growthRate:0, volumetriaRealizada:null, observacao:"", ...updates }];
  });
}

// Fully uncontrolled number input — stable component type, never causes remount of siblings
function FcNumField({ label, clientId, month, field, defaultVal, setFE, prefix="", suffix="", step="1" }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-slate-400">{label}</label>
      <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg overflow-hidden focus-within:border-red-500">
        {prefix && <span className="text-xs text-slate-500 px-2 flex-shrink-0">{prefix}</span>}
        <input
          type="number" step={step}
          defaultValue={defaultVal ?? ""}
          key={""+(clientId)+"-"+(month)+"-"+(field)+""}
          onBlur={ev  => fcUpsert(setFE, clientId, month, { [field]: Number(ev.target.value) })}
          className="flex-1 bg-transparent px-2 py-2 text-sm text-slate-100 focus:outline-none min-w-0 w-full"
        />
        {suffix && <span className="text-xs text-slate-500 px-2 flex-shrink-0">{suffix}</span>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// FORECAST — PREVISAO TAB
// ─────────────────────────────────────────────
function PrevisaoTab({ clients, revenues, forecastEntries, setForecastEntries, filterMonth, propagateGrowth, faturamentosJadlog, acrescimos }) {
  const [expanded, setExpanded] = useState(clients[0]?.id || null);

  return (
    <div className="space-y-4">
      {clients.filter(c => c.active).map(cl => {
        const e = fcGetEntry(forecastEntries, cl.id, filterMonth);
        const fat = fcCalcFat(e);
        const fatReal = fcGetFatReal(revenues, cl.id, filterMonth, faturamentosJadlog, clients, acrescimos);
        const isOpen = expanded === cl.id;
        return (
          <Card key={cl.id} className={"overflow-hidden transition-all "+(isOpen ? "border-amber-500/30" : "")+""}>
            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-700/30 transition-all"
              onClick={() => setExpanded(isOpen ? null : cl.id)}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-700 flex items-center justify-center font-bold text-blue-400 text-xs">{cl.code}</div>
                <div>
                  <p className="font-semibold text-slate-100 text-sm">{cl.name}</p>
                  <div className="flex gap-3 mt-0.5 flex-wrap">
                    <span className="text-xs text-slate-400">Prev: <span className="text-amber-400 font-semibold">{fmt(fat)}</span></span>
                    {fatReal > 0 && <span className="text-xs text-slate-400">Real: <span className={"font-semibold "+(fatReal >= fat ? "text-emerald-400" : "text-red-400")+""}>{fmt(fatReal)}</span></span>}
                    {e?.growthRate ? <span className="text-xs text-slate-500">+{e.growthRate}%/mês</span> : null}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {fat > 0 && <Badge color={fatReal >= fat ? "#10b981" : fatReal > 0 ? "#f59e0b" : "#64748b"}>{fatReal > 0 ? (fatReal >= fat ? "✓ Meta" : ""+(((fatReal/fat)*100).toFixed(0))+"%") : "Sem real."}</Badge>}
                <ChevronDown size={16} className={"text-slate-400 transition-transform "+(isOpen ? "rotate-180" : "")+""}/>
              </div>
            </div>
            {isOpen && (
              <div className="border-t border-slate-700 p-4 space-y-5">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Receita Prevista</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <FcNumField label="Volumetria Prevista" clientId={cl.id} month={filterMonth} field="volumetria" defaultVal={e?.volumetria} setFE={setForecastEntries} suffix="un"/>
                    <FcNumField label="Ticket Médio (R$)" clientId={cl.id} month={filterMonth} field="ticketMedio" defaultVal={e?.ticketMedio} setFE={setForecastEntries} prefix="R$" step="0.01"/>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-slate-400">Faturamento Previsto</label>
                      <div className="bg-slate-900 border border-emerald-500/30 rounded-lg px-3 py-2"><p className="text-sm font-bold text-emerald-400">{fmt(fat)}</p></div>
                    </div>
                    <FcNumField label="% Crescimento/mês" clientId={cl.id} month={filterMonth} field="growthRate" defaultVal={e?.growthRate} setFE={setForecastEntries} suffix="%" step="0.1"/>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FcNumField label="% Comissão" clientId={cl.id} month={filterMonth} field="comissaoPercent" defaultVal={e?.comissaoPercent} setFE={setForecastEntries} suffix="%" step="0.01"/>
                    <FcNumField label="% Imposto" clientId={cl.id} month={filterMonth} field="impostoPercent" defaultVal={e?.impostoPercent} setFE={setForecastEntries} suffix="%" step="0.01"/>
                  </div>
                  {fat > 0 && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="bg-slate-900 rounded-lg px-3 py-2 border border-slate-700 text-xs"><span className="text-slate-400">Comissão: </span><span className="text-amber-400 font-semibold">{fmt(fcCalcCom(e))}</span></div>
                      <div className="bg-slate-900 rounded-lg px-3 py-2 border border-slate-700 text-xs"><span className="text-slate-400">Imposto: </span><span className="text-red-400 font-semibold">{fmt(fcCalcImp(e))}</span></div>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Custos Previstos</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <FcNumField label="Frete" clientId={cl.id} month={filterMonth} field="fretePrevisto" defaultVal={e?.fretePrevisto} setFE={setForecastEntries} prefix="R$"/>
                    <FcNumField label="MO Terceirizada" clientId={cl.id} month={filterMonth} field="maoObraTercPrevisto" defaultVal={e?.maoObraTercPrevisto} setFE={setForecastEntries} prefix="R$"/>
                    <div className="space-y-1">
                      <FcNumField label="MO CLT — salário base" clientId={cl.id} month={filterMonth} field="maoObraCLTBase" defaultVal={e?.maoObraCLTBase} setFE={setForecastEntries} prefix="R$"/>
                      {(e?.maoObraCLTBase||0) > 0 && <p className="text-xs text-amber-400/70">c/ encargos (×1.7): {fmt(fcCalcCLT(e))}</p>}
                    </div>
                    <FcNumField label="CGC (custos gerais)" clientId={cl.id} month={filterMonth} field="cgcPrevisto" defaultVal={e?.cgcPrevisto} setFE={setForecastEntries} prefix="R$"/>
                  </div>
                  {fcCalcCost(e) > 0 && (
                    <div className="mt-2 bg-slate-900 rounded-lg px-3 py-2 border border-slate-700 flex gap-4 flex-wrap">
                      <span className="text-xs text-slate-400">Custo total: <span className="text-red-400 font-bold">{fmt(fcCalcCost(e))}</span></span>
                      <span className="text-xs text-slate-400">Saldo previsto: <span className={"font-bold "+(fcCalcSaldo(e)>=0?"text-emerald-400":"text-red-400")+""}>{fmt(fcCalcSaldo(e))}</span></span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Realizado</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-slate-400">Volumetria Realizada (opcional)</label>
                      <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg overflow-hidden focus-within:border-red-500">
                        <input type="number" defaultValue={e?.volumetriaRealizada ?? ""} key={""+(cl.id)+"-"+(filterMonth)+"-volReal"} placeholder="Vazio = usa previsto"
                          onBlur={ev => fcUpsert(setForecastEntries, cl.id, filterMonth, { volumetriaRealizada: ev.target.value===""?null:Number(ev.target.value) })}
                          className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-100 focus:outline-none placeholder-slate-600"/>
                        <span className="text-xs text-slate-500 px-2">un</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-slate-400">Faturamento Realizado</label>
                      <div className="bg-slate-900 border border-blue-500/30 rounded-lg px-3 py-2">
                        <p className="text-sm font-bold text-blue-400">{fatReal > 0 ? fmt(fatReal) : "— (usar previsto)"}</p>
                        <p className="text-xs text-slate-500">dos lançamentos de faturamento</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                  <div>
                    <p className="text-sm font-semibold text-slate-300">Propagar crescimento para próximos meses</p>
                    <p className="text-xs text-slate-500">De {MONTHS_SHORT[filterMonth-1]} até Dezembro</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1">
                      <input
                        type="number" step="0.5" min="-100" max="100"
                        defaultValue={e?.growthRate??0}
                        key={"gr-"+(cl.id)+"-"+(filterMonth)+""}
                        onBlur={ev => fcUpsert(setForecastEntries, cl.id, filterMonth, { growthRate: Number(ev.target.value) })}
                        className="w-12 bg-transparent text-sm text-amber-400 font-bold text-center focus:outline-none"
                      />
                      <span className="text-xs text-slate-400">%/mês</span>
                    </div>
                    <Btn variant="secondary" size="sm" onClick={() => propagateGrowth(cl.id, filterMonth)} disabled={!e}>
                      <RefreshCw size={13}/> Propagar
                    </Btn>
                  </div>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function ResultadoTab({ clients, revenues, forecastEntries, setForecastEntries, filterMonth, faturamentosJadlog, acrescimos }) {
  const upsertObs = (clientId, obs) => {
    setForecastEntries(prev => {
      const idx = prev.findIndex(f => f.clientId===clientId && f.month===filterMonth && f.year===FC_YEAR);
      if (idx >= 0) return prev.map((f,i) => i===idx ? {...f,observacao:obs} : f);
      return prev;
    });
  };
  const rows = clients.filter(c=>c.active).map(cl => {
    const e = fcGetEntry(forecastEntries, cl.id, filterMonth);
    const fatReal = fcGetFatReal(revenues, cl.id, filterMonth, faturamentosJadlog, clients, acrescimos);
    const fat = fatReal > 0 ? fatReal : fcCalcFat(e);
    const fatSrc = fatReal > 0 ? "real" : "prev";
    const fatPrev = fcCalcFat(e);
    const desvio = fatPrev > 0 ? ((fatReal - fatPrev) / fatPrev * 100) : null;
    const volReal = e?.volumetriaRealizada;
    const vol = volReal != null ? volReal : (e?.volumetria||0);
    const volSrc = volReal != null ? "real" : "prev";
    const custos   = fcCalcCost(e);
    const imposto  = fat * ((e?.impostoPercent||0)/100);   // imposto sobre comissão realizada
    const saldo    = fat - custos - imposto;               // saldo = comissão - custos - impostos
    return { cl, e, fat, fatSrc, fatPrev, desvio, vol, volSrc, custos, imposto, saldo };
  });
  const totals = rows.reduce((a,r) => ({ fat:a.fat+r.fat, fatPrev:a.fatPrev+r.fatPrev, custos:a.custos+r.custos, imposto:a.imposto+r.imposto, saldo:a.saldo+r.saldo }), { fat:0, fatPrev:0, custos:0, imposto:0, saldo:0 });
  const SrcBadge = ({ src }) => <span className={"text-xs ml-1 font-bold "+(src==="real"?"text-emerald-400":"text-amber-400/70")+""}>{src==="real"?"R":"P"}</span>;
  return (
    <div className="space-y-5">
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2 text-xs text-emerald-300">
        ✅ <strong>Realizado</strong> = Comissão Fat. Jadlog + Acréscimos avulsos. <span className="text-emerald-400 font-bold">R</span> = Realizado &nbsp;·&nbsp; <span className="text-amber-400/70 font-bold">P</span> = Previsto
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Comissão Real" value={fmt(totals.fat)} icon={Wallet} color="#10b981"/>
        <KpiCard label="Previsto" value={fmt(totals.fatPrev)} icon={BarChart2} color="#f59e0b"/>
        <KpiCard label="Custos" value={fmt(totals.custos)} icon={DollarSign} color="#ef4444"/>
        <KpiCard label="Impostos (s/com.)" value={fmt(totals.imposto)} icon={FileText} color="#8b5cf6"/>
        <KpiCard label="Saldo" value={fmt(totals.saldo)} icon={TrendingUp} color={totals.saldo>=0?"#10b981":"#ef4444"}/>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-700">
              {["Cliente","Volume","Comissão Real","Previsto","Desvio","Custos","Imposto (s/com.)","Saldo","Observação"].map(h=>(
                <th key={h} className="text-left text-xs font-semibold text-slate-400 px-4 py-3 whitespace-nowrap">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {rows.map(({cl,e,fat,fatSrc,fatPrev,desvio,vol,volSrc,custos,imposto,saldo})=>(
                <tr key={cl.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 align-top">
                  <td className="px-4 py-3 font-semibold text-slate-100 whitespace-nowrap">{cl.name}</td>
                  <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{vol.toLocaleString("pt-BR")}<SrcBadge src={volSrc}/></td>
                  <td className="px-4 py-3 text-emerald-400 font-semibold whitespace-nowrap">{fmt(fat)}<SrcBadge src={fatSrc}/></td>
                  <td className="px-4 py-3 text-amber-400/80 whitespace-nowrap">{fmt(fatPrev)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {desvio!==null ? <span className={"text-xs font-bold px-2 py-0.5 rounded "+(desvio>=0?"bg-emerald-500/20 text-emerald-400":"bg-red-500/20 text-red-400")+""}>{desvio>=0?"+":""}{desvio.toFixed(1)}%</span> : <span className="text-slate-600 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-red-400 whitespace-nowrap">{fmt(custos)}</td>
                  <td className="px-4 py-3 text-purple-400 whitespace-nowrap">{fmt(imposto)}</td>
                  <td className={"px-4 py-3 font-bold whitespace-nowrap "+(saldo>=0?"text-emerald-400":"text-red-400")+""}>{fmt(saldo)}</td>
                  <td className="px-4 py-3 min-w-[200px]">
                    <input defaultValue={e?.observacao||""} key={"obs-"+(cl.id)+"-"+(filterMonth)+""}
                      onBlur={ev=>upsertObs(cl.id,ev.target.value)}
                      placeholder="Observações / ações..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500"/>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr className="bg-slate-700/30">
              <td className="px-4 py-3 font-bold text-slate-200" colSpan={2}>TOTAL</td>
              <td className="px-4 py-3 text-emerald-400 font-bold">{fmt(totals.fat)}</td>
              <td className="px-4 py-3 text-amber-400/80 font-bold">{fmt(totals.fatPrev)}</td>
              <td className="px-4 py-3 font-bold">
                {totals.fatPrev>0&&<span className={"text-xs font-bold px-2 py-0.5 rounded "+(totals.fat>=totals.fatPrev?"bg-emerald-500/20 text-emerald-400":"bg-red-500/20 text-red-400")+""}>{totals.fat>=totals.fatPrev?"+":""}{((totals.fat-totals.fatPrev)/totals.fatPrev*100).toFixed(1)}%</span>}
              </td>
              <td className="px-4 py-3 text-red-400 font-bold">{fmt(totals.custos)}</td>
              <td className="px-4 py-3 text-purple-400 font-bold">{fmt(totals.imposto)}</td>
              <td className={"px-4 py-3 font-bold text-lg "+(totals.saldo>=0?"text-emerald-400":"text-red-400")+""}>{fmt(totals.saldo)}</td>
              <td className="px-4 py-3"/>
            </tr></tfoot>
          </table>
        </div>
      </Card>
      <Card className="p-5">
        <h3 className="text-sm font-bold text-slate-300 mb-4">Previsto × Realizado (Fat. Jadlog) — {MONTHS_SHORT[filterMonth-1]}</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={rows.map(r=>({name:r.cl.code,Previsto:r.fatPrev||null,Realizado:r.fat>0&&r.fatSrc==="real"?r.fat:null,Saldo:r.saldo}))} barSize={20}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
            <XAxis dataKey="name" stroke="#64748b" tick={{fill:"#94a3b8",fontSize:12}}/>
            <YAxis stroke="#64748b" tick={{fill:"#94a3b8",fontSize:11}} tickFormatter={v=>""+((v/1000).toFixed(0))+"k"}/>
            <Tooltip contentStyle={{background:"#1e293b",border:"1px solid #334155",borderRadius:8}} formatter={v=>v?fmt(v):"—"}/>
            <Legend wrapperStyle={{fontSize:11,color:"#94a3b8"}}/>
            <Bar dataKey="Previsto" fill="#f59e0b" radius={[4,4,0,0]}/>
            <Bar dataKey="Realizado" fill="#10b981" radius={[4,4,0,0]}/>
            <Bar dataKey="Saldo" fill="#60a5fa" radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

function ForecastView({ clients, revenues, forecastEntries, setForecastEntries, faturamentosJadlog, acrescimos }) {
  const [subTab, setSubTab] = useState("previsao");
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth()+1);

  const propagateGrowth = (clientId, fromMonth) => {
    const base = fcGetEntry(forecastEntries, clientId, fromMonth);
    if (!base) return;
    let prev = base;
    const updates = [];
    for (let m = fromMonth + 1; m <= 12; m++) {
      const rate = 1 + (prev.growthRate||0)/100;
      const next = { volumetria:Math.round((prev.volumetria||0)*rate), ticketMedio:prev.ticketMedio, comissaoPercent:prev.comissaoPercent, impostoPercent:prev.impostoPercent, fretePrevisto:Math.round((prev.fretePrevisto||0)*rate), maoObraTercPrevisto:Math.round((prev.maoObraTercPrevisto||0)*rate), maoObraCLTBase:Math.round((prev.maoObraCLTBase||0)*rate), cgcPrevisto:Math.round((prev.cgcPrevisto||0)*rate), growthRate:prev.growthRate, volumetriaRealizada:null, observacao:"" };
      updates.push({ m, data: next }); prev = { ...next };
    }
    setForecastEntries(prevList => {
      let list = [...prevList];
      for (const { m, data } of updates) {
        const idx = list.findIndex(f => f.clientId===clientId && f.month===m && f.year===FC_YEAR);
        if (idx >= 0) list = list.map((f,i) => i===idx ? {...f,...data} : f);
        else list = [...list, { id:uid(), clientId, month:m, year:FC_YEAR, ...data }];
      }
      return list;
    });
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Forecast</h1>
          <p className="text-sm text-slate-400">Previsão de receita, custos e resultado por cliente</p>
        </div>
        <Sel value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))}>
          {MONTHS_SHORT.map((m, i) => <option key={i} value={i + 1}>{m} {FC_YEAR}</option>)}
        </Sel>
      </div>
      <div className="flex gap-2">
        {[["previsao","📋 Previsão"],["resultado","📊 Previsto × Realizado"]].map(([v,l]) => (
          <button key={v} onClick={() => setSubTab(v)}
            className={"text-sm px-4 py-2 rounded-lg font-semibold border transition-all "+(subTab===v?"bg-red-600 text-white border-red-600":"bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500")+""}>
            {l}
          </button>
        ))}
      </div>
      {subTab==="previsao" && <PrevisaoTab clients={clients} revenues={revenues} forecastEntries={forecastEntries} setForecastEntries={setForecastEntries} filterMonth={filterMonth} propagateGrowth={propagateGrowth} faturamentosJadlog={faturamentosJadlog} acrescimos={acrescimos}/>}
      {subTab==="resultado" && <ResultadoTab clients={clients} revenues={revenues} forecastEntries={forecastEntries} setForecastEntries={setForecastEntries} filterMonth={filterMonth} faturamentosJadlog={faturamentosJadlog} acrescimos={acrescimos}/>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MÓDULO: FECHAMENTO DE ENTREGAS
// ═══════════════════════════════════════════════════════
// MÓDULO FECHAMENTO — reescrito limpo
// ═══════════════════════════════════════════════════════

// ── Cálculo central ─────────────────────────────────────
function calcFechamento(linhas, motoristas) {
  const grupos = {};
  linhas.forEach(l => {
    if (!grupos[l.mat]) grupos[l.mat] = { mat: l.mat, nome: l.nome, rows: [] };
    grupos[l.mat].rows.push(l);
  });
  const ok = [], nok = [];
  Object.values(grupos).forEach(g => {
    const m = motoristas.find(x => x.matricula === g.mat && x.ativo);
    if (!m) {
      const entrNok = g.rows.filter(r => r.evento === "entrega" && r.ncte && !r._duplicado);
      nok.push({
        mat: g.mat, nome: g.nome,
        totalCTEs: entrNok.length,
        totalFaturado: entrNok.reduce((s,r)=>s+(r.valorFaturado||0),0),
        entregas: entrNok.map(r=>({ ncte:r.ncte, data:r.data, valorFaturado:r.valorFaturado||0 }))
      });
      return;
    }
    // Somente evento=entrega com CTE preenchido conta
    const entregas = g.rows.filter(r => r.evento === "entrega" && r.ncte && !r._duplicado);
    const totalCTEs_entregues = entregas.length; // número de CTEs únicos entregues
    const totalPacotes = entregas.reduce((s, r) => s + r.qPacotes, 0);
    // Dias únicos trabalhados = datas distintas dos CTEs
    const diasUnicos = new Set(g.rows.map(r => r.data).filter(Boolean)).size || 1;

    // Valor por CTE (campo valorCTE no cadastro, com fallback para valorPacote legado)
    const valorPorCTE = m.valorCTE || m.valorPacote || 0;

    let vDiaria = 0, vCTEs = 0, excedente = null;
    if (m.tipoPagamento === "diaria") {
      vDiaria = diasUnicos * m.valorDiaria;
    } else if (m.tipoPagamento === "pacote" || m.tipoPagamento === "cte") {
      vCTEs = totalCTEs_entregues * valorPorCTE;
    } else if (m.tipoPagamento === "ambos") {
      vDiaria = diasUnicos * m.valorDiaria;
      vCTEs = totalCTEs_entregues * valorPorCTE;
    } else if (m.tipoPagamento === "diaria_excedente") {
      vDiaria = diasUnicos * m.valorDiaria;
      excedente = Math.max(0, totalCTEs_entregues - (m.minimoCTEs || m.minimoPackotes || 0));
      vCTEs = excedente * valorPorCTE;
    } else if (m.tipoPagamento === "diaria_por_dia") {
      // diasDiaria: array of DOW numbers (0=dom,1=seg,...,6=sab) that are paid as daily rate
      // remaining days of week are paid per CTE
      const diasDiaria = m.diasDiaria || []; // e.g. [1,2,3,4,5] = seg to sex
      const diasCTE    = [0,1,2,3,4,5,6].filter(d => !diasDiaria.includes(d));
      // Parse each entrega date to DOW
      const getDOW = (dataStr) => {
        if (!dataStr) return -1;
        // format DD/MM/YYYY
        const p = dataStr.split("/");
        if (p.length === 3) {
          const d = new Date(""+(p[2])+"-"+(p[1].padStart(2,"0"))+"-"+(p[0].padStart(2,"0"))+"T12:00:00");
          return isNaN(d) ? -1 : d.getDay();
        }
        return -1;
      };
      // Dias únicos onde o motorista trabalhou em dias de diária
      const diasComDiaria = new Set(
        g.rows.filter(r => diasDiaria.includes(getDOW(r.data))).map(r => r.data).filter(Boolean)
      );
      // CTEs entregues em dias de CTE
      const ctesDiasCTE = entregas.filter(r => diasCTE.includes(getDOW(r.data)));
      vDiaria = diasComDiaria.size * m.valorDiaria;
      vCTEs   = ctesDiasCTE.length * valorPorCTE;
    }
    ok.push({
      id: uid(),
      mat: m.matricula, nome: m.nome, email: m.email,
      tipo: m.tipoPagamento,
      diasDiaria: m.diasDiaria || [],
      valorDiaria: m.valorDiaria,
      valorCTE: valorPorCTE,
      valorPacote: valorPorCTE, // keep for legacy compat
      minimo: m.minimoCTEs || m.minimoPackotes || 0,
      totalCTEs: totalCTEs_entregues,
      totalPacotes, // kept for display
      diasUnicos,
      entregas: entregas.map(r => ({ ncte: r.ncte, qPacotes: r.qPacotes, data: r.data, valorFaturado: r.valorFaturado || 0 })),
      totalFaturado: entregas.reduce((s,r) => s + (r.valorFaturado||0), 0),
      excedente,
      vDiaria,
      vPacotes: vCTEs, // keep field name for compat
      vCTEs,
      subtotal: vDiaria + vCTEs,
      correcoes: [], totalBruto: vDiaria + vCTEs,
      etapa: "op",   // op → gest → fin → agr → pago | revisao_op
      statusAgr: "pendente", comentarioAgr: "", nf: null,
      statusGest: null, comentarioGest: null,
      dataPagMot: null, comprovanteMot: null,
    });
  });
  return { ok, nok, totalFaturadoNok: nok.reduce((s,n)=>s+(n.totalFaturado||0),0) };
}

// ── Status ───────────────────────────────────────────────
const FS = {
  op:          { label: "Geração Operacional",   cor: "#3b82f6" },
  gest:        { label: "Aguard. Gestor",         cor: "#f59e0b" },
  fin:         { label: "Revisão Financeiro",     cor: "#06b6d4" },
  agr:         { label: "Aguard. Agregado",       cor: "#8b5cf6" },
  revisao_op:  { label: "Contestado",             cor: "#dc2626" },
  pago:        { label: "Pago ✓",                cor: "#10b981" },
};

// Etapa labels per motorista
const MOT_ETAPA = {
  op:         { label: "Geração Operacional", cor: "#3b82f6" },
  gest:       { label: "Aguard. Gestor",      cor: "#f59e0b" },
  fin:        { label: "Revisão Financeiro",  cor: "#06b6d4" },
  agr:        { label: "Disponível ao Agregado", cor: "#8b5cf6" },
  revisao_op: { label: "Contestado",          cor: "#dc2626" },
  pago:       { label: "Pago ✓",             cor: "#10b981" },
};

// ── Exportar CSV ─────────────────────────────────────────
function exportarCSV(fec) {
  const hasFat = fec.mots.some(c => (c.totalFaturado||0) > 0);
  const rows = [[
    "Motorista","Matrícula","Tipo Pagamento","CTEs Entregues","Dias Trabalhados",
    "Diária (R$)","CTEs (R$)","Correções (R$)","Total Pago (R$)",
    ...(hasFat ? ["Total Faturado (R$)","Saldo (R$)","Margem %"] : []),
    "Status"
  ]];
  fec.mots.forEach(c => {
    const fat  = c.totalFaturado || 0;
    const pago = c.totalBruto;
    const sal  = fat - pago;
    const marg = fat > 0 ? ((sal/fat)*100).toFixed(1) : "";
    rows.push([
      c.nome, c.mat, c.tipo,
      c.totalCTEs, c.diasUnicos||1,
      c.diasUnicos || 1,
      c.vDiaria.toFixed(2).replace(".",","),
      (c.vCTEs||c.vPacotes||0).toFixed(2).replace(".",","),
      (c.totalBruto - c.subtotal).toFixed(2).replace(".",","),
      pago.toFixed(2).replace(".",","),
      ...(hasFat ? [fat.toFixed(2).replace(".",","), sal.toFixed(2).replace(".",","), marg] : []),
      c.etapa === "pago" ? "Pago" : c.statusAgr === "aprovado" ? "Aprovado" : c.statusAgr === "rejeitado" ? "Rejeitado" : "Pendente",
    ]);
  });

  // Per-CTE detail sheet if has faturado
  if (hasFat) {
    rows.push([]); rows.push(["— DETALHE POR CTE —"]);
    rows.push(["Motorista","Matrícula","Nº CTE","Data","Val. Faturado (R$)","Val. Pago Est. (R$)","Saldo (R$)"]);
    fec.mots.forEach(c => {
      c.entregas?.forEach(e => {
        const vPago = (c.vPacotes > 0 && c.totalPacotes > 0) ? (e.qPacotes / c.totalPacotes) * c.vPacotes : 0;
        const eSaldo = (e.valorFaturado||0) - vPago;
        rows.push([c.nome, c.mat, e.ncte, e.data, e.qPacotes,
          (e.valorFaturado||0).toFixed(2).replace(".",","),
          vPago.toFixed(2).replace(".",","),
          eSaldo.toFixed(2).replace(".",",")
        ]);
      });
    });
  }

  rows.push([]);
  rows.push([
    "TOTAL","","","",
    fec.mots.reduce((s,c)=>s+c.totalCTEs,0),
    fec.mots.reduce((s,c)=>s+(c.diasUnicos||1),0),
    fec.mots.reduce((s,c)=>s+c.vDiaria,0).toFixed(2).replace(".",","),
    fec.mots.reduce((s,c)=>s+c.vPacotes,0).toFixed(2).replace(".",","),
    fec.mots.reduce((s,c)=>s+(c.totalBruto-c.subtotal),0).toFixed(2).replace(".",","),
    fec.mots.reduce((s,c)=>s+c.totalBruto,0).toFixed(2).replace(".",","),
    ...(hasFat ? [
      fec.mots.reduce((s,c)=>s+(c.totalFaturado||0),0).toFixed(2).replace(".",","),
      (fec.mots.reduce((s,c)=>s+(c.totalFaturado||0),0)-fec.mots.reduce((s,c)=>s+c.totalBruto,0)).toFixed(2).replace(".",","),
      ""
    ] : []),
    "",
  ]);

  const csv = "\uFEFF" + rows.map(r =>
    r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(";")
  ).join("\n");

  const a = document.createElement("a");
  a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
  a.download = "fechamento_"+(fec.periodo.replace(/[^a-zA-Z0-9-]/g,"_"))+".csv";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => document.body.removeChild(a), 100);
}

// ── Motoristas ───────────────────────────────────────────
function MotoristasView({ motoristas, setMotoristas }) {
  const [edit, setEdit] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const save = m => {
    if (edit) { setMotoristas(p => p.map(x => x.id === edit.id ? { ...x, ...m } : x)); setEdit(null); }
    else { setMotoristas(p => [...p, { ...m, id: uid(), ativo: true }]); setShowNew(false); }
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <MotoristasBulkImportBtn setMotoristas={setMotoristas}/>
        <Btn onClick={() => setShowNew(true)}><Plus size={14} />Novo Motorista</Btn>
      </div>
      {motoristas.map(m => (
        <Card key={m.id} className={"p-4 "+(!m.ativo ? "opacity-50" : "")+""}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-slate-100">{m.nome}</p>
                <Badge color="#60a5fa">Mat: {m.matricula}</Badge>
                <Badge color={m.ativo ? "#10b981" : "#64748b"}>{m.ativo ? "Ativo" : "Inativo"}</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{m.email}{m.telefone ? " · "+(m.telefone)+"" : ""}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <p className="text-xs text-slate-500">Código portal:</p>
                <code className="text-xs font-mono text-red-400 bg-red-500/10 border border-amber-500/20 rounded px-2 py-0.5 select-all tracking-wider">{m.codigoAcesso || "—"}</code>
              </div>
              <div className="flex gap-2 mt-1.5 flex-wrap">
                {m.chavePix && <span className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded px-2 py-0.5">PIX: {m.chavePix}</span>}
                {m.banco && <span className="text-xs bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded px-2 py-0.5">{m.banco} · Ag {m.agencia} · Cc {m.conta}</span>}
                {m.contrato && <span className="text-xs bg-slate-700 border border-slate-600 text-slate-300 rounded px-2 py-0.5 flex items-center gap-1"><FileText size={10}/>Contrato</span>}
              </div>
              <div className="flex gap-2 mt-1 flex-wrap text-xs">
                {(m.tipoPagamento === "diaria" || m.tipoPagamento === "ambos") && <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded px-2 py-0.5">Diária: {fmt(m.valorDiaria)}</span>}
                {(m.tipoPagamento === "pacote" || m.tipoPagamento === "ambos") && <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded px-2 py-0.5">Pacote: {fmt(m.valorPacote)}</span>}
                {m.tipoPagamento === "diaria_excedente" && <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded px-2 py-0.5">Diária {fmt(m.valorDiaria)} + excedente acima de {m.minimoPackotes} pcts × {fmt(m.valorPacote)}</span>}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Btn variant="secondary" size="sm" onClick={() => setEdit(m)}><Edit2 size={12} /></Btn>
              <button onClick={() => setMotoristas(p => p.map(x => x.id === m.id ? { ...x, ativo: !x.ativo } : x))}
                className={"text-xs px-2 py-1 rounded border font-semibold "+(m.ativo ? "border-red-500/30 text-red-400" : "border-emerald-500/30 text-emerald-400")+""}>
                {m.ativo ? "Desativar" : "Ativar"}
              </button>
              <button onClick={() => setMotoristas(p => p.filter(x => x.id !== m.id))} className="text-slate-600 hover:text-red-400 p-1"><Trash2 size={13} /></button>
            </div>
          </div>
        </Card>
      ))}
      {motoristas.length === 0 && <p className="text-center text-slate-500 py-8 text-sm">Nenhum motorista cadastrado.</p>}
      {(showNew || edit) && <MotoristaModal initial={edit} onClose={() => { setShowNew(false); setEdit(null); }} onSave={save} />}
    </div>
  );
}

function MotoristaModal({ initial, onClose, onSave }) {
  const genCode = (nome, mat) => {
    const init = nome.trim().split(" ").slice(0,3).map(w=>w[0]?.toUpperCase()||"X").join("");
    const num = mat ? mat.slice(-4) : Math.floor(1000+Math.random()*9000).toString();
    return "AGR-"+(init.padEnd(3,"X"))+"-"+(num)+"";
  };
  const [f, sf_] = useState(() => {
    if (initial) return {...initial, diasDiaria: initial.diasDiaria || [1,2,3,4,5]};
    return {
      nome:"", matricula:"", email:"", cpf:"", telefone:"",
      tipoPagamento:"pacote", valorDiaria:0, valorPacote:0, minimoPackotes:0,
      diasDiaria:[1,2,3,4,5], // seg-sex por padrão
      codigoAcesso:"",
      chavePix:"", tipoChavePix:"cpf",
      banco:"", agencia:"", conta:"", tipoConta:"corrente",
      contrato: null,
    };
  });
  const sf = (k, v) => {
    sf_(p => {
      const upd = { ...p, [k]: v };
      if (!initial && (k === "nome" || k === "matricula"))
        upd.codigoAcesso = genCode(k==="nome"?v:upd.nome, k==="matricula"?v:upd.matricula);
      return upd;
    });
  };
  const [tab, setTab] = useState("dados"); // dados | pagamento | financeiro | contrato
  const contratoRef = useRef();
  const showD = ["diaria","ambos","diaria_excedente","diaria_por_dia"].includes(f.tipoPagamento);
  const showP = ["pacote","ambos","diaria_excedente","diaria_por_dia"].includes(f.tipoPagamento);
  const showDias = f.tipoPagamento === "diaria_por_dia";
  const prev  = f.tipoPagamento==="diaria_excedente" && f.minimoPackotes>0
    ? "Ex: fez "+(Number(f.minimoPackotes)+10)+" pcts → "+(fmt(f.valorDiaria))+" + (10×"+(fmt(f.valorPacote))+") = "+(fmt(Number(f.valorDiaria)+10*Number(f.valorPacote)))+""
    : null;
  const handleContrato = async e => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 10*1024*1024) { alert("Arquivo muito grande. Máx 10MB."); return; }
    const data = await readFileAsBase64(file);
    sf("contrato", { nome: file.name, tipo: file.type, data, dataUpload: now() });
  };

  const TABS = [["dados","👤 Dados"],["pagamento","💰 Pagamento"],["financeiro","🏦 Financeiro"],["contrato","📄 Contrato"]];

  return (
    <Modal title={initial ? "Editar Motorista" : "Novo Motorista"} onClose={onClose} wide>
      {/* Sub-tabs */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {TABS.map(([v,l]) => (
          <button key={v} type="button" onClick={() => setTab(v)}
            className={"text-xs px-3 py-1.5 rounded-full font-semibold border transition-all "+(tab===v?"bg-red-600 text-white border-red-600":"bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500")+""}>
            {l}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {/* ── DADOS BÁSICOS ── */}
        {tab === "dados" && (<>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nome Completo *" value={f.nome} onChange={e => sf("nome", e.target.value)} />
            <Input label="Matrícula *" value={f.matricula} onChange={e => sf("matricula", e.target.value)} placeholder="Ex: 135742" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="E-mail *" type="email" value={f.email} onChange={e => sf("email", e.target.value)} />
            <Input label="CPF" value={f.cpf} onChange={e => sf("cpf", e.target.value)} placeholder="000.000.000-00" />
          </div>
          <Input label="Telefone / WhatsApp" value={f.telefone||""} onChange={e => sf("telefone", e.target.value)} placeholder="(27) 99999-9999" />
          {/* Código de acesso */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 space-y-2">
            <p className="text-xs font-semibold text-amber-400">Código de Acesso ao Portal</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm font-mono text-amber-300 bg-slate-900 border border-amber-500/30 rounded px-3 py-2 tracking-wider">{f.codigoAcesso || "—"}</code>
              <button type="button" onClick={() => sf_((p) => ({...p, codigoAcesso: "AGR-"+((p.nome||"XXX").trim().split(" ").slice(0,3).map(w=>w[0]?.toUpperCase()||"X").join("").padEnd(3,"X"))+"-"+(Math.floor(1000+Math.random()*9000))+""}))}
                className="text-xs text-amber-400 hover:text-amber-300 border border-amber-500/30 rounded px-2 py-1.5 hover:bg-amber-500/10 transition-all whitespace-nowrap">
                Gerar novo
              </button>
            </div>
            <p className="text-xs text-amber-400/60">Enviado ao motorista para acessar o portal.</p>
          </div>
        </>)}

        {/* ── PAGAMENTO ── */}
        {tab === "pagamento" && (<>
          <Sel label="Tipo de Pagamento" value={f.tipoPagamento} onChange={e => sf("tipoPagamento", e.target.value)}>
            <option value="diaria">Somente Diária</option>
            <option value="pacote">Somente por CTE</option>
            <option value="ambos">Diária + Todos os CTEs</option>
            <option value="diaria_excedente">Diária + Excedente (acima do mínimo)</option>
            <option value="diaria_por_dia">Diária em dias específicos + CTE nos demais</option>
          </Sel>
          <div className="grid grid-cols-2 gap-3">
            {showD && <Input label="Valor Diária (R$)" type="number" step="0.01" value={f.valorDiaria} onChange={e => sf("valorDiaria", Number(e.target.value))} />}
            {showP && <Input label={f.tipoPagamento==="diaria_excedente"?"Valor CTE Excedente (R$)":"Valor por CTE (R$)"} type="number" step="0.01" value={f.valorCTE||f.valorPacote||0} onChange={e => { sf("valorCTE", Number(e.target.value)); sf("valorPacote", Number(e.target.value)); }} />}
            {showDias && (
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-2">Dias com <span className="text-amber-400 font-bold">Diária</span> (os demais serão por CTE)</label>
                <div className="flex gap-2 flex-wrap">
                  {[["Dom",0],["Seg",1],["Ter",2],["Qua",3],["Qui",4],["Sex",5],["Sáb",6]].map(([label,dow])=>{
                    const active = (f.diasDiaria||[]).includes(dow);
                    return (
                      <button key={dow} type="button"
                        onClick={()=>{
                          const cur = f.diasDiaria||[];
                          sf("diasDiaria", active ? cur.filter(d=>d!==dow) : [...cur,dow].sort());
                        }}
                        className={"text-xs px-3 py-1.5 rounded-lg font-semibold border transition-all "+(active?"bg-amber-500/20 text-amber-400 border-amber-500/40":"bg-slate-900 text-slate-500 border-slate-700 hover:border-slate-500")+""}>
                        {label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Dias de diária: <span className="text-amber-400">{(f.diasDiaria||[]).length}</span> &nbsp;·&nbsp;
                  Dias de CTE: <span className="text-emerald-400">{7-(f.diasDiaria||[]).length}</span>
                </p>
              </div>
            )}
          </div>
          {f.tipoPagamento === "diaria_excedente" && (
            <div>
              <Input label="Mínimo de pacotes incluídos na diária" type="number" min="0" value={f.minimoPackotes} onChange={e => sf("minimoPackotes", Number(e.target.value))} placeholder="Ex: 70" />
              {prev && <p className="text-xs text-amber-400/80 mt-1 bg-amber-500/10 border border-amber-500/20 rounded px-3 py-2">{prev}</p>}
            </div>
          )}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-300">
            Pacote somente conta CTEs com <strong>Evento = "entrega"</strong>
          </div>
        </>)}

        {/* ── DADOS FINANCEIROS ── */}
        {tab === "financeiro" && (<>
          <div className="space-y-1 mb-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chave PIX</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Sel label="Tipo de chave" value={f.tipoChavePix||"cpf"} onChange={e => sf("tipoChavePix", e.target.value)}>
              <option value="cpf">CPF</option>
              <option value="cnpj">CNPJ</option>
              <option value="email">E-mail</option>
              <option value="telefone">Telefone</option>
              <option value="aleatoria">Chave aleatória</option>
            </Sel>
            <Input label="Chave PIX" value={f.chavePix||""} onChange={e => sf("chavePix", e.target.value)}
              placeholder={f.tipoChavePix==="cpf"?"000.000.000-00":f.tipoChavePix==="telefone"?"(27) 99999-9999":"chave"} />
          </div>

          <div className="border-t border-slate-700 pt-3 mt-1 space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dados Bancários</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Banco" value={f.banco||""} onChange={e => sf("banco", e.target.value)} placeholder="Ex: Banco do Brasil, Nubank..." />
            <Sel label="Tipo de Conta" value={f.tipoConta||"corrente"} onChange={e => sf("tipoConta", e.target.value)}>
              <option value="corrente">Conta Corrente</option>
              <option value="poupanca">Conta Poupança</option>
              <option value="pagamento">Conta de Pagamento</option>
            </Sel>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Agência" value={f.agencia||""} onChange={e => sf("agencia", e.target.value)} placeholder="0000" />
            <Input label="Conta (com dígito)" value={f.conta||""} onChange={e => sf("conta", e.target.value)} placeholder="00000-0" />
          </div>
          {(f.chavePix || f.banco) && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-xs space-y-1">
              {f.chavePix && <p className="text-emerald-300"><span className="text-slate-400">PIX ({f.tipoChavePix}):</span> <span className="font-mono font-semibold">{f.chavePix}</span></p>}
              {f.banco && <p className="text-emerald-300"><span className="text-slate-400">Banco:</span> {f.banco} · {f.tipoConta === "corrente" ? "C/C" : f.tipoConta === "poupanca" ? "Poupança" : "Pagamento"} · Ag: {f.agencia} · Cc: {f.conta}</p>}
            </div>
          )}
        </>)}

        {/* ── CONTRATO ── */}
        {tab === "contrato" && (<>
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-slate-200">Contrato de Prestação de Serviços</p>
            <p className="text-xs text-slate-400">Anexe o contrato assinado com este agregado. Formatos aceitos: PDF, imagem. Máx 10MB.</p>
            {f.contrato ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <FileText size={20} className="text-emerald-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-300">{f.contrato.nome}</p>
                    <p className="text-xs text-slate-400">Anexado em {fmtDate(f.contrato.dataUpload)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => contratoRef.current?.click()}
                    className="text-xs text-blue-400 hover:text-blue-300 border border-blue-500/30 rounded px-2 py-1 hover:bg-blue-500/10 transition-all">
                    Trocar
                  </button>
                  <button type="button" onClick={() => sf("contrato", null)}
                    className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 rounded px-2 py-1 hover:bg-red-500/10 transition-all">
                    Remover
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-600 hover:border-red-500/40 rounded-xl p-6 text-center cursor-pointer transition-all"
                onClick={() => contratoRef.current?.click()}>
                <Upload size={28} className="text-slate-500 mx-auto mb-2" />
                <p className="text-sm text-slate-300 font-semibold">Clique para anexar o contrato</p>
                <p className="text-xs text-slate-500 mt-1">PDF ou imagem · máx 10MB</p>
              </div>
            )}
            <input ref={contratoRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleContrato} />
          </div>
        </>)}

        <div className="flex gap-2 pt-1 border-t border-slate-700">
          <Btn onClick={() => f.nome && f.matricula && f.email && onSave(f)} disabled={!f.nome || !f.matricula || !f.email} className="flex-1 justify-center">Salvar</Btn>
          <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
        </div>
      </div>
    </Modal>
  );
}

// ── Upload + Cálculo ─────────────────────────────────────
function NovoFechamentoModal({ motoristas, user, fechamentos, onClose, onSave }) {
  const [step, setStep] = useState("upload");
  const [periodo, setPeriodo] = useState("");
  const [quinzena, setQuinzena] = useState(""); // "1Q" | "2Q"
  const [descricao, setDescricao] = useState("");
  const [calc, setCalc] = useState(null);
  const [totais, setTotais] = useState({ ctes: 0, entregas: 0 });
  const [dupes, setDupes] = useState([]); // [{ncte, motNome, fecDesc}]
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [xlsxOk, setXlsxOk] = useState(!!window.XLSX);
  const fileRef = useRef();

  useEffect(() => {
    if (window.XLSX) { setXlsxOk(true); return; }
    let t = 0;
    const iv = setInterval(() => {
      if (window.XLSX) { setXlsxOk(true); clearInterval(iv); }
      else if (++t > 60) { clearInterval(iv); setErr("Biblioteca não carregou. Recarregue a página."); }
    }, 300);
    return () => clearInterval(iv);
  }, []);

  // Build set of all CTEs already in system for duplicate detection
  const ctesExistentes = useMemo(() => {
    const map = {}; // ncte -> [{ fecDesc, motNome }]
    fechamentos.forEach(f => {
      (f.mots||[]).forEach(m => {
        (m.entregas||[]).forEach(e => {
          if (!e.ncte) return;
          if (!map[e.ncte]) map[e.ncte] = [];
          map[e.ncte].push({ fecDesc: f.descricao, motNome: m.nome, fecId: f.id });
        });
        // also manual corrections
        (m.correcoes||[]).forEach(cr => {
          if (!cr.ncte) return;
          if (!map[cr.ncte]) map[cr.ncte] = [];
          map[cr.ncte].push({ fecDesc: ""+(f.descricao)+" (correção)", motNome: m.nome, fecId: f.id });
        });
      });
    });
    return map;
  }, [fechamentos]);

  const handleFile = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!window.XLSX) { setErr("Aguarde a biblioteca carregar."); return; }
    setLoading(true); setErr("");
    try {
      const buf = await file.arrayBuffer();
      const wb = window.XLSX.read(new Uint8Array(buf), { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = window.XLSX.utils.sheet_to_json(ws, { defval: "" });
      if (!rows.length) throw new Error("Planilha sem dados.");
      const linhas = rows.map(r => ({
        mat:          String(r.OperadorMatricula || "").trim(),
        nome:         String(r.OperadorNome || "").trim(),
        ncte:         String(r.NCTE || "").trim(),
        qPacotes:     Number(r.QPacotes) || 0,
        evento:       String(r.Evento || "").trim().toLowerCase(),
        data:         String(r.Data || "").trim(),
        valorFaturado: Number(r.TaxaEntrega || r.Valor || r.ValorFaturado || r.ValorCTE || r.Faturado || 0) || 0,
      }));

      // ── Total Taxa de Entrega = soma DIRETA da coluna (não recalculada por motorista) ──
      const totalTaxaEntregaColuna = linhas
        .filter(r => r.evento === "entrega" && r.valorFaturado > 0)
        .reduce((s,r) => s + r.valorFaturado, 0);

      // ── Detect duplicates ──────────────────────────────
      const dupesFound = [];
      linhas.forEach(r => {
        if (!r.ncte || r.evento !== "entrega") return;
        const prev = ctesExistentes[r.ncte];
        if (prev?.length) {
          prev.forEach(p => dupesFound.push({ ncte: r.ncte, matPlan: r.mat, nomePlan: r.nome, fecDesc: p.fecDesc, motNome: p.motNome }));
        }
      });
      setDupes(dupesFound);

      // ── Remove dupes from calculation ─────────────────
      const dupeNctes = new Set(dupesFound.map(d => d.ncte));
      const linhasSemDupe = linhas.map(r =>
        dupeNctes.has(r.ncte) && r.evento === "entrega"
          ? { ...r, _duplicado: true }  // mark but keep for display
          : r
      );
      // Calc only with non-dupes for entregas
      const linhasCalc = linhasSemDupe.map(r => r._duplicado ? { ...r, evento: "duplicado" } : r);

      const resultado = calcFechamento(linhasCalc, motoristas);
      setCalc({ ...resultado, linhasOriginais: linhas, linhasCalc, totalTaxaEntrega: totalTaxaEntregaColuna });
      setTotais({
        ctes: linhas.length,
        entregas: linhas.filter(l => l.evento === "entrega").length,
        dupesCount: dupesFound.length,
        netEntregas: linhas.filter(l => l.evento === "entrega" && !dupeNctes.has(l.ncte)).length,
      });

      // ── Auto-detect quinzena ───────────────────────────
      const datasEntregas = linhas.filter(l=>l.evento==="entrega"&&l.data).map(l=>l.data);
      if (datasEntregas.length) {
        // Parse DD/MM/YYYY
        const dias = datasEntregas.map(d => {
          const p = d.split("/"); return p.length === 3 ? Number(p[0]) : 0;
        }).filter(Boolean);
        const maxDia = Math.max(...dias);
        const q = maxDia <= 15 ? "1Q" : "2Q";
        const firstData = datasEntregas[0].split("/");
        if (firstData.length === 3) {
          const m = firstData[1].padStart(2,"0"), y = firstData[2];
          const mesNome = MONTHS_SHORT[Number(m)-1];
          const qLabel = q === "1Q" ? "1ª Quinzena" : "2ª Quinzena";
          setPeriodo(""+(y)+"-"+(m)+"-"+(q)+"");
          setQuinzena(q);
          setDescricao(""+(qLabel)+" "+(mesNome)+" "+(y)+"");
        }
      }
      setStep("preview");
    } catch (ex) { setErr("Erro: " + ex.message); }
    setLoading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSave = () => {
    if (!periodo || !calc) return;
    const mots = calc.ok.map(c => ({
      ...c,
      entregas: c.entregas.map(r => ({ ncte: r.ncte, qPacotes: r.qPacotes, data: r.data, valorFaturado: r.valorFaturado||0 })),
    }));
    onSave({
      id: uid(), periodo, quinzena, descricao,
      status: "op",
      criadoPor: user.id, criadoNome: user.name, criadoEm: now(),
      totalCTEs: totais.ctes, totalEntregas: totais.entregas,
      totalTaxaEntrega: calc.totalTaxaEntrega || 0,
      mots,
      nok: calc.nok,
      totalFaturadoNok: calc.totalFaturadoNok || 0,
      dupesIgnoradas: dupes.length,
      hist: [{ acao: "Criado", quem: user.name, ts: now(), obs: (totais.ctes)+" CTEs · "+(mots.length)+" motoristas · "+(calc.nok?.length||0)+" sem cadastro"+(dupes.length?" · "+dupes.length+" duplicatas ignoradas":"") }],
      comprovante: null, dataPagamento: null,
    });
  };

  const totalPrevisao = calc ? calc.ok.reduce((s, c) => s + c.subtotal, 0) : 0;

  return (
    <Modal title="Novo Fechamento de Entrega" onClose={onClose} wide>
      <div className="space-y-5">
        {step === "upload" && (<>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Período (AAAA-MM)" placeholder="2025-04" value={periodo} onChange={e => setPeriodo(e.target.value)} />
            <Input label="Descrição" placeholder="Ex: 1ª Quinzena Abril 2025" value={descricao} onChange={e => setDescricao(e.target.value)} />
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-300 space-y-1">
            <p className="font-semibold">Período detectado automaticamente pela data dos CTEs:</p>
            <p>CTEs até dia 15 → <strong>1ª Quinzena</strong> · CTEs do dia 16 em diante → <strong>2ª Quinzena</strong></p>
            <p>Duplicidades (CTEs já importados) são identificadas e excluídas do cálculo automaticamente.</p>
          </div>
          <div className="border-2 border-dashed border-slate-600 hover:border-red-500/40 rounded-xl p-8 text-center">
            <Truck size={36} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-300 font-semibold mb-1">Carregar Planilha de Entregas (.xlsx)</p>
            <p className="text-slate-500 text-xs mb-4">Colunas: OperadorMatricula, OperadorNome, NCTE, QPacotes, Evento, Data, TaxaEntrega</p>
            <button type="button" disabled={loading}
              onClick={() => fileRef.current?.click()}
              className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg text-sm">
              {loading ? "⏳ Processando..." : xlsxOk ? "📂 Selecionar arquivo" : "⏳ Carregando..."}
            </button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
          </div>
          {err && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex gap-2"><AlertCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" /><p className="text-red-300 text-sm">{err}</p></div>}
        </>)}

        {step === "preview" && calc && (<>
          {/* Quinzena badge */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className={"px-3 py-1.5 rounded-full text-sm font-bold border "+(quinzena==="1Q"?"bg-blue-500/20 border-blue-500/40 text-blue-300":"bg-purple-500/20 border-purple-500/40 text-purple-300")+""}>
              {quinzena === "1Q" ? "📅 1ª Quinzena (dias 1–15)" : "📅 2ª Quinzena (dias 16–fim)"}
            </div>
            <Input label="" placeholder="Descrição" value={descricao} onChange={e => setDescricao(e.target.value)} />
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-900 rounded-lg p-3 border border-slate-700 text-center">
              <p className="text-2xl font-bold text-slate-100">{totais.ctes}</p>
              <p className="text-xs text-slate-400">CTEs na planilha</p>
            </div>
            <div className="bg-slate-900 rounded-lg p-3 border border-emerald-500/20 text-center">
              <p className="text-2xl font-bold text-emerald-400">{totais.netEntregas}</p>
              <p className="text-xs text-slate-400">Entregas válidas</p>
            </div>
            {(totais.dupesCount||0) > 0 && (
              <div className="bg-amber-500/10 rounded-lg p-3 border border-amber-500/30 text-center">
                <p className="text-2xl font-bold text-amber-400">{totais.dupesCount}</p>
                <p className="text-xs text-amber-400/70">Duplicatas ignoradas</p>
              </div>
            )}
            <div className="bg-slate-900 rounded-lg p-3 border border-amber-500/20 text-center">
              <p className="text-2xl font-bold text-amber-400">{calc.nok.length}</p>
              <p className="text-xs text-slate-400">Sem cadastro</p>
            </div>
          </div>

          {/* Duplicatas alert */}
          {dupes.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <p className="text-sm font-bold text-amber-300 mb-2">⚠ {dupes.length} CTE(s) duplicado(s) — excluídos do cálculo</p>
              <p className="text-xs text-amber-400/70 mb-3">Esses CTEs já existem em fechamentos anteriores. Não serão pagos novamente. Se precisar incluí-los, use "Correção Manual de CTE" após criar o fechamento.</p>
              <div className="max-h-36 overflow-y-auto space-y-1">
                {dupes.slice(0, 30).map((d, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs bg-slate-900 border border-amber-500/20 rounded-lg px-3 py-2">
                    <code className="text-amber-400 font-mono">{d.ncte}</code>
                    <span className="text-slate-400">{d.nomePlan}</span>
                    <span className="text-slate-600">já existe em:</span>
                    <span className="text-slate-300 italic">{d.fecDesc}</span>
                  </div>
                ))}
                {dupes.length > 30 && <p className="text-xs text-slate-500 text-center">+{dupes.length-30} mais...</p>}
              </div>
            </div>
          )}

          {calc.nok.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <p className="text-xs font-semibold text-amber-400 mb-1">⚠ Não encontrados no cadastro:</p>
              {calc.nok.map(m => <p key={m.mat} className="text-xs text-amber-300">• Mat. {m.mat} — {m.nome}</p>)}
            </div>
          )}
          <div className="max-h-64 overflow-y-auto space-y-2">
            {calc.ok.map(c => (
              <div key={c.id} className="bg-slate-900 rounded-lg p-3 border border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">{c.nome}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Mat: {c.mat} · {c.totalCTEs} CTEs entregues</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-400">{fmt(c.subtotal)}</p>
                    <p className="text-xs text-slate-500">
                      {c.vDiaria > 0 ? "d: "+(fmt(c.vDiaria))+"" : ""}
                      {c.vDiaria > 0 && c.vPacotes > 0 ? " + " : ""}
                      {c.vPacotes > 0 ? "p: "+(fmt(c.vPacotes))+"" : ""}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <div className="grid grid-cols-2 gap-3 flex-1 mr-4">
              <Input label="Período" value={periodo} onChange={e => setPeriodo(e.target.value)} />
              <Input label="Descrição" value={descricao} onChange={e => setDescricao(e.target.value)} />
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Total previsto</p>
              <p className="text-xl font-bold text-emerald-400">{fmt(totalPrevisao)}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Btn onClick={handleSave} disabled={!periodo} className="flex-1 justify-center">Criar Fechamento</Btn>
            <Btn variant="secondary" onClick={() => setStep("upload")}>← Voltar</Btn>
            <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
          </div>
        </>)}
      </div>
    </Modal>
  );
}

// ── Detalhe ──────────────────────────────────────────────
function CorrecaoModal({ nome, onClose, onSave }) {
  const [f, sf] = useState({ ncte: "", data: "", justificativa: "", valor: "", tipo: "acrescimo" });
  const up = (k, v) => sf(p => ({ ...p, [k]: v }));
  const valorFinal = f.tipo === "debito" ? -Math.abs(Number(f.valor)||0) : Math.abs(Number(f.valor)||0);
  const ok = f.ncte && f.justificativa && f.valor !== "" && Number(f.valor) > 0;
  return (
    <Modal title={"Correção Manual — "+(nome)+""} onClose={onClose}>
      <div className="space-y-3">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-300">
          CTE adicionado manualmente ao fechamento. O tipo define se vai somar (Acréscimo) ou descontar (Débito) do total.
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => up("tipo","acrescimo")}
            className={"flex items-center justify-center gap-2 py-2.5 rounded-lg border font-semibold text-sm transition-all "+(f.tipo==="acrescimo"?"bg-emerald-500/20 border-emerald-500/50 text-emerald-300":"bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500")+""}>
            <Plus size={14}/>Acréscimo
          </button>
          <button type="button" onClick={() => up("tipo","debito")}
            className={"flex items-center justify-center gap-2 py-2.5 rounded-lg border font-semibold text-sm transition-all "+(f.tipo==="debito"?"bg-red-500/20 border-red-500/50 text-red-300":"bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500")+""}>
            <X size={14}/>Débito
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Número do CTE *" placeholder="Ex: 18250100213754" value={f.ncte} onChange={e=>up("ncte",e.target.value)}/>
          <Input label="Data da Entrega" placeholder="DD/MM/AAAA" value={f.data} onChange={e=>up("data",e.target.value)}/>
        </div>
        <TA label="Justificativa *" placeholder="Motivo da correção manual..." rows={3} value={f.justificativa} onChange={e=>up("justificativa",e.target.value)}/>
        <div>
          <Input label={"Valor (R$) — "+(f.tipo === "acrescimo" ? "será somado ao total" : "será descontado do total")+""}
            type="number" step="0.01" placeholder="Ex: 50.00" value={f.valor} onChange={e=>up("valor",e.target.value)}/>
          {f.valor && Number(f.valor) > 0 && (
            <p className={"text-xs mt-1 font-semibold "+(f.tipo==="acrescimo"?"text-emerald-400":"text-red-400")+""}>
              {f.tipo==="acrescimo" ? "+ "+(fmt(valorFinal))+" (Acréscimo)" : "- "+(fmt(Math.abs(valorFinal)))+" (Débito)"}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Btn onClick={()=>ok&&onSave({...f,valor:valorFinal,id:uid(),criadoEm:now()})} disabled={!ok} className="flex-1 justify-center">Adicionar</Btn>
          <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
        </div>
      </div>
    </Modal>
  );
}

// Per-motorista payment button for PagamentosView (standalone, no closure dependency)
function PagMotBtn({ motId, fecId, setFechamentos, userName, mots }) {
  const ref = useRef();
  const handleFile = async e => {
    const file = e.target.files?.[0]; if (!file) return;
    const data = await readFileAsBase64(file);
    setFechamentos(prev => prev.map(f => {
      if (f.id !== fecId) return f;
      const newMots = f.mots.map(c => c.id !== motId ? c : {
        ...c, etapa: "pago", dataPagMot: now(), comprovanteMot: { nome: file.name, data }
      });
      const allPago = newMots.every(c => (c.etapa||"agr") === "pago");
      const hist = [...f.hist, { acao: "Pagamento confirmado — "+(newMots.find(c=>c.id===motId)?.nome)+"", quem: userName, ts: now(), obs: file.name }];
      return { ...f, mots: newMots, status: allPago ? "pago" : f.status, hist };
    }));
    if (ref.current) ref.current.value = "";
  };
  return (
    <>
      <Btn size="sm" variant="success" onClick={() => ref.current?.click()}>
        <CreditCard size={12}/>Pagar + Comprovante
      </Btn>
      <input ref={ref} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFile}/>
    </>
  );
}

// Per-motorista payment button with partial payment support
function MotPagBtn({ mot, onPago }) {
  const [showModal, setShowModal] = useState(false);
  const [valorPagar, setValorPagar] = useState(mot.totalBruto.toFixed(2));
  const [motivo, setMotivo] = useState("");
  const ref = useRef();

  const handleConfirm = () => {
    if (!ref.current) return;
    ref.current.click();
  };

  const handleFile = async e => {
    const f = e.target.files?.[0]; if (!f) return;
    const valor = parseFloat(valorPagar.replace(",",".")) || mot.totalBruto;
    await onPago(mot.id, f, valor, motivo);
    setShowModal(false);
  };

  const isParcial = parseFloat(valorPagar.replace(",",".")) !== mot.totalBruto;

  return (
    <>
      <Btn size="sm" variant="success" onClick={() => { setValorPagar(mot.totalBruto.toFixed(2)); setShowModal(true); }}>
        <CreditCard size={12}/>Pagar
      </Btn>
      <input ref={ref} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFile}/>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-slate-100">Confirmar Pagamento</h3>
            <p className="text-sm text-slate-400">{mot.nome}</p>
            <div className="bg-slate-900 rounded-lg p-3 text-xs text-slate-400 space-y-1">
              <div className="flex justify-between"><span>Valor calculado:</span><span className="text-slate-200 font-semibold">{fmt(mot.totalBruto)}</span></div>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Valor a pagar (R$)</label>
              <input type="number" step="0.01" min="0" value={valorPagar}
                onChange={e => setValorPagar(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"/>
              {isParcial && (
                <p className="text-xs text-amber-400 mt-1">
                  ⚠ Valor diferente do calculado — débito de {fmt(mot.totalBruto - (parseFloat(valorPagar)||0))} será registrado
                </p>
              )}
            </div>
            {isParcial && (
              <div>
                <label className="text-xs text-slate-400 block mb-1">Motivo do ajuste *</label>
                <input type="text" placeholder="Ex: Desconto por devolução" value={motivo}
                  onChange={e => setMotivo(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"/>
              </div>
            )}
            <div className="flex gap-3">
              <Btn className="flex-1 justify-center" variant="success"
                onClick={() => { if (isParcial && !motivo.trim()) { alert("Informe o motivo do ajuste"); return; } handleConfirm(); }}>
                <CreditCard size={13}/>Pagar + Comprovante
              </Btn>
              <Btn variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Btn>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ResumoFinMots({ mots, total }) {
  const [filtTipo, setFiltTipo] = useState("todos");
  const lista = filtTipo==="todos" ? mots : mots.filter(c=>(c.tipo||"pacote")===filtTipo);
  const tDias = lista.reduce((s,c)=>s+(c.diasUnicos||1),0);
  const tCTEs = lista.reduce((s,c)=>s+(c.totalCTEs||0),0);
  const tGanho = lista.reduce((s,c)=>s+(c.totalBruto||0),0);
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">📊 Resumo Financeiro por Motorista</p>
        <div className="flex gap-1">
          {[["todos","Todos"],["diaria","Diária"],["pacote","CTE"],["ambos","Ambos"]].map(([v,l])=>(
            <button key={v} onClick={()=>setFiltTipo(v)}
              className={"text-xs px-2 py-1 rounded border font-medium transition-all "+(filtTipo===v?"bg-red-600 text-white border-red-600":"bg-slate-800 text-slate-400 border-slate-700")+""}>{l}</button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400">
              {["Motorista","Dias","CTEs entregues","Média/Dia","Valor Ganho","Valor/CTE","Tipo"].map(h=>(
                <th key={h} className={"py-2 px-2 font-semibold "+(h==="Motorista"?"text-left":"text-right")+""}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lista.map(c => {
              const dias=c.diasUnicos||1; const ent=c.totalCTEs||0;
              const mediaDia=dias>0?(ent/dias):0; const ganho=c.totalBruto||0;
              const mediaCTE=ent>0?(ganho/ent):0; const tipo=c.tipo||"pacote";
              const isDiaria=tipo==="diaria"||tipo==="ambos"||tipo==="diaria_excedente";
              return (
                <tr key={c.id} className={"border-b border-slate-800 hover:bg-slate-800/40 "+(isDiaria?"bg-amber-500/5":"")+""}>
                  <td className="py-2 px-2 font-semibold text-slate-100">{isDiaria&&<span className="text-amber-400 mr-1">⭐</span>}{c.nome}</td>
                  <td className="py-2 px-2 text-right text-amber-400 font-bold">{dias}</td>
                  <td className="py-2 px-2 text-right text-emerald-400 font-semibold">{ent.toLocaleString("pt-BR")}</td>
                  <td className="py-2 px-2 text-right">
                    <span className={"font-semibold "+(mediaDia>=20?"text-emerald-400":mediaDia>=10?"text-amber-400":"text-red-400")+""}>{mediaDia.toFixed(1)}</span>
                  </td>
                  <td className="py-2 px-2 text-right text-emerald-400 font-bold">{fmt(ganho)}</td>
                  <td className="py-2 px-2 text-right text-slate-300 font-semibold">{mediaCTE>0?fmt(mediaCTE):"—"}</td>
                  <td className="py-2 px-2 text-right">
                    <span className={"px-1.5 py-0.5 rounded text-xs font-medium "+(tipo==="diaria"?"bg-amber-500/20 text-amber-400":tipo==="ambos"||tipo==="diaria_excedente"?"bg-blue-500/20 text-blue-400":"bg-emerald-500/20 text-emerald-400")+""}>
                      {tipo==="diaria"?"Diária":tipo==="ambos"?"Diária+CTE":tipo==="diaria_excedente"?"Diária+Exc.":tipo==="diaria_por_dia"?"Diária/Dia":"CTE"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-700/30 font-bold border-t-2 border-slate-600">
              <td className="py-2.5 px-2 text-slate-200">TOTAL ({lista.length})</td>
              <td className="py-2.5 px-2 text-right text-amber-400">{tDias}</td>
              <td className="py-2.5 px-2 text-right text-emerald-400">{tCTEs.toLocaleString("pt-BR")}</td>
              <td className="py-2.5 px-2 text-right text-blue-400">{tDias>0?(tCTEs/tDias).toFixed(1):"—"}</td>
              <td className="py-2.5 px-2 text-right text-emerald-400">{fmt(tGanho)}</td>
              <td className="py-2.5 px-2 text-right text-slate-300">{tCTEs>0?fmt(tGanho/tCTEs):"—"}</td>
              <td className="py-2.5 px-2"/>
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────
// RECEITA DO FECHAMENTO — Planilha Jadlog anexada + taxas
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// PLANILHAS & RECEITA DO FECHAMENTO
// ─────────────────────────────────────────────
function ReceitaFechamento({ fec, upd }) {
  const fileRef = useRef();
  const [importing, setImporting] = useState(false);
  const [msg, setMsg] = useState("");

  // ── Valores das 3 entradas ──
  const tde            = fec.tde             || 0;        // 1. TDE manual
  const planilhaCom    = fec.planilhaJadlog  || null;     // 2. Comissão (planilha)
  const comissao       = planilhaCom?.totalCom || 0;

  // 3. Taxa de Entrega = soma DIRETA da coluna TaxaEntrega (guardada no import)
  //    sem multiplicação por volume. Sem cadastro entra na receita, só não tem desconto.
  const taxaEntrega    = fec.totalTaxaEntrega || 0;
  const taxaEntregaCad = (fec.mots||[]).reduce((s,c)=>s+(c.totalFaturado||0), 0);
  const taxaEntregaNok = (fec.nok||[]).reduce((s,n)=>s+(n.totalFaturado||0), 0);

  const totalReceita   = tde + comissao + taxaEntrega;

  // Custo = apenas agregados CADASTRADOS (sem cadastro não sai despesa)
  const custoAgrCad    = (fec.mots||[]).reduce((s,c)=>s+(c.totalBruto||0), 0);
  const saldo          = totalReceita - custoAgrCad;

  // Import comissão planilha
  const handleImport = async e => {
    const file = e.target.files?.[0]; if (!file) return;
    setImporting(true); setMsg("");
    try {
      const buf = await file.arrayBuffer();
      const { read, utils } = window.XLSX;
      const wb  = read(buf);
      const ws  = wb.Sheets[wb.SheetNames[0]];
      const raw = utils.sheet_to_json(ws, { header:1, defval:"", raw:false });
      let hdrIdx = -1;
      for (let i=0; i<Math.min(raw.length,10); i++) {
        if (raw[i].some(c=>String(c).toUpperCase().includes("CTE"))) { hdrIdx=i; break; }
      }
      if (hdrIdx<0) { setMsg("❌ Cabeçalho 'CTE' não encontrado"); setImporting(false); return; }
      const cols = raw[hdrIdx];
      const gi   = name => cols.findIndex(c=>String(c||"").toLowerCase().includes(name.toLowerCase()));
      const iFat = cols.findIndex(c=>String(c||"").toLowerCase().includes("frap")||String(c||"").toLowerCase().includes("zfrap"));
      const iLiq = (() => { const a=cols.map(c=>String(c||"").toLowerCase()); const i=a.lastIndexOf("liquido"); return i>=0?i:gi("liquido"); })();
      const rows = [];
      for (let i=hdrIdx+1; i<raw.length; i++) {
        const r=raw[i]; if(!r[gi("cte")]&&!r[0]) continue;
        const fat=Math.abs(parseFloat(r[iFat])||0);
        const com=Math.abs(parseFloat(r[iLiq])||0);
        if(!fat&&!com) continue;
        const data=String(r[gi("data")]||"").trim();
        const quinz=data.split("/").length===3?(parseInt(data.split("/")[0])<=15?1:2):0;
        rows.push({cte:String(r[gi("cte")]||r[0]),data,fat,com,quinz});
      }
      const totalFat=rows.reduce((s,r)=>s+r.fat,0);
      const totalCom=rows.reduce((s,r)=>s+r.com,0);
      upd({planilhaJadlog:{arquivo:file.name,totalFat,totalCom,rows,importadoEm:new Date().toISOString()}});
      setMsg("✅ "+rows.length+" CTEs · Comissão "+totalCom.toLocaleString("pt-BR",{style:"currency",currency:"BRL"}));
    } catch(err) { setMsg("❌ "+String(err.message||err)); }
    setImporting(false);
    if(fileRef.current) fileRef.current.value="";
  };

  return (
    <div className="space-y-4">
      {msg&&<p className={"text-xs px-3 py-2 rounded-lg border "+(msg.startsWith("✅")?"bg-emerald-500/10 border-emerald-500/30 text-emerald-300":"bg-red-500/10 border-red-500/30 text-red-300")}>{msg}</p>}

      {/* 1. TDE */}
      <Card className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-slate-200">1. TDE</p>
            <p className="text-xs text-slate-400">Taxa de Descarga de Entrega — lançamento manual</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2">
            <span className="text-slate-400 text-sm">R$</span>
            <input type="number" step="0.01" min="0" value={tde}
              onChange={e=>upd({tde:parseFloat(e.target.value)||0})}
              className="w-28 bg-transparent text-sm text-emerald-400 font-bold text-right focus:outline-none"/>
          </div>
        </div>
      </Card>

      {/* 2. Comissão */}
      <Card className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <div>
            <p className="text-sm font-bold text-slate-200">2. Comissão</p>
            <p className="text-xs text-slate-400">Planilha Jadlog — coluna <span className="text-amber-400">Liquido</span> = comissão</p>
          </div>
          <div className="flex gap-2">
            {planilhaCom&&(
              <button onClick={()=>{upd({planilhaJadlog:null});setMsg("🗑 Comissão removida");}}
                className="text-xs px-2 py-1.5 rounded-lg text-red-400 border border-red-500/30 hover:bg-red-500/10 flex items-center gap-1">
                <Trash2 size={11}/>Apagar
              </button>
            )}
            <Btn onClick={()=>fileRef.current?.click()} disabled={importing}>
              <Upload size={14}/>{importing?"Importando...":"Importar Planilha"}
            </Btn>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport}/>
          </div>
        </div>
        {planilhaCom ? (
          <div className="bg-slate-900 rounded-lg p-3 border border-slate-700 text-xs">
            <p className="text-slate-300 font-semibold mb-2">📎 {planilhaCom.arquivo}</p>
            <div className="flex gap-5 flex-wrap">
              <div><p className="text-slate-500">CTEs</p><p className="text-slate-200 font-bold">{planilhaCom.rows?.length||0}</p></div>
              <div><p className="text-slate-500">Faturamento bruto</p><p className="text-slate-300 font-bold">{fmt(planilhaCom.totalFat||0)}</p></div>
              <div><p className="text-slate-500">Comissão</p><p className="text-emerald-400 font-bold">{fmt(comissao)}</p></div>
              <div><p className="text-slate-500">Margem</p><p className="text-blue-400 font-bold">{planilhaCom.totalFat>0?((comissao/planilhaCom.totalFat)*100).toFixed(1)+"%":"—"}</p></div>
            </div>
          </div>
        ) : (
          <div className="border border-dashed border-slate-700 rounded-lg p-4 text-center text-xs text-slate-500">Nenhuma planilha importada</div>
        )}
      </Card>

      {/* 3. Taxa de Entrega */}
      <Card className="p-4">
        <div className="mb-2">
          <p className="text-sm font-bold text-slate-200">3. Taxa de Entrega</p>
          <p className="text-xs text-slate-400">Soma direta da coluna <span className="text-amber-400">TaxaEntrega</span> da planilha importada</p>
        </div>
        <div className="bg-slate-900 rounded-lg p-3 border border-slate-700 text-xs">
          <div className="flex gap-5 flex-wrap">
            <div><p className="text-slate-500">Total coluna</p><p className="text-emerald-400 font-bold text-sm">{fmt(taxaEntrega)}</p></div>
            <div><p className="text-slate-500">↳ Cadastrados</p><p className="text-slate-300">{fmt(taxaEntregaCad)}</p></div>
            <div><p className="text-slate-500">↳ Sem cadastro</p><p className="text-amber-400">{fmt(taxaEntregaNok)} <span className="text-slate-500">(entra receita, sem desconto)</span></p></div>
          </div>
          {!taxaEntrega&&<p className="text-slate-500 text-xs mt-2">Valor calculado após importar a planilha de fechamento.</p>}
        </div>
      </Card>

      {/* Resumo */}
      <Card className={"p-5 border-2 "+(saldo>=0?"border-emerald-500/30 bg-emerald-500/5":"border-red-500/30 bg-red-500/5")}>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">💰 Resumo do Fechamento</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-slate-400">TDE</span><span className="text-emerald-400 font-semibold">{fmt(tde)}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Comissão</span><span className="text-emerald-400 font-semibold">{fmt(comissao)}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Taxa de Entrega</span><span className="text-emerald-400 font-semibold">{fmt(taxaEntrega)}</span></div>
          <div className="flex justify-between border-t border-slate-700 pt-2 font-bold text-base">
            <span className="text-slate-200">Total Receita</span><span className="text-emerald-400">{fmt(totalReceita)}</span>
          </div>
          <div className="flex justify-between text-sm border-t border-slate-700 pt-2">
            <span className="text-slate-400">(-) Custo Agregados Cadastrados</span><span className="text-red-400 font-semibold">-{fmt(custoAgrCad)}</span>
          </div>
          {taxaEntregaNok>0&&(
            <div className="flex justify-between text-xs">
              <span className="text-amber-400/70">Sem cadastro — {(fec.nok||[]).length} moto(s) · faturaram mas sem despesa</span>
              <span className="text-amber-400/70">+{fmt(taxaEntregaNok)}</span>
            </div>
          )}
          <div className={"flex justify-between border-t-2 pt-3 "+(saldo>=0?"border-emerald-500/40":"border-red-500/40")}>
            <span className="text-slate-100 font-bold text-base">SALDO</span>
            <span className={"text-2xl font-black "+(saldo>=0?"text-emerald-400":"text-red-400")}>{fmt(saldo)}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}


function FechamentoDetalhe({ fec, user, motoristas, setFechamentos, tickets, setTickets, onBack }) {  const [tab, setTab] = useState("resumo");
  const [showCorr, setShowCorr] = useState(null);
  const [rejectTxt, setRejectTxt] = useState("");
  const [showRej, setShowRej] = useState(false);
  const compRef = useRef();

  const upd = ch => setFechamentos(prev => prev.map(f => f.id === fec.id ? { ...f, ...ch } : f));
  const hist = (acao, obs = "") => [...(fec.hist||[]), { acao, quem: user.name, ts: now(), obs }];

  const total = (fec.mots||[]).reduce((s, c) => s + (c.totalBruto||0), 0);
  const st = FS[fec.status] || FS.op;

  // Per-motorista individual permissions
  const isGestOrDir = ["area_manager","director"].includes(user.role);
  const isFinOrDir  = userHasFinancial(user) || user.role === "director";

  const canEditCTE  = (etapa) => ["op","gest","fin","revisao_op"].includes(etapa) && user.role !== "auditor";
  const canOp       = (etapa) => (etapa === "op" || etapa === "revisao_op") && ["operator","area_manager","director"].includes(user.role);
  const canGestAppr = (etapa) => etapa === "gest" && isGestOrDir;
  const canFinAppr  = (etapa) => etapa === "fin"  && isFinOrDir;
  const isAgrEtapa  = (etapa) => etapa === "agr";

  // Overall fechamento status = derived from worst mot etapa
  const getFecStatus = (mots) => {
    if (mots.every(c => c.etapa === "pago")) return "pago";
    if (mots.some(c => c.etapa === "revisao_op")) return "op";
    if (mots.some(c => c.etapa === "op")) return "op";
    if (mots.some(c => c.etapa === "gest")) return "gest";
    if (mots.some(c => c.etapa === "fin")) return "fin";
    if (mots.some(c => c.etapa === "agr")) return "agr";
    return "op";
  };

  const advanceMotTo = (motId, novaEtapa, obs = "") => {
    const mots = fec.mots.map(c => c.id !== motId ? c : { ...c, etapa: novaEtapa, ["status_"+(novaEtapa)+""]: "ok", ["obs_"+(novaEtapa)+""]: obs });
    upd({ mots, status: getFecStatus(mots), hist: hist("→ "+(MOT_ETAPA[novaEtapa]?.label||novaEtapa)+"", ""+(fec.mots.find(c=>c.id===motId)?.nome)+""+(obs?" — "+obs:"")+"") });
  };

  const rejectMotTo = (motId, targetEtapa, obs = "") => {
    const mots = fec.mots.map(c => c.id !== motId ? c : { ...c, etapa: targetEtapa, ["obs_reject_"+(targetEtapa)+""]: obs });
    upd({ mots, status: getFecStatus(mots), hist: hist("Devolvido para "+(MOT_ETAPA[targetEtapa]?.label)+"", ""+(fec.mots.find(c=>c.id===motId)?.nome)+""+(obs?" — "+obs:"")+"") });
  };

  const pagarMot = async (motId, file, valorPago, motivoAjuste) => {
    const data = await readFileAsBase64(file);
    const mot = fec.mots.find(c => c.id === motId);
    const valorFinal = valorPago || mot?.totalBruto || 0;
    const debito = (mot?.totalBruto || 0) - valorFinal;
    const mots = fec.mots.map(c => {
      if (c.id !== motId) return c;
      const novaCorrecoes = debito !== 0 ? [
        ...c.correcoes,
        { id: uid(), tipo: "debito", ncte: "AJUSTE", data: now().slice(0,10),
          valor: -Math.abs(debito), justificativa: motivoAjuste || "Ajuste no pagamento" }
      ] : c.correcoes;
      return {
        ...c,
        etapa: "pago",
        dataPagMot: now(),
        comprovanteMot: { nome: file.name, data },
        valorPago: valorFinal,
        totalBruto: valorFinal,
        correcoes: novaCorrecoes,
      };
    });
    const allPago = mots.every(c => c.etapa === "pago");
    const obsText = (mot?.nome||"")+" — "+fmt(valorFinal)+(debito > 0 ? " (débito de "+fmt(debito)+": "+(motivoAjuste||"")+")":"")+" — "+(file.name||"");
    upd({ mots, status: allPago ? "pago" : fec.status, hist: hist("Motorista pago", obsText) });
  };

  const addCorrecao = (motId, corr) => {
    const mots = fec.mots.map(c => {
      if (c.id !== motId) return c;
      const nc = [...c.correcoes, corr];
      const extra = nc.reduce((s, x) => s + x.valor, 0);
      return { ...c, correcoes: nc, totalBruto: c.subtotal + extra };
    });
    upd({ mots, hist: hist("Correção manual", "CTE "+(corr.ncte)+(corr.data?" ("+corr.data+")":"")+" — "+(corr.justificativa||"")) });
    setShowCorr(null);
  };

  const removeCorr = (motId, corrId) => {
    const mots = fec.mots.map(c => {
      if (c.id !== motId) return c;
      const nc = c.correcoes.filter(x => x.id !== corrId);
      return { ...c, correcoes: nc, totalBruto: c.subtotal + nc.reduce((s, x) => s + x.valor, 0) };
    });
    upd({ mots });
  };

  return (
    <div className="p-6 space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"><ArrowLeft size={18} /></button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold text-slate-100">{fec.descricao}</h1>
            <Badge color={st.cor}>{st.label}</Badge>
          </div>
          <p className="text-xs text-slate-400">{fec.periodo} · {fec.criadoNome} · {fmtDate(fec.criadoEm)}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Btn variant="secondary" size="sm" onClick={() => exportarCSV(fec)}><FileText size={13} />Exportar CSV</Btn>
          <p className="text-xl font-bold text-emerald-400">{fmt(total)}</p>
        </div>
      </div>

      {/* Rejeição */}
      {fec.motivoRej && fec.status === "revisao" && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex gap-3">
          <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div><p className="text-sm font-semibold text-red-300">Retornado para revisão</p><p className="text-xs text-red-400 mt-0.5">{fec.motivoRej}</p></div>
        </div>
      )}

      {/* Painel de status do fluxo */}
      {!["pago"].includes(fec.status) && (
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"/>
            <p className="text-sm font-semibold text-slate-200">
              Fluxo: {FS[fec.status]?.label || "Em andamento"} — cada motorista segue seu próprio fluxo abaixo
            </p>
          </div>
          {/* Flow steps visual */}
          <div className="flex items-center gap-1 flex-wrap text-xs">
            {[["op","Operacional"],["gest","Gestor"],["fin","Financeiro"],["agr","Agregado"],["pago","Pago"]].map(([k,l],i,arr)=>(
              <div key={k} className="flex items-center gap-1">
                <span className={"px-2 py-1 rounded border font-medium "+(fec.status===k?"bg-amber-500/20 border-amber-500/50 text-amber-300":"border-slate-700 text-slate-500")+""}>{l}</span>
                {i<arr.length-1&&<ChevronRight size={10} className="text-slate-600"/>}
              </div>
            ))}
          </div>
        </div>
      )}

      {fec.status === "pago" && (
        <div className="bg-emerald-500/5 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 size={20} className="text-emerald-400" />
          <div>
            <p className="text-sm font-semibold text-emerald-300">Pago em {fmtDate(fec.dataPagamento)}</p>
            {fec.comprovante && <p className="text-xs text-emerald-400/70">{fec.comprovante.nome}</p>}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[["resumo","📊 Resumo"],["mots","🚚 Por Motorista"],["ctes","📋 CTEs de Entrega"],
          ["receita","📎 Planilhas & Receita"],
          ...(userHasDRE(user) ? [["financeiro","💰 Saldo Financeiro"]] : []),
          ["links","🔗 Links Agregados"],["hist","📜 Histórico"]].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)}
            className={"text-xs px-3 py-1.5 rounded-full font-semibold border transition-all "+(tab === v ? "bg-red-600 text-white border-red-600" : "bg-slate-800 text-slate-400 border-slate-700")+""}>{l}</button>
        ))}
      </div>

      {/* RESUMO */}
      {tab === "resumo" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-4"><p className="text-xs text-slate-400 mb-1">Total a Pagar</p><p className="text-xl font-bold text-emerald-400">{fmt(total)}</p></Card>
            <Card className="p-4"><p className="text-xs text-slate-400 mb-1">Motoristas cadastrados</p><p className="text-xl font-bold text-slate-100">{(fec.mots||[]).length}</p></Card>
            <Card className="p-4"><p className="text-xs text-slate-400 mb-1">Sem cadastro (faturaram)</p><p className="text-xl font-bold text-amber-400">{(fec.nok||[]).length}</p>
              {(fec.nok||[]).length>0&&<p className="text-xs text-amber-400/70">{fmt((fec.nok||[]).reduce((s,n)=>s+(n.totalFaturado||0),0))} gerado</p>}
            </Card>
            <Card className="p-4"><p className="text-xs text-slate-400 mb-1">CTEs totais</p><p className="text-xl font-bold text-slate-100">{fec.totalCTEs||0}</p></Card>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4">
              <p className="text-xs font-bold text-slate-400 mb-3">Breakdown do pagamento</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-slate-300">Diárias</span><span className="text-amber-400 font-semibold">{fmt((fec.mots||[]).reduce((s,c)=>s+(c.vDiaria||0),0))}</span></div>
                <div className="flex justify-between"><span className="text-slate-300">CTEs entregues</span><span className="text-emerald-400 font-semibold">{fmt((fec.mots||[]).reduce((s,c)=>s+(c.vCTEs||c.vPacotes||0),0))}</span></div>
                <div className="flex justify-between"><span className="text-slate-300">Correções manuais</span><span className="text-blue-400 font-semibold">{fmt((fec.mots||[]).reduce((s,c)=>s+((c.totalBruto||0)-(c.subtotal||0)),0))}</span></div>
                <div className="flex justify-between border-t border-slate-700 pt-1.5 font-bold"><span className="text-slate-100">Total a Pagar</span><span className="text-emerald-400">{fmt(total)}</span></div>
                {(fec.nok||[]).length>0&&(
                  <div className="flex justify-between border-t border-amber-500/20 pt-1.5">
                    <span className="text-amber-400 text-xs">Sem cadastro — faturaram (não pagar)</span>
                    <span className="text-amber-400 font-semibold text-xs">{fmt((fec.nok||[]).reduce((s,n)=>s+(n.totalFaturado||0),0))}</span>
                  </div>
                )}
              </div>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-bold text-slate-400 mb-3">Status dos Agregados</p>
              {[["pendente","Aguardando","#f59e0b"],["aprovado","Aprovados","#10b981"],["rejeitado","Rejeitados","#ef4444"]].map(([k,l,c]) => (
                <div key={k} className="flex justify-between text-sm py-1">
                  <span style={{color:c}}>{l}</span>
                  <span className="font-semibold text-slate-300">{(fec.mots||[]).filter(x=>x.statusAgr===k).length}</span>
                </div>
              ))}
            </Card>
          </div>

          {/* ── Resumo Financeiro por Motorista ── */}
          <ResumoFinMots mots={fec.mots||[]} total={total} />

          {fec.nok?.length > 0 && (
            <Card className="p-4 border border-amber-500/20">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-amber-400">⚠ Sem cadastro ({fec.nok.length}) — Faturado mas SEM pagamento</p>
                <span className="text-xs text-amber-400 font-bold">{fmt((fec.nok||[]).reduce((s,m)=>s+(m.totalFaturado||0),0))}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-slate-700 text-slate-500">
                    <th className="text-left py-1 px-2">Nome</th>
                    <th className="text-right py-1 px-2">CTEs</th>
                    <th className="text-right py-1 px-2">Val. Faturado</th>
                    <th className="text-right py-1 px-2">Custo</th>
                  </tr></thead>
                  <tbody>
                    {fec.nok.map(m=>(
                      <tr key={m.mat} className="border-b border-slate-800">
                        <td className="py-1.5 px-2 text-amber-300 font-medium">{m.nome} {m.mat&&m.mat!==m.nome&&<span className="text-slate-500">(Mat. {m.mat})</span>}</td>
                        <td className="py-1.5 px-2 text-right text-slate-300">{m.totalCTEs||0}</td>
                        <td className="py-1.5 px-2 text-right text-emerald-400 font-semibold">{m.totalFaturado>0?fmt(m.totalFaturado):"—"}</td>
                        <td className="py-1.5 px-2 text-right text-slate-500 text-xs italic">Não pago</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* POR MOTORISTA */}
      {tab === "mots" && (
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap text-xs">
            {[["agr","#8b5cf6","Aguard. Ciência"],["fin","#06b6d4","Aguard. Pagto"],["pago","#10b981","Pago ✓"],["devolvido","#ef4444","Devolvido"],["revisao_op","#dc2626","Contestado"]].map(([e,c,l])=>(
              <span key={e} className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{background:c}}/><span className="text-slate-400">{l} ({(fec.mots||[]).filter(m=>(m.etapa||"agr")===e).length})</span></span>
            ))}
          </div>
          {(fec.mots||[]).map(c => {
            const etapa = c.etapa || "agr";
            const etapaColor = {agr:"#8b5cf6",fin:"#06b6d4",pago:"#10b981",devolvido:"#ef4444",revisao_op:"#dc2626"}[etapa]||"#64748b";
            const etapaLabel = {agr:"Aguard. Ciência",fin:"Aguard. Pagamento",pago:"Pago ✓",devolvido:"Devolvido",revisao_op:"Contestado"}[etapa];
            return (
            <Card key={c.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-100">{c.nome}</p>
                    <Badge color="#60a5fa">Mat: {c.mat}</Badge>
                    <Badge color={etapaColor}>{etapaLabel}</Badge>
                    {c.nf && <Badge color="#10b981">NF</Badge>}
                    {c.comprovanteMot && <Badge color="#10b981">Comprov.</Badge>}
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-2 text-xs">
                    <span className="text-slate-400">CTEs entregues: <span className="font-semibold text-emerald-400">{c.totalCTEs}</span></span>
                    <span className="text-slate-400">Dias: <span className="font-semibold text-slate-200">{c.diasUnicos||1}</span></span>
                  </div>
                  <div className="flex gap-3 mt-1 text-xs flex-wrap">
                    {c.vDiaria > 0 && <span className="text-amber-400">Diária: {c.diasUnicos||1} dia(s) × {fmt(c.valorDiaria)} = {fmt(c.vDiaria)}</span>}
                    {c.vCTEs > 0 && <span className="text-emerald-400">{c.totalCTEs} CTEs × {fmt(c.valorCTE||c.valorPacote)} = {fmt(c.vCTEs)}</span>}
                    {c.tipo==="diaria_por_dia"&&c.diasDiaria&&(
                      <span className="text-slate-400">
                        Dias diária: {["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].filter((_,i)=>(c.diasDiaria||[]).includes(i)).join(",")} · Dias CTE: {["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].filter((_,i)=>!(c.diasDiaria||[]).includes(i)).join(",")}
                      </span>
                    )}
                  </div>
                  {c.comentarioAgr && <p className="text-xs text-slate-400 mt-1 italic">"{c.comentarioAgr}"</p>}
                  {c.comentarioGest && <p className="text-xs text-orange-400 mt-1 italic">Gestor: "{c.comentarioGest}"</p>}
                  {(c.etapa === "revisao_op" || c.etapa === "devolvido") && c.contestacao?.motivo && (
                    <div className="mt-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                      <p className="text-xs font-semibold text-red-400 mb-0.5">Motivo da contestação:</p>
                      <p className="text-xs text-red-300 italic">"{c.contestacao.motivo}"</p>
                      {c.contestacao.evidencias?.length>0&&<p className="text-xs text-slate-400 mt-1"><Paperclip size={10} className="inline mr-1"/>{c.contestacao.evidencias.length} evidência(s) anexada(s)</p>}
                    </div>
                  )}
                  {(c.etapa === "revisao_op" || c.etapa === "devolvido") && (
                    <div className="mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2">
                      <p className="text-xs font-semibold text-slate-400 mb-1">Ações da operação:</p>
                      <div className="flex gap-2 flex-wrap">
                        <Btn size="sm" variant="secondary" onClick={()=>setShowCorr(c.id)}><Plus size={12}/>Corrigir CTE</Btn>
                        <Btn size="sm" variant="success" onClick={()=>{
                          const mots=fec.mots.map(cc=>cc.id!==c.id?cc:{...cc,etapa:"rev_gestor",decisaoOp:"confirmou",obsOp:"Operação confirmou valores corretos"});
                          upd({mots,hist:hist("Op. confirmou correto → gestor — "+(c.nome)+"")});
                        }}><Check size={12}/>Confirmar Correto → Gestor</Btn>
                        <Btn size="sm" variant="blue" onClick={()=>{
                          const mots=fec.mots.map(cc=>cc.id!==c.id?cc:{...cc,etapa:"rev_gestor",decisaoOp:"refez",obsOp:"Operação refez o fechamento"});
                          upd({mots,hist:hist("Op. refez fechamento → gestor — "+(c.nome)+"")});
                        }}><RefreshCw size={12}/>Refez → Encaminhar Gestor</Btn>
                      </div>
                    </div>
                  )}
                  {c.etapa === "rev_gestor" && isGestOrDir && (
                    <div className="mt-1 bg-slate-900 border border-orange-500/20 rounded-lg px-3 py-2">
                      <p className="text-xs font-semibold text-slate-400 mb-1">Decisão da operação: <span className={c.decisaoOp==="confirmou"?"text-emerald-400":"text-blue-400"}>{c.decisaoOp==="confirmou"?"✓ Confirmou correto":"↻ Refez o fechamento"}</span></p>
                      <div className="flex gap-2">
                        <Btn size="sm" variant="success" onClick={()=>{
                          const mots=fec.mots.map(cc=>cc.id!==c.id?cc:{...cc,etapa:"agr",statusAgr:"pendente",comentarioAgr:"",nf:null,contestacao:null});
                          upd({mots,hist:hist("Gestor validou → reenviado ao agregado — "+(c.nome)+"")});
                        }}><Check size={12}/>Validar → Reenviar ao Agregado</Btn>
                        <Btn size="sm" variant="danger" onClick={()=>{
                          const mots=fec.mots.map(cc=>cc.id!==c.id?cc:{...cc,etapa:"revisao_op"});
                          upd({mots,hist:hist("Gestor devolveu à operação — "+(c.nome)+"")});
                        }}><X size={12}/>Devolver à Operação</Btn>
                      </div>
                    </div>
                  )}
                  {c.correcoes.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {c.correcoes.map(cr => (
                        <div key={cr.id} className="flex items-center justify-between bg-slate-900 rounded px-3 py-2 border border-blue-500/20">
                          <div><p className="text-xs font-semibold text-blue-300">CTE: {cr.ncte}{cr.data?" · "+(cr.data)+"":""}</p><p className="text-xs text-slate-400">{cr.justificativa}</p></div>
                          <div className="flex items-center gap-2">
                            <span className={"text-sm font-bold "+(cr.valor>=0?"text-emerald-400":"text-red-400")+""}>{cr.valor>=0?"+":""}{fmt(cr.valor)}</span>
                            {canEditCTE(etapa) && <button onClick={() => removeCorr(c.id, cr.id)} className="text-slate-600 hover:text-red-400"><Trash2 size={12}/></button>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0 space-y-1.5">
                  <p className="text-xl font-bold text-emerald-400">{fmt(c.totalBruto)}</p>

                  {/* CTE Manual — disponível em op, gest, fin, revisao_op */}
                  {canEditCTE(etapa) && (
                    <Btn size="sm" variant="secondary" onClick={() => setShowCorr(c.id)}><Plus size={12}/>CTE Manual</Btn>
                  )}

                  {/* OP: Enviar para Gestor */}
                  {canOp(etapa) && (
                    <Btn size="sm" variant="blue" onClick={() => advanceMotTo(c.id, "gest")}>
                      <Send size={12}/>Enviar ao Gestor
                    </Btn>
                  )}

                  {/* GEST: Saldo de débitos + Aprovar → Financeiro ou Devolver → Op */}
                  {canGestAppr(etapa) && (() => {
                    const motObj = (tickets||[]).length>0 ? null : null; // lookup by mat
                    const ticketsMotorista = (tickets||[]).filter(t => { const m=(typeof motoristas!=="undefined"?motoristas:[]).find(x=>x.id===t.motoristaId); return m && m.matricula===c.mat && t.status==="debitado"; });
                    const totalDebitos = ticketsMotorista.reduce((s,t) => s + (t.valor||0), 0);
                    const corrDebitos = (c.correcoes||[]).filter(cr => cr.valor < 0).reduce((s,cr) => s + cr.valor, 0);
                    const saldoTotal = totalDebitos + Math.abs(corrDebitos);
                    return (
                      <div className="flex flex-col gap-1">
                        {saldoTotal > 0 && (
                          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 mb-1">
                            <p className="text-xs font-bold text-red-400 mb-1">⚡ Saldo de Débitos</p>
                            {ticketsMotorista.map(t => (
                              <div key={t.id} className="flex justify-between text-xs">
                                <span className="text-slate-400 truncate max-w-[120px]">#{t.id.slice(-6).toUpperCase()} {t.titulo}</span>
                                <span className="text-red-400 font-semibold">-{fmt(t.valor||0)}</span>
                              </div>
                            ))}
                            {Math.abs(corrDebitos) > 0 && (
                              <div className="flex justify-between text-xs border-t border-red-500/20 mt-1 pt-1">
                                <span className="text-slate-400">Correções manuais</span>
                                <span className="text-red-400 font-semibold">{fmt(corrDebitos)}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-xs font-bold border-t border-red-500/20 mt-1 pt-1">
                              <span className="text-red-300">Total a debitar</span>
                              <span className="text-red-300">-{fmt(saldoTotal)}</span>
                            </div>
                          </div>
                        )}
                        <Btn size="sm" variant="success" onClick={() => advanceMotTo(c.id, "fin")}>
                          <Check size={12}/>Aprovar → Financeiro
                        </Btn>
                        <Btn size="sm" variant="danger" onClick={() => {
                          const obs = window.prompt ? window.prompt("Motivo da devolução:") : ""; if (obs !== null) rejectMotTo(c.id, "op", obs||"");
                        }}>
                          <XIcon size={12}/>Devolver à Operação
                        </Btn>
                      </div>
                    );
                  })()}

                  {/* FIN: Débitos de tickets + Aprovar → Agregado ou Devolver → Gestor */}
                  {canFinAppr(etapa) && (() => {
                    const ticketsPend = (tickets||[]).filter(t => { const m=(typeof motoristas!=="undefined"?motoristas:[]).find(x=>x.id===t.motoristaId); return m && m.matricula===c.mat && (t.status==="debitado"||t.status==="aguardando"); });
                    const jaCorrIds = new Set((c.correcoes||[]).map(cr => cr.ncte));
                    const ticketsNovos = ticketsPend.filter(t => !jaCorrIds.has("TICKET-"+t.id.slice(-6).toUpperCase()));
                    return (
                      <div className="flex flex-col gap-1">
                        {ticketsNovos.length > 0 && (
                          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-2 mb-1 space-y-1">
                            <p className="text-xs font-bold text-orange-400">📋 Tickets pendentes de débito</p>
                            {ticketsNovos.map(t => (
                              <div key={t.id} className="flex items-center justify-between gap-2">
                                <span className="text-xs text-slate-400 truncate max-w-[110px]">#{t.id.slice(-6).toUpperCase()} {t.titulo}</span>
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-red-400 font-semibold">-{fmt(t.valor||0)}</span>
                                  <button
                                    onClick={() => {
                                      const entry = { id: Math.random().toString(36).slice(2), tipo:"debito", ncte:"TICKET-"+t.id.slice(-6).toUpperCase(), data:new Date().toISOString().slice(0,10), valor:-Math.abs(t.valor||0), justificativa:"Débito ticket: "+t.titulo };
                                      const mots = fec.mots.map(cc => cc.id!==c.id ? cc : {...cc, correcoes:[...(cc.correcoes||[]), entry], totalBruto: cc.totalBruto - Math.abs(t.valor||0)});
                                      upd({ mots, hist: hist("Financeiro lançou débito ticket #"+t.id.slice(-6).toUpperCase()+" — "+fmt(t.valor||0), c.nome) });
                                    }}
                                    className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 whitespace-nowrap">
                                    + Lançar
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <Btn size="sm" variant="success" onClick={() => advanceMotTo(c.id, "agr")}>
                          <Check size={12}/>Liberar ao Agregado
                        </Btn>
                        <Btn size="sm" variant="danger" onClick={() => {
                          const obs = window.prompt ? window.prompt("Motivo da devolução:") : ""; if (obs !== null) rejectMotTo(c.id, "gest", obs||"");
                        }}>
                          <XIcon size={12}/>Devolver ao Gestor
                        </Btn>
                      </div>
                    );
                  })()}

                  {/* PAGO */}
                  {etapa === "fin" && isFinOrDir && (
                    <MotPagBtn mot={c} onPago={pagarMot}/>
                  )}
                </div>
              </div>
            </Card>
            );
          })}
        </div>
      )}

      {/* CTEs DE ENTREGA */}
      {tab === "ctes" && (
        <div className="space-y-3">
          <p className="text-xs text-slate-400">{fec.totalEntregas||0} entregas confirmadas de {fec.totalCTEs||0} CTEs totais</p>
          {fec.mots.map(c => (
            <Card key={c.id} className="overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b border-slate-700 bg-slate-900">
                <p className="text-sm font-semibold text-slate-100">{c.nome} <span className="text-xs text-slate-500 font-normal">Mat: {c.mat}</span></p>
                <span className="text-xs text-emerald-400 font-semibold">{c.totalCTEs} CTEs · {fmt(c.totalBruto)}</span>
              </div>
              {c.entregas.length > 0 ? (
                <div className="overflow-x-auto max-h-52">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-slate-800">
                      <tr>{["CTE","Pacotes","Data"].map(h => <th key={h} className="text-left text-slate-400 px-3 py-2 font-semibold">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {c.entregas.map((r, i) => (
                        <tr key={i} className="border-b border-slate-700/40 hover:bg-slate-700/20">
                          <td className="px-3 py-1.5 text-blue-400 font-mono">{r.ncte}</td>
                          <td className="px-3 py-1.5 text-center text-emerald-400 font-semibold">{r.qPacotes}</td>
                          <td className="px-3 py-1.5 text-slate-400">{r.data}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className="px-3 py-3 text-xs text-slate-500">Nenhuma entrega confirmada.</p>}
              {c.correcoes.length > 0 && (
                <div className="border-t border-slate-700 p-3 bg-blue-500/3">
                  <p className="text-xs text-blue-400 font-semibold mb-1">CTEs adicionados manualmente:</p>
                  {c.correcoes.map(cr => (
                    <div key={cr.id} className="flex items-center gap-4 text-xs py-0.5">
                      <span className="text-blue-400 font-mono">{cr.ncte}</span>
                      {cr.data && <span className="text-slate-400">{cr.data}</span>}
                      <span className="text-slate-400 flex-1">{cr.justificativa}</span>
                      <span className={"font-bold "+(cr.valor>=0?"text-emerald-400":"text-red-400")+""}>{cr.valor>=0?"+":""}{fmt(cr.valor)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* VISÃO FINANCEIRA — gestor/diretor only */}
      {tab === "financeiro" && isGestOrDir && (() => {
        // ── 3 entradas do fechamento ──
        const tde           = fec.tde             || 0;
        const comissao      = fec.planilhaJadlog?.totalCom || 0;
        const taxaEntrega   = fec.totalTaxaEntrega || 0;
        const taxaEntregaCad= (fec.mots||[]).reduce((s,c)=>s+(c.totalFaturado||0), 0);
        const taxaEntregaNok= (fec.nok||[]).reduce((s,n)=>s+(n.totalFaturado||0), 0);
        const totalReceita  = tde + comissao + taxaEntrega;
        // Sem cadastro: entra receita, não sai despesa
        const custoAgrCad   = fec.mots.reduce((s,c)=>s+(c.totalBruto||0),0);
        const saldo         = totalReceita - custoAgrCad;
        const margem        = totalReceita > 0 ? (saldo/totalReceita*100) : 0;

        return (
          <div className="space-y-4">
            {!comissao && !tde && taxaEntrega===0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-sm text-amber-300">
                <p className="font-semibold mb-1">⚠ Sem dados de receita</p>
                <p className="text-xs text-amber-400/70">Vá na aba <strong>📎 Planilhas & Receita</strong> para lançar TDE, importar a comissão e confirmar as taxas de entrega.</p>
              </div>
            )}

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard compact label="TDE" value={fmt(tde)} icon={Wallet} color="#60a5fa"/>
              <KpiCard compact label="Comissão" value={fmt(comissao)} icon={DollarSign} color="#10b981"/>
              <KpiCard compact label="Taxa Entrega" value={fmt(taxaEntrega)} icon={Truck} color="#f59e0b"/>
              <KpiCard compact label="Custo Agregados" value={fmt(custoAgrCad)} icon={Users} color="#ef4444"/>
            </div>

            {/* Saldo */}
            <Card className={"p-5 border-2 "+(saldo>=0?"border-emerald-500/40 bg-emerald-500/5":"border-red-500/40 bg-red-500/5")}>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">💰 Demonstrativo do Fechamento</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">TDE</span><span className="text-emerald-400 font-semibold">{fmt(tde)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Comissão (Jadlog)</span><span className="text-emerald-400 font-semibold">{fmt(comissao)}</span></div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Taxa de Entrega</span>
                  <span className="text-emerald-400 font-semibold">{fmt(taxaEntrega)}</span>
                </div>
                {taxaEntregaNok>0&&(
                  <div className="flex justify-between text-xs pl-3">
                    <span className="text-amber-400/70">↳ Sem cadastro ({(fec.nok||[]).length}) — entra receita, sem despesa</span>
                    <span className="text-amber-400/70">+{fmt(taxaEntregaNok)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-700 pt-2 font-bold">
                  <span className="text-slate-200">Total Receita</span><span className="text-emerald-400 text-base">{fmt(totalReceita)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-700/50 pt-2">
                  <span className="text-slate-400">(-) Custo Agregados Cadastrados</span><span className="text-red-400 font-semibold">-{fmt(custoAgrCad)}</span>
                </div>
                <div className={"flex justify-between border-t-2 pt-3 items-center "+(saldo>=0?"border-emerald-500/40":"border-red-500/40")}>
                  <span className="text-slate-100 font-bold text-base">SALDO</span>
                  <div className="text-right">
                    <p className={"text-3xl font-black "+(saldo>=0?"text-emerald-400":"text-red-400")}>{fmt(saldo)}</p>
                    <p className={"text-xs "+(margem>=0?"text-emerald-400/70":"text-red-400/70")}>{margem.toFixed(1)}% margem</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        );
      })()}


      {/* LINKS AGREGADOS */}
      {tab === "links" && <PainelLinks fec={fec} motoristas={motoristas} />}
      {tab === "receita" && <ReceitaFechamento fec={fec} upd={upd} />}

      {/* HISTÓRICO */}
      {tab === "hist" && (
        <div className="space-y-2">
          {[...(fec.hist||[])].reverse().map((h, i) => (
            <div key={i} className="flex gap-3 p-3 bg-slate-900 rounded-lg border border-slate-700">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-200">{h.acao}</p>
                  <span className="text-xs text-slate-500">{fmtDate(h.ts)}</span>
                </div>
                <p className="text-xs text-slate-400">{h.quem}{h.obs ? " — "+(h.obs)+"" : ""}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCorr && (
        <CorrecaoModal
          nome={fec.mots.find(c => c.id === showCorr)?.nome || ""}
          onClose={() => setShowCorr(null)}
          onSave={corr => addCorrecao(showCorr, corr)}
        />
      )}
    </div>
  );
}

// ── Lista de fechamentos ─────────────────────────────────
// ─────────────────────────────────────────────
// DRE INTEGRADO AO FECHAMENTO
// ─────────────────────────────────────────────
function SLABadge({ criadoEm, slaDias, prazoData }) {
  // Use prazoData (specific date) if set
  if (prazoData) {
    const prazo = new Date(prazoData+"T23:59:59");
    const now_  = new Date();
    const diffMs = prazo - now_;
    const diffD  = Math.ceil(diffMs/(1000*60*60*24));
    const cls = diffD<=0?"bg-red-500/20 text-red-400":diffD<=2?"bg-amber-500/20 text-amber-400":"bg-blue-500/20 text-blue-400";
    return <span className={"text-xs font-bold px-2 py-0.5 rounded "+cls}>{diffD<=0?"Vencido":diffD+"d restantes"}</span>;
  }
  // Fall back to business days
  const FERIADOS = new Set(["01/01","21/04","01/05","07/09","12/10","02/11","15/11","25/12"]);
  const isFer = d => { const s=String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0'); return FERIADOS.has(s); };
  const cur = new Date(criadoEm||new Date()); cur.setDate(cur.getDate()+1); cur.setHours(0,0,0,0);
  const end = new Date(); end.setHours(0,0,0,0);
  let du = 0; const tmp = new Date(cur);
  while(tmp<=end){if(tmp.getDay()!==0&&tmp.getDay()!==6&&!isFer(tmp))du++;tmp.setDate(tmp.getDate()+1);}
  const rest = (slaDias||5) - du;
  const cls = rest<=0 ? "bg-red-500/20 text-red-400" : rest<=2 ? "bg-amber-500/20 text-amber-400" : "bg-blue-500/20 text-blue-400";
  return <span className={"text-xs font-bold px-2 py-0.5 rounded "+cls}>{rest<=0?"Vencido":rest+"d restantes"}</span>;
}

// ─────────────────────────────────────────────
// ATENDIMENTO — ACAREAÇÃO COM AGREGADOS
// ─────────────────────────────────────────────
const TICKET_STATUS = {
  aberto:     { label:"Aberto",           cor:"#f59e0b" },
  aguardando: { label:"Aguard. Agregado", cor:"#60a5fa" },
  respondido: { label:"Respondido",       cor:"#10b981" },
  contestado: { label:"Contestado",       cor:"#a78bfa" },
  debitado:   { label:"Debitado",         cor:"#ef4444" },
  encerrado:  { label:"Encerrado",        cor:"#64748b" },
};

const SLA_DIAS_TICKET = 5; // dias úteis para o agregado responder

// ── Atendimento helpers ──
// ── Atendimento helpers (module level) ──────────────────
const exportarPDF = (tickets, filtStatus, motoristas) => {
  const alvo = tickets.filter(t => filtStatus === "todos"
    ? ["aberto","aguardando","respondido","debitado","contestado"].includes(t.status)
    : t.status === filtStatus);
  if (!alvo.length) { alert("Nenhum ticket para exportar."); return; }
  const rows = alvo.map(t => {
    const mot = (motoristas||[]).find(m=>m.id===t.motoristaId);
    const st  = TICKET_STATUS[t.status]||TICKET_STATUS.aberto;
    const isImg = d => d && d.startsWith("data:image");
    const evidHTML = t.pdfData ? (isImg(t.pdfData)
      ? "<div class=\"section-label\">Evidência</div><img src=\""+t.pdfData+"\" style=\"max-width:100%;max-height:280px;border:1px solid #e2e8f0;border-radius:6px\" />"
      : "<div class=\"section-label\">Evidência</div><p style=\"color:#3b82f6\">📎 "+t.pdfNome+"</p>") : "";
    const respHTML = t.respostaData ? (isImg(t.respostaData)
      ? "<div class=\"section-label\">Resposta do Agregado</div><img src=\""+t.respostaData+"\" style=\"max-width:100%;max-height:280px;border:2px solid #10b981;border-radius:6px\" /><p style=\"color:#10b981;font-size:9pt\">"+t.respondidoEm?.slice(0,10)+"</p>"
      : "<div class=\"section-label\">Resposta</div><p style=\"color:#10b981\">📎 "+t.respostaNome+"</p>") : "";
    return "<div class=\"ticket\">"+
      "<div class=\"ticket-header\">"+
      "<div><div class=\"ticket-code\">#"+t.id.slice(-6).toUpperCase()+"</div>"+
      "<div class=\"ticket-title\">"+(t.titulo||"")+"</div></div>"+
      "<div class=\"ticket-badge\" style=\"border-color:"+st.cor+";color:"+st.cor+"\">"+st.label+"</div></div>"+
      "<table class=\"info-table\">"+
      "<tr><td class=\"label\">Agregado</td><td>"+((mot?.nome||t.nomeAgregado||"—"))+" — Mat. "+(mot?.matricula||"—")+"</td></tr>"+
      "<tr><td class=\"label\">Valor</td><td class=\"valor\">R$ "+((t.valor||0).toFixed(2).replace(".",","))+"</td></tr>"+
      "<tr><td class=\"label\">Prazo</td><td>"+(t.prazoData||(String(t.slaDias||5)+" dias"))+"</td></tr>"+
      "<tr><td class=\"label\">Aberto em</td><td>"+((t.criadoEm||"").slice(0,10))+" por "+(t.criadoNome||"—")+"</td></tr>"+
      "<tr><td class=\"label\">Status</td><td style=\"color:"+st.cor+";font-weight:bold\">"+st.label+"</td></tr>"+
      "</table>"+
      (t.descricao?"<div class=\"section-label\">Descrição</div><div class=\"descricao\">"+t.descricao+"</div>":"")+
      evidHTML+respHTML+
      "<div class=\"assinaturas\">"+
      "<div class=\"assinatura-box\"><div class=\"linha\"></div><div class=\"assinatura-label\">Operação / "+(t.criadoNome||"—")+"</div></div>"+
      "<div class=\"assinatura-box\"><div class=\"linha\"></div><div class=\"assinatura-label\">Agregado / "+((mot?.nome||t.nomeAgregado||"—"))+"</div></div>"+
      "</div></div>";
  }).join("");
  const css = "@page{size:A4;margin:20mm 15mm}body{font-family:Arial;font-size:11pt;color:#111;margin:0}" +
    ".ticket{border:2px solid #1e293b;border-radius:8px;padding:20px;margin-bottom:24px;page-break-inside:avoid}" +
    ".ticket-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;border-bottom:1px solid #e2e8f0;padding-bottom:12px}" +
    ".ticket-code{font-size:10pt;color:#64748b;font-family:monospace}.ticket-title{font-size:14pt;font-weight:bold;color:#0f172a;margin-top:4px}" +
    ".ticket-badge{border:2px solid;border-radius:20px;padding:4px 12px;font-size:10pt;font-weight:bold}" +
    ".info-table{width:100%;border-collapse:collapse;margin-bottom:14px}.info-table td{padding:5px 8px;border-bottom:1px solid #f1f5f9}" +
    ".label{color:#64748b;font-size:10pt;width:140px;font-weight:600}.valor{font-size:13pt;font-weight:bold;color:#dc2626}" +
    ".section-label{font-size:9pt;color:#64748b;font-weight:700;text-transform:uppercase;margin:10px 0 4px}" +
    ".descricao{background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:10px;font-size:10.5pt;white-space:pre-wrap}" +
    ".assinaturas{display:flex;gap:40px;margin-top:28px}.assinatura-box{flex:1;text-align:center}" +
    ".linha{border-top:1.5px solid #1e293b;margin-bottom:6px}.assinatura-label{font-size:9.5pt;color:#475569}" +
    ".header-doc{text-align:center;margin-bottom:30px}.header-doc h1{font-size:16pt;color:#0f172a;margin:0}" +
    ".header-doc p{font-size:10pt;color:#64748b;margin:4px 0 0}";
  const html = "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"><title>Acareações</title><style>"+css+"</style></head><body>"+
    "<div class=\"header-doc\"><h1>Grupo All Logística — Acareações</h1>"+
    "<p>Emitido em "+new Date().toLocaleDateString("pt-BR")+" · "+alvo.length+" ticket(s)</p></div>"+
    rows+"\x3cscript\x3ewindow.onload=function(){window.print();}\x3c/script\x3e</body></html>";
  const blob = new Blob([html], {type:"text/html;charset=utf-8"});
  const url  = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href=url; a.target="_blank"; a.rel="noopener";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url), 10000);
};

const exportarWord = (t, motoristas) => {
  if (!t) return;
  const mot = (motoristas||[]).find(m=>m.id===t.motoristaId);
  const st  = TICKET_STATUS[t.status]||TICKET_STATUS.aberto;
  const html = "<html xmlns:o=\"urn:schemas-microsoft-com:office:office\"><head><meta charset=\"UTF-8\">"+
    "<style>body{font-family:Arial;font-size:11pt;margin:2cm}h1{font-size:16pt;border-bottom:2pt solid #000;padding-bottom:8pt}"+
    "table{width:100%;border-collapse:collapse}td{padding:6pt 10pt;border-bottom:1pt solid #ddd}"+
    ".label{color:#666;width:140pt;font-weight:bold}.valor{color:#dc2626;font-size:14pt;font-weight:bold}</style></head><body>"+
    "<h1>ACAREAÇÃO — #"+t.id.slice(-6).toUpperCase()+"</h1>"+
    "<p><b>Grupo All Logística</b> — "+new Date().toLocaleDateString("pt-BR")+"</p>"+
    "<table>"+
    "<tr><td class=\"label\">Título</td><td>"+(t.titulo||"")+"</td></tr>"+
    "<tr><td class=\"label\">Agregado</td><td>"+((mot?.nome||t.nomeAgregado||"—"))+" — Mat. "+(mot?.matricula||"—")+"</td></tr>"+
    "<tr><td class=\"label\">Valor</td><td class=\"valor\">R$ "+((t.valor||0).toFixed(2).replace(".",","))+"</td></tr>"+
    "<tr><td class=\"label\">Prazo</td><td>"+(t.prazoData||(String(t.slaDias||5)+" dias"))+"</td></tr>"+
    "<tr><td class=\"label\">Status</td><td>"+st.label+"</td></tr>"+
    "<tr><td class=\"label\">Aberto em</td><td>"+((t.criadoEm||"").slice(0,10))+" por "+(t.criadoNome||"—")+"</td></tr>"+
    "</table>"+
    (t.descricao?"<p><b>Descrição:</b></p><p style=\"white-space:pre-wrap;background:#f8fafc;padding:10pt\">"+t.descricao+"</p>":"")+
    "<br><br><table style=\"margin-top:60pt\"><tr>"+
    "<td style=\"width:45%;text-align:center;border-top:1pt solid #000;padding-top:6pt\">Operação / "+(t.criadoNome||"—")+"</td>"+
    "<td style=\"width:10%\"></td>"+
    "<td style=\"width:45%;text-align:center;border-top:1pt solid #000;padding-top:6pt\">Agregado / "+((mot?.nome||t.nomeAgregado||"—"))+"</td>"+
    "</tr></table></body></html>";
  const blob = new Blob(["\uFEFF"+html], {type:"application/msword"});
  const url  = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href=url; a.download="Acareacao_"+t.id.slice(-6).toUpperCase()+".doc";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url),5000);
};

const sendWhatsApp = (t, motoristas, updTicket) => {
  const mot = (motoristas||[]).find(m=>m.id===t.motoristaId);
  if (!mot?.telefone) { alert("Motorista sem WhatsApp cadastrado. Cadastre o telefone em Fechamento → Motoristas."); return; }
  const phone = mot.telefone.replace(/\D/g,"");
  const full  = phone.startsWith("55")?phone:"55"+phone;
  const prazo = t.prazoData||("Prazo: "+String(t.slaDias||5)+" dias");
  const msg   = encodeURIComponent(
    "⚠ ACAREAÇÃO #"+t.id.slice(-6).toUpperCase()+"\n\n"+
    "Você recebeu uma notificação de prejuízo.\n"+
    "Valor: R$ "+(t.valor||0).toFixed(2).replace(".",",")+"\n"+
    "Prazo: "+prazo+"\n\n"+
    "Acesse o portal com sua matrícula: "+window.location.origin
  );
  const a = document.createElement("a");
  a.href="https://wa.me/"+full+"?text="+msg;
  a.target="_blank"; a.rel="noopener";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  if (updTicket) updTicket(t.id, {status:"aguardando", whatsappEnviadoEm:new Date().toISOString()});
};

function AtendimentoView({ user, tickets, setTickets, motoristas, users, fechamentos, setFechamentos }) {
  const [showNew, setShowNew]     = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [filtStatus, setFiltStatus] = useState("todos");
  const [filtSearch, setFiltSearch] = useState("");

  const selected = tickets.find(t=>t.id===selectedId);

  const addHistorico = (ticket, texto, tipo="acao") => ({
    historico: [...(ticket.historico||[]), { id:uid(), tipo, texto, autor:user.name, data:now() }]
  });

  const criarDebitoFechamento = (ticket) => {
    if (!setFechamentos || !fechamentos) return;
    const mot = (motoristas||[]).find(m=>m.id===ticket.motoristaId);
    if (!mot) return;
    const code = "#"+ticket.id.slice(-6).toUpperCase();
    const ncteKey = "TICKET-"+ticket.id.slice(-6).toUpperCase();
    const debitEntry = { id:uid(), tipo:"debito", ncte:ncteKey, data:now().slice(0,10), valor:-Math.abs(ticket.valor||0), justificativa:"Débito automático — Ticket "+code+": "+(ticket.titulo||"") };
    setFechamentos(prev => {
      // Find most recent open fechamento for this motorista by matricula
      let bestIdx = -1;
      prev.forEach((f, idx) => {
        const motRec = (f.mots||[]).find(m => m.mat === mot.matricula);
        if (motRec && motRec.etapa !== "pago") {
          if (bestIdx === -1 || (f.criadoEm||"") > (prev[bestIdx].criadoEm||"")) bestIdx = idx;
        }
      });
      if (bestIdx < 0) return prev; // no open fechamento found
      const fec = prev[bestIdx];
      // Avoid duplicate debit for same ticket
      const jaLancado = (fec.mots||[]).some(m => m.mat===mot.matricula && (m.correcoes||[]).some(cr=>cr.ncte===ncteKey));
      if (jaLancado) return prev;
      const newMots = (fec.mots||[]).map(m => {
        if (m.mat !== mot.matricula) return m;
        return { ...m, correcoes: [...(m.correcoes||[]), debitEntry], totalBruto: (m.totalBruto||0) - Math.abs(ticket.valor||0) };
      });
      const updated = [...prev];
      updated[bestIdx] = { ...fec, mots: newMots };
      return updated;
    });
  };

  const saveTicket = t => {
    const hist = [{ id:uid(), tipo:"criacao", texto:"Ticket criado por "+user.name, autor:user.name, data:now() }];
    setTickets(p=>[...p,{...t,id:uid(),criadoEm:now(),criadoPor:user.id,criadoNome:user.name,historico:hist}]);
    setShowNew(false);
  };
  const updTicket = (id, patch) => setTickets(p=>p.map(t=>{
    if (t.id!==id) return t;
    let histEntry = null;
    if (patch.status==="debitado" && t.status!=="debitado") {
      histEntry = { id:uid(), tipo:"debito", texto:"Valor debitado: R$ "+(t.valor||0).toFixed(2).replace(".",","), autor:user.name, data:now() };
      setTimeout(()=>criarDebitoFechamento({...t,...patch}), 0);
    } else if (patch.status==="encerrado") {
      histEntry = { id:uid(), tipo:"encerrado", texto:"Ticket encerrado por "+user.name, autor:user.name, data:now() };
    } else if (patch.status==="aguardando" && patch.whatsappEnviadoEm) {
      histEntry = { id:uid(), tipo:"whatsapp", texto:"WhatsApp enviado ao agregado", autor:user.name, data:now() };
    } else if (patch.status==="respondido") {
      histEntry = { id:uid(), tipo:"resposta", texto:"Agregado enviou evidência: "+(patch.respostaNome||"arquivo"), autor:"Agregado", data:now() };
    } else if (patch.status==="contestado") {
      histEntry = { id:uid(), tipo:"contestacao", texto:"Ticket contestado — novo ticket aberto", autor:user.name, data:now() };
    }
    const historico = histEntry ? [...(t.historico||[]), histEntry] : (t.historico||[]);
    return { ...t, ...patch, historico };
  }));
  const delTicket  = id => setTickets(p=>p.filter(t=>t.id!==id));

  // Check SLA overdue and auto-debit
  const checkSLA = () => {
    const FERIADOS = new Set(["01/01","21/04","01/05","07/09","12/10","02/11","15/11","25/12"]);
    const isFer = d => { const s=String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0'); return FERIADOS.has(s); };
    const calcDU = startIso => {
      const cur = new Date(startIso); cur.setDate(cur.getDate()+1); cur.setHours(0,0,0,0);
      const end = new Date(); end.setHours(0,0,0,0);
      let d=0; const tmp=new Date(cur);
      while(tmp<=end){if(tmp.getDay()!==0&&tmp.getDay()!==6&&!isFer(tmp))d++;tmp.setDate(tmp.getDate()+1);}
      return d;
    };
    setTickets(p=>p.map(t=>{
      if (t.status!=="aguardando") return t;
      // Use prazoData (specific date) if set, otherwise fall back to slaDias
      let venceu = false;
      if (t.prazoData) {
        venceu = new Date() >= new Date(t.prazoData+"T23:59:59");
      } else {
        const du = calcDU(t.criadoEm);
        venceu = du > (t.slaDias||SLA_DIAS_TICKET);
      }
      if (venceu) {
        const histEntry = { id:uid(), tipo:"debito", texto:"Débito automático por vencimento de prazo", autor:"Sistema", data:now() };
        const updated = {...t, status:"debitado", debitadoEm:now(), obs:(t.obs||"")+" [Auto-debitado por vencimento de prazo]", historico:[...(t.historico||[]), histEntry]};
        setTimeout(()=>criarDebitoFechamento(updated), 0);
        return updated;
      }
      return t;
    }));
  };

  useEffect(()=>{ checkSLA(); }, []);

  // Export all open/pending tickets as printable HTML → PDF
  const canEdit = user.role!=="auditor";
  const [filtDtIni, setFiltDtIni] = useState("");
  const [filtDtFim, setFiltDtFim] = useState("");

  const visible = tickets.filter(t=>{
    if (filtStatus!=="todos" && t.status!==filtStatus) return false;
    if (filtDtIni && (t.prazoData||t.criadoEm?.slice(0,10)) < filtDtIni) return false;
    if (filtDtFim && (t.prazoData||t.criadoEm?.slice(0,10)) > filtDtFim) return false;
    if (filtSearch.trim()) {
      const q = filtSearch.trim().toLowerCase();
      const matchTitulo = (t.titulo||"").toLowerCase().includes(q);
      const matchCTE = (t.cte||"").includes(filtSearch.trim().replace(/[^0-9]/g,""));
      if (!matchTitulo && !matchCTE) return false;
    }
    return true;
  });

  if (selected) return (
    <TicketDetalheWrapper
      ticket={selected} user={user} motoristas={motoristas}
      onBack={()=>setSelectedId(null)}
      onUpd={patch=>updTicket(selected.id,patch)}
      onDel={()=>{delTicket(selected.id);setSelectedId(null);}}
      onWhats={()=>sendWhatsApp(selected, motoristas, updTicket)}
      onWord={()=>exportarWord(selected, motoristas)}
      onNewTicket={t=>{ saveTicket({...t, parentId:selected.id}); updTicket(selected.id,{status:"contestado",contestadoEm:now()}); setSelectedId(null); }}
    />
  );

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-xl font-bold text-slate-100">Atendimento — Acareação</h1>
          <p className="text-sm text-slate-400">{tickets.length} ticket(s) · {tickets.filter(t=>t.status==="aguardando").length} aguardando resposta</p></div>
        {canEdit&&<Btn onClick={()=>setShowNew(true)}><Plus size={14}/>Novo Ticket</Btn>}
        <Btn variant="secondary" onClick={()=>exportarPDF(tickets,filtStatus,motoristas)}><FileText size={14}/>Exportar PDF</Btn>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"/>
          <input value={filtSearch} onChange={e=>setFiltSearch(e.target.value)}
            placeholder="Buscar título ou CTE..."
            className="pl-8 pr-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-red-500 w-52"/>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[["todos","Todos"],...Object.entries(TICKET_STATUS).map(([k,v])=>[k,v.label])].map(([k,l])=>(
            <button key={k} onClick={()=>setFiltStatus(k)}
              className={"text-xs px-3 py-1.5 rounded-full font-semibold border transition-all "+(filtStatus===k?"bg-red-600 text-white border-red-600":"bg-slate-800 text-slate-400 border-slate-700")}>
              {l} {k!=="todos"&&<span className="ml-1">({tickets.filter(t=>t.status===k).length})</span>}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-400">
          <span>Prazo de</span>
          <input type="date" value={filtDtIni} onChange={e=>setFiltDtIni(e.target.value)}
            className="bg-transparent text-slate-200 text-xs focus:outline-none"/>
          <span>até</span>
          <input type="date" value={filtDtFim} onChange={e=>setFiltDtFim(e.target.value)}
            className="bg-transparent text-slate-200 text-xs focus:outline-none"/>
          {(filtDtIni||filtDtFim)&&<button onClick={()=>{setFiltDtIni("");setFiltDtFim("");}} className="text-red-400 text-xs hover:text-red-300">✕</button>}
        </div>
      </div>

      {/* Ticket list */}
      <div className="space-y-3">
        {visible.length===0&&<p className="text-slate-500 text-sm text-center py-10">Nenhum ticket encontrado.</p>}
        {visible.sort((a,b)=>b.criadoEm.localeCompare(a.criadoEm)).map(t=>{
          const mot   = motoristas.find(m=>m.id===t.motoristaId);
          const st    = TICKET_STATUS[t.status]||TICKET_STATUS.aberto;
          const code  = "#"+t.id.slice(-6).toUpperCase();
          return (
            <Card key={t.id} className="p-4 hover:border-slate-500 transition-all border-slate-700">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 cursor-pointer" onClick={()=>setSelectedId(t.id)}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-slate-500">{code}</span>
                    <span className="text-sm font-bold text-slate-100">{t.titulo}</span>
                    <Badge color={st.cor}>{st.label}</Badge>
                    {t.status==="aguardando"&&<SLABadge criadoEm={t.criadoEm} slaDias={t.slaDias} prazoData={t.prazoData}/>}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{mot?.nome||t.nomeAgregado} · {t.cte&&<span className="text-blue-400 font-mono">CTE {t.cte} · </span>}R$ {(t.valor||0).toFixed(2).replace(".",",")} · {t.criadoEm?.slice(0,10)}</p>
                  {t.descricao&&<p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{t.descricao}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {canEdit&&t.status==="aberto"&&(
                    <button onClick={e=>{e.stopPropagation();sendWhatsApp(t, motoristas, updTicket);}}
                      className="text-xs px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30">
                      📱 WhatsApp
                    </button>
                  )}
                  <button onClick={()=>setSelectedId(t.id)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 font-semibold transition-all">
                    Abrir →
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {showNew&&<NovoTicketModal motoristas={motoristas} onClose={()=>setShowNew(false)} onSave={saveTicket}/>}
    </div>
  );
}

function NovoTicketModal({ motoristas, onClose, onSave, tituloInicial }) {
  const fileRef = useRef();
  const defaultPrazo = new Date(); defaultPrazo.setDate(defaultPrazo.getDate()+5);
  const [f, setF] = useState({ titulo:tituloInicial||"", cte:"", descricao:"", motoristaId:"", nomeAgregado:"", matricula:"", valor:"", prazoData:defaultPrazo.toISOString().slice(0,10), status:"aberto", pdfNome:"", pdfData:null });
  const sf = (k,v) => setF(p=>({...p,[k]:v}));
  const handlePDF = e => {
    const file=e.target.files?.[0]; if(!file) return;
    const r=new FileReader(); r.onload=ev=>{sf("pdfNome",file.name);sf("pdfData",ev.target.result);}; r.readAsDataURL(file);
  };
  const mot = motoristas.find(m=>m.id===f.motoristaId);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
        <h3 className="text-base font-bold text-slate-100">{tituloInicial?"Abrir Contestação":"Novo Ticket de Acareação"}</h3>
        <Input label="Título *" placeholder="Ex: Avaria, Extravio, Devolução..." value={f.titulo} onChange={e=>sf("titulo",e.target.value)}/>
        <Input label="Número do CTE" placeholder="Ex: 1234567" value={f.cte} onChange={e=>sf("cte",e.target.value.replace(/\D/g,""))}/>
        <div>
          <label className="text-xs text-slate-400 font-medium block mb-1">Agregado</label>
          <select value={f.motoristaId}
            onChange={e=>{const m=motoristas.find(x=>x.id===e.target.value); sf("motoristaId",e.target.value); sf("nomeAgregado",m?.nome||""); sf("matricula",m?.matricula||"");}}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-red-500">
            <option value="">Selecione o agregado...</option>
            {motoristas.filter(m=>m.ativo).map(m=><option key={m.id} value={m.id}>{m.nome} — Mat. {m.matricula}</option>)}
          </select>
          {mot?.telefone&&<p className="text-xs text-emerald-400/70 mt-1">📱 {mot.telefone}</p>}
        </div>
        <Input label="Valor do Prejuízo (R$)" type="number" step="0.01" placeholder="0,00" value={f.valor} onChange={e=>sf("valor",e.target.value)}/>
        <div>
          <label className="text-xs text-slate-400 font-medium block mb-1">Prazo máximo para resposta</label>
          <input type="date" value={f.prazoData} min={new Date().toISOString().slice(0,10)}
            onChange={e=>sf("prazoData",e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-red-500"/>
          <p className="text-xs text-slate-500 mt-1">Sem resposta até esta data → debitado automaticamente.</p>
        </div>
        <div>
          <label className="text-xs text-slate-400 font-medium block mb-1">Descrição</label>
          <textarea value={f.descricao} onChange={e=>sf("descricao",e.target.value)} rows={3} placeholder="Detalhe o ocorrido..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-red-500 resize-none"/>
        </div>
        <div>
          <label className="text-xs text-slate-400 font-medium block mb-2">Evidência (PDF / imagem)</label>
          {f.pdfNome ? (
            <div className="flex items-center justify-between bg-slate-900 rounded-lg px-3 py-2 border border-slate-700">
              <p className="text-sm text-emerald-400">📎 {f.pdfNome}</p>
              <button onClick={()=>{sf("pdfNome","");sf("pdfData",null);}} className="text-slate-500 hover:text-red-400 text-xs">Remover</button>
            </div>
          ) : (
            <button onClick={()=>fileRef.current?.click()}
              className="w-full border border-dashed border-slate-600 rounded-lg p-4 text-sm text-slate-400 hover:border-slate-400 transition-all">
              📎 Anexar PDF ou imagem como evidência
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handlePDF}/>
        </div>
        <div className="flex gap-3 pt-1">
          <Btn className="flex-1 justify-center" disabled={!f.titulo||!f.motoristaId||!f.valor||!f.prazoData}
            onClick={()=>onSave({...f,valor:Number(f.valor)})}>Abrir Ticket</Btn>
          <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
        </div>
      </div>
    </div>
  );
}

function TicketDetalheWrapper({ ticket, user, motoristas, onBack, onUpd, onDel, onWhats, onWord, onNewTicket }) {
  const [showContest, setShowContest] = useState(false);
  return (
    <div>
      <TicketDetalhe ticket={ticket} user={user} motoristas={motoristas}
        onBack={onBack} onUpd={onUpd} onDel={onDel} onWhats={onWhats} onWord={onWord}
        onContestar={()=>setShowContest(true)}/>
      {showContest&&<NovoTicketModal motoristas={motoristas}
        tituloInicial={"[CONTESTAÇÃO] "+ticket.titulo}
        onClose={()=>setShowContest(false)}
        onSave={t=>{ onNewTicket(t); setShowContest(false); }}/>}
    </div>
  );
}

function TicketDetalhe({ ticket, user, motoristas, onBack, onUpd, onDel, onWhats, onWord, onContestar }) {
  const fileRef = useRef();
  const camRef  = useRef();
  const mot     = (motoristas||[]).find(m=>m.id===ticket.motoristaId);
  const st      = TICKET_STATUS[ticket.status]||TICKET_STATUS.aberto;
  const code    = "#"+ticket.id.slice(-6).toUpperCase();
  const canEdit = user.role!=="auditor";
  const handleResposta = e => {
    const file=e.target.files?.[0]; if(!file) return;
    const r=new FileReader();
    r.onload=ev=>onUpd({status:"respondido",respostaNome:file.name,respostaData:ev.target.result,respondidoEm:now()});
    r.readAsDataURL(file);
  };
  const isImg = d => d&&d.startsWith("data:image");
  return (
    <div className="p-6 space-y-5 max-w-2xl">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"><ArrowLeft size={18}/></button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-slate-500">{code}</span>
            <h1 className="text-lg font-bold text-slate-100">{ticket.titulo}</h1>
            <Badge color={st.cor}>{st.label}</Badge>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-xs text-slate-400">{mot?.nome||ticket.nomeAgregado} · {(ticket.criadoEm||"").slice(0,10)} por {ticket.criadoNome}</p>
            {ticket.cte&&<p className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">📋 CTE {ticket.cte}</p>}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={onWord} className="px-3 py-1.5 rounded-lg text-xs font-bold text-blue-400 border border-blue-500/30 hover:bg-blue-500/10">📄 Word</button>
          {canEdit&&ticket.status==="aberto"&&(
            <button onClick={onWhats} className="px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10">📱 WhatsApp</button>
          )}
          {canEdit&&ticket.status==="respondido"&&(
            <>
              <button onClick={()=>onUpd({status:"encerrado",encerradoEm:now()})} className="px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10">✓ Encerrar</button>
              <button onClick={onContestar} className="px-3 py-1.5 rounded-lg text-xs font-bold text-purple-400 border border-purple-500/30 hover:bg-purple-500/10">↺ Contestar</button>
            </>
          )}
          {canEdit&&(ticket.status==="aguardando"||ticket.status==="aberto")&&(
            <>
              <button onClick={()=>{
                if(window.confirm("Confirmar EXTRAVIO?\nO valor R$ "+(ticket.valor||0).toFixed(2).replace(".",",")+" será debitado automaticamente do agregado.")) {
                  onUpd({status:"debitado", debitadoEm:now(), motivoDebito:"extravio", obs:(ticket.obs||"")+" [Extravio confirmado]"});
                }
              }} className="px-3 py-1.5 rounded-lg text-xs font-bold text-orange-400 border border-orange-500/30 hover:bg-orange-500/10">
                📦 Extraviar
              </button>
              <button onClick={()=>{
                if(window.confirm("Debitar R$ "+(ticket.valor||0).toFixed(2).replace(".",",")+" do agregado?")) {
                  onUpd({status:"debitado", debitadoEm:now()});
                }
              }} className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-400 border border-red-500/30 hover:bg-red-500/10">
                ⚡ Debitar
              </button>
            </>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 text-center"><p className="text-xs text-slate-500 mb-1">Valor</p><p className="text-xl font-bold text-red-400">R$ {(ticket.valor||0).toFixed(2).replace(".",",")}</p></Card>
        <Card className="p-3 text-center"><p className="text-xs text-slate-500 mb-1">Prazo</p><p className="text-sm font-bold text-amber-400">{ticket.prazoData||String(ticket.slaDias||5)+"d"}</p></Card>
        <Card className="p-3 text-center"><p className="text-xs text-slate-500 mb-1">Agregado</p><p className="text-sm font-bold text-slate-200 truncate">{mot?.nome||ticket.nomeAgregado}</p></Card>
        <Card className="p-3 text-center"><p className="text-xs text-slate-500 mb-1">Status</p><p className="text-sm font-bold" style={{color:st.cor}}>{st.label}</p></Card>
      </div>

      {/* Descrição */}
      {ticket.descricao&&(
        <Card className="p-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Descrição</p>
          <p className="text-sm text-slate-300 whitespace-pre-wrap">{ticket.descricao}</p>
        </Card>
      )}

      {/* Evidência */}
      {ticket.pdfData&&(
        <Card className="p-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">📎 Evidência — {ticket.pdfNome||"anexo"}</p>
          {isImg(ticket.pdfData)
            ? <img src={ticket.pdfData} alt="evidencia" className="max-w-full rounded-lg border border-slate-700" style={{maxHeight:"300px"}}/>
            : <a href={ticket.pdfData} download={ticket.pdfNome||"evidencia.pdf"} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 text-sm hover:bg-blue-500/30">
                📄 Baixar PDF
              </a>
          }
        </Card>
      )}

      {/* Resposta */}
      <Card className="p-4">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Resposta do Agregado</p>
        {ticket.respostaNome ? (
          <div className="space-y-2">
            <p className="text-xs text-emerald-400">✅ Respondido em {(ticket.respondidoEm||"").slice(0,10)} — {ticket.respostaNome}</p>
            {isImg(ticket.respostaData)&&<img src={ticket.respostaData} alt="resposta" className="max-w-full rounded-lg border border-emerald-500/30" style={{maxHeight:"250px"}}/>}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-500 text-center py-3">{ticket.status==="aguardando"?"Aguardando resposta...":"Sem resposta ainda."}</p>
            {canEdit&&ticket.status!=="encerrado"&&ticket.status!=="debitado"&&(
              <div>
                <p className="text-xs text-slate-500 mb-2">Anexar resposta manualmente:</p>
                <div className="flex gap-2">
                  <button onClick={()=>fileRef.current?.click()} className="flex-1 py-2 rounded-lg border border-slate-700 text-xs text-slate-400 hover:border-slate-500">📎 Arquivo</button>
                  <button onClick={()=>camRef.current?.click()} className="flex-1 py-2 rounded-lg border border-slate-700 text-xs text-slate-400 hover:border-slate-500">📷 Foto</button>
                </div>
                <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleResposta}/>
                <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleResposta}/>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Debitado */}
      {ticket.status==="debitado"&&(
        <Card className="p-4 border border-red-500/30 bg-red-500/5">
          <p className="text-xs font-bold text-red-400 mb-1">{ticket.motivoDebito==="extravio"?"📦 Extravio — Débito Automático":"⚡ Valor Debitado"}</p>
          <p className="text-2xl font-black text-red-400">-R$ {(ticket.valor||0).toFixed(2).replace(".",",")}</p>
          <p className="text-xs text-slate-400 mt-1">em {(ticket.debitadoEm||"").slice(0,10)}{ticket.motivoDebito==="extravio"&&" · Debitado por extravio de mercadoria"}</p>
        </Card>
      )}

      {/* Histórico de interações */}
      {(ticket.historico||[]).length > 0 && (
        <Card className="p-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">📋 Histórico de Interações</p>
          <div className="space-y-2">
            {[...(ticket.historico||[])].reverse().map(h => {
              const icons = { criacao:"🆕", debito:"⚡", encerrado:"✅", whatsapp:"📱", resposta:"📎", contestacao:"↺", acao:"•" };
              const colors = { criacao:"text-blue-400", debito:"text-red-400", encerrado:"text-emerald-400", whatsapp:"text-emerald-300", resposta:"text-amber-400", contestacao:"text-purple-400", acao:"text-slate-400" };
              return (
                <div key={h.id} className="flex items-start gap-3 py-2 border-b border-slate-800 last:border-0">
                  <span className="text-base mt-0.5">{icons[h.tipo]||"•"}</span>
                  <div className="flex-1 min-w-0">
                    <p className={"text-xs font-semibold "+(colors[h.tipo]||"text-slate-400")}>{h.texto}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{h.autor} · {(h.data||"").slice(0,16).replace("T"," ")}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {canEdit&&(
        <div className="flex justify-end pt-2">
          <button onClick={()=>{if(window.confirm("Excluir este ticket?"))onDel();}} className="text-xs text-slate-600 hover:text-red-400 flex items-center gap-1"><Trash2 size={12}/>Excluir</button>
        </div>
      )}
    </div>
  );
}


function DreFechamento({ fechamentos, motoristas, dreEntradas, setDreEntradas, fixedCosts, costEntries, faturamentosJadlog, acrescimos }) {
  const [filtMes,  setFiltMes]  = useState(new Date().getMonth()+1);
  const [filtAno,  setFiltAno]  = useState(new Date().getFullYear());
  const [filtQuin, setFiltQuin] = useState(0); // 0=mês, 1=1ª, 2=2ª
  const [showNew,  setShowNew]  = useState(false);
  const MONTHS = ["","Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

  // Receita: soma das planilhas Jadlog anexadas nos fechamentos do período
  // + fallback para faturamentosJadlog global se não houver planilha por fechamento
  const getFecPlanilhas = () => {
    const fecComPlanilha = (fechamentos||[]).filter(f=>f.planilhaJadlog?.rows?.length>0);
    if (fecComPlanilha.length > 0) {
      // Use planilhas attached to fechamentos
      return fecComPlanilha.flatMap(f=>(f.planilhaJadlog.rows||[]).map(r=>({...r, fecId:f.id})));
    }
    // Fallback: global Fat.Jadlog
    return (faturamentosJadlog||[]).flatMap(b=>b.rows).map(r=>({...r, fecId:null}));
  };

  const todasPlanilhaRows = getFecPlanilhas();

  const getJadlog = (q) => {
    const rows = todasPlanilhaRows.filter(r=>(!q || r.quinz===q));
    // If we have per-fec planilhas, don't filter by month (already in the fechamento)
    const hasFecPlanilha = (fechamentos||[]).some(f=>f.planilhaJadlog?.rows?.length>0);
    if (hasFecPlanilha) return rows.reduce((s,r)=>s+(r.com||r.comissao||0),0);
    // Global fallback: filter by month/ano
    return (faturamentosJadlog||[]).flatMap(b=>b.rows)
      .filter(r=>r.mes===filtMes && r.ano===filtAno && (!q || r.quinz===q))
      .reduce((s,r)=>s+r.comissao,0);
  };

  // Taxas de entrega (soma dos fechamentos)
  // Taxa de Entrega = soma direta da coluna (guardada no import por fechamento)
  const getTaxaEntrega = () =>
    (fechamentos||[]).reduce((s,f) => s + (f.totalTaxaEntrega || 0), 0);

  // TDE = lançamento manual por fechamento
  const getTDE = () =>
    (fechamentos||[]).reduce((s,f) => s + (f.tde || 0), 0);

  // Agregados cadastrados — custo total do fechamento (totalBruto de todos os motoristas calculados)
  // Bate exatamente com o total do fechamento
  const getAgrExt = () => {
    return (fechamentos||[]).flatMap(f=>f.mots||[])
      .reduce((s,m)=>s+(m.totalBruto||0), 0);  // todos, não só pago — igual ao total do fechamento
  };

  // Comissão ALL Entregas importada dentro dos fechamentos
  const getComAllEntregas = (q) => {
    return (fechamentos||[])
      .filter(f => f.comAllEntregas?.rows?.length > 0)
      .flatMap(f => (f.comAllEntregas.rows||[]))
      .filter(r => !q || r.quinz===q)
      .reduce((s,r) => s+(r.com||0), 0);
  };

  // Agregados sem cadastro — valor GERADO (entrada, não saída)
  const getAgrCasa = () => {
    return (fechamentos||[]).flatMap(f=>f.nok||[])
      .reduce((s,n)=>s+(n.totalFaturado||0), 0);
  };

  // DRE entries
  const getDRE = (q, cat) =>
    (dreEntradas||[]).filter(e=>e.mes===filtMes&&e.ano===filtAno&&(!q||e.quinz===q)&&(!cat||e.categoria===cat))
      .reduce((s,e)=>s+(e.valor||0), 0);

  // Fixed costs (split by 2 for quinzena)
  const getFixed = (cat) => {
    const v = (fixedCosts||[]).filter(c=>c.active&&(!cat||c.category===cat)).reduce((s,c)=>s+(c.value||0),0);
    return filtQuin ? v/2 : v;
  };

  // Variable entries
  const getVar = (cat) =>
    (costEntries||[]).filter(c=>c.month===filtMes&&c.year===filtAno&&(!cat||c.category===cat)).reduce((s,c)=>s+(c.value||0),0);

  const q = filtQuin || null;
  const receitaJadlog      = getJadlog(q);
  const receitaAllEntregas = getComAllEntregas(q);
  const receitaTaxaEntrega = getTaxaEntrega();
  const receitaTDE         = getTDE();
  const receitaAgrCasa     = getAgrCasa();
  const totalReceita       = receitaJadlog + receitaAllEntregas + receitaTaxaEntrega + receitaTDE;

  // Custos por categoria
  const custos = {};
  COST_CATS.forEach(cat => {
    let v = getFixed(cat) + getVar(cat) + getDRE(q, cat);
    if (v > 0) custos[cat] = v;
  });

  // Agregar externos = custo de saída (pagamento)
  const agrExtCusto = getAgrExt();
  if (agrExtCusto > 0) custos["Agregados Externos"] = agrExtCusto;

  const totalCustos = Object.values(custos).reduce((s,v)=>s+v, 0);
  const resultado   = totalReceita - totalCustos;
  const margem      = totalReceita > 0 ? (resultado/totalReceita*100) : 0;

  // Agregados da casa detalhes
  const agrCasaList = useMemo(() =>
    (fechamentos||[]).flatMap(f=>(f.nok||[]).map(n=>({...n, fecId:f.id, fecDesc:f.descricao||""}))),
    [fechamentos]
  );
  const custoAgrCasaTotal = getDRE(null,"Salário Agr. Casa") + getDRE(null,"Frota") + getDRE(null,"Gasolina");
  const totalCTEsCasa = agrCasaList.reduce((s,n)=>s+(n.totalCTEs||0),0);

  const periodoLabel = filtQuin===1?"1ª Quinzena":filtQuin===2?"2ª Quinzena":"Mês inteiro";

  return (
    <div className="space-y-5">
      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex rounded-lg border border-slate-700 overflow-hidden text-xs">
          {[[0,"Mês"],[1,"1ª Quinz."],[2,"2ª Quinz."]].map(([v,l])=>(
            <button key={v} onClick={()=>setFiltQuin(v)}
              className={"px-3 py-1.5 font-semibold transition-all "+(filtQuin===v?"bg-amber-600 text-white":"bg-slate-800 text-slate-400 hover:text-slate-200")}>{l}</button>
          ))}
        </div>
        <Sel value={filtMes} onChange={e=>setFiltMes(Number(e.target.value))}>
          {MONTHS.slice(1).map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
        </Sel>
        <Sel value={filtAno} onChange={e=>setFiltAno(Number(e.target.value))}>
          {[2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}
        </Sel>
        <Btn size="sm" onClick={()=>setShowNew(true)}><Plus size={13}/>Lançar Custo</Btn>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard compact label="Total Receita" value={fmt(totalReceita)} icon={Wallet} color="#10b981"/>
        <KpiCard compact label="Total Custos" value={fmt(totalCustos)} icon={DollarSign} color="#ef4444"/>
        <KpiCard compact label="Resultado" value={fmt(resultado)} icon={TrendingUp} color={resultado>=0?"#10b981":"#ef4444"}/>
        <KpiCard compact label="Margem" value={margem.toFixed(1)+"%"} icon={BarChart2} color={margem>=10?"#10b981":margem>=0?"#f59e0b":"#ef4444"}/>
      </div>

      {/* DRE Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ENTRADAS */}
        <Card className="p-4">
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">▲ ENTRADAS — {periodoLabel}</p>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-300">Comissão Jadlog</span>
              <span className="text-emerald-400 font-bold">{fmt(receitaJadlog)}</span>
            </div>
            {receitaAllEntregas>0&&(
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-300">Comissão ALL Entregas</span>
                <span className="text-emerald-400 font-semibold">{fmt(receitaAllEntregas)}</span>
              </div>
            )}
            {receitaTaxaEntrega>0&&(
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-300">Taxa de Entrega</span>
                <span className="text-emerald-400 font-semibold">{fmt(receitaTaxaEntrega)}</span>
              </div>
            )}
            {receitaTDE>0&&(
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-300">TDE</span>
                <span className="text-emerald-400 font-semibold">{fmt(receitaTDE)}</span>
              </div>
            )}
            {(acrescimos||[]).filter(a=>a.month===filtMes&&a.year===filtAno).length>0&&(
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Acréscimos avulsos</span>
                <span className="text-emerald-400">{fmt((acrescimos||[]).filter(a=>a.month===filtMes&&a.year===filtAno).reduce((s,a)=>s+(a.value||0),0))}</span>
              </div>
            )}
            {receitaAgrCasa>0&&(
              <div className="flex justify-between items-center text-xs border-t border-slate-700 pt-2">
                <span className="text-amber-400/80">↳ Agr. da Casa geraram (dentro da comissão)</span>
                <span className="text-amber-400/80 font-semibold">{fmt(receitaAgrCasa)}</span>
              </div>
            )}
            <div className="border-t border-slate-700 pt-2 flex justify-between font-bold">
              <span className="text-slate-200">Total Receita</span>
              <span className="text-emerald-400 text-lg">{fmt(totalReceita)}</span>
            </div>
          </div>
        </Card>

        {/* SAÍDAS */}
        <Card className="p-4">
          <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-3">▼ SAÍDAS — {periodoLabel}</p>
          <div className="space-y-1.5">
            {Object.entries(custos).sort((a,b)=>b[1]-a[1]).map(([cat,v])=>(
              <div key={cat} className="flex justify-between items-center text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{background:CAT_COLORS[cat]||"#94a3b8"}}/>
                  {cat}
                </span>
                <span className="text-red-400 font-semibold">{fmt(v)}</span>
              </div>
            ))}
            <div className="border-t border-slate-700 pt-2 flex justify-between font-bold">
              <span className="text-slate-200">Total Custos</span>
              <span className="text-red-400 text-lg">{fmt(totalCustos)}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* RESULTADO */}
      <Card className={"p-5 border-2 "+(resultado>=0?"border-emerald-500/40 bg-emerald-500/5":"border-red-500/40 bg-red-500/5")}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">RESULTADO LÍQUIDO — {periodoLabel} {MONTHS[filtMes]}/{filtAno}</p>
            <p className={"text-4xl font-black mt-1 "+(resultado>=0?"text-emerald-400":"text-red-400")}>{fmt(resultado)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Margem</p>
            <p className={"text-3xl font-bold "+(margem>=10?"text-emerald-400":margem>=0?"text-amber-400":"text-red-400")}>{margem.toFixed(1)}%</p>
          </div>
        </div>
      </Card>

      {/* Agregados da Casa */}
      {agrCasaList.length>0&&(
        <Card className="p-4">
          <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">🏠 Agregados da Casa (sem cadastro)</p>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-300 mb-3">
            ✅ Valor gerado (receita deles) está incluído na comissão Jadlog acima.<br/>
            ⚡ Custo deles = Salário + Frota + Gasolina (lançados via "Lançar Custo"). Custo/CTE atual: <strong>{totalCTEsCasa>0&&custoAgrCasaTotal>0?fmt(custoAgrCasaTotal/totalCTEsCasa)+" / CTE":"lance os custos acima"}</strong>
          </div>
          <table className="w-full text-xs">
            <thead><tr className="border-b border-slate-700 text-slate-400">
              <th className="text-left py-2 px-2">Nome</th>
              <th className="text-right py-2 px-2">CTEs</th>
              <th className="text-right py-2 px-2">Valor Gerado</th>
              <th className="text-right py-2 px-2">Custo Estimado</th>
              <th className="text-right py-2 px-2">Margem</th>
            </tr></thead>
            <tbody>
              {agrCasaList.map((n,i)=>{
                const custoEst = totalCTEsCasa>0 ? (n.totalCTEs||0)*(custoAgrCasaTotal/totalCTEsCasa) : 0;
                const marg = n.totalFaturado>0 ? ((n.totalFaturado-custoEst)/n.totalFaturado*100) : null;
                return (
                  <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/30">
                    <td className="py-2 px-2 font-semibold text-amber-400">{n.nome}</td>
                    <td className="py-2 px-2 text-right text-slate-300">{n.totalCTEs||0}</td>
                    <td className="py-2 px-2 text-right text-emerald-400 font-semibold">{n.totalFaturado>0?fmt(n.totalFaturado):"—"}</td>
                    <td className="py-2 px-2 text-right text-red-400">{custoEst>0?fmt(custoEst):"—"}</td>
                    <td className={"py-2 px-2 text-right font-bold "+(marg===null?"text-slate-500":marg>=20?"text-emerald-400":marg>=0?"text-amber-400":"text-red-400")}>
                      {marg!==null?marg.toFixed(1)+"%":"—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* Lançamentos do período */}
      {(dreEntradas||[]).filter(e=>e.mes===filtMes&&e.ano===filtAno).length>0&&(
        <Card className="p-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">📋 Custos lançados no período</p>
          <div className="space-y-1.5">
            {(dreEntradas||[]).filter(e=>e.mes===filtMes&&e.ano===filtAno).sort((a,b)=>a.quinz-b.quinz).map(e=>(
              <div key={e.id} className="flex items-center justify-between text-xs bg-slate-900 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{background:CAT_COLORS[e.categoria]||"#94a3b8"}}/>
                  <span className="text-slate-300">{e.descricao}</span>
                  <span className="text-slate-500">{e.categoria} · {e.quinz===1?"1ª Q":e.quinz===2?"2ª Q":"Mês"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-red-400 font-semibold">{fmt(e.valor)}</span>
                  <button onClick={()=>setDreEntradas(p=>p.filter(x=>x.id!==e.id))} className="text-slate-600 hover:text-red-400"><Trash2 size={12}/></button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {showNew&&<DRENovaEntrada onSave={e=>{setDreEntradas(p=>[...p,{...e,id:uid()}]);setShowNew(false);}} onClose={()=>setShowNew(false)} defaultMes={filtMes} defaultAno={filtAno}/>}
    </div>
  );
}

function FechamentoView({ user, fechamentos, setFechamentos, motoristas, setMotoristas, dreEntradas, setDreEntradas, fixedCosts, costEntries, faturamentosJadlog, acrescimos, tickets, setTickets }) {
  const [subView, setSubView] = useState("lista");
  const [showNovo, setShowNovo] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [confirmDeleteFec, setConfirmDeleteFec] = useState(null);

  // Filters
  const [fStatus, setFStatus]     = useState("");
  const [fMotor,  setFMotor]      = useState("");
  const [fCTE,    setFCTE]        = useState("");
  const [fDtIni,  setFDtIni]      = useState("");
  const [fDtFim,  setFDtFim]      = useState("");

  const selected = useMemo(() => selectedId ? fechamentos.find(f => f.id === selectedId) || null : null, [selectedId, fechamentos]);

  // Apply filters
  const fechamentosFiltrados = useMemo(() => {
    let list = [...fechamentos].reverse();
    if (fStatus) list = list.filter(f => f.status === fStatus);
    if (fMotor.trim()) {
      const q = fMotor.trim().toLowerCase();
      list = list.filter(f =>
        (f.mots||[]).some(m => m.nome.toLowerCase().includes(q) || m.mat.includes(q))
      );
    }
    if (fCTE.trim()) {
      const q = fCTE.trim().toLowerCase();
      list = list.filter(f =>
        (f.mots||[]).some(m =>
          (m.entregas||[]).some(e => (e.ncte||"").toLowerCase().includes(q)) ||
          (m.correcoes||[]).some(c => (c.ncte||"").toLowerCase().includes(q))
        )
      );
    }
    if (fDtIni || fDtFim) {
      list = list.filter(f => {
        // Check if any CTE date falls within the range
        const cteDatas = (f.mots||[]).flatMap(m => (m.entregas||[]).map(e => e.data)).filter(Boolean);
        return cteDatas.some(d => {
          // CTE date format is DD/MM/YYYY — normalize to YYYY-MM-DD for comparison
          const parts = d.split("/");
          const iso = parts.length === 3 ? parts[2]+"-"+parts[1].padStart(2,"0")+"-"+parts[0].padStart(2,"0") : d.slice(0,10);
          if (fDtIni && iso < fDtIni) return false;
          if (fDtFim && iso > fDtFim) return false;
          return true;
        });
      });
    }
    return list;
  }, [fechamentos, fStatus, fMotor, fCTE, fDtIni, fDtFim]);

  const hasFilter = fStatus || fMotor || fCTE || fDtIni || fDtFim;
  const clearFilters = () => { setFStatus(""); setFMotor(""); setFCTE(""); setFDtIni(""); setFDtFim(""); };

  if (selected) return (
    <FechamentoDetalhe
      fec={selected} user={user}
      motoristas={motoristas}
      setFechamentos={setFechamentos}
      tickets={tickets||[]}
      setTickets={setTickets}
      onBack={() => setSelectedId(null)}
    />
  );

  return (
    <div className="p-6 space-y-5">
      {/* Delete fechamento confirm modal */}
      {confirmDeleteFec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setConfirmDeleteFec(null)}>
          <div className="bg-slate-800 border border-red-500/30 rounded-2xl p-6 w-full max-w-sm space-y-4 mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0"><Trash2 size={18} className="text-red-400"/></div>
              <div>
                <p className="text-sm font-bold text-slate-100">Excluir fechamento?</p>
                <p className="text-xs text-slate-400 mt-0.5">{confirmDeleteFec.descricao}</p>
                <p className="text-xs text-red-400 mt-1">Esta ação não pode ser desfeita.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setFechamentos(p => p.filter(f => f.id !== confirmDeleteFec.id)); setConfirmDeleteFec(null); }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors">
                Sim, excluir
              </button>
              <button onClick={() => setConfirmDeleteFec(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-semibold transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Fechamento de Entregas</h1>
          <p className="text-sm text-slate-400">{fechamentos.length} fechamento(s){hasFilter ? " · "+(fechamentosFiltrados.length)+" filtrado(s)" : ""}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {userHasFechamento(user) && (
            <div className="flex rounded-lg border border-slate-700 overflow-hidden text-xs">
              {[["lista","📋 Fechamentos"],["mots","🚚 Motoristas"],...(userHasDRE(user)?[["dre","📊 DRE"]]:[])].map(([v,l])=>(
                <button key={v} onClick={()=>setSubView(v)}
                  className={"px-3 py-1.5 font-semibold transition-all "+(subView===v?"bg-red-600 text-white":"bg-slate-800 text-slate-400 hover:text-slate-200")+""}>{l}</button>
              ))}
            </div>
          )}
          {user.role !== "auditor" && subView === "lista" && (
            <Btn onClick={() => setShowNovo(true)}><Plus size={14} />Novo Fechamento</Btn>
          )}
        </div>
      </div>

      {subView === "mots" && <MotoristasView motoristas={motoristas} setMotoristas={setMotoristas} />}
      {subView === "dre" && userHasDRE(user) && <DreFechamento fechamentos={fechamentos} motoristas={motoristas} dreEntradas={dreEntradas} setDreEntradas={setDreEntradas} fixedCosts={fixedCosts} costEntries={costEntries} faturamentosJadlog={faturamentosJadlog} acrescimos={acrescimos}/>}

      {subView === "lista" && (
        <>
          {/* Status summary */}
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
            {Object.entries(FS).map(([k, v]) => (
              <button key={k} onClick={() => setFStatus(fStatus === k ? "" : k)}
                className={"rounded-lg p-2.5 text-center border transition-all "+(fStatus === k ? "border-2" : "bg-slate-800 border-slate-700 hover:border-slate-500")+""}
                style={fStatus === k ? { borderColor: v.cor, background: v.cor + "15" } : {}}>
                <p className="text-lg font-bold" style={{ color: v.cor }}>{fechamentos.filter(f => f.status === k).length}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-tight">{v.label}</p>
              </button>
            ))}
          </div>

          {/* Filter bar */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filtros</p>
              {hasFilter && <button onClick={clearFilters} className="text-xs text-amber-400 hover:text-amber-300">Limpar filtros</button>}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Agregado / Matrícula</label>
                <input value={fMotor} onChange={e=>setFMotor(e.target.value)} placeholder="Nome ou matrícula..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500 placeholder-slate-500"/>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Número do CTE</label>
                <input value={fCTE} onChange={e=>setFCTE(e.target.value)} placeholder="Ex: 18250100..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500 placeholder-slate-500"/>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Data início (CTE)</label>
                <input type="date" value={fDtIni} onChange={e=>setFDtIni(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"/>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Data fim (CTE)</label>
                <input type="date" value={fDtFim} onChange={e=>setFDtFim(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"/>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {fechamentosFiltrados.length === 0 && (
              <div className="text-center py-16 text-slate-500">
                <Truck size={40} className="mx-auto mb-3 text-slate-700" />
                <p>{hasFilter ? "Nenhum fechamento encontrado com esses filtros." : "Nenhum fechamento ainda."}</p>
                {!hasFilter && <p className="text-sm mt-1">Clique em "Novo Fechamento" para carregar uma planilha.</p>}
              </div>
            )}
            {fechamentosFiltrados.map(f => {
              const st = FS[f.status] || FS.op;
              const total = (f.mots||[]).reduce((a, c) => a + c.totalBruto, 0);
              const pendAgr = (f.mots||[]).filter(c => (c.etapa||"agr") === "agr").length;
              // Highlight matching motoristas if filter active
              const matchMots = fMotor.trim() ? (f.mots||[]).filter(m =>
                m.nome.toLowerCase().includes(fMotor.trim().toLowerCase()) || m.mat.includes(fMotor.trim())
              ) : [];
              const matchCTEs = fCTE.trim() ? (f.mots||[]).flatMap(m =>
                (m.entregas||[]).filter(e => (e.ncte||"").toLowerCase().includes(fCTE.trim().toLowerCase()))
                  .map(e => ({ mot: m.nome, ncte: e.ncte }))
              ) : [];
              return (
                <div key={f.id} onClick={() => setSelectedId(f.id)} style={{ cursor: "pointer" }}
                  className="bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-red-500/40 group transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge color={st.cor}>{st.label}</Badge>
                        {f.status === "agr" && pendAgr > 0 && (
                          <span className="text-xs text-purple-400 animate-pulse font-semibold">● {pendAgr} aguardando</span>
                        )}
                      </div>
                      <p className="font-semibold text-slate-100">{f.descricao}</p>
                      <div className="flex gap-4 mt-1 text-xs text-slate-500 flex-wrap">
                        <span>{(f.mots||[]).length} motoristas</span>
                        <span>{f.totalCTEs||0} CTEs</span>
                        <span>{fmtDate(f.criadoEm)}</span>
                      </div>
                      {matchMots.length > 0 && (
                        <div className="mt-1.5 flex gap-1.5 flex-wrap">
                          {matchMots.map(m => <span key={m.id} className="text-xs bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded px-2 py-0.5">{m.nome}</span>)}
                        </div>
                      )}
                      {matchCTEs.length > 0 && (
                        <div className="mt-1 flex gap-1.5 flex-wrap">
                          {matchCTEs.slice(0,5).map((c,i) => <span key={i} className="text-xs bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded px-2 py-0.5 font-mono">{c.ncte} ({c.mot.split(" ")[0]})</span>)}
                          {matchCTEs.length > 5 && <span className="text-xs text-slate-500">+{matchCTEs.length-5} mais</span>}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-xs text-amber-400 opacity-0 group-hover:opacity-100 font-semibold">Abrir →</span>
                      <p className="text-lg font-bold text-emerald-400">{fmt(total)}</p>
                      {user.role !== "auditor" && (
                        <button onClick={e => { e.stopPropagation(); setConfirmDeleteFec(f); }}
                          className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 p-1 transition-all mt-1"
                          title="Excluir fechamento">
                          <Trash2 size={13}/>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {showNovo && (
        <NovoFechamentoModal
          motoristas={motoristas} user={user} fechamentos={fechamentos}
          onClose={() => setShowNovo(false)}
          onSave={f => { setFechamentos(p => [...p, f]); setShowNovo(false); setSelectedId(f.id); }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// PORTAL DO AGREGADO — tela standalone acessível por token
// ═══════════════════════════════════════════════════════

function PortalAcesso({ fechamentos, motoristas, onEnterPortal, onSair }) {
  const [token, setToken] = useState("");
  const [err, setErr] = useState("");

  const handleEnter = () => {
    const t = token.trim();
    if (!t) return;
    // Try matricula first (simpler access)
    const motByMat = motoristas.find(m => m.matricula === t && m.ativo);
    if (motByMat) { setErr(""); onEnterPortal(motByMat.matricula); return; }
    // Try legacy codigoAcesso
    const motByCod = motoristas.find(m => m.codigoAcesso === t.toUpperCase() && m.ativo);
    if (motByCod) { setErr(""); onEnterPortal(motByCod.matricula); return; }
    setErr("Matrícula ou código inválido.");
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-4">
            <Truck size={16} className="text-blue-400" /><span className="text-red-400 text-sm font-semibold">Portal do Agregado</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mb-1">Fechamento de Entrega</h1>
          <p className="text-slate-400 text-sm">Digite sua <strong>matrícula</strong> para acessar o portal</p>
        </div>
        <Card className="p-6 space-y-4">
          <Input label="Matrícula" placeholder="Digite sua matrícula (ex: 134994)"
            value={token} onChange={e => setToken(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleEnter()} />
          {err && <p className="text-red-400 text-sm">{err}</p>}
          <Btn onClick={handleEnter} disabled={!token.trim()} className="w-full justify-center" size="lg">
            Acessar Fechamento
          </Btn>
          <button onClick={onSair} className="w-full text-xs text-slate-500 hover:text-slate-300 transition-all">
            ← Voltar ao sistema
          </button>
        </Card>
      </div>
    </div>
  );
}

function PortalAcareacaoTab({ tickets, setTickets, mCad, motMatricula, motoristas }) {
  const calcDiasRestantes = (prazoData) => {
    if (!prazoData) return null;
    const diff = new Date(prazoData+"T23:59:59") - new Date();
    return Math.ceil(diff / (1000*60*60*24));
  };
  const meusTickets = (tickets||[]).filter(t => {
    if (mCad && t.motoristaId === mCad.id) return true;
    if (t.matricula && t.matricula === motMatricula) return true;
    if (mCad && t.nomeAgregado && mCad.nome &&
        t.nomeAgregado.trim().toUpperCase() === mCad.nome.trim().toUpperCase()) return true;
    // Extra fallback: match by any stored identifier
    if (t.motoristaId && motoristas && motoristas.find) {
      const m = motoristas.find(x => x.id===t.motoristaId);
      if (m && m.matricula === motMatricula) return true;
    }
    return false;
  }).sort((a,b) => (b.criadoEm||"").localeCompare(a.criadoEm||""));

  const handleResposta = (ticketId, file) => {
    const r = new FileReader();
    r.onload = ev => setTickets(p => p.map(x => {
      if (x.id!==ticketId) return x;
      const histEntry = { id:uid(), tipo:"resposta", texto:"Agregado enviou evidência: "+file.name, autor:(mCad?.nome||"Agregado"), data:new Date().toISOString() };
      return {...x, status:"respondido", respostaNome:file.name, respostaData:ev.target.result, respondidoEm:new Date().toISOString(), historico:[...(x.historico||[]), histEntry]};
    }));
    r.readAsDataURL(file);
  };

  return (
    <div className="space-y-3">
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-sm text-amber-300">
        <p className="font-bold mb-1">⚠ Tickets de Acareação</p>
        <p className="text-xs text-amber-400/70">Responda dentro do prazo. Sem resposta, o valor é debitado automaticamente.</p>
      </div>
      {meusTickets.length===0&&(
        <div className="text-center py-8">
          <p className="text-slate-500 text-sm">Nenhum ticket de acareação no momento.</p>
          <p className="text-xs text-slate-600 mt-2">Total de tickets no sistema: {(tickets||[]).length}</p>
        </div>
      )}
      {meusTickets.map(t => {
        const st = TICKET_STATUS[t.status]||TICKET_STATUS.aberto;
        const isImg = data => data && data.startsWith("data:image");
        return (
          <Card key={t.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-slate-500">#{t.id.slice(-6).toUpperCase()}</span>
                  <p className="font-bold text-slate-100 text-sm">{t.titulo}</p>
                  <Badge color={st.cor}>{st.label}</Badge>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Aberto em {(t.criadoEm||"").slice(0,10)} · Prazo: <span className="text-amber-400 font-semibold">{t.prazoData||(String(t.slaDias||5)+" dias")}</span>
                </p>
              </div>
              <div className="text-right flex-shrink-0 space-y-1">
                <p className="text-xs text-slate-500">Valor em risco</p>
                <p className="text-xl font-bold text-red-400">R$ {(t.valor||0).toFixed(2).replace(".",",")}</p>
                {t.prazoData && t.status==="aguardando" && (() => {
                  const dias = calcDiasRestantes(t.prazoData);
                  if (dias === null) return null;
                  if (dias < 0) return <p className="text-xs font-bold text-red-500">⚡ Vencido</p>;
                  if (dias === 0) return <p className="text-xs font-bold text-red-400 animate-pulse">🚨 Vence HOJE</p>;
                  if (dias <= 2) return <p className="text-xs font-bold text-amber-400">⚠ {dias}d restante(s)</p>;
                  return <p className="text-xs text-slate-500">{dias} dias restantes</p>;
                })()}
              </div>
            </div>
            {t.prazoData && t.status==="aguardando" && calcDiasRestantes(t.prazoData) !== null && calcDiasRestantes(t.prazoData) <= 1 && (
              <div className="bg-red-500/10 border border-red-500/40 rounded-lg p-3 animate-pulse">
                <p className="text-xs font-bold text-red-400">🚨 URGENTE — {calcDiasRestantes(t.prazoData)<=0?"Prazo vencido!":"Último dia para enviar evidência!"} Sem resposta, R$ {(t.valor||0).toFixed(2).replace(".",",")} será debitado do seu próximo fechamento.</p>
              </div>
            )}
            {t.descricao&&<p className="text-xs text-slate-300 bg-slate-900 rounded-lg p-3 border border-slate-800">{t.descricao}</p>}
            {t.pdfData&&(
              <div className="border border-slate-700 rounded-lg p-3 bg-slate-900">
                <p className="text-xs font-bold text-slate-400 mb-2">📎 Evidência: {t.pdfNome||"anexo"}</p>
                {isImg(t.pdfData)
                  ? <img src={t.pdfData} alt="evidencia" className="max-w-full rounded-lg border border-slate-700" style={{maxHeight:"280px"}}/>
                  : <a href={t.pdfData} download={t.pdfNome||"evidencia.pdf"} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 text-sm hover:bg-blue-500/30 transition-all">
                      📄 Baixar PDF da Evidência
                    </a>
                }
              </div>
            )}
            {t.respostaNome&&(
              <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/30 space-y-2">
                <p className="text-xs font-bold text-emerald-400">✅ Sua resposta foi enviada em {(t.respondidoEm||"").slice(0,10)}</p>
                {isImg(t.respostaData)&&<img src={t.respostaData} alt="resposta" className="max-w-full rounded-lg" style={{maxHeight:"200px"}}/>}
              </div>
            )}
            {t.status==="debitado"&&(
              <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/30">
                <p className="text-xs font-bold text-red-400">⚡ Valor debitado: R$ {(t.valor||0).toFixed(2).replace(".",",")} em {(t.debitadoEm||"").slice(0,10)}</p>
              </div>
            )}
            {(t.status==="aguardando"||t.status==="aberto")&&!t.respostaNome&&(
              <div className="pt-2 border-t border-slate-700">
                <p className="text-xs font-bold text-amber-400 mb-2">📎 Enviar Evidência — Tire uma foto ou envie um arquivo</p>
                <div className="flex gap-2">
                  <label className="flex-1 py-3 rounded-xl border border-slate-700 text-xs text-center text-slate-400 hover:border-amber-500/50 hover:text-amber-400 cursor-pointer transition-all">
                    📷 Tirar Foto
                    <input type="file" accept="image/*" capture="environment" className="hidden"
                      onChange={e=>{const f=e.target.files?.[0];if(f)handleResposta(t.id,f);}}/>
                  </label>
                  <label className="flex-1 py-3 rounded-xl border border-slate-700 text-xs text-center text-slate-400 hover:border-blue-500/50 hover:text-blue-400 cursor-pointer transition-all">
                    📎 Enviar Arquivo
                    <input type="file" accept="image/*,.pdf" className="hidden"
                      onChange={e=>{const f=e.target.files?.[0];if(f)handleResposta(t.id,f);}}/>
                  </label>
                </div>
              </div>
            )}
            {(t.historico||[]).length > 0 && (
              <div className="pt-2 border-t border-slate-800">
                <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Histórico</p>
                <div className="space-y-1.5">
                  {[...(t.historico||[])].reverse().map(h => {
                    const icons = { criacao:"🆕", debito:"⚡", encerrado:"✅", whatsapp:"📱", resposta:"📎", contestacao:"↺", acao:"•" };
                    return (
                      <div key={h.id} className="flex items-start gap-2">
                        <span className="text-xs mt-0.5">{icons[h.tipo]||"•"}</span>
                        <div>
                          <p className="text-xs text-slate-400">{h.texto}</p>
                          <p className="text-xs text-slate-600">{(h.data||"").slice(0,16).replace("T"," ")}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function PortalAgregadoPage({ motMatricula, motoristas, fechamentos, setFechamentos, tickets, setTickets, onSair }) {
  const [selectedFecId, setSelectedFecId] = useState(null);
  const [aprovarStep, setAprovarStep] = useState(null);
  const [motivo, setMotivo] = useState("");
  const [evidencias, setEvidencias] = useState([]);
  const [nf, setNf] = useState(null);
  const nfRef = useRef();
  const evidRef = useRef();

  const mCad = motoristas.find(m => m.matricula === motMatricula);

  const meusFechamentos = useMemo(() =>
    fechamentos
      .map(f => ({ fec: f, mot: (f.mots||[]).find(c => c.mat === motMatricula) }))
      .filter(x => x.mot)
      .sort((a,b) => b.fec.criadoEm.localeCompare(a.fec.criadoEm)),
    [fechamentos, motMatricula]
  );

  const resumo = useMemo(() => {
    let pago=0,aReceber=0,pendenteCiencia=0,contestado=0,totalPacotes=0,totalCTEs=0;
    meusFechamentos.forEach(({ fec, mot }) => {
      totalCTEs += mot.totalCTEs||0;
      if (mot.etapa==="pago") pago+=mot.totalBruto;
      else if (mot.etapa==="fin") aReceber+=mot.totalBruto;   // financeiro vai pagar
      else if (mot.etapa==="agr") pendenteCiencia+=mot.totalBruto;  // aguardando minha ciência
      else if (mot.etapa==="revisao_op") contestado+=mot.totalBruto;
    });
    return { pago, aReceber, pendenteCiencia, contestado, totalPacotes, totalCTEs };
  }, [meusFechamentos]);

  const commit = (fecId, motId, patch) => {
    setFechamentos(prev => prev.map(f => {
      if (f.id !== fecId) return f;
      const mots = f.mots.map(c => {
        if (c.id !== motId) return c;
        // Agregado aceita → vai para pagamento (financeiro paga com NF)
        // Agregado contesta → volta para operacional revisar
        const newEtapa = patch.statusAgr === "aprovado" ? "fin" : "revisao_op";
        return { ...c, ...patch, etapa: newEtapa };
      });
      const allPago = mots.every(c => c.etapa === "pago");
      const anyRevOp = mots.some(c => c.etapa === "revisao_op");
      const anyAgr  = mots.some(c => c.etapa === "agr");
      const status  = allPago ? "pago" : anyRevOp ? "op" : anyAgr ? "agr" : f.status;
      const hist = [...f.hist, {
        acao: patch.statusAgr === "aprovado" ? "Agregado aceitou — "+(mCad?.nome||motMatricula)+"" : "Agregado CONTESTOU — "+(mCad?.nome||motMatricula)+"",
        quem: mCad?.nome||motMatricula, ts: now(), obs: patch.comentarioAgr||""
      }];
      return { ...f, mots, status, hist };
    }));
    setAprovarStep(null); setMotivo(""); setNf(null); setEvidencias([]);
  };

  const handleNF = async e => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size>8*1024*1024){alert("Máx 8MB.");return;}
    const data=await readFileAsBase64(file); setNf({nome:file.name,tipo:file.type,data});
  };

  const handleEvidencia = async e => {
    const files = Array.from(e.target.files||[]);
    const novos = await Promise.all(files.map(async f=>{
      if(f.size>8*1024*1024){alert(""+(f.name)+" muito grande. Máx 8MB.");return null;}
      const data=await readFileAsBase64(f);
      return {id:uid(),nome:f.name,tipo:f.type,data};
    }));
    setEvidencias(p=>[...p,...novos.filter(Boolean)]);
    if(evidRef.current) evidRef.current.value="";
  };

  const ETAPA_LABEL = {
    agr:        {cor:"#8b5cf6",label:"Aguardando sua ciência"},
    rev_gestor: {cor:"#f97316",label:"Em validação — gestor"},
    fin:        {cor:"#06b6d4",label:"Aguardando pagamento"},
    pago:       {cor:"#10b981",label:"Pago ✓"},
    devolvido:  {cor:"#ef4444",label:"Devolvido p/ revisão"},
    revisao_op: {cor:"#dc2626",label:"Contestado — em análise"},
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-6">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap'); *{box-sizing:border-box;}`}</style>
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center font-bold text-white text-lg">
              {(mCad?.nome||"?")[0]}
            </div>
            <div>
              <p className="font-bold text-slate-100 text-lg">{mCad?.nome || motMatricula}</p>
              <p className="text-xs text-slate-400">Mat: {motMatricula} · Portal do Agregado</p>
            </div>
          </div>
          <button onClick={onSair} className="text-xs text-slate-500 hover:text-slate-300 border border-slate-700 rounded-lg px-3 py-1.5 hover:border-slate-500 transition-all">Sair</button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
            <p className="text-xs text-emerald-400/70 mb-1">Total Recebido</p>
            <p className="text-xl font-bold text-emerald-400">{fmt(resumo.pago)}</p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <p className="text-xs text-blue-400/70 mb-1">A Receber</p>
            <p className="text-xl font-bold text-blue-400">{fmt(resumo.aReceber)}</p>
            <p className="text-xs text-blue-400/50 mt-0.5">ciência dada</p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <p className="text-xs text-amber-400/70 mb-1">Aguardando Ciência</p>
            <p className="text-xl font-bold text-amber-400">{fmt(resumo.pendenteCiencia)}</p>
            <p className="text-xs text-amber-400/50 mt-0.5">ação necessária</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <p className="text-xs text-slate-400 mb-1">Total de Pacotes</p>
            <p className="text-xl font-bold text-slate-100">{resumo.totalCTEs.toLocaleString("pt-BR")}</p>
            <p className="text-xs text-slate-500 mt-0.5">{resumo.totalCTEs} CTEs histórico</p>
          </div>
          {(() => {
            // Build all debits with period info
            const todosDebitos = meusFechamentos.flatMap(({fec, mot}) =>
              (mot.correcoes||[]).filter(cr => cr.valor < 0).map(cr => ({
                ...cr, periodo: fec.periodo||"", descricao: fec.descricao||""
              }))
            );
            const ticketsDeb = (tickets||[]).filter(t => mCad && t.motoristaId === mCad.id && t.status==="debitado");
            const grand = todosDebitos.reduce((s,cr) => s + Math.abs(cr.valor), 0)
                        + ticketsDeb.reduce((s,t) => s + (t.valor||0), 0);
            if (grand === 0 && ticketsDeb.length === 0) return null;

            // Group by month
            const getMonth = (dateStr) => {
              if (!dateStr) return "Sem data";
              const d = dateStr.slice(0,7); // YYYY-MM
              const [y,m] = d.split("-");
              const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
              return (meses[parseInt(m)-1]||m)+"/"+y;
            };
            const getQuinzena = (dateStr) => {
              if (!dateStr) return "—";
              const day = parseInt((dateStr||"").slice(8,10));
              return day <= 15 ? "1ª Quinzena" : "2ª Quinzena";
            };

            // Group by month > quinzena
            const byMonth = {};
            const addEntry = (month, qz, label, valor) => {
              if (!byMonth[month]) byMonth[month] = {};
              if (!byMonth[month][qz]) byMonth[month][qz] = [];
              byMonth[month][qz].push({ label, valor });
            };

            todosDebitos.forEach(cr => {
              const month = cr.periodo ? cr.periodo.split(" ")[0]||getMonth(cr.data) : getMonth(cr.data);
              const qz = cr.periodo ? (cr.periodo.toLowerCase().includes("1ª")||cr.periodo.toLowerCase().includes("1a")||cr.periodo.toLowerCase().includes("quinzena 1") ? "1ª Quinzena" : cr.periodo.toLowerCase().includes("2ª")||cr.periodo.toLowerCase().includes("2a") ? "2ª Quinzena" : getQuinzena(cr.data)) : getQuinzena(cr.data);
              addEntry(month, qz, cr.justificativa||cr.ncte||"Débito", Math.abs(cr.valor));
            });
            ticketsDeb.forEach(t => {
              const month = getMonth(t.debitadoEm||t.criadoEm);
              const qz = getQuinzena(t.debitadoEm||t.criadoEm);
              addEntry(month, qz, "Ticket #"+t.id.slice(-6).toUpperCase()+" — "+(t.titulo||""), t.valor||0);
            });

            const [showDebitos, setShowDebitos] = React.useState(false);

            return (
              <div className="col-span-2 md:col-span-4 bg-red-500/10 border-2 border-red-500/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-red-400/70 font-semibold uppercase tracking-wider">⚡ Total de Débitos Aplicados</p>
                    <p className="text-2xl font-black text-red-400">-{fmt(grand)}</p>
                  </div>
                  <button onClick={()=>setShowDebitos(p=>!p)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10">
                    {showDebitos ? "Ocultar ▲" : "Ver detalhes ▼"}
                  </button>
                </div>
                {showDebitos && (
                  <div className="space-y-3 border-t border-red-500/20 pt-3">
                    {Object.entries(byMonth).sort((a,b)=>b[0].localeCompare(a[0])).map(([month, quinzenas]) => {
                      const totalMes = Object.values(quinzenas).flat().reduce((s,e)=>s+e.valor,0);
                      return (
                        <div key={month}>
                          <div className="flex justify-between items-center mb-1">
                            <p className="text-xs font-bold text-slate-300">📅 {month}</p>
                            <p className="text-xs font-bold text-red-400">-{fmt(totalMes)}</p>
                          </div>
                          {Object.entries(quinzenas).sort().map(([qz, entries]) => {
                            const totalQz = entries.reduce((s,e)=>s+e.valor,0);
                            return (
                              <div key={qz} className="ml-3 mb-2">
                                <div className="flex justify-between items-center mb-1">
                                  <p className="text-xs text-slate-400 font-semibold">{qz}</p>
                                  <p className="text-xs text-red-400/80">-{fmt(totalQz)}</p>
                                </div>
                                {entries.map((e,i) => (
                                  <div key={i} className="flex justify-between items-start gap-2 ml-2 py-0.5">
                                    <p className="text-xs text-slate-500 truncate flex-1">{e.label}</p>
                                    <p className="text-xs text-red-400 font-semibold whitespace-nowrap">-{fmt(e.valor)}</p>
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Em validação pelo gestor */}
        {meusFechamentos.filter(x => x.mot.etapa === "rev_gestor").map(({ fec, mot }) => (
          <div key={fec.id} className="bg-orange-500/10 border-2 border-orange-500/30 rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-2"><Clock size={16} className="text-orange-400"/><p className="text-sm font-bold text-orange-300">Em validação pelo gestor de área</p></div>
            <p className="font-semibold text-slate-100">{fec.descricao} · {fec.periodo}</p>
            <p className="text-xs text-slate-400">A equipe operacional analisou sua contestação e encaminhou ao gestor para validação final. Aguarde — você será notificado.</p>
            <div className="flex justify-between items-center pt-1 border-t border-slate-700"><span className="text-xs text-slate-400">Valor em análise</span><span className="text-lg font-bold text-emerald-400">{fmt(mot.totalBruto)}</span></div>
          </div>
        ))}

        {/* Contestados — aguardando análise da operação */}
        {meusFechamentos.filter(x => x.mot.etapa === "revisao_op").map(({ fec, mot }) => (
          <div key={fec.id} className="bg-red-500/10 border-2 border-red-500/30 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2"><AlertCircle size={16} className="text-red-400"/><p className="text-sm font-bold text-red-300">Contestação em análise — equipe operacional</p></div>
            <p className="font-semibold text-slate-100">{fec.descricao} · {fec.periodo}</p>
            {mot.contestacao?.motivo&&<div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <p className="text-xs text-red-400 font-semibold mb-0.5">Seu motivo registrado:</p>
              <p className="text-xs text-red-300 italic">"{mot.contestacao.motivo}"</p>
              {mot.contestacao.evidencias?.length>0&&<p className="text-xs text-slate-400 mt-1"><Paperclip size={10} className="inline mr-1"/>{mot.contestacao.evidencias.length} evidência(s) enviada(s)</p>}
            </div>}
            <p className="text-xs text-slate-400">O time está analisando. Se o valor estiver incorreto será corrigido e voltará para sua ciência. Se estiver correto, você também precisará dar ciência.</p>
          </div>
        ))}

        {/* Pendente de ciência — destaque */}
        {meusFechamentos.filter(x => x.mot.etapa === "agr").map(({ fec, mot }) => (
          <div key={fec.id} className="bg-amber-500/10 border-2 border-amber-500/40 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"/>
              <p className="text-sm font-bold text-amber-300">Aguardando sua ciência</p>
            </div>
            <div>
              <p className="font-bold text-slate-100">{fec.descricao}</p>
              <p className="text-xs text-slate-400 mt-0.5">{fec.periodo}</p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              {mot.vDiaria>0&&<div className="bg-slate-900 rounded-lg p-2.5 text-center"><p className="text-xs text-slate-400">{mot.diasUnicos||1} dia(s)</p><p className="font-bold text-amber-400">{fmt(mot.vDiaria)}</p></div>}
              {(mot.vCTEs||mot.vPacotes)>0&&<div className="bg-slate-900 rounded-lg p-2.5 text-center"><p className="text-xs text-slate-400">{mot.totalCTEs} CTEs</p><p className="font-bold text-emerald-400">{fmt(mot.vCTEs||mot.vPacotes)}</p></div>}
              {mot.correcoes?.length>0&&<div className="bg-slate-900 rounded-lg p-2.5 text-center"><p className="text-xs text-slate-400">Ajustes</p><p className="font-bold text-blue-400">{fmt(mot.correcoes.reduce((s,c)=>s+c.valor,0))}</p></div>}
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5 text-center col-span-3 md:col-span-1">
                <p className="text-xs text-emerald-400/70">Total a receber</p>
                <p className="text-xl font-bold text-emerald-400">{fmt(mot.totalBruto)}</p>
              </div>
            </div>

            {aprovarStep === fec.id ? (
              <div className="space-y-3">
                {/* Detail */}
                <div className="bg-slate-900 rounded-lg p-3 text-xs space-y-1 border border-slate-700">
                  <div className="flex justify-between"><span className="text-slate-400">CTEs planilha</span><span className="text-slate-200">{mot.totalCTEs}</span></div>
                  <div className="flex justify-between"><span className="text-emerald-400">Entregas (evento=entrega)</span><span className="text-emerald-400">{mot.totalCTEs} CTEs entregues</span></div>
                  {mot.vDiaria>0&&<div className="flex justify-between"><span className="text-slate-400">{mot.diasUnicos||1} dia(s) × {fmt(mot.valorDiaria)}</span><span className="text-amber-400">{fmt(mot.vDiaria)}</span></div>}
                  {mot.vPacotes>0&&<div className="flex justify-between"><span className="text-slate-400">{mot.tipo==="diaria_excedente"?"Excedente: "+(mot.excedente)+" pcts × "+(fmt(mot.valorPacote))+"":""+(mot.totalPacotes)+" × "+(fmt(mot.valorPacote))+""}</span><span className="text-emerald-400">{fmt(mot.vPacotes)}</span></div>}
                  {mot.correcoes?.map(cr=><div key={cr.id} className="flex justify-between items-start gap-2"><span className="text-blue-400 flex-1">CTE {cr.ncte}{cr.data?" ("+(cr.data)+")":""} — {cr.justificativa}</span><span className={"font-bold text-xs px-1.5 py-0.5 rounded whitespace-nowrap "+(cr.valor>=0?"bg-emerald-500/20 text-emerald-400":"bg-red-500/20 text-red-400")+""}>{cr.valor>=0?"+ ":"- "}{fmt(Math.abs(cr.valor))} {cr.valor>=0?"(Acréscimo)":"(Débito)"}</span></div>)}
                  <div className="flex justify-between font-bold border-t border-slate-700 pt-1"><span className="text-slate-100">TOTAL</span><span className="text-emerald-400 text-base">{fmt(mot.totalBruto)}</span></div>
                </div>

                {/* CTEs list */}
                {mot.entregas?.length>0&&(
                  <div className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
                    <div className="px-3 py-2 border-b border-slate-700"><p className="text-xs font-semibold text-slate-400">CTEs de entrega computados</p></div>
                    <div className="max-h-36 overflow-y-auto">
                      {mot.entregas.map((r,i)=><div key={i} className="flex gap-4 text-xs px-3 py-1.5 border-b border-slate-700/40"><span className="text-blue-400 font-mono">{r.ncte}</span><span className="text-slate-400">{r.data}</span><span className="text-emerald-400">{r.qPacotes} pcts</span></div>)}
                    </div>
                  </div>
                )}

                {/* NF upload */}
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-200">Ao confirmar, você dá ciência do valor <span className="text-emerald-400">{fmt(mot.totalBruto)}</span>. Anexe a Nota Fiscal:</p>
                  <div className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:border-emerald-500/40 transition-all" onClick={()=>nfRef.current?.click()}>
                    {nf?<><CheckCircle2 size={20} className="text-emerald-400 mx-auto mb-1"/><p className="text-sm text-emerald-300 font-semibold">{nf.nome}</p><p className="text-xs text-slate-400">Clique para trocar</p></>
                      :<><Upload size={20} className="text-slate-500 mx-auto mb-1"/><p className="text-sm text-slate-300">Clique para anexar NF (PDF/imagem, máx 8MB)</p></>}
                  </div>
                  <input ref={nfRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleNF}/>
                </div>
                <div className="flex gap-2">
                  <Btn variant="success" size="lg" className="flex-1 justify-center" disabled={!nf}
                    onClick={()=>commit(fec.id,mot.id,{statusAgr:"aprovado",nf,comentarioAgr:"Ciência dada pelo agregado."})}>
                    <Check size={16}/>Confirmar Ciência e Enviar NF
                  </Btn>
                  <Btn variant="ghost" onClick={()=>setAprovarStep(null)}>Cancelar</Btn>
                </div>
              </div>
            ) : aprovarStep === fec.id+"_contest" ? (
              <div className="space-y-4 bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                <div>
                  <p className="text-sm font-bold text-red-300 mb-1">📋 Registrar Contestação</p>
                  <p className="text-xs text-slate-400">Explique o que está incorreto e envie evidências (fotos, documentos). Tudo será analisado pelo time operacional.</p>
                </div>
                <TA label="Motivo da contestação *" placeholder="Descreva detalhadamente o que está incorreto (ex: faltaram 3 CTEs do dia 15/04, ou pacotes não foram registrados corretamente...)" rows={4} value={motivo} onChange={e=>setMotivo(e.target.value)}/>
                {/* Evidências */}
                <div>
                  <p className="text-xs font-semibold text-slate-300 mb-2">Evidências (opcional) — fotos, printscreens, documentos</p>
                  <div className="border-2 border-dashed border-slate-600 hover:border-red-500/40 rounded-xl p-4 text-center cursor-pointer transition-all" onClick={()=>evidRef.current?.click()}>
                    <Paperclip size={20} className="text-slate-500 mx-auto mb-1"/>
                    <p className="text-sm text-slate-400">Clique para adicionar evidências</p>
                    <p className="text-xs text-slate-500 mt-0.5">PDF, imagem · múltiplos arquivos · máx 8MB cada</p>
                  </div>
                  <input ref={evidRef} type="file" accept="image/*,.pdf" multiple className="hidden" onChange={handleEvidencia}/>
                  {evidencias.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {evidencias.map(ev=>(
                        <div key={ev.id} className="flex items-center justify-between bg-slate-900 border border-slate-700 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2"><Paperclip size={12} className="text-blue-400"/><span className="text-xs text-slate-300">{ev.nome}</span></div>
                          <button onClick={()=>setEvidencias(p=>p.filter(x=>x.id!==ev.id))} className="text-slate-500 hover:text-red-400"><X size={12}/></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Btn variant="danger" size="lg" className="flex-1 justify-center" disabled={!motivo.trim()}
                    onClick={()=>commit(fec.id,mot.id,{statusAgr:"rejeitado",comentarioAgr:motivo,contestacao:{motivo,evidencias,ts:now()}})}>
                    <Send size={16}/>Enviar Contestação
                  </Btn>
                  <Btn variant="ghost" onClick={()=>{setAprovarStep(null);setMotivo("");setEvidencias([]);}}>Cancelar</Btn>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <Btn variant="success" size="lg" className="flex-1 justify-center" onClick={()=>setAprovarStep(fec.id)}>
                  <Check size={16}/>Dar Ciência e Enviar NF
                </Btn>
                <Btn variant="danger" size="lg" className="flex-1 justify-center" onClick={()=>setAprovarStep(fec.id+"_contest")}>
                  <X size={16}/>Contestar
                </Btn>
              </div>
            )}
          </div>
        ))}

        {/* Histórico de fechamentos */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Histórico de Fechamentos</h2>
          {meusFechamentos.length === 0 && <p className="text-slate-500 text-sm py-6 text-center">Nenhum fechamento registrado ainda.</p>}
          {meusFechamentos.map(({ fec, mot }) => {
            const etapaInfo = ETAPA_LABEL[mot.etapa] || ETAPA_LABEL.agr;
            return (
              <Card key={fec.id} className={"overflow-hidden "+(selectedFecId===fec.id?"border-blue-500/40":"")+""}>
                <div className="flex items-start justify-between gap-3 p-4 cursor-pointer hover:bg-slate-700/20 transition-all"
                  onClick={()=>setSelectedFecId(selectedFecId===fec.id?null:fec.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge color={etapaInfo.cor}>{etapaInfo.label}</Badge>
                    </div>
                    <p className="font-semibold text-slate-100">{fec.descricao}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{fec.periodo} · {mot.totalCTEs} CTEs entregues</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-emerald-400">{fmt(mot.totalBruto)}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{fmtDate(fec.criadoEm)}</p>
                    <ChevronDown size={14} className={"text-slate-500 mt-1 ml-auto transition-transform "+(selectedFecId===fec.id?"rotate-180":"")+""}/>
                  </div>
                </div>
                {selectedFecId===fec.id&&(
                  <div className="border-t border-slate-700 p-4 space-y-2 text-sm">
                    {mot.vDiaria>0&&<div className="flex justify-between"><span className="text-slate-400">{mot.diasUnicos||1} dia(s) × {fmt(mot.valorDiaria)}</span><span className="text-amber-400 font-semibold">{fmt(mot.vDiaria)}</span></div>}
                    {mot.vPacotes>0&&<div className="flex justify-between"><span className="text-slate-400">{mot.tipo==="diaria_excedente"?"Excedente: "+(mot.excedente)+" pcts × "+(fmt(mot.valorPacote))+"":""+(mot.totalPacotes)+" × "+(fmt(mot.valorPacote))+""}</span><span className="text-emerald-400 font-semibold">{fmt(mot.vPacotes)}</span></div>}
                    {mot.correcoes?.length>0&&mot.correcoes.map(cr=>(
                      <div key={cr.id} className="flex justify-between items-start gap-2"><span className="text-blue-400 text-xs flex-1">CTE {cr.ncte}{cr.data?" ("+(cr.data)+")":""}: {cr.justificativa}</span><span className={"text-xs font-bold px-1.5 py-0.5 rounded whitespace-nowrap "+(cr.valor>=0?"bg-emerald-500/20 text-emerald-400":"bg-red-500/20 text-red-400")+""}>{cr.valor>=0?"Acréscimo":"Débito"}: {cr.valor>=0?"+":""}{fmt(cr.valor)}</span></div>
                    ))}
                    <div className="flex justify-between font-bold border-t border-slate-700 pt-2"><span className="text-slate-100">Total</span><span className="text-emerald-400">{fmt(mot.totalBruto)}</span></div>
                    {mot.comentarioAgr&&<p className="text-xs text-slate-400 italic mt-1">Seu comentário: "{mot.comentarioAgr}"</p>}
                    {mot.nf&&<p className="text-xs text-emerald-400 mt-1"><CheckCircle2 size={11} className="inline mr-1"/>NF enviada: {mot.nf.nome}</p>}
                    {fec.status==="pago"&&(
                      <div className="mt-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 flex items-center gap-3">
                        <CreditCard size={18} className="text-emerald-400 flex-shrink-0"/>
                        <div>
                          <p className="text-sm font-bold text-emerald-300">Pagamento confirmado</p>
                          <p className="text-xs text-emerald-400/70">{fmtDate(fec.dataPagamento)}</p>
                          {fec.comprovante&&<p className="text-xs text-emerald-400/60 mt-0.5">Comprovante: {fec.comprovante.nome}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      {/* ══ TICKETS DE ACAREAÇÃO ══ */}
      {(() => {
        const meusTickets = (tickets||[]).filter(t => {
          if (mCad && t.motoristaId === mCad.id) return true;
          if (mCad && t.matricula && t.matricula === mCad.matricula) return true;
          if (mCad && t.nomeAgregado && t.nomeAgregado.trim().toUpperCase() === mCad.nome.trim().toUpperCase()) return true;
          return false;
        }).sort((a,b) => (b.criadoEm||"").localeCompare(a.criadoEm||""));

        const calcDias = prazo => {
          if (!prazo) return null;
          return Math.ceil((new Date(prazo+"T23:59:59") - new Date()) / 86400000);
        };

        const handleEvidencia = (ticketId, file) => {
          const r = new FileReader();
          r.onload = ev => setTickets(p => p.map(x => {
            if (x.id !== ticketId) return x;
            const h = { id: Math.random().toString(36).slice(2), tipo:"resposta", texto:"Agregado enviou evidência: "+file.name, autor:mCad?.nome||"Agregado", data:new Date().toISOString() };
            return {...x, status:"respondido", respostaNome:file.name, respostaData:ev.target.result, respondidoEm:new Date().toISOString(), historico:[...(x.historico||[]), h]};
          }));
          r.readAsDataURL(file);
        };

        if (meusTickets.length === 0) return null;

        const pendentes = meusTickets.filter(t => t.status==="aguardando"||t.status==="aberto");
        const isImg = d => d && d.startsWith("data:image");

        return (
          <div className="space-y-3">
            <div className={"rounded-xl p-4 border-2 "+(pendentes.length>0?"bg-red-500/10 border-red-500/40":"bg-slate-800 border-slate-700")}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">⚠</span>
                <p className={"font-bold text-sm "+(pendentes.length>0?"text-red-300":"text-slate-300")}>
                  Tickets de Acareação {pendentes.length>0&&`— ${pendentes.length} aguardando sua resposta`}
                </p>
              </div>
              {pendentes.length>0&&<p className="text-xs text-red-400/70">Sem resposta dentro do prazo, o valor será debitado automaticamente do seu fechamento.</p>}
            </div>

            {meusTickets.map(t => {
              const st = TICKET_STATUS?.[t.status]||{label:t.status,cor:"#94a3b8"};
              const dias = calcDias(t.prazoData);
              const urgente = dias !== null && dias <= 1 && (t.status==="aguardando"||t.status==="aberto");
              return (
                <div key={t.id} className={"rounded-xl border-2 p-4 space-y-3 "+(urgente?"bg-red-500/5 border-red-500/50":"bg-slate-900 border-slate-700")}>
                  {/* Cabeçalho */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-mono text-slate-500">#{t.id.slice(-6).toUpperCase()}</span>
                        <span className="text-sm font-bold text-slate-100">{t.titulo}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold border" style={{color:st.cor,borderColor:st.cor+"50",background:st.cor+"15"}}>{st.label}</span>
                      </div>
                      <p className="text-xs text-slate-400">Aberto em {(t.criadoEm||"").slice(0,10)} · Prazo: <span className="text-amber-400 font-semibold">{t.prazoData||(String(t.slaDias||5)+" dias")}</span></p>
                    </div>
                    <div className="text-right flex-shrink-0 space-y-1">
                      <p className="text-xs text-slate-500">Valor em risco</p>
                      <p className="text-xl font-bold text-red-400">R$ {(t.valor||0).toFixed(2).replace(".",",")}</p>
                      {dias !== null && (t.status==="aguardando"||t.status==="aberto") && (
                        dias < 0 ? <p className="text-xs font-bold text-red-500">⚡ Vencido</p>
                        : dias === 0 ? <p className="text-xs font-bold text-red-400 animate-pulse">🚨 Vence HOJE</p>
                        : dias <= 2 ? <p className="text-xs font-bold text-amber-400">⚠ {dias}d restante(s)</p>
                        : <p className="text-xs text-slate-500">{dias} dias restantes</p>
                      )}
                    </div>
                  </div>

                  {urgente && (
                    <div className="bg-red-500/10 border border-red-500/40 rounded-lg p-3 animate-pulse">
                      <p className="text-xs font-bold text-red-400">🚨 URGENTE — {dias<=0?"Prazo vencido!":"Último dia!"} Sem evidência, R$ {(t.valor||0).toFixed(2).replace(".",",")} será debitado do seu próximo fechamento.</p>
                    </div>
                  )}

                  {t.descricao && <p className="text-xs text-slate-300 bg-slate-800 rounded-lg p-3 border border-slate-700">{t.descricao}</p>}

                  {/* Evidência do gestor */}
                  {t.pdfData && (
                    <div className="border border-slate-700 rounded-lg p-3 bg-slate-800">
                      <p className="text-xs font-bold text-slate-400 mb-2">📎 Evidência anexada: {t.pdfNome||"anexo"}</p>
                      {isImg(t.pdfData)
                        ? <img src={t.pdfData} alt="evidencia" className="max-w-full rounded-lg border border-slate-700" style={{maxHeight:"280px"}}/>
                        : <a href={t.pdfData} download={t.pdfNome||"evidencia.pdf"} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 text-sm hover:bg-blue-500/30">
                            📄 Baixar PDF
                          </a>
                      }
                    </div>
                  )}

                  {/* Resposta já enviada */}
                  {t.respostaNome && (
                    <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/30 space-y-2">
                      <p className="text-xs font-bold text-emerald-400">✅ Evidência enviada em {(t.respondidoEm||"").slice(0,10)} — {t.respostaNome}</p>
                      {isImg(t.respostaData)&&<img src={t.respostaData} alt="resposta" className="max-w-full rounded-lg" style={{maxHeight:"200px"}}/>}
                    </div>
                  )}

                  {/* Debitado */}
                  {t.status==="debitado" && (
                    <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/30">
                      <p className="text-xs font-bold text-red-400">⚡ Valor debitado: R$ {(t.valor||0).toFixed(2).replace(".",",")} em {(t.debitadoEm||"").slice(0,10)}</p>
                      <p className="text-xs text-slate-500 mt-1">Este valor foi descontado do seu fechamento.</p>
                    </div>
                  )}

                  {/* Botões de resposta */}
                  {(t.status==="aguardando"||t.status==="aberto") && !t.respostaNome && (
                    <div className="pt-2 border-t border-slate-700">
                      <p className="text-xs font-bold text-amber-400 mb-2">📎 Enviar sua evidência — Responda este ticket</p>
                      <div className="flex gap-2">
                        <label className="flex-1 py-3 rounded-xl border-2 border-amber-500/40 text-xs text-center text-amber-400 hover:bg-amber-500/10 cursor-pointer transition-all font-semibold">
                          📷 Tirar Foto
                          <input type="file" accept="image/*" capture="environment" className="hidden"
                            onChange={e=>{const f=e.target.files?.[0];if(f)handleEvidencia(t.id,f);}}/>
                        </label>
                        <label className="flex-1 py-3 rounded-xl border-2 border-blue-500/40 text-xs text-center text-blue-400 hover:bg-blue-500/10 cursor-pointer transition-all font-semibold">
                          📎 Enviar Arquivo
                          <input type="file" accept="image/*,.pdf" className="hidden"
                            onChange={e=>{const f=e.target.files?.[0];if(f)handleEvidencia(t.id,f);}}/>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Histórico */}
                  {(t.historico||[]).length > 0 && (
                    <div className="pt-2 border-t border-slate-800">
                      <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Histórico</p>
                      <div className="space-y-1.5">
                        {[...(t.historico||[])].reverse().map(h => {
                          const icons = { criacao:"🆕", debito:"⚡", encerrado:"✅", whatsapp:"📱", resposta:"📎", contestacao:"↺", acao:"•" };
                          return (
                            <div key={h.id} className="flex items-start gap-2">
                              <span className="text-xs mt-0.5">{icons[h.tipo]||"•"}</span>
                              <div>
                                <p className="text-xs text-slate-400">{h.texto}</p>
                                <p className="text-xs text-slate-600">{(h.data||"").slice(0,16).replace("T"," ")}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })()}

      </div>
    </div>
  );
}
function PainelLinks({ fec, motoristas }) {
  const [copied, setCopied] = useState(null);

  const copyCode = (mot) => {
    // Find the permanent code from motoristas cadastro
    const mCad = motoristas.find(m => m.matricula === mot.mat);
    const code = mCad?.codigoAcesso || mot.id;
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(mot.id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-300 space-y-1">
        <p className="font-semibold">Como enviar ao agregado:</p>
        <p>1. Copie o <strong>código permanente</strong> do motorista abaixo</p>
        <p>2. Envie por WhatsApp, e-mail ou SMS</p>
        <p>3. O motorista abre o sistema → "Sou agregado" → cola o código → acessa o portal</p>
        <p className="text-blue-400/70">O código é fixo e funciona para todos os fechamentos futuros.</p>
      </div>
      {fec.mots.map(c => {
        const mCad = motoristas.find(m => m.matricula === c.mat);
        const code = mCad?.codigoAcesso || "—";
        return (
          <Card key={c.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-slate-100">{c.nome}</p>
                  <Badge color={c.statusAgr==="aprovado"?"#10b981":c.statusAgr==="rejeitado"?"#ef4444":"#f59e0b"}>
                    {c.statusAgr==="aprovado"?"✓ Ciência dada":c.statusAgr==="rejeitado"?"✗ Contestou":"⏳ Aguardando"}
                  </Badge>
                  {c.nf && <Badge color="#10b981">NF Recebida</Badge>}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{fmt(c.totalBruto)} · Mat: {c.mat}</p>
                {c.statusAgr === "pendente" && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 mb-1">Código permanente de acesso:</p>
                      <code className="text-sm bg-slate-900 border border-amber-500/30 rounded px-3 py-1.5 text-amber-400 font-mono select-all block text-center tracking-wider">
                        {code}
                      </code>
                    </div>
                    <Btn size="sm" variant="secondary" onClick={() => copyCode(c)}>
                      {copied === c.id ? <><Check size={12} />Copiado!</> : <><Copy size={12} />Copiar</>}
                    </Btn>
                  </div>
                )}
                {c.comentarioAgr && <p className="text-xs text-slate-400 mt-1 italic">"{c.comentarioAgr}"</p>}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// ABA PAGAMENTOS
// ═══════════════════════════════════════════════════════
function PagamentosView({ user, fechamentos, setFechamentos, tasks, setTasks, users, clients, motoristas, tickets, setTickets }) {
  const mCad = null; // not applicable in gestor view — prevents ReferenceError from nested components
  const [tab, setTab] = useState("agregados");
  const [expandTask, setExpandTask] = useState(null);
  const [expandHist, setExpandHist] = useState(null);
  const [viewFile, setViewFile] = useState(null);

  // Filters (shared across tabs)
  const [fMotor,  setFMotor]  = useState("");
  const [fCTE,    setFCTE]    = useState("");
  const [fDtIni,  setFDtIni]  = useState("");
  const [fDtFim,  setFDtFim]  = useState("");
  const hasFilter = fMotor || fCTE || fDtIni || fDtFim;
  const clearFilters = () => { setFMotor(""); setFCTE(""); setFDtIni(""); setFDtFim(""); };

  const matchesMot = (mot) => {
    if (fMotor.trim()) {
      const q = fMotor.trim().toLowerCase();
      if (!mot.nome.toLowerCase().includes(q) && !mot.mat.includes(q)) return false;
    }
    if (fCTE.trim()) {
      const q = fCTE.trim().toLowerCase();
      const hasCTE = (mot.entregas||[]).some(e=>(e.ncte||"").toLowerCase().includes(q)) ||
                     (mot.correcoes||[]).some(c=>(c.ncte||"").toLowerCase().includes(q));
      if (!hasCTE) return false;
    }
    return true;
  };

  // Match by CTE date range
  const matchesDate = (mot) => {
    if (!fDtIni && !fDtFim) return true;
    const cteDatas = (mot.entregas||[]).map(e => e.data).filter(Boolean);
    if (cteDatas.length === 0) return true; // no dates to filter on — include
    return cteDatas.some(d => {
      const parts = d.split("/");
      const iso = parts.length === 3 ? parts[2]+"-"+parts[1].padStart(2,"0")+"-"+parts[0].padStart(2,"0") : d.slice(0,10);
      if (fDtIni && iso < fDtIni) return false;
      if (fDtFim && iso > fDtFim) return false;
      return true;
    });
  };

  // Novo fluxo: fin = aprovado pelo agregado, aguardando pagamento financeiro
  const motsFin = fechamentos.flatMap(f=>
    (f.mots||[]).filter(c=>c.etapa==="fin").map(c=>({fec:f,mot:c}))
  );
  // Aguardando ciência do agregado
  const motsAgr = fechamentos.flatMap(f=>
    (f.mots||[]).filter(c=>c.etapa==="agr").map(c=>({fec:f,mot:c}))
  );
  const motsPago = fechamentos.flatMap(f=>
    (f.mots||[]).filter(c=>c.etapa==="pago").map(c=>({fec:f,mot:c}))
  );
  const motsContestados = fechamentos.flatMap(f=>
    (f.mots||[]).filter(c=>c.etapa==="revisao_op").map(c=>({fec:f,mot:c}))
  );
  // Em revisão interna (op, gest, fin_review)
  const motsInternal = fechamentos.flatMap(f=>
    (f.mots||[]).filter(c=>["op","gest"].includes(c.etapa)).map(c=>({fec:f,mot:c}))
  );
  const fecPagos = fechamentos.filter(f=>f.status==="pago");
  const totalFecPend = motsFin.reduce((s,x)=>s+x.mot.totalBruto,0);
  const totalFecPago = motsPago.reduce((s,x)=>s+x.mot.totalBruto,0);

  const tasksPendPag = tasks.filter(t=>
    t.status==="completed" && t.costRationals?.length>0 &&
    t.costRationals.reduce((s,c)=>s+c.value,0)>0 && !t.pagamentoConfirmado
  );
  const tasksPagas = tasks.filter(t=>t.pagamentoConfirmado);
  const totalTaskPend = tasksPendPag.reduce((s,t)=>s+t.costRationals.reduce((a,c)=>a+c.value,0),0);
  const totalTaskPago = tasksPagas.reduce((s,t)=>s+t.costRationals.reduce((a,c)=>a+c.value,0),0);

  const pagarTask = async (taskId, e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const data = await readFileAsBase64(file);
    setTasks(prev => prev.map(t => t.id !== taskId ? t : {
      ...t, pagamentoConfirmado:true, dataPagamentoTask:now(),
      comprovanteTask:{nome:file.name,tipo:file.type,data},
      comments:[...(t.comments||[]),{id:uid(),userId:user.id,userName:user.name,text:"Pagamento confirmado — comprovante: "+(file.name)+"",createdAt:now()}]
    }));
  };

  const pendCount = motsFin.length + motsContestados.length + tasksPendPag.length;

  // Export all payments to CSV
  const exportarTudo = () => {
    const rows = [["Tipo","Nome","Fechamento/Tarefa","Período","Valor (R$)","Data Pagamento","Comprovante","NF","Status"]];
    motsPago.forEach(({fec,mot}) => rows.push(["Motorista",mot.nome,fec.descricao,fec.periodo,
      mot.totalBruto.toFixed(2).replace(".",","),fmtDate(mot.dataPagMot),
      mot.comprovanteMot?.nome||"—",mot.nf?.nome||"—","Pago"]));
    tasksPagas.forEach(t => {
      const total = t.costRationals.reduce((s,c)=>s+c.value,0);
      rows.push(["Tarefa",t.title,t.templateName,"—",total.toFixed(2).replace(".",","),fmtDate(t.dataPagamentoTask),t.comprovanteTask?.nome||"—","—","Pago"]);
    });
    motsFin.forEach(({fec,mot}) => rows.push(["Motorista",mot.nome,fec.descricao,fec.periodo,
      mot.totalBruto.toFixed(2).replace(".",","),"—","—",mot.nf?.nome||"—","Aguard. Pagamento"]));
    const csv = "\uFEFF" + rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(";")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = "pagamentos_"+(new Date().toISOString().slice(0,10))+".csv";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => document.body.removeChild(a), 100);
  };

  // File preview modal
  const FileViewer = ({file, onClose}) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-700 sticky top-0 bg-slate-800">
          <p className="text-sm font-semibold text-slate-100 truncate">{file.nome}</p>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400"><X size={15}/></button>
        </div>
        <div className="flex-1 overflow-auto p-3 flex items-center justify-center bg-slate-900">
          {file.tipo?.startsWith("image/")
            ? <img src={file.data} alt={file.nome} className="max-w-full max-h-[70vh] rounded-lg object-contain"/>
            : file.tipo==="application/pdf"
              ? <iframe src={file.data} className="w-full h-[70vh] border-0 rounded" title={file.nome}/>
              : <div className="text-center py-10">
                  <FileText size={40} className="text-slate-500 mx-auto mb-3"/>
                  <p className="text-slate-400 text-sm mb-2">Pré-visualização não disponível</p>
                  <a href={file.data} download={file.nome} className="text-amber-400 text-xs hover:underline">Baixar arquivo</a>
                </div>
          }
        </div>
      </div>
    </div>
  );

  const FileBtn = ({file, label}) => file ? (
    <button onClick={()=>setViewFile(file)} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 hover:underline">
      <Eye size={11}/>{label||file.nome}
    </button>
  ) : null;

  return (
    <div className="p-6 space-y-5">
      {viewFile && <FileViewer file={viewFile} onClose={()=>setViewFile(null)}/>}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Pagamentos</h1>
          <p className="text-sm text-slate-400">Fechamentos de entrega e tarefas com custos</p>
        </div>
        <div className="flex items-center gap-2">
          {pendCount>0&&(
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-2">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"/>
              <span className="text-sm font-semibold text-amber-300">{pendCount} aguardando</span>
            </div>
          )}
          <Btn variant="secondary" size="sm" onClick={exportarTudo}><FileText size={13}/>Exportar CSV</Btn>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4 border-purple-500/20 bg-purple-500/5">
          <p className="text-xs text-purple-400/70 mb-1">Aguard. Ciência Agregado</p>
          <p className="text-xl font-bold text-purple-400">{fmt(motsAgr.reduce((s,x)=>s+x.mot.totalBruto,0))}</p>
          <p className="text-xs text-purple-400/50 mt-0.5">{motsAgr.length} motorista(s)</p>
        </Card>
        <Card className="p-4 border-amber-500/20 bg-amber-500/5">
          <p className="text-xs text-amber-400/70 mb-1">Aguard. Pagamento Fin.</p>
          <p className="text-xl font-bold text-amber-400">{fmt(totalFecPend)}</p>
          <p className="text-xs text-amber-400/50 mt-0.5">{motsFin.length} motorista(s)</p>
        </Card>
        <Card className="p-4 border-red-500/20 bg-red-500/5">
          <p className="text-xs text-red-400/70 mb-1">Contestados</p>
          <p className="text-xl font-bold text-red-400">{motsContestados.length}</p>
          <p className="text-xs text-red-400/50 mt-0.5">voltaram à operação</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-emerald-400/70 mb-1">Total Pago</p>
          <p className="text-xl font-bold text-emerald-400">{fmt(totalFecPago+totalTaskPago)}</p>
          <p className="text-xs text-slate-500 mt-0.5">{motsPago.length+tasksPagas.length} item(s)</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          ["agr",        "🟣 Ciência Agregado"+(motsAgr.length>0?" ("+motsAgr.length+")":""),              motsAgr.length>0],
          ["agregados",  "💰 Pagar"+(motsFin.length>0?" ("+motsFin.length+")":""),                        motsFin.length>0],
          ["contestados","⚠ Contestados"+(motsContestados.length>0?" ("+motsContestados.length+")":""),   motsContestados.length>0],
          ["internos",   "🔄 Em Revisão"+(motsInternal.length>0?" ("+motsInternal.length+")":""),          motsInternal.length>0],
          ["tarefas",    "📋 Tarefas"+(tasksPendPag.length>0?" ("+tasksPendPag.length+")":""),              tasksPendPag.length>0],
          ["historico",  "✅ Histórico ("+(motsPago.length+tasksPagas.length)+")", false],
          ["acareacao",  "⚠ Acareações"+(((tickets||[]).filter(t=>t.motoristaId===mCad?.id&&t.status==="aguardando").length)>0?" ("+(tickets||[]).filter(t=>t.motoristaId===mCad?.id&&t.status==="aguardando").length+")":""),  (tickets||[]).filter(t=>t.motoristaId===mCad?.id&&t.status==="aguardando").length>0],
        ].map(([v,l,hasPend])=>(
          <button key={v} onClick={()=>setTab(v)}
            className={"text-xs px-3 py-1.5 rounded-full font-semibold border transition-all relative "+(tab===v?"bg-red-600 text-white border-red-600":"bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500")+""}>
            {l}{hasPend&&tab!==v&&<span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full"/>}
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filtros</p>
          {hasFilter && <button onClick={clearFilters} className="text-xs text-amber-400 hover:text-amber-300">Limpar</button>}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Agregado / Matrícula</label>
            <input value={fMotor} onChange={e=>setFMotor(e.target.value)} placeholder="Nome ou matrícula..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500 placeholder-slate-500"/>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Número do CTE</label>
            <input value={fCTE} onChange={e=>setFCTE(e.target.value)} placeholder="Ex: 18250100..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500 placeholder-slate-500"/>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Data início (CTE)</label>
            <input type="date" value={fDtIni} onChange={e=>setFDtIni(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"/>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Data fim (CTE)</label>
            <input type="date" value={fDtFim} onChange={e=>setFDtFim(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"/>
          </div>
        </div>
      </div>

      {/* AGR — Aguardando ciência do agregado */}
      {tab === "agr" && (
        <div className="space-y-3">
          {motsAgr.length===0&&<div className="text-center py-10 text-slate-500">Nenhum motorista aguardando ciência do agregado.</div>}
          {motsAgr.filter(({mot})=>matchesMot(mot)).map(({fec,mot})=>(
            <Card key={mot.id} className="p-4 border-purple-500/20 bg-purple-500/5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge color="#8b5cf6">Aguard. Ciência</Badge>
                    <span className="text-xs text-slate-500">{fec.descricao} · {fec.periodo}</span>
                  </div>
                  <p className="font-semibold text-slate-100">{mot.nome} <span className="text-xs text-slate-500">Mat: {mot.mat}</span></p>
                  <p className="text-xs text-slate-400 mt-0.5">{mot.totalCTEs} CTEs · {mot.diasUnicos} dia(s)</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xl font-bold text-purple-400">{fmt(mot.totalBruto)}</p>
                  <p className="text-xs text-slate-500">Valor aprovado pelo financeiro</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* AGREGADOS — Pagar (etapa fin = agregado aceitou, aguardando pagamento) */}
      {tab === "agregados" && (
        <div className="space-y-3">
          {motsFin.length===0&&<div className="text-center py-10 text-slate-500">Nenhum motorista aguardando pagamento.</div>}
          {motsFin.filter(({mot})=>matchesMot(mot)).map(({fec,mot})=>(
            <Card key={mot.id} className="p-4 border-amber-500/20 bg-amber-500/5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge color="#f59e0b">Aguard. Pagamento</Badge>
                    <span className="text-xs text-slate-500">{fec.descricao} · {fec.periodo}</span>
                  </div>
                  <p className="font-semibold text-slate-100">{mot.nome} <span className="text-xs text-slate-500">Mat: {mot.mat}</span></p>
                  <p className="text-xs text-slate-400 mt-0.5">{mot.totalCTEs} CTEs · {mot.diasUnicos} dia(s)</p>
                  {mot.nf&&<p className="text-xs text-blue-400 mt-1">📄 NF: {mot.nf.nome} <button onClick={()=>setViewFile(mot.nf)} className="underline ml-1">ver</button></p>}
                </div>
                <div className="text-right flex-shrink-0 space-y-2">
                  <p className="text-xl font-bold text-amber-400">{fmt(mot.totalBruto)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* CONTESTADOS */}
      {tab === "contestados" && (
        <div className="space-y-3">
          {motsContestados.length===0&&<div className="text-center py-10 text-slate-500">Nenhum motorista contestado.</div>}
          {motsContestados.filter(({mot})=>matchesMot(mot)).map(({fec,mot})=>(
            <Card key={mot.id} className="p-4 border-red-500/20 bg-red-500/5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge color="#dc2626">Contestado</Badge>
                    <span className="text-xs text-slate-500">{fec.descricao} · {fec.periodo}</span>
                  </div>
                  <p className="font-semibold text-slate-100">{mot.nome}</p>
                  {mot.comentarioAgr&&<p className="text-xs text-red-300 mt-1">Motivo: {mot.comentarioAgr}</p>}
                </div>
                <p className="text-xl font-bold text-red-400 flex-shrink-0">{fmt(mot.totalBruto)}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* INTERNOS — Em revisão operacional/gestor */}
      {tab === "internos" && (
        <div className="space-y-3">
          {motsInternal.length===0&&<div className="text-center py-10 text-slate-500">Nenhum em revisão interna.</div>}
          {motsInternal.map(({fec,mot})=>{
            const etLabel = MOT_ETAPA[mot.etapa]||{label:mot.etapa,cor:"#64748b"};
            return (
              <Card key={mot.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge color={etLabel.cor}>{etLabel.label}</Badge>
                      <span className="text-xs text-slate-500">{fec.descricao} · {fec.periodo}</span>
                    </div>
                    <p className="font-semibold text-slate-100">{mot.nome}</p>
                  </div>
                  <p className="text-xl font-bold text-slate-300 flex-shrink-0">{fmt(mot.totalBruto)}</p>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* TAREFAS */}
      {tab === "tarefas" && (
        <div className="space-y-3">
          {tasksPendPag.length===0&&<div className="text-center py-10 text-slate-500">Nenhuma tarefa com custo pendente.</div>}
          {tasksPendPag.map(t=>{
            const total = t.costRationals.reduce((s,c)=>s+c.value,0);
            const opener = users.find(u=>u.id===t.openedBy);
            return (
              <Card key={t.id} className="p-4 border-blue-500/20 bg-blue-500/5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge color="#60a5fa">Tarefa</Badge>
                      <span className="text-xs text-slate-500">{t.templateName}</span>
                    </div>
                    <p className="font-semibold text-slate-100">{t.title}</p>
                    {opener&&<p className="text-xs text-slate-400 mt-0.5">Por: {opener.name}</p>}
                    <div className="mt-2 space-y-0.5">
                      {t.costRationals.map(c=>(
                        <p key={c.id} className="text-xs text-slate-400">{c.description}: <span className="text-blue-400">{fmt(c.value)}</span></p>
                      ))}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 space-y-2">
                    <p className="text-xl font-bold text-blue-400">{fmt(total)}</p>
                    <label className="cursor-pointer">
                      <Btn size="sm" variant="success" onClick={e=>{e.currentTarget.parentElement.querySelector('input').click()}}>
                        <CreditCard size={12}/>Pagar
                      </Btn>
                      <input type="file" accept="image/*,.pdf" className="hidden" onChange={e=>pagarTask(t.id,e)}/>
                    </label>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {tab === "acareacao" && <PortalAcareacaoTab tickets={tickets} setTickets={setTickets} mCad={null} motMatricula={null} motoristas={motoristas}/>}
      {tab === "pagamentos" && <>
          {pagosFiltrados.length===0&&tarefasFiltradas.length===0&&(
            <div className="text-center py-12 text-slate-500"><p>{hasFilter?"Nenhum resultado com esses filtros.":"Nenhum pagamento realizado ainda."}</p></div>
          )}

          {/* Motoristas pagos */}
          {pagosFiltrados.length>0&&(
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Motoristas Pagos ({pagosFiltrados.length}{hasFilter&&motsPago.length!==pagosFiltrados.length?" de "+(motsPago.length)+"":""})</h3>
              </div>
              {pagosFiltrados.map(({fec,mot})=>{
                const isOpen = expandHist === mot.id;
                return (
                  <Card key={mot.id} className="overflow-hidden">
                    <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-700/20 transition-all"
                      onClick={()=>setExpandHist(isOpen?null:mot.id)}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <Badge color="#10b981">Pago ✓</Badge>
                          <span className="text-xs text-slate-500">{fec.descricao} · {fec.periodo}</span>
                        </div>
                        <p className="font-semibold text-slate-100">{mot.nome}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Pago em {fmtDate(mot.dataPagMot)}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <p className="text-lg font-bold text-emerald-400">{fmt(mot.totalBruto)}</p>
                        <ChevronDown size={15} className={"text-slate-400 transition-transform "+(isOpen?"rotate-180":"")+""}/>
                      </div>
                    </div>
                    {isOpen&&(
                      <div className="border-t border-slate-700 p-4 space-y-3">
                        {/* Breakdown */}
                        <div className="bg-slate-900 rounded-lg p-3 border border-slate-700 text-sm space-y-1">
                          {mot.vDiaria>0&&<div className="flex justify-between"><span className="text-slate-400">{mot.diasUnicos||1} dia(s) × {fmt(mot.valorDiaria)}</span><span className="text-amber-400 font-semibold">{fmt(mot.vDiaria)}</span></div>}
                          {mot.vPacotes>0&&<div className="flex justify-between"><span className="text-slate-400">{mot.totalPacotes} pcts × {fmt(mot.valorPacote)}</span><span className="text-emerald-400 font-semibold">{fmt(mot.vPacotes)}</span></div>}
                          {mot.correcoes?.map(cr=>(
                            <div key={cr.id} className="flex justify-between"><span className={"text-xs "+(cr.valor>=0?"text-emerald-400":"text-red-400")+""}>{cr.valor>=0?"Acréscimo":"Débito"} CTE {cr.ncte}</span><span className={"font-semibold text-xs "+(cr.valor>=0?"text-emerald-400":"text-red-400")+""}>{cr.valor>=0?"+":""}{fmt(cr.valor)}</span></div>
                          ))}
                          <div className="flex justify-between border-t border-slate-700 pt-1 font-bold"><span className="text-slate-100">Total</span><span className="text-emerald-400">{fmt(mot.totalBruto)}</span></div>
                        </div>
                        {/* Comprovante + NF */}
                        <div className="flex gap-4 flex-wrap">
                          {mot.comprovanteMot&&(
                            <div className="flex flex-col gap-1">
                              <p className="text-xs font-semibold text-slate-400">Comprovante de Pagamento</p>
                              <div className="flex items-center gap-2 bg-slate-900 border border-emerald-500/20 rounded-lg px-3 py-2">
                                <CreditCard size={14} className="text-emerald-400"/>
                                <span className="text-xs text-emerald-300 truncate max-w-[160px]">{mot.comprovanteMot.nome}</span>
                                <button onClick={()=>setViewFile(mot.comprovanteMot)} className="text-blue-400 hover:text-blue-300 ml-1"><Eye size={13}/></button>
                              </div>
                            </div>
                          )}
                          {mot.nf&&(
                            <div className="flex flex-col gap-1">
                              <p className="text-xs font-semibold text-slate-400">Nota Fiscal do Agregado</p>
                              <div className="flex items-center gap-2 bg-slate-900 border border-blue-500/20 rounded-lg px-3 py-2">
                                <FileText size={14} className="text-blue-400"/>
                                <span className="text-xs text-blue-300 truncate max-w-[160px]">{mot.nf.nome}</span>
                                <button onClick={()=>setViewFile(mot.nf)} className="text-blue-400 hover:text-blue-300 ml-1"><Eye size={13}/></button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}

          {/* Tarefas pagas */}
          {tasksPagas.length>0&&(
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tarefas Pagas ({tarefasFiltradas.length})</h3>
              {tarefasFiltradas.map(t=>{
                const total = t.costRationals.reduce((s,c)=>s+c.value,0);
                const isOpen = expandHist === t.id;
                const opener = users.find(u=>u.id===t.openedBy);
                return (
                  <Card key={t.id} className="overflow-hidden">
                    <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-700/20 transition-all"
                      onClick={()=>setExpandHist(isOpen?null:t.id)}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <Badge color="#10b981">Pago ✓</Badge>
                          <span className="text-xs text-slate-500">{t.templateName}</span>
                        </div>
                        <p className="font-semibold text-slate-100">{t.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Pago em {fmtDate(t.dataPagamentoTask)}{opener?" · "+(opener.name)+"":""}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <p className="text-lg font-bold text-emerald-400">{fmt(total)}</p>
                        <ChevronDown size={15} className={"text-slate-400 transition-transform "+(isOpen?"rotate-180":"")+""}/>
                      </div>
                    </div>
                    {isOpen&&(
                      <div className="border-t border-slate-700 p-4 space-y-3">
                        {/* Custos */}
                        <div className="bg-slate-900 rounded-lg p-3 border border-slate-700 text-sm space-y-1">
                          {t.costRationals.map(c=>(
                            <div key={c.id} className="flex justify-between"><span className="text-slate-400">{c.description}</span><span className="text-blue-400 font-semibold">{fmt(c.value)}</span></div>
                          ))}
                          <div className="flex justify-between border-t border-slate-700 pt-1 font-bold"><span className="text-slate-100">Total</span><span className="text-emerald-400">{fmt(total)}</span></div>
                        </div>
                        {/* Rateio */}
                        {t.clientAllocation?.length>0&&(
                          <div className="text-xs text-slate-400">
                            Rateio: {t.clientAllocation.map(a=>""+(clients.find(c=>c.id===a.clientId)?.name||a.clientId)+" "+(a.percent)+"%").join(" · ")}
                          </div>
                        )}
                        {/* Comprovante */}
                        {t.comprovanteTask&&(
                          <div className="flex flex-col gap-1">
                            <p className="text-xs font-semibold text-slate-400">Comprovante de Pagamento</p>
                            <div className="flex items-center gap-2 bg-slate-900 border border-emerald-500/20 rounded-lg px-3 py-2">
                              <CreditCard size={14} className="text-emerald-400"/>
                              <span className="text-xs text-emerald-300 truncate max-w-[200px]">{t.comprovanteTask.nome}</span>
                              <button onClick={()=>setViewFile(t.comprovanteTask)} className="text-blue-400 hover:text-blue-300 ml-1"><Eye size={13}/></button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
      </>
      }
    </div>
  );
}

// ─────────────────────────────────────────────
// IMPORTAÇÃO EM MASSA DE MOTORISTAS
// ─────────────────────────────────────────────
function MotoristasBulkImportBtn({ setMotoristas }) {
  const ref = useRef();
  const [result, setResult] = useState(null);

  const downloadTemplate = () => {
    const cols = ["Nome","Matricula","CPF","Email","WhatsApp","TipoPagamento","ValorDiaria","ValorCTE"];
    const ex   = ["João Silva","123456","111.222.333-44","joao@email.com","27999990001","ambos","80","1.50"];
    const csv  = [cols.join(";"), ex.join(";")].join("\n");
    const blob = new Blob(["\uFEFF"+csv], {type:"text/csv;charset=utf-8"});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href=url; a.download="modelo_motoristas.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = e => {
    const file = e.target.files?.[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target.result.replace(/^\uFEFF/,"");
      const lines = text.split(/\r?\n/).filter(l=>l.trim());
      const header = lines[0].split(/[;,\t]/);
      const rows = lines.slice(1);
      let added=0, errors=[];
      const newMots = [];
      rows.forEach((row,i) => {
        const cols = row.split(/[;,\t]/);
        const get = (name) => {
          const idx = header.findIndex(h=>h.trim().toLowerCase()===name.toLowerCase());
          return idx>=0 ? cols[idx]?.trim()||"" : "";
        };
        const nome = get("nome")||get("name");
        const mat  = get("matricula")||get("matrícula")||get("matricula");
        if (!nome||!mat) { errors.push("Linha "+(i+2)+": nome ou matrícula vazios"); return; }
        const tipo = get("tipopagamento")||get("tipo")||"ambos";
        newMots.push({
          id: uid(), nome, matricula: mat, cpf: get("cpf")||"", email: get("email")||"",
          telefone: get("whatsapp")||get("telefone")||"",
          tipoPagamento: tipo.toLowerCase().includes("diaria")?"diaria":tipo.toLowerCase().includes("cte")||tipo.toLowerCase().includes("pacote")?"pacote":"ambos",
          valorDiaria: parseFloat(get("valordiaria")||"0")||0,
          valorCTE: parseFloat(get("valorcte")||get("valorpacote")||"0")||0,
          valorPacote: parseFloat(get("valorcte")||get("valorpacote")||"0")||0,
          ativo: true,
          codigoAcesso: "AGR-"+(nome.split(" ").map(p=>p[0]).join("").slice(0,3).toUpperCase())+"-"+(Math.floor(1000+Math.random()*9000))+""
        });
        added++;
      });
      setMotoristas(p=>[...p,...newMots]);
      setResult({added, errors});
    };
    reader.readAsText(file, "utf-8");
    if(ref.current) ref.current.value="";
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Btn variant="secondary" size="sm" onClick={downloadTemplate}><Download size={13}/>Baixar Modelo CSV</Btn>
      <Btn size="sm" onClick={()=>ref.current?.click()}><Upload size={13}/>Importar Motoristas</Btn>
      <input ref={ref} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFile}/>
      {result&&(
        <span className="text-xs text-emerald-400">{result.added} importado(s){result.errors.length>0?" | "+(result.errors.length)+" erro(s)":""}</span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// FATURAMENTO JADLOG
// ─────────────────────────────────────────────
function FatJadlogView({ user, faturamentos, setFaturamentos, unidades, setUnidades, clients }) {
  const [tab, setTab]         = useState("dashboard");
  const [filtUnidade, setFiltUnidade] = useState("all");
  const [filtQuinz, setFiltQuinz]   = useState("all");
  const [filtMes, setFiltMes]       = useState("all");
  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting]   = useState(false);
  const [importMsg, setImportMsg]   = useState("");
  const [newUnNome, setNewUnNome]   = useState("");
  const [newUnCod, setNewUnCod]     = useState("");
  const fileRef = useRef();

  // Parse unit from header row of XLSX
  const parseUnidade = (headerVal) => {
    if (!headerVal) return { codigo:"", nome:"" };
    const m = String(headerVal).match(/(\d+)[-–](.+)/);
    return m ? { codigo: m[1].trim(), nome: m[2].trim() } : { codigo:"", nome: String(headerVal) };
  };

  const handleImport = async e => {
    const file = e.target.files?.[0]; if (!file) return;
    setImporting(true); setImportMsg("Lendo planilha...");
    try {
      const buf = await file.arrayBuffer();
      const { read, utils } = window.XLSX || await import("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js");
      const wb  = read(buf);
      const ws  = wb.Sheets[wb.SheetNames[0]];
      const raw = utils.sheet_to_json(ws, { header:1, defval:"" });

      // Row 0: header with unidade
      const headerRow = raw[0]||[];
      let unidadeInfo = { codigo:"", nome:"" };
      headerRow.forEach(cell => {
        if (String(cell).includes("=>")) {
          const parte = String(cell).replace("Unidade =>","").trim();
          const m = parte.match(/^(\d+)[-–](.+)/);
          if (m) unidadeInfo = { codigo:m[1].trim(), nome:m[2].trim() };
          else unidadeInfo = { codigo:"", nome:parte };
        }
      });

      // Row 2 (index 2): column headers
      const cols = raw[2]||[];
      const idx  = name => cols.findIndex(c => String(c).trim().toLowerCase() === name.toLowerCase());
      const iCTE  = idx("CTE"); const iData = idx("Data"); const iCNPJ = idx("CNPJ");
      const iFat  = idx("zFrapConrrent"); const iLiq = cols.lastIndexOf("Liquido") >= 0 ? cols.lastIndexOf("Liquido") : idx("Liquido");

      // Auto-add/find unit
      let unidadeId = "";
      const existing = unidades.find(u => u.codigo === unidadeInfo.codigo);
      if (existing) {
        unidadeId = existing.id;
      } else if (unidadeInfo.codigo) {
        const newU = { id:uid(), codigo:unidadeInfo.codigo, nome:unidadeInfo.nome };
        setUnidades(p=>[...p, newU]);
        unidadeId = newU.id;
      }

      // Parse data rows (from index 3)
      const rows = [];
      for (let r=3; r<raw.length; r++) {
        const row = raw[r];
        if (!row[iCTE]) continue;
        const cte      = String(row[iCTE]||"").trim();
        const data     = String(row[iData]||"").trim();
        const cnpj     = String(row[iCNPJ]||"").replace(/\D/g,"").replace(/^0+/,"");
        const fatBruto = Math.abs(parseFloat(row[iFat])||0);
        const comissao = Math.abs(parseFloat(row[iLiq])||0);
        if (!cte || !data) continue;
        // Parse date dd/mm/yyyy → month/year/quinzena
        const parts = data.split("/");
        const dia   = parseInt(parts[0])||0;
        const mes   = parseInt(parts[1])||0;
        const ano   = parseInt(parts[2])||0;
        const quinz = dia<=15 ? 1 : 2;
        rows.push({ id:uid(), cte, data, dia, mes, ano, quinz, cnpj, fatBruto, comissao, unidadeId });
      }

      // Store as one import batch
      const batch = { id:uid(), importadoEm:now(), arquivo:file.name, unidadeId, unidadeNome:unidadeInfo.nome, rows };
      setFaturamentos(p=>[...p, batch]);
      setImportMsg("✅ "+(rows.length)+" CTEs importados | Unidade: "+(unidadeInfo.nome||"—")+"");
    } catch(err) {
      setImportMsg("❌ Erro: " + err.message);
    }
    setImporting(false);
    if(fileRef.current) fileRef.current.value="";
  };

  // Flatten all rows with filters
  const allRows = faturamentos.flatMap(b => b.rows.map(r=>({...r, batchId:b.id, batchFile:b.arquivo})));

  const filteredRows = allRows.filter(r => {
    if (filtUnidade!=="all" && r.unidadeId!==filtUnidade) return false;
    if (filtMes!=="all" && String(r.mes)!==filtMes) return false;
    if (filtQuinz!=="all" && String(r.quinz)!==filtQuinz) return false;
    return true;
  });

  // Match CNPJ → client
  const normCnpj = s => String(s||"").replace(/\D/g,"").replace(/^0+/,"");
  const matchClient = cnpj => {
    const nc = normCnpj(cnpj);
    return clients.find(c => {
      const lista = Array.isArray(c.cnpjs) && c.cnpjs.length > 0
        ? c.cnpjs
        : (c.cnpj ? [c.cnpj] : []);
      return lista.some(x => normCnpj(x) === nc);
    });
  };

  // KPIs
  const totalFat   = filteredRows.reduce((s,r)=>s+r.fatBruto,0);
  const totalCom   = filteredRows.reduce((s,r)=>s+r.comissao,0);
  const totalCTEs  = filteredRows.length;
  const margem     = totalFat>0 ? (totalCom/totalFat*100) : 0;
  const freteMedio = totalCTEs>0 ? totalFat/totalCTEs : 0;

  // By client
  const byClient = {};
  filteredRows.forEach(r=>{
    const cl = matchClient(r.cnpj);
    const k  = cl ? cl.id : r.cnpj;
    const nm = cl ? cl.code||cl.name : "CNPJ "+(r.cnpj)+"";
    if (!byClient[k]) byClient[k] = {nome:nm, fat:0, com:0, ctes:0, matched:!!cl};
    byClient[k].fat  += r.fatBruto;
    byClient[k].com  += r.comissao;
    byClient[k].ctes += 1;
  });

  // By quinzena/mes
  const byPeriod = {};
  filteredRows.forEach(r=>{
    const k = ""+(r.ano)+"/"+(String(r.mes).padStart(2,"0"))+" Q"+(r.quinz)+"";
    if (!byPeriod[k]) byPeriod[k] = {label:k, fat:0, com:0, ctes:0};
    byPeriod[k].fat  += r.fatBruto;
    byPeriod[k].com  += r.comissao;
    byPeriod[k].ctes += 1;
  });

  const meses = [...new Set(allRows.map(r=>r.mes))].filter(Boolean).sort();
  const MONTHS = ["","Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-xl font-bold text-slate-100">Faturamento Jadlog</h1>
          <p className="text-sm text-slate-400">{totalCTEs.toLocaleString("pt-BR")} CTEs importados</p></div>
        <div className="flex items-center gap-2">
          <Btn onClick={()=>fileRef.current?.click()} disabled={importing}>
            <Upload size={14}/>{importing?"Importando...":"Importar Planilha"}
          </Btn>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport}/>
        </div>
      </div>
      {importMsg&&<div className={"text-xs px-3 py-2 rounded-lg border "+(importMsg.startsWith("✅")?"bg-emerald-500/10 border-emerald-500/30 text-emerald-300":"bg-red-500/10 border-red-500/30 text-red-300")+""}>{importMsg}</div>}

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap items-center">
        <select value={filtUnidade} onChange={e=>setFiltUnidade(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none">
          <option value="all">Todas as Unidades</option>
          {unidades.map(u=><option key={u.id} value={u.id}>{u.codigo} – {u.nome}</option>)}
        </select>
        <select value={filtMes} onChange={e=>setFiltMes(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none">
          <option value="all">Todos os Meses</option>
          {meses.map(m=><option key={m} value={m}>{MONTHS[m]}</option>)}
        </select>
        <select value={filtQuinz} onChange={e=>setFiltQuinz(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none">
          <option value="all">Ambas Quinzenas</option>
          <option value="1">1ª Quinzena (1–15)</option>
          <option value="2">2ª Quinzena (16–31)</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[["dashboard","📊 Dashboard"],["clientes","🤝 Por Cliente"],["periodo","📅 Por Período"],["unidades","🏢 Unidades"],["ctes","📋 CTEs"]].map(([v,l])=>(
          <button key={v} onClick={()=>setTab(v)}
            className={"text-xs px-3 py-1.5 rounded-full font-semibold border transition-all "+(tab===v?"bg-red-600 text-white border-red-600":"bg-slate-800 text-slate-400 border-slate-700")+""}>{l}</button>
        ))}
      </div>

      {/* DASHBOARD */}
      {tab==="dashboard"&&(
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <KpiCard compact label="CTEs" value={totalCTEs.toLocaleString("pt-BR")} icon={BarChart2} color="#60a5fa"/>
            <KpiCard compact label="Faturamento" value={fmt(totalFat)} sub="zFrapConrrent" icon={Wallet} color="#10b981"/>
            <KpiCard compact label="Comissão" value={fmt(totalCom)} sub="Liquido" icon={DollarSign} color="#f59e0b"/>
            <KpiCard compact label="Margem" value={""+(margem.toFixed(1))+"%"} sub="Comissão/Fat" icon={TrendingUp} color={margem>10?"#10b981":"#ef4444"}/>
            <KpiCard compact label="Frete Médio/CTE" value={fmt(freteMedio)} sub="Fat÷CTEs" icon={Truck} color="#8b5cf6"/>
          </div>
          {/* Bar chart por período */}
          {Object.keys(byPeriod).length>0&&(
            <Card className="p-5">
              <h3 className="text-sm font-bold text-slate-300 mb-4">Faturamento × Comissão por Período (R$ mil)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={Object.values(byPeriod).sort((a,b)=>a.label.localeCompare(b.label))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
                  <XAxis dataKey="label" stroke="#64748b" tick={{fill:"#94a3b8",fontSize:10}}/>
                  <YAxis stroke="#64748b" tick={{fill:"#94a3b8",fontSize:10}} tickFormatter={v=>""+((v/1000).toFixed(0))+"k"}/>
                  <Tooltip contentStyle={{background:"#1e293b",border:"1px solid #334155",borderRadius:8,color:"#f1f5f9"}} formatter={(v)=>["R$ "+v.toLocaleString("pt-BR",{minimumFractionDigits:2})]}/>
                  <Legend wrapperStyle={{fontSize:11,color:"#94a3b8"}}/>
                  <Bar dataKey="fat" name="Faturamento" fill="#10b981" radius={[4,4,0,0]}/>
                  <Bar dataKey="com" name="Comissão" fill="#f59e0b" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>
      )}

      {/* POR CLIENTE */}
      {tab==="clientes"&&(
        <div className="space-y-3">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-300">
            💡 Para casar automaticamente, cadastre o CNPJ do cliente em Administração → Clientes.
          </div>
          {Object.entries(byClient).sort((a,b)=>b[1].fat-a[1].fat).map(([k,c])=>{
            const m = c.fat>0?c.com/c.fat*100:0;
            return (
              <Card key={k} className="p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className={"w-2 h-2 rounded-full "+(c.matched?"bg-emerald-400":"bg-amber-400")+""}/>
                    <div>
                      <p className="font-semibold text-slate-100 text-sm">{c.nome}</p>
                      <p className="text-xs text-slate-500">{c.ctes.toLocaleString()} CTEs{!c.matched?" · CNPJ sem cadastro":""}</p>
                    </div>
                  </div>
                  <div className="flex gap-5 text-right">
                    <div><p className="text-xs text-slate-500">Faturamento</p><p className="text-sm font-bold text-emerald-400">{fmt(c.fat)}</p></div>
                    <div><p className="text-xs text-slate-500">Comissão</p><p className="text-sm font-bold text-amber-400">{fmt(c.com)}</p></div>
                    <div><p className="text-xs text-slate-500">Margem</p><p className={"text-sm font-bold "+(m>10?"text-emerald-400":"text-red-400")+""}>{m.toFixed(1)}%</p></div>
                    <div><p className="text-xs text-slate-500">Frete Médio</p><p className="text-sm font-bold text-slate-300">{fmt(c.fat/c.ctes)}</p></div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* POR PERÍODO */}
      {tab==="periodo"&&(
        <div className="space-y-3">
          {Object.entries(byPeriod).sort((a,b)=>a[0].localeCompare(b[0])).map(([k,p])=>{
            const m = p.fat>0?p.com/p.fat*100:0;
            return (
              <Card key={k} className="p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div><p className="font-semibold text-slate-100">{p.label}</p><p className="text-xs text-slate-500">{p.ctes.toLocaleString()} CTEs</p></div>
                  <div className="flex gap-5 text-right">
                    <div><p className="text-xs text-slate-500">Faturamento</p><p className="text-sm font-bold text-emerald-400">{fmt(p.fat)}</p></div>
                    <div><p className="text-xs text-slate-500">Comissão</p><p className="text-sm font-bold text-amber-400">{fmt(p.com)}</p></div>
                    <div><p className="text-xs text-slate-500">Margem</p><p className={"text-sm font-bold "+(m>10?"text-emerald-400":"text-red-400")+""}>{m.toFixed(1)}%</p></div>
                    <div><p className="text-xs text-slate-500">Frete Médio</p><p className="text-sm font-bold text-slate-300">{fmt(p.fat/p.ctes)}</p></div>
                  </div>
                </div>
              </Card>
            );
          })}
          {Object.keys(byPeriod).length===0&&<p className="text-slate-500 text-sm text-center py-10">Nenhum dado importado ainda.</p>}
        </div>
      )}

      {/* UNIDADES */}
      {tab==="unidades"&&(
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input value={newUnCod} onChange={e=>setNewUnCod(e.target.value)} placeholder="Código (ex: 000001596)"
              className="w-36 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-red-500"/>
            <input value={newUnNome} onChange={e=>setNewUnNome(e.target.value)} placeholder="Nome da unidade"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-red-500"/>
            <Btn onClick={()=>{ if(!newUnNome.trim()) return; setUnidades(p=>[...p,{id:uid(),codigo:newUnCod.trim(),nome:newUnNome.trim()}]); setNewUnNome(""); setNewUnCod(""); }} disabled={!newUnNome.trim()}>
              <Plus size={14}/>Criar
            </Btn>
          </div>
          {unidades.map(u=>{
            const rows = allRows.filter(r=>r.unidadeId===u.id);
            const fat  = rows.reduce((s,r)=>s+r.fatBruto,0);
            const com  = rows.reduce((s,r)=>s+r.comissao,0);
            return (
              <Card key={u.id} className="p-4 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-semibold text-slate-100">{u.codigo} – {u.nome}</p>
                  <p className="text-xs text-slate-500">{rows.length.toLocaleString()} CTEs</p>
                </div>
                <div className="flex gap-5 text-right">
                  <div><p className="text-xs text-slate-500">Faturamento</p><p className="text-sm font-bold text-emerald-400">{fmt(fat)}</p></div>
                  <div><p className="text-xs text-slate-500">Comissão</p><p className="text-sm font-bold text-amber-400">{fmt(com)}</p></div>
                  <div><p className="text-xs text-slate-500">Margem</p><p className="text-sm font-bold text-slate-300">{fat>0?(com/fat*100).toFixed(1):0}%</p></div>
                </div>
                <button onClick={()=>setUnidades(p=>p.filter(x=>x.id!==u.id))} className="text-slate-600 hover:text-red-400"><Trash2 size={14}/></button>
              </Card>
            );
          })}
        </div>
      )}

      {/* CTEs */}
      {tab==="ctes"&&(
        <div className="space-y-2">
          <p className="text-xs text-slate-400">{filteredRows.length.toLocaleString()} CTEs exibidos</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-slate-700">
                {["CTE","Data","CNPJ/Cliente","Faturamento","Comissão","Margem"].map(h=>(
                  <th key={h} className="text-left py-2 px-3 text-slate-400 font-semibold">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filteredRows.slice(0,200).map(r=>{
                  const cl = matchClient(r.cnpj);
                  const m  = r.fatBruto>0?r.comissao/r.fatBruto*100:0;
                  return (
                    <tr key={r.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="py-1.5 px-3 font-mono text-slate-300">{r.cte}</td>
                      <td className="py-1.5 px-3 text-slate-400">{r.data}</td>
                      <td className="py-1.5 px-3">{cl?<span className="text-emerald-400">{cl.code||cl.name}</span>:<span className="text-amber-400">{r.cnpj}</span>}</td>
                      <td className="py-1.5 px-3 text-right text-emerald-400">{fmt(r.fatBruto)}</td>
                      <td className="py-1.5 px-3 text-right text-amber-400">{fmt(r.comissao)}</td>
                      <td className="py-1.5 px-3 text-right">{m.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredRows.length>200&&<p className="text-xs text-slate-500 text-center py-3">Exibindo 200 de {filteredRows.length.toLocaleString()} CTEs</p>}
          </div>
        </div>
      )}
    </div>
  );
}


// ─────────────────────────────────────────────
// MÃO DE OBRA — CONFERÊNCIA
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// DRE — DEMONSTRATIVO DE RESULTADO POR QUINZENA
// ─────────────────────────────────────────────
const CAT_COLORS = {
  "CLT":"#60a5fa","Terceirizado":"#f59e0b","Transferência":"#a78bfa",
  "Limpeza":"#34d399","Galpão":"#fb923c","Frota":"#38bdf8",
  "Gasolina":"#facc15","Salário Agr. Casa":"#f87171","Agregados Externos":"#4ade80","Outros":"#94a3b8"
};

function PLCard({ label, pl, highlight }) {
  return (
    <Card className={"p-5 "+(highlight?"border border-amber-500/30 bg-amber-500/5":"")}>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{label}</p>
      <div className="space-y-2">
        <div className="flex justify-between text-sm"><span className="text-emerald-400 font-semibold">Comissão</span><span className="text-emerald-400 font-bold">{fmt(pl.receita)}</span></div>
        <div className="border-t border-slate-700 pt-2 space-y-1">
          {Object.entries(pl.categorias).sort((a,b)=>b[1]-a[1]).map(([cat,v])=>(
            <div key={cat} className="flex justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{background:CAT_COLORS[cat]||"#94a3b8"}}/>
                {cat}
              </span>
              <span className="text-red-400">-{fmt(v)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-700 pt-2 flex justify-between">
          <span className="text-xs font-bold text-slate-300">Total Custos</span>
          <span className="text-red-400 font-bold text-sm">{fmt(pl.totalCustos)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-slate-200">Resultado</span>
          <div className="text-right">
            <p className={"text-lg font-bold "+(pl.resultado>=0?"text-emerald-400":"text-red-400")}>{fmt(pl.resultado)}</p>
            <p className={"text-xs "+(pl.margem>=0?"text-emerald-400/70":"text-red-400/70")}>{pl.margem.toFixed(1)}% margem</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

function DREView({ user, dreEntradas, setDreEntradas, fixedCosts, costEntries, faturamentosJadlog, fechamentos, acrescimos }) {
  const [tab, setTab]   = useState("quinzena");
  const [showNew, setShowNew] = useState(false);
  const [filtAno, setFiltAno]  = useState(new Date().getFullYear());
  const [filtMes, setFiltMes]  = useState(new Date().getMonth()+1);
  const MONTHS = ["","Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

  // ── Helpers ───────────────────────────────────────
  // Receita por quinzena from Jadlog
  const getComJadlog = (mes, ano, quinz) =>
    (faturamentosJadlog||[]).flatMap(b=>b.rows)
      .filter(r=>r.mes===mes&&r.ano===ano&&(quinz?""+r.quinz===(""+quinz):true))
      .reduce((s,r)=>s+r.comissao,0);

  // Agregados externos from fechamentos (motoristas cadastrados pagos)
  const getAgregExt = (mes, ano, quinz) => {
    const ctes = (faturamentosJadlog||[]).flatMap(b=>b.rows).filter(r=>r.mes===mes&&r.ano===ano&&(quinz?""+r.quinz===(""+quinz):true));
    if (!ctes.length) {
      // fallback: sum totalBruto from fechamentos for that period
      return (fechamentos||[]).flatMap(f=>f.mots||[]).filter(m=>m.etapa==="pago").reduce((s,m)=>s+(m.totalBruto||0),0);
    }
    return 0; // we'll show from dreEntradas instead
  };

  // Fixed costs allocated (monthly, split 50/50 for quinzena)
  const getFixed = (mes, ano, quinz, cat) => {
    const fc = (fixedCosts||[]).filter(c=>c.active&&(!cat||c.category===cat));
    const total = fc.reduce((s,c)=>s+(c.value||0),0);
    return quinz ? total/2 : total;
  };

  // Variable cost entries
  const getVar = (mes, ano, cat) =>
    (costEntries||[]).filter(c=>c.month===mes&&c.year===ano&&(!cat||c.category===cat)).reduce((s,c)=>s+(c.value||0),0);

  // DRE entries (manual)
  const getDRE = (mes, ano, quinz, cat) =>
    (dreEntradas||[]).filter(e=>e.mes===mes&&e.ano===ano&&(!quinz||e.quinz===quinz)&&(!cat||e.categoria===cat)).reduce((s,e)=>s+(e.valor||0),0);

  // Build P&L for a period
  const buildPL = (mes, ano, quinz) => {
    const receita = getComJadlog(mes, ano, quinz) + (acrescimos||[]).filter(a=>a.month===mes&&a.year===ano).reduce((s,a)=>s+(a.value||0),0)/(quinz?2:1);
    const categorias = {};
    COST_CATS.forEach(cat => {
      let v = 0;
      // From fixedCosts
      const fc = (fixedCosts||[]).filter(c=>c.active&&c.category===cat).reduce((s,c)=>s+(c.value||0),0);
      v += quinz ? fc/2 : fc;
      // From costEntries
      v += (costEntries||[]).filter(c=>c.month===mes&&c.year===ano&&c.category===cat).reduce((s,c)=>s+(c.value||0),0);
      // From dreEntradas (manual quinzena entries)
      v += getDRE(mes, ano, quinz||null, cat);
      if (v > 0) categorias[cat] = v;
    });
    // Agregados externos from fechamentos (pago)
    const agrExt = (fechamentos||[]).flatMap(f=>{
      // Check if fechamento period matches roughly
      return f.mots||[];
    }).filter(m=>m.etapa==="pago").reduce((s,m)=>s+(m.totalBruto||0),0);
    if (agrExt > 0 && !categorias["Agregados Externos"]) {
      categorias["Agregados Externos"] = agrExt;
    }
    const totalCustos = Object.values(categorias).reduce((s,v)=>s+v,0);
    return { receita, categorias, totalCustos, resultado: receita - totalCustos, margem: receita>0?((receita-totalCustos)/receita*100):0 };
  };

  const pl1 = buildPL(filtMes, filtAno, 1);
  const pl2 = buildPL(filtMes, filtAno, 2);
  const plMes = buildPL(filtMes, filtAno, null);

  // Agregados da Casa - motoristas sem cadastro nos fechamentos
  const nokMots = useMemo(() => {
    const map = {};
    (fechamentos||[]).forEach(f => {
      (f.nok||[]).forEach(m => {
        if (!map[m.mat]) map[m.mat] = { mat:m.mat, nome:m.nome, ctes:0 };
      });
      (f.mots||[]).filter(m=>!m.matricula&&m.nome).forEach(m => {
        if (!map[m.nome]) map[m.nome] = { mat:m.nome, nome:m.nome, ctes:0 };
        map[m.nome].ctes += m.totalCTEs||0;
      });
    });
    return Object.values(map);
  }, [fechamentos]);

  const totalCTEsCasa = nokMots.reduce((s,m)=>s+m.ctes,0);
  const custoAgrCasa = getDRE(filtMes, filtAno, null, "Salário Agr. Casa")
    + getDRE(filtMes, filtAno, null, "Frota") + getDRE(filtMes, filtAno, null, "Gasolina");
  const custoParCasa = totalCTEsCasa > 0 ? custoAgrCasa / totalCTEsCasa : 0;

  const canEdit = ["director","area_manager"].includes(user.role);

  // MOB terceirizada cost excel template download
  const downloadTemplate = () => {
    const header = ["Data","Cliente","Entrada","Saída","Nome","ID","OBS"];
    const ex1 = ["06/04/2026","CLIENTE X","08:00","17:00","NOME FUNCIONARIO","TERCERIZADA 01",""];
    const ex2 = ["06/04/2026","CLIENTE Y","07:00","18:00","OUTRO FUNCIONARIO","TERCERIZADA 01",""];
    const csv = [header.join(";"), ex1.join(";"), ex2.join(";")].join("\n");
    const blob = new Blob(["\uFEFF"+csv], {type:"text/csv;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download="modelo_mob_terceirizada.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-xl font-bold text-slate-100">DRE — Demonstrativo de Resultado</h1>
          <p className="text-sm text-slate-400">Receita × Custos por quinzena</p></div>
        <div className="flex gap-2">
          <Sel value={filtMes} onChange={e=>setFiltMes(Number(e.target.value))}>
            {MONTHS.slice(1).map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
          </Sel>
          <Sel value={filtAno} onChange={e=>setFiltAno(Number(e.target.value))}>
            {[2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}
          </Sel>
          {canEdit&&<Btn onClick={()=>setShowNew(true)}><Plus size={14}/>Lançar Custo</Btn>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[["quinzena","📊 Por Quinzena"],["categorias","🗂 Por Categoria"],["agrcasa","🏠 Agregados da Casa"]].map(([v,l])=>(
          <button key={v} onClick={()=>setTab(v)}
            className={"text-xs px-3 py-1.5 rounded-full font-semibold border transition-all "+(tab===v?"bg-red-600 text-white border-red-600":"bg-slate-800 text-slate-400 border-slate-700")}>{l}</button>
        ))}
      </div>

      {/* POR QUINZENA */}
      {tab==="quinzena"&&(
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PLCard label={"1ª Quinzena — "+MONTHS[filtMes]+"/"+filtAno+" (dias 1-15)"} pl={pl1}/>
            <PLCard label={"2ª Quinzena — "+MONTHS[filtMes]+"/"+filtAno+" (dias 16-31)"} pl={pl2}/>
            <PLCard label={"Total Mês — "+MONTHS[filtMes]+"/"+filtAno} pl={plMes} highlight/>
          </div>
          {/* Lançamentos do mês */}
          <Card className="p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">📋 Lançamentos variáveis do mês</p>
            {(dreEntradas||[]).filter(e=>e.mes===filtMes&&e.ano===filtAno).length===0&&(
              <p className="text-slate-500 text-xs text-center py-4">Nenhum lançamento. Clique em "Lançar Custo" para adicionar.</p>
            )}
            <div className="space-y-2">
              {(dreEntradas||[]).filter(e=>e.mes===filtMes&&e.ano===filtAno).sort((a,b)=>a.quinz-b.quinz).map(e=>(
                <div key={e.id} className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{background:CAT_COLORS[e.categoria]||"#94a3b8"}}/>
                    <div>
                      <p className="text-sm text-slate-200 font-medium">{e.descricao}</p>
                      <p className="text-xs text-slate-500">{e.categoria} · {e.quinz===1?"1ª Quinzena":e.quinz===2?"2ª Quinzena":"Mês inteiro"} · {MONTHS[e.mes]}/{e.ano}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-red-400 font-bold">{fmt(e.valor)}</span>
                    {canEdit&&<button onClick={()=>setDreEntradas(p=>p.filter(x=>x.id!==e.id))} className="text-slate-600 hover:text-red-400"><Trash2 size={13}/></button>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* POR CATEGORIA */}
      {tab==="categorias"&&(
        <div className="space-y-3">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-300">
            💡 Custos fixos são divididos em 2 para cada quinzena. Lançamentos com quinzena específica aplicam somente nela.
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-700 text-slate-400 text-xs">
                {["Categoria","1ª Quinzena","2ª Quinzena","Total Mês","% da Receita"].map(h=>(
                  <th key={h} className={"py-2 px-3 font-semibold "+(h==="Categoria"?"text-left":"text-right")}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {/* Receita row */}
                <tr className="border-b border-slate-700 bg-emerald-500/5">
                  <td className="py-3 px-3 font-bold text-emerald-400">✦ Comissão Jadlog</td>
                  <td className="py-3 px-3 text-right text-emerald-400 font-bold">{fmt(pl1.receita)}</td>
                  <td className="py-3 px-3 text-right text-emerald-400 font-bold">{fmt(pl2.receita)}</td>
                  <td className="py-3 px-3 text-right text-emerald-400 font-bold text-base">{fmt(plMes.receita)}</td>
                  <td className="py-3 px-3 text-right text-emerald-400">100%</td>
                </tr>
                {/* Cost rows */}
                {COST_CATS.map(cat => {
                  const v1 = pl1.categorias[cat]||0;
                  const v2 = pl2.categorias[cat]||0;
                  const vM = v1+v2;
                  if (vM===0) return null;
                  const pct = plMes.receita>0?(vM/plMes.receita*100):0;
                  return (
                    <tr key={cat} className="border-b border-slate-800 hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 text-slate-300 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{background:CAT_COLORS[cat]||"#94a3b8"}}/>
                        {cat}
                      </td>
                      <td className="py-2.5 px-3 text-right text-red-400">{v1>0?fmt(v1):"—"}</td>
                      <td className="py-2.5 px-3 text-right text-red-400">{v2>0?fmt(v2):"—"}</td>
                      <td className="py-2.5 px-3 text-right text-red-400 font-semibold">{fmt(vM)}</td>
                      <td className="py-2.5 px-3 text-right text-slate-400">{pct.toFixed(1)}%</td>
                    </tr>
                  );
                })}
                {/* Total */}
                <tr className="bg-slate-700/30 border-t-2 border-slate-600">
                  <td className="py-3 px-3 font-bold text-slate-200">Total Custos</td>
                  <td className="py-3 px-3 text-right text-red-400 font-bold">{fmt(pl1.totalCustos)}</td>
                  <td className="py-3 px-3 text-right text-red-400 font-bold">{fmt(pl2.totalCustos)}</td>
                  <td className="py-3 px-3 text-right text-red-400 font-bold text-base">{fmt(plMes.totalCustos)}</td>
                  <td className="py-3 px-3 text-right text-red-400">{plMes.receita>0?(plMes.totalCustos/plMes.receita*100).toFixed(1)+"%" :"—"}</td>
                </tr>
                {/* Resultado */}
                <tr className="bg-slate-800/50">
                  <td className="py-3 px-3 font-bold text-slate-100 text-base">★ Resultado</td>
                  <td className={"py-3 px-3 text-right font-bold text-lg "+(pl1.resultado>=0?"text-emerald-400":"text-red-400")}>{fmt(pl1.resultado)}</td>
                  <td className={"py-3 px-3 text-right font-bold text-lg "+(pl2.resultado>=0?"text-emerald-400":"text-red-400")}>{fmt(pl2.resultado)}</td>
                  <td className={"py-3 px-3 text-right font-bold text-xl "+(plMes.resultado>=0?"text-emerald-400":"text-red-400")}>{fmt(plMes.resultado)}</td>
                  <td className={"py-3 px-3 text-right font-bold "+(plMes.margem>=0?"text-emerald-400":"text-red-400")}>{plMes.margem.toFixed(1)}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AGREGADOS DA CASA */}
      {tab==="agrcasa"&&(
        <div className="space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
            <p className="text-sm font-bold text-amber-300 mb-2">🏠 Agregados da Casa — Custo por CTE</p>
            <p className="text-xs text-slate-400">São os motoristas sem cadastro que aparecem nos fechamentos. O custo deles = Salário + Frota + Gasolina lançados com essas categorias no mês.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <KpiCard compact label="Motoristas s/ Cadastro" value={String(nokMots.length)} icon={Users} color="#f59e0b"/>
            <KpiCard compact label="CTEs entregues" value={String(totalCTEsCasa)} icon={Truck} color="#60a5fa"/>
            <KpiCard compact label="Custo Total (Sal+Frota+Gas)" value={fmt(custoAgrCasa)} icon={DollarSign} color="#ef4444"/>
            <KpiCard compact label="Custo por CTE" value={custoParCasa>0?fmt(custoParCasa):"—"} icon={TrendingUp} color={custoParCasa>0?"#10b981":"#94a3b8"}/>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-300">
            💡 Para calcular o custo por CTE dos Agregados da Casa, lance os custos de <strong>Salário Agr. Casa</strong>, <strong>Frota</strong> e <strong>Gasolina</strong> no botão "Lançar Custo" acima.
          </div>
          {nokMots.length>0&&(
            <Card className="p-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Motoristas sem cadastro</p>
              <table className="w-full text-xs">
                <thead><tr className="border-b border-slate-700 text-slate-400">
                  <th className="text-left py-2 px-2">Nome/Matrícula</th>
                  <th className="text-right py-2 px-2">CTEs</th>
                  <th className="text-right py-2 px-2">Custo estimado</th>
                </tr></thead>
                <tbody>
                  {nokMots.map(m=>(
                    <tr key={m.mat} className="border-b border-slate-800">
                      <td className="py-2 px-2 text-amber-400 font-medium">{m.nome} {m.mat&&m.mat!==m.nome&&<span className="text-slate-500">(Mat. {m.mat})</span>}</td>
                      <td className="py-2 px-2 text-right text-slate-300">{m.ctes}</td>
                      <td className="py-2 px-2 text-right text-red-400">{custoParCasa>0&&m.ctes>0?fmt(custoParCasa*m.ctes):"—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      )}

      {/* Modal Lançar Custo */}
      {showNew&&(
        <DRENovaEntrada onSave={e=>{setDreEntradas(p=>[...p,{...e,id:uid()}]);setShowNew(false);}} onClose={()=>setShowNew(false)} defaultMes={filtMes} defaultAno={filtAno}/>
      )}
    </div>
  );
}

function DRENovaEntrada({ onSave, onClose, defaultMes, defaultAno }) {
  const [f, setF] = useState({ categoria:"CLT", descricao:"", valor:"", mes:defaultMes, ano:defaultAno, quinz:0 });
  const sf = (k,v) => setF(p=>({...p,[k]:v}));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e=>e.stopPropagation()}>
        <h3 className="text-base font-bold text-slate-100">Lançar Custo</h3>
        <div className="grid grid-cols-2 gap-3">
          <Sel label="Categoria" value={f.categoria} onChange={e=>sf("categoria",e.target.value)}>
            {COST_CATS.map(c=><option key={c} value={c}>{c}</option>)}
          </Sel>
          <Sel label="Quinzena" value={f.quinz} onChange={e=>sf("quinz",Number(e.target.value))}>
            <option value={0}>Mês inteiro</option>
            <option value={1}>1ª Quinzena</option>
            <option value={2}>2ª Quinzena</option>
          </Sel>
        </div>
        <Input label="Descrição" placeholder="Ex: Salário João — Motorista Casa" value={f.descricao} onChange={e=>sf("descricao",e.target.value)}/>
        <Input label="Valor (R$)" type="number" step="0.01" value={f.valor} onChange={e=>sf("valor",e.target.value)}/>
        <div className="grid grid-cols-2 gap-3">
          <Sel label="Mês" value={f.mes} onChange={e=>sf("mes",Number(e.target.value))}>
            {["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"].map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
          </Sel>
          <Input label="Ano" type="number" value={f.ano} onChange={e=>sf("ano",Number(e.target.value))}/>
        </div>
        <div className="flex gap-3 pt-1">
          <Btn className="flex-1 justify-center" disabled={!f.descricao||!f.valor}
            onClick={()=>onSave({...f,valor:Number(f.valor)})}>Salvar</Btn>
          <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
        </div>
      </div>
    </div>
  );
}

function MobView({ user, mobBases, setMobBases, mobAprovado, setMobAprovado, mobCustos, setMobCustos }) {
  const [tab, setTab]         = useState("conferencia");
  const [importing, setImporting] = useState("");
  const [importMsg, setImportMsg] = useState("");
  const [filtData, setFiltData]   = useState("");
  const [filtCliente, setFiltCliente] = useState("todos");
  const [filtTipo, setFiltTipo]   = useState("todos");
  const [horaExtra, setHoraExtra] = useState(8);
  const fileRefOp   = useRef();
  const fileRefTerc = useRef();
  const fileRefAprov = useRef();

  const downloadTemplate = () => {
    const header = ["Data","Cliente","Entrada","Saída","Nome","ID","OBS"];
    const rows = [
      ["06/04/2026","CLIENTE X","08:00","17:00","NOME DO FUNCIONARIO","TERCERIZADA 01",""],
      ["06/04/2026","CLIENTE Y","21:00","08:00","OUTRO FUNCIONARIO","TERCERIZADA 01","turno noturno"],
    ];
    const csv = [header.join(";"), ...rows.map(r=>r.join(";"))].join("\n");
    const blob = new Blob(["\uFEFF"+csv], {type:"text/csv;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download="modelo_ponto_terceirizada.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  // Custos da terceirizada: {id, empresa, mes, ano, valorTotal, descricao}
  const [showCusto, setShowCusto] = useState(false);
  const [custForm, setCustForm] = useState({empresa:"TERCERIZADA 01",mes:new Date().getMonth()+1,ano:new Date().getFullYear(),valorTotal:"",descricao:""});

  const parseTime = v => {
    if (!v) return null;
    const s = String(v);
    const m = s.match(/(\d+):(\d+)/);
    if (!m) return null;
    return parseInt(m[1]) + parseInt(m[2]) / 60;
  };

  const importBase = async (file, tipo) => {
    setImporting(tipo); setImportMsg("");
    try {
      const buf = await file.arrayBuffer();
      const { read, utils } = window.XLSX;
      const wb = read(buf);
      const shName = wb.SheetNames.includes("DADOS_LANCADOS") ? "DADOS_LANCADOS" : wb.SheetNames[0];
      const raw = utils.sheet_to_json(wb.Sheets[shName], { header:1, defval:"", raw:false });
      const hdr = (raw[0]||[]).map(h => String(h||"").toLowerCase());
      const gi = name => hdr.findIndex(h => h.includes(name));
      const iD=gi("data"), iC=gi("cliente"), iE=gi("entrada"), iS=gi("saida"), iN=gi("nome"), iI=gi("id");
      const rows = [];
      for (let i=1; i<raw.length; i++) {
        const r = raw[i];
        const data   = String(r[iD]||"").slice(0,10);
        const cliente= String(r[iC]||"").trim().toUpperCase();
        const nome   = String(r[iN]||"").trim().toUpperCase();
        const idTipo = String(r[iI]||"").trim();
        const entStr = String(r[iE]||"");
        const saiStr = String(r[iS]||"");
        const entrada= parseTime(entStr);
        const saida  = parseTime(saiStr);
        if (!data || !nome) continue;
        let horas = null;
        if (entrada!==null && saida!==null) horas = saida>=entrada ? saida-entrada : 24-entrada+saida;
        rows.push({ id:uid(), data, cliente, nome, idTipo, entrada:entStr, saida:saiStr, horas });
      }
      setMobBases(p => [...p.filter(b=>b.tipo!==tipo), { id:uid(), tipo, arquivo:file.name, importadoEm:now(), rows }]);
      setImportMsg("✅ " + tipo + ": " + rows.length + " lançamentos");
    } catch(e) { setImportMsg("❌ " + String(e.message||e)); }
    setImporting("");
    if(fileRefOp.current) fileRefOp.current.value="";
    if(fileRefTerc.current) fileRefTerc.current.value="";
  };

  const importAprovado = async file => {
    setImporting("aprovado");
    try {
      const buf = await file.arrayBuffer();
      const { read, utils } = window.XLSX;
      const wb = read(buf);
      const shName = wb.SheetNames.includes("APROVADO") ? "APROVADO" : wb.SheetNames[0];
      const raw = utils.sheet_to_json(wb.Sheets[shName], { header:1, defval:"" });
      const rows = [];
      for (let i=1; i<raw.length; i++) {
        const r = raw[i];
        const cliente = String(r[0]||"").trim().toUpperCase();
        if (!cliente) continue;
        rows.push({ cliente, terc1:Number(r[1])||0, terc2:Number(r[2])||0, clt:Number(r[3])||0,
          total:(Number(r[1])||0)+(Number(r[2])||0)+(Number(r[3])||0) || Number(r[4])||0 });
      }
      setMobAprovado(rows);
      setImportMsg("✅ Aprovado: " + rows.length + " clientes");
    } catch(e) { setImportMsg("❌ " + String(e.message||e)); }
    setImporting("");
    if(fileRefAprov.current) fileRefAprov.current.value="";
  };

  // Flatten all rows — use useMemo to keep stable reference
  const allRows = useMemo(() =>
    (mobBases||[]).flatMap(b => (b.rows||[]).map(r => ({ ...r, baseTipo: String(b.tipo||"") }))),
    [mobBases]
  );

  const clientes = useMemo(() => [...new Set(allRows.map(r=>r.cliente))].filter(Boolean).sort(), [allRows]);
  const dates    = useMemo(() => [...new Set(allRows.map(r=>r.data))].filter(Boolean).sort(), [allRows]);

  const filtered = useMemo(() => allRows.filter(r => {
    if (filtData && r.data !== filtData) return false;
    if (filtCliente !== "todos" && r.cliente !== filtCliente) return false;
    if (filtTipo !== "todos" && r.baseTipo !== filtTipo) return false;
    return true;
  }), [allRows, filtData, filtCliente, filtTipo]);

  // Group by date+cliente for conference view
  const confRows = useMemo(() => {
    const map = {};
    allRows.forEach(r => {
      const k = r.data + "||" + r.cliente;
      if (!map[k]) map[k] = { data:r.data, cliente:r.cliente, pessoas:[] };
      map[k].pessoas.push(r);
    });
    return Object.values(map).sort((a,b)=>a.data.localeCompare(b.data)||a.cliente.localeCompare(b.cliente));
  }, [allRows]);

  // Overtime rows
  const overtimeRows = useMemo(() => {
    const map = {};
    allRows.forEach(r => {
      if (r.horas===null) return;
      const k = r.data + "||" + r.nome;
      if (!map[k]) map[k] = { data:r.data, nome:r.nome, cliente:r.cliente, baseTipo:r.baseTipo, idTipo:r.idTipo, totalH:0, entrada:r.entrada, saida:r.saida };
      map[k].totalH += r.horas;
    });
    return Object.values(map).map(row => ({ ...row, extra: Math.max(0, row.totalH-horaExtra), isExtra: row.totalH>horaExtra }))
      .sort((a,b)=>a.data.localeCompare(b.data));
  }, [allRows, horaExtra]);

  // Divergências between op and terc
  const discrepancias = useMemo(() => {
    const baseOp   = (mobBases||[]).find(b=>b.tipo==="operador");
    const baseTerc = (mobBases||[]).find(b=>b.tipo==="terceirizada");
    if (!baseOp || !baseTerc) return [];
    const opMap={}, tercMap={};
    (baseOp.rows||[]).forEach(r   => { opMap[r.data+"||"+r.cliente+"||"+r.nome]=r; });
    (baseTerc.rows||[]).forEach(r => { tercMap[r.data+"||"+r.cliente+"||"+r.nome]=r; });
    const disc = [];
    Object.keys(opMap).forEach(k => {
      if (!tercMap[k]) disc.push({ key:k, nome:opMap[k].nome, cliente:opMap[k].cliente, data:opMap[k].data, tipo:"só_op" });
      else if (opMap[k].horas!==null && tercMap[k].horas!==null && Math.abs(opMap[k].horas-tercMap[k].horas)>0.5)
        disc.push({ key:k, nome:opMap[k].nome, cliente:opMap[k].cliente, data:opMap[k].data, tipo:"horas_div",
          hOp: opMap[k].horas.toFixed(1), hT: tercMap[k].horas.toFixed(1) });
    });
    Object.keys(tercMap).forEach(k => {
      if (!opMap[k]) disc.push({ key:k, nome:tercMap[k].nome, cliente:tercMap[k].cliente, data:tercMap[k].data, tipo:"só_terc" });
    });
    return disc.sort((a,b)=>a.data.localeCompare(b.data));
  }, [mobBases]);

  const baseOp   = (mobBases||[]).find(b=>b.tipo==="operador");
  const baseTerc = (mobBases||[]).find(b=>b.tipo==="terceirizada");
  const extraTotal = overtimeRows.filter(r=>r.isExtra).length;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Mão de Obra — Conferência</h1>
          <p className="text-sm text-slate-400">{allRows.length} lançamentos · {baseOp?"✅ Minha base":"⚠ Minha base"} · {baseTerc?"✅ Terceirizada":"⚠ Terceirizada"}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Btn size="sm" variant="secondary" onClick={downloadTemplate}>
            <Download size={13}/>Modelo p/ Terceirizada
          </Btn>
          <Btn size="sm" variant="secondary" onClick={()=>setShowCusto(true)}>
            <DollarSign size={13}/>Lançar Custo Terc.
          </Btn>
          <Btn size="sm" variant="secondary" onClick={()=>fileRefAprov.current?.click()} disabled={!!importing}>
            <Upload size={13}/>{importing==="aprovado"?"...":"Importar Aprovado"}
          </Btn>
          <Btn size="sm" onClick={()=>fileRefOp.current?.click()} disabled={!!importing}>
            <Upload size={13}/>{importing==="operador"?"...":"Minha Base"}
          </Btn>
          <Btn size="sm" variant="secondary" onClick={()=>fileRefTerc.current?.click()} disabled={!!importing}>
            <Upload size={13}/>{importing==="terceirizada"?"...":"Base Terceirizada"}
          </Btn>
          <input ref={fileRefOp}    type="file" accept=".xlsx,.xls" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)importBase(f,"operador");}}/>
          <input ref={fileRefTerc}  type="file" accept=".xlsx,.xls" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)importBase(f,"terceirizada");}}/>
          <input ref={fileRefAprov} type="file" accept=".xlsx,.xls" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)importAprovado(f);}}/>
        </div>
      </div>
      {importMsg&&<div className={"text-xs px-3 py-2 rounded-lg border "+(importMsg.startsWith("✅")?"bg-emerald-500/10 border-emerald-500/30 text-emerald-300":"bg-red-500/10 border-red-500/30 text-red-300")+""}>{importMsg}</div>}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard compact label="Lançamentos" value={String(allRows.length)} icon={Users} color="#60a5fa"/>
        <KpiCard compact label="Hora Extra" value={extraTotal + " pessoa(s)"} icon={Clock} color="#f59e0b"/>
        <KpiCard compact label="Divergências" value={String(discrepancias.length)} icon={AlertCircle} color={discrepancias.length>0?"#ef4444":"#10b981"}/>
        <KpiCard compact label="Clientes" value={String(clientes.length)} icon={Building2} color="#8b5cf6"/>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap items-center">
        <select value={filtData} onChange={e=>setFiltData(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none">
          <option value="">Todas as datas</option>
          {dates.map(d=><option key={d} value={d}>{d}</option>)}
        </select>
        <select value={filtCliente} onChange={e=>setFiltCliente(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none">
          <option value="todos">Todos os Clientes</option>
          {clientes.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filtTipo} onChange={e=>setFiltTipo(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none">
          <option value="todos">Ambas as Bases</option>
          <option value="operador">Minha Base</option>
          <option value="terceirizada">Terceirizada</option>
        </select>
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5">
          <span className="text-xs text-slate-400">HE após</span>
          <input type="number" min="4" max="12" step="0.5" value={horaExtra}
            onChange={e=>setHoraExtra(Number(e.target.value)||8)}
            className="w-10 bg-transparent text-xs text-amber-400 font-bold text-center focus:outline-none"/>
          <span className="text-xs text-slate-400">h/dia</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[["conferencia","🔍 Conferência"],["divergencias","⚠ Divergências"],["horaextra","⏰ Hora Extra"],["aprovado","📋 Aprovado × Real"],["lancamentos","📄 Lançamentos"]].map(([v,l])=>(
          <button key={v} onClick={()=>setTab(v)}
            className={"text-xs px-3 py-1.5 rounded-full font-semibold border transition-all "+(tab===v?"bg-red-600 text-white border-red-600":"bg-slate-800 text-slate-400 border-slate-700")}>
            {l}{v==="divergencias"&&discrepancias.length>0?" ("+discrepancias.length+")":""}{v==="horaextra"&&extraTotal>0?" ("+extraTotal+")":""}
          </button>
        ))}
      </div>

      {/* CONFERÊNCIA */}
      {tab==="conferencia"&&(
        <div className="space-y-2">
          {allRows.length===0&&<p className="text-slate-500 text-sm text-center py-10">Importe "Minha Base" para começar.</p>}
          {confRows.filter(r=>{
            if (filtData && r.data!==filtData) return false;
            if (filtCliente!=="todos" && r.cliente!==filtCliente) return false;
            return true;
          }).map(row=>{
            const opP   = row.pessoas.filter(p=>p.baseTipo==="operador");
            const tercP = row.pessoas.filter(p=>p.baseTipo==="terceirizada");
            const aprov = (mobAprovado||[]).find(a=>a.cliente===row.cliente);
            const real  = new Set(row.pessoas.map(p=>p.nome)).size;
            const apQtd = aprov ? Number(aprov.total)||0 : null;
            const diff  = apQtd!==null ? real-apQtd : null;
            return (
              <Card key={row.data+"_"+row.cliente} className="p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-100 text-sm">{row.cliente}</p>
                      <span className="text-xs text-slate-500">{row.data}</span>
                      {diff!==null&&<span className={"text-xs font-bold px-2 py-0.5 rounded "+(diff===0?"bg-emerald-500/20 text-emerald-400":diff>0?"bg-blue-500/20 text-blue-400":"bg-red-500/20 text-red-400")}>
                        {diff===0?"✓ OK":diff>0?"+"+diff+" acima":diff+" faltou"}
                      </span>}
                    </div>
                    <div className="flex gap-6 mt-2 text-xs flex-wrap">
                      {opP.length>0&&<div>
                        <p className="text-slate-400 mb-1">Minha base ({opP.length})</p>
                        {opP.map(p=>{
                          const he = p.horas!==null && p.horas>horaExtra;
                          return <p key={p.id} className={he?"text-amber-400 font-semibold":"text-slate-300"}>· {p.nome}{p.horas!==null?" ("+p.horas.toFixed(1)+"h"+(he?" ⚡":"")+")":" (sem horário)"}</p>;
                        })}
                      </div>}
                      {tercP.length>0&&<div>
                        <p className="text-blue-400 mb-1">Terceirizada ({tercP.length})</p>
                        {tercP.map(p=>{
                          const he = p.horas!==null && p.horas>horaExtra;
                          return <p key={p.id} className={he?"text-amber-400 font-semibold":"text-slate-300"}>· {p.nome}{p.horas!==null?" ("+p.horas.toFixed(1)+"h"+(he?" ⚡":"")+")":" (sem horário)"}</p>;
                        })}
                      </div>}
                    </div>
                  </div>
                  <div className="text-right text-xs flex-shrink-0">
                    {apQtd!==null&&<p className="text-slate-400">Aprovado: <span className="text-slate-200 font-bold">{apQtd}</span></p>}
                    <p className="text-slate-400">Real: <span className="text-slate-200 font-bold">{real}</span></p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* DIVERGÊNCIAS */}
      {tab==="divergencias"&&(
        <div className="space-y-2">
          {!baseOp&&!baseTerc&&<div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-sm text-amber-300">Importe minha base e a da terceirizada para comparar.</div>}
          {baseOp&&baseTerc&&discrepancias.length===0&&<p className="text-emerald-400 text-sm text-center py-8">✅ Nenhuma divergência encontrada!</p>}
          {discrepancias.map(d=>(
            <Card key={d.key} className={"p-4 border-l-4 "+(d.tipo==="só_op"?"border-blue-500":d.tipo==="só_terc"?"border-orange-500":"border-amber-500")}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-100">{d.nome}</p>
                  <p className="text-xs text-slate-400">{d.cliente} · {d.data}</p>
                  <p className="text-xs text-amber-400 mt-0.5">
                    {d.tipo==="só_op"?"Só na minha base":d.tipo==="só_terc"?"Só na base terceirizada":"Horas divergem: minha="+d.hOp+"h · terc="+d.hT+"h"}
                  </p>
                </div>
                <span className={"text-xs font-bold px-2 py-1 rounded "+(d.tipo==="só_op"?"bg-blue-500/20 text-blue-400":d.tipo==="só_terc"?"bg-orange-500/20 text-orange-400":"bg-amber-500/20 text-amber-400")}>
                  {d.tipo==="só_op"?"Só Minha":d.tipo==="só_terc"?"Só Terc.":"Horas ≠"}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* HORA EXTRA */}
      {tab==="horaextra"&&(
        <div className="space-y-3">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-300">
            ⚡ Hora extra = acima de {horaExtra}h/dia. Ajuste o limite no filtro acima.
          </div>
          {overtimeRows.filter(r=>r.isExtra&&(!filtData||r.data===filtData)&&(filtCliente==="todos"||r.cliente===filtCliente)).length===0&&(
            <p className="text-emerald-400 text-sm text-center py-6">Nenhuma hora extra encontrada.</p>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-slate-700 text-slate-400">
                {["Data","Nome","Cliente","Base","Entrada→Saída","Total","Extra","Tipo"].map(h=>(
                  <th key={h} className={"py-2 px-2 font-semibold "+(["Nome","Cliente"].includes(h)?"text-left":"text-right")}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {overtimeRows.filter(r=>r.isExtra&&(!filtData||r.data===filtData)&&(filtCliente==="todos"||r.cliente===filtCliente)).map((r,i)=>(
                  <tr key={r.data+"_"+r.nome+"_"+i} className="border-b border-slate-800 bg-amber-500/5">
                    <td className="py-2 px-2 text-slate-400">{r.data}</td>
                    <td className="py-2 px-2 font-semibold text-amber-400">{r.nome}</td>
                    <td className="py-2 px-2 text-slate-300">{r.cliente}</td>
                    <td className="py-2 px-2 text-right text-slate-400">{r.baseTipo==="operador"?"Minha":"Terc."}</td>
                    <td className="py-2 px-2 text-right text-slate-400">{r.entrada||"—"} → {r.saida||"—"}</td>
                    <td className="py-2 px-2 text-right text-slate-200 font-bold">{r.totalH.toFixed(1)}h</td>
                    <td className="py-2 px-2 text-right text-amber-400 font-bold">+{r.extra.toFixed(1)}h</td>
                    <td className="py-2 px-2 text-right text-slate-400 text-xs">{r.idTipo||"—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* APROVADO vs REALIZADO */}
      {tab==="aprovado"&&(
        <div className="space-y-3">
          {(mobAprovado||[]).length===0&&<div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm text-blue-300">Importe a planilha com aba "APROVADO" clicando em "Importar Aprovado".</div>}
          {(mobAprovado||[]).map(ap=>{
            const pessoasReal = allRows.filter(r=>r.cliente===ap.cliente&&(!filtData||r.data===filtData));
            const realTotal   = new Set(pessoasReal.map(r=>r.nome)).size;
            const diff = realTotal - (Number(ap.total)||0);
            return (
              <Card key={ap.cliente} className="p-4 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-semibold text-slate-100">{ap.cliente}</p>
                  <p className="text-xs text-slate-500">CLT: {Number(ap.clt)||0} · Terc.1: {Number(ap.terc1)||0} · Terc.2: {Number(ap.terc2)||0}</p>
                </div>
                <div className="flex items-center gap-5 text-sm">
                  <div className="text-center"><p className="text-xs text-slate-400">Aprovado</p><p className="font-bold text-slate-200">{Number(ap.total)||0}</p></div>
                  <div className="text-center"><p className="text-xs text-slate-400">Realizado</p><p className={"font-bold "+(diff===0?"text-emerald-400":diff>0?"text-blue-400":"text-red-400")}>{realTotal}</p></div>
                  <span className={"text-xs font-bold px-3 py-1.5 rounded-lg "+(diff===0?"bg-emerald-500/20 text-emerald-400":diff>0?"bg-blue-500/20 text-blue-400":"bg-red-500/20 text-red-400")}>
                    {diff===0?"✓ OK":diff>0?"+"+diff+" acima":diff+" faltou"}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* LANÇAMENTOS */}
      {tab==="lancamentos"&&(
        <div className="space-y-2">
          <p className="text-xs text-slate-400">{filtered.length} registros</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-slate-700 text-slate-400">
                {["Data","Nome","Cliente","Tipo","Entrada","Saída","Horas","Base"].map(h=>(
                  <th key={h} className={"py-2 px-2 font-semibold "+(["Nome","Cliente"].includes(h)?"text-left":"text-right")}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filtered.slice(0,300).map(r=>{
                  const he = r.horas!==null && r.horas>horaExtra;
                  return (
                    <tr key={r.id} className={"border-b border-slate-800 hover:bg-slate-800/40 "+(he?"bg-amber-500/5":"")}>
                      <td className="py-1.5 px-2 text-slate-400">{r.data}</td>
                      <td className="py-1.5 px-2 font-semibold text-slate-200">{r.nome}{he?" ⚡":""}</td>
                      <td className="py-1.5 px-2 text-slate-300">{r.cliente}</td>
                      <td className="py-1.5 px-2 text-right text-slate-400">{r.idTipo}</td>
                      <td className="py-1.5 px-2 text-right text-slate-400">{r.entrada||"—"}</td>
                      <td className="py-1.5 px-2 text-right text-slate-400">{r.saida||"—"}</td>
                      <td className={"py-1.5 px-2 text-right font-semibold "+(he?"text-amber-400":"text-slate-300")}>{r.horas!==null?r.horas.toFixed(1)+"h":"—"}</td>
                      <td className="py-1.5 px-2 text-right">
                        <span className={"px-1.5 py-0.5 rounded text-xs "+(r.baseTipo==="operador"?"bg-blue-500/20 text-blue-400":"bg-orange-500/20 text-orange-400")}>
                          {r.baseTipo==="operador"?"Minha":"Terc."}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length>300&&<p className="text-xs text-slate-500 text-center py-2">Exibindo 300 de {filtered.length}</p>}
          </div>
        </div>
      )}

      {/* CUSTOS TERCEIRIZADA modal */}
      {showCusto&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={()=>setShowCusto(false)}>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e=>e.stopPropagation()}>
            <h3 className="text-base font-bold text-slate-100">Lançar Custo Terceirizada</h3>
            <Input label="Empresa" value={custForm.empresa} onChange={e=>setCustForm(p=>({...p,empresa:e.target.value}))}/>
            <Input label="Valor Total (R$)" type="number" step="0.01" value={custForm.valorTotal} onChange={e=>setCustForm(p=>({...p,valorTotal:e.target.value}))}/>
            <Input label="Descrição" placeholder="Ex: Fatura IS — Abril" value={custForm.descricao} onChange={e=>setCustForm(p=>({...p,descricao:e.target.value}))}/>
            <div className="grid grid-cols-2 gap-3">
              <Sel label="Mês" value={custForm.mes} onChange={e=>setCustForm(p=>({...p,mes:Number(e.target.value)}))}>
                {["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"].map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
              </Sel>
              <Input label="Ano" type="number" value={custForm.ano} onChange={e=>setCustForm(p=>({...p,ano:Number(e.target.value)}))}/>
            </div>
            {/* Show base from MOB for comparison */}
            {baseTerc&&(
              <div className="bg-slate-900 rounded-lg p-3 text-xs text-slate-400 border border-slate-700">
                <p className="font-semibold text-slate-300 mb-1">Base importada: {baseTerc.arquivo}</p>
                <p>{baseTerc.rows?.length||0} lançamentos · {new Set(baseTerc.rows?.map(r=>r.nome)||[]).size} pessoas</p>
              </div>
            )}
            <div className="flex gap-3 pt-1">
              <Btn className="flex-1 justify-center" disabled={!custForm.empresa||!custForm.valorTotal}
                onClick={()=>{
                  setMobCustos(p=>[...p,{...custForm,id:uid(),valor:Number(custForm.valorTotal),categoria:"Terceirizado"}]);
                  setShowCusto(false);
                  setCustForm(p=>({...p,valorTotal:"",descricao:""}));
                }}>Salvar</Btn>
              <Btn variant="secondary" onClick={()=>setShowCusto(false)}>Cancelar</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OpsControl() {
  const [portalMode, setPortalMode] = useState(null);
  const [showPortalEntry, setShowPortalEntry] = useState(false);

  const enterPortal = (motId) => {
    setShowPortalEntry(false);
    setPortalMode(motId);
  };

  const sairPortal = () => {
    setPortalMode(null);
    setShowPortalEntry(false);
  };

  useEffect(()=>{
    if(!window.XLSX){
      const s=document.createElement("script");
      s.src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
      s.async=true;
      document.head.appendChild(s);
    }
    if(!localStorage.getItem("ops3_init_v4")){
      Object.entries(SEED).forEach(([k,v])=>localStorage.setItem("ops3_"+(k)+"",JSON.stringify(v)));
      localStorage.setItem("ops3_init","1");
      localStorage.setItem("ops3_init_v4","1");
    }
    if(!localStorage.getItem("ops3_forecastEntries")) localStorage.setItem("ops3_forecastEntries", JSON.stringify(SEED.forecastEntries));
    if(!localStorage.getItem("ops3_motoristas")) localStorage.setItem("ops3_motoristas", JSON.stringify(SEED.motoristas));
    if(!localStorage.getItem("ops3_fechamentos")) localStorage.setItem("ops3_fechamentos", JSON.stringify(SEED.fechamentos));
    try {
      const raw = localStorage.getItem("ops3_fechamentos");
      if(raw) {
        const arr = JSON.parse(raw);
        // Wipe any fechamento that uses old field names (calculados/historico)
        // or is missing required new fields (mots/hist)
        const needsFix = arr.some(f =>
          !Array.isArray(f.mots) ||
          !Array.isArray(f.hist) ||
          f.calculados !== undefined ||
          f.historico !== undefined ||
          (f.mots||[]).some(m => m.vDiaria === undefined || m.subtotal === undefined)
        );
        if(needsFix) {
          console.log('[migrate] Clearing stale fechamentos from localStorage');
          localStorage.setItem("ops3_fechamentos", JSON.stringify([]));
        }
      }
    } catch(e) { localStorage.setItem("ops3_fechamentos", JSON.stringify([])); }
    // Migrate users: add fechamentoAccess if missing
    try {
      const raw = localStorage.getItem("ops3_users");
      if (raw) {
        const arr = JSON.parse(raw);
        if (arr.some(u => u.fechamentoAccess === undefined)) {
          const migrated = arr.map(u => ({
            ...u,
            fechamentoAccess: u.fechamentoAccess ?? (u.role === "director" || u.role === "area_manager")
          }));
          localStorage.setItem("ops3_users", JSON.stringify(migrated));
        }
      }
    } catch(e) {}
    try {
      const raw = localStorage.getItem("ops3_motoristas");
      if(raw) {
        const arr = JSON.parse(raw);
        if(arr.some(m => !m.codigoAcesso)) {
          const migrated = arr.map(m => {
            if(m.codigoAcesso) return m;
            const match = SEED.motoristas.find(s=>s.matricula===m.matricula);
            if(match) return {...m, codigoAcesso: match.codigoAcesso};
            const init = m.nome.trim().split(" ").slice(0,3).map(w=>w[0]?.toUpperCase()||"X").join("").padEnd(3,"X");
            return {...m, codigoAcesso:"AGR-"+(init)+"-"+(m.matricula.slice(-4))+""};
          });
          localStorage.setItem("ops3_motoristas", JSON.stringify(migrated));
        }
      }
    } catch(e) {}
  },[]);

  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState("dashboard");
  const [openTaskId, setOpenTaskId] = useState(null);

  const [areas, setAreas] = useLS("areas", SEED.areas);
  const [users, setUsers]         = useLS("users",         SEED.users);
  const [clients, setClients]     = useLS("clients",       SEED.clients);
  const [templates, setTemplates] = useLS("taskTemplates", SEED.taskTemplates);
  const [tasks, setTasks]         = useLS("tasks",         SEED.tasks);
  const [fixedCosts, setFixedCosts]   = useLS("fixedCosts",   SEED.fixedCosts);
  const [costEntries, setCostEntries] = useLS("costEntries",  SEED.costEntries);
  const [revenues, setRevenues]       = useLS("revenueEntries", SEED.revenueEntries);
  const [forecastEntries, setForecastEntries] = useLS("forecastEntries", SEED.forecastEntries);
  const [motoristas, setMotoristas] = useLS("motoristas", SEED.motoristas);
  const [fechamentos, setFechamentos] = useLS("fechamentos", SEED.fechamentos);
  const [unidades, setUnidades] = useLS("unidades", SEED.unidades);
  const [faturamentosJadlog, setFaturamentosJadlog] = useLS("faturamentosJadlog", SEED.faturamentosJadlog);
  const [acrescimos, setAcrescimos] = useLS("acrescimos", []);
  const [tickets, setTickets] = useLS("tickets", []);
  const [mobAprovado, setMobAprovado] = useLS("mobAprovado", []);
  const [mobCustos, setMobCustos] = useLS("mobCustos", []);       // custos por terceirizada
  const [dreEntradas, setDreEntradas] = useLS("dreEntradas", []); // lançamentos por quinzena

  const navigateToTask = id => { setOpenTaskId(id); setView("tasks"); };

  // ── SLA auto-action engine ────────────────────────────
  useEffect(() => {
    const calcWorkDays = (startIso) => {
      if (!startIso) return 0;
      const start = new Date(startIso);
      const now_  = new Date();

      // Feriados nacionais fixos (dd/mm)
      const FERIADOS_FIXOS = new Set([
        "01/01","21/04","01/05","07/09","12/10","02/11","15/11","25/12"
      ]);
      const isFeriado = (d) => {
        const dd = String(d.getDate()).padStart(2,"0");
        const mm = String(d.getMonth()+1).padStart(2,"0");
        return FERIADOS_FIXOS.has(""+(dd)+"/"+(mm)+"");
      };

      // Start counting from the NEXT day after startedAt
      const cur = new Date(start);
      cur.setDate(cur.getDate() + 1);
      cur.setHours(0, 0, 0, 0);

      let days = 0;
      const end = new Date(now_);
      end.setHours(0, 0, 0, 0);

      while (cur <= end) {
        const dow = cur.getDay();
        if (dow !== 0 && dow !== 6 && !isFeriado(cur)) days++;
        cur.setDate(cur.getDate() + 1);
      }
      return days;
    };

    const checkSLA = () => {
      setTasks(prev => {
        let changed = false;
        const next = prev.map(task => {
          if (task.status === "completed" || task.status === "rejected" || task.status === "cancelled") return task;
          const tpl = templates.find(t => t.id === task.templateId);
          if (!tpl) return task;
          const stepIdx = task.currentStepIndex;
          const step = tpl.steps[stepIdx];
          if (!step?.slaDays || !step?.slaAcao || step.slaAcao === "nenhuma") return task;

          const ss = task.stepStatuses[stepIdx];
          if (!ss?.startedAt || ss.status !== "pending") return task;

          const diasPassados = calcWorkDays(ss.startedAt);
          const slaLimite = Number(step.slaDays);
          if (diasPassados < slaLimite) return task;

          // SLA breached — apply action
          const obs = "SLA de "+(slaLimite)+" dia(s) útil(eis) ultrapassado ("+(diasPassados)+"d). Ação automática: "+(step.slaAcao)+".";

          if (step.slaAcao === "auto_aprovar") {
            // Auto advance
            changed = true;
            const statuses = task.stepStatuses.map((s, i) =>
              i === stepIdx ? { ...s, status: "completed", actorId: "sistema", actedAt: now(), comment: obs } : s
            );
            const next_ = stepIdx + 1;
            let newStatus, newIdx;
            if (next_ >= tpl.steps.length) {
              newStatus = "completed"; newIdx = next_;
            } else {
              const ns = tpl.steps[next_];
              newStatus = ns.requiresApproval ? "awaiting_approval" : "in_progress";
              newIdx = next_;
              statuses[next_] = { ...statuses[next_], startedAt: now() };
            }
            return { ...task, status: newStatus, currentStepIndex: newIdx, stepStatuses: statuses,
              comments: [...(task.comments||[]), { id: uid(), userId: "sistema", userName: "Sistema", text: obs, createdAt: now() }]
            };
          }

          if ((step.slaAcao === "escalar_gestor" || step.slaAcao === "escalar_diretor") && !ss.slaEscalado) {
            // Mark as escalated (visual only — no auto-advance)
            changed = true;
            const statuses = task.stepStatuses.map((s, i) =>
              i === stepIdx ? { ...s, slaEscalado: true, slaEscaladoEm: now(), slaAcaoTipo: step.slaAcao } : s
            );
            return { ...task, stepStatuses: statuses,
              comments: [...(task.comments||[]), { id: uid(), userId: "sistema", userName: "Sistema", text: obs, createdAt: now() }]
            };
          }

          // "notificar" — just mark overdue for visual
          if (step.slaAcao === "notificar" && !ss.slaOverdue) {
            changed = true;
            const statuses = task.stepStatuses.map((s, i) =>
              i === stepIdx ? { ...s, slaOverdue: true } : s
            );
            return { ...task, stepStatuses: statuses };
          }

          return task;
        });
        return changed ? next : prev;
      });
    };

    checkSLA(); // run immediately on mount
    const iv = setInterval(checkSLA, 60_000); // re-check every minute
    return () => clearInterval(iv);
  }, [templates]); // re-register when templates change

  if (portalMode) return (
    <PortalAgregadoPage
      motMatricula={portalMode}
      motoristas={motoristas}
      fechamentos={fechamentos}
      setFechamentos={setFechamentos}
      tickets={tickets}
      setTickets={setTickets}
      onSair={sairPortal}
    />
  );

  if (showPortalEntry) return (
    <div style={{fontFamily:"'IBM Plex Sans',sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap'); *{box-sizing:border-box;}`}</style>
      <PortalAcesso
        fechamentos={fechamentos}
        motoristas={motoristas}
        onEnterPortal={enterPortal}
        onSair={() => setShowPortalEntry(false)}
      />
    </div>
  );

  if(!currentUser) return (
    <div style={{fontFamily:"'IBM Plex Sans',sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap'); *{box-sizing:border-box;}`}</style>
      <LoginScreen users={users} onLogin={u=>{setCurrentUser(u);setView("dashboard");}}>
        <button onClick={() => setShowPortalEntry(true)} className="mt-3 w-full text-xs text-blue-400 hover:text-blue-300 border border-blue-500/20 rounded-lg py-2 px-4 hover:bg-blue-500/5 transition-all">
          <Truck size={12} className="inline mr-1.5" />Sou agregado — acessar portal de fechamento
        </button>
      </LoginScreen>
    </div>
  );

  const liveUser = users.find(u=>u.id===currentUser.id)||currentUser;
  const hasF = userHasFinancial(liveUser);

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden" style={{fontFamily:"'IBM Plex Sans',sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap'); *{box-sizing:border-box;}`}</style>
      <Sidebar user={liveUser} view={view} setView={setView} onLogout={()=>{setCurrentUser(null);setView("dashboard");}} areas={areas} setUsers={setUsers} users={users} tasks={tasks}/>
      <main className="flex-1 overflow-y-auto">
        {view==="dashboard"&&<DashboardView user={liveUser} tasks={tasks} fixedCosts={fixedCosts} costEntries={costEntries} revenues={revenues} clients={clients} templates={templates} areas={areas} setView={setView} onOpenTask={navigateToTask}/>}
        {view==="tasks"&&<TasksView user={liveUser} tasks={tasks} setTasks={setTasks} templates={templates} setTemplates={setTemplates} clients={clients} areas={areas} users={users} initialOpenId={openTaskId} onClearOpenId={()=>setOpenTaskId(null)}/>}
        {view==="costs"&&hasF&&<CostsView user={liveUser} fixedCosts={fixedCosts} setFixedCosts={setFixedCosts} costEntries={costEntries} setCostEntries={setCostEntries} clients={clients}/>}
        {view==="revenue"&&hasF&&<RevenueView user={liveUser} acrescimos={acrescimos} setAcrescimos={setAcrescimos} clients={clients} faturamentosJadlog={faturamentosJadlog}/>}
        {view==="profitability"&&hasF&&<ProfitabilityView clients={clients} fixedCosts={fixedCosts} costEntries={costEntries} revenues={revenues} tasks={tasks} faturamentosJadlog={faturamentosJadlog} acrescimos={acrescimos} forecastEntries={forecastEntries}/>}
        {view==="forecast"&&hasF&&<ForecastView clients={clients} revenues={revenues} forecastEntries={forecastEntries} setForecastEntries={setForecastEntries} faturamentosJadlog={faturamentosJadlog} acrescimos={acrescimos}/>}
        {view==="atendimento"&&<AtendimentoView user={liveUser} tickets={tickets} setTickets={setTickets} motoristas={motoristas} users={users} fechamentos={fechamentos} setFechamentos={setFechamentos}/>}
        {view==="fechamento"&&<FechamentoView user={liveUser} fechamentos={fechamentos} setFechamentos={setFechamentos} motoristas={motoristas} setMotoristas={setMotoristas} dreEntradas={dreEntradas} setDreEntradas={setDreEntradas} fixedCosts={fixedCosts} costEntries={costEntries} faturamentosJadlog={faturamentosJadlog} acrescimos={acrescimos} tickets={tickets} setTickets={setTickets}/>}
        {view==="mob"&&<MobView user={liveUser} mobBases={mobBases} setMobBases={setMobBases} mobAprovado={mobAprovado} setMobAprovado={setMobAprovado} mobCustos={mobCustos} setMobCustos={setMobCustos}/>}
        {view==="fatjadlog"&&hasF&&<FatJadlogView user={liveUser} faturamentos={faturamentosJadlog} setFaturamentos={setFaturamentosJadlog} unidades={unidades} setUnidades={setUnidades} clients={clients}/>}
        {view==="pagamentos"&&hasF&&<PagamentosView user={liveUser} fechamentos={fechamentos} setFechamentos={setFechamentos} tasks={tasks} setTasks={setTasks} users={users} clients={clients} motoristas={motoristas} tickets={tickets} setTickets={setTickets}/>}
        {view==="admin"&&liveUser.role==="director"&&<AdminView areas={areas} setAreas={setAreas} users={users} setUsers={setUsers} clients={clients} setClients={setClients} templates={templates} setTemplates={setTemplates}/>}
        {(["costs","revenue","profitability","forecast","pagamentos"].includes(view)&&!hasF)&&(
          <div className="p-6 flex items-center justify-center h-full">
            <Card className="p-10 text-center max-w-sm">
              <Lock size={36} className="text-slate-600 mx-auto mb-3"/>
              <p className="text-slate-300 font-semibold mb-1">Acesso Restrito</p>
              <p className="text-slate-500 text-sm">Esta área requer autorização do Diretor.</p>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
