// ============================================================
//  사쿠라 브리핑 프록시 — Google Apps Script
//  설정 방법:
//  1. https://script.google.com 접속 → 새 프로젝트 생성
//  2. 이 코드 전체를 붙여넣기
//  3. ANTHROPIC_API_KEY 값을 본인 API 키로 교체
//  4. 배포 → 새 배포 → 웹 앱
//     - 다음 사용자로 실행: 나(본인)
//     - 액세스 권한: 모든 사용자(익명 포함)
//  5. 배포 URL 복사 → HTML의 PROXY_URL에 붙여넣기
// ============================================================

// ★ 여기에 Anthropic API 키 입력 ★
const ANTHROPIC_API_KEY = "sk-ant-여기에_키_입력";

// CORS 허용 헤더
function setCorsHeaders(output) {
  output.setHeader("Access-Control-Allow-Origin", "*");
  output.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  output.setHeader("Access-Control-Allow-Headers", "Content-Type");
  return output;
}

// OPTIONS 프리플라이트 처리
function doOptions(e) {
  return setCorsHeaders(
    ContentService.createTextOutput("")
  ).setMimeType(ContentService.MimeType.TEXT);
}

// GET 요청 → 브리핑 데이터 반환
function doGet(e) {
  return handleBriefing();
}

// POST 요청도 동일하게 처리
function doPost(e) {
  return handleBriefing();
}

function handleBriefing() {
  try {
    const today = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy년 M월 d일 (E요일)");
    
    const prompt = `오늘은 ${today}입니다. 포항시 기준 데일리 브리핑을 아래 JSON 구조 그대로만 반환하세요.
JSON 외 다른 텍스트, 마크다운 코드블록 없이 순수 JSON만 응답하세요.

{
  "weather": {
    "temp": "현재기온(숫자만)",
    "condition": "날씨상태",
    "high": "최고기온",
    "low": "최저기온", 
    "rain": "강수확률(숫자만)",
    "wind": "풍향 풍속",
    "summary": "포항 오늘 날씨 한 줄 요약"
  },
  "stocks": [
    {"name": "코스피",  "value": "지수", "change": "등락%", "dir": "up또는down"},
    {"name": "코스닥",  "value": "지수", "change": "등락%", "dir": "up또는down"},
    {"name": "나스닥",  "value": "지수", "change": "등락%", "dir": "up또는down"},
    {"name": "S&P 500", "value": "지수", "change": "등락%", "dir": "up또는down"}
  ],
  "issues": [
    {
      "emoji": "이모지",
      "title": "이슈 제목",
      "desc": "2~3줄 요약",
      "link": "관련 뉴스 URL",
      "linkText": "링크 텍스트"
    }
  ]
}

실제 오늘 날짜 기준 최신 데이터로 채워주세요.
- 날씨: 포항시 오늘 실제 예보
- 증시: 전일 마감 기준 실제 지수
- issues: 오늘 주요 뉴스 3건 (미·이란 전쟁, 증시, 기타 경제 이슈)`;

    // Anthropic API 호출 (web_search 포함)
    const payload = {
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [{ role: "user", content: prompt }]
    };

    const options = {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch("https://api.anthropic.com/v1/messages", options);
    const data = JSON.parse(response.getContentText());

    // content 블록에서 text 추출
    let raw = "";
    if (data.content) {
      data.content.forEach(block => {
        if (block.type === "text") raw += block.text;
      });
    }

    // JSON 파싱
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("JSON not found in response");
    
    const briefing = JSON.parse(jsonMatch[0]);
    briefing.generated = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy.MM.dd HH:mm");

    const output = ContentService
      .createTextOutput(JSON.stringify(briefing))
      .setMimeType(ContentService.MimeType.JSON);
    
    return setCorsHeaders(output);

  } catch (err) {
    const errorOutput = ContentService
      .createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
    
    return setCorsHeaders(errorOutput);
  }
