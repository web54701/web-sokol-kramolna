# Nastavení Gmail účtu pro odesílání e-mailů

Tento dokument popisuje, jak nakonfigurovat jiný Gmail účet pro odesílání potvrzovacích e-mailů rezervací.

---

## Krok 1 – Google Cloud projekt a Gmail API

1. Přejděte na [console.cloud.google.com](https://console.cloud.google.com)
2. Nahoře vlevo klikněte na selektor projektu → **New Project**
   - Project name: např. `sokol-kramolna-mail`
   - Klikněte **Create**
3. V levém menu: **APIs & Services → Library**
4. Vyhledejte `Gmail API` → klikněte na výsledek → **Enable**

---

## Krok 2 – Google Auth Platform (OAuth consent screen)

1. V levém menu: **APIs & Services → Google Auth Platform**
2. Klikněte **Get started**
3. Vyplňte:
   - App name: `Sokol Kramolna`
   - User support email: váš Gmail účet
4. **Next** → Audience: zvolte **External** → **Next**
5. Contact information: váš Gmail účet → **Next**
6. Odsouhlaste podmínky → **Continue** → **Create**

### Přidání testovacího uživatele

1. **Google Auth Platform → Audience** → sekce **Test users** → **Add users**
2. Přidejte adresu Gmail účtu, ze kterého chcete odesílat
3. **Save**

### Publikování do Production

1. **Google Auth Platform → Audience** → klikněte **Publish App** → **Confirm**
2. Stav se změní na **In production**

> **Důležité:** Bez publikování do Production vyprší refresh token po 7 dnech.

---

## Krok 3 – OAuth 2.0 credentials

1. **APIs & Services → Credentials → + Create Credentials → OAuth client ID**
2. Application type: **Web application**
3. Name: `sokol-mail`
4. Authorized redirect URIs → **+ Add URI**:
   ```
   https://developers.google.com/oauthplayground
   ```
5. Klikněte **Create**
6. Zkopírujte a uložte:
   - **Client ID** → hodnota pro `GMAIL_CLIENT_ID`
   - **Client Secret** → hodnota pro `GMAIL_CLIENT_SECRET`

---

## Krok 4 – Refresh token (OAuth Playground)

1. Přejděte na [developers.google.com/oauthplayground](https://developers.google.com/oauthplayground)
2. Vpravo nahoře klikněte na **⚙️ Settings**
3. Zaškrtněte **Use your own OAuth credentials**
4. Vložte Client ID a Client Secret z Kroku 3 → zavřete settings
5. V levém panelu rozbalte **Gmail API v1** → zaškrtněte:
   ```
   https://www.googleapis.com/auth/gmail.send
   ```
6. Klikněte **Authorize APIs**
7. Přihlaste se účtem, ze kterého chcete odesílat → odsouhlaste přístup
8. V kroku 2 klikněte **Exchange authorization code for tokens**
9. Zkopírujte hodnotu `refresh_token` → hodnota pro `GMAIL_REFRESH_TOKEN`

---

## Krok 5 – Uložení hodnot

### Lokální vývoj

Otevřete soubor `.dev.vars` v kořeni projektu a vyplňte hodnoty:

```
GMAIL_CLIENT_ID=váš-client-id
GMAIL_CLIENT_SECRET=váš-client-secret
GMAIL_REFRESH_TOKEN=váš-refresh-token
```

Restartujte `npm run dev`.

### Produkce (Cloudflare)

Spusťte postupně (každý příkaz se zeptá na hodnotu):

```bash
echo "váš-client-id" | npx wrangler secret put GMAIL_CLIENT_ID
echo "váš-client-secret" | npx wrangler secret put GMAIL_CLIENT_SECRET
echo "váš-refresh-token" | npx wrangler secret put GMAIL_REFRESH_TOKEN
```

Pak nasaďte:

```bash
npm run build
npx wrangler deploy
```

---

## Životnost refresh tokenu

| Situace | Platnost |
|---------|----------|
| App v Production, token se pravidelně používá | Nevyprší |
| Token nepoužit 6 měsíců | Expiruje |
| Změna hesla Google účtu | Expiruje |
| Ruční odebrání přístupu v Google účtu | Expiruje |

Pokud token expiruje, e-maily přestanou tiše chodit (chyba se zapíše do Cloudflare Logs).
Oprava: zopakujte Krok 4 a nastavte nový refresh token (Krok 5).

Stav chyb: **Cloudflare Dashboard → Workers & Pages → web-sokol-kramolna → Logs**
