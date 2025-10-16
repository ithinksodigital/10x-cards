# Dokument wymagań produktu (PRD) - Flash Cards AI

## 1. Przegląd produktu

Cel: Webowa aplikacja do szybkiego tworzenia i nauki fiszek przy użyciu AI i prostego mechanizmu powtórek (SRS). Produkt minimalizuje czas tworzenia wysokiej jakości fiszek z długiego wklejanego tekstu i prowadzi użytkownika przez prosty, liniowy flow: wklej → generuj → selekcja/edycja → zapis do zestawu → pierwsza sesja.

Zakres MVP obejmuje: generację 30 fiszek z tekstu (PL/EN/ES), manualne tworzenie/edycję/usuwanie fiszek, zarządzanie zestawami, logowanie przez Google (Supabase Auth), integrację z otwartym algorytmem SRS (np. SM‑2), podstawową analitykę, limity danych i dzienne limity SRS.

Docelowy użytkownik na start: osoby uczące się języków.

Technologie: front‑end Astro; backend i uwierzytelnianie przez Supabase. Obsługa treści w językach: PL, EN, ES.

## 2. Problem użytkownika

Manualne przygotowanie dobrych fiszek z dłuższych materiałów jest czasochłonne i nużące, co obniża motywację do systematycznej nauki metodą spaced repetition. Użytkownicy potrzebują szybkiego sposobu na: (1) przekształcenie długiego tekstu w zwięzłe fiszki, (2) selekcję i lekką edycję propozycji, (3) natychmiastowe rozpoczęcie nauki powtórkowej.

Hipoteza wartości: Przyspieszenie tworzenia fiszek przez AI oraz łatwy proces akceptacji zwiększą adopcję i retencję nauki SRS. Sukces mierzony będzie odsetkiem akceptacji AI oraz odsetkiem fiszek tworzonych z użyciem AI.

## 3. Wymagania funkcjonalne

3.1 Generowanie fiszek przez AI

- Wejście: wklejany tekst o długości 10–15k znaków; wykrycie długości, chunkowanie, progres bar, timeout i retry.
- Wynik: 30 fiszek w formacie „definicja” (przód ≤200 znaków, tył ≤500 znaków), bez duplikatów w ramach batcha; języki treści: PL/EN/ES.
- Wywołania AI realizowane przez Supabase Edge Functions (ukrycie kluczy), z polityką timeoutów i retry; cel latencji P95 < 10 s na 1k słów.

  3.2 Przegląd i akceptacja propozycji

- Interakcja „swipe” (jak Tinder) na pojedynczych kartach; przegląd w batchach po 10 kart; „akceptuj wszystko/odrzuć wszystko” dla bieżącego batcha.
- Undo ostatnich 5 akcji na poziomie sesji przeglądu; szybka edycja inline przed akceptacją.
- Po akceptacji zapis do wybranego zestawu; możliwość utworzenia nowego zestawu w tym momencie.

  3.3 Zarządzanie fiszkami i zestawami

- Struktura: users → sets → cards (+ reviews). Limit 1k fiszek na konto, 200 fiszek na zestaw. Paginacja list po 50.
- Operacje: dodawanie, edycja (z wersjonowaniem), usuwanie; wyszukiwanie w obrębie zestawu (proste filtrowanie); unikanie duplikatów.

  3.4 Manualne tworzenie fiszek

- Formularz tworzenia w ramach zestawu; walidacja limitów 200/500, zapobieganie duplikatom w zestawie.

  3.5 Uwierzytelnianie i konto

- Supabase Auth z logowaniem Google; wylogowanie; trwałość sesji; usunięcia konta

  3.6 SRS i pierwsza sesja

- Integracja z otwartym algorytmem SRS (rekomendacja: SM‑2) z oceną 1–5; auto‑planowanie po akceptacji.
- Dzienne limity: np. 20 nowych kart, 100 przeglądów; po zapisaniu kart z generacji propozycja pierwszej sesji.

  3.7 Analityka i jakość

- Instrumentacja eventów: wklejenie → generacja → akceptacja/odrzucenie/edycja → zapis → pierwsza sesja.
- Dashboard KPI dla akceptacji AI, udziału AI w tworzeniu fiszek, aktywacji i latencji (stack do decyzji).

  3.8 Wydajność i niezawodność

- P95 < 10 s na 1k słów (od submit do gotowej listy 30 fiszek). Retriable timeouts. Czytelne komunikaty błędów i stany pustych list.

## 4. Granice produktu

4.1 Poza zakresem MVP

- Brak własnego zaawansowanego algorytmu powtórek (używamy open‑source, np. SM‑2).
- Brak importu plików (PDF, DOCX itp.).
- Brak współdzielenia zestawów i integracji z zewnętrznymi platformami edukacyjnymi.
- Brak natywnych aplikacji mobilnych (web‑only).

  4.2 Ograniczenia i założenia

- Limity danych: 1k fiszek/konto, 200 fiszek/zestaw; paginacja 50; wersjonowanie fiszek po edycji.
- Obsługiwane języki treści: PL, EN, ES.
- Polityki jakości/bezpieczeństwa treści: na start brak dodatkowych filtrów (ryzyko zaakceptowane z minimalną mitigacją, np. ostrzeżenia o prawach autorskich i PII).

  4.3 Kwestie otwarte i ryzyka

- Dobór algorytmu SRS (SM‑2 sugerowany), skala ocen i dzienne limity – do finalizacji.
- Definicja drugiego KPI (udział AI w tworzeniu fiszek) – przyjęta w Metrykach, do zatwierdzenia.
- Wybór dostawcy/modelu AI, budżet tokenów, cele latencji i kosztów – do decyzji.
- Szczegóły pierwszej sesji po zapisie (obowiązkowa vs opcjonalna, parametry startowe) – do doprecyzowania.
- Minimalne środki mitigacji jakości/bezpieczeństwa (PII, prawa autorskie) – do doprecyzowania.
- Wymogi prywatności/RODO (eksport i usunięcie danych/konta) – zakres i procesy – do potwierdzenia.
- Instrumentacja analityczna i narzędzia dashboardowe – wybór stacku do decyzji.
- Zachowanie undo ponad jeden batch oraz rozwiązywanie duplikatów podczas edycji – reguły do potwierdzenia.

## 5. Historyjki użytkowników

US‑001
Tytuł: Logowanie przez Google
Opis: Jako użytkownik chcę zalogować się przez Google, aby bezpiecznie korzystać z aplikacji i mieć dostęp do moich zestawów i fiszek.
Kryteria akceptacji:

- Użytkownik może zalogować się przez Google (Supabase Auth) i wraca na stronę aplikacji w stanie zalogowanym.
- Sesja utrzymuje się między odświeżeniami przeglądarki.
- Wylogowanie kończy sesję we wszystkich zakładkach.

US‑002
Tytuł: Rejestracja i pierwsze logowanie
Opis: Jako nowy użytkownik chcę utworzyć konto przy pierwszym logowaniu Google, aby od razu rozpocząć pracę.
Kryteria akceptacji:

- Pierwsze logowanie zakłada konto użytkownika.
- Po rejestracji użytkownik widzi ekran bez zestawów (empty state) z CTA do utworzenia zestawu lub wklejenia tekstu do generacji.

US‑003
Tytuł: Wklejenie tekstu do generacji
Opis: Jako użytkownik chcę wkleić dłuższy tekst (10–15k znaków), aby wygenerować z niego fiszki.
Kryteria akceptacji:

- Pole wklejania liczy znaki i waliduje limit.
- Tekst > limit wyświetla komunikat i propozycję automatycznego podziału (chunkowanie).
- Kliknięcie Generuj rozpoczyna pipeline z widocznym progres barem.

US‑004
Tytuł: Chunkowanie i progres
Opis: Jako użytkownik chcę widzieć postęp przetwarzania, aby mieć pewność, że system działa.
Kryteria akceptacji:

- Progres bar aktualizuje się w trakcie przetwarzania.
- W przypadku timeoutu użytkownik widzi komunikat i automatyczny retry do ustalonej liczby prób.

US‑005
Tytuł: Otrzymanie 30 propozycji fiszek
Opis: Jako użytkownik chcę otrzymać 30 propozycji fiszek w formacie „definicja”, aby szybko przejrzeć i wybrać najlepsze.
Kryteria akceptacji:

- Każda fiszka spełnia limity: przód ≤200 znaków, tył ≤500 znaków.
- Brak duplikatów w batchu 30.
- Treści zachowują język wejściowy (PL/EN/ES) lub zostaje on wykryty i zachowany.

US‑006
Tytuł: Przegląd w batchach po 10
Opis: Jako użytkownik chcę przeglądać karty w batchach po 10, aby podejmować decyzje w rozsądnych porcjach.
Kryteria akceptacji:

- Batch zawiera 10 kart; nawigacja między batchami działa (dalej/wstecz).
- Stan akceptacji/odrzucenia utrzymuje się przy przełączaniu między batchami.

US‑007
Tytuł: Swipe akceptacji/odrzucenia
Opis: Jako użytkownik chcę akceptować/odrzucać fiszki gestem swipe, aby proces był szybki i intuicyjny.
Kryteria akceptacji:

- Swipe w prawo akceptuje, w lewo odrzuca.
- Dostępne alternatywne przyciski na desktopie.

US‑008
Tytuł: Akceptuj wszystko / Odrzuć wszystko
Opis: Jako użytkownik chcę akceptować lub odrzucać wszystkie fiszki w bieżącym batchu jednym kliknięciem.
Kryteria akceptacji:

- Dwa przyciski działają na 10 kart batcha.
- Potwierdzenie akcji w modalu z możliwością anulowania.

US‑009
Tytuł: Undo ostatnich 5 akcji
Opis: Jako użytkownik chcę cofnąć do 5 ostatnich akcji, aby naprawić pomyłki.
Kryteria akceptacji:

- Historia ostatnich 5 zmian; cofnięcie przywraca stan fiszki i licznik działań.
- Undo nie przekracza aktualnej sesji przeglądu.

US‑010
Tytuł: Edycja inline przed akceptacją
Opis: Jako użytkownik chcę szybko edytować treść fiszki przed jej akceptacją, aby poprawić brzmienie lub skrócić tekst.
Kryteria akceptacji:

- Edytor inline waliduje limity 200/500 w czasie rzeczywistym.
- Zapis edycji aktualizuje propozycję przed akceptacją.

US‑011
Tytuł: Zapis zaakceptowanych fiszek do zestawu
Opis: Jako użytkownik chcę zapisać zaakceptowane fiszki do istniejącego lub nowego zestawu.
Kryteria akceptacji:

- Wybór zestawu z listy lub utworzenie nowego bez opuszczania flow.
- Walidacja limitu 200 fiszek na zestaw i 1k na konto; przekroczenie pokazuje komunikat i blokuje zapis nadmiaru.

US‑012
Tytuł: Utworzenie nowego zestawu
Opis: Jako użytkownik chcę tworzyć nowe zestawy, aby porządkować naukę.
Kryteria akceptacji:

- Formularz nazwy zestawu z walidacją unikalności w ramach konta.
- Zestaw pojawia się na liście i jest dostępny do zapisu.

US‑013
Tytuł: Lista zestawów z paginacją
Opis: Jako użytkownik chcę przeglądać swoje zestawy z paginacją 50, aby szybko je odnaleźć.
Kryteria akceptacji:

- Paginacja po 50; zapamiętywanie strony przy powrocie.
- Wyszukiwanie po nazwie wśród własnych zestawów.

US‑014
Tytuł: Przegląd fiszek w zestawie
Opis: Jako użytkownik chcę przeglądać fiszki w wybranym zestawie z paginacją 50.
Kryteria akceptacji:

- Lista kart z przodem/tyłem; podstawowe filtrowanie/wyświetlanie stanu planowania SRS.
- Paginacja 50; licznik wszystkich kart w zestawie.

US‑015
Tytuł: Manualne dodanie fiszki
Opis: Jako użytkownik chcę ręcznie dodać fiszkę do zestawu.
Kryteria akceptacji:

- Formularz waliduje 200/500 i duplikaty w zestawie.
- Zapis zwiększa licznik zestawu i aktualizuje plan SRS.

US‑016
Tytuł: Edycja istniejącej fiszki z wersjonowaniem
Opis: Jako użytkownik chcę edytować fiszkę, a system ma zachować historię wersji.
Kryteria akceptacji:

- Edycja tworzy nową wersję z timestampem i autorem; poprzednia wersja jest dostępna w historii.
- Walidacje 200/500 i duplikaty po edycji.

US‑017
Tytuł: Usunięcie fiszki
Opis: Jako użytkownik chcę usuwać fiszki.
Kryteria akceptacji:

- Akcja wymaga potwierdzenia.
- Fiszka znika z listy; plan SRS aktualizuje się.

US‑018
Tytuł: Usunięcie zestawu
Opis: Jako użytkownik chcę usuwać cały zestaw wraz z fiszkami.
Kryteria akceptacji:

- Potwierdzenie skutku (nieodwracalne) przed operacją.
- Zestaw i karty znikają; limity konta aktualizują się.

US‑019
Tytuł: Pierwsza sesja po zapisie
Opis: Jako użytkownik chcę rozpocząć pierwszą sesję SRS od razu po zapisaniu kart.
Kryteria akceptacji:

- Po zapisie pojawia się propozycja uruchomienia sesji; użytkownik może ją rozpocząć teraz lub pominąć.
- Sesja zawiera nowe karty zgodnie z dziennym limitem nowych.

US‑020
Tytuł: Ocena fiszek 1–5 w SRS
Opis: Jako użytkownik chcę oceniać każdą fiszkę w sesji w skali 1–5, aby zaplanować kolejne przeglądy.
Kryteria akceptacji:

- Oddanie oceny aktualizuje harmonogram zgodnie z algorytmem (np. SM‑2).
- Po zakończeniu sesji użytkownik widzi podsumowanie postępów.

US‑021
Tytuł: Dzienne limity SRS
Opis: Jako użytkownik chcę mieć dzienny limit nowych kart i przeglądów, aby utrzymać stałe tempo nauki.
Kryteria akceptacji:

- Konfiguracja globalna: np. 20 nowych, 100 przeglądów dziennie.
- Aplikacja nie przekracza limitu w sesji; wyświetla pozostałe sloty.

US‑022
Tytuł: Obsługa timeoutów i retry generacji
Opis: Jako użytkownik chcę, aby przy chwilowych problemach generacja była ponawiana.
Kryteria akceptacji:

- Przy przekroczeniu czasu jedna próba jest automatycznie ponawiana do skonfigurowanego maksimum.
- Po wyczerpaniu prób wyświetlany jest komunikat i opcja ponowienia przez użytkownika.

US‑023
Tytuł: Walidacja długości pól fiszki
Opis: Jako użytkownik chcę jasnych limitów pól, aby uniknąć błędów.
Kryteria akceptacji:

- Liczniki znaków i walidacja na żywo zarówno przy edycji inline, jak i w formularzach.
- Blokada zapisu przy przekroczeniu limitów z informacją o błędzie.

US‑024
Tytuł: Zapobieganie duplikatom
Opis: Jako użytkownik nie chcę duplikatów fiszek w zestawie.
Kryteria akceptacji:

- System wykrywa potencjalne duplikaty w obrębie zestawu (np. po przodzie karty, z tolerancją drobnych różnic) i ostrzega użytkownika, umożliwiając decyzję.

US‑025
Tytuł: Eksport/usunięcie konta (RODO)
Opis: Jako użytkownik chcę móc pobrać swoje dane i usunąć konto.
Kryteria akceptacji:

- Wniosek o eksport generuje paczkę danych (zestawy, fiszki, historia przeglądów) do pobrania.
- Usunięcie konta usuwa dane po potwierdzeniu i wylogowuje użytkownika.

US‑026
Tytuł: Wylogowanie i wygaśnięcie sesji
Opis: Jako użytkownik chcę się wylogować i aby wygasłe sesje nie dawały dostępu do danych.
Kryteria akceptacji:

- Wylogowanie skutecznie kończy sesję; próba wejścia na strony chronione przekierowuje do logowania.
- Wygasła sesja wymusza odświeżenie autoryzacji z jasnym komunikatem.

US‑027
Tytuł: Stany pustych list i komunikaty o błędach
Opis: Jako użytkownik chcę zrozumiałe stany pustek i błędów.
Kryteria akceptacji:

- Puste zestawy/konta pokazują wskazówki i CTA.
- Błędy (sieć, timeout, limity) są czytelne i zawierają rekomendowaną akcję.

US‑028
Tytuł: Wyszukiwanie w zestawie
Opis: Jako użytkownik chcę wyszukiwać fiszki po treści przodu/tyłu w ramach zestawu.
Kryteria akceptacji:

- Proste wyszukiwanie tekstowe zawęża listę w czasie rzeczywistym.

US‑029
Tytuł: Języki treści PL/EN/ES
Opis: Jako użytkownik chcę, by treść była generowana i prezentowana w języku źródłowym.
Kryteria akceptacji:

- Wykrycie języka wejścia i zgodność języka fiszek; możliwość ręcznej korekty języka partii przed zapisem.

US‑030
Tytuł: Wersjonowanie i podgląd historii zmian
Opis: Jako użytkownik chcę podglądu historii zmian fiszki.
Kryteria akceptacji:

- Widok listy wersji z timestampem i autorem; możliwość porównania przodu/tyłu.

US‑031
Tytuł: Analityka zdarzeń
Opis: Jako właściciel produktu chcę mierzyć kluczowe zdarzenia, aby monitorować KPI.
Kryteria akceptacji:

- Emitowane są eventy: paste, generate_start, generate_success/fail, accept, reject, edit_inline, save_to_set, srs_session_start, srs_session_end.
- Pomiary widoczne w dashboardzie (stack do decyzji) w ujęciu dziennym/tygodniowym.

US‑032
Tytuł: Ochrona dostępu do danych
Opis: Jako użytkownik chcę, by moje fiszki i zestawy były dostępne tylko dla mnie.
Kryteria akceptacji:

- Reguły RLS w Supabase ograniczają dostęp do rekordów użytkownika.
- Próby nieautoryzowane kończą się błędem i są logowane.

US‑033
Tytuł: Przekroczenie limitów danych
Opis: Jako użytkownik chcę jasnej obsługi przekroczenia limitów (1k konto, 200 zestaw).
Kryteria akceptacji:

- Próba przekroczenia informuje o limicie i proponuje rozwiązania (nowy zestaw, usunięcie, edycja).

US‑034
Tytuł: Ponowne wejście do rozpoczętej selekcji
Opis: Jako użytkownik chcę wrócić do rozpoczętego przeglądu batchy, jeśli przerwałem sesję.
Kryteria akceptacji:

- System pamięta postęp w przeglądzie w ramach jednej sesji przeglądu; po odświeżeniu można kontynuować, o ile propozycje nie wygasły czasowo.

US‑035
Tytuł: Ręczna korekta harmonogramu (opcjonalnie w MVP)
Opis: Jako zaawansowany użytkownik chcę ręcznie przeplanować pojedynczą fiszkę.
Kryteria akceptacji:

- Możliwe nadpisanie najbliższego terminu w granicach dziennych limitów.

## 6. Metryki sukcesu

6.1 Akceptacja AI

- Definicja: Odsetek wygenerowanych przez AI fiszek zaakceptowanych (po ewentualnej edycji) w ramach partii.
- Wzór: liczba zaakceptowanych fiszek AI / liczba wszystkich wygenerowanych fiszek AI.
- Cel: ≥ 75%.

  6.2 Udział AI w tworzeniu fiszek

- Definicja: Odsetek nowych fiszek utworzonych przez AI wśród wszystkich nowo utworzonych fiszek w danym okresie (manualne + AI; importy wyłączone, bo poza MVP).
- Wzór: liczba nowych fiszek AI / liczba wszystkich nowych fiszek.
- Cel: 75% (do potwierdzenia).

  6.3 Wydajność generacji

- Definicja: Czas od submit do gotowej listy 30 fiszek dla tekstu 1k słów.
- Wskaźnik: P95 < 10 s. Dodatkowo stopa timeoutów < 2% miesięcznie.

  6.4 Aktywacja nauki

- Definicja: Odsetek użytkowników, którzy po zapisaniu kart z generacji uruchamiają pierwszą sesję SRS w ciągu 24 h.
- Cel: ≥ 60% (do kalibracji po pierwszym miesiącu).

  6.5 Retencja SRS (opcjonalnie w MVP raportowana)

- Definicja: Odsetek użytkowników, którzy wracają do co najmniej jednej sesji SRS w tygodniu 1–2 od rejestracji.
- Cel: do obserwacji; target po 4 tyg. danych.

  6.6 Jakość danych

- Duplikaty w batchu generacji: < 2% kart.
- Zgodność limitów 200/500: 100%.

  6.7 Niezawodność

- Udział błędów krytycznych w generacji < 1% żądań miesięcznie.
- Skuteczność retry: ≥ 70% przypadków timeoutu kończy się sukcesem po ponowieniu.
