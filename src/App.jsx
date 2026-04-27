import { useState, useEffect, useMemo, useRef } from "react";
import {
  LayoutDashboard, ClipboardList, DollarSign, TrendingUp, Settings,
  LogOut, Plus, Check, X, ChevronRight, Clock, CheckCircle2, XCircle,
  AlertCircle, MessageSquare, Building2, Calendar, Wallet, FileText,
  User, Shield, Eye, ArrowLeft, Edit2, Trash2, Activity, Package,
  Lock, Layers, BarChart2, Paperclip, Image, Upload, RefreshCw, ChevronDown,
  Truck, CreditCard, Send, ExternalLink, Hash
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
const COST_CATS = ["Operacional","Combustível","Pessoal","Infraestrutura","Manutenção","Seguros","TI","Comercial","Outros"];

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
    { id:"u1", name:"Carlos Mendes", email:"carlos@ops.com", password:"123456", role:"director", areaIds:[], financialAccess:true },
    { id:"u2", name:"Ana Costa",     email:"ana@ops.com",    password:"123456", role:"area_manager", areaIds:["a1"], financialAccess:false },
    { id:"u3", name:"Bruno Silva",   email:"bruno@ops.com",  password:"123456", role:"area_manager", areaIds:["a2"], financialAccess:false },
    { id:"u4", name:"Mariana Neves", email:"mariana@ops.com",password:"123456", role:"area_manager", areaIds:["a3"], financialAccess:true },
    { id:"u5", name:"Pedro Alves",   email:"pedro@ops.com",  password:"123456", role:"operator",     areaIds:["a1"], financialAccess:false },
    { id:"u6", name:"Lúcia Moraes",  email:"lucia@ops.com",  password:"123456", role:"operator",     areaIds:["a2"], financialAccess:false },
    { id:"u7", name:"Ricardo Pinto", email:"ricardo@ops.com",password:"123456", role:"auditor",       areaIds:[], financialAccess:true },
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
    { id:"mt1", nome:"Lorena Bastos Costa",        matricula:"134994", email:"lorena@email.com",    cpf:"111.222.333-44", tipoPagamento:"ambos",  valorDiaria:80,  valorPacote:1.20, ativo:true },
    { id:"mt2", nome:"Luciano Alves Santana",       matricula:"135296", email:"luciano@email.com",   cpf:"222.333.444-55", tipoPagamento:"pacote", valorDiaria:0,   valorPacote:1.50, ativo:true },
    { id:"mt3", nome:"Denis Wallace Teixeira",      matricula:"135349", email:"denis@email.com",     cpf:"333.444.555-66", tipoPagamento:"ambos",  valorDiaria:90,  valorPacote:1.30, ativo:true },
    { id:"mt4", nome:"Carlos Eduardo Neves",        matricula:"135372", email:"carlosn@email.com",   cpf:"444.555.666-77", tipoPagamento:"diaria", valorDiaria:120, valorPacote:0,    ativo:true },
    { id:"mt5", nome:"Murilo Demetre Luz",          matricula:"135652", email:"murilo@email.com",    cpf:"555.666.777-88", tipoPagamento:"pacote", valorDiaria:0,   valorPacote:1.80, ativo:true },
    { id:"mt6", nome:"Wanderson Gomes",             matricula:"135754", email:"wanderson@email.com", cpf:"666.777.888-99", tipoPagamento:"ambos",  valorDiaria:75,  valorPacote:1.10, ativo:true },
    { id:"mt7", nome:"Pedro Lucas Barcelos Lemos",  matricula:"136233", email:"pedrol@email.com",    cpf:"777.888.999-00", tipoPagamento:"pacote", valorDiaria:0,   valorPacote:1.40, ativo:true },
    { id:"mt8", nome:"Webert Ferreira Pinto",       matricula:"136992", email:"webert@email.com",    cpf:"888.999.000-11", tipoPagamento:"ambos",  valorDiaria:85,  valorPacote:1.25, ativo:true },
  ],
  fechamentos:[],
};

// ─────────────────────────────────────────────
// STORAGE
// ─────────────────────────────────────────────
function useLS(key, init) {
  const k = `ops3_${key}`;
  const [val, setVal] = useState(() => {
    try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : init; } catch { return init; }
  });
  const set = v => {
    const nv = typeof v === "function" ? v(val) : v;
    setVal(nv);
    localStorage.setItem(k, JSON.stringify(nv));
  };
  return [val, set];
}

// ─────────────────────────────────────────────
// SHARED UI
// ─────────────────────────────────────────────
const Badge = ({ color, children }) => (
  <span style={{ color, background: color+"18", border:`1px solid ${color}30` }}
    className="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap">{children}</span>
);
const Card = ({ children, className="" }) => (
  <div className={`bg-slate-800 border border-slate-700 rounded-xl ${className}`}>{children}</div>
);
const Btn = ({ onClick, children, variant="primary", size="md", className="", disabled=false, type="button" }) => {
  const base = "inline-flex items-center gap-1.5 font-semibold rounded-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";
  const sizes = { sm:"px-3 py-1.5 text-xs", md:"px-4 py-2 text-sm", lg:"px-5 py-2.5 text-sm" };
  const vars = {
    primary:"bg-amber-500 hover:bg-amber-400 text-slate-900",
    secondary:"bg-slate-700 hover:bg-slate-600 text-slate-100",
    danger:"bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30",
    success:"bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30",
    ghost:"hover:bg-slate-700 text-slate-400 hover:text-slate-100",
  };
  return <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${sizes[size]} ${vars[variant]} ${className}`}>{children}</button>;
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
    <div onClick={e=>e.stopPropagation()} className={`bg-slate-800 border border-slate-700 rounded-2xl w-full ${wide?"max-w-3xl":"max-w-lg"} max-h-[90vh] overflow-y-auto`}>
      <div className="flex items-center justify-between p-5 border-b border-slate-700">
        <h2 className="text-base font-bold text-slate-100">{title}</h2>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400"><X size={16}/></button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
);
const KpiCard = ({ label, value, sub, icon:Icon, color="#f59e0b" }) => (
  <Card className="p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs text-slate-400 font-medium mb-1">{label}</p>
        <p className="text-2xl font-bold text-slate-100">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      </div>
      <div className="p-2.5 rounded-xl" style={{background:color+"18"}}><Icon size={20} style={{color}}/></div>
    </div>
  </Card>
);

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const userHasFinancial = u => u.role === "director" || u.role === "auditor" || u.financialAccess === true;
const userAreaIds = u => u.areaIds || [];
const userCanSeeTask = (u, task, templates) => {
  if (u.role === "director" || u.role === "auditor") return true;
  if (task.openedBy === u.id) return true;
  if (u.role === "area_manager") {
    const uAreas = userAreaIds(u);
    const tpl = templates.find(t => t.id === task.templateId);
    if (tpl && tpl.steps.some(s => s.areaId && uAreas.includes(s.areaId))) return true;
    if (task.clientAllocation && uAreas.length > 0) return false;
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
function LoginScreen({ users, onLogin }) {
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
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-2 mb-4">
            <Package size={16} className="text-amber-400"/><span className="text-amber-400 text-sm font-semibold">OpsControl</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-100 mb-1">Sistema de Gestão Operacional</h1>
          <p className="text-slate-400 text-sm">Franquia Logística</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-300">Entrar</h3>
            <Input label="E-mail" type="email" placeholder="seu@email.com" value={email} onChange={e=>setEmail(e.target.value)} />
            <Input label="Senha" type="password" placeholder="••••••" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()} />
            {err && <p className="text-red-400 text-xs">{err}</p>}
            <Btn onClick={handle} className="w-full justify-center">Entrar</Btn>
          </Card>
          <Card className="p-6">
            <h3 className="text-sm font-bold text-slate-300 mb-3">Acesso rápido</h3>
            <div className="space-y-2">
              {users.map(u=>(
                <button key={u.id} onClick={()=>onLogin(u)} className="flex items-center justify-between w-full p-3 rounded-lg bg-slate-900 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 transition-all text-left">
                  <div><p className="text-sm font-semibold text-slate-100">{u.name}</p><p className="text-xs text-slate-500">{u.email}</p></div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge color={ROLE_COLORS[u.role]}>{ROLE_LABELS[u.role]}</Badge>
                    {userHasFinancial(u) && <span className="text-xs text-emerald-400">💰 financeiro</span>}
                  </div>
                </button>
              ))}
            </div>
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
  { id:"costs",         label:"Custos",          icon:DollarSign,      roles:["director","area_manager","auditor"],             financial:true },
  { id:"revenue",       label:"Faturamento",     icon:Wallet,          roles:["director","area_manager","auditor"],             financial:true },
  { id:"profitability", label:"Rentabilidade",   icon:TrendingUp,      roles:["director","area_manager","auditor"],             financial:true },
  { id:"forecast",      label:"Forecast",        icon:BarChart2,       roles:["director","area_manager","auditor"],             financial:true },
  { id:"fechamento",    label:"Fechamento",      icon:Truck,           roles:["director","area_manager","operator","auditor"],  financial:false },
  { id:"admin",         label:"Administração",   icon:Settings,        roles:["director"],                                      financial:false },
];
function Sidebar({ user, view, setView, onLogout, areas }) {
  const area = areas.filter(a => userAreaIds(user).includes(a.id)).map(a=>a.name).join(", ");
  const hasF = userHasFinancial(user);
  return (
    <div className="w-56 bg-slate-950 border-r border-slate-800 flex flex-col flex-shrink-0">
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center"><Package size={16} className="text-slate-900"/></div>
          <div><p className="text-sm font-bold text-amber-400">OpsControl</p><p className="text-xs text-slate-500">v2.0</p></div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {NAV.filter(n=>n.roles.includes(user.role) && (!n.financial || hasF)).map(n=>{
          const Icon=n.icon; const active=view===n.id;
          return (
            <button key={n.id} onClick={()=>setView(n.id)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all w-full text-left ${active?"bg-amber-500/10 text-amber-400 border border-amber-500/20":"text-slate-400 hover:text-slate-100 hover:bg-slate-800"}`}>
              <Icon size={16}/>{n.label}
            </button>
          );
        })}
      </nav>
      <div className="p-3 border-t border-slate-800">
        <div className="flex items-center gap-2 px-3 py-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-amber-400">{user.name[0]}</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">{user.name}</p>
            <p className="text-xs text-slate-500 truncate">{area || ROLE_LABELS[user.role]}</p>
          </div>
        </div>
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
        className={`bg-slate-800 border rounded-xl p-5 hover:border-amber-500/40 group transition-all ${task.status==="awaiting_approval"?"border-amber-500/30":"border-slate-700"}`}>
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
        <div className="relative">
          <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-700">
            <div className="h-full bg-emerald-500 transition-all" style={{width:`${(task.stepStatuses.filter(s=>s.status==="completed").length/Math.max(tpl.steps.length-1,1))*100}%`}}/>
          </div>
          <div className="relative flex items-start justify-between">
            {tpl.steps.map((step,i)=>{
              const ss=task.stepStatuses[i];
              const st=ss?.status||"pending";
              const isCur=i===task.currentStepIndex&&!isTerminal;
              const bg=st==="completed"?"#10b981":st==="rejected"?"#ef4444":isCur?"#f59e0b":"#1e293b";
              const border=st==="completed"?"#10b981":st==="rejected"?"#ef4444":isCur?"#f59e0b":"#334155";
              const tc=st==="completed"||st==="rejected"||isCur?"#0f172a":"#64748b";
              return (
                <div key={step.id} className="flex flex-col items-center gap-1.5" style={{flex:1}}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all text-xs font-bold"
                    style={{background:bg,borderColor:border,color:isCur?"#0f172a":"#fff",boxShadow:isCur?`0 0 0 3px ${bg}30`:"none"}}>
                    {st==="completed"?<Check size={12}/>:st==="rejected"?<X size={12}/>:i+1}
                  </div>
                  <p className={`text-xs font-medium text-center leading-tight px-1 ${isCur?"text-amber-400":st==="completed"?"text-emerald-400":"text-slate-500"}`}>{step.name}</p>
                  {ss?.actedAt&&<p className="text-xs text-slate-600">{fmtDate(ss.actedAt)}</p>}
                </div>
              );
            })}
          </div>
        </div>
        {!isTerminal&&tpl.steps[task.currentStepIndex]&&(
          <div className="mt-4 pt-3 border-t border-slate-700 text-xs text-slate-400">
            <span className="text-amber-400 font-semibold">Atual: </span>{tpl.steps[task.currentStepIndex].name}
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
        <KpiCard label="Receita Total" value={fmt(totalRev)} sub="mês corrente" icon={Wallet} color="#10b981"/>
        <KpiCard label="Custo Total" value={fmt(totalCost)} sub={`fixo: ${fmt(totalFixed)}`} icon={DollarSign} color="#ef4444"/>
        <KpiCard label="Margem" value={`${margin.toFixed(1)}%`} sub={fmt(totalRev-totalCost)} icon={TrendingUp} color={margin>20?"#10b981":"#f59e0b"}/>
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
              <YAxis stroke="#64748b" tick={{fill:"#94a3b8",fontSize:11}} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
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
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs text-slate-400 font-medium">Rateio de Clientes <span className={total===100?"text-emerald-400":"text-amber-400"}>({total}%)</span></label>
        <button type="button" onClick={add} className="text-xs text-amber-400 hover:text-amber-300">+ Adicionar</button>
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
                  <span className={`text-xs px-2 py-1 rounded ${s.requiresApproval?"bg-amber-500/10 text-amber-400 border border-amber-500/20":"bg-slate-700 text-slate-300"}`}>{s.name}</span>
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
function TasksView({ user, tasks, setTasks, templates, clients, areas, users, initialOpenId, onClearOpenId }) {
  const [selectedId, setSelectedId] = useState(initialOpenId||null);
  const [showNew, setShowNew] = useState(false);
  const [filter, setFilter] = useState("all");

  useEffect(()=>{ if(initialOpenId){setSelectedId(initialOpenId);onClearOpenId&&onClearOpenId();}}, [initialOpenId]);

  const visible = tasks.filter(t=>userCanSeeTask(user,t,templates));
  const selectedTask = selectedId ? tasks.find(t=>t.id===selectedId) : null;

  const filtered = visible.filter(t=>{
    if(filter==="all") return true;
    if(filter==="mine") return t.openedBy===user.id;
    if(filter==="pending") return t.status==="awaiting_approval";
    return t.status===filter;
  });

  if(selectedTask) return (
    <TaskDetail task={selectedTask} user={user} tasks={tasks} setTasks={setTasks}
      templates={templates} clients={clients} areas={areas} users={users}
      onBack={()=>setSelectedId(null)}/>
  );

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-slate-100">Tarefas</h1>
          <p className="text-sm text-slate-400">{visible.length} visível(is) para você</p></div>
        {user.role!=="auditor"&&<Btn onClick={()=>setShowNew(true)}><Plus size={14}/>Nova Tarefa</Btn>}
      </div>
      <div className="flex gap-2 flex-wrap">
        {[["all","Todas"],["mine","Minhas"],["pending","Aguard. Aprovação"],["in_progress","Em Andamento"],["completed","Concluídas"]].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)} className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all border ${filter===v?"bg-amber-500 text-slate-900 border-amber-500":"bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500"}`}>{l}</button>
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
              className={`bg-slate-800 border rounded-xl p-4 hover:border-amber-500/40 group transition-all ${needsAction?"border-amber-500/30":"border-slate-700"}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge color={STATUS_COLORS[t.status]}>{STATUS_LABELS[t.status]}</Badge>
                    <span className="text-xs text-slate-500">{t.templateName}</span>
                    {needsAction&&<span className="text-xs text-amber-400 font-semibold animate-pulse">● Ação necessária</span>}
                    {t.attachments?.length>0&&<span className="text-xs text-slate-500 flex items-center gap-0.5"><Paperclip size={10}/>{t.attachments.length}</span>}
                  </div>
                  <p className="font-semibold text-slate-100 text-sm">{t.title}</p>
                  <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                    <span className="text-xs text-slate-500 flex items-center gap-1"><User size={10}/>{opener?.name}</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1"><Building2 size={10}/>{cNames||"—"}</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1"><Calendar size={10}/>{fmtDate(t.openedAt)}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className="text-xs text-amber-400 opacity-0 group-hover:opacity-100 transition-all font-semibold">Abrir →</span>
                  <span className="text-xs text-slate-400">{done}/{total} etapas</span>
                  <div className="w-24 bg-slate-700 rounded-full h-1.5">
                    <div className="bg-amber-500 h-1.5 rounded-full" style={{width:`${(done/total)*100}%`}}/>
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
    updateTask({status:fs?.requiresApproval?"awaiting_approval":"in_progress",currentStepIndex:0});
  };

  const advanceToNext = (idx, statuses) => {
    const next=idx+1;
    if(next>=tpl.steps.length){ updateTask({status:"completed",currentStepIndex:next,stepStatuses:statuses}); return; }
    const ns=tpl.steps[next];
    updateTask({status:ns.requiresApproval?"awaiting_approval":"in_progress",currentStepIndex:next,stepStatuses:statuses});
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
          <h1 className="text-lg font-bold text-slate-100">{task.title}</h1>
          <p className="text-xs text-slate-400">{task.templateName}</p>
        </div>
        <Badge color={STATUS_COLORS[task.status]}>{STATUS_LABELS[task.status]}</Badge>
        {canEdit&&<Btn variant="secondary" size="sm" onClick={()=>setEditing(true)}><Edit2 size={13}/>Editar</Btn>}
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
        <div className={`rounded-xl border-2 p-5 space-y-4 ${hasAction?"border-amber-500/40 bg-amber-500/5":"border-slate-700 bg-slate-800"}`}>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${hasAction?"bg-amber-400 animate-pulse":"bg-slate-600"}`}/>
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
                    ?`Aguardando ${currentStep?.approverRole==="director"?"o Diretor":`Gestor de ${areas.find(a=>a.id===currentStep?.areaId)?.name||"Área"}`} aprovar.`
                    :"Nenhuma ação disponível para o seu perfil nesta etapa."}
                </p>
              )}
            </div>
          )}
          {isAuditor&&<p className="text-xs text-slate-500 text-center py-2">Perfil Auditor — somente visualização.</p>}
        </div>
      )}
      {isTerminal&&(
        <div className={`rounded-xl border p-4 flex items-center gap-3 ${task.status==="completed"?"border-emerald-500/30 bg-emerald-500/5":"border-red-500/30 bg-red-500/5"}`}>
          {task.status==="completed"?<CheckCircle2 size={18} className="text-emerald-400"/>:<XCircle size={18} className="text-red-400"/>}
          <p className={`text-sm font-semibold ${task.status==="completed"?"text-emerald-300":"text-red-300"}`}>
            {task.status==="completed"?"Tarefa concluída com sucesso.":`Tarefa ${STATUS_LABELS[task.status].toLowerCase()}.`}
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
              <div key={step.id} className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${done?"bg-emerald-500/5 border-emerald-500/20":rej?"bg-red-500/5 border-red-500/20":isCur?"bg-amber-500/5 border-amber-500/30":"bg-slate-900 border-slate-700 opacity-60"}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5 ${done?"bg-emerald-500 text-white":rej?"bg-red-500 text-white":isCur?"bg-amber-500 text-slate-900":"bg-slate-700 text-slate-500"}`}>
                  {done?<Check size={12}/>:rej?<X size={12}/>:i+1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm font-semibold ${isCur?"text-amber-300":done?"text-emerald-300":"text-slate-300"}`}>{step.name}</p>
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
                <p className="text-xs text-slate-500">Rateado para: {task.clientAllocation.map(a=>`${clients.find(c=>c.id===a.clientId)?.name} (${a.percent}%)`).join(" · ")}</p>
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
        <KpiCard label="Custos Fixos/Mês" value={fmt(totalFixed)} sub={`${fixedCosts.filter(f=>f.active).length} itens ativos`} icon={Lock} color="#ef4444"/>
        <KpiCard label="Custos Variáveis" value={fmt(totalVar)} sub={`${MONTHS_SHORT[filterMonth-1]} · ${filtered.length} lançamentos`} icon={Activity} color="#f59e0b"/>
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex gap-1">
          {[["variable","Variáveis"],["fixed","Fixos"]].map(([v,l])=>(
            <button key={v} onClick={()=>setTab(v)} className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-all ${tab===v?"bg-amber-500 text-slate-900 border-amber-500":"bg-slate-800 text-slate-400 border-slate-700"}`}>{l}</button>
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
            const alloc=c.clientAllocation.map(a=>`${clients.find(cl=>cl.id===a.clientId)?.code} ${a.percent}%`).join(" · ");
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
            const alloc=fc.clientAllocation.map(a=>`${clients.find(cl=>cl.id===a.clientId)?.code} ${a.percent}%`).join(" · ");
            return (
              <Card key={fc.id} className={`p-4 ${!fc.active?"opacity-50":""}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2"><p className="text-sm font-semibold text-slate-100">{fc.description}</p><Badge color={fc.active?"#10b981":"#64748b"}>{fc.active?"Ativo":"Inativo"}</Badge></div>
                    <div className="flex gap-3 mt-1"><span className="text-xs text-slate-500">{fc.category}</span><span className="text-xs text-slate-500">{alloc}</span></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-red-400">{fmt(fc.value)}</p>
                    {canEdit&&<button onClick={()=>toggleFixed(fc.id)} className={`text-xs px-2 py-1 rounded border ${fc.active?"border-red-500/30 text-red-400":"border-emerald-500/30 text-emerald-400"}`}>{fc.active?"Desativar":"Ativar"}</button>}
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
function RevenueView({ user, revenues, setRevenues, clients }) {
  const [showNew, setShowNew] = useState(false);
  const [filterMonth, setFilterMonth] = useState(4);
  const canEdit = ["director","area_manager"].includes(user.role);
  const filtered = revenues.filter(r=>r.month===filterMonth&&r.year===2025);
  const total = filtered.reduce((s,r)=>s+r.value,0);
  const p1 = filtered.filter(r=>r.period===1).reduce((s,r)=>s+r.value,0);
  const p2 = filtered.filter(r=>r.period===2).reduce((s,r)=>s+r.value,0);
  const save=e=>{setRevenues(p=>[...p,{...e,id:uid(),createdBy:user.id}]);setShowNew(false);};
  const del=id=>setRevenues(p=>p.filter(r=>r.id!==id));

  // Group by client
  const byClient = clients.map(cl=>{
    const rows=filtered.filter(r=>r.clientId===cl.id);
    if(rows.length===0) return null;
    return {cl, rows, t1:rows.filter(r=>r.period===1).reduce((s,r)=>s+r.value,0), t2:rows.filter(r=>r.period===2).reduce((s,r)=>s+r.value,0), total:rows.reduce((s,r)=>s+r.value,0)};
  }).filter(Boolean);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-slate-100">Faturamento</h1><p className="text-sm text-slate-400">Por cliente e quinzena</p></div>
        {canEdit&&<Btn onClick={()=>setShowNew(true)}><Plus size={14}/>Novo Lançamento</Btn>}
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        <Sel value={filterMonth} onChange={e=>setFilterMonth(Number(e.target.value))}>
          {MONTHS_SHORT.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
        </Sel>
        <div className="flex gap-3">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2 text-center">
            <p className="text-xs text-slate-400">1ª Quinzena</p><p className="text-base font-bold text-emerald-400">{fmt(p1)}</p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-2 text-center">
            <p className="text-xs text-slate-400">2ª Quinzena</p><p className="text-base font-bold text-blue-400">{fmt(p2)}</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-center">
            <p className="text-xs text-slate-400">Total</p><p className="text-base font-bold text-slate-100">{fmt(total)}</p>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        {byClient.length===0&&<div className="text-center py-10 text-slate-500 text-sm">Nenhum faturamento neste mês</div>}
        {byClient.map(({cl,rows,t1,t2,total:ct})=>(
          <Card key={cl.id} className="overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-700 flex items-center justify-center font-bold text-blue-400 text-xs">{cl.code}</div>
                <p className="font-semibold text-slate-100">{cl.name}</p>
              </div>
              <div className="flex gap-4 text-sm">
                <div className="text-right"><p className="text-xs text-slate-400">1ª Q</p><p className="font-semibold text-emerald-400">{fmt(t1)}</p></div>
                <div className="text-right"><p className="text-xs text-slate-400">2ª Q</p><p className="font-semibold text-blue-400">{fmt(t2)}</p></div>
                <div className="text-right"><p className="text-xs text-slate-400">Total</p><p className="font-bold text-slate-100">{fmt(ct)}</p></div>
              </div>
            </div>
            <div className="divide-y divide-slate-700/50">
              {rows.map(r=>(
                <div key={r.id} className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded font-semibold ${r.period===1?"bg-emerald-500/10 text-emerald-400":"bg-blue-500/10 text-blue-400"}`}>{r.period===1?"1ª Quinzena":"2ª Quinzena"}</span>
                    <span className="text-sm text-slate-300">{r.description}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-emerald-400">{fmt(r.value)}</p>
                    {canEdit&&<button onClick={()=>del(r.id)} className="text-slate-600 hover:text-red-400"><Trash2 size={13}/></button>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
      {showNew&&(
        <Modal title="Novo Faturamento" onClose={()=>setShowNew(false)}>
          <RevenueForm clients={clients} onSave={save} onCancel={()=>setShowNew(false)}/>
        </Modal>
      )}
    </div>
  );
}
function RevenueForm({ clients, onSave, onCancel }) {
  const [f, setF] = useState({clientId:"",value:"",description:"",month:4,year:2025,period:1});
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  return (
    <div className="space-y-4">
      <Sel label="Cliente" value={f.clientId} onChange={e=>sf("clientId",e.target.value)}>
        <option value="">Selecione...</option>
        {clients.filter(c=>c.active).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
      </Sel>
      <Sel label="Período" value={f.period} onChange={e=>sf("period",Number(e.target.value))}>
        <option value={1}>1ª Quinzena (dias 1–15)</option>
        <option value={2}>2ª Quinzena (dias 16–31)</option>
      </Sel>
      <Input label="Valor (R$)" type="number" placeholder="0" value={f.value} onChange={e=>sf("value",e.target.value)}/>
      <Input label="Descrição" placeholder="Faturamento..." value={f.description} onChange={e=>sf("description",e.target.value)}/>
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
function ProfitabilityView({ clients, fixedCosts, costEntries, revenues, tasks }) {
  const [filterMonth, setFilterMonth] = useState(4);

  const data = useMemo(()=>clients.map(cl=>{
    const rev=revenues.filter(r=>r.clientId===cl.id&&r.month===filterMonth&&r.year===2025).reduce((s,r)=>s+r.value,0);
    const fc=fixedCosts.filter(f=>f.active).reduce((s,f)=>{const a=f.clientAllocation.find(a=>a.clientId===cl.id);return s+(a?f.value*a.percent/100:0);},0);
    const vc=costEntries.filter(c=>c.month===filterMonth&&c.year===2025).reduce((s,c)=>{const a=c.clientAllocation.find(a=>a.clientId===cl.id);return s+(a?c.value*a.percent/100:0);},0);
    // Task costs allocated to this client
    const tc=tasks.reduce((s,t)=>s+t.costRationals.reduce((a,cr)=>{
      const al=t.clientAllocation.find(x=>x.clientId===cl.id);
      return a+(al?cr.value*al.percent/100:0);
    },0),0);
    const totalCost=fc+vc+tc; const profit=rev-totalCost;
    const margin=rev>0?(profit/rev*100):0;
    return {...cl,rev,fc,vc,tc,totalCost,profit,margin};
  }),[clients,fixedCosts,costEntries,revenues,tasks,filterMonth]);

  const totals=data.reduce((a,c)=>({rev:a.rev+c.rev,cost:a.cost+c.totalCost,profit:a.profit+c.profit}),{rev:0,cost:0,profit:0});
  const totalMargin=totals.rev>0?(totals.profit/totals.rev*100):0;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-slate-100">Rentabilidade</h1><p className="text-sm text-slate-400">Custos fixos + variáveis + tarefas por cliente</p></div>
        <Sel value={filterMonth} onChange={e=>setFilterMonth(Number(e.target.value))}>
          {MONTHS_SHORT.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
        </Sel>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Receita Total" value={fmt(totals.rev)} icon={Wallet} color="#10b981"/>
        <KpiCard label="Custo Total" value={fmt(totals.cost)} icon={DollarSign} color="#ef4444"/>
        <KpiCard label="Lucro / Margem" value={`${totalMargin.toFixed(1)}%`} sub={fmt(totals.profit)} icon={TrendingUp} color={totalMargin>20?"#10b981":"#f59e0b"}/>
      </div>
      <Card className="p-5">
        <h3 className="text-sm font-bold text-slate-300 mb-4">Receita vs Custo — {MONTHS_SHORT[filterMonth-1]}</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.map(d=>({name:d.code,Receita:d.rev,Custo:d.totalCost,Lucro:d.profit}))} barSize={20}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
            <XAxis dataKey="name" stroke="#64748b" tick={{fill:"#94a3b8",fontSize:12}}/>
            <YAxis stroke="#64748b" tick={{fill:"#94a3b8",fontSize:11}} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
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
                  <td className={`px-4 py-3.5 font-bold ${d.profit>=0?"text-emerald-400":"text-red-400"}`}>{fmt(d.profit)}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-14 bg-slate-700 rounded-full h-1.5"><div className="h-1.5 rounded-full" style={{width:`${Math.max(0,Math.min(100,d.margin))}%`,background:d.margin>20?"#10b981":d.margin>0?"#f59e0b":"#ef4444"}}/></div>
                      <span className={`text-xs font-bold ${d.margin>20?"text-emerald-400":d.margin>0?"text-amber-400":"text-red-400"}`}>{d.margin.toFixed(1)}%</span>
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
              <td className={`px-4 py-3 font-bold text-lg ${totals.profit>=0?"text-emerald-400":"text-red-400"}`}>{fmt(totals.profit)}</td>
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
function TemplateBuilder({ areas, initial, onSave, onCancel }) {
  const blank={name:"",description:"",category:"Operações",areaIds:[],costParams:[],steps:[]};
  const [form, setForm]=useState(initial?{...initial,steps:initial.steps.map(s=>({...s})),costParams:initial.costParams||[],areaIds:initial.areaIds||[]}:blank);
  const sf=(k,v)=>setForm(p=>({...p,[k]:v}));
  const CATS=["Operações","Comercial","Financeiro","Tecnologia","RH","Jurídico","Outros"];

  const toggleArea=id=>sf("areaIds",form.areaIds.includes(id)?form.areaIds.filter(a=>a!==id):[...form.areaIds,id]);

  const addStep=()=>sf("steps",[...form.steps,{id:uid(),order:form.steps.length+1,name:"",description:"",areaId:"",requiresApproval:false,approverRole:null}]);
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
        <div><h1 className="text-xl font-bold text-slate-100">{initial?"Editar Fluxo":"Novo Fluxo de Tarefa"}</h1>
          <p className="text-sm text-slate-400">Defina etapas, aprovações e custos parametrizados</p></div>
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
                className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-all ${form.areaIds.includes(a.id)?"bg-blue-500/20 text-blue-300 border-blue-500/40":"bg-slate-900 text-slate-500 border-slate-700 hover:border-slate-500"}`}>
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
              <Input label="Label do campo (o que o usuário vê)" placeholder="Ex: Salário Base (R$)" value={cp.inputLabel} onChange={e=>updParam(cp.id,"inputLabel",e.target.value)}/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Multiplicador" type="number" step="0.01" value={cp.multiplier} onChange={e=>updParam(cp.id,"multiplier",Number(e.target.value))}/>
              <Input label="Descrição do multiplicador" placeholder="Ex: × 1.7 (encargos trabalhistas)" value={cp.multiplierLabel} onChange={e=>updParam(cp.id,"multiplierLabel",e.target.value)}/>
            </div>
            <div className="bg-slate-900 rounded-lg px-3 py-2 border border-slate-700">
              <p className="text-xs text-slate-400">Prévia: <span className="text-amber-400 font-semibold">{cp.inputLabel} {cp.multiplierLabel}</span></p>
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
        {form.steps.map((step,i)=>(
          <Card key={step.id} className="p-4 border-slate-600">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-900 flex items-center justify-center text-xs font-bold flex-shrink-0">{i+1}</div>
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
            <div className="mb-3">
              <TA label="Instrução" placeholder="O que deve ser feito nesta etapa?" rows={2} value={step.description} onChange={e=>updStep(step.id,"description",e.target.value)}/>
            </div>
            <div className={`rounded-lg border p-3 transition-all ${step.requiresApproval?"bg-amber-500/5 border-amber-500/20":"bg-slate-900 border-slate-700"}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-semibold ${step.requiresApproval?"text-amber-300":"text-slate-300"}`}>Requer aprovação</p>
                  <p className="text-xs text-slate-500 mt-0.5">Tarefa pausa aguardando aprovação</p>
                </div>
                <button type="button" onClick={()=>updStep(step.id,"requiresApproval",!step.requiresApproval)}
                  className={`w-11 h-6 rounded-full transition-all flex items-center px-1 ${step.requiresApproval?"bg-amber-500":"bg-slate-700"}`}>
                  <span className={`w-4 h-4 rounded-full bg-white transition-all ${step.requiresApproval?"translate-x-5":"translate-x-0"}`}/>
                </button>
              </div>
              {step.requiresApproval&&(
                <div className="mt-3 pt-3 border-t border-amber-500/20">
                  <label className="text-xs text-amber-400/80 font-medium block mb-2">Quem aprova?</label>
                  <div className="flex gap-2">
                    {[["area_manager","Gestor de Área","#60a5fa"],["director","Diretor","#f59e0b"]].map(([val,label,color])=>(
                      <button key={val} type="button" onClick={()=>updStep(step.id,"approverRole",val)}
                        className={`flex-1 py-2 px-3 rounded-lg border text-sm font-semibold transition-all ${step.approverRole===val?"border-2":""}`}
                        style={step.approverRole===val?{borderColor:color,color,background:color+"15"}:{borderColor:"#334155",color:"#64748b",background:"#0f172a"}}>
                        {step.approverRole===val&&<Check size={12} className="inline mr-1"/>}{label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Preview */}
      {form.steps.length>0&&(
        <Card className="p-5">
          <h3 className="text-sm font-bold text-slate-300 mb-3">Pré-visualização</h3>
          <div className="flex items-start gap-1 flex-wrap">
            {form.steps.map((s,i)=>{
              const area=areas.find(a=>a.id===s.areaId);
              return (
                <div key={s.id} className="flex items-center gap-1">
                  <div className={`rounded-lg px-3 py-2 border text-center min-w-[80px] ${s.requiresApproval?"bg-amber-500/10 border-amber-500/30":"bg-slate-900 border-slate-700"}`}>
                    <p className={`text-xs font-semibold ${s.requiresApproval?"text-amber-300":"text-slate-200"}`}>{s.name||`Etapa ${i+1}`}</p>
                    {area&&<p className="text-xs text-slate-500 mt-0.5">{area.name}</p>}
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
        <Btn onClick={()=>canSave&&onSave(form)} disabled={!canSave} className="flex-1 justify-center" size="lg"><Check size={16}/>{initial?"Salvar Alterações":"Criar Fluxo"}</Btn>
        <Btn variant="secondary" onClick={onCancel} size="lg">Cancelar</Btn>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ADMIN VIEW
// ─────────────────────────────────────────────
function AdminView({ areas, users, setUsers, clients, setClients, templates, setTemplates }) {
  const [tab, setTab] = useState("users");
  const [showNewUser, setShowNewUser] = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  const saveUser=u=>{setUsers(p=>[...p,{...u,id:uid()}]);setShowNewUser(false);};
  const saveClient=c=>{setClients(p=>[...p,{...c,id:uid(),active:true}]);setShowNewClient(false);};
  const deleteUser=id=>setUsers(p=>p.filter(u=>u.id!==id));
  const toggleClient=id=>setClients(p=>p.map(c=>c.id===id?{...c,active:!c.active}:c));
  const deleteTemplate=id=>setTemplates(p=>p.filter(t=>t.id!==id));
  const toggleFinancial=id=>setUsers(p=>p.map(u=>u.id===id?{...u,financialAccess:!u.financialAccess}:u));
  const saveTemplate=tpl=>{
    if(editingTemplate==="new") setTemplates(p=>[...p,{...tpl,id:uid()}]);
    else setTemplates(p=>p.map(t=>t.id===editingTemplate.id?{...tpl,id:t.id}:t));
    setEditingTemplate(null);
  };

  if(editingTemplate!==null) return <TemplateBuilder areas={areas} initial={editingTemplate==="new"?null:editingTemplate} onSave={saveTemplate} onCancel={()=>setEditingTemplate(null)}/>;

  return (
    <div className="p-6 space-y-5">
      <div><h1 className="text-xl font-bold text-slate-100">Administração</h1>
        <p className="text-sm text-slate-400">Usuários, clientes, fluxos e acessos</p></div>
      <div className="flex gap-2 flex-wrap">
        {[["users","Usuários"],["clients","Clientes"],["templates","Fluxos de Tarefa"]].map(([v,l])=>(
          <button key={v} onClick={()=>setTab(v)} className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-all ${tab===v?"bg-amber-500 text-slate-900 border-amber-500":"bg-slate-800 text-slate-400 border-slate-700"}`}>{l}</button>
        ))}
      </div>

      {tab==="users"&&(
        <div className="space-y-3">
          <div className="flex justify-end"><Btn size="sm" onClick={()=>setShowNewUser(true)}><Plus size={14}/>Novo Usuário</Btn></div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-300">
            <span className="font-semibold">💰 Acesso Financeiro</span> — Ative para permitir que o usuário veja Custos, Faturamento e Rentabilidade. Diretores e Auditores sempre têm acesso.
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
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{u.email}{userAreas?` · ${userAreas}`:""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!["director","auditor"].includes(u.role)&&(
                      <button onClick={()=>toggleFinancial(u.id)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg border font-semibold transition-all ${hasF?"border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20":"border-slate-600 text-slate-500 hover:border-slate-400"}`}>
                        {hasF?"Revogar acesso $":"Liberar acesso $"}
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
          {clients.map(cl=>(
            <Card key={cl.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-700 flex items-center justify-center font-bold text-blue-400 text-xs">{cl.code}</div>
                  <p className="text-sm font-semibold text-slate-100">{cl.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge color={cl.active?"#10b981":"#64748b"}>{cl.active?"Ativo":"Inativo"}</Badge>
                  <button onClick={()=>toggleClient(cl.id)} className="text-xs px-2 py-1 rounded border border-slate-600 text-slate-400 hover:border-slate-400 ml-1">{cl.active?"Desativar":"Ativar"}</button>
                </div>
              </div>
            </Card>
          ))}
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
            <Card key={t.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-bold text-slate-100">{t.name}</p>
                    <Badge color="#60a5fa">{t.category}</Badge>
                    <span className="text-xs text-slate-500">{t.steps.length} etapa(s)</span>
                    {t.costParams?.length>0&&<span className="text-xs text-amber-400/70">{t.costParams.length} parâm.</span>}
                  </div>
                  {t.areaIds?.length>0&&<p className="text-xs text-slate-500 mb-2">Áreas: {t.areaIds.map(id=>areas.find(a=>a.id===id)?.name).filter(Boolean).join(", ")}</p>}
                  <div className="flex items-center gap-1 flex-wrap">
                    {t.steps.map((s,i)=>{
                      const area=areas.find(a=>a.id===s.areaId);
                      return (
                        <div key={s.id} className="flex items-center gap-1">
                          <span className={`text-xs px-2 py-0.5 rounded border ${s.requiresApproval?"border-amber-500/30 text-amber-400":"border-slate-700 text-slate-400"}`}>
                            {s.name}{area&&` · ${area.name}`}
                          </span>
                          {i<t.steps.length-1&&<ChevronRight size={10} className="text-slate-600"/>}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
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
  return (
    <div className="space-y-4">
      <Input label="Nome" placeholder="Nome completo do cliente" value={name} onChange={e=>setName(e.target.value)}/>
      <Input label="Sigla / Código" placeholder="Ex: MAG" value={code} onChange={e=>setCode(e.target.value.toUpperCase())}/>
      <div className="flex gap-2">
        <Btn onClick={()=>name&&code&&onSave({name,code})} disabled={!name||!code} className="flex-1 justify-center">Salvar</Btn>
        <Btn variant="secondary" onClick={onCancel}>Cancelar</Btn>
      </div>
    </div>
  );
}

function NewUserModal({ areas, onClose, onSave }) {
  const [f,setF]=useState({name:"",email:"",password:"123456",role:"operator",areaIds:[],financialAccess:false});
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  const toggleArea=id=>sf("areaIds",f.areaIds.includes(id)?f.areaIds.filter(a=>a!==id):[...f.areaIds,id]);
  const needsArea=["operator","area_manager"].includes(f.role);
  return (
    <Modal title="Novo Usuário" onClose={onClose}>
      <div className="space-y-4">
        <Input label="Nome completo" value={f.name} onChange={e=>sf("name",e.target.value)}/>
        <Input label="E-mail" type="email" value={f.email} onChange={e=>sf("email",e.target.value)}/>
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
                  className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-all ${f.areaIds.includes(a.id)?"bg-blue-500/20 text-blue-300 border-blue-500/40":"bg-slate-900 text-slate-500 border-slate-700 hover:border-slate-500"}`}>
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
              className={`w-11 h-6 rounded-full transition-all flex items-center px-1 ${f.financialAccess?"bg-emerald-500":"bg-slate-700"}`}>
              <span className={`w-4 h-4 rounded-full bg-white transition-all ${f.financialAccess?"translate-x-5":"translate-x-0"}`}/>
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
const fcCalcFat   = e => (e?.volumetria||0)*(e?.ticketMedio||0);
const fcCalcCLT   = e => (e?.maoObraCLTBase||0)*1.7;
const fcCalcCost  = e => (e?.fretePrevisto||0)+(e?.maoObraTercPrevisto||0)+fcCalcCLT(e)+(e?.cgcPrevisto||0);
const fcCalcCom   = e => fcCalcFat(e)*((e?.comissaoPercent||0)/100);
const fcCalcImp   = e => fcCalcFat(e)*((e?.impostoPercent||0)/100);
const fcCalcSaldo = e => fcCalcFat(e)-fcCalcCost(e)-fcCalcCom(e)-fcCalcImp(e);
const fcGetFatReal= (revenues, clientId, month) =>
  revenues.filter(r=>r.clientId===clientId&&r.month===month&&r.year===FC_YEAR).reduce((s,r)=>s+r.value,0);

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
      <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg overflow-hidden focus-within:border-amber-500">
        {prefix && <span className="text-xs text-slate-500 px-2 flex-shrink-0">{prefix}</span>}
        <input
          type="number" step={step}
          defaultValue={defaultVal ?? ""}
          key={`${clientId}-${month}-${field}`}
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
function PrevisaoTab({ clients, revenues, forecastEntries, setForecastEntries, filterMonth, propagateGrowth }) {
  const [expanded, setExpanded] = useState(clients[0]?.id || null);

  return (
    <div className="space-y-4">
      {clients.filter(c => c.active).map(cl => {
        const e = fcGetEntry(forecastEntries, cl.id, filterMonth);
        const fat = fcCalcFat(e);
        const fatReal = fcGetFatReal(revenues, cl.id, filterMonth);
        const isOpen = expanded === cl.id;
        return (
          <Card key={cl.id} className={`overflow-hidden transition-all ${isOpen ? "border-amber-500/30" : ""}`}>
            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-700/30 transition-all"
              onClick={() => setExpanded(isOpen ? null : cl.id)}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-700 flex items-center justify-center font-bold text-blue-400 text-xs">{cl.code}</div>
                <div>
                  <p className="font-semibold text-slate-100 text-sm">{cl.name}</p>
                  <div className="flex gap-3 mt-0.5 flex-wrap">
                    <span className="text-xs text-slate-400">Prev: <span className="text-amber-400 font-semibold">{fmt(fat)}</span></span>
                    {fatReal > 0 && <span className="text-xs text-slate-400">Real: <span className={`font-semibold ${fatReal >= fat ? "text-emerald-400" : "text-red-400"}`}>{fmt(fatReal)}</span></span>}
                    {e?.growthRate ? <span className="text-xs text-slate-500">+{e.growthRate}%/mês</span> : null}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {fat > 0 && <Badge color={fatReal >= fat ? "#10b981" : fatReal > 0 ? "#f59e0b" : "#64748b"}>{fatReal > 0 ? (fatReal >= fat ? "✓ Meta" : `${((fatReal/fat)*100).toFixed(0)}%`) : "Sem real."}</Badge>}
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}/>
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
                      <span className="text-xs text-slate-400">Saldo previsto: <span className={`font-bold ${fcCalcSaldo(e)>=0?"text-emerald-400":"text-red-400"}`}>{fmt(fcCalcSaldo(e))}</span></span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Realizado</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-slate-400">Volumetria Realizada (opcional)</label>
                      <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg overflow-hidden focus-within:border-amber-500">
                        <input type="number" defaultValue={e?.volumetriaRealizada ?? ""} key={`${cl.id}-${filterMonth}-volReal`} placeholder="Vazio = usa previsto"
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
                    <p className="text-xs text-slate-500">Aplica {e?.growthRate??0}%/mês de {MONTHS_SHORT[filterMonth-1]} até Dezembro</p>
                  </div>
                  <Btn variant="secondary" size="sm" onClick={() => propagateGrowth(cl.id, filterMonth)} disabled={!e||!e.growthRate}>
                    <RefreshCw size={13}/> Propagar
                  </Btn>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function ResultadoTab({ clients, revenues, forecastEntries, setForecastEntries, filterMonth }) {
  const upsertObs = (clientId, obs) => {
    setForecastEntries(prev => {
      const idx = prev.findIndex(f => f.clientId===clientId && f.month===filterMonth && f.year===FC_YEAR);
      if (idx >= 0) return prev.map((f,i) => i===idx ? {...f,observacao:obs} : f);
      return prev;
    });
  };
  const rows = clients.filter(c=>c.active).map(cl => {
    const e = fcGetEntry(forecastEntries, cl.id, filterMonth);
    const fatReal = fcGetFatReal(revenues, cl.id, filterMonth);
    const fat = fatReal > 0 ? fatReal : fcCalcFat(e);
    const fatSrc = fatReal > 0 ? "real" : "prev";
    const volReal = e?.volumetriaRealizada;
    const vol = volReal != null ? volReal : (e?.volumetria||0);
    const volSrc = volReal != null ? "real" : "prev";
    const custos = fcCalcCost(e);
    const imposto = fat * ((e?.impostoPercent||0)/100);
    const comissao = fat * ((e?.comissaoPercent||0)/100);
    const saldo = fat - custos - imposto - comissao;
    return { cl, e, fat, fatSrc, vol, volSrc, custos, imposto, comissao, saldo };
  });
  const totals = rows.reduce((a,r) => ({ fat:a.fat+r.fat, custos:a.custos+r.custos, imposto:a.imposto+r.imposto, comissao:a.comissao+r.comissao, saldo:a.saldo+r.saldo }), { fat:0, custos:0, imposto:0, comissao:0, saldo:0 });
  const SrcBadge = ({ src }) => <span className={`text-xs ml-1 font-bold ${src==="real"?"text-emerald-400":"text-amber-400/70"}`}>{src==="real"?"R":"P"}</span>;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        <KpiCard label="Faturamento" value={fmt(totals.fat)} icon={Wallet} color="#10b981"/>
        <KpiCard label="Custos" value={fmt(totals.custos)} icon={DollarSign} color="#ef4444"/>
        <KpiCard label="Impostos" value={fmt(totals.imposto)} icon={FileText} color="#8b5cf6"/>
        <KpiCard label="Comissões" value={fmt(totals.comissao)} icon={TrendingUp} color="#f59e0b"/>
        <KpiCard label="Saldo" value={fmt(totals.saldo)} icon={BarChart2} color={totals.saldo>=0?"#10b981":"#ef4444"}/>
      </div>
      <p className="text-xs text-slate-500"><span className="text-emerald-400 font-bold">R</span> = Realizado &nbsp;·&nbsp; <span className="text-amber-400/70 font-bold">P</span> = Previsto</p>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-700">
              {["Cliente","Volume","Faturamento","Custos","Imposto","Comissão","Saldo","Resultado","Observação / Ação"].map(h=>(
                <th key={h} className="text-left text-xs font-semibold text-slate-400 px-4 py-3 whitespace-nowrap">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {rows.map(({cl,e,fat,fatSrc,vol,volSrc,custos,imposto,comissao,saldo})=>(
                <tr key={cl.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 align-top">
                  <td className="px-4 py-3 font-semibold text-slate-100 whitespace-nowrap">{cl.name}</td>
                  <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{vol.toLocaleString("pt-BR")}<SrcBadge src={volSrc}/> <span className="text-slate-600 text-xs">un</span></td>
                  <td className="px-4 py-3 text-emerald-400 font-semibold whitespace-nowrap">{fmt(fat)}<SrcBadge src={fatSrc}/></td>
                  <td className="px-4 py-3 text-red-400 whitespace-nowrap">{fmt(custos)}</td>
                  <td className="px-4 py-3 text-purple-400 whitespace-nowrap">{fmt(imposto)}</td>
                  <td className="px-4 py-3 text-amber-400 whitespace-nowrap">{fmt(comissao)}</td>
                  <td className={`px-4 py-3 font-bold whitespace-nowrap ${saldo>=0?"text-emerald-400":"text-red-400"}`}>{fmt(saldo)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-12 bg-slate-700 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full" style={{width:`${Math.max(0,Math.min(100,fat>0?(saldo/fat)*100:0))}%`,background:saldo>=0?"#10b981":"#ef4444"}}/>
                      </div>
                      <span className={`text-xs font-bold ${saldo>=0?"text-emerald-400":"text-red-400"}`}>{fat>0?`${((saldo/fat)*100).toFixed(1)}%`:"—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 min-w-[200px]">
                    <input defaultValue={e?.observacao||""} key={`obs-${cl.id}-${filterMonth}`}
                      onBlur={ev=>upsertObs(cl.id,ev.target.value)}
                      placeholder="Observações / ações necessárias..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500"/>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr className="bg-slate-700/30">
              <td className="px-4 py-3 font-bold text-slate-200" colSpan={2}>TOTAL</td>
              <td className="px-4 py-3 text-emerald-400 font-bold">{fmt(totals.fat)}</td>
              <td className="px-4 py-3 text-red-400 font-bold">{fmt(totals.custos)}</td>
              <td className="px-4 py-3 text-purple-400 font-bold">{fmt(totals.imposto)}</td>
              <td className="px-4 py-3 text-amber-400 font-bold">{fmt(totals.comissao)}</td>
              <td className={`px-4 py-3 font-bold text-lg ${totals.saldo>=0?"text-emerald-400":"text-red-400"}`}>{fmt(totals.saldo)}</td>
              <td className="px-4 py-3 font-bold text-amber-400">{totals.fat>0?`${((totals.saldo/totals.fat)*100).toFixed(1)}%`:"—"}</td>
              <td className="px-4 py-3"/>
            </tr></tfoot>
          </table>
        </div>
      </Card>
      <Card className="p-5">
        <h3 className="text-sm font-bold text-slate-300 mb-4">Previsto vs Realizado — {MONTHS_SHORT[filterMonth-1]}</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={rows.map(r=>({name:r.cl.code,Previsto:fcCalcFat(r.e),Realizado:fcGetFatReal(revenues,r.cl.id,filterMonth)||null,Saldo:r.saldo}))} barSize={20}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
            <XAxis dataKey="name" stroke="#64748b" tick={{fill:"#94a3b8",fontSize:12}}/>
            <YAxis stroke="#64748b" tick={{fill:"#94a3b8",fontSize:11}} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
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

function ForecastView({ clients, revenues, forecastEntries, setForecastEntries }) {
  const [subTab, setSubTab] = useState("previsao");
  const [filterMonth, setFilterMonth] = useState(4);

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
          {MONTHS_SHORT.map((m, i) => <option key={i} value={i + 1}>{m} 2025</option>)}
        </Sel>
      </div>
      <div className="flex gap-2">
        {[["previsao","📋 Previsão"],["resultado","📊 Resultado"]].map(([v,l]) => (
          <button key={v} onClick={() => setSubTab(v)}
            className={`text-sm px-4 py-2 rounded-lg font-semibold border transition-all ${subTab===v?"bg-amber-500 text-slate-900 border-amber-500":"bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500"}`}>
            {l}
          </button>
        ))}
      </div>
      {subTab==="previsao" && <PrevisaoTab clients={clients} revenues={revenues} forecastEntries={forecastEntries} setForecastEntries={setForecastEntries} filterMonth={filterMonth} propagateGrowth={propagateGrowth}/>}
      {subTab==="resultado" && <ResultadoTab clients={clients} revenues={revenues} forecastEntries={forecastEntries} setForecastEntries={setForecastEntries} filterMonth={filterMonth}/>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MÓDULO: FECHAMENTO DE ENTREGAS
// ═══════════════════════════════════════════════════════
function parseDeliveryXLSX(data) {
  if(!window.XLSX) throw new Error("Biblioteca XLSX não carregada. Aguarde e tente novamente.");
  const wb=window.XLSX.read(data,{type:"array"});
  const ws=wb.Sheets[wb.SheetNames[0]];
  const rows=window.XLSX.utils.sheet_to_json(ws,{defval:""});
  return rows.map(r=>({
    matricula:String(r.OperadorMatricula||"").trim(),
    nomeOper:String(r.OperadorNome||"").trim(),
    ncte:String(r.NCTE||"").trim(),
    qPacotes:Number(r.QPacotes)||0,
    evento:String(r.Evento||"").trim().toLowerCase(),
    data:String(r.Data||"").trim(),
    expedidor:String(r.Expedidor||"").trim(),
    modalidade:String(r.Modalidade||"").trim(),
  }));
}
function calcFechamento(linhas,motoristas){
  const grupos={};
  linhas.forEach(l=>{if(!grupos[l.matricula])grupos[l.matricula]={matricula:l.matricula,nome:l.nomeOper,rows:[]};grupos[l.matricula].rows.push(l);});
  const calculados=[],naoMapeados=[];
  Object.values(grupos).forEach(g=>{
    const m=motoristas.find(x=>x.matricula===g.matricula&&x.ativo);
    if(!m){naoMapeados.push({matricula:g.matricula,nome:g.nome});return;}
    const cteEntrega=g.rows.filter(r=>r.evento==="entrega"&&r.ncte);
    const totalPacotes=cteEntrega.reduce((s,r)=>s+r.qPacotes,0);
    // Tipos: diaria | pacote | ambos | diaria_excedente
    let vDiaria=0, vPacotes=0;
    if(m.tipoPagamento==="diaria"){ vDiaria=m.valorDiaria; }
    else if(m.tipoPagamento==="pacote"){ vPacotes=totalPacotes*m.valorPacote; }
    else if(m.tipoPagamento==="ambos"){ vDiaria=m.valorDiaria; vPacotes=totalPacotes*m.valorPacote; }
    else if(m.tipoPagamento==="diaria_excedente"){
      // Diária fixa + valor por pacote APENAS no excedente acima do mínimo
      vDiaria=m.valorDiaria;
      const excedente=Math.max(0,totalPacotes-(m.minimoPackotes||0));
      vPacotes=excedente*m.valorPacote;
    }
    calculados.push({id:uid(),motoristaId:m.id,matricula:m.matricula,nome:m.nome,email:m.email,tipoPagamento:m.tipoPagamento,valorDiaria:m.valorDiaria,valorPorPacote:m.valorPacote,minimoPackotes:m.minimoPackotes||0,totalCTEs:g.rows.length,cteEntrega:cteEntrega.map(r=>({ncte:r.ncte,qPacotes:r.qPacotes,data:r.data,expedidor:r.expedidor,modalidade:r.modalidade})),cteOutros:g.rows.filter(r=>r.evento!=="entrega"||!r.ncte).map(r=>({ncte:r.ncte,qPacotes:r.qPacotes,evento:r.evento,data:r.data})),totalPacotes,excedente:m.tipoPagamento==="diaria_excedente"?Math.max(0,totalPacotes-(m.minimoPackotes||0)):null,vDiaria,vPacotes,subtotal:vDiaria+vPacotes,correcoes:[],totalCorrecoes:0,totalBruto:vDiaria+vPacotes,statusAgr:"pendente",comentarioAgr:"",notaFiscal:null,tokenPortal:uid()});
  });
  return{calculados,naoMapeados};
}
const FECH_STATUS={rascunho:{label:"Rascunho",cor:"#64748b"},em_revisao:{label:"Em Revisão",cor:"#3b82f6"},aguard_gestor:{label:"Aguard. Gestor",cor:"#f59e0b"},aguard_agregados:{label:"Aguard. Agregados",cor:"#8b5cf6"},aguard_financeiro:{label:"Aguard. Financeiro",cor:"#06b6d4"},pago:{label:"Pago ✓",cor:"#10b981"}};

function MotoristasView({motoristas,setMotoristas}){
  const[showNew,setShowNew]=useState(false);const[editing,setEditing]=useState(null);
  const save=m=>{if(editing){setMotoristas(p=>p.map(x=>x.id===editing.id?{...x,...m}:x));setEditing(null);}else{setMotoristas(p=>[...p,{...m,id:uid(),ativo:true}]);setShowNew(false);}};
  return(<div className="p-6 space-y-5">
    <div className="flex items-center justify-between"><div><h1 className="text-xl font-bold text-slate-100">Motoristas / Agregados</h1><p className="text-sm text-slate-400">{motoristas.filter(m=>m.ativo).length} ativos</p></div><Btn onClick={()=>setShowNew(true)}><Plus size={14}/>Novo Motorista</Btn></div>
    <div className="space-y-2">{motoristas.map(m=>(<Card key={m.id} className={`p-4 ${!m.ativo?"opacity-50":""}`}><div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center font-bold text-amber-400 flex-shrink-0">{m.nome[0]}</div><div><div className="flex items-center gap-2 flex-wrap"><p className="font-semibold text-slate-100 text-sm">{m.nome}</p><Badge color="#60a5fa">Mat: {m.matricula}</Badge><Badge color={m.ativo?"#10b981":"#64748b"}>{m.ativo?"Ativo":"Inativo"}</Badge></div><p className="text-xs text-slate-500 mt-0.5">{m.email} · CPF: {m.cpf}</p><div className="flex gap-2 mt-1 flex-wrap">{(m.tipoPagamento==="diaria"||m.tipoPagamento==="ambos")&&<span className="text-xs bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded px-2 py-0.5">Diária: {fmt(m.valorDiaria)}</span>}{(m.tipoPagamento==="pacote"||m.tipoPagamento==="ambos")&&<span className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded px-2 py-0.5">Por pacote: {fmt(m.valorPacote)}</span>}</div></div></div><div className="flex items-center gap-2"><Btn variant="secondary" size="sm" onClick={()=>setEditing(m)}><Edit2 size={12}/>Editar</Btn><button onClick={()=>setMotoristas(p=>p.map(x=>x.id===m.id?{...x,ativo:!x.ativo}:x))} className={`text-xs px-2.5 py-1.5 rounded-lg border font-semibold ${m.ativo?"border-red-500/30 text-red-400":"border-emerald-500/30 text-emerald-400"}`}>{m.ativo?"Desativar":"Ativar"}</button><button onClick={()=>setMotoristas(p=>p.filter(x=>x.id!==m.id))} className="text-slate-600 hover:text-red-400 p-1.5"><Trash2 size={13}/></button></div></div></Card>))}</div>
    {(showNew||editing)&&<MotoristaModal initial={editing} onClose={()=>{setShowNew(false);setEditing(null);}} onSave={save}/>}
  </div>);
}
function MotoristaModal({initial,onClose,onSave}){
  const[f,setF]=useState(initial||{nome:"",matricula:"",email:"",cpf:"",tipoPagamento:"pacote",valorDiaria:0,valorPacote:0,minimoPackotes:0});
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  const showDiaria = ["diaria","ambos","diaria_excedente"].includes(f.tipoPagamento);
  const showPacote = ["pacote","ambos","diaria_excedente"].includes(f.tipoPagamento);
  const showMinimo = f.tipoPagamento==="diaria_excedente";

  const preview = ()=>{
    if(f.tipoPagamento==="diaria_excedente"&&f.minimoPackotes>0){
      const ex=10; // exemplo
      return `Exemplo: ${f.minimoPackotes} pcts incluídos na diária. Se fizer ${f.minimoPackotes+ex} pcts → ${fmt(f.valorDiaria)} + (${ex} × ${fmt(f.valorPacote)}) = ${fmt(Number(f.valorDiaria)+ex*Number(f.valorPacote))}`;
    }
    return null;
  };

  return(<Modal title={initial?"Editar Motorista":"Novo Motorista"} onClose={onClose}><div className="space-y-4">
    <div className="grid grid-cols-2 gap-3">
      <Input label="Nome Completo *" value={f.nome} onChange={e=>sf("nome",e.target.value)}/>
      <Input label="Matrícula *" value={f.matricula} onChange={e=>sf("matricula",e.target.value)} placeholder="Ex: 135742"/>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <Input label="E-mail *" type="email" value={f.email} onChange={e=>sf("email",e.target.value)}/>
      <Input label="CPF" value={f.cpf} onChange={e=>sf("cpf",e.target.value)} placeholder="000.000.000-00"/>
    </div>
    <Sel label="Tipo de Pagamento" value={f.tipoPagamento} onChange={e=>sf("tipoPagamento",e.target.value)}>
      <option value="diaria">Somente Diária</option>
      <option value="pacote">Somente por Pacote Entregue</option>
      <option value="ambos">Diária + Todos os Pacotes</option>
      <option value="diaria_excedente">Diária + Excedente (pacotes acima do mínimo)</option>
    </Sel>
    <div className="grid grid-cols-2 gap-3">
      {showDiaria&&<Input label="Valor Diária (R$)" type="number" step="0.01" value={f.valorDiaria} onChange={e=>sf("valorDiaria",Number(e.target.value))}/>}
      {showPacote&&<Input label={showMinimo?"Valor por Pacote Excedente (R$)":"Valor por Pacote (R$)"} type="number" step="0.01" value={f.valorPacote} onChange={e=>sf("valorPacote",Number(e.target.value))}/>}
    </div>
    {showMinimo&&(
      <div>
        <Input label="Mínimo de Pacotes incluídos na Diária" type="number" min="0" value={f.minimoPackotes} onChange={e=>sf("minimoPackotes",Number(e.target.value))} placeholder="Ex: 70"/>
        {preview()&&<p className="text-xs text-amber-400/80 mt-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">{preview()}</p>}
      </div>
    )}
    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-300 space-y-0.5">
      <p className="font-semibold">Regras de cálculo:</p>
      <p>• Pacote somente conta CTEs com Evento = "entrega"</p>
      {showMinimo&&<p>• Excedente = total de pacotes − {f.minimoPackotes||"N"} (mínimo). Somente o excedente é pago.</p>}
    </div>
    <div className="flex gap-2">
      <Btn onClick={()=>f.nome&&f.matricula&&f.email&&onSave(f)} disabled={!f.nome||!f.matricula||!f.email} className="flex-1 justify-center">Salvar</Btn>
      <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
    </div>
  </div></Modal>);
}

function NovoFechamentoModal({motoristas,user,onClose,onSave}){
  const[step,setStep]=useState("upload");const[periodo,setPeriodo]=useState("");const[descricao,setDescricao]=useState("");
  const[linhas,setLinhas]=useState(null);const[resultado,setResultado]=useState(null);const[loading,setLoading]=useState(false);const[err,setErr]=useState("");
  const[xlsxReady,setXlsxReady]=useState(!!window.XLSX);
  const fileRef=useRef();
  useEffect(()=>{if(window.XLSX){setXlsxReady(true);return;}const s=document.createElement("script");s.src="https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js";s.onload=()=>setXlsxReady(true);s.onerror=()=>setErr("Falha ao carregar biblioteca.");document.head.appendChild(s);},[]);
  const handleFile=async e=>{const file=e.target.files[0];if(!file)return;if(!xlsxReady){setErr("Aguarde a biblioteca carregar.");return;}setLoading(true);setErr("");
    try{const buf=await file.arrayBuffer();const parsed=parseDeliveryXLSX(buf);if(!parsed.length)throw new Error("Planilha vazia.");const calc=calcFechamento(parsed,motoristas);setLinhas(parsed);setResultado(calc);
      const d=parsed.find(r=>r.data)?.data;if(d){const p=d.split("/");if(p.length===3){const m=p[1].padStart(2,"0"),y=p[2];setPeriodo(`${y}-${m}`);setDescricao(`Fechamento ${MONTHS_SHORT[Number(m)-1]} ${y}`);}}setStep("preview");}
    catch(e){setErr("Erro: "+e.message);}setLoading(false);};
  const handleSave=()=>{if(!periodo||!resultado)return;
    onSave({id:uid(),periodo,descricao,status:"em_revisao",criadoPor:user.id,criadoNome:user.name,criadoEm:now(),linhas,...resultado,historico:[{acao:"Criado",usuario:user.name,ts:now(),obs:`${linhas.length} CTEs · ${resultado.calculados.length} motoristas`}],comprovante:null,dataPagamento:null});};
  return(<Modal title="Novo Fechamento de Entrega" onClose={onClose} wide><div className="space-y-5">
    {step==="upload"&&(<>
      <div className="grid grid-cols-2 gap-3"><Input label="Período (AAAA-MM)" placeholder="2025-04" value={periodo} onChange={e=>setPeriodo(e.target.value)}/><Input label="Descrição" placeholder="Ex: Fechamento Abril 2025" value={descricao} onChange={e=>setDescricao(e.target.value)}/></div>
      <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${xlsxReady?"border-slate-600 hover:border-amber-500/40":"border-slate-700"}`}>
        <Truck size={36} className="text-slate-600 mx-auto mb-3"/><p className="text-slate-300 font-semibold mb-1">{xlsxReady?"Carregar Planilha de Entregas":"Carregando biblioteca..."}</p>
        <p className="text-slate-500 text-xs mb-4">Colunas: OperadorMatricula, OperadorNome, NCTE, QPacotes, Evento...</p>
        {xlsxReady&&<button type="button" onClick={()=>fileRef.current?.click()} className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-4 py-2 rounded-lg text-sm">{loading?"Processando...":"Selecionar .xlsx"}</button>}
        <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} disabled={!xlsxReady||loading}/>
      </div>
      {err&&<p className="text-red-400 text-sm">{err}</p>}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-300 space-y-1"><p className="font-semibold">Regras:</p><p>• Pacote: somente <strong>Evento = "entrega"</strong> com CTE preenchido</p><p>• Mapeamento pelo campo <strong>OperadorMatricula</strong></p></div>
    </>)}
    {step==="preview"&&resultado&&(<>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900 rounded-lg p-3 border border-slate-700 text-center"><p className="text-2xl font-bold text-slate-100">{linhas.length}</p><p className="text-xs text-slate-400">CTEs</p></div>
        <div className="bg-slate-900 rounded-lg p-3 border border-emerald-500/20 text-center"><p className="text-2xl font-bold text-emerald-400">{resultado.calculados.length}</p><p className="text-xs text-slate-400">Mapeados</p></div>
        <div className="bg-slate-900 rounded-lg p-3 border border-amber-500/20 text-center"><p className="text-2xl font-bold text-amber-400">{resultado.naoMapeados.length}</p><p className="text-xs text-slate-400">Sem cadastro</p></div>
      </div>
      {resultado.naoMapeados.length>0&&<div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3"><p className="text-xs font-semibold text-amber-400 mb-1">⚠ Sem cadastro:</p>{resultado.naoMapeados.map(m=><p key={m.matricula} className="text-xs text-amber-300">• Mat. {m.matricula} — {m.nome}</p>)}</div>}
      <div className="max-h-56 overflow-y-auto space-y-2">{resultado.calculados.map(c=>(<div key={c.id} className="bg-slate-900 rounded-lg p-3 border border-slate-700"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-slate-100">{c.nome}</p><p className="text-xs text-slate-400 mt-0.5">Mat: {c.matricula} · {c.totalCTEs} CTEs · {c.cteEntrega.length} entregas · {c.totalPacotes} pacotes</p></div><div className="text-right"><p className="font-bold text-emerald-400">{fmt(c.subtotal)}</p><p className="text-xs text-slate-500">{c.vDiaria>0?`d: ${fmt(c.vDiaria)}`:""}{c.vDiaria>0&&c.vPacotes>0?" + ":""}{c.vPacotes>0?`p: ${fmt(c.vPacotes)}`:""}</p></div></div></div>))}</div>
      <p className="text-sm font-bold text-right">Total: <span className="text-emerald-400 text-lg">{fmt(resultado.calculados.reduce((s,c)=>s+c.subtotal,0))}</span></p>
      <div className="grid grid-cols-2 gap-3"><Input label="Período" value={periodo} onChange={e=>setPeriodo(e.target.value)}/><Input label="Descrição" value={descricao} onChange={e=>setDescricao(e.target.value)}/></div>
      <div className="flex gap-2"><Btn onClick={handleSave} disabled={!periodo} className="flex-1 justify-center">Criar Fechamento</Btn><Btn variant="secondary" onClick={()=>setStep("upload")}>← Voltar</Btn><Btn variant="ghost" onClick={onClose}>Cancelar</Btn></div>
    </>)}
  </div></Modal>);
}

function CorrecaoModal({nome,onClose,onSave}){
  const[f,setF]=useState({cte:"",justificativa:"",valor:""});const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  return(<Modal title={`Correção Manual — ${nome}`} onClose={onClose}><div className="space-y-4">
    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-300">CTE adicionado manualmente ao fechamento. Valor negativo = desconto.</div>
    <Input label="Número do CTE *" placeholder="Ex: 18250100213754" value={f.cte} onChange={e=>sf("cte",e.target.value)}/>
    <TA label="Justificativa *" placeholder="Motivo da correção..." rows={3} value={f.justificativa} onChange={e=>sf("justificativa",e.target.value)}/>
    <Input label="Valor (R$)" type="number" step="0.01" placeholder="50.00 ou -20.00" value={f.valor} onChange={e=>sf("valor",e.target.value)}/>
    <div className="flex gap-2"><Btn onClick={()=>f.cte&&f.justificativa&&f.valor!==""&&onSave({...f,valor:Number(f.valor),id:uid(),criadoEm:now()})} disabled={!f.cte||!f.justificativa||f.valor===""} className="flex-1 justify-center">Adicionar</Btn><Btn variant="secondary" onClick={onClose}>Cancelar</Btn></div>
  </div></Modal>);
}

function PortalAgregado({fec,calc,fechamentos,setFechamentos,onClose}){
  const[step,setStep]=useState("revisao");const[motivo,setMotivo]=useState("");const[nf,setNf]=useState(null);const[loading,setLoading]=useState(false);
  const nfRef=useRef();
  const commit=updates=>setFechamentos(prev=>prev.map(f=>{if(f.id!==fec.id)return f;
    const calcs=f.calculados.map(c=>c.id!==calc.id?c:{...c,...updates});
    const allDone=calcs.every(c=>c.statusAgr!=="pendente");const anyRej=calcs.some(c=>c.statusAgr==="rejeitado");
    let status=f.status;let hist=[...f.historico,{acao:`Agregado ${calc.nome}: ${updates.statusAgr}`,usuario:calc.nome,ts:now(),obs:updates.comentarioAgr||""}];
    if(allDone){if(anyRej){status="em_revisao";hist.push({acao:"Retornado p/ revisão",usuario:"Sistema",ts:now(),obs:""});}else{status="aguard_financeiro";hist.push({acao:"Todos aprovaram → financeiro",usuario:"Sistema",ts:now(),obs:""}); }}
    return{...f,calculados:calcs,status,historico:hist};}));
  const handleNF=async e=>{const file=e.target.files[0];if(!file)return;setLoading(true);const data=await readFileAsBase64(file);setNf({nome:file.name,tipo:file.type,data});setLoading(false);};
  const total=calc.totalBruto;
  return(<Modal title={`Portal do Agregado — ${calc.nome}`} onClose={onClose} wide>
    {step==="ok_aprovado"&&<div className="text-center py-8"><CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-3"/><h2 className="text-xl font-bold text-emerald-300 mb-2">Aprovado!</h2><Btn variant="secondary" onClick={onClose}>Fechar</Btn></div>}
    {step==="ok_rejeitado"&&<div className="text-center py-8"><XCircle size={48} className="text-red-400 mx-auto mb-3"/><h2 className="text-xl font-bold text-red-300 mb-2">Contestação Registrada</h2><Btn variant="secondary" onClick={onClose}>Fechar</Btn></div>}
    {!["ok_aprovado","ok_rejeitado"].includes(step)&&<div className="space-y-5">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
        <p className="text-xs text-slate-400 mb-2">{fec.periodo} · {fec.descricao}</p>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-slate-400">CTEs planilha</span><span className="text-slate-200 font-semibold">{calc.totalCTEs}</span></div>
          <div className="flex justify-between"><span className="text-emerald-400">Entregas confirmadas</span><span className="text-emerald-400 font-semibold">{calc.cteEntrega.length} CTEs · {calc.totalPacotes} pcts</span></div>
          {calc.cteOutros?.length>0&&<div className="flex justify-between"><span className="text-slate-500">Outros eventos (não computados)</span><span className="text-slate-500">{calc.cteOutros.length}</span></div>}
          {calc.vDiaria>0&&<div className="flex justify-between"><span className="text-slate-400">Diária</span><span className="text-amber-400 font-semibold">{fmt(calc.vDiaria)}</span></div>}
          {calc.vPacotes>0&&<div className="flex justify-between"><span className="text-slate-400">{calc.tipoPagamento==="diaria_excedente"?`${calc.totalPacotes} pcts (${calc.minimoPackotes} mín + ${calc.excedente} exced.) × ${fmt(calc.valorPorPacote)}`:`${calc.totalPacotes} pcts × ${fmt(calc.valorPorPacote)}`}</span><span className="text-emerald-400 font-semibold">{fmt(calc.vPacotes)}</span></div>}
          {calc.correcoes.map(cr=><div key={cr.id} className="flex justify-between"><span className="text-blue-400 text-xs">Correção: {cr.cte}</span><span className={`text-xs font-semibold ${cr.valor>=0?"text-emerald-400":"text-red-400"}`}>{cr.valor>=0?"+":""}{fmt(cr.valor)}</span></div>)}
          <div className="flex justify-between pt-1 border-t border-slate-700 font-bold"><span className="text-slate-100">TOTAL A RECEBER</span><span className="text-emerald-400 text-xl">{fmt(total)}</span></div>
        </div>
      </div>
      <div className="max-h-36 overflow-y-auto"><p className="text-xs font-semibold text-slate-400 mb-1">CTEs de entrega:</p>
        {calc.cteEntrega.map((c,i)=><div key={i} className="flex justify-between text-xs py-1 border-b border-slate-700/40"><span className="text-blue-400 font-mono">{c.ncte}</span><span className="text-slate-400">{c.data}</span><span className="text-emerald-400">{c.qPacotes} pcts</span></div>)}
      </div>
      {step==="revisao"&&<div className="flex gap-3">
        <Btn variant="success" size="lg" className="flex-1 justify-center" onClick={()=>setStep("aprovacao")}><Check size={16}/>Concordo</Btn>
        <Btn variant="danger" size="lg" className="flex-1 justify-center" onClick={()=>setStep("rejeicao")}><X size={16}/>Contestar</Btn>
      </div>}
      {step==="aprovacao"&&<div className="space-y-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
        <p className="text-sm font-semibold text-emerald-300">Anexe a NF — valor: {fmt(total)}</p>
        <div className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer ${nf?"border-emerald-500/50":"border-slate-600 hover:border-emerald-500/30"}`} onClick={()=>nfRef.current?.click()}>
          {nf?<><CheckCircle2 size={22} className="text-emerald-400 mx-auto mb-1"/><p className="text-sm text-emerald-300 font-semibold">{nf.nome}</p></>:<><Upload size={22} className="text-slate-500 mx-auto mb-1"/><p className="text-sm text-slate-400">Clique para anexar NF (PDF/imagem)</p></>}
        </div>
        <input ref={nfRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleNF}/>
        <div className="flex gap-2"><Btn variant="success" size="lg" className="flex-1 justify-center" disabled={!nf||loading} onClick={()=>{commit({statusAgr:"aprovado",notaFiscal:nf,comentarioAgr:""});setStep("ok_aprovado");}}><Check size={16}/>{loading?"Aguarde...":"Confirmar e Enviar NF"}</Btn><Btn variant="ghost" onClick={()=>setStep("revisao")}>Voltar</Btn></div>
      </div>}
      {step==="rejeicao"&&<div className="space-y-3 bg-red-500/5 border border-red-500/20 rounded-xl p-4">
        <p className="text-sm font-semibold text-red-300">Motivo da contestação:</p>
        <TA placeholder="Descreva o que está incorreto..." rows={4} value={motivo} onChange={e=>setMotivo(e.target.value)}/>
        <div className="flex gap-2"><Btn variant="danger" size="lg" className="flex-1 justify-center" disabled={!motivo.trim()} onClick={()=>{commit({statusAgr:"rejeitado",comentarioAgr:motivo});setStep("ok_rejeitado");}}><X size={16}/>Enviar Contestação</Btn><Btn variant="ghost" onClick={()=>setStep("revisao")}>Voltar</Btn></div>
      </div>}
    </div>}
  </Modal>);
}

function FechamentoDetalhe({fec,user,fechamentos,setFechamentos,motoristas,onBack}){
  const[tab,setTab]=useState("resumo");const[showCorr,setShowCorr]=useState(null);const[showPortal,setShowPortal]=useState(null);const[rejectTxt,setRejectTxt]=useState("");const[showReject,setShowReject]=useState(false);
  const comprovanteRef=useRef();
  const upd=ch=>setFechamentos(p=>p.map(f=>f.id===fec.id?{...f,...ch}:f));
  const addHist=(acao,obs="")=>[...fec.historico,{acao,usuario:user.name,ts:now(),obs}];
  const total=fec.calculados.reduce((s,c)=>s+c.totalBruto,0);
  const s=FECH_STATUS[fec.status]||FECH_STATUS.em_revisao;
  const canSubmit=fec.status==="em_revisao"&&["operator","area_manager","director"].includes(user.role);
  const canApprGest=fec.status==="aguard_gestor"&&["area_manager","director"].includes(user.role);
  const canFinancial=fec.status==="aguard_financeiro"&&(userHasFinancial(user)||user.role==="area_manager"||user.role==="director");
  const canCorrecao=fec.status==="em_revisao"&&user.role!=="auditor";
  const addCorrecao=(cid,corr)=>{const calcs=fec.calculados.map(c=>{if(c.id!==cid)return c;const nc=[...c.correcoes,{...corr,criadoPor:user.name}];const tc=nc.reduce((s,x)=>s+x.valor,0);return{...c,correcoes:nc,totalCorrecoes:tc,totalBruto:c.subtotal+tc};});upd({calculados:calcs,historico:addHist("Correção manual",`CTE: ${corr.cte}`)});setShowCorr(null);};
  const removeCorrecao=(cid,rid)=>{const calcs=fec.calculados.map(c=>{if(c.id!==cid)return c;const nc=c.correcoes.filter(x=>x.id!==rid);const tc=nc.reduce((s,x)=>s+x.valor,0);return{...c,correcoes:nc,totalCorrecoes:tc,totalBruto:c.subtotal+tc};});upd({calculados:calcs});};
  const portalCalc=showPortal?fec.calculados.find(c=>c.id===showPortal):null;
  return(<div className="p-6 space-y-5 max-w-4xl">
    {showPortal&&portalCalc&&<PortalAgregado fec={fec} calc={portalCalc} fechamentos={fechamentos} setFechamentos={setFechamentos} onClose={()=>setShowPortal(null)}/>}
    <div className="flex items-center gap-3">
      <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 flex-shrink-0"><ArrowLeft size={18}/></button>
      <div className="flex-1"><div className="flex items-center gap-2 flex-wrap"><h1 className="text-lg font-bold text-slate-100">{fec.descricao}</h1><Badge color={s.cor}>{s.label}</Badge></div><p className="text-xs text-slate-400">{fec.periodo} · {fec.criadoNome} · {fmtDate(fec.criadoEm)}</p></div>
      <p className="text-xl font-bold text-emerald-400">{fmt(total)}</p>
    </div>
    {fec.motivoRejeicao&&fec.status==="em_revisao"&&<div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3"><AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5"/><div><p className="text-sm font-semibold text-red-300">Retornado para revisão</p><p className="text-xs text-red-400 mt-0.5">{fec.motivoRejeicao}</p></div></div>}
    {!["pago","cancelado"].includes(fec.status)&&<div className={`rounded-xl border-2 p-4 ${(canSubmit||canApprGest||canFinancial)?"border-amber-500/40 bg-amber-500/5":"border-slate-700 bg-slate-800"}`}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${(canSubmit||canApprGest||canFinancial)?"bg-amber-400 animate-pulse":"bg-slate-600"}`}/><p className="text-sm font-semibold text-slate-200">{canSubmit?"Pronto para avançar":canApprGest?"Aguardando sua aprovação":fec.status==="aguard_agregados"?"Aguardando agregados":canFinancial?"Aprovado — realize o pagamento":"Aguardando outro perfil"}</p></div>
        <div className="flex gap-2 flex-wrap">
          {canSubmit&&<Btn onClick={()=>upd({status:user.role==="operator"?"aguard_gestor":"aguard_agregados",historico:addHist(user.role==="operator"?"Enviado p/ gestor":"Enviado p/ agregados")})}><ChevronRight size={14}/>Enviar para {user.role==="operator"?"Gestor":"Agregados"}</Btn>}
          {canApprGest&&!showReject&&<><Btn variant="success" onClick={()=>upd({status:"aguard_agregados",historico:addHist("Aprovado → agregados")})}><Check size={14}/>Aprovar → Agregados</Btn><Btn variant="danger" onClick={()=>setShowReject(true)}><X size={14}/>Rejeitar</Btn></>}
          {canFinancial&&<><Btn variant="success" onClick={()=>comprovanteRef.current?.click()}><CreditCard size={14}/>Confirmar Pagamento + Comprovante</Btn><input ref={comprovanteRef} type="file" accept="image/*,.pdf" className="hidden" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;const data=await readFileAsBase64(file);upd({status:"pago",dataPagamento:now(),comprovante:{nome:file.name,tipo:file.type,data},historico:addHist("Pago",file.name)});}}/></>}
        </div>
      </div>
      {showReject&&<div className="mt-3 space-y-2"><TA label="Motivo *" placeholder="O que precisa ser corrigido?" rows={3} value={rejectTxt} onChange={e=>setRejectTxt(e.target.value)}/><div className="flex gap-2"><Btn variant="danger" onClick={()=>{if(!rejectTxt.trim())return;upd({status:"em_revisao",motivoRejeicao:rejectTxt,historico:addHist("Rejeitado",rejectTxt)});setShowReject(false);setRejectTxt("");}} disabled={!rejectTxt.trim()} className="flex-1 justify-center"><X size={14}/>Confirmar Rejeição</Btn><Btn variant="ghost" onClick={()=>setShowReject(false)}>Cancelar</Btn></div></div>}
    </div>}
    {fec.status==="pago"&&<div className="bg-emerald-500/5 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3"><CheckCircle2 size={20} className="text-emerald-400"/><div><p className="text-sm font-semibold text-emerald-300">Pago em {fmtDate(fec.dataPagamento)}</p>{fec.comprovante&&<p className="text-xs text-emerald-400/70">{fec.comprovante.nome}</p>}</div></div>}
    <div className="flex gap-2 flex-wrap">{[["resumo","Resumo"],["motoristas","Por Motorista"],["ctes","CTEs Planilha"],["historico","Histórico"]].map(([v,l])=><button key={v} onClick={()=>setTab(v)} className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-all ${tab===v?"bg-amber-500 text-slate-900 border-amber-500":"bg-slate-800 text-slate-400 border-slate-700"}`}>{l}</button>)}</div>
    {tab==="resumo"&&<div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4"><p className="text-xs text-slate-400 mb-1">Total a Pagar</p><p className="text-xl font-bold text-emerald-400">{fmt(total)}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-400 mb-1">Motoristas</p><p className="text-xl font-bold text-slate-100">{fec.calculados.length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-400 mb-1">CTEs planilha</p><p className="text-xl font-bold text-slate-100">{fec.linhas.length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-400 mb-1">Entregas (evento)</p><p className="text-xl font-bold text-emerald-400">{fec.linhas.filter(l=>l.evento==="entrega").length}</p></Card>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4"><p className="text-xs font-bold text-slate-400 mb-2">Breakdown</p><div className="space-y-1 text-sm"><div className="flex justify-between"><span className="text-slate-300">Diárias</span><span className="text-amber-400 font-semibold">{fmt(fec.calculados.reduce((s,c)=>s+c.vDiaria,0))}</span></div><div className="flex justify-between"><span className="text-slate-300">Pacotes</span><span className="text-emerald-400 font-semibold">{fmt(fec.calculados.reduce((s,c)=>s+c.vPacotes,0))}</span></div><div className="flex justify-between"><span className="text-slate-300">Correções</span><span className="text-blue-400 font-semibold">{fmt(fec.calculados.reduce((s,c)=>s+c.totalCorrecoes,0))}</span></div><div className="flex justify-between border-t border-slate-700 pt-1 font-bold"><span className="text-slate-100">Total</span><span className="text-emerald-400">{fmt(total)}</span></div></div></Card>
        <Card className="p-4"><p className="text-xs font-bold text-slate-400 mb-2">Status Agregados</p>{[["pendente","Pendente","#f59e0b"],["aprovado","Aprovado","#10b981"],["rejeitado","Rejeitado","#ef4444"]].map(([k,l,c])=><div key={k} className="flex justify-between text-sm py-0.5"><span style={{color:c}}>{l}</span><span className="font-semibold text-slate-300">{fec.calculados.filter(x=>x.statusAgr===k).length}</span></div>)}</Card>
      </div>
      {fec.naoMapeados?.length>0&&<div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3"><p className="text-xs font-semibold text-amber-400 mb-1">⚠ Sem cadastro ({fec.naoMapeados.length}):</p>{fec.naoMapeados.map(m=><p key={m.matricula} className="text-xs text-amber-300">• Mat. {m.matricula} — {m.nome}</p>)}</div>}
    </div>}
    {tab==="motoristas"&&<div className="space-y-3">{fec.calculados.map(c=>(<Card key={c.id} className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div><div className="flex items-center gap-2 flex-wrap"><p className="font-semibold text-slate-100">{c.nome}</p><Badge color="#60a5fa">Mat: {c.matricula}</Badge><Badge color={c.statusAgr==="aprovado"?"#10b981":c.statusAgr==="rejeitado"?"#ef4444":"#f59e0b"}>{c.statusAgr==="aprovado"?"✓ Aprovado":c.statusAgr==="rejeitado"?"✗ Rejeitado":"Aguardando"}</Badge>{c.notaFiscal&&<Badge color="#10b981">NF Anexada</Badge>}</div>
          <div className="grid grid-cols-3 gap-3 mt-1.5 text-xs"><span className="text-slate-400">CTEs: <span className="text-slate-200 font-semibold">{c.totalCTEs}</span></span><span className="text-slate-400">Entregas: <span className="text-emerald-400 font-semibold">{c.cteEntrega.length}</span></span><span className="text-slate-400">Pacotes: <span className="text-emerald-400 font-semibold">{c.totalPacotes}</span></span></div>
          <div className="flex gap-3 mt-1 text-xs flex-wrap">{c.vDiaria>0&&<span className="text-amber-400">Diária: {fmt(c.vDiaria)}</span>}{c.tipoPagamento==="diaria_excedente"&&c.excedente!=null?<span className="text-emerald-400">{c.totalPacotes} pcts ({c.minimoPackotes} mín + {c.excedente} exced.) × {fmt(c.valorPorPacote)} = {fmt(c.vPacotes)}</span>:c.vPacotes>0&&<span className="text-emerald-400">{c.totalPacotes} × {fmt(c.valorPorPacote)} = {fmt(c.vPacotes)}</span>}{c.totalCorrecoes!==0&&<span className="text-blue-400">Correções: {fmt(c.totalCorrecoes)}</span>}</div>
          {c.comentarioAgr&&<p className="text-xs text-slate-400 mt-1 italic">"{c.comentarioAgr}"</p>}
          {c.correcoes.length>0&&<div className="mt-2 space-y-1">{c.correcoes.map(cr=><div key={cr.id} className="flex items-center justify-between bg-slate-900 rounded px-2 py-1.5 border border-blue-500/20"><div><p className="text-xs font-semibold text-blue-300">CTE: {cr.cte}</p><p className="text-xs text-slate-400">{cr.justificativa}</p></div><div className="flex items-center gap-2"><span className={`text-xs font-bold ${cr.valor>=0?"text-emerald-400":"text-red-400"}`}>{cr.valor>=0?"+":""}{fmt(cr.valor)}</span>{canCorrecao&&<button onClick={()=>removeCorrecao(c.id,cr.id)} className="text-slate-600 hover:text-red-400"><Trash2 size={12}/></button>}</div></div>)}</div>}
        </div>
        <div className="text-right flex-shrink-0"><p className="text-xl font-bold text-emerald-400">{fmt(c.totalBruto)}</p><div className="flex gap-2 mt-2 justify-end flex-wrap">{canCorrecao&&<Btn size="sm" variant="secondary" onClick={()=>setShowCorr(c.id)}><Plus size={12}/>CTE Manual</Btn>}{fec.status==="aguard_agregados"&&c.statusAgr==="pendente"&&<Btn size="sm" variant="ghost" onClick={()=>setShowPortal(c.id)}><ExternalLink size={12}/>Portal Agr.</Btn>}</div></div>
      </div>
    </Card>))}</div>}
    {tab==="ctes"&&<Card><div className="overflow-x-auto max-h-[480px]"><table className="w-full text-xs"><thead className="sticky top-0 bg-slate-800 border-b border-slate-700"><tr>{["Matrícula","Nome","CTE","Pcts","Evento","Data","Modalidade"].map(h=><th key={h} className="text-left text-slate-400 px-3 py-2 font-semibold whitespace-nowrap">{h}</th>)}</tr></thead><tbody>{fec.linhas.map((l,i)=><tr key={i} className={`border-b border-slate-700/40 hover:bg-slate-700/20 ${l.evento==="entrega"?"":"opacity-50"}`}><td className="px-3 py-1.5 text-slate-400">{l.matricula}</td><td className="px-3 py-1.5 text-slate-200 whitespace-nowrap">{l.nomeOper}</td><td className="px-3 py-1.5 text-blue-400 font-mono">{l.ncte}</td><td className="px-3 py-1.5 text-center">{l.qPacotes}</td><td className="px-3 py-1.5"><span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${l.evento==="entrega"?"bg-emerald-500/20 text-emerald-400":"bg-slate-700 text-slate-400"}`}>{l.evento}</span></td><td className="px-3 py-1.5 text-slate-400">{l.data}</td><td className="px-3 py-1.5 text-slate-400">{l.modalidade}</td></tr>)}</tbody></table></div></Card>}
    {tab==="historico"&&<div className="space-y-2">{[...fec.historico].reverse().map((h,i)=><div key={i} className="flex gap-3 p-3 bg-slate-900 rounded-lg border border-slate-700"><div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0"/><div><div className="flex items-center gap-2"><p className="text-sm font-semibold text-slate-200">{h.acao}</p><span className="text-xs text-slate-500">{fmtDate(h.ts)}</span></div><p className="text-xs text-slate-400">{h.usuario}{h.obs?` — ${h.obs}`:""}</p></div></div>)}</div>}
    {showCorr&&<CorrecaoModal nome={fec.calculados.find(c=>c.id===showCorr)?.nome||""} onClose={()=>setShowCorr(null)} onSave={corr=>addCorrecao(showCorr,corr)}/>}
  </div>);
}

function FechamentoView({user,fechamentos,setFechamentos,motoristas,setMotoristas}){
  const[subView,setSubView]=useState("lista");const[showNovo,setShowNovo]=useState(false);const[selectedId,setSelectedId]=useState(null);
  const selected=selectedId?fechamentos.find(f=>f.id===selectedId):null;
  if(selected)return<FechamentoDetalhe fec={selected} user={user} fechamentos={fechamentos} setFechamentos={setFechamentos} motoristas={motoristas} onBack={()=>setSelectedId(null)}/>;
  return(<div className="p-6 space-y-5">
    <div className="flex items-center justify-between"><div><h1 className="text-xl font-bold text-slate-100">Fechamento de Entregas</h1><p className="text-sm text-slate-400">{fechamentos.length} fechamento(s)</p></div>
      <div className="flex gap-2">{["director","area_manager"].includes(user.role)&&<Btn variant="secondary" size="sm" onClick={()=>setSubView(subView==="lista"?"motoristas":"lista")}><Truck size={13}/>{subView==="lista"?"Motoristas":"← Fechamentos"}</Btn>}{user.role!=="auditor"&&subView==="lista"&&<Btn onClick={()=>setShowNovo(true)}><Plus size={14}/>Novo Fechamento</Btn>}</div>
    </div>
    {subView==="motoristas"&&<MotoristasView motoristas={motoristas} setMotoristas={setMotoristas}/>}
    {subView==="lista"&&<>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">{Object.entries(FECH_STATUS).map(([k,v])=><div key={k} className="bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-center"><p className="text-lg font-bold" style={{color:v.cor}}>{fechamentos.filter(f=>f.status===k).length}</p><p className="text-xs text-slate-500 mt-0.5 leading-tight">{v.label}</p></div>)}</div>
      <div className="space-y-3">
        {fechamentos.length===0&&<div className="text-center py-16 text-slate-500"><Truck size={40} className="mx-auto mb-3 text-slate-700"/><p>Nenhum fechamento ainda.</p><p className="text-sm mt-1">Clique em "Novo Fechamento" para carregar uma planilha.</p></div>}
        {[...fechamentos].reverse().map(f=>{const s=FECH_STATUS[f.status]||FECH_STATUS.em_revisao;const total=f.calculados.reduce((a,c)=>a+c.totalBruto,0);const pendAgr=f.calculados.filter(c=>c.statusAgr==="pendente").length;
          return(<div key={f.id} onClick={()=>setSelectedId(f.id)} style={{cursor:"pointer"}} className="bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-amber-500/40 group transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0"><div className="flex items-center gap-2 mb-1 flex-wrap"><Badge color={s.cor}>{s.label}</Badge>{f.status==="aguard_agregados"&&pendAgr>0&&<span className="text-xs text-purple-400 animate-pulse font-semibold">● {pendAgr} aguardando</span>}</div>
                <p className="font-semibold text-slate-100">{f.descricao}</p><div className="flex gap-4 mt-1 text-xs text-slate-500 flex-wrap"><span>{f.calculados.length} motoristas</span><span>{f.linhas.length} CTEs</span><span>{fmtDate(f.criadoEm)}</span></div>
              </div>
              <div className="flex flex-col items-end gap-1"><span className="text-xs text-amber-400 opacity-0 group-hover:opacity-100 font-semibold">Abrir →</span><p className="text-lg font-bold text-emerald-400">{fmt(total)}</p></div>
            </div>
          </div>);
        })}
      </div>
    </>}
    {showNovo&&<NovoFechamentoModal motoristas={motoristas} user={user} onClose={()=>setShowNovo(false)} onSave={f=>{setFechamentos(p=>[...p,f]);setShowNovo(false);setSelectedId(f.id);}}/>}
  </div>);
}

export default function OpsControl() {
  useEffect(()=>{
    if(!localStorage.getItem("ops3_init")){
      Object.entries(SEED).forEach(([k,v])=>localStorage.setItem(`ops3_${k}`,JSON.stringify(v)));
      localStorage.setItem("ops3_init","1");
    }
    // Migrate: add forecastEntries if missing
    if(!localStorage.getItem("ops3_forecastEntries")){
      localStorage.setItem("ops3_forecastEntries", JSON.stringify(SEED.forecastEntries));
    }
    if(!localStorage.getItem("ops3_motoristas")){
      localStorage.setItem("ops3_motoristas", JSON.stringify(SEED.motoristas));
    }
    if(!localStorage.getItem("ops3_fechamentos")){
      localStorage.setItem("ops3_fechamentos", JSON.stringify(SEED.fechamentos));
    }
  },[]);

  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState("dashboard");
  const [openTaskId, setOpenTaskId] = useState(null);

  const [areas]    = useLS("areas",    SEED.areas);
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

  const navigateToTask = id => { setOpenTaskId(id); setView("tasks"); };

  if(!currentUser) return <LoginScreen users={users} onLogin={u=>{setCurrentUser(u);setView("dashboard");}}/>;

  // Keep current user fresh (e.g., after financial access changes)
  const liveUser = users.find(u=>u.id===currentUser.id)||currentUser;

  const hasF = userHasFinancial(liveUser);

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden" style={{fontFamily:"'IBM Plex Sans',sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap'); *{box-sizing:border-box;}`}</style>
      <Sidebar user={liveUser} view={view} setView={setView} onLogout={()=>{setCurrentUser(null);setView("dashboard");}} areas={areas}/>
      <main className="flex-1 overflow-y-auto">
        {view==="dashboard"&&<DashboardView user={liveUser} tasks={tasks} fixedCosts={fixedCosts} costEntries={costEntries} revenues={revenues} clients={clients} templates={templates} areas={areas} setView={setView} onOpenTask={navigateToTask}/>}
        {view==="tasks"&&<TasksView user={liveUser} tasks={tasks} setTasks={setTasks} templates={templates} clients={clients} areas={areas} users={users} initialOpenId={openTaskId} onClearOpenId={()=>setOpenTaskId(null)}/>}
        {view==="costs"&&hasF&&<CostsView user={liveUser} fixedCosts={fixedCosts} setFixedCosts={setFixedCosts} costEntries={costEntries} setCostEntries={setCostEntries} clients={clients}/>}
        {view==="revenue"&&hasF&&<RevenueView user={liveUser} revenues={revenues} setRevenues={setRevenues} clients={clients}/>}
        {view==="profitability"&&hasF&&<ProfitabilityView clients={clients} fixedCosts={fixedCosts} costEntries={costEntries} revenues={revenues} tasks={tasks}/>}
        {view==="forecast"&&hasF&&<ForecastView clients={clients} revenues={revenues} forecastEntries={forecastEntries} setForecastEntries={setForecastEntries}/>}
        {view==="fechamento"&&<FechamentoView user={liveUser} fechamentos={fechamentos} setFechamentos={setFechamentos} motoristas={motoristas} setMotoristas={setMotoristas}/>}
        {view==="admin"&&liveUser.role==="director"&&<AdminView areas={areas} users={users} setUsers={setUsers} clients={clients} setClients={setClients} templates={templates} setTemplates={setTemplates}/>}
        {(["costs","revenue","profitability","forecast"].includes(view)&&!hasF)&&(
          <div className="p-6 flex items-center justify-center h-full">
            <Card className="p-10 text-center max-w-sm">
              <Lock size={36} className="text-slate-600 mx-auto mb-3"/>
              <p className="text-slate-300 font-semibold mb-1">Acesso Restrito</p>
              <p className="text-slate-500 text-sm">Esta área requer autorização do Diretor. Entre em contato com a administração.</p>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
