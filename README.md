# Βασανιστήριον γραμματικῆς  
### Der Folterkeller der Grammatik

> ⚠️ Dieses Projekt (Code und README) wurde mit Hilfe von **ChatGPT** erstellt.

Ja ich weiss ChatGPT, man sieht es dem Code auch ähmm...etwas an. Aber so ging es halt viel schneller. Ich schäme mich trotzdem etwas für den Code. Einfach nicht hinschauen...

Nein wirklich ich kann das eigentlich schon besser aber halt nicht schneller ohne AI und ich muss Latein lernen und nicht coden...

---

## 🪪 Lizenz

Dieses Projekt steht unter der **GNU General Public License v3.0 (GPL-3.0)**.  
Das bedeutet:
- freie Verwendung, Weitergabe und Veränderung erlaubt,
- Änderungen und abgeleitete Projekte müssen ebenfalls offen bleiben (GPL-kompatibel).

Siehe die beiliegende Datei [`LICENSE`](LICENSE) oder  
[https://www.gnu.org/licenses/gpl-3.0.html](https://www.gnu.org/licenses/gpl-3.0.html).

---

## 🧩 Inhalt

Diese App dient zum **Üben von lateinischer und altgriechischer Grammatik**,  
vor allem Deklinationen (Substantive, Artikel) und erste Quize dazu.

Enthalten sind u. a.:

- **Lateinische Deklinationstabellen** mit Hover-Effekt und Beispielen  
- **Griechische Deklinationstabellen** mit Artikeln und Beispielen  
- **Interaktive Quize** (Kasus erkennen, Drag-and-Drop, u. a.)  
- **Erweiterbare CSV-Daten** für neue Wörter und Deklinationen

Ziel ist, das System später um **Adjektive, Verben und griechische Formen** zu erweitern.

---

## 🔧 Installation & Nutzung

Du kannst den Trainer **direkt lokal** ausführen – kein Server oder Build notwendig.

### Download

1. Entweder **ZIP herunterladen** (`Code ▸ Download ZIP`)  
   oder **Repository klonen**:
   ```bash
   git clone https://github.com/nicoleth1234/GrammatikLernen.git
   ```
2. Öffne den Ordner.

### 🚀 Lokaler Start ohne IDE

Die Anwendung besteht vollständig aus HTML / CSS / JS  
und braucht **keine Installation oder Datenbank**.

Damit Browser-Sicherheitsrichtlinien (CORS) keine Dateien blockieren,  
musst du die Seite über einen **lokalen Webserver** starten.

#### 🪟 Windows

1. Im Projektordner doppelklicken auf  
   **`serve.cmd`**

   oder im Terminal:
   ```bash
   serve.cmd
   ```

2. Danach öffnet sich automatisch dein Browser unter  
   👉 [http://localhost:5500/index.html](http://localhost:5500/index.html)

#### 🍎 macOS / 🐧 Linux

1. Öffne ein Terminal im Projektordner  
2. Führe aus:

   ```bash
   chmod +x serve.sh
   ./serve.sh
   ```

3. Der Server startet automatisch und öffnet dieselbe URL  
   👉 [http://localhost:5500/index.html](http://localhost:5500/index.html)

### 💡 Erklärung

- Beide Skripte nutzen **Python 3** (Standard auf macOS/Linux)  
  oder alternativ **Node.js** (`npx http-server`), falls installiert.  
- Wenn weder Python noch Node vorhanden sind,  
  zeigen sie eine kurze Installationsanleitung an.

---

## 🛠 Für Interessierte (optional)

Wenn du lieber selbst bauen möchtest (z. B. TypeScript nach JS transpiliert):

```bash
npm install
npx tsc -w
```

Anschliessend kannst du den generierten `dist/`-Ordner direkt nutzen.  
Dieser ist aber **bereits enthalten**, damit du die App ohne Build-Schritt ausführen kannst.

---

## ✍️ Mitarbeit & Erweiterung

- Neue Wörter oder Deklinationen kannst du einfach in den jeweiligen **CSV-Dateien** ergänzen  
  (`assets/data/*.csv`).  
- Der Code ist modular aufgebaut – z. B. können Quize oder Sprachen leicht erweitert werden.  
- Feedback oder Verbesserungsvorschläge sind herzlich willkommen!

---

Viel Spass beim Üben! 🏺📚  
**Βασανιστήριον γραμματικῆς – Der Folterkeller der Grammatik**
