# **Kreator Logo SimLE**
[![Netlify Status](https://api.netlify.com/api/v1/badges/f12eb811-2b34-49a5-899e-e350b714f83c/deploy-status)](https://app.netlify.com/projects/simle-logo/deploys)

Projekt narzędzia do tworzenia sygnetów i logotypów w stylu marki SimLE, oparty na technologii React oraz TypeScript.

## **Wymagania wstępne**

Aby uruchomić projekt, upewnij się, że masz zainstalowane na swoim komputerze:

1. **Node.js** (wersja 18 lub nowsza).  
2. **npm** (dołączony do Node.js) lub **yarn**.

## **Przygotowanie środowiska**

1. **Sklonuj repozytorium** (lub pobierz pliki projektu).  
2. **Zainstaluj zależności**:  
   Otwórz terminal w folderze projektu i wpisz:  
   npm install

3. **Uruchom projekt w trybie deweloperskim**:  
   npm run dev

   Aplikacja będzie dostępna pod adresem http://localhost:5173 (lub innym wskazanym w terminalu).

## **Użycie plików .tsx**

Twój główny plik App.tsx jest punktem wejścia komponentu. Aby poprawnie korzystać z TypeScript w React:

* **Typowanie**: TypeScript wymusza określenie typów dla stanów i propsów. Przykład:  
  interface AppProps {  
    initialColor?: string;  
  }  
  const App: React.FC\<AppProps\> \= ({ initialColor \= '\#000' }) \=\> { ... }

* **Struktura**: Upewnij się, że w pliku index.html lub main.tsx znajduje się odpowiedni punkt montowania:  
  const root \= ReactDOM.createRoot(document.getElementById('root') as HTMLElement);  
  root.render(\<App /\>);

## **Funkcjonalności**

* **Interaktywna siatka**: Możliwość malowania trójkątów.  
* **Zarządzanie kolorami**: Wybór koloru przewodniego i tworzenie własnej palety.  
* **Wizualizacja na żywo**: Automatyczne renderowanie sygnetu i tekstu z użyciem Science Gothic.  
* **Eksport**: Możliwość pobierania projektów jako pliki .svg.

## **Budowanie aplikacji (dla produkcji)**

Aby wygenerować zoptymalizowaną wersję aplikacji do umieszczenia na serwerze:  
npm run build  
