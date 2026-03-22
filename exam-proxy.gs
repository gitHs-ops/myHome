// ============================================================
//  시험지 생성 프록시 — Google Apps Script
//  설정 방법:
//  1. https://script.google.com 접속 → 새 프로젝트 생성
//  2. 이 코드 전체 붙여넣기
//  3. ANTHROPIC_API_KEY 값을 본인 API 키로 교체
//  4. 배포 → 새 배포 → 웹 앱
//     - 다음 사용자로 실행: 나(본인)
//     - 액세스 권한: 모든 사용자(익명 포함)
//  5. 배포 URL 복사 → exam_generator.html의 EXAM_PROXY_URL에 붙여넣기
// ============================================================

// ★ 여기에 Anthropic API 키 입력 ★
const ANTHROPIC_API_KEY = "sk-ant-여기에_키_입력";

// CORS 헤더
function setCorsHeaders(output) {
  output.setHeader("Access-Control-Allow-Origin", "*");
  output.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  output.setHeader("Access-Control-Allow-Headers", "Content-Type");
  return output;
}

// OPTIONS 프리플라이트
function doOptions(e) {
  return setCorsHeaders(
    ContentService.createTextOutput("")
  ).setMimeType(ContentService.MimeType.TEXT);
}

// POST 요청 처리 — 클라이언트가 보낸 prompt를 Claude API에 중계
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const prompt = body.prompt || "";
    const maxTokens = body.max_tokens || 5000;

    const response = UrlFetchApp.fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      payload: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }]
      }),
      muteHttpExceptions: true
    });

    const result = JSON.parse(response.getContentText());

    // content 배열에서 텍스트만 추출
    let text = "";
    if (result.content) {
      result.content.forEach(b => { if (b.type === "text") text += b.text; });
    }

    return setCorsHeaders(
      ContentService.createTextOutput(JSON.stringify({ text: text }))
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return setCorsHeaders(
      ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// GET 요청 — 프록시 동작 확인용
function doGet(e) {
  return setCorsHeaders(
    ContentService.createTextOutput(JSON.stringify({
      status: "ok",
      message: "시험지 생성 프록시 정상 작동 중"
    }))
  ).setMimeType(ContentService.MimeType.JSON);
}
