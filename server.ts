import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

// Initialize Gemini Client
const getGeminiClient = (customApiKey?: string) => {
  let apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API Key가 설정되지 않았습니다. 랜딩 페이지 또는 환경 변수(GEMINI_API_KEY)에 유효한 API Key를 등록해 주십시오.");
  }
  apiKey = apiKey.trim();
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

// Helper to parse Gemini API errors into a user-friendly message
function parseGeminiError(error: any): string {
  if (!error) return "API Key 검증에 실패했습니다. 입력값을 확인해 주세요.";
  
  // Convert entire error object to a string for robust matching of code/message properties
  let errorStr = "";
  try {
    errorStr = typeof error === 'object' ? JSON.stringify(error) : String(error);
  } catch (e) {
    errorStr = String(error);
  }

  const message = error.message || "";
  const combined = (errorStr + " " + message + " " + String(error)).toLowerCase();

  if (
    combined.includes("api key not valid") || 
    combined.includes("invalid_argument") || 
    combined.includes("api_key_invalid") ||
    combined.includes("key_invalid") ||
    combined.includes("not valid")
  ) {
    return "입력하신 Gemini API Key가 유효하지 않거나 만료되었습니다. Google AI Studio에서 발급받은 올바른 키 형식(AIzaSy...)을 정확히 입력해 주십시오.";
  }

  if (combined.includes("quota") || combined.includes("rate limit") || combined.includes("resource_exhausted")) {
    return "Gemini API 호출 한도가 초과되었습니다. 잠시 후 다시 시도하시거나 다른 API Key를 사용해 주세요.";
  }

  if (combined.includes("model not found") || combined.includes("not_found")) {
    return "요청한 인공지능 모델(gemini-3.5-flash)을 찾을 수 없거나 해당 키로 접근할 수 없습니다.";
  }

  return error.message || "API Key 검증 도중 오류가 발생했습니다. 입력값을 다시 확인해 주세요.";
}

// API Endpoint for Key Verification
app.post("/api/verify-key", async (req, res) => {
  try {
    const { customApiKey } = req.body;
    let apiKey = customApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: "검증할 Gemini API Key가 입력되지 않았습니다." });
    }
    apiKey = apiKey.trim();

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    // Run a tiny check to ensure the key actually works
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "API key validation check. Simply reply 'OK'.",
    });

    if (response.text) {
      return res.json({ success: true, message: "Gemini API Key 검증 완료! 분석 엔진 사용이 가능합니다." });
    } else {
      return res.status(400).json({ error: "API 연결은 성공했으나 예기치 않은 응답이 반환되었습니다." });
    }
  } catch (error: any) {
    console.error("Key verification error:", error);
    const friendlyMessage = parseGeminiError(error);
    return res.status(400).json({ error: friendlyMessage });
  }
});

// API Endpoint for Safety Review
app.post("/api/safety-review", async (req, res) => {
  try {
    const { answers, documentText, customApiKey } = req.body;
    
    if (!answers || !Array.isArray(answers) || answers.length < 5) {
      return res.status(400).json({ error: "모든 5가지 질문에 대한 답변이 필요합니다." });
    }

    const ai = getGeminiClient(customApiKey);

    // 5 questions
    const q1 = answers[0] || "미지정";
    const q2 = answers[1] || "미지정";
    const q3 = answers[2] || "미지정";
    const q4 = answers[3] || "미지정";
    const q5 = answers[4] || "미지정";

    const documentContent = documentText ? documentText.trim() : "";

    const systemInstruction = `당신은 국제 기계 안전 표준(ISO 12100, ISO 13849, IEC 60204 등) 및 CE 마크·위험성 평가 지침에 대한 구조화된 검토 절차를 수행하는 "기계 안전 표준 Q&A 도우미"다.
전문성은 "표준 문서와 절차를 근거로 체계적으로 분석하는 것"으로 표현하며, 스스로를 "완벽히 마스터한 전문가"로 소개하지 않는다. 확신에 찬 어조보다 근거 수준을 항상 명시하는 태도를 유지한다.

# 가장 중요한 원칙 — 안전 관련 수치·조항 환각 금지
- 안전거리, 힘, 시간, PL(Performance Level)/PLr, 회로 카테고리 등급 등 정량적 기준값과 구체적 조항 번호는 사용자가 실제로 제공한 표준 문서(붙여넣은 텍스트 또는 업로드 파일)에서만 추출해서 인용한다. 문서가 제공되지 않았거나 해당 내용이 문서에 없으면, 절대로 수치나 조항 번호를 지어내지 않고 "제공된 문서에서 해당 수치를 확인할 수 없습니다. 원문 조항 [예: ISO 13849-1 표 XX]을 직접 확인하시거나 문서를 공유해 주세요"라고 답한다.
- 일반적으로 알려진 개념 설명(예: "PL은 카테고리, MTTFd, DC 등으로 결정된다")은 가능하지만, 이는 "일반 지식 수준의 설명"이며 "이 문서 원문 인용"이 아님을 구분해서 표시한다.
- 규격 원문을 사용자가 붙여넣은 경우, 15단어 이상을 그대로 인용하지 않고 요약·재구성해서 설명한다 (저작권 보호).

# 확신 표현 제한
- "완벽하게", "100% 매칭", "100% 반영", "확실합니다", "이것으로 충분합니다", "구글 평점 X 이상" 같은 신뢰도 표현을 사용하지 않는다.
- 대신 "제공된 문서 기준으로는", "일반적으로 알려진 기준으로는", "검증이 필요합니다" 등 근거 출처를 구분하는 표현을 사용한다.

# 톤
- 전문적이고 신뢰감 있는 어조를 유지한다. "초개인화", "취향저격", "꿀팁", "로망 실현" 같은 라이프스타일/마케팅성 표현이나 주제와 무관한 이모지는 사용하지 않는다. 질문을 이어가는 도입부는 친절하되 담백하게 작성한다.

# 출력 형식 (아래 포맷과 헤더 타이틀 명칭을 100% 완벽히 보존하십시오)
# [규격명] 기계 안전 표준 기술 검토 결과

## 1. 검토 대상 요약
- **대상 기계 및 규격**: [기계 종류] / [선택한 규격]
- **핵심 과제 요약**: (5가지 답변 기반 요약)

## 2. 조항별 기술 검토
### 핵심 검토: [질문 내용 기반 주제]
- **요구사항 분석**: 문서 근거가 있는 경우만 정량값 명시. 없으면 "일반 개념 설명(비검증)"이라고 표시
- **실무 체크포인트**: 설계/도면 검토 시 확인할 항목
- **인증 대응 참고사항**: 심사 시 흔히 지적되는 일반적 포인트 (단정적 "합격 기준"으로 서술하지 않음)

## 3. 실전 참고사항
1. (규격·기계 종류에 맞춘 일반적 참고사항)
2. (설계 검토 시 체크할 사항)
3. (질문한 과제와 관련된 참고 방향)

## 4. 근거 출처 구분
- **문서 근거**: [사용자 제공 문서의 페이지/조항, 있는 경우만]
- **일반 지식 기반 설명(비검증)**: [문서 근거 없이 일반적으로 알려진 개념]

## 5. 면책 고지
"본 검토 결과는 AI가 생성한 참고 자료이며, 실제 설계·인증 제출 문서로 사용하기 전에 반드시 공인 인증기관 및 사내 안전 전문가의 검토를 거쳐야 합니다. 특히 정량적 수치 기준과 조항 해석은 원문 표준과 대조하여 재확인하시기 바랍니다."

# 절대 하지 말 것
- 사용자가 제공하지 않은 정량값(거리, 힘, 시간, PLr 등급 등)이나 조항 번호를 지어내지 않는다.
- "완벽하게", "100%", "구글 평점 X" 같은 과신/무관 표현을 쓰지 않는다.
- 표준 원문을 15단어 이상 그대로 인용하지 않는다.
- 이 검토 결과를 "최종 인증 서류" 또는 "합격 보장"으로 표현하지 않는다.
- 라이프스타일성 표현(초개인화, 취향저격, 꿀팁 등)이나 주제와 무관한 이모지를 쓰지 않는다.`;

    const userPrompt = `
사용자가 제시한 5가지 핵심 답변 정보:
1. 핵심 기계 표준 규격이나 지침: ${q1}
2. 기계의 종류/유형: ${q2}
3. 가장 시급한 과제: ${q3}
4. 답변에서 우선하는 정보 형태: ${q4}
5. 검토가 필요한 표준 문서 제출 여부: ${q5}

[사용자가 직접 제공한 안전 표준 문서 원문 시작]
${documentContent ? documentContent : "(사용자가 직접 업로드한 안전 표준 문서 내용이 비어있거나 없습니다. 질문 5-3 상황이므로 일반 개념 위주로 설명하고, 정량값이나 조항번호는 절대로 새로 지어내지 마십시오.)"}
[사용자가 직접 제공한 안전 표준 문서 원문 끝]

위의 5가지 수집된 답변 조건과 사용자가 직접 전달한 안전 표준 문서 텍스트(있는 경우)를 종합적으로 분석하고, 기재된 모든 "가장 중요한 원칙" 및 "출력 형식"에 맞춰 '기계 안전 표준 기술 검토 결과'를 작성해 주십시오.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.1,
      }
    });

    res.json({ result: response.text });
  } catch (error: any) {
    console.error("Safety Review API Error:", error);
    const friendlyMessage = parseGeminiError(error);
    res.status(500).json({ error: friendlyMessage });
  }
});

// Serve static assets and Vite middleware
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
