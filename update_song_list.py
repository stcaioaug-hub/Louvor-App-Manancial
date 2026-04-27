import re

with open('src/features/songs/SongList.tsx', 'r') as f:
    content = f.read()

# Add imports
content = content.replace("import { BackButton } from '../../components/BackButton';", 
                          "import { BackButton } from '../../components/BackButton';\nimport { SongClassificationWizard } from './SongClassificationWizard';")

# Add utility functions before SongList component
utils = """
export function getSongReadinessLabel(song: Song): string {
  if (song.isActiveRepertoire === false) return 'Fora do repertório ativo';
  if (
    song.rehearsalStatus === 'rehearsed' &&
    song.teamKnowledge === 'we_know' &&
    song.rehearsalNeed === 'ready' &&
    song.attentionLevel === 'normal'
  ) {
    return 'Pronto para culto';
  }
  if (
    song.teamKnowledge === 'we_know' &&
    song.attentionLevel &&
    ['attention', 'high_attention'].includes(song.attentionLevel)
  ) {
    return 'Sabemos, mas exige atenção';
  }
  if (
    song.teamKnowledge === 'we_know' &&
    song.rehearsalNeed === 'light_rehearsal'
  ) {
    return 'Sabemos, mas precisa revisar';
  }
  if (
    song.rehearsalStatus === 'not_rehearsed' &&
    song.teamKnowledge === 'we_know'
  ) {
    return 'Não ensaiado oficialmente, mas conhecido';
  }
  if (
    song.teamKnowledge === 'we_do_not_know' &&
    song.technicalLevel &&
    song.technicalLevel >= 7
  ) {
    return 'Novo e técnico — precisa de preparo';
  }
  if (
    song.rehearsalStatus === 'not_rehearsed' &&
    song.teamKnowledge === 'we_do_not_know'
  ) {
    return 'Novo para tirar';
  }
  return 'A classificar';
}

export function getRehearsalPriority(song: Song): 'low' | 'medium' | 'high' | 'urgent' {
  if (song.isActiveRepertoire === false) return 'low';
  if (
    song.rehearsalNeed === 'intensive_rehearsal' ||
    (song.teamKnowledge === 'we_do_not_know' && (song.technicalLevel ?? 0) >= 7)
  ) {
    return 'urgent';
  }
  if (
    song.rehearsalNeed === 'needs_rehearsal' ||
    song.attentionLevel === 'high_attention'
  ) {
    return 'high';
  }
  if (
    song.rehearsalNeed === 'light_rehearsal' ||
    song.attentionLevel === 'attention'
  ) {
    return 'medium';
  }
  return 'low';
}

type FilterType = 
  | 'all' 
  | 'active'
  | 'inactive'
  | 'ready_for_service'
  | 'needs_rehearsal'
  | 'intensive_rehearsal'
  | 'we_know'
  | 'we_do_not_know'
  | 'attention'
  | 'high_attention'
  | 'technical_7_plus'
  | 'new_to_learn'
  | 'review_this_month'
  | 'favorites' 
  | 'mostPlayed' 
  | 'mostRehearsed';
"""

content = content.replace("type FilterType = 'all' | 'favorites' | 'mostPlayed' | 'mostRehearsed';", utils)

# Update state variables
content = content.replace("const [showFilters, setShowFilters] = useState(false);",
                          "const [showFilters, setShowFilters] = useState(false);\n  const [showWizard, setShowWizard] = useState(false);")

# Update filteredSongs logic
filtered_logic = """
    if (filterType === 'active') {
      result = result.filter(s => s.isActiveRepertoire !== false);
    } else if (filterType === 'inactive') {
      result = result.filter(s => s.isActiveRepertoire === false);
    } else if (filterType === 'ready_for_service') {
      result = result.filter(s => getSongReadinessLabel(s) === 'Pronto para culto');
    } else if (filterType === 'needs_rehearsal') {
      result = result.filter(s => s.rehearsalNeed === 'needs_rehearsal');
    } else if (filterType === 'intensive_rehearsal') {
      result = result.filter(s => s.rehearsalNeed === 'intensive_rehearsal');
    } else if (filterType === 'we_know') {
      result = result.filter(s => s.teamKnowledge === 'we_know');
    } else if (filterType === 'we_do_not_know') {
      result = result.filter(s => s.teamKnowledge === 'we_do_not_know');
    } else if (filterType === 'attention') {
      result = result.filter(s => s.attentionLevel === 'attention');
    } else if (filterType === 'high_attention') {
      result = result.filter(s => s.attentionLevel === 'high_attention');
    } else if (filterType === 'technical_7_plus') {
      result = result.filter(s => (s.technicalLevel || 0) >= 7);
    } else if (filterType === 'new_to_learn') {
      result = result.filter(s => getSongReadinessLabel(s) === 'Novo para tirar');
    } else if (filterType === 'review_this_month') {
      result = result.filter(s => getSongReadinessLabel(s) === 'Revisar todo mês' || (s.attentionLevel === 'high_attention' && (s.technicalLevel || 0) >= 7));
    } else if (filterType === 'favorites') {
      result = result.filter(s => s.isFavorite);
    } else if (filterType === 'mostPlayed') {
      result = result.sort((a, b) => (b.timesPlayed || 0) - (a.timesPlayed || 0));
    } else if (filterType === 'mostRehearsed') {
      result = result.sort((a, b) => (b.timesRehearsed || 0) - (a.timesRehearsed || 0));
    }
"""

content = re.sub(r"if \(filterType === 'favorites'\) \{.*\} else if \(filterType === 'mostRehearsed'\) \{\n      result = result\.sort\(\(a, b\) => \(b\.timesRehearsed \|\| 0\) - \(a\.timesRehearsed \|\| 0\)\);\n    \}", filtered_logic.strip(), content, flags=re.DOTALL)

# Add Wizard button
wizard_btn = """
            {canEdit && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowWizard(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-4 rounded-[1.5rem] text-xs font-black uppercase tracking-widest shadow-lg hover:opacity-90 transition-all"
                title="Classificar Repertório"
              >
                <Star size={18} />
                <span className="hidden lg:inline">Classificar Repertório</span>
              </motion.button>
            )}
"""

content = content.replace("{canEdit && (\n              <motion.button\n                whileHover={{ scale: 1.02 }}", wizard_btn.strip() + "\n            {canEdit && (\n              <motion.button\n                whileHover={{ scale: 1.02 }}")

# Add filter buttons
filter_buttons = """
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as FilterType)}
                className="w-full sm:w-auto px-6 py-3 bg-white border border-black/5 rounded-2xl text-sm font-bold text-[#00153d] focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
              >
                <option value="all">Todos os Louvores</option>
                <option value="active">Repertório Ativo</option>
                <option value="inactive">Fora do Repertório Ativo</option>
                <option value="ready_for_service">✅ Prontos para culto</option>
                <option value="needs_rehearsal">⚠️ Precisam de ensaio</option>
                <option value="intensive_rehearsal">🚨 Precisam de muito ensaio</option>
                <option value="we_know">🎸 Sabemos tocar</option>
                <option value="we_do_not_know">📚 Não sabemos ainda</option>
                <option value="attention">👀 Precisam de atenção</option>
                <option value="high_attention">🔥 Atenção alta</option>
                <option value="technical_7_plus">🎸 Nível técnico 7+</option>
                <option value="new_to_learn">🆕 Novos para tirar</option>
                <option value="review_this_month">📅 Revisar este mês</option>
                <option value="favorites">⭐ Favoritos</option>
                <option value="mostPlayed">▶️ Mais Tocados</option>
                <option value="mostRehearsed">🎤 Mais Ensaiados</option>
              </select>
"""

content = re.sub(r"<button\n\s+onClick=\{\(\) => setFilterType\('all'\)\}.*?</button>\n\s+</div>", filter_buttons.strip() + "\n            </div>", content, flags=re.DOTALL)

# Insert the Song Readiness Label below the song title
label_ui = """
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] md:text-xs text-slate-500 font-medium truncate">{song.artist}</p>
                    {song.bpm && (
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{song.bpm} BPM</span>
                    )}
                  </div>
                  <div className="mt-1 flex gap-1">
                    {getSongReadinessLabel(song) !== 'A classificar' && (
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest border ${
                        getSongReadinessLabel(song) === 'Pronto para culto' ? 'bg-green-50 text-green-600 border-green-200' :
                        getSongReadinessLabel(song) === 'Sabemos, mas exige atenção' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                        getSongReadinessLabel(song) === 'Sabemos, mas precisa revisar' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                        getSongReadinessLabel(song) === 'Novo e técnico — precisa de preparo' ? 'bg-red-50 text-red-600 border-red-200' :
                        'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {getSongReadinessLabel(song)}
                      </span>
                    )}
                  </div>
"""

content = content.replace("""<div className="flex items-center gap-2">
                    <p className="text-[10px] md:text-xs text-slate-500 font-medium truncate">{song.artist}</p>
                    {song.bpm && (
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{song.bpm} BPM</span>
                    )}
                  </div>""", label_ui.strip())

# Add Wizard Modal
wizard_modal = """
      <AnimatePresence>
        {showWizard && (
          <SongClassificationWizard
            songs={songs}
            onUpdateSong={onUpdateSong}
            onClose={() => setShowWizard(false)}
          />
        )}
      </AnimatePresence>
"""

content = content.replace("</AnimatePresence>\n\n      <ConfirmDialog", "</AnimatePresence>\n" + wizard_modal + "\n      <ConfirmDialog")

with open('src/features/songs/SongList.tsx', 'w') as f:
    f.write(content)

