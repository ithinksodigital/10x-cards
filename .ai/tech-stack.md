# Tech Stack – Flash Cards AI (MVP)

Cel: szybkie dostarczenie MVP zgodnego z PRD, minimalna złożoność operacyjna, niskie koszty, bezpieczeństwo przez RLS i Edge Functions.

## Frontend
- Astro 5 (islands) + React 18.3 (stabilna baza dla ekosystemu shadcn/ui)
- TypeScript 5.x
- Tailwind CSS 3.4.x + shadcn/ui (gotowe, dostępne komponenty)
- Dodatki: framer-motion lub @use-gesture/react (swipe), react-hook-form + zod (walidacja 200/500, liczniki znaków)
- i18n: zgodność języka treści z wejściem (PL/EN/ES) – bez pełnego przełącznika UI w MVP

Uzasadnienie: Astro minimalizuje JS, React daje interaktywność (przegląd/edycja/swipe/undo). Pin do stabilnych wersji upraszcza integrację z shadcn/ui.

## Backend / BaaS
- Supabase (PostgreSQL + Auth + RLS + Storage)
- Supabase Edge Functions: wywołania AI (OpenRouter), polityka timeout/retry, deduplikacja batcha, wykrycie języka, export/usunięcie danych (RODO)
- Supabase Auth: logowanie Google, trwałość sesji

Model danych (wysoki poziom):
- users → sets → cards (+ reviews)
- events (analityka: paste, generate_start, generate_success/fail, accept, reject, edit_inline, save_to_set, srs_session_start, srs_session_end)

Reguły/ograniczenia:
- RLS per użytkownik na wszystkich tabelach użytkownika
- Limity: 1k fiszek/konto, 200/zestaw (constraints + funkcje sprawdzające)
- Wersjonowanie kart przy edycji (osobna tabela na historię)
- Indeksy pod paginację 50 i wyszukiwanie po przodzie/tyle (ILIKE)

## AI
- OpenRouter.ai (jeden model startowy; budżet i limity na klucz)
- W Edge Function: chunkowanie 10–15k znaków, P95 < 10 s/1k słów, exponential backoff, kontrola timeoutu, deduplikacja w batchu 30, utrzymanie języka wejściowego

## Hosting i CI/CD
- Frontend: build statyczny Astro, hosting Vercel/Cloudflare Pages/Netlify (wybierz jeden; brak własnego serwera w MVP)
- API: Supabase Edge Functions (jedyny serwer wykonawczy)
- CI: GitHub Actions (lint, typecheck, test, build, deploy)
- Docker/DigitalOcean: opcjonalnie po MVP, gdy potrzebny własny runtime

## Bezpieczeństwo i zgodność
- RLS w Supabase + testy polityk
- Sekrety tylko w Edge Functions (klucze OpenRouter), brak kluczy w kliencie
- Rate limiting na funkcjach brzegowych
- CORS zawężony do domeny aplikacji, twarda CSP
- Minimalne RODO: eksport danych (zip/json) + usunięcie konta i danych
- Logowanie błędów oraz prób nieautoryzowanych

## Obserwowalność i analityka
- Tabela events w Supabase (MVP)
- Dashboard: prosto (Supabase SQL/grafy) lub PostHog/Umami – do decyzji

## Wersje i narzędzia (pin)
- Node 20 LTS
- Astro 5.x
- React 18.3.x
- TypeScript 5.6.x
- Tailwind 3.4.x
- shadcn/ui zgodnie z Tailwind 3.4
- Supabase JS v2
- framer-motion ^11 lub @use-gesture/react ^10

## Niegotowe/poza MVP
- Tailwind 4 i React 19 (rozważ po potwierdzeniu pełnej kompatybilności)
- DigitalOcean + Docker (dopiero gdy potrzebny custom runtime)
- Import plików (PDF/DOCX), współdzielenie zestawów, aplikacje natywne

## Ryzyka i mitigacje (skrót)
- Latencja/koszt AI: backoff/fallback, ograniczanie tokenów, deduplikacja, cache promptów
- Błędy/timeouty: retry z limitem, czytelne komunikaty + opcja ponowienia
- Jakość generacji: walidacja limitów 200/500, wykrywanie duplikatów w batchu, ręczna edycja przed zapisem


