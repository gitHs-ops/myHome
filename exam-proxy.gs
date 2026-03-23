// ============================================================
//  시험지 생성 프록시 — Google Apps Script (청크 방식)
//  ver1.8 — 토큰 사용량 반환 추가 (usage 포함)
//  ★ Apps Script에 붙여넣고 새 버전으로 재배포
// ============================================================

const ANTHROPIC_API_KEY = "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";

function doGet(e) {
  try {
    const action = e.parameter.action || "";
    const props = PropertiesService.getScriptProperties();

    // ── save: 프롬프트 청크 저장 ──
    if (action === "save") {
      const job   = e.parameter.job   || "";
      const idx   = e.parameter.idx   || "0";
      const total = e.parameter.total || "1";
      const data  = e.parameter.data  || "";
      props.setProperty("job_" + job + "_" + idx, data);
      props.setProperty("job_" + job + "_total", total);
      return ContentService
        .createTextOutput(JSON.stringify({ ok: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ── run: 청크 조합 후 Claude 호출 ──
    if (action === "run") {
      const job   = e.parameter.job || "";
      const total = parseInt(props.getProperty("job_" + job + "_total") || "0");
      let prompt  = "";
      for (let i = 0; i < total; i++) {
        prompt += props.getProperty("job_" + job + "_" + i) || "";
        props.deleteProperty("job_" + job + "_" + i);
      }
      props.deleteProperty("job_" + job + "_total");

      if (!prompt) {
        return ContentService
          .createTextOutput(JSON.stringify({ error: "prompt not found" }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      const response = UrlFetchApp.fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01"
        },
        payload: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 5000,
          messages: [{ role: "user", content: prompt }]
        }),
        muteHttpExceptions: true
      });

      const result = JSON.parse(response.getContentText());
      let text = "";
      if (result.content) {
        result.content.forEach(function(b) {
          if (b.type === "text") text += b.text;
        });
      }
      return ContentService
        .createTextOutput(JSON.stringify({ text: text }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ── prompt: 직접 Claude 호출 (exam_generator.html 호환) ──
    if (e.parameter.prompt) {
      const prompt = e.parameter.prompt;
      const response = UrlFetchApp.fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01"
        },
        payload: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 5000,
          messages: [{ role: "user", content: prompt }]
        }),
        muteHttpExceptions: true
      });
      const result = JSON.parse(response.getContentText());
      let text = "";
      if (result.content) {
        result.content.forEach(function(b) {
          if (b.type === "text") text += b.text;
        });
      }
      return ContentService
        .createTextOutput(JSON.stringify({
          text: text,
          usage: result.usage || null,
          error: result.error ? result.error.message : null
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ── 기본: 동작 확인 ──
    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok", message: "시험지 프록시 정상 작동 중" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
