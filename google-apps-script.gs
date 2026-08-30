/**
 * Zápis RSVP odpovědí z webu do Google Sheets.
 *
 * NASTAVENÍ (cca 5 minut):
 * 1. Vytvoř nový Google Sheet, do prvního řádku napiš záhlaví sloupců:
 *    Čas | Jméno | Počet osob | Účast | Přespání | Poznámka
 * 2. V tabulce: Rozšíření > Apps Script.
 * 3. Smaž vygenerovaný obsah a vlož místo něj celý tento soubor.
 * 4. Nasadit > Nové nasazení > vyber typ "Webová aplikace".
 *    - Spustit jako: Já
 *    - Kdo má přístup: Kdokoli
 * 5. Autorizuj přístup (je to tvůj vlastní skript nad tvou vlastní tabulkou)
 *    a zkopíruj URL webové aplikace, která se zobrazí.
 * 6. Vlož tuto URL jako hodnotu GOOGLE_SHEETS_ENDPOINT v souboru js/script.js.
 *
 * Pozn.: Pokud tabulku později přejmenuješ nebo přesuneš, endpoint funguje dál -
 * skript vždy zapisuje do aktivního listu tabulky, ke které je připojený.
 */
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = JSON.parse(e.postData.contents);

  sheet.appendRow([
    new Date(),
    data.name || '',
    data.count || '',
    data.attending || '',
    data.sleep || '',
    data.note || '',
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}
