import { GoogleGenAI } from '@google/genai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
const GEMINI_MODEL = 'gemini-2.5-flash';
const SONG_INDEX_STORAGE_KEY = 'manancial.aiSongIndex.v3';
const GEMINI_TIMEOUT_MS = 10000;
const APPLE_MUSIC_TIMEOUT_MS = 3500;

if (!apiKey) {
  console.warn('VITE_GEMINI_API_KEY não encontrada no ambiente.');
}

const genai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export interface EnrichedSongData {
  title: string;
  artist: string;
  key: string;
  bpm?: number;
  difficulty: number;
  youtube_url?: string;
  chords_url?: string;
  lyrics_url?: string;
  cover_url?: string;
}

export interface SongSuggestionResult {
  title: string;
  artist: string;
  cover_url?: string;
}

export interface SongMatchSearchParams {
  title: string;
  artist?: string;
  lyricsSnippet?: string;
}

type RawEnrichedSongData = Partial<Record<keyof EnrichedSongData, unknown>>;
type RawSongSuggestionResult = Partial<Record<keyof SongSuggestionResult, unknown>>;

interface AppleMusicResult {
  trackName?: string;
  artistName?: string;
  artworkUrl100?: string;
}

interface SongIndex {
  enriched: Record<string, EnrichedSongData>;
}

const PROMPT_TEMPLATE = `
Você é um especialista em música cristã (louvor e adoração).
Sua tarefa é encontrar informações precisas sobre a música "{TITLE}" do artista "{ARTIST}".

Use busca na web quando disponível para confirmar os links antes de responder.
Pesquise especificamente:
- YouTube oficial ou vídeo mais reconhecido da música.
- CifraClub: site:cifraclub.com.br "{TITLE}" "{ARTIST}".
- Letras.mus.br: site:letras.mus.br "{TITLE}" "{ARTIST}".

Retorne EXATAMENTE um objeto JSON com o seguinte formato:
{
  "title": "Título oficial da música",
  "artist": "Artista/Banda oficial",
  "key": "Tom original (Ex: C, G, Am, F#m)",
  "bpm": 120, (Número aproximado do BPM original)
  "difficulty": 3, (Nível de 1 a 5, onde 1 é muito fácil e 5 é muito técnico/difícil)
  "youtube_url": "Link do vídeo oficial ou mais popular no YouTube",
  "chords_url": "Link da cifra no CifraClub (prioritário) ou cifra.com.br",
  "lyrics_url": "Link da letra no Letras.mus.br (prioritário) ou letras.com.br",
  "cover_url": "Link da imagem da capa do álbum ou single (URL pública e direta)"
}

Importante:
- Se não encontrar um link específico, deixe o campo como null.
- O tom deve estar na notação universal (C, C#, Db, D, D#, Eb, E, F, F#, Gb, G, G#, Ab, A, A#, Bb, B). Use 'm' para menor (Ex: Am).
- Não invente URLs diretas de CifraClub ou Letras.mus.br. Só retorne URL direta se ela existir nos resultados. Se não conseguir confirmar, use null.
- Corrija grafia de artista/título quando a busca indicar a forma oficial.
- Retorne apenas o JSON, sem textos explicativos antes ou depois.
`;

const VALID_KEYS = new Set([
  'C',
  'C#',
  'Db',
  'D',
  'D#',
  'Eb',
  'E',
  'F',
  'F#',
  'Gb',
  'G',
  'G#',
  'Ab',
  'A',
  'A#',
  'Bb',
  'B',
]);

function asText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function asNumber(value: unknown): number | undefined {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;

  return Promise.race([
    promise.finally(() => globalThis.clearTimeout(timeoutId)),
    new Promise<T>((_, reject) => {
      timeoutId = globalThis.setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]);
}

function normalizeDifficulty(value: unknown) {
  const difficulty = asNumber(value);
  if (!difficulty) return 3;
  return Math.min(5, Math.max(1, Math.round(difficulty)));
}

function normalizeBpm(value: unknown) {
  const bpm = asNumber(value);
  if (!bpm || bpm < 40 || bpm > 240) return undefined;
  return Math.round(bpm);
}

function normalizeKey(value: unknown) {
  const key = asText(value);
  if (!key) return 'C';

  const isMinor = key.toLowerCase().endsWith('m');
  const root = isMinor ? key.slice(0, -1) : key;
  const normalizedRoot = root.charAt(0).toUpperCase() + root.slice(1);

  if (!VALID_KEYS.has(normalizedRoot)) return 'C';
  return `${normalizedRoot}${isMinor ? 'm' : ''}`;
}

function normalizeUrl(value: unknown, fallbackUrl: string) {
  const url = asText(value);
  if (!url) return fallbackUrl;

  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
  } catch {
    // Intentionally fall back to a search URL below.
  }

  return fallbackUrl;
}

function normalizeDirectUrl(value: unknown, allowedHosts: string[]) {
  const url = normalizeOptionalUrl(value);
  if (!url) return undefined;

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^www\./, '');
    const isAllowedHost = allowedHosts.some((host) => hostname === host || hostname.endsWith(`.${host}`));
    const isSearchUrl =
      hostname.includes('google.') ||
      parsed.pathname.includes('/search') ||
      parsed.searchParams.has('q') ||
      parsed.searchParams.has('search_query');

    return isAllowedHost && !isSearchUrl ? parsed.toString() : undefined;
  } catch {
    return undefined;
  }
}

function normalizeYoutubeWatchUrl(value: unknown) {
  const url = normalizeOptionalUrl(value);
  const videoId = getYoutubeVideoId(url);
  return videoId ? `https://www.youtube.com/watch?v=${videoId}` : undefined;
}

function normalizeOptionalUrl(value: unknown) {
  const url = asText(value);
  if (!url) return undefined;

  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function normalizeCoverCandidate(value: unknown) {
  const url = normalizeOptionalUrl(value);
  if (!url) return undefined;

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^www\./, '');
    const pathname = parsed.pathname.toLowerCase();
    const isLikelyImage =
      hostname.includes('mzstatic.com') ||
      hostname.includes('ytimg.com') ||
      hostname.includes('img.youtube.com') ||
      hostname.includes('googleusercontent.com') ||
      /\.(jpe?g|png|webp)(?:$|[?#])/i.test(pathname);

    return isLikelyImage ? parsed.toString() : undefined;
  } catch {
    return undefined;
  }
}

function buildSearchUrl(baseUrl: string, query: string) {
  return `${baseUrl}${encodeURIComponent(query)}`;
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' e ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getPrimaryArtistName(artist: string) {
  return artist
    .split(/\s+(?:&|e|feat\.?|ft\.?|com)\s+|,/i)[0]
    .trim() || artist;
}

function buildDirectMusicUrl(baseUrl: string, title: string, artist: string) {
  return `${baseUrl}/${slugify(getPrimaryArtistName(artist))}/${slugify(title)}/`;
}

function normalizeLookupKey(title: string, artist: string) {
  return `${slugify(title)}::${slugify(artist)}`;
}

function getSongIndex(): SongIndex {
  if (typeof window === 'undefined') return { enriched: {} };

  try {
    const raw = window.localStorage.getItem(SONG_INDEX_STORAGE_KEY);
    if (!raw) return { enriched: {} };
    const parsed = JSON.parse(raw) as Partial<SongIndex>;
    return { enriched: parsed.enriched ?? {} };
  } catch {
    return { enriched: {} };
  }
}

function saveSongIndex(index: SongIndex) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(SONG_INDEX_STORAGE_KEY, JSON.stringify(index));
  } catch {
    // Storage failures should never block the IA flow.
  }
}

function getCachedSong(title: string, artist: string) {
  return getSongIndex().enriched[normalizeLookupKey(title, artist)] ?? null;
}

function cacheSong(song: EnrichedSongData) {
  const index = getSongIndex();
  index.enriched[normalizeLookupKey(song.title, song.artist)] = song;
  saveSongIndex(index);
}

function extractJson(text: string) {
  const trimmed = text.trim();
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    return trimmed;
  }

  const firstObject = trimmed.indexOf('{');
  const firstArray = trimmed.indexOf('[');
  const firstJson =
    firstObject === -1 ? firstArray : firstArray === -1 ? firstObject : Math.min(firstObject, firstArray);
  const lastJson = Math.max(trimmed.lastIndexOf('}'), trimmed.lastIndexOf(']'));

  if (firstJson === -1 || lastJson === -1 || lastJson <= firstJson) return trimmed;
  return trimmed.slice(firstJson, lastJson + 1);
}

function normalizeEnrichedSongData(raw: RawEnrichedSongData, title: string, artist: string): EnrichedSongData {
  const officialTitle = asText(raw.title) ?? title;
  const officialArtist = asText(raw.artist) ?? artist;
  const query = `${officialTitle} ${officialArtist}`;
  const bpm = normalizeBpm(raw.bpm);
  const youtubeUrl = normalizeYoutubeWatchUrl(raw.youtube_url);
  const chordsUrl =
    normalizeDirectUrl(raw.chords_url, ['cifraclub.com.br', 'cifra.com.br']) ??
    buildDirectMusicUrl('https://www.cifraclub.com.br', officialTitle, officialArtist);
  const lyricsUrl =
    normalizeDirectUrl(raw.lyrics_url, ['letras.mus.br', 'letras.com.br']) ??
    buildDirectMusicUrl('https://www.letras.mus.br', officialTitle, officialArtist);

  return {
    title: officialTitle,
    artist: officialArtist,
    key: normalizeKey(raw.key),
    ...(bpm ? { bpm } : {}),
    difficulty: normalizeDifficulty(raw.difficulty),
    ...(youtubeUrl ? { youtube_url: youtubeUrl } : {}),
    chords_url: chordsUrl,
    lyrics_url: lyricsUrl,
    cover_url: normalizeCoverUrl(raw.cover_url, youtubeUrl),
  };
}

function normalizeCoverUrl(value: unknown, youtubeUrl?: string) {
  const coverUrl = normalizeOptionalUrl(value);
  if (!coverUrl) return getYoutubeThumbnailUrl(youtubeUrl);

  const youtubeImageId = getYoutubeImageVideoId(coverUrl);
  if (youtubeImageId) return getYoutubeThumbnailUrlById(youtubeImageId);

  return coverUrl;
}

function getYoutubeThumbnailUrl(url?: string) {
  const videoId = getYoutubeVideoId(url);
  return videoId ? getYoutubeThumbnailUrlById(videoId) : undefined;
}

function getYoutubeThumbnailUrlById(videoId: string) {
  return `https://img.youtube.com/vi/${videoId}/0.jpg`;
}

function getYoutubeImageVideoId(url?: string) {
  if (!url) return undefined;

  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('ytimg.com') && !parsed.hostname.includes('img.youtube.com')) return undefined;
    const [, videoId] = parsed.pathname.match(/\/vi\/([^/]+)/) ?? [];
    return videoId;
  } catch {
    return undefined;
  }

  return undefined;
}

function getYoutubeVideoId(url?: string) {
  if (!url) return undefined;

  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) return parsed.pathname.slice(1) || undefined;
    if (parsed.hostname.includes('youtube.com')) return parsed.searchParams.get('v') ?? undefined;
  } catch {
    return undefined;
  }

  return undefined;
}

function isYoutubeImageUrl(url?: string) {
  return Boolean(getYoutubeImageVideoId(url));
}

function buildFallbackSongData(title: string, artist: string): EnrichedSongData {
  return {
    title,
    artist,
    key: 'C',
    difficulty: 3,
    chords_url: buildDirectMusicUrl('https://www.cifraclub.com.br', title, artist),
    lyrics_url: buildDirectMusicUrl('https://www.letras.mus.br', title, artist),
  };
}

async function enrichCoverFromAppleMusic(song: EnrichedSongData): Promise<EnrichedSongData> {
  if (song.cover_url && !isYoutubeImageUrl(song.cover_url)) return song;

  try {
    const results = await fetchAppleMusicResults(`${song.title} ${song.artist}`, 1);
    const artwork = results[0]?.artworkUrl100;
    if (!artwork) return song;

    return {
      ...song,
      cover_url: toLargeAppleArtwork(artwork),
    };
  } catch {
    return song;
  }
}

async function fetchAppleMusicResults(query: string, limit: number): Promise<AppleMusicResult[]> {
  const params = new URLSearchParams({
    term: query,
    entity: 'song',
    country: 'BR',
    limit: String(limit),
  });
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), APPLE_MUSIC_TIMEOUT_MS);

  const response = await fetch(`https://itunes.apple.com/search?${params.toString()}`, {
    signal: controller.signal,
  }).finally(() => globalThis.clearTimeout(timeoutId));

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as { results?: AppleMusicResult[] };
  return data.results ?? [];
}

function toLargeAppleArtwork(url: string) {
  return url.replace(/\/\d+x\d+bb\.jpg$/, '/600x600bb.jpg');
}

async function searchAppleMusicSuggestions(query: string): Promise<SongSuggestionResult[]> {
  const results = await fetchAppleMusicResults(query, 8);

  return results
    .map((result): SongSuggestionResult | null => {
      if (!result.trackName || !result.artistName) return null;

      return {
        title: result.trackName,
        artist: result.artistName,
        ...(result.artworkUrl100 ? { cover_url: toLargeAppleArtwork(result.artworkUrl100) } : {}),
      };
    })
    .filter((item): item is SongSuggestionResult => item !== null);
}

async function generateJson(prompt: string, useGoogleSearch: boolean) {
  if (!genai) return null;

  const response = await withTimeout(
    genai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        temperature: 0.2,
        ...(useGoogleSearch
          ? { tools: [{ googleSearch: {} }] }
          : { responseMimeType: 'application/json' }),
      },
    }),
    GEMINI_TIMEOUT_MS,
    'Tempo esgotado ao consultar Gemini.'
  );

  return response.text ?? null;
}

function parseJson<T>(text: string | null): T | null {
  if (!text) return null;

  try {
    return JSON.parse(extractJson(text)) as T;
  } catch {
    return null;
  }
}

function normalizeSongSuggestions(raw: unknown): SongSuggestionResult[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .slice(0, 8)
    .map((item: RawSongSuggestionResult): SongSuggestionResult | null => {
      const title = asText(item.title);
      const artist = asText(item.artist);
      if (!title || !artist) return null;

      const suggestion: SongSuggestionResult = {
        title,
        artist,
      };

      const coverUrl = normalizeCoverCandidate(item.cover_url);
      if (coverUrl) suggestion.cover_url = coverUrl;

      return suggestion;
    })
    .filter((item): item is SongSuggestionResult => item !== null);
}

export async function enrichSongData(title: string, artist: string): Promise<EnrichedSongData | null> {
  if (!genai) return null;

  try {
    const cached = getCachedSong(title, artist);
    if (cached) {
      const refreshed = await enrichCoverFromAppleMusic(cached);
      cacheSong(refreshed);
      return refreshed;
    }

    const prompt = PROMPT_TEMPLATE
      .replace('{TITLE}', title)
      .replace('{ARTIST}', artist);

    const grounded = parseJson<RawEnrichedSongData>(await generateJson(prompt, true));
    const structured = grounded ?? parseJson<RawEnrichedSongData>(await generateJson(prompt, false));
    const enriched = structured
      ? normalizeEnrichedSongData(structured, title, artist)
      : buildFallbackSongData(title, artist);
    const withCover = await enrichCoverFromAppleMusic(enriched);

    cacheSong(withCover);
    return withCover;
  } catch (error) {
    console.error('Erro ao chamar Gemini:', error);
    const fallback = await enrichCoverFromAppleMusic(buildFallbackSongData(title, artist));
    cacheSong(fallback);
    return fallback;
  }
}

const SEARCH_PROMPT_TEMPLATE = `
Você é um catálogo de música cristã. 
O usuário está digitando o nome de um louvor: "{QUERY}".
Retorne uma lista de até 8 possíveis matches (os mais famosos primeiro).

Retorne EXATAMENTE um array JSON com objetos no formato:
[
  {
    "title": "Título Correto",
    "artist": "Nome do Artista/Ministério",
    "cover_url": "URL da capa do álbum (se encontrar)"
  }
]

Importante:
- Se não tiver certeza absoluta do artista, sugira o mais provável.
- Retorne apenas o array JSON, sem textos explicativos.
`;

function buildContextualSearchPrompt({ title, artist, lyricsSnippet }: SongMatchSearchParams) {
  const context = [
    `Título pesquisado: "${title}"`,
    artist ? `Artista informado: "${artist}"` : null,
    lyricsSnippet ? `Trecho informado: "${lyricsSnippet}"` : null,
  ].filter(Boolean).join('\n');

  return `
Você é um catálogo de música cristã, louvor e adoração.
Encontre as correspondências mais prováveis para a música abaixo.

${context}

Use o título como sinal principal. Use artista e trecho apenas para desambiguar versões parecidas.
Retorne até 8 opções, as mais prováveis primeiro.

Retorne EXATAMENTE um array JSON com objetos no formato:
[
  {
    "title": "Título Correto",
    "artist": "Nome do Artista/Ministério",
    "cover_url": "URL da capa do álbum (se encontrar)"
  }
]

Importante:
- Se o trecho apontar para uma versão específica, priorize essa versão.
- Se não tiver certeza absoluta do artista, sugira o mais provável.
- Retorne apenas o array JSON, sem textos explicativos.
`;
}

export async function searchSongMatches(params: SongMatchSearchParams): Promise<SongSuggestionResult[]> {
  const title = params.title.trim();
  const artist = params.artist?.trim();
  const lyricsSnippet = params.lyricsSnippet?.trim();

  if (title.length < 3) return [];

  const baseQuery = [title, artist].filter(Boolean).join(' ');
  const baseSuggestionsPromise = searchSongs(baseQuery).catch(() => []);

  if (!genai || (!artist && !lyricsSnippet)) {
    return enrichSongSuggestionCovers(await baseSuggestionsPromise);
  }

  const contextualSuggestionsPromise = (async () => {
    const prompt = buildContextualSearchPrompt({ title, artist, lyricsSnippet });
    const raw =
      parseJson<unknown>(await generateJson(prompt, true)) ??
      parseJson<unknown>(await generateJson(prompt, false));
    return normalizeSongSuggestions(raw);
  })().catch((error) => {
    console.warn('Gemini falhou na busca contextual, usando busca simples:', error);
    return [] as SongSuggestionResult[];
  });

  const [baseSuggestions, contextualSuggestions] = await Promise.all([
    baseSuggestionsPromise,
    contextualSuggestionsPromise,
  ]);

  return enrichSongSuggestionCovers(mergeSongSuggestions([...contextualSuggestions, ...baseSuggestions]));
}

export async function searchSongs(query: string): Promise<SongSuggestionResult[]> {
  if (query.length < 3) return [];

  try {
    const prompt = SEARCH_PROMPT_TEMPLATE.replace('{QUERY}', query);
    const applePromise = searchAppleMusicSuggestions(query).catch(() => []);
    
    const cachedSuggestions = Object.values(getSongIndex().enriched)
      .filter((song) => `${song.title} ${song.artist}`.toLowerCase().includes(query.toLowerCase()))
      .map((song) => ({ title: song.title, artist: song.artist, cover_url: song.cover_url }))
      .slice(0, 8);

    const appleSuggestions = await applePromise;

    if (!genai) return enrichSongSuggestionCovers(mergeSongSuggestions([...cachedSuggestions, ...appleSuggestions]));

    let aiRaw = null;
    try {
      aiRaw = parseJson<unknown>(await generateJson(prompt, true)) ??
              parseJson<unknown>(await generateJson(prompt, false));
    } catch (aiError) {
      console.warn('Gemini falhou na busca, usando Apple Music:', aiError);
    }

    if (!aiRaw) return enrichSongSuggestionCovers(mergeSongSuggestions([...cachedSuggestions, ...appleSuggestions]));

    const aiSuggestions = normalizeSongSuggestions(aiRaw);
    return enrichSongSuggestionCovers(mergeSongSuggestions([...cachedSuggestions, ...appleSuggestions, ...aiSuggestions]));
  } catch (error) {
    console.error('Erro crítico ao buscar sugestões:', error);
    return [];
  }
}

function mergeSongSuggestions(suggestions: SongSuggestionResult[]) {
  const merged = new Map<string, SongSuggestionResult>();

  for (const song of suggestions) {
    const key = normalizeLookupKey(song.title, song.artist);
    const coverUrl = normalizeCoverCandidate(song.cover_url);
    const existing = merged.get(key);

    if (!existing) {
      merged.set(key, {
        ...song,
        ...(coverUrl ? { cover_url: coverUrl } : {}),
      });
      continue;
    }

    if (!existing.cover_url && coverUrl) {
      merged.set(key, { ...existing, cover_url: coverUrl });
    }
  }

  return Array.from(merged.values()).slice(0, 8);
}

async function enrichSongSuggestionCovers(suggestions: SongSuggestionResult[]) {
  return Promise.all(
    suggestions.map(async (suggestion) => {
      if (normalizeCoverCandidate(suggestion.cover_url)) {
        return suggestion;
      }

      const appleCoverUrl = await findAppleArtworkForSuggestion(suggestion);
      return appleCoverUrl ? { ...suggestion, cover_url: appleCoverUrl } : suggestion;
    })
  );
}

async function findAppleArtworkForSuggestion(suggestion: SongSuggestionResult) {
  try {
    const results = await fetchAppleMusicResults(`${suggestion.title} ${suggestion.artist}`, 5);
    const suggestionTitle = slugify(suggestion.title);
    const suggestionArtist = slugify(getPrimaryArtistName(suggestion.artist));

    const exactMatch = results.find((result) => {
      if (!result.trackName || !result.artistName || !result.artworkUrl100) return false;

      const resultTitle = slugify(result.trackName);
      const resultArtist = slugify(getPrimaryArtistName(result.artistName));
      const titleMatches = resultTitle.includes(suggestionTitle) || suggestionTitle.includes(resultTitle);
      const artistMatches = resultArtist.includes(suggestionArtist) || suggestionArtist.includes(resultArtist);

      return titleMatches && artistMatches;
    });

    const artwork = exactMatch?.artworkUrl100 ?? results.find((result) => result.artworkUrl100)?.artworkUrl100;
    return artwork ? toLargeAppleArtwork(artwork) : undefined;
  } catch {
    return undefined;
  }
}
