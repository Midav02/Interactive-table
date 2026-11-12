# Электронный журнал и КТП — ПК, Android и браузер

Проект на React + Vite. Один интерфейс собирается тремя способами:

| Где работает | Тип приложения | Как получить |
|---|---|---|
| Windows 10/11 | Установщик и Portable `.exe` | Actions → Build Windows EXE and Android APK → Artifacts |
| Android | Установочный `.apk` (debug) | Actions → Build Windows EXE and Android APK → Artifacts |
| Любой браузер / iPhone | PWA-сайт | GitHub Pages, установить через меню браузера |

**Важно:** данные классов и оценок сохраняются отдельно на каждом устройстве (`localStorage`). GitHub не синхронизирует журнал между компьютером и телефоном. Не удаляйте данные браузера или приложение без резервной копии. Debug APK предназначен для личного тестирования; для Google Play потребуется подписанная release/AAB-сборка.

## 1. Первый запуск на ПК

Установите Node.js **22** и Git. Откройте терминал в папке проекта:

```bash
npm install --legacy-peer-deps
npm run dev
```

Откройте `http://localhost:3000`.

Первый `npm install` создаст **новый** `package-lock.json`. Старый lock-файл удалён из исправленного архива, потому что в зависимости добавлены Electron и electron-builder. После успешной локальной установки можно добавить новый `package-lock.json` в репозиторий (для повторяемых сборок).

## 2. Публикация на GitHub (обязательно все файлы)

1. Создайте репозиторий `school-journal` на https://github.com/new и выберите основную ветку `main`.
2. Распакуйте исправленный ZIP. Загрузите **содержимое папки проекта** в корень репозитория (не сам ZIP). Убедитесь, что есть скрытая папка `.github/workflows` и файлы `package.json`, `vite.config.ts`, `android/`, `electron/`.
3. Надежнее всего использовать GitHub Desktop: File → Add local repository (если папка еще не репозиторий — Create a repository here), Commit to main → Publish repository. Или используйте Git:

   ```bash
   git init
   git add .
   git commit -m "Fix app builds"
   git branch -M main
   git remote add origin https://github.com/ВАШ_ЛОГИН/school-journal.git
   git push -u origin main
   ```

   Если обновляете **существующий** репозиторий, замените в нём соответствующие файлы, затем `git add .`, `git commit`, `git push`; **не выполняйте повторно `git init`/`remote add origin`**.
4. В GitHub: **Settings → Pages → Build and deployment → Source → GitHub Actions**.
5. Вкладка **Actions**: дождитесь зеленых галочек у `Publish website (GitHub Pages)` и `Build Windows EXE and Android APK`. Для ручного запуска: выбрать workflow → **Run workflow** → main → Run workflow.

## 3. Установка

### Windows

GitHub → **Actions → Build Windows EXE and Android APK → последний успешный запуск → Artifacts → SchoolJournal-Windows-EXE**. Архив со сборкой содержит `SchoolJournal-Setup-1.0.0.exe` и `SchoolJournal-Portable-1.0.0.exe` (установщик и версия без установки). Без цифровой подписи Windows SmartScreen может запросить дополнительное подтверждение.

### Android

Там же скачайте **SchoolJournal-Android-APK**, распакуйте ZIP на телефоне и откройте `app-debug.apk`. Android может предложить разрешить установку из выбранного источника. Такой APK не является релизом для Google Play. Для личного использования и тестирования его достаточно.

### Веб и iPhone

Перейдите по `https://ВАШ_ЛОГИН.github.io/school-journal/` (замените логин и название репозитория). Chrome / Edge на Windows и Android: через меню **Установить приложение** или **Добавить на главный экран**, если браузер предлагает. iPhone: Safari → Поделиться → На экран «Домой».

## 4. Релизы (при желании)

Обычные изменения кода доступны через **Actions → Artifacts** (артефакты хранятся ограниченное время). Для постоянной ссылки **Releases** создайте тег версии:

```bash
git tag v1.0.0
git push origin v1.0.0
```

После успешной сборки `.exe` и `.apk` появятся в разделе **Releases**. GitHub Actions используется бесплатно в пределах лимитов вашего тарифа.

## 5. Сборка на компьютере разработчика

```bash
npm run build          # сайт + PWA, результат: dist/
npm run electron:build # только Windows: .exe -> release_build/
npm run android:sync   # сайт в Android WebView -> android/
```

Для локальной сборки APK установите Android Studio, Android SDK 35, JDK 21 и Gradle 8.13. В Android Studio откройте папку `android/` как проект и выполните сборку. На CI используется Gradle 8.13 непосредственно (в исходном ZIP не было файлов Gradle Wrapper).

## 6. Если GitHub Actions показывает ошибку

- **`Could not find ... package-lock.json`** — используйте `npm install` (в новых workflows уже исправлено), затем закоммитьте сгенерированный lock-файл.
- **`Minimum supported Gradle version is 8.13`** — убедитесь, что загружены новые `build-all-apps.yml` и `android/gradle/wrapper/gradle-wrapper.properties`.
- **`Module not found: electron-builder`** — проверьте `devDependencies` в `package.json` и выполнение `npm install`.
- **`Resource not accessible by integration`** в Release — разрешите **Settings → Actions → General → Workflow permissions → Read and write permissions** (если репозиторий требует); для простого билда менять разрешения не требуется.
- **Красный Pages**, но зелёные EXE/APK — настройте **Settings → Pages → Source: GitHub Actions** и проверьте `Pages`.
- **Белый экран** — проверьте, что загрузили `index.html`, `vite.config.ts`, `public/`, `src/` и что вы используете исправленную сборку с относительными путями.

Если проблема остается, откройте неуспешный запуск → красный шаг → скопируйте **первые строки настоящей ошибки** (не только последнее `Process completed with exit code 1`).
