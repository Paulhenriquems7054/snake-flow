Passos para gerar APK (Android) a partir deste projeto Vite + Capacitor

1) Preparação
- Garanta que você tem Java (JDK), Android SDK e Android Studio instalados.
- Node.js e npm instalados.

2) Build web
- Rode: `npm run build` (gera `dist/`)

3) Inicializar/atualizar Capacitor (apenas se ainda não tiver feito)
- Opcional: `npm run cap:init` (ou `npx cap init com.snakeflow SnakeFlow --web-dir=dist`)
- Adicionar Android (uma vez): `npm run cap:add:android` (ou `npx cap add android`)

4) Copiar web assets e abrir Android Studio
- `npm run cap:copy` (ou `npx cap copy`)
- `npm run cap:open:android` (abre Android Studio)

5) No Android Studio
- Ajuste `appId` (se necessário) em `android/app/src/main/AndroidManifest.xml` / build.gradle.
- Forneça ícones (mipmap) e splash screen nas pastas `android/app/src/main/res/*`.
- Configurar assinatura (keystore) e gerar build release.
- Teste em dispositivo real e emulador.

6) Observações importantes sobre o projeto
- `public/` deve conter os arquivos de áudio com nomes sem espaços/acentos (ex: `come-fruta.mp3`, `perde-a-fase.mp3`, `muda-de-fase.mp3`).
- Verifique `src/utils/audioManager.ts` para que as rotas coincidam com os nomes finais dos arquivos.
- Se precisar de áudio com baixa latência no Android, considere plugin nativo em vez do HTMLAudio.

Se quiser, eu posso:
- Atualizar `src/utils/audioManager.ts` para nomes sem espaços (me diga os nomes exatos ou autorize um padrão: `come-fruta.mp3`, `perde-a-fase.mp3`, `muda-de-fase.mp3`, `musica.mp3`, `muda-de-opcao.mp3`).
- Gerar scripts extras ou ajustar outros arquivos (ícones, splash, manifest).
