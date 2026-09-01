# Zehnerkreis

Punktezähler für das Quizspiel **Smart 10** — ein [WpApp](https://github.com/akirk/wp-app)-Plugin.
Gespielt wird nach dem Regelwerk der TV-Show (Punktnummern unten), zu zweit.

## Ablauf

Eine Frage hat **10 Antwortoptionen**. Die beiden Teams sind abwechselnd am Zug, die
Tasten tragen den Namen des Teams, das gerade dran ist:

| Taste | Wirkung |
|---|---|
| **Richtig** | Punkte ins Rundenkonto, dann ist das andere Team dran. |
| **Falsch** | Das Rundenkonto ist weg, das Team darf in dieser Runde nichts mehr beantworten (6 d). |
| **Aussteigen** | Das Rundenkonto wird dem Spielkonto gutgeschrieben, das Team ist für diese Runde fertig (6 b). |

Kann ein Team nicht mehr, spielt das andere die Runde allein weiter (6 e). Eine Runde
endet, wenn alle 10 Optionen verbraucht sind oder keines der Teams mehr lösen kann (6 f) —
wer dann noch drin ist, behält sein Rundenkonto. Die nächste Frage startet automatisch.

## Punkte (Punkt 8)

Die *n*-te richtig gelöste Option einer Runde bringt *n* Punkte: 1, 2, 3 … 10, macht
55 in einer vollen Runde. Falsche Antworten verbrauchen eine Option, erhöhen die
Staffelung aber nicht.

## Spiellänge

Auf dem Startbildschirm (Namen) wählbar, solange noch nichts gespielt ist:

| | Runden | Bonusrunden |
|---|---|---|
| **Kurz** | 4 | die letzte (Frage 4) |
| **Lang** | 10 | Frage 5 und Frage 10 |

## Bonusrunden (17, 19, 16 b, 18)

In einer Bonusrunde sind alle Optionen doppelt so viel wert
(2, 4, 6 … 20, macht 110). Den ersten Zug einer Bonusrunde macht das Team, das vorne
liegt (19). Ist ein Team vor der letzten Runde uneinholbar vorne, scheidet das andere
aus, **seine Punkte werden auf Null gesetzt**, und die letzte Bonusrunde wird allein
gespielt (16 b).

Jedes Team hat für die **ganze** Bonusrunde 30 Sekunden, die nur laufen, solange es am
Zug ist (18). Die erste Uhr startet der **Zeit starten**-Knopf, danach wechselt sie
automatisch mit dem Zug (18 c); vorher sind die Antworttasten gesperrt (18 a). Läuft
die Zeit eines Teams ab, gilt das als Aussteigen: die Rundenpunkte bleiben (18 d).

## Spielende (5, 20)

Nach der letzten Frage gewinnt, wer mehr Punkte hat; bei Gleichstand endet es unentschieden.

## Bedienung

Wenn eine Frage endet, schaltet die App von selbst weiter — der Wechsel wird deshalb mit
einem kurz aufblinkenden Banner unter der Überschrift angekündigt, das zeigt, wer in der
abgeschlossenen Frage wie viel geholt hat.

**Rückgängig** nimmt jede Aktion zurück, auch den automatischen Fragenwechsel.
**Namen** benennt die Teams um, **Neues Spiel** setzt zurück. Der Spielstand liegt im
Browser (`localStorage`) — kein Login, keine Netzwerkaufrufe, nichts davon landet in der
WordPress-Datenbank. Die App ist als PWA installierbar
und funktioniert offline.

Aufruf: `/zehnerkreis/`

## Rechtliches

Zehnerkreis ist ein unabhängiger Punktezähler und steht in keiner Verbindung zum
Hersteller oder Rechteinhaber des Spiels; der Spielname wird nur genannt, um zu
beschreiben, wofür die App gedacht ist. Smart10 ist eine Marke der jeweiligen Inhaber.
