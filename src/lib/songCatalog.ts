import { LinkOption, Song } from '../types';

type LinkKind = 'chords' | 'lyrics' | 'video' | 'cover';

interface SongCatalogEntry {
  id: string;
  title?: string;
  artist?: string;
  correctDisplay?: boolean;
  coverUrl?: string;
  links?: Partial<Song['links']>;
  options?: Partial<Record<LinkKind, LinkOption[]>>;
  staleUrls?: string[];
}

const yt = (id: string) => `https://www.youtube.com/watch?v=${id}`;
const ytCover = (id: string) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

const CATALOG: SongCatalogEntry[] = [
  {
    id: 'eea04b3c-63c9-4356-8456-909d8b354334',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/be/e9/e2/bee9e21b-0d9d-325a-8639-3ccdd06a7a34/7898556741491.png/600x600bb.jpg',
    links: {
      chords: 'https://www.cifraclub.com.br/diante-do-trono/aclame-ao-senhor/',
      lyrics: 'https://www.letras.mus.br/diante-do-trono/45465/',
      video: yt('U4l40DvaeGw'),
    },
    options: { video: [{ label: 'YouTube oficial', url: yt('U4l40DvaeGw') }, { label: 'YouTube alternativa', url: yt('HH_xxJ0ZjC4') }] },
  },
  {
    id: '74001710-d064-4716-996c-e16763a4da14',
    title: 'Amigo Fiel',
    artist: 'Diante do Trono',
    correctDisplay: true,
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/ea/82/6d/ea826d73-437b-d7b4-a928-214db67267b7/7891430294625.png/600x600bb.jpg',
    links: {
      chords: 'https://www.cifraclub.com.br/diante-do-trono/amigo-fiel/',
      lyrics: 'https://www.letras.mus.br/diante-do-trono/45467/',
      video: yt('JrC6_kyyJ94'),
    },
    options: { video: [{ label: 'DVD Exaltado', url: yt('JrC6_kyyJ94') }, { label: 'DVD Brasil DT', url: yt('mSRQOWjGG3I') }] },
  },
  {
    id: '0a52138b-3a9a-43c0-8b52-460497e58750',
    title: 'Aquele Que Está Feliz',
    artist: 'Comunidade de Nilópolis',
    correctDisplay: true,
    coverUrl: ytCover('x6WOuUJNQ2s'),
    links: {
      chords: 'https://www.cifraclub.com.br/comunidade-de-nilopolis/aquele-que-esta-feliz/',
      lyrics: 'https://www.letras.mus.br/comunidade-de-nilopolis/189939/',
      video: yt('x6WOuUJNQ2s'),
    },
    staleUrls: [
      'https://www.cifraclub.com.br/comunidade-evangelica-internacional-da-zona-sul/aquele-que-esta-feliz/',
      'https://www.letras.mus.br/comunidade-evangelica-internacional-da-zona-sul/aquele-que-esta-feliz/',
    ],
  },
  {
    id: '720da98c-0770-4f72-902b-c2b4ad6cf5c5',
    title: 'Até Que o Senhor Venha',
    artist: 'Ministério Zoe',
    correctDisplay: true,
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/c3/06/e2/c306e278-379b-3bf4-9931-abdc1472413a/0.jpg/600x600bb.jpg',
    links: {
      chords: 'https://www.cifraclub.com.br/ministerio-zoe/ate-que-o-senhor-venha/',
      lyrics: 'https://www.letras.mus.br/ministerio-zoe/ate-que-o-senhor-venha/',
      video: yt('PpARIgVb2IE'),
    },
    options: { video: [{ label: 'Ministério Zoe', url: yt('PpARIgVb2IE') }, { label: 'Cultura do Céu', url: yt('E0F9NvrSoa0') }] },
    staleUrls: [
      'https://www.cifraclub.com.br/ministerio-ipiranga/ate-que-o-senhor-venha/',
      'https://www.letras.mus.br/ministerio-ipiranga/ate-que-o-senhor-venha/',
    ],
  },
  {
    id: '76c3a444-f5be-4d94-bcc1-85a1d3c35370',
    title: 'Até Que o Senhor Venha',
    artist: 'Attos2 Worship',
    correctDisplay: true,
    links: {
      chords: 'https://www.cifraclub.com.br/ministerio-zoe/ate-que-o-senhor-venha/',
      lyrics: 'https://www.letras.mus.br/ministerio-zoe/ate-que-o-senhor-venha/',
      video: yt('FKcXHmYJ1IU'),
    },
    options: { video: [{ label: 'Attos2 Worship', url: yt('FKcXHmYJ1IU') }, { label: 'Ministério Zoe', url: yt('PpARIgVb2IE') }] },
    staleUrls: [
      'https://www.cifraclub.com.br/atos-dois-worship/ate-que-o-senhor-venha/',
      'https://www.letras.mus.br/atos-dois-worship/ate-que-o-senhor-venha/',
    ],
  },
  {
    id: 'eb7a7715-a803-41b6-8f37-3b116431df1b',
    title: 'Atrai o Meu Coração',
    artist: 'Filhos do Homem',
    correctDisplay: true,
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/40/f3/44/40f34480-241f-62cb-f2e1-0333a3ff3105/0.jpg/600x600bb.jpg',
    links: {
      chords: 'https://www.cifraclub.com.br/filhos-do-homem/atrai-meu-coracao/',
      lyrics: 'https://www.letras.mus.br/filhos-do-homem/atrai-o-meu-coracao/',
      video: yt('WnfS1Aqn6YM'),
    },
    options: { video: [{ label: 'Filhos do Homem', url: yt('WnfS1Aqn6YM') }, { label: 'Versão acústica', url: yt('rhOMEQ970FA') }] },
  },
  {
    id: '5de1a0df-7aeb-48a8-bf66-f6b146cc9289',
    title: 'Atrai o Meu Coração',
    artist: 'Filhos do Homem',
    correctDisplay: true,
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music42/v4/b6/c8/33/b6c83388-d792-3465-71b3-e18aaf57c5e3/7892860244549.jpg/600x600bb.jpg',
    links: {
      chords: 'https://www.cifraclub.com.br/filhos-do-homem/atrai-meu-coracao/',
      lyrics: 'https://www.letras.mus.br/filhos-do-homem/atrai-o-meu-coracao/',
      video: yt('WTcHSW43bt0'),
    },
    options: {
      chords: [{ label: 'Cifra principal', url: 'https://www.cifraclub.com.br/filhos-do-homem/atrai-meu-coracao/' }, { label: 'Cifra versão 2', url: 'https://www.cifraclub.com.br/filhos-do-homem/atrai-meu-coracao/versao-2.html' }],
      video: [{ label: 'Filhos do Homem', url: yt('WTcHSW43bt0') }, { label: 'Acústico', url: yt('rhOMEQ970FA') }],
    },
    staleUrls: [
      'https://www.cifraclub.com.br/ministerio-zoe/atrai-me-coracao/',
      'https://www.letras.mus.br/ministerio-zoe/atrai-me-coracao/',
    ],
  },
  {
    id: '241e6f5a-6e75-4d84-868e-c89f226cc1e9',
    title: 'Celebrai a Cristo, Celebrai',
    artist: 'Harpa Cristã',
    correctDisplay: true,
    coverUrl: ytCover('XAuqvHY9Jak'),
    links: {
      chords: 'https://www.cifraclub.com.br/harpa-crista/celebrai-a-cristo-celebrai/',
      lyrics: 'https://www.letras.mus.br/harpa-crista/931657/',
      video: yt('XAuqvHY9Jak'),
    },
    options: { video: [{ label: 'Harpa Cristã', url: yt('XAuqvHY9Jak') }, { label: '3 Palavrinhas', url: yt('msSQW7Lcl4w') }] },
  },
  {
    id: 'fe161e7e-94e0-421b-b0ef-5ac6b82640f7',
    title: 'Cruz',
    artist: 'Reino Song feat. Casa Worship',
    correctDisplay: true,
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/ce/06/61/ce0661c0-41f1-b794-4a1e-e9127309b13f/0.jpg/600x600bb.jpg',
    links: {
      chords: 'https://www.cifraclub.com.br/reino-song/cruz/',
      lyrics: 'https://www.letras.mus.br/casa-worship/cruz/',
      video: yt('h7mRVFXqjlg'),
    },
    options: { video: [{ label: 'Clipe oficial', url: yt('h7mRVFXqjlg') }, { label: 'Letra', url: yt('EHdrG-o9zeo') }] },
  },
  {
    id: 'cfe45c57-e41e-4231-8ea0-0f8445c104d3',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/f1/51/2f/f1512fa6-b2bc-30c5-ab8a-7227dec1f134/Quatro_por_Um_De_Volta_a_Inocencia.jpg/600x600bb.jpg',
    links: { video: yt('DYF1KjjjgGY'), lyrics: 'https://www.letras.mus.br/quatro-por-um/201287/' },
    options: { video: [{ label: 'Clipe MK Music', url: yt('DYF1KjjjgGY') }, { label: 'Clipe Uni Records', url: yt('ahz6-0XKnQw') }] },
  },
  {
    id: 'c5f94321-486f-48d6-91e6-759c49f4575d',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/3b/6e/fd/3b6efd29-e9e2-e00a-14ae-3b4c37b82b78/7898563117036.png/600x600bb.jpg',
    links: {
      chords: 'https://www.cifraclub.com.br/central-3/digno-de-tudo-part-gabriela-maganete-e-gabi-sampaio/',
      video: yt('46r7YDxB0t4'),
    },
    staleUrls: ['https://www.cifraclub.com.br/central-3/digno-de-tudo/'],
  },
  {
    id: 'aace0e41-b2c2-4817-ab81-ded311c13a5f',
    title: 'Bom É Estarmos Aqui',
    artist: 'Corinhos Evangélicos',
    coverUrl: ytCover('U1YV61O7Yog'),
    links: {
      chords: 'https://www.cifraclub.com.br/corinhos-evangelicos/bom-estarmos-aqui/',
      lyrics: 'https://www.letras.mus.br/corinhos-evangelicos/1261998/',
      video: yt('U1YV61O7Yog'),
    },
    options: { video: [{ label: 'Renascer Praise', url: yt('U1YV61O7Yog') }, { label: 'Corinhos', url: yt('05VsM0W3Bz4') }] },
    staleUrls: ['https://www.cifraclub.com.br/corinhos-evangelicos/e-bom-estarmos-aqui/'],
  },
  {
    id: 'c8048130-10ee-4942-84bb-d6906aebc7d2',
    title: 'É Tudo Sobre Você',
    artist: 'MORADA',
    correctDisplay: true,
    links: {
      chords: 'https://www.cifraclub.com.br/ministerio-morada/e-tudo-sobre-voce/',
      lyrics: 'https://www.letras.mus.br/ministerio-morada/e-tudo-sobre-voce/',
      video: yt('ePdRgBWhvog'),
    },
    options: { video: [{ label: 'Clipe oficial', url: yt('ePdRgBWhvog') }, { label: 'Ao vivo', url: yt('UnEd_pFGWGw') }] },
    staleUrls: [
      'https://www.cifraclub.com.br/bruno-morada/e-tudo-sobre-voce/',
      'https://www.letras.mus.br/bruno-morada/e-tudo-sobre-voce/',
      'https://www.youtube.com/results?search_query=%C3%89%20tudo%20sobre%20voc%C3%AA%20Bruno%20Morada',
    ],
  },
  {
    id: 'ef9d5fc0-058d-4d78-8867-ee3595df3922',
    title: 'Escape',
    artist: 'Renascer Praise',
    correctDisplay: true,
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/a2/0d/39/a20d3934-aaf1-01af-214c-5a75b872411c/0.jpg/600x600bb.jpg',
    links: {
      chords: 'https://www.cifraclub.com.br/renascer-praise/escape/',
      lyrics: 'https://www.letras.mus.br/renascer-praise/escape/',
      video: yt('vM2A2XEm9TE'),
    },
    options: { video: [{ label: 'Ao vivo', url: yt('vM2A2XEm9TE') }, { label: 'Letra', url: yt('q5FeNlpexb8') }] },
  },
  {
    id: '498eb0b2-df1c-45f1-be21-8cc9da7ff1dc',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/71/ef/87/71ef874a-e28a-7773-5f13-715f18f710d6/dj.gfmdymsy.jpg/600x600bb.jpg',
    links: { video: yt('m880fLk5N0I'), lyrics: 'https://www.letras.mus.br/quatro-por-um/1160828/' },
    options: { video: [{ label: 'Quatro por Um', url: yt('m880fLk5N0I') }, { label: 'Áudio', url: yt('riRbvZ8kH5M') }] },
  },
  {
    id: 'bfe86921-9d3d-4214-948a-e26d388d7969',
    title: 'Estamos de Pé',
    artist: 'Marcus Salles',
    correctDisplay: true,
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/78/ae/b8/78aeb849-13e5-e7f7-d079-1ef8735c535e/7898556758307.png/600x600bb.jpg',
    links: {
      chords: 'https://www.cifraclub.com.br/marcus-salles/estamos-de-pe/',
      lyrics: 'https://www.letras.mus.br/marcus-salles/estamos-de-pe/',
      video: yt('4x-yrCz1D9g'),
    },
    options: { video: [{ label: 'Ao vivo', url: yt('4x-yrCz1D9g') }, { label: 'Acoustic Session', url: yt('6c_xquTFfHs') }] },
  },
  {
    id: 'ba7c89ea-08b2-445a-b8c3-414d1e12b4dc',
    links: {
      chords: 'https://www.cifraclub.com.br/julliany-souza/eu-e-minha-casa-part-leo-brandao/',
      lyrics: 'https://www.letras.mus.br/julliany-souza/eu-e-minha-casa-part-leo-brandao/',
      video: yt('Rxzi3DSBs6Q'),
    },
    options: { video: [{ label: 'Clipe oficial', url: yt('Rxzi3DSBs6Q') }, { label: 'Letra', url: yt('wT8RZWVQ7nY') }] },
    staleUrls: [
      'https://www.cifraclub.com.br/julliany-souza-e-leo-brandao/eu-e-minha-casa/',
      'https://www.letras.mus.br/julliany-souza-e-leo-brandao/eu-e-minha-casa/',
      'https://www.youtube.com/results?search_query=Eu%20e%20Minha%20Casa%20Julliany%20Souza%20%26%20L%C3%A9o%20Brand%C3%A3o',
    ],
  },
  {
    id: 'be30a782-6cd3-41da-a12f-38165667b8d4',
    title: 'Moisés',
    artist: 'Fernandinho',
    correctDisplay: true,
    coverUrl: ytCover('HXmVq8OX4U8'),
    links: {
      chords: 'https://www.cifraclub.com.br/fernandinho/moises-dancar-na-chuva-vem-me-buscar-e-proibido-os-que-confiam-ao-vivo/',
      lyrics: 'https://www.letras.mus.br/fernandinho/moises/',
      video: yt('HXmVq8OX4U8'),
    },
    options: { video: [{ label: 'Álbum Único Live', url: yt('HXmVq8OX4U8') }, { label: 'Edição especial', url: yt('3fQwggyOV04') }] },
    staleUrls: [
      'https://www.cifraclub.com.br/fernandinho/eu-sou-livre/',
      'https://www.letras.mus.br/fernandinho/eu-sou-livre/',
    ],
  },
  {
    id: 'a2f3cb45-7363-4794-9b43-c26be5f948e8',
    title: 'A Face Adorada de Jesus',
    artist: 'Harpa Cristã',
    correctDisplay: true,
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/d6/5f/21/d65f2167-69f3-61a2-83db-c5b2732b9a73/7899004738995.png/600x600bb.jpg',
    links: {
      chords: 'https://www.cifraclub.com.br/harpa-crista/a-face-adorada-de-jesus/',
      lyrics: 'https://www.letras.mus.br/harpa-crista/450133/',
      video: yt('cngrsSMq8EY'),
    },
    staleUrls: ['https://www.cifraclub.com.br/harpa-crista/face-adorada/'],
  },
  {
    id: '107679e0-7204-4791-8edb-fa914cd08dd4',
    title: 'Fala Comigo',
    artist: 'Eyshila',
    correctDisplay: true,
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/5a/ec/0e/5aec0e17-2e05-7c6f-fcf0-81779933eb56/Terremoto.jpg/600x600bb.jpg',
    links: {
      chords: 'https://www.cifraclub.com.br/eyshila/fala-comigo/',
      lyrics: 'https://www.letras.mus.br/eyshila/fala-comigo/',
      video: yt('Q4DmsxAppFc'),
    },
    options: { video: [{ label: 'Ao vivo', url: yt('Q4DmsxAppFc') }, { label: 'Medley Marcus Salles', url: yt('KebmTFOsiAk') }] },
  },
  {
    id: 'f09d67b9-1047-4eca-9f46-9798c30019b1',
    title: 'Fazer Morada',
    artist: 'Casa do Oleiro Adoração',
    correctDisplay: true,
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/d6/1b/24/d61b24db-abb8-78ae-586c-3342977f5066/cover.jpg/600x600bb.jpg',
    links: {
      chords: 'https://www.cifraclub.com.br/casa-do-oleiro-adoracao/fazer-morada/',
      lyrics: 'https://www.letras.mus.br/casa-do-oleiro-adoracao/fazer-morada/',
      video: yt('woFF1j-0Ieo'),
    },
    options: { video: [{ label: 'Ao vivo', url: yt('woFF1j-0Ieo') }, { label: 'Clipe Todah', url: yt('5S3NNMlI9ug') }] },
  },
  {
    id: '4f03917d-13d7-423a-9c8d-f0ba4f86c5fd',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/dd/98/c6/dd98c639-7b20-43b6-e5e9-2e4fce8485f4/193483938660.jpg/600x600bb.jpg',
    links: { video: yt('9YC8iDNpyYU') },
    options: { video: [{ label: 'Clipe oficial', url: yt('9YC8iDNpyYU') }, { label: 'Lyric video', url: yt('bOFbr2RpLek') }] },
  },
  {
    id: '07b42716-d805-491c-9441-34425e47129c',
    title: 'Só Me Resta Te Adorar',
    artist: 'Ministério Sarando a Terra Ferida',
    correctDisplay: true,
    coverUrl: ytCover('81CQWs1hu8o'),
    links: {
      chords: 'https://www.cifraclub.com.br/ministerio-sarando-terra-ferida/so-me-resta-te-adorar/',
      lyrics: 'https://www.letras.mus.br/ministerio-sarando-terra-ferida/1505115/',
      video: yt('81CQWs1hu8o'),
    },
    staleUrls: ['https://www.cifraclub.com.br/ministerio-sarando-terra-ferida/gratidao/'],
  },
  {
    id: '6f648aae-9095-4bae-9997-38c071873763',
    title: 'Jesus Meu Guia É',
    artist: 'Raiz Coral',
    correctDisplay: true,
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/f5/ec/17/f5ec1721-4629-0738-06d6-8ec145b176e5/251051.jpg/600x600bb.jpg',
    links: {
      chords: 'https://www.cifraclub.com.br/raiz-coral/jesus-meu-guia-e/',
      lyrics: 'https://www.letras.mus.br/raiz-coral/198067/',
      video: yt('LDteyOatCmA'),
    },
    options: { video: [{ label: 'Raiz Coral', url: yt('LDteyOatCmA') }, { label: 'Com letra', url: yt('njSdQwG54Ww') }] },
  },
  {
    id: '87ae98b2-88ba-4492-94e5-ef2f5cd7d22d',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/96/bb/63/96bb635c-4429-c49a-354a-4d6539fbf141/190296341014.jpg/600x600bb.jpg',
    links: { video: yt('VyvjQVQaNgg'), lyrics: 'https://www.letras.mus.br/renascer-praise/262244/' },
  },
  {
    id: '86c0d153-848b-481e-83bb-5fad0d19ffc1',
    title: 'Marca da Promessa',
    artist: 'Trazendo a Arca',
    correctDisplay: true,
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/3d/06/83/3d06837f-1f53-b3dd-76e5-6889131306aa/197338874677.jpg/600x600bb.jpg',
    links: {
      chords: 'https://www.cifraclub.com.br/trazendo-arca/marca-da-promessa/',
      lyrics: 'https://www.letras.mus.br/trazendo-arca/1030076/',
      video: yt('jJKWUOUJKpc'),
    },
    options: { video: [{ label: 'Áudio oficial', url: yt('jJKWUOUJKpc') }, { label: 'Ao vivo', url: yt('4HaC9MJHNWk') }] },
  },
  {
    id: '9e17bfe9-f4df-4265-80fc-357943d6589d',
    title: '1000 Graus',
    artist: 'Renascer Praise',
    correctDisplay: true,
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/21/b1/a9/21b1a983-3063-5272-41a6-45428e3e988a/0.jpg/600x600bb.jpg',
    links: {
      chords: 'https://www.cifraclub.com.br/renascer-praise/1000-graus/',
      lyrics: 'https://www.letras.mus.br/renascer-praise/1000-graus-renascer-praise-18/',
      video: yt('QTC7_DVENZA'),
    },
    options: { video: [{ label: 'Clipe oficial', url: yt('QTC7_DVENZA') }, { label: 'Marcha para Jesus', url: yt('UPygJxZll2Y') }] },
    staleUrls: ['https://www.cifraclub.com.br/renascer-praise/mil-graus/'],
  },
  {
    id: 'f9a308dd-40bd-484d-a297-7ba47400b6ba',
    title: 'Pode Morar Aqui',
    artist: 'Theo Rubia',
    correctDisplay: true,
    coverUrl: 'https://cdn-images.dzcdn.net/images/cover/9003870e8df9ae9ab4594cc60556f792/500x500-000000-80-0-0.jpg',
    links: {
      chords: 'https://www.cifraclub.com.br/theo-rubia/pode-morar-aqui/',
      lyrics: 'https://www.letras.mus.br/theo-rubia/pode-morar-aqui/',
      video: yt('n0fDvJAyrQ8'),
    },
    options: { video: [{ label: 'Vídeo oficial', url: yt('n0fDvJAyrQ8') }, { label: 'Feat. Alessandro', url: yt('-zLG1DvLsEs') }] },
    staleUrls: [
      'https://www.cifraclub.com.br/ministerio-zoe/minhas-lamparinas/',
      'https://www.letras.mus.br/ministerio-zoe/minhas-lamparinas/',
    ],
  },
  {
    id: '1e839901-87fa-4b3f-9baa-541cffdb0222',
    title: 'Nada Temerei',
    artist: 'Igreja Batista Atitude Central da Barra',
    correctDisplay: true,
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/20/5a/3f/205a3ffe-8999-c285-05b4-9e1ce271897b/ATITUDE_Copy.jpg/600x600bb.jpg',
    links: {
      chords: 'https://www.cifraclub.com.br/igreja-batista-atitude-central-da-barra/nada-temerei/',
      lyrics: 'https://www.letras.mus.br/igreja-batista-atitude-central-da-barra/nada-temerei/',
      video: yt('0OeqfauPHqk'),
    },
    options: { video: [{ label: 'Live Session', url: yt('0OeqfauPHqk') }, { label: 'Clipe MK', url: yt('dCGgP7qDKiY') }] },
    staleUrls: [
      'https://www.cifraclub.com.br/igreja-batista-atitude/nada-temerei/',
      'https://www.letras.mus.br/igreja-batista-atitude/nada-temerei/',
    ],
  },
  {
    id: 'e7dca790-78cd-4d50-917b-703b3398ff31',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/a9/0d/95/a90d95af-8a8f-05bf-23cb-7205fad83d0a/7898908625042_Cover.jpg/600x600bb.jpg',
    links: { video: yt('X-IYqtdWsF4') },
    options: { video: [{ label: 'Ao vivo 2024', url: yt('X-IYqtdWsF4') }, { label: 'Com letra', url: yt('NkiuwYZsMAI') }] },
  },
  {
    id: '1660b541-262d-43a7-86a5-4842730a9a12',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music111/v4/12/63/27/12632733-8f2a-6c87-8698-ceff650fc0b5/0.jpg/600x600bb.jpg',
    links: {
      lyrics: 'https://www.letras.mus.br/rm6/48535/',
      video: yt('qlbYmmlaVjE'),
    },
    options: { video: [{ label: 'YouTube Music', url: yt('qlbYmmlaVjE') }, { label: 'Ao vivo', url: yt('46GWTbciYoU') }] },
    staleUrls: [
      'https://www.letras.mus.br/banda-rm6/protecao/',
      'https://www.youtube.com/watch?v=s0b_12f2R-Q',
      'https://e-cdns-images.dzcdn.net/images/cover/b41846b783510526e033282276532057/264x264-000000-80-0-0.jpg',
    ],
  },
  {
    id: '9266394c-cbe2-40bc-81af-b577982daee2',
    title: 'Ruja o Leão',
    artist: 'Talita Catanzaro',
    correctDisplay: true,
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/17/c2/c6/17c2c643-ddc1-d931-d30d-80c6d85647c1/0.jpg/600x600bb.jpg',
    links: {
      chords: 'https://www.cifraclub.com.br/talita-catanzaro/ruja-o-leao/',
      lyrics: 'https://www.letras.mus.br/talita-catanzaro/ruja-o-leao-que-se-abram-os-ceus-medley/',
      video: yt('jtm9HiYZ7UQ'),
    },
    options: { video: [{ label: 'Fhop Music', url: yt('jtm9HiYZ7UQ') }, { label: 'Isaias Saad/Nívea', url: yt('gTRFVMkMajw') }] },
    staleUrls: ['https://www.cifraclub.com.br/talita-catanzaro/que-ruja-o-leao/'],
  },
  {
    id: '1b18a355-b9f4-4326-a5be-48c3cbc2876a',
    title: 'Que Som É Esse?',
    artist: 'Ministério Zoe',
    correctDisplay: true,
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/aa/bf/be/aabfbe35-358d-5519-04e4-3026f626c267/0.jpg/600x600bb.jpg',
    links: {
      chords: 'https://www.cifraclub.com.br/ministerio-zoe/que-som-e-esse/',
      lyrics: 'https://www.letras.mus.br/ministerio-zoe/que-som-e-esse/',
      video: yt('700DisbyEOo'),
    },
    staleUrls: ['https://www.cifraclub.com.br/ministerio-zoe/quem-esse/', 'https://www.letras.mus.br/ministerio-zoe/quem-esse/'],
  },
  {
    id: 'd1640fd9-c2d2-41bf-adfb-20dfc7f3be79',
    title: 'Quero Conhecer Jesus',
    artist: 'Cia. SALT',
    correctDisplay: true,
    links: {
      chords: 'https://www.cifraclub.com.br/cia-salt/quero-conhecer-jesus-o-meu-amado--o-mais-belo/',
      lyrics: 'https://www.letras.mus.br/cia-salt/quero-conhecer-jesus-o-meu-amado-e-o-mais-belo/',
      video: yt('rBVjbjGVVjo'),
    },
    options: { video: [{ label: 'Cia. SALT', url: yt('rBVjbjGVVjo') }, { label: 'Lyric video', url: yt('Av3wErH_168') }] },
    staleUrls: ['https://www.cifraclub.com.br/cia-salt/quero-conhecer-jesus/'],
  },
  {
    id: '94ce2896-e75c-4217-b89c-a91e1712ca40',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music/v4/57/1d/1c/571d1c41-053b-a5e8-3559-6a65a74b3c1c/alb_ressusci_363570_alta.jpg/600x600bb.jpg',
    links: { video: yt('YNZc80t0Arw'), lyrics: 'https://www.letras.mus.br/ministerio-ipiranga/1466850/' },
  },
  {
    id: 'ceab9ac0-b8a4-448d-8e18-65befa54a150',
    coverUrl: 'https://cdn-images.dzcdn.net/images/cover/e3394173a3209f7cb752f3c8f391a4c8/500x500-000000-80-0-0.jpg',
    links: { video: yt('ijNCc7ICCck') },
    options: { video: [{ label: 'Gabriel Guedes', url: yt('ijNCc7ICCck') }, { label: 'Ao vivo YAH', url: yt('JL7knyBP-Cw') }] },
  },
  {
    id: '54d5e7d3-b92f-450c-a005-f7c4144c03cb',
    title: 'Só Tu És Santo',
    artist: 'MORADA',
    correctDisplay: true,
    coverUrl: 'https://cdn-images.dzcdn.net/images/cover/9511027341f8bc857b517dadb6dec7fe/500x500-000000-80-0-0.jpg',
    links: {
      chords: 'https://www.cifraclub.com.br/ministerio-morada/so-tu-s-santo/',
      lyrics: 'https://www.letras.mus.br/ministerio-morada/so-tu-es-santo/',
      video: yt('Krw3YIZI-Ps'),
    },
    options: { video: [{ label: 'Medley ao vivo', url: yt('Krw3YIZI-Ps') }, { label: 'Só Tu És Santo', url: yt('Kh14SNPaHco') }] },
    staleUrls: ['https://www.cifraclub.com.br/morada/so-tu-es-santo/', 'https://www.letras.mus.br/morada/so-tu-es-santo/'],
  },
  {
    id: '0a4a2a09-3bea-4020-9502-379a852e34e2',
    coverUrl: 'https://cdn-images.dzcdn.net/images/cover/2dcc56a4ca5fe3eaa1ed4c82eb043a39/500x500-000000-80-0-0.jpg',
    links: { video: yt('8-KGd77URxo') },
    options: { video: [{ label: 'Vídeo ao vivo', url: yt('8-KGd77URxo') }, { label: 'Áudio oficial', url: yt('vdkXhTHHnEM') }] },
  },
  {
    id: '48262825-ee28-4659-8b5e-946946c4c69b',
    title: 'Digno de Tudo + Te Exaltamos',
    artist: 'Nívea Soares',
    correctDisplay: true,
    coverUrl: ytCover('9ot039R1-G0'),
    links: {
      chords: 'https://www.cifraclub.com.br/nivea-soares/digno-de-tudo-te-exaltamos/',
      lyrics: 'https://www.letras.mus.br/nivea-soares/digno-de-tudo-te-exaltamos/',
      video: yt('9ot039R1-G0'),
    },
    staleUrls: ['https://www.cifraclub.com.br/cassiane/te-exaltamos/', 'https://www.letras.mus.br/cassiane/te-exaltamos/'],
  },
  {
    id: '13c6cd91-9d95-4548-8f3a-81b9fa4d8d93',
    title: 'Vencendo Vem Jesus',
    artist: 'Harpa Cristã',
    correctDisplay: true,
    coverUrl: 'https://cdn-images.dzcdn.net/images/cover/ab1911d3dc71240a1b474d21b5ec56b5/500x500-000000-80-0-0.jpg',
    links: {
      chords: 'https://www.cifraclub.com.br/harpa-crista/525-vencendo-vem-jesus/',
      lyrics: 'https://www.letras.mus.br/harpa-crista/931659/',
      video: yt('IP954cHHYIY'),
    },
    staleUrls: [
      'https://www.cifraclub.com.br/harpa-crista/vencendo-vem-jesus/',
      'https://www.cifraclub.com.br/harpa-crista/vencendo-vem-jesus-525/',
    ],
  },
];

const CATALOG_BY_ID = new Map(CATALOG.map((entry) => [entry.id, entry]));

function normalizeUrl(value?: string) {
  if (!value) return '';

  try {
    const url = new URL(value);
    url.hash = '';
    const pathname = url.pathname.replace(/\/+$/, '');
    return `${url.origin}${pathname}${url.search}`.toLowerCase();
  } catch {
    return value.trim().replace(/\/+$/, '').toLowerCase();
  }
}

function isSearchUrl(value?: string) {
  if (!value) return false;

  try {
    const url = new URL(value);
    return (
      url.pathname.includes('/search') ||
      url.searchParams.has('search_query') ||
      url.searchParams.has('q')
    );
  } catch {
    return false;
  }
}

function isStaleUrl(value: string | undefined, entry: SongCatalogEntry) {
  if (!value) return false;
  const current = normalizeUrl(value);
  return (entry.staleUrls ?? []).some((url) => normalizeUrl(url) === current);
}

function preferCatalogUrl(current: string | undefined, catalog: string | undefined, entry: SongCatalogEntry) {
  if (!catalog) return current;
  if (!current || isSearchUrl(current) || isStaleUrl(current, entry)) return catalog;
  return current;
}

function preferCatalogCover(current: string | undefined, catalog: string | undefined, entry: SongCatalogEntry) {
  if (!catalog) return current;
  if (!current || isStaleUrl(current, entry)) return catalog;
  return current;
}

function mergeOptions(
  current: Song['linkOptions'],
  entry: SongCatalogEntry,
  links: Song['links'],
  coverUrl: string | undefined
): Song['linkOptions'] | undefined {
  const merged: Song['linkOptions'] = { ...current };

  const addOption = (kind: LinkKind, option: LinkOption) => {
    const currentOptions = merged[kind] ?? [];
    if (currentOptions.some((item) => normalizeUrl(item.url) === normalizeUrl(option.url))) return;
    merged[kind] = [...currentOptions, option];
  };

  if (entry.links?.chords) addOption('chords', { label: 'Cifra Club', url: entry.links.chords });
  if (entry.links?.lyrics) addOption('lyrics', { label: 'Letras.mus.br', url: entry.links.lyrics });
  if (entry.links?.video) addOption('video', { label: 'YouTube principal', url: entry.links.video });
  if (entry.coverUrl) addOption('cover', { label: 'Capa indexada', url: entry.coverUrl });

  if (links.chords) addOption('chords', { label: 'Link atual validado', url: links.chords });
  if (links.lyrics) addOption('lyrics', { label: 'Link atual validado', url: links.lyrics });
  if (links.video) addOption('video', { label: 'Link atual validado', url: links.video });
  if (coverUrl) addOption('cover', { label: 'Capa atual validada', url: coverUrl });

  Object.entries(entry.options ?? {}).forEach(([kind, options]) => {
    options?.forEach((option) => addOption(kind as LinkKind, option));
  });

  return Object.values(merged).some((options) => options && options.length > 0) ? merged : undefined;
}

function isUnknownArtist(artist: string) {
  return artist.trim().toLowerCase() === 'desconhecido';
}

export function applySongCatalog(song: Song): Song {
  const entry = CATALOG_BY_ID.get(song.id);
  if (!entry) return song;

  const shouldUseCatalogIdentity = entry.correctDisplay || isUnknownArtist(song.artist);
  const links = {
    chords: preferCatalogUrl(song.links.chords, entry.links?.chords, entry),
    lyrics: preferCatalogUrl(song.links.lyrics, entry.links?.lyrics, entry),
    video: preferCatalogUrl(song.links.video, entry.links?.video, entry),
  };
  const coverUrl = preferCatalogCover(song.cover_url, entry.coverUrl, entry);

  return {
    ...song,
    title: shouldUseCatalogIdentity && entry.title ? entry.title : song.title,
    artist: shouldUseCatalogIdentity && entry.artist ? entry.artist : song.artist,
    links,
    cover_url: coverUrl,
    linkOptions: mergeOptions(song.linkOptions, entry, links, coverUrl),
  };
}

export function applySongCatalogToList(songs: Song[]) {
  return songs.map(applySongCatalog);
}
