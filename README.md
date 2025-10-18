# 🏛️ Latein-Deklinations-Trainer

> Dieses Projekt (Code und README) wurde mit Hilfe von **ChatGPT** erstellt.

Ja ich weiss ChatGPT, man sieht es dem Code auch ähmm...etwas an. Aber so ging es halt viel schneller. Ich schäme mich trotzdem etwas für den Code. Einfach nicht hinschauen...

Nein wirklich ich kann das eigentlich schon besser aber halt nicht schneller ohne AI und ich muss Latein lernen und nicht coden...

---

## ⚖️ Lizenz

Dieses Projekt steht unter der **GNU General Public License v3.0 (GPL-3.0)**.  
Das bedeutet:
- freie Nutzung, Weitergabe und Veränderung des Codes  
- der Quellcode bleibt offen  
- abgeleitete Werke müssen ebenfalls unter der GPL veröffentlicht werden

Kurz gesagt: Du darfst alles damit machen – solange du es auch anderen erlaubst, das Gleiche zu tun.  

---

## 📘 Beschreibung

Ein interaktiver **Latein-Trainer** zum Üben der **Deklinationen** – gebaut mit **TypeScript**, **HTML** und **CSS**.  
Das Projekt richtet sich an Lernende, die spielerisch Formen wiederholen oder eigene Wörterlisten pflegen möchten.  
(Später können auch **Verben**, **Adjektive** oder **griechische Formen** ergänzt werden.)

---

## ✨ Features

- 📚 **Tabellenansicht:** Zeigt für jede Deklination die Kasus und Numeri mit Endungen.
- 🧠 **Quiz „Kasus bestimmen“:** Man erkennt am Wort den Kasus.
- 🧩 **Zuordnungs-Quiz:** Ziehe die Formen an die richtige Stelle (Kasus × Numerus).
  - mit oder ohne **Vokativ**
  - **Normalmodus:** Alle Formen (inkl. Duplikate), Meta-Infos sichtbar.
  - **Hardmodus:** Jede Form nur einmal, keine Meta-Infos.
  - Fortschrittsbalken, Timer und Gratulationsmeldung bei 100 %.
- 🧾 **CSV-basiert:** Alle Daten (Deklinationen, Substantive, usw.) kommen aus CSV-Dateien.
  - → Man kann leicht neue Wörter oder Deklinationen ergänzen.
- 💡 **Erweiterbar:** Struktur so aufgebaut, dass später Verben, Adjektive oder Griechisch hinzugefügt werden können.

---

## 🔧 Installation & Nutzung

Du kannst den Trainer **direkt lokal** ausführen – kein Server oder Build notwendig.

### 🅰️ Variante 1: Direkt starten (empfohlen)

1. Entweder **ZIP herunterladen** (`Code ▸ Download ZIP`)  
   oder **Repository klonen**:
   ```bash
   git clone https://github.com/nicoleth1234/GrammatikLernen.git
   ```
2. Öffne den Ordner.
3. Doppelklick auf **index.html**  
   → das Projekt startet direkt im Browser!

### 🅱️ Variante 2: Für Interessierte mit TypeScript-Kenntnissen
Falls du den Code selbst erweitern oder anpassen willst:

```bash
npm install
npx tsc --watch
```

Dann die `index.html` im Browser öffnen oder einen lokalen Server starten.

---

## 🧩 CSV-Dateien

### `deklinationen.csv`
Beschreibt alle **Endungen** der verschiedenen Deklinationen.

| Deklination | Kasus | Genus | Numerus | Endung |
|--------------|--------|--------|----------|---------|
| a | Nom. | f | Sg | a |
| a | Gen. | f | Sg | ae |
| o | m | Sg | ... | us |
| 3 | n | Pl | ... | a |
| ... | ... | ... | ... |

Neue Deklinationen können einfach hinzugefügt werden – keine Codeänderungen nötig.

---

### `substantive.csv`
Enthält die Substantive, die im Quiz vorkommen können.

| Deklination | Genus | Stamm | Nom. Sg | ist_i_stamm |
|--------------|--------|--------|----------|--------------|
| a | f | famili | familia | false |
| o | m | amic | amicus | false |
| o | n | vin | vinum | false |
| 3 | m | homin | homo | false |
| 3 | n | nomin | nomen | false |

Weitere Substantive können einfach hinzugefügt werden.  
Alle neuen Wörter werden automatisch in Tabellen und Quizes berücksichtigt.

---

## 💡 Erweiterungen geplant

- 🇬🇷 **Griechische Deklinationen**
- 🔤 **Adjektive**
- 🏃 **Verben (Konjugationen)**
- 🧩 **Neue Quizformen** (z. B. Lücken- oder Übersetzungsquiz)
- 🏆 **Highscore-System** & Statistiken

---

## 💬 Mitmachen

Beiträge, Verbesserungsvorschläge und neue Wortlisten sind willkommen!  
Achte bitte darauf, dass die CSV-Dateien **UTF‑8‑kodiert** sind.


