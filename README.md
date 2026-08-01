# 할 일 앱 — 매일 쓰는 방법

## 한 번만 하면 됨

1. 이 폴더에 `firebase-config.js`가 있어야 합니다. (지금 있으면 OK)
2. 없으면 `firebase-config.example.js`를 복사해 `firebase-config.js`로 만들고 Firebase 값을 넣습니다.
3. `firebase-config.js`는 GitHub에 올리지 마세요. (이미 `.gitignore` 처리됨)

## 매번 실행

1. Cursor/VS Code에서 **`vibe coding test 3` 폴더**를 연다  
2. `index.html`에서 **Live Server**로 연다  
3. 브라우저에서 바로 추가/체크하면 된다  

> 상위 폴더(`바이브 코딩 test`)에서 Live Server를 켜면  
> config 파일을 못 찾아 오류가 날 수 있습니다. **이 프로젝트 폴더에서** 여세요.

## GitHub에 올릴 때

- `firebase-config.js`는 올리지 않음 → API 키 노출 메일 방지
- `app.js`, `index.html`, `styles.css` 등만 올리면 됨
