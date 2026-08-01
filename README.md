# 할 일 앱

Firebase Realtime Database를 쓰는 할 일 웹앱입니다.

## 실행 / 배포

- `index.html`을 열거나 GitHub Pages 등으로 배포하면 됩니다.
- Firebase 설정은 `firebase-config.js`에 있습니다. (배포에 포함됨)

## 보안 (중요)

Firebase **웹용 apiKey**는 클라이언트에 들어가는 값이므로, 코드/배포에 보일 수 있습니다.  
실사용 전에 아래를 꼭 설정하세요.

1. **Realtime Database 규칙**  
   - Firebase Console → Realtime Database → Rules  
   - 테스트가 끝나면 `".read": true, ".write": true` 를 끄고, 필요한 범위만 허용

2. **API 키 제한**  
   - Google Cloud Console → API 및 서비스 → 사용자 인증 정보  
   - 해당 브라우저 키 → 애플리케이션 제한사항 → HTTP 리퍼러  
   - 예: `http://localhost/*`, `https://내아이디.github.io/*`

GitHub Secret scanning 메일이 올 수 있지만, 웹용 Firebase apiKey에서는 흔합니다.  
위 제한/규칙이 보안의 핵심입니다.
