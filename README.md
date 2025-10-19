# 🐕 Animal Shelters

🐾 Find the best-fitting animal waiting for you in one of the many Slovenian animal shelters.

<br>

## README v1.0

## 🧩 Opis projekta

Cilj projekta je zasnova in prikaz delovanja sistema, ki centralizira podatke vseh **zavetišč za živali v Sloveniji** na enem mestu.  
S tem bi uporabniki (npr. potencialni posvojitelji, prostovoljci ali organizacije) lahko **iskali, filtrirali in pregledovali** podatke o živalih, zavetiščih ter dogodkih, ki jih ta organizirajo.

Projekt prikazuje uporabo **XML** in **JSON** tehnologij v okolju **Node.js**, pri čemer se demonstrira:

- branje in obdelava več povezanih XML datotek,
- pretvorba podatkov v JavaScript objekte (deserializacija),
- povezovanje entitet prek atributov ID (npr. `shelterId`),
- filtriranje podatkov glede na poljubne kriterije,
- izpis rezultatov v pregledni obliki v konzolo,
- in izvoz podatkov v nove JSON in XML datoteke.

Ideja temelji na realnem scenariju, kjer bi lahko z združevanjem informacij iz različnih slovenskih zavetišč na enem mestu olajšali:

- iskanje primernega ljubljenčka za posvojitev,
- informacije o posameznem zavetišču,
- promocijo dogodkov, ki spodbujajo posvojitev in odgovorno skrbništvo živali.

<br>

## 📂 Podatkovne datoteke

V projektu so uporabljene tri XML datoteke, ki so med seboj povezane prek atributa `shelterId`.

### 1️⃣ `animals.xml`

- Vsebuje podatke o živalih v posameznih zavetiščih.
- Atributi: `id`, `species`, `name`, `breed`, `sex`, `ageMonths`, `colors`, `weightKg`, `neutered`, `adoptionFee`, `intakeDate`, `vaccinations`, `microchip`, `temperament`, `shelterId`.
- Namen: omogočiti filtriranje živali glede na vrsto, spol, starost, sterilizacijo, lokacijo in ceno posvojitve.

### 2️⃣ `shelters.xml`

- Vsebuje podatke o vseh registriranih zavetiščih v Sloveniji.
- Atributi: `id`, `name`, `city`, `postalCode`, `address`, `region`, `capacity`, `phone`, `email`, `latitude`, `longitude`, `established`.
- Namen: vsaka žival ali dogodek v drugih datotekah je povezan s to datoteko prek `shelterId`, kar omogoča združevanje podatkov po regijah in mestih.

### 3️⃣ `events.xml`

- Vsebuje podatke o dogodkih, ki jih organizirajo zavetišča.
- Atributi: `id`, `type`, `title`, `date`, `city`, `shelterId`, `startTime`, `endTime`, `location`, `description`, `status`, `audience`, `entry/fee`.
- Namen: prikazati dodatne aktivnosti zavetišč (npr. dnevi odprtih vrat, posvojitveni sejmi, dobrodelni dogodki, delavnice, osveščevalne kampanje ipd.).

<br>

## ⚙️ Tehnična izvedba

Projekt temelji na **Node.js** okolju in uporablja knjižnice:

- `express` in `cors` – za enostavno ustvarjanje API-jev in komunikacijo s frontend delom,
- `fast-xml-parser` – za branje in pretvorbo XML datotek v JS objekte,
- `xmlbuilder2` – za ponovno generiranje XML datotek iz objektov.

Podatki se berejo v datoteki `xmlStore.js`, kjer se izvajajo naslednji koraki:

1. Branje XML datotek iz mape `/data`.
2. Pretvorba XML vsebine v JavaScript objekte.
3. Povezovanje podatkov med `animals`, `shelters` in `events` prek atributa `shelterId`.

Glavni skript `runTask.js` prikazuje konkretno uporabo teh podatkov:

- Primeri treh filtrov:
  - vse živali, ki **niso kastrirane/sterilizirane**,
  - vsi psi z **adopcijsko ceno pod 100 €**,
  - vsi dogodki, ki potekajo **v Ljubljani**;
- Filtrirani podatki se izpišejo v **pregledni konzolni tabeli**;
- Rezultati se izvozijo v datoteke `filtrirano.json` in `filtrirano.xml`.

<br>

## 🚀 Navodila za zagon

1. Odprite mapo projekta in v terminalu zaženite:
   ```bash
   cd backend
   npm install express cors fast-xml-parser xmlbuilder2
   ```

2. Zaženite skript, ki izvaja nalogo XML → JSON in filtriranje
   ```bash
   node runTask.js
   ```

3. V konzoli se izpišejo rezultati filtriranja (trije primeri), v mapo `/output` pa se shranita datoteki:
    - `filtrirano.json`
    - `filtrirano.xml`

<br>

## 🧾 Primer izhoda

```bash
XML files successfully loaded.
Shelters: 15, Animals: 15, Events: 15

First 5 animals (example linked data):
┌─────────┬────────┬─────────┬───────────────────────────────────────────┬────────────────────┐
│ (index) │ ID     │ Name    │ Shelter                                   │ City               │
├─────────┼────────┼─────────┼───────────────────────────────────────────┼────────────────────┤
│ 0       │ 'D001' │ 'Luna'  │ 'Zavetišče za zapuščene živali Ljubljana' │ 'Ljubljana'        │
│ 1       │ 'C001' │ 'Maks'  │ 'Zavetišče Horjul'                        │ 'Horjul'           │
│ 2       │ 'D002' │ 'Bella' │ 'Zavetišče Maribor'                       │ 'Maribor'          │
│ 3       │ 'C002' │ 'Mici'  │ 'Zavetišče za mačke Mačja Hiša'           │ 'Celje'            │
│ 4       │ 'D003' │ 'Rex'   │ 'Zavetišče za živali Mala Hiša'           │ 'Moravske Toplice' │
└─────────┴────────┴─────────┴───────────────────────────────────────────┴────────────────────┘

Filter 1: Animals that are not neutered
┌─────────┬────────┬────────┬─────────┬──────────┬─────┬────────────────────────────────────┬───────────────┐
│ (index) │ ID     │ Name   │ Species │ Neutered │ Fee │ Shelter                            │ City          │
├─────────┼────────┼────────┼─────────┼──────────┼─────┼────────────────────────────────────┼───────────────┤
│ 0       │ 'C001' │ 'Maks' │ 'Mačka' │ false    │ 40  │ 'Zavetišče Horjul'                 │ 'Horjul'      │
│ 1       │ 'C002' │ 'Mici' │ 'Mačka' │ false    │ 35  │ 'Zavetišče za mačke Mačja Hiša'    │ 'Celje'       │
│ 2       │ 'O001' │ 'Kiki' │ 'Zajec' │ false    │ 20  │ 'Zavetišče za mačke Mačji dol'     │ 'Škofja Loka' │
│ 3       │ 'D005' │ 'Oto'  │ 'Pes'   │ false    │ 70  │ 'Zavetišče Johanca'                │ 'Tolmin'      │
│ 4       │ 'D006' │ 'Grom' │ 'Pes'   │ false    │ 140 │ 'Zavetišče za male živali Sevnica' │ 'Sevnica'     │
│ 5       │ 'C005' │ 'Pika' │ 'Mačka' │ false    │ 30  │ 'Zavetišče Meli'                   │ 'Trebnje'     │
│ 6       │ 'D008' │ 'Jaka' │ 'Pes'   │ false    │ 65  │ 'Zavetišče Zonzani'                │ 'Dramlje'     │
└─────────┴────────┴────────┴─────────┴──────────┴─────┴────────────────────────────────────┴───────────────┘

Filter 2: Dogs with adoption fee under 100€
┌─────────┬────────┬────────┬─────────┬─────┬───────────────────────────────────────────┬────────────────────┐
│ (index) │ ID     │ Name   │ Species │ Fee │ Shelter                                   │ City               │
├─────────┼────────┼────────┼─────────┼─────┼───────────────────────────────────────────┼────────────────────┤
│ 0       │ 'D001' │ 'Luna' │ 'Pes'   │ 80  │ 'Zavetišče za zapuščene živali Ljubljana' │ 'Ljubljana'        │
│ 1       │ 'D003' │ 'Rex'  │ 'Pes'   │ 0   │ 'Zavetišče za živali Mala Hiša'           │ 'Moravske Toplice' │
│ 2       │ 'D005' │ 'Oto'  │ 'Pes'   │ 70  │ 'Zavetišče Johanca'                       │ 'Tolmin'           │
│ 3       │ 'D008' │ 'Jaka' │ 'Pes'   │ 65  │ 'Zavetišče Zonzani'                       │ 'Dramlje'          │
│ 4       │ 'D009' │ 'Aron' │ 'Pes'   │ 90  │ 'Arja, zavetišče za živali'               │ 'Jesenice'         │
└─────────┴────────┴────────┴─────────┴─────┴───────────────────────────────────────────┴────────────────────┘

Filter 3: Events happening in Ljubljana
┌─────────┬────────┬────────────────────┬──────────────┬─────────────┬───────────────────────┬───────────────────────────────────────────┐
│ (index) │ ID     │ Title              │ Date         │ City        │ Location              │ Shelter                                   │
├─────────┼────────┼────────────────────┼──────────────┼─────────────┼───────────────────────┼───────────────────────────────────────────┤
│ 0       │ 'E001' │ 'Dan odprtih vrat' │ '2026-09-07' │ 'Ljubljana' │ 'Zavetišče Ljubljana' │ 'Zavetišče za zapuščene živali Ljubljana' │
└─────────┴────────┴────────────────────┴──────────────┴─────────────┴───────────────────────┴───────────────────────────────────────────┘

Filtered results exported to:
 - output/filtrirano.json
 - output/filtrirano.xml
```

<br>

## 🧾 Struktura projekta

```bash
AnimalShelters/
│
├─ data/                          # XML datoteke z izhodiščnimi podatki
│  ├─ animals.xml                 # Podatki o živalih (vrsta, spol, starost, sterilizacija, zavetišče ...)
│  ├─ shelters.xml                # Podatki o vseh slovenskih zavetiščih (mesto, regija, kontakt ...)
│  └─ events.xml                  # Dogodki posameznih zavetišč (datum, lokacija, opis ...)
│
├─ backend/                       # Izvorna koda projekta (Node.js)
│  ├─ index.js                    # Glavni Express strežnik z API-ji
│  ├─ runTask.js                  # Skripta za branje XML, filtriranje in izvoz (za oddajo)
│  ├─ xmlStore.js                 # Branje XML datotek in združevanje podatkov prek ID-jev
│  ├─ utils/
│  │   ├─ xml.js                  # Pretvorba XML → JS objektov
│  │   └─ export.js               # Izvoz filtriranih podatkov v JSON in XML
│
├─ output/                        # Rezultati izvoza
│  ├─ filtrirano.json
│  └─ filtrirano.xml
│
├─ frontend/                      # (opcijsko) React aplikacija za prikaz in filtriranje podatkov
│  └─ animal-shelters-frontend/
│
└─ README.md                      # Opis projekta, navodila za zagon in primer izhoda
```

## 💬 Povzetek

Projekt Slovenska zavetišča prikazuje, kako lahko s pomočjo programskega jezika JavaScript in tehnologij XML/JSON zgradimo osnovni sistem za upravljanje in deljenje podatkov med različnimi zavetišči.
Glavni namen je pokazati, kako je mogoče podatke o živalih, zavetiščih in dogodkih povezati, filtrirati, izvoziti in predstaviti v uporabniku prijazni obliki.

S tem projektom je dosežen glavni cilj: centralizacija informacij o slovenskih zavetiščih za živali v enotno digitalno okolje, ki omogoča enostavno iskanje, filtriranje in posodabljanje podatkov.
