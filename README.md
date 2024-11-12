# Pokladní Software

Tento projekt je user-friendly pokladní software zaměřený na pokladní prodej. Usnadňuje práci pokladním a poskytuje vedoucím lepší dohled nad jejich činností.

## Původ projektu
Tento projekt byl vytvořen jako bakalářská práce na Matematicko-fyzikální fakultě Univerzity Karlovy. 

## Odkazy
- [Odkaz na bakalářskou práci](https://github.com/user-attachments/files/17714413/BPTX.2021.Report.pdf)
- Projekt byl přesunut z univerzitního GitLabu do tohoto GitHub repozitáře

## Požadavky

- Python 3.8+
- Node.js 14+

- npm 6+ nebo yarn 1.22+
- PostgreSQL 12+

## Instalace

### Backend (Django)

1. Naklonujte repozitář:
   ```
   git clone https://gitlab.mff.cuni.cz/teaching/nprg045/kopecky/Nguyen_Hai_Hung_2022.git
   cd Nguyen_Hai_Hung_2022/backend
   ```

2. Vytvořte virtuální prostředí a aktivujte ho:
   ```
   python -m venv venv
   source venv/bin/activate
   ```

3. Nainstalujte potřebné balíčky:
   ```
   pip install -r requirements.txt
   ```

4. Vytvořte soubor `.env` v adresáři `backend/` a nastavte následující proměnné:
```
SECRET_KEY=tajny-klic
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
PUBLIC_BASE_URL=http://localhost:8000
DEBUG=1
DJANGO_ALLOWED_HOSTS=
DJANGO_CSRF_TRUSTED_ORIGINS=
DJANGO_CORS_ALLOWED_ORIGINS=
```

Vysvětlení proměnných:

- `SECRET_KEY`: Unikátní tajný klíč pro Django aplikaci. Změňte na vlastní bezpečný řetězec.
- `DB_*`: Nastavení databáze. Upravte podle vaší PostgreSQL konfigurace.
- `PUBLIC_BASE_URL`: URL adresa backendu.
- `DEBUG`: Nastavte na 0 pro produkční prostředí.
- `DJANGO_ALLOWED_HOSTS`: Seznam povolených hostitelů, oddělených čárkami (např. `localhost,example.com`).
- `DJANGO_CSRF_TRUSTED_ORIGINS`: Seznam důvěryhodných origins pro CSRF ochranu.
- `DJANGO_CORS_ALLOWED_ORIGINS`: Seznam povolených origins pro CORS.

5. Proveďte migrace databáze:
   ```consoles
   python manage.py makemigrations
   python manage.py migrate
   ```

### Frontend (Next.js)

1. Přejděte do adresáře frontendu:
   ```
   cd ../next-ui
   ```

2. Nainstalujte závislosti:
   ```
   npm install
   # nebo
   yarn install
   ```

3. Vytvořte soubor `.env.local` v adresáři `frontend/` a nastavte následující proměnné:
   ```
    NEXT_PUBLIC_PUBLIC_BASE_AUTH_URL=http://localhost:8000
    NEXT_PUBLIC_PUBLIC_BASE_URL=http://localhost:8000
    NEXTAUTH_URL=http://localhost:8000
    NEXTAUTH_INTERNAL_URL=http://localhost:3000
    NEXTAUTH_SECRET=tajny-klic
   ```
Vysvětlení proměnných:
- `NEXT_PUBLIC_PUBLIC_BASE_AUTH_URL`: URL adresa pro autentizaci.
- `NEXT_PUBLIC_PUBLIC_BASE_URL`: Základní URL adresa backendu.
- `NEXTAUTH_URL`: URL adresa pro NextAuth.
- `NEXTAUTH_INTERNAL_URL`: Interní URL adresa pro NextAuth.
- `NEXTAUTH_SECRET`: Tajný klíč pro NextAuth. Změňte na vlastní bezpečný řetězec.

Poznámka: Ujistěte se, že hodnoty `NEXT_PUBLIC_PUBLIC_BASE_AUTH_URL` a `NEXT_PUBLIC_PUBLIC_BASE_URL` odpovídají vaší backend konfiguraci.


### Generování bezpečných klíčů

Pro `SECRET_KEY` (Django) a `NEXTAUTH_SECRET` (Next.js) je důležité použít bezpečné, náhodně generované klíče. Zde jsou způsoby, jak je vygenerovat:

#### Django SECRET_KEY

V Pythonu můžete vygenerovat bezpečný klíč pomocí následujícího kódu:

```python
import secrets

print(secrets.token_urlsafe(50))
```

Spusťte tento kód v Python konzoli a použijte vygenerovaný řetězec jako hodnotu `SECRET_KEY` v souboru `.env` backendu.

#### NextAuth SECRET

Pro `NEXTAUTH_SECRET` můžete použít stejný postup jako pro Django `SECRET_KEY`, nebo můžete použít nástroj příkazové řádky `openssl`:

```bash
openssl rand -base64 32
```

Spusťte tento příkaz v terminálu a použijte vygenerovaný řetězec jako hodnotu `NEXTAUTH_SECRET` v souboru `.env` frontendu.

Poznámka: Ujistěte se, že tyto klíče uchováváte v bezpečí a nesdílíte je. V produkčním prostředí by měly být uchovávány bezpečně a nikdy by neměly být zahrnuty v repozitáři kódu.

## Spuštění aplikace

1. Spusťte backend server:
   ```
   cd backend
   python manage.py runserver
   ```

2. V novém terminálu spusťte frontend development server:
   ```
   cd frontend
   npm run dev
   # nebo
   yarn dev
   ```

3. Otevřete prohlížeč a přejděte na `http://localhost:3000`

## Nasazená verze

Nasazená verze aplikace je dostupná na adrese:

http://tirpitz.ms.mff.cuni.cz:3003

Tuto verzi můžete použít pro testování nebo demo účely bez nutnosti lokální instalace.

## Testování

- Pro spuštění backend testů:
  ```
  cd backend
  python manage.py test
  ```
