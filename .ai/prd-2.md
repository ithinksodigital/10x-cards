# Dokument wymagań produktu (PRD) - Flash Cards AI v2

## 1. Przegląd produktu
Cel: Webowa aplikacja do szybkiego tworzenia i nauki fiszek przy użyciu AI i prostego mechanizmu powtórek (SRS). Produkt minimalizuje czas tworzenia wysokiej jakości fiszek z długiego wklejanego tekstu i prowadzi użytkownika przez prosty, liniowy flow: wklej → generuj → selekcja/edycja → zapis do zestawu → pierwsza sesja.

**NOWA ARCHITEKTURA:** Aplikacja oferuje tryb anonimowy (bez logowania) dla podstawowej funkcjonalności generowania i przeglądu fiszek, oraz tryb uwierzytelniony dla pełnej funkcjonalności z persystencją danych i systemem SRS.

Zakres MVP obejmuje: generację 30 fiszek z tekstu (PL/EN/ES) w trybie anonimowym, manualne tworzenie/edycję/usuwanie fiszek, zarządzanie zestawami, logowanie przez email/password (Supabase Auth), integrację z otwartym algorytmem SRS (np. SM‑2), podstawową analitykę, limity danych i dzienne limity SRS.

Docelowy użytkownik na start: osoby uczące się języków.

Technologie: front‑end Astro; backend i uwierzytelnianie przez Supabase. Obsługa treści w językach: PL, EN, ES.

## 2. Problem użytkownika
Manualne przygotowanie dobrych fiszek z dłuższych materiałów jest czasochłonne i nużące, co obniża motywację do systematycznej nauki metodą spaced repetition. Użytkownicy potrzebują szybkiego sposobu na: (1) przekształcenie długiego tekstu w zwięzłe fiszki, (2) selekcję i lekką edycję propozycji, (3) natychmiastowe rozpoczęcie nauki powtórkowej.

**NOWA HIPOTEZA WARTOŚCI:** Umożliwienie użytkownikom natychmiastowego doświadczenia wartości produktu bez bariery logowania zwiększy konwersję i adopcję. Naturalna progresja od trybu anonimowego do uwierzytelnionego zapewni wyższy wskaźnik retencji.

## 3. Wymagania funkcjonalne

### 3.1 Tryb anonimowy (bez logowania)
- **Generowanie fiszek przez AI:** Wejście: wklejany tekst o długości 10–15k znaków; wykrycie długości, chunkowanie, progres bar, timeout i retry.
- **Wynik:** 30 fiszek w formacie „definicja" (przód ≤200 znaków, tył ≤500 znaków), bez duplikatów w ramach batcha; języki treści: PL/EN/ES.
- **Przegląd i akceptacja:** Interakcja „swipe" (jak Tinder) na pojedynczych kartach; przegląd w batchach po 10 kart; „akceptuj wszystko/odrzuć wszystko" dla bieżącego batcha.
- **Undo i edycja:** Undo ostatnich 5 akcji na poziomie sesji przeglądu; szybka edycja inline przed akceptacją.
- **Przechowywanie lokalne:** Dane przechowywane w localStorage/sessionStorage, automatyczne czyszczenie po 24h lub zamknięciu przeglądarki.
- **Limity anonimowe:** Maksymalnie 3 generacje na godzinę, brak persystencji między sesjami.

### 3.2 Tryb uwierzytelniony (z logowaniem)
- **Wszystkie funkcje trybu anonimowego** plus:
- **Zapis do zestawów:** Po akceptacji zapis do wybranego zestawu; możliwość utworzenia nowego zestawu w tym momencie.
- **Zarządzanie fiszkami i zestawami:** Struktura: users → sets → cards (+ reviews). Limit 1k fiszek na konto, 200 fiszek na zestaw. Paginacja list po 50.
- **Manualne tworzenie fiszek:** Formularz tworzenia w ramach zestawu; walidacja limitów 200/500, zapobieganie duplikatom w zestawie.
- **SRS i sesje nauki:** Integracja z otwartym algorytmem SRS (rekomendacja: SM‑2) z oceną 1–5; auto‑planowanie po akceptacji.
- **Dzienne limity:** np. 20 nowych kart, 100 przeglądów; po zapisaniu kart z generacji propozycja pierwszej sesji.

### 3.3 Migracja danych
- **Przeniesienie sesji:** Po zalogowaniu użytkownik może przenieść dane z bieżącej sesji anonimowej do swojego konta.
- **Prompt konwersji:** "Zapisz swoje fiszki do konta" z opcją utworzenia nowego zestawu.

### 3.4 Uwierzytelnianie i konto
- Supabase Auth z logowaniem email/password; wylogowanie; trwałość sesji; usunięcia konta
- **Opcjonalne logowanie:** Użytkownicy mogą korzystać z aplikacji bez logowania

### 3.5 Analityka i jakość
- Instrumentacja eventów: wklejenie → generacja → akceptacja/odrzucenie/edycja → zapis → pierwsza sesja.
- **Nowe metryki:** Konwersja z trybu anonimowego do uwierzytelnionego, czas spędzony w trybie anonimowym.
- Dashboard KPI dla akceptacji AI, udziału AI w tworzeniu fiszek, aktywacji i latencji.

### 3.6 Wydajność i niezawodność
- P95 < 10 s na 1k słów (od submit do gotowej listy 30 fiszek). Retriable timeouts. Czytelne komunikaty błędów i stany pustych list.
- **Rate limiting:** Różne limity dla użytkowników anonimowych i uwierzytelnionych.

## 4. Granice produktu
4.1 Poza zakresem MVP
- Brak własnego zaawansowanego algorytmu powtórek (używamy open‑source, np. SM‑2).
- Brak importu plików (PDF, DOCX itp.).
- Brak współdzielenia zestawów i integracji z zewnętrznymi platformami edukacyjnymi.
- Brak natywnych aplikacji mobilnych (web‑only).

4.2 Ograniczenia i założenia
- **Limity danych:** 
  - Anonimowi: 3 generacje/godzinę, dane lokalne, wygaśnięcie po 24h
  - Uwierzytelnieni: 1k fiszek/konto, 200 fiszek/zestaw; paginacja 50; wersjonowanie fiszek po edycji
- Obsługiwane języki treści: PL, EN, ES.
- Polityki jakości/bezpieczeństwa treści: na start brak dodatkowych filtrów (ryzyko zaakceptowane z minimalną mitigacją, np. ostrzeżenia o prawach autorskich i PII).

## 5. Historyjki użytkowników

### 5.1 Tryb anonimowy

**US‑A001**
Tytuł: Generowanie fiszek bez logowania
Opis: Jako użytkownik chcę wygenerować fiszki z tekstu bez konieczności logowania, aby szybko przetestować funkcjonalność aplikacji.
Kryteria akceptacji:
- Użytkownik może wkleić tekst i wygenerować fiszki bez logowania
- Dane są przechowywane lokalnie w przeglądarce
- Po zamknięciu przeglądarki dane znikają (sessionStorage)
- Limit: 3 generacje na godzinę dla użytkowników anonimowych

**US‑A002**
Tytuł: Przegląd i selekcja fiszek w trybie anonimowym
Opis: Jako użytkownik anonimowy chcę przeglądać i selekcjonować wygenerowane fiszki, aby wybrać najlepsze propozycje.
Kryteria akceptacji:
- Swipe interface działa identycznie jak w trybie uwierzytelnionym
- Undo ostatnich 5 akcji działa w ramach sesji
- Edycja inline przed akceptacją jest dostępna
- Stan selekcji jest zachowywany w localStorage

**US‑A003**
Tytuł: Prompt do zapisania fiszek do konta
Opis: Jako użytkownik anonimowy chcę otrzymać propozycję zapisania moich fiszek do konta, aby móc je zachować na stałe.
Kryteria akceptacji:
- Po zaakceptowaniu fiszek pojawia się CTA "Zapisz do konta"
- Kliknięcie otwiera modal z formularzem email/password
- Po zalogowaniu użytkownik może przenieść dane z sesji anonimowej
- Opcja utworzenia nowego zestawu dla przenoszonych fiszek

**US‑A004**
Tytuł: Wygaśnięcie danych anonimowych
Opis: Jako użytkownik anonimowy chcę, aby moje dane były automatycznie usuwane po określonym czasie, aby chronić prywatność.
Kryteria akceptacji:
- Dane w sessionStorage znikają po zamknięciu przeglądarki
- Dane w localStorage są usuwane po 24 godzinach
- Użytkownik otrzymuje ostrzeżenie przed wygaśnięciem (opcjonalnie)
- Możliwość przedłużenia sesji przez ponowne wygenerowanie

### 5.2 Migracja i konwersja

**US‑M001**
Tytuł: Przeniesienie danych z sesji anonimowej
Opis: Jako użytkownik, który właśnie się zalogował, chcę przenieść moje fiszki z sesji anonimowej do konta, aby nie stracić pracy.
Kryteria akceptacji:
- Po zalogowaniu system wykrywa dane w localStorage
- Pojawia się modal z opcją przeniesienia danych
- Użytkownik może wybrać zestaw docelowy lub utworzyć nowy
- Przeniesienie zachowuje stan akceptacji/odrzucenia fiszek

**US‑M002**
Tytuł: Kontynuacja sesji po zalogowaniu
Opis: Jako użytkownik, który zalogował się w trakcie przeglądu fiszek, chcę kontynuować pracę bez utraty postępu.
Kryteria akceptacji:
- Stan przeglądu jest zachowywany po zalogowaniu
- Użytkownik może kontynuować selekcję fiszek
- Opcja zapisu do zestawu pojawia się po zakończeniu przeglądu
- Brak konieczności ponownego generowania

### 5.3 Uwierzytelnianie (zaktualizowane)

**US‑001**
Tytuł: Opcjonalne logowanie przez email/password
Opis: Jako użytkownik chcę móc zalogować się przez email i hasło, aby zachować moje fiszki i zestawy, ale nie chcę być do tego zmuszany.
Kryteria akceptacji:
- Logowanie jest opcjonalne - użytkownik może korzystać z aplikacji bez konta
- Po zalogowaniu przez email/password użytkownik ma dostęp do pełnej funkcjonalności
- Sesja utrzymuje się między odświeżeniami przeglądarki
- Wylogowanie kończy sesję we wszystkich zakładkach

**US‑002**
Tytuł: Rejestracja i pierwsze logowanie
Opis: Jako nowy użytkownik chcę utworzyć konto przy pierwszym logowaniu email/password, aby od razu rozpocząć pracę z pełną funkcjonalnością.
Kryteria akceptacji:
- Pierwsze logowanie zakłada konto użytkownika
- Po rejestracji użytkownik widzi ekran bez zestawów (empty state) z CTA do utworzenia zestawu lub wklejenia tekstu do generacji
- Opcja przeniesienia danych z sesji anonimowej (jeśli istnieją)

### 5.4 Tryb uwierzytelniony (zaktualizowane)

**US‑011**
Tytuł: Zapis zaakceptowanych fiszek do zestawu
Opis: Jako zalogowany użytkownik chcę zapisać zaakceptowane fiszki do istniejącego lub nowego zestawu.
Kryteria akceptacji:
- Wybór zestawu z listy lub utworzenie nowego bez opuszczania flow
- Walidacja limitu 200 fiszek na zestaw i 1k na konto; przekroczenie pokazuje komunikat i blokuje zapis nadmiaru
- **NOWE:** Opcja przeniesienia danych z sesji anonimowej do zestawu

**US‑019**
Tytuł: Pierwsza sesja po zapisie
Opis: Jako zalogowany użytkownik chcę rozpocząć pierwszą sesję SRS od razu po zapisaniu kart.
Kryteria akceptacji:
- Po zapisie pojawia się propozycja uruchomienia sesji; użytkownik może ją rozpocząć teraz lub pominąć
- Sesja zawiera nowe karty zgodnie z dziennym limitem nowych
- **NOWE:** Sesja jest dostępna tylko dla zalogowanych użytkowników

### 5.5 Analityka (nowe)

**US‑AN001**
Tytuł: Śledzenie konwersji z trybu anonimowego
Opis: Jako właściciel produktu chcę mierzyć, ile użytkowników przechodzi z trybu anonimowego do uwierzytelnionego.
Kryteria akceptacji:
- Emitowane są eventy: anonymous_session_start, anonymous_generate, login_prompt_shown, login_conversion, data_migration
- Pomiary widoczne w dashboardzie: konwersja anonimowa → uwierzytelniona, czas spędzony w trybie anonimowym
- Segmentacja użytkowników: anonimowi vs uwierzytelnieni

**US‑AN002**
Tytuł: Optymalizacja promptów konwersji
Opis: Jako właściciel produktu chcę testować różne warianty promptów "Zapisz do konta", aby zwiększyć konwersję.
Kryteria akceptacji:
- A/B testowanie różnych wariantów CTA
- Pomiar klikalności i konwersji dla każdego wariantu
- Automatyczne przełączanie na najlepszy wariant

## 6. Metryki sukcesu

### 6.1 Nowe metryki konwersji
- **Konwersja anonimowa → uwierzytelniona:** Odsetek użytkowników anonimowych, którzy tworzą konto w ciągu 7 dni od pierwszej wizyty
- **Cel:** ≥ 25% (do kalibracji po pierwszym miesiącu)

- **Czas do konwersji:** Średni czas od pierwszej wizyty anonimowej do utworzenia konta
- **Cel:** ≤ 48 godzin

- **Wskaźnik retencji anonimowej:** Odsetek użytkowników anonimowych, którzy wracają w ciągu 7 dni
- **Cel:** ≥ 15%

### 6.2 Zaktualizowane metryki
6.1 Akceptacja AI
- Definicja: Odsetek wygenerowanych przez AI fiszek zaakceptowanych (po ewentualnej edycji) w ramach partii.
- Wzór: liczba zaakceptowanych fiszek AI / liczba wszystkich wygenerowanych fiszek AI.
- **Cel:** ≥ 75% (dla obu trybów)

6.2 Udział AI w tworzeniu fiszek
- Definicja: Odsetek nowych fiszek utworzonych przez AI wśród wszystkich nowo utworzonych fiszek w danym okresie (manualne + AI; importy wyłączone, bo poza MVP).
- Wzór: liczba nowych fiszek AI / liczba wszystkich nowych fiszek.
- **Cel:** 75% (do potwierdzenia)

6.3 Wydajność generacji
- Definicja: Czas od submit do gotowej listy 30 fiszek dla tekstu 1k słów.
- Wskaźnik: P95 < 10 s. Dodatkowo stopa timeoutów < 2% miesięcznie.
- **Uwaga:** Dotyczy obu trybów użytkowania

6.4 Aktywacja nauki
- Definicja: Odsetek użytkowników uwierzytelnionych, którzy po zapisaniu kart z generacji uruchamiają pierwszą sesję SRS w ciągu 24 h.
- **Cel:** ≥ 60% (do kalibracji po pierwszym miesiącu)

6.5 Retencja SRS
- Definicja: Odsetek użytkowników uwierzytelnionych, którzy wracają do co najmniej jednej sesji SRS w tygodniu 1–2 od rejestracji.
- **Cel:** do obserwacji; target po 4 tyg. danych

## 7. Architektura techniczna

### 7.1 Przechowywanie danych
- **Tryb anonimowy:**
  - sessionStorage: dane sesji (generowane fiszki, stan przeglądu)
  - localStorage: dane między sesjami (z wygaśnięciem 24h)
  - Brak danych na serwerze

- **Tryb uwierzytelniony:**
  - Supabase: pełna persystencja danych
  - RLS: ochrona dostępu do danych użytkownika

### 7.2 API Design
- **Anonimowe endpointy:**
  - `POST /api/anonymous/generate` - generowanie fiszek
  - `POST /api/anonymous/review` - przegląd i selekcja
  - Rate limiting: 3 generacje/godzinę

- **Uwierzytelnione endpointy:**
  - `POST /api/sets` - zarządzanie zestawami
  - `POST /api/cards` - zarządzanie fiszkami
  - `POST /api/srs/session` - sesje nauki
  - Rate limiting: wyższe limity dla uwierzytelnionych

### 7.3 Migracja danych
- **Endpoint migracji:** `POST /api/migrate/anonymous-to-account`
- **Proces:** Wykrycie danych lokalnych → przeniesienie do Supabase → czyszczenie localStorage
- **Walidacja:** Sprawdzenie limitów konta przed migracją

## 8. Plan implementacji

### Faza 1: Tryb anonimowy (MVP)
- Implementacja generowania fiszek bez logowania
- Podstawowy interfejs przeglądu i selekcji
- Przechowywanie lokalne (sessionStorage/localStorage)
- Rate limiting dla użytkowników anonimowych

### Faza 2: Migracja i konwersja
- Implementacja promptów konwersji
- System migracji danych z sesji anonimowej
- A/B testowanie wariantów CTA

### Faza 3: Optymalizacja
- Analityka konwersji
- Optymalizacja promptów na podstawie danych
- Fine-tuning rate limiting

Ten dokument PRD v2 wprowadza nową architekturę z trybem anonimowym, która powinna znacząco zwiększyć konwersję i adopcję produktu, jednocześnie zachowując wszystkie kluczowe funkcjonalności dla użytkowników uwierzytelnionych.
