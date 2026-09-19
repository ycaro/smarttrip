import React, { useState } from 'react';
import { ScreenType, GroupNote, PollOption } from '../types';
import {
  CO_TRAVELERS,
  INITIAL_GROUP_NOTES,
  INITIAL_POLL_OPTIONS,
  TRAVEL_DOCUMENTS,
} from '../data/mockData';

interface ScreenHubProps {
  onNavigate: (screen: ScreenType) => void;
  onOpenInviteModal?: () => void;
}

export const ScreenHub: React.FC<ScreenHubProps> = ({
  onNavigate,
  onOpenInviteModal,
}) => {
  const [selectedPollOption, setSelectedPollOption] = useState<string>('poll-1');
  const [pollOptions, setPollOptions] = useState<PollOption[]>(INITIAL_POLL_OPTIONS);
  const [notes, setNotes] = useState<GroupNote[]>(INITIAL_GROUP_NOTES);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleVote = (optionId: string) => {
    if (optionId === selectedPollOption) return;

    setSelectedPollOption(optionId);
    setPollOptions((prev) =>
      prev.map((opt) => {
        if (opt.id === optionId) {
          return {
            ...opt,
            votes: opt.votes + 1,
            voterAvatars: [
              ...opt.voterAvatars.filter((v) => v.name !== 'Você'),
              { name: 'Você', initials: 'VC', color: 'bg-primary text-white' },
            ],
          };
        } else {
          return {
            ...opt,
            votes: Math.max(0, opt.votes - 1),
            voterAvatars: opt.voterAvatars.filter((v) => v.name !== 'Você'),
          };
        }
      })
    );
    showToast('Seu voto foi atualizado!');
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const newNote: GroupNote = {
      id: `note-${Date.now()}`,
      text: newNoteText.trim(),
      author: 'Você',
      authorInitials: 'VC',
      authorColor: 'bg-[#fd6a49]',
      timeAgo: 'agora',
    };

    setNotes([newNote, ...notes]);
    setNewNoteText('');
    setIsAddingNote(false);
    showToast('Nota adicionada ao grupo!');
  };

  const totalVotes = pollOptions.reduce((acc, curr) => acc + curr.votes, 0) || 1;

  return (
    <div className="w-full max-w-4xl mx-auto bg-surface-bright min-h-screen pb-28 pt-3 px-4 sm:px-5">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-primary text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-sm text-[#53d7ef]">
            check_circle
          </span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="flex items-center justify-between py-2 mb-3">
        <div className="flex items-center gap-2">
          <img
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
            alt="Marcelo Costa"
            className="w-9 h-9 rounded-full object-cover border border-outline-variant/50"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-primary text-sm sm:text-base leading-none">
                SmartTrip
              </span>
              <span className="bg-surface-container text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                Hub
              </span>
            </div>
            <p className="text-[11px] text-outline font-medium">Lisboa 2024</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (onOpenInviteModal) onOpenInviteModal();
              else showToast('Link de convite do grupo copiado!');
            }}
            className="h-8 px-3 rounded-full bg-surface-container-low text-primary text-xs font-bold flex items-center gap-1 hover:bg-surface-container transition-colors shadow-2xs"
          >
            <span className="material-symbols-outlined text-sm">person_add</span>
            <span>Convidar</span>
          </button>
          <button
            aria-label="Notificações"
            className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-primary"
          >
            <span className="material-symbols-outlined text-lg">
              notifications
            </span>
          </button>
        </div>
      </header>

      {/* Trip Status Banner */}
      <section className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/30 shadow-xs mb-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 text-secondary text-[11px] font-bold uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              <span>STATUS DA VIAGEM</span>
            </div>
            <h1 className="font-headline-md text-base sm:text-lg font-extrabold text-primary">
              Hub da Viagem: Lisboa 2024
            </h1>
            <p className="text-xs text-on-surface-variant mt-0.5">
              12 a 18 de Outubro • 4 Viajantes Ativos
            </p>
          </div>
          <span className="bg-surface-container text-primary text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0">
            Em planejamento
          </span>
        </div>
      </section>

      {/* Orçamento Inteligente Card */}
      <section className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/30 shadow-xs mb-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1 text-[11px] font-bold text-secondary uppercase tracking-wider">
            <span className="material-symbols-outlined text-sm">payments</span>
            <span>ORÇAMENTO INTELIGENTE</span>
          </div>
          <div className="bg-[#FFF0ED] text-[#ae3115] text-xs font-bold px-2.5 py-0.5 rounded-full">
            45% utilizado
          </div>
        </div>

        <div className="flex items-baseline justify-between mb-2.5">
          <div>
            <span className="font-display-lg-mobile text-2xl sm:text-3xl font-extrabold text-primary">
              R$ 3.850
            </span>
            <span className="text-xs text-outline ml-1 font-medium">
              de R$ 8.500 previstos
            </span>
          </div>
          <span className="text-xs font-bold text-secondary">
            R$ 4.650 livres
          </span>
        </div>

        {/* Segmented Progress Bar */}
        <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden flex mb-2">
          <div
            style={{ width: '50%' }}
            className="h-full bg-primary"
            title="Hospedagem 50%"
          ></div>
          <div
            style={{ width: '25%' }}
            className="h-full bg-[#fd6a49]"
            title="Alimentação 25%"
          ></div>
          <div
            style={{ width: '15%' }}
            className="h-full bg-[#22b8cf]"
            title="Passeios 15%"
          ></div>
          <div
            style={{ width: '10%' }}
            className="h-full bg-[#64748b]"
            title="Transporte 10%"
          ></div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-outline font-semibold mb-3">
          <span>R$ 0</span>
          <span>Meta: R$ 8.500</span>
        </div>

        {/* Legend Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs mb-3.5">
          <div className="flex items-center justify-between bg-surface-container-low px-2.5 py-1.5 rounded-xl">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
              <span className="text-primary font-medium">Hospedagem</span>
            </div>
            <span className="font-bold text-primary">50%</span>
          </div>

          <div className="flex items-center justify-between bg-surface-container-low px-2.5 py-1.5 rounded-xl">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#fd6a49]"></span>
              <span className="text-primary font-medium">Alimentação</span>
            </div>
            <span className="font-bold text-primary">25%</span>
          </div>

          <div className="flex items-center justify-between bg-surface-container-low px-2.5 py-1.5 rounded-xl">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#22b8cf]"></span>
              <span className="text-primary font-medium">Passeios</span>
            </div>
            <span className="font-bold text-primary">15%</span>
          </div>

          <div className="flex items-center justify-between bg-surface-container-low px-2.5 py-1.5 rounded-xl">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#64748b]"></span>
              <span className="text-primary font-medium">Transporte</span>
            </div>
            <span className="font-bold text-primary">10%</span>
          </div>
        </div>

        {/* AI Copilot Insight Box */}
        <div className="bg-[#FFF0ED] border border-secondary-fixed rounded-2xl p-3 flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#ae3115] text-white flex items-center justify-center shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-sm">
              auto_awesome
            </span>
          </div>
          <div className="text-xs">
            <span className="font-bold text-secondary uppercase block text-[10px]">
              INSIGHT DO COPILOTO IA
            </span>
            <p className="text-primary font-medium mt-0.5">
              Você está economizando{' '}
              <strong className="text-secondary font-bold">R$ 420</strong> em{' '}
              <strong className="text-secondary font-bold">alimentação</strong>{' '}
              comparado à média de Lisboa!
            </p>
          </div>
        </div>
      </section>

      {/* Co-Planejamento & Amigos */}
      <section className="mb-5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-bold text-primary text-base">
            Co-Planejamento & Amigos
          </h2>
          <button
            onClick={() => showToast('Membros do grupo: Marcelo, Lucas, Marina, Sofia')}
            className="text-xs font-bold text-secondary hover:underline flex items-center gap-0.5"
          >
            <span>Ver todos (4)</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
          </button>
        </div>
        <p className="text-xs text-outline mb-3">
          Decisões colaborativas da equipe
        </p>

        {/* Avatars List */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
          {CO_TRAVELERS.map((traveler) => (
            <div
              key={traveler.name}
              className="flex flex-col items-center shrink-0"
            >
              <div className="relative">
                <img
                  src={traveler.avatar}
                  alt={traveler.name}
                  className={`w-14 h-14 rounded-full object-cover border-2 ${
                    traveler.isCurrent
                      ? 'border-[#fd6a49] p-0.5'
                      : 'border-white'
                  }`}
                />
                {traveler.isOnline && (
                  <span className="absolute bottom-1 right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"></span>
                )}
                {traveler.isCurrent && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#fd6a49] text-white text-[9px] font-bold px-1.5 rounded-full">
                    Você
                  </span>
                )}
              </div>
              <span className="text-xs font-semibold text-primary mt-1.5">
                {traveler.name}
              </span>
            </div>
          ))}

          {/* Share Link Button */}
          <button
            onClick={() => showToast('Link de acesso direto gerado e copiado!')}
            className="flex flex-col items-center shrink-0 group"
          >
            <div className="w-14 h-14 rounded-full border-2 border-dashed border-outline-variant flex items-center justify-center text-outline group-hover:border-primary group-hover:text-primary transition-all">
              <span className="material-symbols-outlined text-xl">share</span>
            </div>
            <span className="text-xs font-medium text-outline mt-1.5">Link</span>
          </button>
        </div>
      </section>

      {/* Enquete Ativa do Grupo */}
      <section className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/30 shadow-xs mb-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-secondary text-[11px] font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined text-sm">how_to_vote</span>
            <span>ENQUETE ATIVA DO GRUPO</span>
          </div>
          <span className="bg-surface-container text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
            Termina em 4h
          </span>
        </div>

        <h3 className="font-bold text-primary text-base mb-3">
          Onde jantar na sexta à noite?
        </h3>

        {/* Options */}
        <div className="space-y-2.5">
          {pollOptions.map((option) => {
            const isSelected = selectedPollOption === option.id;
            const percentage = Math.round((option.votes / totalVotes) * 100);

            return (
              <div
                key={option.id}
                onClick={() => handleVote(option.id)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#fd6a49] bg-[#FFF0ED]/40 shadow-xs'
                    : 'border-outline-variant/40 bg-surface-container-lowest hover:bg-surface-container-low'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isSelected
                          ? 'border-[#fd6a49] bg-[#fd6a49]'
                          : 'border-outline-variant'
                      }`}
                    >
                      {isSelected && (
                        <span className="material-symbols-outlined text-white text-xs">
                          check
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-primary text-sm">
                        {option.title}
                      </h4>
                      <p className="text-[11px] text-outline">
                        {option.location}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center justify-end -space-x-1.5 mb-1">
                      {option.voterAvatars.map((voter, i) => (
                        <div
                          key={i}
                          className={`w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center border border-white ${voter.color}`}
                          title={voter.name}
                        >
                          {voter.initials}
                        </div>
                      ))}
                    </div>
                    <span
                      className={`text-xs font-bold ${
                        isSelected ? 'text-[#ae3115]' : 'text-outline'
                      }`}
                    >
                      {option.votes} votos ({percentage}%)
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Ferramentas & Documentos */}
      <section className="mb-5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-bold text-primary text-base">
            Ferramentas & Documentos
          </h2>
          <span className="material-symbols-outlined text-primary text-lg">
            receipt_long
          </span>
        </div>
        <p className="text-xs text-outline mb-3">
          Acesso instantâneo mesmo offline
        </p>

        {/* Documents Stack */}
        <div className="space-y-3">
          {TRAVEL_DOCUMENTS.map((doc) => (
            <div
              key={doc.id}
              className="bg-surface-container-lowest rounded-2xl p-3.5 border border-outline-variant/30 shadow-xs flex items-center justify-between"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${doc.badgeColor}`}
                >
                  <span className="material-symbols-outlined text-xl">
                    {doc.iconName}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-outline uppercase tracking-wider block">
                    {doc.provider}
                  </span>
                  <h4 className="font-bold text-primary text-sm leading-tight">
                    {doc.title}
                  </h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {doc.routeOrAddress}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedDocument(doc.title);
                  showToast(`Visualizando: ${doc.actionLabel}`);
                }}
                className="px-3 py-1.5 rounded-xl bg-surface-container text-primary text-xs font-bold hover:bg-surface-container-high transition-colors shrink-0 flex items-center gap-1 shadow-2xs"
              >
                <span className="material-symbols-outlined text-sm">
                  visibility
                </span>
                <span>{doc.actionLabel}</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Notas Rápidas do Grupo */}
      <section className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/30 shadow-xs mb-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-primary font-bold text-sm">
            <span className="material-symbols-outlined text-secondary text-base">
              edit_note
            </span>
            <span>Notas Rápidas do Grupo</span>
          </div>
          <span className="text-[11px] text-outline">Sincronizado há 5m</span>
        </div>

        {/* Note Items */}
        <div className="space-y-2.5 mb-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-start justify-between gap-3"
            >
              <p className="text-xs text-primary leading-relaxed flex-1">
                {note.text}
              </p>
              <div
                className={`w-6 h-6 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0 ${note.authorColor}`}
                title={note.author}
              >
                {note.authorInitials}
              </div>
            </div>
          ))}
        </div>

        {/* Add Note Form or Trigger */}
        {isAddingNote ? (
          <form onSubmit={handleAddNote} className="space-y-2">
            <textarea
              rows={2}
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder="Digite a anotação para o grupo..."
              className="w-full p-2.5 rounded-xl border border-outline-variant text-xs text-primary focus:outline-none focus:border-primary"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddingNote(false)}
                className="px-3 py-1 rounded-lg text-xs font-semibold text-outline hover:text-primary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-3 py-1 rounded-lg bg-primary text-white text-xs font-bold shadow-xs"
              >
                Salvar Nota
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAddingNote(true)}
            className="w-full py-2.5 rounded-xl border border-dashed border-outline-variant text-xs font-bold text-primary hover:bg-surface-container-low transition-colors flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span>Adicionar nova anotação</span>
          </button>
        )}
      </section>

      {/* Export CTA Button */}
      <div className="mb-4">
        <button
          onClick={() => showToast('Exportando roteiro em PDF e sincronizando com calendário')}
          className="w-full h-13 rounded-2xl bg-gradient-to-r from-[#ae3115] to-[#fd6a49] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(174,49,21,0.25)] active:scale-[0.98] transition-transform"
        >
          <span className="material-symbols-outlined text-lg">file_download</span>
          <span>Exportar Roteiro (PDF / Calendário / WhatsApp)</span>
        </button>
        <p className="text-[11px] text-outline text-center mt-1.5">
          Disponível em formato offline sincronizado com Apple Calendar & Google
        </p>
      </div>
    </div>
  );
};
