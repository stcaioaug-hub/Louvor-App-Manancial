# Ministério de Louvor Manancial

Aplicativo React/Vite conectado ao Supabase para gerenciar:

- repertório
- equipe
- agenda de cultos e ensaios
- escala e presença por evento

## Configuração

1. Instale as dependências:
   `npm install`
2. Crie seu arquivo `.env.local` com base em [.env.example](/Users/stcaioaug/Documents/Meus Apps/min-louvor-manancial/.env.example).
3. Preencha:
   `VITE_SUPABASE_URL`
   `VITE_SUPABASE_ANON_KEY`
4. No painel do Supabase, rode o arquivo [supabase_schema.sql](/Users/stcaioaug/Documents/Meus Apps/min-louvor-manancial/supabase_schema.sql) no SQL Editor.
5. Inicie o app:
   `npm run dev`

## O que o app faz agora

- carrega músicas, integrantes e eventos direto do Supabase
- salva edições de repertório, equipe e eventos no banco
- atualiza presença do evento no campo `attendance`
- sincroniza mudanças em tempo real via Realtime
- popula o banco automaticamente na primeira carga se as tabelas estiverem vazias

## Validação local

- `npm run lint`
- `npm run build`
