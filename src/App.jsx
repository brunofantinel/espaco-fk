/**
 * --- INSTRUÇÕES PARA O SUPABASE (SQL) ---
 * Agora usamos apenas UMA tabela para tudo. 
 * Copie e rode este código no seu SQL Editor para simplificar seu banco:
 * * -- 1. Criar a tabela única de agendamentos
 * create table if not exists bookings (
 * id text primary key,
 * created_at timestamp with time zone default now(),
 * professional_id text not null,
 * service_id text not null,
 * date text not null,
 * time text not null,
 * client_name text not null,
 * client_phone text not null,
 * professional_name text,
 * service_name text,
 * price_label text,
 * status text default 'confirmado',
 * user_id uuid
 * );
 * * -- 2. Criar um índice de unicidade para evitar agendamentos duplicados no mesmo horário
 * create unique index if not exists unique_booking_slot 
 * on bookings (professional_id, date, time);
 * * -- 3. Liberar as permissões de acesso (RLS)
 * ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
 * DROP POLICY IF EXISTS "Acesso total público" ON bookings;
 * CREATE POLICY "Acesso total público" ON bookings FOR ALL USING (true) WITH CHECK (true);
 * * -- 4. Habilitar Realtime
 * ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
 */

// ✅ 1) No topo do arquivo (imports)
import React, { useState, useEffect } from "react";
import { supabase } from "./utils/supabase";
import salaoImg from "./assets/salao.jpg";

import {
  Calendar, CheckCircle, Menu, X, Instagram, Phone, MapPin,
  Lock, Sparkles, RefreshCw, Trash2
} from "lucide-react";



const INITIAL_PROFESSIONALS = [
  { id: 'kelly', name: 'Kelly', specialties: ['Cabelo', 'Unhas', 'Tratamentos'], order: 1 },
  { id: 'erica', name: 'Erica', specialties: ['Sobrancelhas', 'Depilação'], order: 2 },
  { id: 'julia', name: 'Julia', specialties: ['Unhas', 'Alongamento'], order: 3 },
  { id: 'manuela', name: 'Manuela', specialties: ['Cílios'], order: 4 },
  { id: 'lais', name: 'Lais', specialties: ['Unhas', 'Esmaltação'], order: 5 },
  { id: 'samy', name: 'Samy', specialties: ['Cabelo', 'Corte', 'Manicure e Pedicure'], order: 6 },
];

const INITIAL_SERVICES = [
  // --- KELLY ---
  { id: 'k-1', professionalId: 'kelly', category: 'Alisamento', name: 'Semi definitiva', description: 'Alisamento com redução de volume, fios mais lisos e brilho intenso.', priceLabel: 'A partir de R$ 200' },
  { id: 'k-2', professionalId: 'kelly', category: 'Tratamento', name: 'Hidratação + escova', description: 'Reposição hídrica para restaurar maciez e brilho.', priceLabel: 'R$ 80' },
  { id: 'k-3', professionalId: 'kelly', category: 'Tratamento', name: 'Botox capilar', description: 'Sela as cutículas, alinha os fios e elimina o frizz.', priceLabel: 'A partir de R$ 120' },
  { id: 'k-4', professionalId: 'kelly', category: 'Escova', name: 'Escova simples', description: 'Escova modeladora para alisar e dar forma aos fios.', priceLabel: 'R$ 50' },
  { id: 'k-5', professionalId: 'kelly', category: 'Coloração', name: 'Coloração + escova', description: 'Aplicação da cor desejada seguida de escova modeladora.', priceLabel: 'R$ 100' },
  { id: 'k-6', professionalId: 'kelly', category: 'Coloração', name: 'Coloração (tinta cliente) + escova', description: 'Utilização da coloração fornecida pela cliente.', priceLabel: 'R$ 80' },
  { id: 'k-7', professionalId: 'kelly', category: 'Alongamento', name: 'Alongamento de fibra formato quadrado', description: 'Unhas mais marcadas e elegantes.', priceLabel: 'R$ 170' },
  { id: 'k-8', professionalId: 'kelly', category: 'Alongamento', name: 'Alongamento de fibra outros formatos', description: 'Formatos como amendoado ou stiletto.', priceLabel: 'R$ 200' },
  { id: 'k-9', professionalId: 'kelly', category: 'Manutenção', name: 'Manutenção de fibra', description: 'Garante durabilidade e aparência impecável.', priceLabel: 'R$ 130' },
  { id: 'k-10', professionalId: 'kelly', category: 'Tratamento', name: 'Banho de gel com esmaltação em gel', description: 'Fortalece as unhas naturais com brilho duradouro.', priceLabel: 'R$ 100' },
  { id: 'k-11', professionalId: 'kelly', category: 'Esmaltação', name: 'Esmaltação em gel (mãos)', description: 'Alta durabilidade e brilho (15 a 20 dias).', priceLabel: 'R$ 70' },
  { id: 'k-12', professionalId: 'kelly', category: 'Esmaltação', name: 'Esmaltação em gel (pés)', description: 'Durabilidade prolongada e acabamento profissional.', priceLabel: 'R$ 90' },
  { id: 'k-13', professionalId: 'kelly', category: 'Tratamento', name: 'Nutrição ou reconstrução', description: 'Tratamento intensivo para fios danificados.', priceLabel: 'R$ 90' },
  { id: 'k-14', professionalId: 'kelly', category: 'Escova', name: 'Escova e chapinha', description: 'Finalização completa para efeito liso prolongado.', priceLabel: 'R$ 70' },

  // --- ERICA ---
  { id: 'e-1', professionalId: 'erica', category: 'Design', name: 'Design simples', description: 'Modelagem com pinça ou cera realçando o olhar.', priceLabel: 'R$ 30' },
  { id: 'e-2', professionalId: 'erica', category: 'Design', name: 'Design com henna', description: 'Aplicação de henna para preenchimento e definição.', priceLabel: 'R$ 50' },
  { id: 'e-3', professionalId: 'erica', category: 'Depilação', name: 'Buço', description: 'Remoção com cera rápida e eficaz.', priceLabel: 'R$ 15' },
  { id: 'e-4', professionalId: 'erica', category: 'Depilação', name: 'Axila', description: 'Pele lisinha e livre de pelos.', priceLabel: 'R$ 25' },
  { id: 'e-5', professionalId: 'erica', category: 'Depilação', name: '1/2 perna', description: 'Remoção da parte inferior das pernas.', priceLabel: 'R$ 40' },
  { id: 'e-6', professionalId: 'erica', category: 'Depilação', name: 'Perna completa', description: 'Liberdade por mais tempo com pernas lisas.', priceLabel: 'R$ 50' },
  { id: 'e-7', professionalId: 'erica', category: 'Depilação', name: 'Nariz', description: 'Remoção segura e discreta dos pelos visíveis.', priceLabel: 'R$ 20' },
  { id: 'e-8', professionalId: 'erica', category: 'Epilação', name: 'Epilação virilha completa', description: 'Técnica eficaz e confortável.', priceLabel: 'R$ 80' },

  // --- JULIA ---
  { id: 'j-1', professionalId: 'julia', category: 'Tradicional', name: 'Pé e Mão', description: 'Cuidado completo das unhas com esmalte comum.', priceLabel: 'R$ 60' },
  { id: 'j-2', professionalId: 'julia', category: 'Aplicação', name: 'Esmaltação em gel', description: 'Unhas lindas por semanas sem lascar.', priceLabel: 'R$ 70' },
  { id: 'j-3', professionalId: 'julia', category: 'Aplicação', name: 'Alongamento de fibra', description: 'Fibra de vidro para acabamento natural e resistente.', priceLabel: 'R$ 170' },
  { id: 'j-4', professionalId: 'julia', category: 'Manutenção', name: 'F1', description: 'Manutenção de molde F1 mantendo a estrutura.', priceLabel: 'R$ 120' },
  { id: 'j-5', professionalId: 'julia', category: 'Alongamento', name: 'Molde F1 (aplicação)', description: 'Aplicação inicial precisa e duradoura.', priceLabel: 'R$ 150' },

  // --- MANUELA ---
  { id: 'm-1', professionalId: 'manuela', category: 'Aplicação', name: 'Volume brasileiro', description: 'Fios leves e naturais para um efeito delicado.', priceLabel: 'R$ 90' },
  { id: 'm-2', professionalId: 'manuela', category: 'Aplicação', name: 'Efeito molhado', description: 'Look marcante com aparência de cílios com rímel.', priceLabel: 'R$ 95' },
  { id: 'm-3', professionalId: 'manuela', category: 'Aplicação', name: 'Volume egípcio', description: 'Entrega volume e definição com visual exótico.', priceLabel: 'R$ 100' },
  { id: 'm-4', professionalId: 'manuela', category: 'Aplicação', name: 'Efeito glamour', description: 'Máximo volume para um olhar inesquecível.', priceLabel: 'R$ 120' },
  { id: 'm-5', professionalId: 'manuela', category: 'Manutenção', name: 'Manutenção Volume brasileiro', description: 'Reposição mantendo o efeito natural.', priceLabel: 'R$ 75' },
  { id: 'm-6', professionalId: 'manuela', category: 'Remoção', name: 'Remoção de extensão', description: 'Remoção segura sem danificar fios naturais.', priceLabel: 'R$ 25' },
  { id: 'm-7', professionalId: 'manuela', category: 'Aplicação', name: 'Volume Russo', description: 'Aplicação completa com visual marcante.', priceLabel: 'R$ 150' },
  { id: 'm-8', professionalId: 'manuela', category: 'Aplicação', name: 'Extensão Fio a fio', description: 'Técnica clássica para olhar natural.', priceLabel: 'R$ 120' },

  // --- LAIS ---
  { id: 'l-1', professionalId: 'lais', category: 'Aplicação', name: 'Esmaltação em gel', description: 'Brilho intenso e alta durabilidade.', priceLabel: 'R$ 70' },
  { id: 'l-2', professionalId: 'lais', category: 'Tratamento', name: 'Banho de gel com esmaltação', description: 'Fortalecimento com acabamento premium.', priceLabel: 'R$ 100' },
  { id: 'l-3', professionalId: 'lais', category: 'Esmaltação', name: 'Esmaltação em gel (mãos)', description: 'Durabilidade prolongada.', priceLabel: 'R$ 70' },
  { id: 'l-4', professionalId: 'lais', category: 'Esmaltação', name: 'Esmaltação em gel (pés)', description: 'Praticidade e longa duração.', priceLabel: 'R$ 90' },

  // --- SAMY ---
  { id: 's-1', professionalId: 'samy', category: 'Corte', name: 'Corte de cabelo', description: 'Técnicas modernas e acabamento profissional.', priceLabel: 'R$ 60' },
  { id: 's-2', professionalId: 'samy', category: 'Manicure e Pedicure', name: 'Manicure e Pedicure', description: 'Estilo "curi" com acabamento impecável.', priceLabel: 'R$ 60' },
  { id: 's-3', professionalId: 'samy', category: 'Alisamento', name: 'Semi definitiva', description: 'Redução de volume e brilho intenso.', priceLabel: 'A partir de R$ 200' },
  { id: 's-4', professionalId: 'samy', category: 'Escova', name: 'Escova simples', description: 'Alisa e dá forma aos fios.', priceLabel: 'R$ 50' },
];

// --- COMPONENTES DE UI ---
const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false }) => {
  const base = "px-6 py-3 rounded-full font-semibold transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:scale-100 uppercase tracking-widest text-xs";
  const variants = {
    primary: "bg-gradient-to-r from-[#F472B6] via-[#EC4899] to-[#BE185D] hover:brightness-105 text-white shadow-xl shadow-pink-300/50",
    secondary: "bg-[#1A1A1A] hover:bg-black text-white",
    outline: "border-2 border-[#EC4899] text-[#EC4899] hover:bg-[#FCE7F3]",
    ghost: "text-stone-400 hover:text-stone-900",
    danger: "bg-red-500 hover:bg-red-600 text-white",
  };
  return <button onClick={onClick} className={`${base} ${variants[variant]} ${className}`} disabled={disabled}>{children}</button>;
};

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-3xl p-6 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.15)] border border-pink-300 ${className}`}>{children}</div>
);

const SectionTitle = ({ title, subtitle }) => (
  <div className="mb-12 text-center">
    <h2 className="text-3xl md:text-4xl font-serif text-stone-900 mb-2 uppercase tracking-[0.2em]">{title}</h2>
    <div className="h-[2px] w-16 bg-gradient-to-r from-transparent via-[#EC4899] to-transparent mx-auto mb-4"></div>
    {subtitle && <p className="text-stone-500 max-w-lg mx-auto italic font-light">{subtitle}</p>}
  </div>
);

// --- COMPONENTE PRINCIPAL ---
export default function App() {
  const [view, setView] = useState('home'); 
  // We no longer maintain a separate supabaseClient in state. The imported
  // `supabase` instance from `./utils/supabase` will be used directly for all
  // database interactions.
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
  let cancelled = false;

  (async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (cancelled) return;

    setUser(session?.user ?? null);

    if (!session) {
      try { await supabase.auth.signInAnonymously(); } catch (_) {}
    }

    setLoading(false);
  })();

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user ?? null);
  });

  return () => {
    cancelled = true;
    subscription?.unsubscribe();
  };
}, []);


  const navigate = (to) => { setView(to); setIsMenuOpen(false); if (typeof window !== 'undefined') window.scrollTo(0, 0); };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#FCE7F3]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#EC4899]"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FCE7F3] text-stone-900 font-sans">
      <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-lg z-50 border-b border-pink-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex flex-col cursor-pointer" onClick={() => navigate('home')}>
            <span className="text-xl font-serif tracking-widest text-stone-900 uppercase">Espaço F&K</span>
            <span className="text-[9px] uppercase tracking-[0.3em] text-[#EC4899] font-bold">por Kelly Rodrigues</span>
          </div>
          <div className="hidden md:flex items-center gap-10 text-[11px] uppercase tracking-[0.2em] font-semibold">
            <button onClick={() => navigate('home')} className={view === 'home' ? 'text-[#EC4899]' : 'text-stone-500'}>Início</button>
            <button onClick={() => navigate('services')} className={view === 'services' ? 'text-[#EC4899]' : 'text-stone-500'}>Serviços</button>
            <button onClick={() => navigate('booking')} className={view === 'booking' ? 'text-[#EC4899]' : 'text-stone-500'}>Agendar</button>
            <div className="w-[1px] h-4 bg-pink-300"></div>
            <button onClick={() => navigate('admin')} className="text-stone-400 hover:text-[#EC4899] flex items-center gap-1"><Lock size={10} /> Admin</button>
          </div>
          <button className="md:hidden text-stone-900" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      <main className="pt-20">
        {view === 'home' && <HomeView onNavigate={navigate} />}
        {view === 'services' && <ServicesView onBooking={() => navigate('booking')} />}
        {view === 'booking' && <BookingView user={user} supabase={supabase} />}
        {view === 'admin' && <AdminView supabase={supabase} />}
      </main>

      {/* --- FOOTER ATUALIZADO --- */}
      <footer className="bg-[#111] text-white py-12 px-6">
        <div className="max-w-7xl mx-auto text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-xl font-serif tracking-widest mb-4 uppercase">Espaço F&K</h3>
            <p className="text-stone-500 text-sm italic font-light tracking-wide mb-6">Beleza em cada detalhe.</p>
            <a 
              href="https://www.instagram.com/kellyrodrigues.fk/?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw%3D%3D#" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-3 bg-gradient-to-r from-[#F472B6] to-[#BE185D] px-6 py-2 rounded-full font-bold text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-pink-900/20"
            >
              <Instagram size={18} /> Siga no Instagram
            </a>
          </div>
          
          <div className="flex flex-col items-center md:items-start max-w-sm">
            <h4 className="text-[10px] font-bold mb-4 uppercase tracking-[0.3em] text-[#EC4899] flex items-center gap-2">
              <MapPin size={12} /> Localização
            </h4>
            <p className="text-stone-400 text-sm leading-relaxed italic font-light text-center md:text-left">
              R. João da Silva Bueno, 320 - sala 8 - Morro Santana, <br />
              Porto Alegre - RS, 91260-020
            </p>
            <p className="text-stone-500 text-[10px] mt-4 flex items-center gap-2">
              <Phone size={10} /> (51) 99186-0337
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-2">
            <button onClick={() => navigate('admin')} className="text-[9px] text-stone-700 hover:text-[#EC4899] uppercase tracking-widest transition-colors mb-2">Painel Administrativo</button>
            <p className="text-[9px] text-stone-800 uppercase tracking-[0.4em]">© 2025 Espaço F&K</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// --- VIEWS ---

// ✅ 2) Só essa parte do HomeView (imagem de fundo)
function HomeView({ onNavigate }) {
  return (
    <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-stone-900/40 z-10"></div>

      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${salaoImg})` }}
      ></div>

      <div className="relative z-20 text-center px-6">
        <h2 className="text-6xl md:text-9xl font-serif text-white mb-10 uppercase tracking-tighter">
          Aqui você é <span className="text-[#EC4899] italic font-medium">Diva</span>
        </h2>
        <Button onClick={() => onNavigate("booking")} className="px-12 py-5 text-sm mx-auto">
          Agendar agora
        </Button>
      </div>
    </section>
  );
}

function ServicesView({ onBooking }) {
  const categories = Array.from(new Set(INITIAL_SERVICES.map(s => s.category)));
  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <SectionTitle title="Nossos Serviços" subtitle="Catálogo completo organizado por categoria." />
      {categories.map(cat => (
        <div key={cat} className="mb-24">
          <div className="flex items-center gap-6 mb-10">
            <h3 className="text-2xl font-serif tracking-widest uppercase">{cat}</h3>
            <div className="h-[1px] flex-1 bg-pink-300"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {INITIAL_SERVICES.filter(s => s.category === cat).map(s => (
              <Card key={s.id} className="hover:border-[#EC4899] transition-all flex flex-col">
                <div className="mb-4">
                  <span className="text-[8px] uppercase font-bold text-[#EC4899] bg-pink-100 px-3 py-1 rounded-full">
                    {INITIAL_PROFESSIONALS.find(p => p.id === s.professionalId)?.name}
                  </span>
                </div>
                <h4 className="text-lg font-serif mb-2 uppercase tracking-widest text-stone-800">{s.name}</h4>
                <p className="text-xs text-stone-400 mb-8 italic font-light leading-relaxed">{s.description}</p>
                <div className="mt-auto flex justify-between items-center border-t border-pink-200 pt-6">
                  <span className="text-[#EC4899] font-serif font-bold text-lg">{s.priceLabel}</span>
                  <Button onClick={onBooking} variant="outline" className="!py-2 !px-4 !text-[10px]">Agendar</Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function BookingView({ user, supabase }) {
  const [step, setStep] = useState(1);
  const [booking, setBooking] = useState({ professionalId: '', serviceId: '', date: '', time: '', clientName: '', clientPhone: '' });
  const [occupied, setOccupied] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const times = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

  useEffect(() => {
    if (!booking.professionalId || !booking.date) return;
    async function getOccupiedSlots() {
      const { data } = await supabase
        .from('bookings')
        .select('time')
        .eq('professional_id', booking.professionalId)
        .eq('date', booking.date);
      if (data) setOccupied(data.map(b => b.time));
    }
    getOccupiedSlots();
  }, [booking.professionalId, booking.date, supabase]);

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      const bId = `b_${Date.now()}`;
      const pro = INITIAL_PROFESSIONALS.find(p => p.id === booking.professionalId);
      const ser = INITIAL_SERVICES.find(s => s.id === booking.serviceId);

      const { error } = await supabase.from('bookings').insert([{
        id: bId, 
        professional_id: booking.professionalId, 
        service_id: booking.serviceId, 
        date: booking.date, 
        time: booking.time, 
        client_name: booking.clientName, 
        client_phone: booking.clientPhone, 
        professional_name: pro.name, 
        service_name: ser.name, 
        price_label: ser.priceLabel, 
        user_id: user?.id
      }]);

      if (error) {
        if (error.code === '23505') throw new Error("Ops! Este horário já foi preenchido por outra pessoa.");
        throw error;
      }
      setSuccess(true);
    } catch (e) { alert(e.message); }
    finally { setSubmitting(false); }
  };

  if (success) return (
    <div className="py-40 text-center px-6 animate-in fade-in zoom-in">
      <CheckCircle size={60} className="mx-auto text-[#EC4899] mb-8" />
      <h2 className="text-3xl font-serif mb-4 uppercase tracking-widest">Reserva Confirmada</h2>
      <Button onClick={() => window.location.reload()} className="mx-auto">Voltar ao Início</Button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-6 py-20">
      <SectionTitle title="Agendamento" subtitle="Seu horário confirmado em poucos cliques." />
      <Card>
        {step === 1 && (
          <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-right">
            {INITIAL_PROFESSIONALS.map(p => (
              <button key={p.id} onClick={() => { setBooking({...booking, professionalId: p.id}); setStep(2); }} className="p-6 border border-pink-200 rounded-3xl hover:border-[#EC4899] transition-all text-center bg-pink-100/20 group">
                <div className="w-16 h-16 bg-pink-300/30 rounded-full mx-auto mb-4 overflow-hidden group-hover:scale-105 transition-transform"><img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`} alt="" /></div>
                <span className="text-[10px] font-bold uppercase tracking-widest">{p.name}</span>
              </button>
            ))}
          </div>
        )}
        {step === 2 && (
          <div className="space-y-3 animate-in slide-in-from-right">
            {INITIAL_SERVICES.filter(s => s.professionalId === booking.professionalId).map(s => (
              <button key={s.id} onClick={() => { setBooking({...booking, serviceId: s.id}); setStep(3); }} className="w-full p-5 border border-pink-200 rounded-2xl text-left flex justify-between items-center hover:border-[#EC4899] bg-pink-100/10 transition-all">
                <div>
                  <span className="text-[10px] font-bold uppercase block text-stone-700">{s.name}</span>
                  <span className="text-[9px] text-stone-400 italic font-light">{s.category}</span>
                </div>
                <span className="text-[#EC4899] font-serif font-bold">{s.priceLabel}</span>
              </button>
            ))}
            <button onClick={() => setStep(1)} className="text-[10px] text-stone-400 uppercase mt-8 font-bold tracking-widest hover:text-[#EC4899] transition-colors">← Voltar</button>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-8 animate-in slide-in-from-right">
            <input type="date" className="w-full p-4 border border-pink-300 rounded-2xl outline-none focus:ring-1 focus:ring-[#EC4899] bg-pink-100/10 font-bold text-[#EC4899]" onChange={e => setBooking({...booking, date: e.target.value})} />
            <div className="grid grid-cols-3 gap-2">
              {times.map(t => (
                <button key={t} disabled={occupied.includes(t)} onClick={() => setBooking({...booking, time: t})} className={`p-3 border rounded-xl text-[10px] font-bold ${booking.time === t ? 'bg-[#EC4899] text-white border-transparent shadow-md' : 'bg-white border-pink-300 text-stone-400 hover:border-[#EC4899]'} ${occupied.includes(t) ? 'opacity-30 bg-stone-50 line-through cursor-not-allowed' : ''}`}>{t}</button>
              ))}
            </div>
            <div className="flex justify-between items-center">
              <button onClick={() => setStep(2)} className="text-[10px] text-stone-400 uppercase font-bold tracking-widest">← Voltar</button>
              <Button disabled={!booking.date || !booking.time} onClick={() => setStep(4)}>Próximo</Button>
            </div>
          </div>
        )}
        {step === 4 && (
          <div className="space-y-6 animate-in slide-in-from-right">
            <div className="space-y-4">
              <input placeholder="Nome Completo" className="w-full p-4 border border-pink-300 rounded-2xl outline-none focus:ring-1 focus:ring-[#EC4899] bg-pink-100/10" onChange={e => setBooking({...booking, clientName: e.target.value})} />
              <input placeholder="WhatsApp (DDD + Número)" className="w-full p-4 border border-pink-300 rounded-2xl outline-none focus:ring-1 focus:ring-[#EC4899] bg-pink-100/10" onChange={e => setBooking({...booking, clientPhone: e.target.value})} />
            </div>
            <div className="flex justify-between items-center">
              <button onClick={() => setStep(3)} className="text-[10px] text-stone-400 uppercase font-bold tracking-widest">← Voltar</button>
              <Button disabled={!booking.clientName || submitting} onClick={handleFinish}>{submitting ? 'Aguarde...' : 'Finalizar'}</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function AdminView({ supabase }) {
  const [authorized, setAuthorized] = useState(false);
  const [pass, setPass] = useState('');
  const [selectedPro, setSelectedPro] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [deletingId, setDeletingId] = useState(null);

  const fetchBookings = async () => {
    if (!selectedPro || !supabase) return;
    const { data } = await supabase.from('bookings').select('*').eq('professional_id', selectedPro);
    if (data) setBookings(data.sort((a, b) => a.time.localeCompare(b.time)));
  };

  useEffect(() => {
    if (authorized && selectedPro) fetchBookings();
    const sub = supabase?.channel('admin_view').on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, fetchBookings).subscribe();
    return () => { supabase?.removeChannel(sub); };
  }, [authorized, selectedPro, supabase]);

  const handleDeleteBooking = async (b) => {
    if (!window.confirm(`AVISO: Controle Total Especialista. Deseja EXCLUIR o agendamento de ${b.client_name}?`)) return;
    setDeletingId(b.id);
    try {
      const { error } = await supabase.from('bookings').delete().eq('id', b.id);
      if (error) throw error;
      setBookings(prev => prev.filter(item => item.id !== b.id));
    } catch (e) {
      alert("Erro ao excluir: " + e.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (!authorized) return (
    <div className="max-w-md mx-auto py-40 px-6 text-center">
      <Card className="border-pink-400 shadow-pink-200/50 shadow-2xl">
        <Lock className="mx-auto mb-6 text-[#EC4899]" size={40} />
        <h3 className="text-lg font-serif mb-6 uppercase tracking-widest text-stone-800">Acesso Restrito</h3>
        <input type="password" placeholder="Senha" className="w-full p-4 border border-pink-400 rounded-2xl mb-6 text-center outline-none bg-pink-100/20 font-bold" onChange={e => setPass(e.target.value)} />
        <Button className="w-full" onClick={() => pass === 'kelly59' ? setAuthorized(true) : alert('Senha incorreta')}>Entrar</Button>
      </Card>
    </div>
  );

  if (!selectedPro) return (
    <div className="max-w-4xl mx-auto px-6 py-20 text-center">
      <SectionTitle title="Agenda" subtitle="Controle total de profissionais." />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {INITIAL_PROFESSIONALS.map(p => (
          <button key={p.id} onClick={() => setSelectedPro(p.id)} className="p-8 bg-white border border-pink-300 rounded-[2.5rem] hover:border-[#EC4899] transition-all shadow-sm flex flex-col items-center gap-4 bg-gradient-to-br from-white to-pink-200/20">
            <div className="w-16 h-16 bg-pink-300/50 rounded-full overflow-hidden border-2 border-white"><img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`} alt="" /></div>
            <span className="text-[10px] font-bold uppercase tracking-widest">{p.name}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-6 py-20 animate-in fade-in">
      <div className="flex items-center justify-between mb-10">
        <button onClick={() => setSelectedPro(null)} className="text-[10px] text-stone-400 uppercase font-bold hover:text-[#EC4899] tracking-widest transition-colors">← Escolher Profissional</button>
        <h2 className="text-xl font-serif uppercase tracking-widest border-b-2 border-[#EC4899] pb-1">Agenda: {INITIAL_PROFESSIONALS.find(p => p.id === selectedPro)?.name}</h2>
      </div>
      <div className="mb-10 p-6 bg-white border border-pink-400 rounded-[2rem] flex items-center justify-between shadow-sm">
        <span className="text-[10px] uppercase font-bold text-stone-400 tracking-widest flex items-center gap-2 font-bold"><Calendar size={14} /> Data Selecionada</span>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="p-0 border-none outline-none font-bold text-[#EC4899] bg-transparent" />
      </div>
      <div className="space-y-4">
        {bookings.filter(b => b.date === date).length === 0 ? (
          <div className="py-20 text-center bg-white/50 rounded-[2rem] border-2 border-dashed border-pink-300">
             <p className="text-stone-300 italic font-light tracking-widest uppercase text-xs">Sem marcações para este dia.</p>
          </div>
        ) : (
          bookings.filter(b => b.date === date).map(b => (
            <Card key={b.id} className="flex justify-between items-center hover:bg-pink-100/20 transition-all border-pink-300">
              <div className="flex gap-6 items-center">
                <div className="w-12 h-12 bg-stone-900 text-white rounded-xl flex items-center justify-center font-serif text-sm border-2 border-pink-300 shadow-md">{b.time}</div>
                <div className="text-left">
                  <span className="text-lg font-serif uppercase tracking-widest text-stone-800 font-medium">{b.client_name}</span>
                  <p className="text-[10px] text-[#EC4899] uppercase font-bold tracking-widest flex items-center gap-2"><Sparkles size={10} /> {b.service_name} • <Phone size={10} /> {b.client_phone}</p>
                </div>
              </div>
              <button 
                onClick={() => handleDeleteBooking(b)} 
                disabled={deletingId === b.id}
                className={`p-4 rounded-2xl transition-all shadow-sm ${deletingId === b.id ? 'bg-stone-100 text-stone-300' : 'bg-red-50 text-red-400 hover:text-red-700 hover:bg-red-100'}`}
              >
                {deletingId === b.id ? <RefreshCw className="animate-spin" size={24} /> : <Trash2 size={24} />}
              </button>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}