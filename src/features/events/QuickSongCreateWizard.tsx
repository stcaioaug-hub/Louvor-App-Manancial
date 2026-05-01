import React, { useEffect, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Music,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { Song } from '../../types';
import { transposeKey, toggleMinorKey } from '../../lib/chordTransposer';
import {
  enrichSongData,
  EnrichedSongData,
  searchSongMatches,
  SongSuggestionResult,
} from '../../lib/gemini';
import { useModalViewportLock } from '../../hooks/useModalViewportLock';

type EventSongSection = 'main' | 'offering' | 'outro';

interface QuickSongCreateWizardProps {
  isOpen: boolean;
  initialTitle: string;
  section: EventSongSection;
  onClose: () => void;
  onCreateSong: (song: Omit<Song, 'id'>) => Promise<Song>;
  onCreated: (song: Song, addToEvent: boolean) => void | Promise<void>;
}

interface KeyPickerProps {
  label: string;
  value?: string;
  allowEmpty?: boolean;
  onChange: (value: string) => void;
}

const TOTAL_STEPS = 6;
const FALLBACK_ARTIST = 'Artista não informado';
const SEARCH_TIMEOUT_MS = 14000;

const sectionLabel: Record<EventSongSection, string> = {
  main: 'repertório principal',
  offering: 'momento da oferta',
  outro: 'encerramento',
};

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;

  return Promise.race([
    promise.finally(() => globalThis.clearTimeout(timeoutId)),
    new Promise<T>((_, reject) => {
      timeoutId = globalThis.setTimeout(() => reject(new Error('Tempo esgotado na busca.')), timeoutMs);
    }),
  ]);
}

function KeyPicker({ label, value, allowEmpty = false, onChange }: KeyPickerProps) {
  const displayValue = value || (allowEmpty ? '--' : 'C');
  const baseValue = value || 'C';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          {label}
        </label>
        {allowEmpty && value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-red-500"
          >
            Limpar
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center justify-between px-2 py-1.5 bg-slate-50 border border-black/5 rounded-2xl h-[52px]">
          <button
            type="button"
            onClick={() => onChange(transposeKey(baseValue, -1))}
            className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-400 hover:text-blue-600"
            title="Abaixar meio tom"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="font-bold text-[#00153d] text-lg w-12 text-center">{displayValue}</span>
          <button
            type="button"
            onClick={() => onChange(transposeKey(baseValue, 1))}
            className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-400 hover:text-blue-600"
            title="Aumentar meio tom"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <button
          type="button"
          onClick={() => onChange(toggleMinorKey(baseValue))}
          className={`px-4 h-[52px] rounded-2xl font-bold text-[11px] uppercase tracking-widest transition-all border flex items-center justify-center ${
            value?.toLowerCase().endsWith('m')
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'bg-slate-50 border-black/5 text-slate-400 hover:bg-slate-100'
          }`}
          title="Alternar entre tom maior e menor"
        >
          Menor
        </button>
      </div>
    </div>
  );
}

export function QuickSongCreateWizard({
  isOpen,
  initialTitle,
  section,
  onClose,
  onCreateSong,
  onCreated,
}: QuickSongCreateWizardProps) {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState(initialTitle);
  const [artist, setArtist] = useState('');
  const [lyricsSnippet, setLyricsSnippet] = useState('');
  const [suggestions, setSuggestions] = useState<SongSuggestionResult[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<SongSuggestionResult | null>(null);
  const [enrichedData, setEnrichedData] = useState<EnrichedSongData | null>(null);
  const [songKey, setSongKey] = useState('C');
  const [originalKey, setOriginalKey] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [addToEvent, setAddToEvent] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'song' | 'event'>('idle');
  const [brokenCoverUrl, setBrokenCoverUrl] = useState('');
  const [brokenSuggestionCoverUrls, setBrokenSuggestionCoverUrls] = useState<Set<string>>(() => new Set());

  useModalViewportLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;

    setStep(1);
    setTitle(initialTitle.trim());
    setArtist('');
    setLyricsSnippet('');
    setSuggestions([]);
    setSelectedSuggestion(null);
    setEnrichedData(null);
    setSongKey('C');
    setOriginalKey('');
    setCoverUrl('');
    setAddToEvent(true);
    setIsSearching(false);
    setIsEnriching(false);
    setIsSubmitting(false);
    setSubmitStatus('idle');
    setBrokenCoverUrl('');
    setBrokenSuggestionCoverUrls(new Set());
  }, [initialTitle, isOpen]);

  const normalizedTitle = title.trim();
  const normalizedArtist = artist.trim();
  const reviewArtist = normalizedArtist || FALLBACK_ARTIST;
  const selectedCoverUrl =
    selectedSuggestion?.cover_url && !brokenSuggestionCoverUrls.has(selectedSuggestion.cover_url)
      ? selectedSuggestion.cover_url.trim()
      : '';
  const effectiveCoverUrl = (coverUrl || selectedCoverUrl || enrichedData?.cover_url || '').trim();
  const visibleCoverUrl = effectiveCoverUrl && effectiveCoverUrl !== brokenCoverUrl ? effectiveCoverUrl : undefined;
  const progress = `${Math.round((step / TOTAL_STEPS) * 100)}%`;

  if (!isOpen) return null;

  const goToSuggestions = async (snippetOverride?: string) => {
    if (!normalizedTitle) {
      toast.error('Informe o título do louvor.');
      return;
    }

    const snippet = snippetOverride ?? lyricsSnippet;

    setStep(4);
    setIsSearching(true);
    setSuggestions([]);
    setSelectedSuggestion(null);
    setEnrichedData(null);

    try {
      const results = await withTimeout(
        searchSongMatches({
          title: normalizedTitle,
          artist: normalizedArtist || undefined,
          lyricsSnippet: snippet.trim() || undefined,
        }),
        SEARCH_TIMEOUT_MS
      );
      setSuggestions(results);
    } catch (error) {
      console.error(error);
      toast.error('A busca demorou demais. Você pode continuar com os dados digitados.');
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  const hydrateWithAi = async () => {
    if (!normalizedTitle) {
      toast.error('Informe o título do louvor.');
      return;
    }

    setStep(5);

    if (!normalizedArtist) {
      return;
    }

    try {
      setIsEnriching(true);
      const enriched = await enrichSongData(normalizedTitle, normalizedArtist);

      if (!enriched) return;

      setEnrichedData(enriched);
      setTitle(enriched.title || normalizedTitle);
      setArtist(enriched.artist || normalizedArtist);
      setOriginalKey(enriched.key || '');
      setSongKey((currentKey) => (currentKey === 'C' ? enriched.key || 'C' : currentKey));
      setCoverUrl((currentCoverUrl) => currentCoverUrl || selectedSuggestion?.cover_url || enriched.cover_url || '');
      setBrokenCoverUrl('');
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível preencher os dados com IA.');
    } finally {
      setIsEnriching(false);
    }
  };

  const handleSelectSuggestion = (suggestion: SongSuggestionResult, safeCoverUrl?: string) => {
    setSelectedSuggestion(suggestion);
    setTitle(suggestion.title);
    setArtist(suggestion.artist);
    setCoverUrl(safeCoverUrl || '');
    setBrokenCoverUrl('');
  };

  const handleSubmit = async () => {
    if (!normalizedTitle) {
      toast.error('Informe o título do louvor.');
      setStep(1);
      return;
    }

    const songPayload: Omit<Song, 'id'> = {
      title: normalizedTitle,
      artist: reviewArtist,
      key: songKey.trim() || 'C',
      originalKey: originalKey.trim() || undefined,
      bpm: enrichedData?.bpm,
      proficiency: 3,
      difficulty: enrichedData?.difficulty ?? 3,
      tags: [],
      links: {
        chords: enrichedData?.chords_url,
        lyrics: enrichedData?.lyrics_url,
        video: enrichedData?.youtube_url,
      },
      cover_url: effectiveCoverUrl || undefined,
      isFavorite: false,
      timesPlayed: 0,
      timesRehearsed: 0,
      isActiveRepertoire: true,
    };

    let createdSong: Song | null = null;

    try {
      setIsSubmitting(true);
      setSubmitStatus('song');
      createdSong = await onCreateSong(songPayload);
      setSubmitStatus(addToEvent ? 'event' : 'idle');
      await onCreated(createdSong, addToEvent);
      toast.success(addToEvent ? 'Música salva e adicionada ao evento!' : 'Música salva no repertório!');
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'Verifique sua conexão.';
      toast.error(
        createdSong
          ? `Música salva, mas não foi adicionada ao evento: ${message}`
          : `Erro ao salvar música no repertório: ${message}`
      );
    } finally {
      setSubmitStatus('idle');
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    if (step === 1) {
      return (
        <motion.div
          key="title"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          className="space-y-6"
        >
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-2">
              Passo 1
            </p>
            <h3 className="text-2xl font-headline font-extrabold text-[#00153d]">Qual é o título?</h3>
          </div>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            autoFocus
            className="w-full px-5 py-4 bg-slate-50 border border-black/5 rounded-2xl text-base font-bold text-[#00153d] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="Nome da música"
          />
        </motion.div>
      );
    }

    if (step === 2) {
      return (
        <motion.div
          key="artist"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          className="space-y-6"
        >
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-2">
              Passo 2
            </p>
            <h3 className="text-2xl font-headline font-extrabold text-[#00153d]">Você sabe o artista?</h3>
          </div>
          <input
            type="text"
            value={artist}
            onChange={(event) => setArtist(event.target.value)}
            className="w-full px-5 py-4 bg-slate-50 border border-black/5 rounded-2xl text-base font-bold text-[#00153d] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="Ex: Morada, Gabriela Rocha, Harpa Cristã..."
          />
        </motion.div>
      );
    }

    if (step === 3) {
      return (
        <motion.div
          key="snippet"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          className="space-y-6"
        >
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-2">
              Passo 3
            </p>
            <h3 className="text-2xl font-headline font-extrabold text-[#00153d]">Tem algum trecho?</h3>
          </div>
          <textarea
            value={lyricsSnippet}
            onChange={(event) => setLyricsSnippet(event.target.value)}
            className="w-full min-h-36 px-5 py-4 bg-slate-50 border border-black/5 rounded-2xl text-sm font-medium text-[#00153d] focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
            placeholder="Escreva um pedaço da letra se lembrar..."
          />
        </motion.div>
      );
    }

    if (step === 4) {
      return (
        <motion.div
          key="suggestions"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          className="space-y-6"
        >
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-2">
              Passo 4
            </p>
            <h3 className="text-2xl font-headline font-extrabold text-[#00153d]">Escolha a melhor opção</h3>
          </div>

          {isSearching ? (
            <div className="py-14 flex flex-col items-center justify-center gap-4 text-slate-400">
              <Loader2 size={32} className="animate-spin text-blue-500" />
              <p className="text-sm font-bold">Buscando correspondências...</p>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
              {suggestions.map((suggestion) => {
                const isSelected =
                  selectedSuggestion?.title === suggestion.title &&
                  selectedSuggestion?.artist === suggestion.artist;
                const safeCoverUrl =
                  suggestion.cover_url && !brokenSuggestionCoverUrls.has(suggestion.cover_url)
                    ? suggestion.cover_url
                    : undefined;

                return (
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    key={`${suggestion.title}-${suggestion.artist}`}
                    onClick={() => handleSelectSuggestion(suggestion, safeCoverUrl)}
                    className={`w-full p-4 rounded-2xl border text-left flex items-center gap-4 transition-all ${
                      isSelected
                        ? 'bg-blue-50 border-blue-200 shadow-sm'
                        : 'bg-white border-black/5 hover:bg-slate-50'
                    }`}
                  >
                    {safeCoverUrl ? (
                      <img
                        src={safeCoverUrl}
                        alt=""
                        className="w-14 h-14 rounded-2xl object-cover bg-slate-100 shrink-0"
                        onError={() => {
                          setBrokenSuggestionCoverUrls((current) => {
                            const next = new Set(current);
                            next.add(safeCoverUrl);
                            return next;
                          });
                        }}
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-300 flex items-center justify-center shrink-0">
                        <Music size={22} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-[#00153d] truncate">{suggestion.title}</p>
                      <p className="text-xs text-slate-500 font-medium truncate">{suggestion.artist}</p>
                    </div>
                    {isSelected && (
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <Check size={16} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400">
              <Search size={36} className="mx-auto mb-4 opacity-30" />
              <p className="text-sm font-bold">Nenhuma sugestão confiável encontrada</p>
            </div>
          )}
        </motion.div>
      );
    }

    if (step === 5) {
      return (
        <motion.div
          key="keys"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          className="space-y-6"
        >
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-2">
              Passo 5
            </p>
            <h3 className="text-2xl font-headline font-extrabold text-[#00153d]">Defina a tonalidade</h3>
          </div>
          {isEnriching && (
            <div className="p-4 rounded-2xl bg-blue-50 text-blue-700 text-sm font-bold flex items-center gap-3">
              <Loader2 size={18} className="animate-spin" />
              <span>Consultando IA para preencher tom e links...</span>
            </div>
          )}
          <div className="grid grid-cols-1 gap-5">
            <KeyPicker label="Tom que vamos tocar" value={songKey} onChange={setSongKey} />
            <KeyPicker label="Tom original" value={originalKey} allowEmpty onChange={setOriginalKey} />
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        key="review"
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -30 }}
        className="space-y-6"
      >
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-2">
            Revisão
          </p>
          <h3 className="text-2xl font-headline font-extrabold text-[#00153d]">Salvar música no repertório?</h3>
        </div>

        <div className="p-4 rounded-[1.75rem] bg-slate-50 border border-black/5 flex items-center gap-4">
          {visibleCoverUrl ? (
            <img
              src={visibleCoverUrl}
              alt=""
              className="w-20 h-20 rounded-2xl object-cover bg-slate-100 shrink-0"
              onError={() => setBrokenCoverUrl(visibleCoverUrl)}
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-white text-slate-200 flex items-center justify-center shrink-0">
              <Music size={30} />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xl font-headline font-extrabold text-[#00153d] truncate">{normalizedTitle}</p>
            <p className="text-sm font-medium text-slate-500 truncate">{reviewArtist}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-[10px] font-black uppercase tracking-widest">
                Tom: {songKey || 'C'}
              </span>
              {originalKey && (
                <span className="px-3 py-1 bg-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                  Orig: {originalKey}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          aria-pressed={addToEvent}
          onClick={() => setAddToEvent((current) => !current)}
          className={`w-full p-4 rounded-2xl border flex items-center gap-3 text-left transition-all ${
            addToEvent
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-white border-black/5 text-slate-500'
          }`}
        >
          <div className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${
            addToEvent ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-slate-50 border-slate-200'
          }`}>
            {addToEvent && <Check size={14} />}
          </div>
          <div>
            <p className="text-sm font-bold">Adicionar também a este evento</p>
            <p className="text-xs opacity-70">Se marcado, entra em {sectionLabel[section]}.</p>
          </div>
        </button>
      </motion.div>
    );
  };

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-[#00153d]/50 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-[2rem] md:rounded-[2.5rem] w-full max-w-xl overflow-hidden apple-shadow flex flex-col max-h-[90vh]"
      >
        <div className="flex-none p-6 md:p-8 border-b border-black/5">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">
                Cadastro rápido
              </p>
              <h2 className="text-2xl md:text-3xl font-headline font-extrabold text-[#00153d]">
                Novo louvor
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50"
            >
              <X size={24} />
            </button>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: progress }} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>
        </div>

        <div className="flex-none p-5 md:p-6 bg-slate-50 border-t border-black/5 flex flex-wrap items-center gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((current) => Math.max(1, current - 1))}
              disabled={isSubmitting || isSearching || isEnriching}
              className="px-5 py-3 bg-white text-slate-500 rounded-2xl font-bold hover:bg-slate-100 transition-all disabled:opacity-50"
            >
              Voltar
            </button>
          )}

          <div className="flex-1" />

          {step === 2 && (
            <button
              type="button"
              onClick={() => {
                setArtist('');
                setStep(3);
              }}
              disabled={isSubmitting}
              className="px-5 py-3 bg-white text-slate-500 rounded-2xl font-bold hover:bg-slate-100 transition-all disabled:opacity-50"
            >
              Pular
            </button>
          )}

          {step === 3 && (
            <button
              type="button"
              onClick={() => {
                setLyricsSnippet('');
                void goToSuggestions('');
              }}
              disabled={isSearching}
              className="px-5 py-3 bg-white text-slate-500 rounded-2xl font-bold hover:bg-slate-100 transition-all disabled:opacity-50"
            >
              Pular
            </button>
          )}

          {step === 1 && (
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!normalizedTitle}
              className="px-6 py-3 bg-[#00153d] text-white rounded-2xl font-bold shadow-lg shadow-blue-900/20 hover:opacity-90 transition-all disabled:opacity-50"
            >
              Continuar
            </button>
          )}

          {step === 2 && (
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-6 py-3 bg-[#00153d] text-white rounded-2xl font-bold shadow-lg shadow-blue-900/20 hover:opacity-90 transition-all"
            >
              Continuar
            </button>
          )}

          {step === 3 && (
            <button
              type="button"
              onClick={() => void goToSuggestions()}
              disabled={isSearching}
              className="px-6 py-3 bg-[#00153d] text-white rounded-2xl font-bold shadow-lg shadow-blue-900/20 hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              <span>Buscar com IA</span>
            </button>
          )}

          {step === 4 && (
            <button
              type="button"
              onClick={() => void hydrateWithAi()}
              disabled={isSearching}
              className="px-6 py-3 bg-[#00153d] text-white rounded-2xl font-bold shadow-lg shadow-blue-900/20 hover:opacity-90 transition-all disabled:opacity-50"
            >
              Continuar
            </button>
          )}

          {step === 5 && (
            <button
              type="button"
              onClick={() => setStep(6)}
              disabled={isEnriching || !songKey.trim()}
              className="px-6 py-3 bg-[#00153d] text-white rounded-2xl font-bold shadow-lg shadow-blue-900/20 hover:opacity-90 transition-all disabled:opacity-50"
            >
              Revisar
            </button>
          )}

          {step === 6 && (
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={isSubmitting}
              className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-900/20 hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              <span>
                {isSubmitting
                  ? submitStatus === 'event'
                    ? 'Adicionando...'
                    : 'Salvando...'
                  : 'Salvar música'}
              </span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
