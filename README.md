# 할 일 앱 설정

## API 키를 GitHub에 올리지 않는 방법

1. `firebase-config.example.js`를 복사해서 `firebase-config.js`로 만듭니다.
2. Firebase 콘솔 값을 `firebase-config.js`에 넣습니다.
3. `firebase-config.js`는 `.gitignore`에 있어서 **GitHub에 올라가지 않습니다.**

## 실행

이 폴더에서 Live Server로 `index.html`을 여세요.  
(`file://`로 열면 모듈 로드가 실패할 수 있습니다.)

## 보안 참고

- 예전에 GitHub에 키가 올라간 적이 있다면 Firebase/Google Cloud에서 **API 키 재발급**과 **HTTP 리퍼러 제한**을 권장합니다.
- Realtime Database 규칙을 테스트용 `read/write: true`로 두지 마세요.
