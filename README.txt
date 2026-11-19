VINCENT / YUNA – EIGENSTÄNDIGES INTERAKTIVES ZIMMER

Dateien: index.html, room.css, room.js.
Öffne index.html in einem Browser. Keine Verbindung zur Vincent-KI nötig.
Das Zimmer liest Uhrzeit/Datum aus dem Gerät und bestimmt daraus Tages- und Jahreszeit (meteorologische Jahreszeiten, Nordhalbkugel).
Interaktionen: Fenster/Vorhänge, Lampe/Licht, Sofa, Bett, Kalender/Monatsnavigation.
Sofa und Bett sind momentan anklickbare Platzhalter für spätere Figureninteraktionen; Vincent bewegt sich noch nicht dorthin.

ARCHITEKTUR
- Der Raum wird ausschließlich innerhalb von #room-root aufgebaut.
- room.js greift nicht auf app.js, brain-worker.js, Gedächtnis oder Sprache zu.
- Spätere Figurenintegration: window.VincentRoom.mountFigure(htmlElement).
- Späterer Designwechsel Vincent -> Yuna benötigt nur den Austausch des Figuren-Elements.
- Das Paket ändert KEINE bestehende GitHub-Website.
- Partikel sind stilisierte jahreszeitliche Effekte, KEINE Wetterdaten.
- Die Gestaltung ist CSS-basiert und benötigt keine externen APIs oder Bilddateien.
- Wortkorrektur bleibt im bisherigen separaten Erweiterungspaket; dieses ZIP konzentriert sich ausschließlich auf den Raum.
