import React, { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { 
  ArrowLeft, 
  ArrowRight, 
  RotateCcw, 
  FileText, 
  Check, 
  Loader2, 
  Upload, 
  ShieldAlert, 
  AlertCircle,
  HelpCircle,
  Settings,
  BookOpen,
  ChevronRight,
  Clipboard,
  FileCheck,
  Cpu,
  Info,
  Layers,
  Sparkles,
  Search,
  CheckCircle2,
  Lock,
  Unlock,
  ExternalLink,
  Shield,
  FileSpreadsheet,
  Layers3,
  FlameKindling,
  Terminal,
  Activity,
  CheckSquare
} from "lucide-react";

// Questions and Options Constants
const QUESTIONS = [
  {
    id: 1,
    title: "검토가 필요하신 핵심 기계 표준 규격이나 지침은 무엇인가요?",
    shortTitle: "표준 규격",
    options: [
      "ISO 12100 (기계 안전 - 설계 일반 원칙 및 위험성 평가)",
      "ISO 13849-1/-2 (제어 시스템의 안전 관련 부품 - SRP/CS, PL 계산)",
      "IEC 60204-1 (기계의 전기 장비 및 전기 안전 규격)",
      "유럽 CE 기계 지침(Machinery Regulation) 및 형식 인증",
      "ISO 4413 / ISO 4414 (유압 및 공압 유체 동력 시스템 안전 규격)",
      "국내 KCs 자율안전확인신고 및 안전인증 기준"
    ],
    placeholder: "예: SEMI S2, ISO 10218-1 등 다른 규격을 직접 입력해 주세요."
  },
  {
    id: 2,
    title: "현재 검토 중이거나 설계 중인 기계의 종류/유형은 무엇인가요?",
    shortTitle: "기계 종류",
    options: [
      "산업용 로봇 및 자동화 셀 시스템 (협동로봇 포함)",
      "공작기계 및 금속 가공 기계 (선반, 밀링, 프레스 등)",
      "물류 이송 및 하역 기계 (컨베이어, 크레인, AGV/AMR 등)",
      "화학, 식품 및 포장 공정용 자동화 기계",
      "반도체 및 디스플레이 제조 장비 (SEMI 규격 연계)",
      "사출 성형기 및 고무/플라스틱 가공 기계"
    ],
    placeholder: "기타 기계 종류 및 상세 용도를 입력해 주세요."
  },
  {
    id: 3,
    title: "이번 검토를 통해 해결하고자 하는 가장 시급한 과제는 무엇인가요?",
    shortTitle: "시급한 과제",
    options: [
      "설계 단계에서의 본질적 안전 조치 및 안전거리(치수) 기준 확보",
      "안전 제어 회로 설계 및 목표 성능수준(PLr) 만족 여부 검증",
      "해외 인증(CE 등) 기술문서(TCF) 및 위험성 평가서 작성",
      "심사/인증 과정에서 발생한 부적합 사항 분석 및 재작업 방지",
      "인터록 및 안전장치(가드, 라이트커튼) 선정 기준 파악",
      "실무자 간 규격 해석 차이로 인한 조율 및 표준화"
    ],
    placeholder: "해결하고자 하는 시급한 과제를 직접 작성해 주세요."
  },
  {
    id: 4,
    title: "답변에서 어떤 형태의 정보를 우선하시나요?",
    shortTitle: "선호 정보",
    options: [
      "규격서에 명시된 정량적 수치 기준 (단, 실제 제공 문서 근거가 있을 때만 제시됨)",
      "규격 조항 원문의 출처(장/절) 명시",
      "실무 체크리스트 형태",
      "심사/합격 판정 기준에 대한 일반적 가이드",
      "핵심 개념 위주의 압축 요약",
      "용어 정의 가이드"
    ],
    placeholder: "원하는 정보 형태를 직접 입력해 주세요."
  },
  {
    id: 5,
    title: "실제로 검토가 필요한 표준 문서(원문 일부 또는 파일)를 제공해 주실 수 있나요?",
    shortTitle: "표준 문서 제공",
    options: [
      "지금 텍스트로 붙여넣겠습니다.",
      "파일로 업로드하겠습니다.",
      "문서 없이 일반적인 개념 설명만 받고 싶습니다."
    ],
    placeholder: "기타 상황 및 요구사항을 입력해 주세요."
  }
];

export default function App() {
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [answers, setAnswers] = useState<string[]>(["", "", "", "", ""]);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [customInputValue, setCustomInputValue] = useState<string>("");
  
  // States for step 5 document input
  const [documentText, setDocumentText] = useState<string>("");
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Loading and Result States
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Gemini API Key States
  const [customApiKey, setCustomApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem("gemini_custom_api_key") || "";
    } catch {
      return "";
    }
  });
  const [isKeyVerified, setIsKeyVerified] = useState<boolean>(() => {
    try {
      return localStorage.getItem("gemini_custom_api_key_verified") === "true";
    } catch {
      return false;
    }
  });
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationMessage, setVerificationMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showKeyInput, setShowKeyInput] = useState<boolean>(false);

  // Verification Helper
  const handleVerifyKey = async () => {
    if (!customApiKey.trim()) {
      setVerificationMessage({ type: "error", text: "API Key를 입력해 주십시오." });
      return;
    }
    setIsVerifying(true);
    setVerificationMessage(null);
    try {
      // 1. Try backend verification first
      const response = await fetch("/api/verify-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ customApiKey })
      });
      
      // If we got a successful response from the server, handle it
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setIsKeyVerified(true);
          localStorage.setItem("gemini_custom_api_key", customApiKey);
          localStorage.setItem("gemini_custom_api_key_verified", "true");
          setVerificationMessage({ type: "success", text: data.message });
          setIsVerifying(false);
          return;
        } else {
          setIsKeyVerified(false);
          setVerificationMessage({ type: "error", text: data.error || "API Key 검증에 실패했습니다." });
          setIsVerifying(false);
          return;
        }
      }
      
      // If response is not ok (e.g. 404 or other server issues), fallback to client-side
      throw new Error("Backend unavailable");
    } catch (err: any) {
      console.log("Backend verification unavailable or failed, falling back to client-side direct verification...", err);
      
      // 2. Client-side direct verification fallback
      try {
        const apiKey = customApiKey.trim();
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const directResponse = await fetch(geminiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "API key validation check. Simply reply 'OK'." }] }]
          })
        });
        
        const directData = await directResponse.json();
        
        if (directResponse.ok) {
          setIsKeyVerified(true);
          localStorage.setItem("gemini_custom_api_key", customApiKey);
          localStorage.setItem("gemini_custom_api_key_verified", "true");
          setVerificationMessage({ 
            type: "success", 
            text: "✅ 클라이언트 브라우저 연동 모드로 Gemini API Key 승인 및 검증에 성공했습니다." 
          });
        } else {
          const errMsg = directData?.error?.message || "API Key가 유효하지 않습니다.";
          setIsKeyVerified(false);
          let friendly = errMsg;
          if (
            errMsg.toLowerCase().includes("key not valid") || 
            errMsg.toLowerCase().includes("invalid_argument") || 
            errMsg.toLowerCase().includes("api_key_invalid") ||
            errMsg.toLowerCase().includes("key_invalid") ||
            errMsg.toLowerCase().includes("not valid")
          ) {
            friendly = "입력하신 Gemini API Key가 유효하지 않거나 만료되었습니다. Google AI Studio에서 발급받은 올바른 키 형식(AIzaSy...)을 정확히 입력해 주십시오.";
          }
          setVerificationMessage({ type: "error", text: friendly });
        }
      } catch (directErr: any) {
        setIsKeyVerified(false);
        setVerificationMessage({ 
          type: "error", 
          text: "API Key를 검증할 수 없습니다. 인터넷 연결 및 입력한 키 형식을 다시 확인해 주십시오." 
        });
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClearKey = () => {
    setCustomApiKey("");
    setIsKeyVerified(false);
    setVerificationMessage(null);
    localStorage.removeItem("gemini_custom_api_key");
    localStorage.removeItem("gemini_custom_api_key_verified");
  };

  // Sync index and custom input when step changes
  React.useEffect(() => {
    if (!isStarted) return;
    const savedAnswer = answers[currentStep - 1];
    if (!savedAnswer) {
      setSelectedOptionIndex(null);
      setCustomInputValue("");
      return;
    }

    const currentQuestion = QUESTIONS[currentStep - 1];
    const foundIndex = currentQuestion.options.findIndex(opt => opt === savedAnswer);
    if (foundIndex !== -1) {
      setSelectedOptionIndex(foundIndex);
      setCustomInputValue("");
    } else {
      setSelectedOptionIndex(null);
      setCustomInputValue(savedAnswer);
    }
  }, [currentStep, answers, isStarted]);

  // Handle Option Card Click
  const handleOptionClick = (index: number) => {
    setSelectedOptionIndex(index);
    setCustomInputValue("");
    
    // Auto-update answer array
    const updated = [...answers];
    updated[currentStep - 1] = QUESTIONS[currentStep - 1].options[index];
    setAnswers(updated);
  };

  // Handle Custom Input Change
  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomInputValue(value);
    setSelectedOptionIndex(null);

    const updated = [...answers];
    updated[currentStep - 1] = value;
    setAnswers(updated);
  };

  // File Upload Helper
  const handleFile = (file: File) => {
    if (!file) return;
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setDocumentText(text);
      
      // Update answers with upload confirmation info
      const updated = [...answers];
      updated[4] = `파일 업로드 완료 (${file.name})`;
      setAnswers(updated);
    };
    reader.onerror = () => {
      setErrorMessage("파일을 읽는 과정에서 오류가 발생했습니다.");
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Handle Navigation - Next
  const handleNext = () => {
    const currentAnswer = answers[currentStep - 1];
    if (!currentAnswer || currentAnswer.trim() === "") {
      alert("답변을 선택하거나 직접 입력해 주세요.");
      return;
    }

    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      triggerAnalysis();
    }
  };

  // Handle Navigation - Prev
  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Submit to Backend API (with robust client-side fallback)
  const triggerAnalysis = async () => {
    setIsLoading(true);
    setErrorMessage("");
    setResult("");
    try {
      // 1. Try to post to Express backend first
      const response = await fetch("/api/safety-review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          answers: answers,
          documentText: documentText,
          customApiKey: customApiKey || undefined
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        setResult(data.result || "결과를 생성할 수 없습니다.");
        setCurrentStep(6); // Step 6 refers to showing Result
        setIsLoading(false);
        return;
      }

      // If backend failed (e.g. 404 or other issues), fallback to direct client-side call
      throw new Error("Backend review service unavailable");
    } catch (err: any) {
      console.log("Backend analysis failed or unavailable, falling back to client-side direct request...", err);
      
      try {
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

        const apiKey = customApiKey.trim();
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const directResponse = await fetch(geminiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: userPrompt }] }],
            systemInstruction: { parts: [{ text: systemInstruction }] },
            generationConfig: {
              temperature: 0.1
            }
          })
        });

        const directData = await directResponse.json();

        if (directResponse.ok) {
          const generatedText = directData?.candidates?.[0]?.content?.parts?.[0]?.text || "결과를 생성할 수 없습니다.";
          setResult(generatedText);
          setCurrentStep(6);
        } else {
          const rawErrMsg = directData?.error?.message || "안전 기술 검토 도중 오류가 발생했습니다.";
          let friendly = rawErrMsg;
          if (
            rawErrMsg.toLowerCase().includes("key not valid") || 
            rawErrMsg.toLowerCase().includes("invalid_argument") || 
            rawErrMsg.toLowerCase().includes("api_key_invalid") ||
            rawErrMsg.toLowerCase().includes("key_invalid") ||
            rawErrMsg.toLowerCase().includes("not valid")
          ) {
            friendly = "입력하신 Gemini API Key가 유효하지 않거나 만료되었습니다. Google AI Studio에서 발급받은 올바른 키 형식(AIzaSy...)을 정확히 입력해 주십시오.";
          }
          throw new Error(friendly);
        }
      } catch (directErr: any) {
        console.error("Direct fallback error:", directErr);
        setErrorMessage(directErr.message || "안전 기술 검토 도중 네트워크 또는 API 호출 오류가 발생했습니다. 인터넷 연결과 API Key의 유효성을 다시 확인해 주세요.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Reset System
  const handleReset = () => {
    setIsStarted(false);
    setCurrentStep(1);
    setAnswers(["", "", "", "", ""]);
    setSelectedOptionIndex(null);
    setCustomInputValue("");
    setDocumentText("");
    setUploadedFileName("");
    setResult("");
    setErrorMessage("");
  };

  // Start the review from landing page
  const handleStartReview = () => {
    if (!isKeyVerified) {
      setVerificationMessage({
        type: "error",
        text: "🚨 기계 안전 분석기(ISO 12100 / IEC 60204-1)를 가동하기 위해서는 승인된 Gemini API Key가 필요합니다. 아래 등록 패널에서 키를 입력하고 검증 단추를 클릭해 주세요."
      });
      setTimeout(() => {
        const element = document.getElementById("gemini-key-panel");
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.classList.add("ring-2", "ring-amber-500", "ring-offset-2", "ring-offset-[#131211]");
          setTimeout(() => {
            element.classList.remove("ring-2", "ring-amber-500", "ring-offset-2", "ring-offset-[#131211]");
          }, 3000);
        }
      }, 100);
      return;
    }
    setIsStarted(true);
    setCurrentStep(1);
  };

  // Copy Result to Clipboard
  const handleCopyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Quick helper to truncate strings nicely
  const truncate = (str: string, max: number = 24) => {
    if (!str) return "선택 대기";
    return str.length > max ? str.substring(0, max) + "..." : str;
  };

  // Calculate current progress percentage
  const progressPercent = !isStarted ? 0 : currentStep === 6 ? 100 : Math.round(((currentStep - 1) / 5) * 100);

  return (
    <div id="app-root" className="min-h-screen flex flex-col bg-drafting-grid text-[#3A3835] font-sans antialiased selection:bg-amber-100 relative overflow-hidden">
      
      {/* Decorative Overlapping Pencil-Sketch Mechanical Gears in the Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.04] mix-blend-multiply z-0">
        {/* Large Gear Left */}
        <svg className="absolute -left-20 -bottom-20 w-96 h-96 text-[#695D4A] animate-gear-cw" viewBox="0 0 100 100" fill="currentColor">
          <path d="M50,35c-8.3,0-15,6.7-15,15s6.7,15,15,15s15-6.7,15-15S58.3,35,50,35z M50,57c-3.9,0-7-3.1-7-7s3.1-7,7-7s7,3.1,7,7S53.9,57,50,57z" />
          <path d="M50,0C46.1,0,43,3.1,43,7v3c-1.8,0.5-3.6,1.2-5.2,2.1l-2.1-2.1c-2.7-2.7-7.2-2.7-10,0s-2.7,7.2,0,10l2.1,2.1C26.8,23.7,26,25.6,25.5,27.5H22c-3.9,0-7,3.1-7,7v0c0,3.9,3.1,7,7,7h3.5c0.5,1.9,1.3,3.8,2.3,5.5l-2.1,2.1c-2.7,2.7-2.7,7.2,0,10s7.2,2.7,10,0l2.1-2.1c1.7,0.9,3.5,1.7,5.4,2.2V78c0,3.9,3.1,7,7,7s7-3.1,7-7v-3.5c1.9-0.5,3.7-1.2,5.4-2.2l2.1,2.1c2.7,2.7,7.2,2.7,10,0s2.7-7.2,0-10l-2.1-2.1c0.9-1.7,1.7-3.5,2.2-5.4H78c3.9,0,7-3.1,7-7s-3.1-7-7-7h-3.5c-0.5-1.9-1.2-3.7-2.2-5.4l2.1-2.1c2.7-2.7,2.7-7.2,0-10s-7.2-2.7-10,0l-2.1,2.1c-1.7-1-3.5-1.7-5.4-2.2V7C57,3.1,53.9,0,50,0z M50,22c15.5,0,28,12.5,28,28S65.5,78,50,78S22,65.5,22,50S34.5,22,50,22z" />
        </svg>
        {/* Small Interlocking Gear */}
        <svg className="absolute -left-8 -bottom-36 w-64 h-64 text-[#695D4A] animate-gear-ccw" viewBox="0 0 100 100" fill="currentColor">
          <path d="M50,35c-8.3,0-15,6.7-15,15s6.7,15,15,15s15-6.7,15-15S58.3,35,50,35z M50,57c-3.9,0-7-3.1-7-7s3.1-7,7-7s7,3.1,7,7S53.9,57,50,57z" />
          <path d="M50,0C46.1,0,43,3.1,43,7v3c-1.8,0.5-3.6,1.2-5.2,2.1l-2.1-2.1c-2.7-2.7-7.2-2.7-10,0s-2.7,7.2,0,10l2.1,2.1C26.8,23.7,26,25.6,25.5,27.5H22c-3.9,0-7,3.1-7,7v0c0,3.9,3.1,7,7,7h3.5c0.5,1.9,1.3,3.8,2.3,5.5l-2.1,2.1c-2.7,2.7-2.7,7.2,0,10s7.2,2.7,10,0l2.1-2.1c1.7,0.9,3.5,1.7,5.4,2.2V78c0,3.9,3.1,7,7,7s7-3.1,7-7v-3.5c1.9-0.5,3.7-1.2,5.4-2.2l2.1,2.1c2.7,2.7,7.2,2.7,10,0s2.7-7.2,0-10l-2.1-2.1c0.9-1.7,1.7-3.5,2.2-5.4H78c3.9,0,7-3.1,7-7s-3.1-7-7-7h-3.5c-0.5-1.9-1.2-3.7-2.2-5.4l2.1-2.1c2.7-2.7,2.7-7.2,0-10s-7.2-2.7-10,0l-2.1,2.1c-1.7-1-3.5-1.7-5.4-2.2V7C57,3.1,53.9,0,50,0z" />
        </svg>
        {/* Medium Gear Middle Right */}
        <svg className="absolute -right-24 top-1/3 w-80 h-80 text-[#695D4A] animate-gear-ccw" viewBox="0 0 100 100" fill="currentColor">
          <path d="M50,35c-8.3,0-15,6.7-15,15s6.7,15,15,15s15-6.7,15-15S58.3,35,50,35z M50,57c-3.9,0-7-3.1-7-7s3.1-7,7-7s7,3.1,7,7S53.9,57,50,57z" />
          <path d="M50,0C46.1,0,43,3.1,43,7v3c-1.8,0.5-3.6,1.2-5.2,2.1l-2.1-2.1c-2.7-2.7-7.2-2.7-10,0s-2.7,7.2,0,10l2.1,2.1C26.8,23.7,26,25.6,25.5,27.5H22c-3.9,0-7,3.1-7,7v0c0,3.9,3.1,7,7,7h3.5c0.5,1.9,1.3,3.8,2.3,5.5l-2.1,2.1c-2.7,2.7-2.7,7.2,0,10s7.2,2.7,10,0l2.1-2.1c1.7,0.9,3.5,1.7,5.4,2.2V78c0,3.9,3.1,7,7,7s7-3.1,7-7v-3.5c1.9-0.5,3.7-1.2,5.4-2.2l2.1,2.1c2.7,2.7,7.2,2.7,10,0s2.7-7.2,0-10l-2.1-2.1c0.9-1.7,1.7-3.5,2.2-5.4H78c3.9,0,7-3.1,7-7s-3.1-7-7-7h-3.5c-0.5-1.9-1.2-3.7-2.2-5.4l2.1-2.1c2.7-2.7,2.7-7.2,0-10s-7.2-2.7-10,0l-2.1,2.1c-1.7-1-3.5-1.7-5.4-2.2V7C57,3.1,53.9,0,50,0z M50,22c15.5,0,28,12.5,28,28S65.5,78,50,78S22,65.5,22,50S34.5,22,50,22z" />
        </svg>
        {/* Giant Gear Top Right */}
        <svg className="absolute -right-36 -top-36 w-[520px] h-[520px] text-[#695D4A] animate-gear-cw" viewBox="0 0 100 100" fill="currentColor">
          <path d="M50,35c-8.3,0-15,6.7-15,15s6.7,15,15,15s15-6.7,15-15S58.3,35,50,35z M50,57c-3.9,0-7-3.1-7-7s3.1-7,7-7s7,3.1,7,7S53.9,57,50,57z" />
          <path d="M50,0C46.1,0,43,3.1,43,7v3c-1.8,0.5-3.6,1.2-5.2,2.1l-2.1-2.1c-2.7-2.7-7.2-2.7-10,0s-2.7,7.2,0,10l2.1,2.1C26.8,23.7,26,25.6,25.5,27.5H22c-3.9,0-7,3.1-7,7v0c0,3.9,3.1,7,7,7h3.5c0.5,1.9,1.3,3.8,2.3,5.5l-2.1,2.1c-2.7,2.7-2.7,7.2,0,10s7.2,2.7,10,0l2.1-2.1c1.7,0.9,3.5,1.7,5.4,2.2V78c0,3.9,3.1,7,7,7s7-3.1,7-7v-3.5c1.9-0.5,3.7-1.2,5.4-2.2l2.1,2.1c2.7,2.7,7.2,2.7,10,0s2.7-7.2,0-10l-2.1-2.1c0.9-1.7,1.7-3.5,2.2-5.4H78c3.9,0,7-3.1,7-7s-3.1-7-7-7h-3.5c-0.5-1.9-1.2-3.7-2.2-5.4l2.1-2.1c2.7-2.7,2.7-7.2,0-10s-7.2-2.7-10,0l-2.1,2.1c-1.7-1-3.5-1.7-5.4-2.2V7C57,3.1,53.9,0,50,0z M50,22c15.5,0,28,12.5,28,28S65.5,78,50,78S22,65.5,22,50S34.5,22,50,22z" />
        </svg>
      </div>

      {/* DRAFTING TITLE BOARD / HEADER */}
      <header id="main-header" className="bg-[#2D2B28] text-[#F7F4EB] px-6 py-4.5 flex flex-col md:flex-row justify-between items-start md:items-center border-b-2 border-[#131211] shadow-md sticky top-0 z-50 tech-frame">
        <div className="flex items-center gap-4 cursor-pointer" onClick={handleReset}>
          <div className="p-2.5 bg-[#B07A43] rounded-lg text-white shadow-md shadow-amber-900/40 flex items-center justify-center border border-[#916233]">
            <Cpu size={22} className="text-[#FCFAF4]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] md:text-xs text-amber-400 font-bold tracking-widest uppercase bg-amber-950/50 px-2 py-0.5 rounded border border-amber-500/20">
                INDUSTRIAL MACHINERY SAFETY
              </span>
            </div>
            <h1 className="text-base sm:text-lg md:text-xl font-bold tracking-tight mt-0.5 flex items-center gap-2 text-[#FCFAF4]">
              기계 안전 표준 Q&A 도우미
              <span className="text-xs font-normal text-amber-200/50 hidden sm:inline">| Engineering Safety Assistant</span>
            </h1>
          </div>
        </div>
        
        <div className="mt-4 md:mt-0 flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-amber-950/50">
          <div className="text-left md:text-right">
            <div className="text-[10px] text-amber-200/40 font-medium uppercase tracking-wide">분석 엔진 버전</div>
            <div className="text-xs font-semibold text-amber-200">ISO/CE Expert v2.4 (Core)</div>
          </div>
          <div className="h-6 w-[1px] bg-amber-950/60 hidden md:block"></div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#1F1E1B] rounded-full border border-[#3A3835]">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="text-xs font-bold text-amber-200/80">표준 문서 검토 엔진 가동 중</span>
          </div>
        </div>
      </header>

      {/* MEASUREMENT SCALED CALIPER / PROGRESS BAR */}
      <div className="w-full h-2 bg-[#E8E2D2] relative border-b border-[#CFC5AD] z-10">
        <div 
          className="h-full bg-[#B07A43] transition-all duration-500 ease-out absolute left-0"
          style={{ width: `${progressPercent}%` }}
        />
        <div className="absolute right-4 top-[-3px] text-[8px] font-mono font-bold text-[#8B7E66] bg-[#FCFAF4] px-1 border border-[#CFC5AD] rounded shadow-sm">
          SCALE 1:1
        </div>
      </div>

      {/* CONDITIONAL RENDER: LANDING PAGE vs WORKSPACE */}
      {!isStarted ? (
        <div id="landing-container" className="flex-1 flex flex-col bg-drafting-grid relative z-10">
          
          {/* HERO SECTION - RETRO TECHNICAL DRAWING BACKGROUND */}
          <section className="bg-dark-drafting text-[#EBE6DD] py-16 sm:py-20 px-6 border-b-2 border-[#131211] text-center relative overflow-hidden tech-frame">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(176,122,67,0.12),transparent_60%)]" />
            <div className="max-w-4xl mx-auto relative z-10">
              
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                <Shield size={12} /> 국제 기계 안전 규격 완벽 대응 가이드
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#FCFAF4] mb-6 leading-tight">
                정확한 규격 원문 기반<br />
                <span className="text-amber-400">기계 안전 표준 기술 검토</span> 시스템
              </h2>

              <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
                설계 중인 설비와 직면한 안전 문제를 구조화된 5개 단계로 입력해 주십시오.<br className="hidden sm:inline" />
                사용자가 업로드한 규격 조항만을 근거로 삼는 <strong>환각 방지 기술 리포트</strong>를 즉시 발행합니다.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  onClick={handleStartReview}
                  className="w-full sm:w-auto px-8 py-4 bg-[#B07A43] hover:bg-[#976533] border border-[#8C5D2C] text-white font-bold rounded-xl shadow-lg shadow-amber-950/30 text-sm sm:text-base transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  무료 기술 검토 시작하기 <ArrowRight size={18} />
                </button>
                <a
                  href="#strengths-section"
                  className="w-full sm:w-auto px-6 py-4 bg-[#2D2B28]/80 hover:bg-[#201F1D] text-slate-300 border border-[#3A3835] font-bold rounded-xl text-sm sm:text-base transition-all flex items-center justify-center gap-1.5"
                >
                  특장점 알아보기 <ChevronRight size={16} />
                </a>
              </div>

              {/* Gemini API Key Panel */}
              <div id="gemini-key-panel" className="mt-10 max-w-md mx-auto bg-[#1F1E1B]/95 border border-[#3A3835] rounded-2xl p-5 shadow-2xl text-left relative overflow-hidden tech-frame transition-all duration-300">
                {/* Decorative top bar accent */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500/20 via-amber-500/80 to-amber-500/20" />
                
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-400 animate-pulse" />
                    <span className="text-xs font-bold text-amber-200 uppercase tracking-wider">
                      Gemini API Key 승인 및 연동 (필수 사항)
                    </span>
                  </div>
                  {isKeyVerified ? (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> 승인 완료
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-rose-400 bg-rose-950/40 border border-rose-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> 승인 대기 (가동 잠김)
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-300 mb-4 leading-relaxed font-normal">
                  본 안전 기술 검토 시스템의 모든 기능(5단계 질의, 표준 조항 분석, 환각 방지 리포트 발행)을 사용하기 위해서는 AI Studio에서 발급받은 <strong>개인 Gemini API Key 승인</strong>이 필수적입니다. 입력된 키는 사용자의 브라우저 내 로컬 저장소에만 암호화되어 안전하게 보존됩니다.
                </p>

                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="password"
                      value={customApiKey}
                      onChange={(e) => setCustomApiKey(e.target.value)}
                      placeholder="AI Studio에서 발급받은 API KEY 입력..."
                      className="w-full px-3.5 py-2.5 bg-[#131211] border border-[#3A3835] text-slate-100 placeholder-slate-600 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-transparent transition-all shadow-inner font-mono tracking-wider pr-16"
                    />
                    {customApiKey && (
                      <button
                        onClick={handleClearKey}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-rose-400 hover:text-rose-300 font-bold px-2 py-1 rounded bg-rose-950/30 border border-rose-900/40 hover:bg-rose-950/60 transition cursor-pointer"
                      >
                        지우기
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleVerifyKey}
                      disabled={isVerifying || !customApiKey.trim()}
                      className="flex-1 py-2.5 bg-[#B07A43] hover:bg-[#976533] disabled:bg-slate-800 disabled:text-slate-600 disabled:border-transparent text-white border border-[#8C5D2C] font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 size={12} className="animate-spin text-white" /> 키 검증 중...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={13} /> 키 등록 및 검증
                        </>
                      )}
                    </button>
                    
                    <a
                      href="https://aistudio.google.com/api-keys?project=gen-lang-client-0931204034"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2.5 bg-[#131211] hover:bg-[#1A1917] text-slate-400 hover:text-slate-300 border border-[#3A3835] font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1"
                    >
                      키 발급 <ExternalLink size={11} />
                    </a>
                  </div>

                  {verificationMessage && (
                    <div className={`p-2.5 rounded-lg border text-[11px] font-medium animate-fadeIn ${
                      verificationMessage.type === "success"
                        ? "bg-[#EBF5EE]/10 border-emerald-500/30 text-emerald-400"
                        : "bg-rose-950/20 border-rose-900/50 text-rose-300"
                    }`}>
                      {verificationMessage.text}
                    </div>
                  )}
                </div>
              </div>

              {/* Supported standard pill items */}
              <div className="mt-12 pt-10 border-t border-[#2D2B28] flex flex-wrap justify-center items-center gap-3 text-xs text-slate-400">
                <span className="text-amber-200/30 uppercase tracking-widest font-bold text-[10px] mr-2">적용 규격 및 지침:</span>
                <span className="bg-[#131211]/70 border border-[#2D2B28] px-3 py-1 rounded-full font-semibold text-slate-300">ISO 12100</span>
                <span className="bg-[#131211]/70 border border-[#2D2B28] px-3 py-1 rounded-full font-semibold text-slate-300">ISO 13849-1</span>
                <span className="bg-[#131211]/70 border border-[#2D2B28] px-3 py-1 rounded-full font-semibold text-slate-300">IEC 60204-1</span>
                <span className="bg-[#131211]/70 border border-[#2D2B28] px-3 py-1 rounded-full font-semibold text-slate-300">CE Machinery Regulation</span>
                <span className="bg-[#131211]/70 border border-[#2D2B28] px-3 py-1 rounded-full font-semibold text-slate-300">KCs 인증 기준</span>
              </div>

            </div>
          </section>

          {/* CORE STRENGTHS SECTION */}
          <section id="strengths-section" className="py-16 sm:py-20 px-6 max-w-6xl mx-auto w-full relative z-10">
            
            <div className="text-center mb-12 sm:mb-16">
              <span className="text-xs font-bold text-amber-800 bg-amber-100 border border-amber-200/50 px-3 py-1 rounded-full uppercase tracking-wider">
                CORE ADVANTAGES
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#3A3835] mt-3 tracking-tight">
                왜 "기계 안전 표준 Q&A 도우미" 인가요?
              </h3>
              <p className="text-xs sm:text-sm text-[#6E685E] mt-2 max-w-xl mx-auto leading-relaxed">
                일반적인 생성형 AI 모델의 최대 문제점인 "규격 번호 및 안전 수치 환각"을 기술적으로 완벽히 극복했습니다.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              
              {/* Strength 1 */}
              <div className="bg-[#FCFAF4] border border-[#CFC5AD] p-6 sm:p-8 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col items-start tech-frame">
                <div className="p-3 bg-amber-50 text-amber-800 rounded-xl mb-5 border border-amber-200/60">
                  <ShieldAlert size={22} />
                </div>
                <h4 className="text-base sm:text-lg font-bold text-[#3A3835] mb-2.5">
                  안전 치수·조항 환각 100% 원천 차단
                </h4>
                <p className="text-xs sm:text-sm text-[#6E685E] leading-relaxed font-normal">
                  가드 이격 거리, 제어 회로 PLr 등 안전에 직결된 정량적 수치 및 특정 조항 번호는 <strong>사용자가 직접 업로드한 안전 규격 텍스트</strong>에서만 파싱하여 인용하므로 오류 없는 안전 설계 보조 도구로써 신뢰할 수 있습니다.
                </p>
              </div>

              {/* Strength 2 */}
              <div className="bg-[#FCFAF4] border border-[#CFC5AD] p-6 sm:p-8 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col items-start tech-frame">
                <div className="p-3 bg-amber-50 text-amber-800 rounded-xl mb-5 border border-amber-200/60">
                  <Layers3 size={22} />
                </div>
                <h4 className="text-base sm:text-lg font-bold text-[#3A3835] mb-2.5">
                  구조화된 5단계 질의 프로세스
                </h4>
                <p className="text-xs sm:text-sm text-[#6E685E] leading-relaxed font-normal">
                  표준 규격 선별, 적용 설비 분류, 당면한 핵심 과제, 정보의 표현 포맷 선호, 그리고 세부 참조 파일 수집까지 물 흐르듯 직관적인 가이드라인을 제공해 누구나 전문가 수준의 요구 명세서 작성을 지원합니다.
                </p>
              </div>

              {/* Strength 3 */}
              <div className="bg-[#FCFAF4] border border-[#CFC5AD] p-6 sm:p-8 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col items-start tech-frame">
                <div className="p-3 bg-amber-50 text-amber-800 rounded-xl mb-5 border border-amber-200/60">
                  <FileSpreadsheet size={22} />
                </div>
                <h4 className="text-base sm:text-lg font-bold text-[#3A3835] mb-2.5">
                  체크포인트 및 출처의 명확화
                </h4>
                <p className="text-xs sm:text-sm text-[#6E685E] leading-relaxed font-normal">
                  생성된 최종 보고서에는 실제 제공 문서의 규격 원문 출처를 별도로 표기하는 영역을 할당합니다. 일반 안전 지식 개념과 명확히 구분해 표시하므로 내부 보고 및 공인 심사 대응에 최적의 요약서를 선사합니다.
                </p>
              </div>

            </div>

          </section>

          {/* METHODOLOGY STEPS SECTION */}
          <section className="bg-[#FAF7EF] bg-drafting-grid-sub py-16 sm:py-20 px-6 border-y border-[#CFC5AD] relative z-10">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <span className="text-xs font-bold text-amber-800 bg-amber-100 border border-amber-200/50 px-3 py-1 rounded-full uppercase tracking-wider">
                  SYSTEM FLOW
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#3A3835] mt-3 tracking-tight">
                  분석 검토 절차 및 프로세스
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#CFC5AD] shadow-sm font-extrabold text-sm text-[#B07A43] flex items-center justify-center shrink-0 tech-frame">
                    1
                  </div>
                  <div>
                    <h5 className="font-bold text-[#3A3835] text-sm mb-1">안전 규격 및 설비 지정</h5>
                    <p className="text-xs text-[#6E685E] leading-relaxed font-medium">검토할 핵심 규격(ISO, IEC, CE 등)과 검사 대상 설비 종류를 순차적으로 지정합니다.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#CFC5AD] shadow-sm font-extrabold text-sm text-[#B07A43] flex items-center justify-center shrink-0 tech-frame">
                    2
                  </div>
                  <div>
                    <h5 className="font-bold text-[#3A3835] text-sm mb-1">핵심 과제 분석 수집</h5>
                    <p className="text-xs text-[#6E685E] leading-relaxed font-medium">설계 단계에서의 본질적 안전 확보, PLr 검증, 기술문서 작성 등 시급한 주제를 추출합니다.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#CFC5AD] shadow-sm font-extrabold text-sm text-[#B07A43] flex items-center justify-center shrink-0 tech-frame">
                    3
                  </div>
                  <div>
                    <h5 className="font-bold text-[#3A3835] text-sm mb-1">실제 표준 규격 원문 등록</h5>
                    <p className="text-xs text-[#6E685E] leading-relaxed font-medium">안전 조항 원문 및 수치 테이블을 텍스트 입력 또는 파일 업로드 형태로 전달합니다.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#CFC5AD] shadow-sm font-extrabold text-sm text-[#B07A43] flex items-center justify-center shrink-0 tech-frame">
                    4
                  </div>
                  <div>
                    <h5 className="font-bold text-[#3A3835] text-sm mb-1">정밀 검토 리포트 자동 생성</h5>
                    <p className="text-xs text-[#6E685E] leading-relaxed font-medium">환각 수치 없이 검증된 팩트 기반 요약 및 조항별 실무 체크포인트를 포함한 완성도 높은 보고서가 제공됩니다.</p>
                  </div>
                </div>

              </div>

              <div className="mt-12 text-center">
                <button
                  onClick={handleStartReview}
                  className="px-8 py-3.5 bg-[#2D2B28] hover:bg-[#3D3B38] border border-[#131211] text-white font-bold rounded-xl shadow-md text-sm transition-all active:scale-95 inline-flex items-center gap-2 cursor-pointer"
                >
                  지금 즉시 검토 보고서 만들기 <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </section>

          {/* DESIGN TRUST STATEMENTS */}
          <section className="py-16 sm:py-20 px-6 max-w-4xl mx-auto w-full text-center relative z-10">
            <h4 className="text-base font-bold text-[#8B7E66] uppercase tracking-widest mb-6">TRUSTED BY MECHANICAL DESIGN ENGINEERS</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-10 text-[#3A3835] font-bold">
              <div className="p-4 bg-[#FCFAF4] border border-[#CFC5AD] rounded-xl shadow-sm tech-frame">
                <div className="text-2xl text-[#B07A43]">0%</div>
                <div className="text-[#8B7E66] text-[10px] uppercase font-bold tracking-wider mt-1">정량 수치 환각 제로</div>
              </div>
              <div className="p-4 bg-[#FCFAF4] border border-[#CFC5AD] rounded-xl shadow-sm tech-frame">
                <div className="text-2xl text-[#B07A43]">5단계</div>
                <div className="text-[#8B7E66] text-[10px] uppercase font-bold tracking-wider mt-1">구조화 질의 프로세스</div>
              </div>
              <div className="p-4 bg-[#FCFAF4] border border-[#CFC5AD] rounded-xl shadow-sm tech-frame">
                <div className="text-2xl text-[#B07A43]">Perfect</div>
                <div className="text-[#8B7E66] text-[10px] uppercase font-bold tracking-wider mt-1">프리텐다드 고가독성</div>
              </div>
              <div className="p-4 bg-[#FCFAF4] border border-[#CFC5AD] rounded-xl shadow-sm tech-frame">
                <div className="text-2xl text-[#B07A43]">100%</div>
                <div className="text-[#8B7E66] text-[10px] uppercase font-bold tracking-wider mt-1">사용자 보안 지침 준수</div>
              </div>
            </div>
            <p className="text-xs text-[#8B7E66] leading-relaxed">
              본 시스템은 기계 설계자, 엔지니어링 실무자, 사내 안전 환경 관리자들이 사전에 원문을 간편히 검증할 수 있도록 설계된 지능형 의사결정 보조 소프트웨어입니다.
            </p>
          </section>

        </div>
      ) : (
        /* ACTUAL QUESTIONS / RESULTS WORKSPACE */
        <div id="workspace-container" className="flex-1 flex flex-col lg:flex-row overflow-hidden relative z-10">
          {!isKeyVerified && (
            <div className="absolute inset-0 bg-[#1F1E1B]/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
              <div className="max-w-md bg-[#131211] border border-[#3A3835] rounded-3xl p-8 shadow-2xl text-slate-200">
                <div className="w-16 h-16 bg-amber-950/50 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Lock size={28} className="text-amber-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-100 mb-3">API 키 승인 및 연동 필요</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  현재 기계 안전 표준 분석 서비스가 비가동 상태입니다. 모든 분석 기능과 5단계 가이드라인을 사용하시려면 먼저 랜딩 페이지로 이동하여 Gemini API Key를 연동하고 승인을 받으셔야 합니다.
                </p>
                <button
                  onClick={() => {
                    setIsStarted(false);
                    setTimeout(() => {
                      const element = document.getElementById("gemini-key-panel");
                      if (element) {
                        element.scrollIntoView({ behavior: "smooth", block: "center" });
                        element.classList.add("ring-2", "ring-amber-500", "ring-offset-2", "ring-offset-[#131211]");
                        setTimeout(() => {
                          element.classList.remove("ring-2", "ring-amber-500", "ring-offset-2", "ring-offset-[#131211]");
                        }, 3000);
                      }
                    }, 150);
                  }}
                  className="w-full py-3 bg-[#B07A43] hover:bg-[#976533] text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 border border-[#8C5D2C]"
                >
                  <Unlock size={14} /> API Key 승인 페이지로 이동하기
                </button>
              </div>
            </div>
          )}
          
          {/* SIDEBAR WIZARD PROGRESS PANEL - PARCHMENT DRAFT STYLE */}
          <aside id="sidebar" className="w-full lg:w-[320px] bg-[#FCFAF4] border-b lg:border-b-0 lg:border-r border-[#CFC5AD] p-6 flex flex-col shrink-0 overflow-y-auto">
            
            <div className="mb-6">
              <div className="text-[11px] font-bold text-[#8B7E66] uppercase tracking-wider mb-1">PROMPT STEP WIZARD</div>
              <h2 className="text-sm font-bold text-[#3A3835] flex items-center gap-2">
                <Settings size={15} className="text-[#B07A43]" />
                검토 절차 가이드라인
              </h2>
              <p className="text-xs text-[#6E685E] mt-1 leading-relaxed">
                설계 중인 시스템 정보를 순차적으로 수집하여 정밀 분석을 실시합니다.
              </p>
            </div>

            {/* TIMELINE STEPS */}
            <div className="relative flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 scrollbar-none">
              
              {/* Timeline Vertical Track */}
              <div className="absolute left-[19px] top-3 bottom-3 w-[2px] bg-[#E8E2D2] hidden lg:block -z-10" />

              {QUESTIONS.map((q) => {
                const stepNum = q.id;
                const isActive = currentStep === stepNum;
                const isCompleted = currentStep > stepNum;
                
                // Color mapping
                let borderClass = "border-[#E8E2D2]";
                let textClass = "text-[#8B7E66]";
                let badgeClass = "bg-[#FAF7EF] text-[#8B7E66] border-[#CFC5AD]";

                if (isActive) {
                  borderClass = "border-[#B07A43] bg-[#FAF7EF] text-[#B07A43] font-bold ring-1 ring-[#B07A43]";
                  textClass = "text-[#3A3835] font-bold";
                  badgeClass = "bg-[#B07A43] text-white border-[#B07A43] shadow-sm shadow-amber-900/10";
                } else if (isCompleted) {
                  borderClass = "border-[#CFC5AD] hover:bg-[#FAF7EF]/80";
                  textClass = "text-[#3A3835] font-medium";
                  badgeClass = "bg-[#4A6B53] text-white border-[#4A6B53]";
                }

                return (
                  <button
                     key={q.id}
                     onClick={() => {
                       if (currentStep <= 5) {
                         setCurrentStep(stepNum);
                       }
                     }}
                     disabled={currentStep > 5}
                     className={`flex flex-col lg:flex-row lg:items-start gap-3 p-3 rounded-xl text-left transition-all shrink-0 lg:shrink-1 border ${borderClass} mb-0 lg:mb-3`}
                     style={{ minWidth: '150px' }}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors border ${badgeClass}`}>
                        {isCompleted ? <Check size={14} strokeWidth={2.5} /> : `0${stepNum}`}
                      </span>
                      <div>
                        <span className={`text-xs block ${textClass} tracking-tight`}>
                          {q.shortTitle}
                        </span>
                        {answers[stepNum - 1] && (
                          <span className="text-[10px] block truncate max-w-[130px] lg:max-w-[180px] mt-0.5 px-1.5 py-0.5 bg-[#FAF7EF] border border-[#E8E2D2] rounded text-[#4A4640] font-semibold">
                            {truncate(answers[stepNum - 1], 15)}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* Step 6 result element in timeline */}
              <div className="lg:mt-4 lg:pt-4 lg:border-t lg:border-[#CFC5AD]">
                <button
                  disabled={result === ""}
                  onClick={() => {
                    if (result) setCurrentStep(6);
                  }}
                  className={`flex flex-col lg:flex-row lg:items-start gap-3 p-3 rounded-xl text-left transition-all shrink-0 lg:shrink-1 border w-full ${
                    currentStep === 6 
                      ? "border-[#2D68C4] bg-[#F2F6FC] text-[#2D68C4] font-bold ring-1 ring-[#2D68C4]" 
                      : "border-[#E8E2D2] opacity-60 cursor-not-allowed"
                  }`}
                  style={{ minWidth: '150px' }}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border ${
                      currentStep === 6 
                        ? "bg-[#2D68C4] text-white border-[#2D68C4] shadow-sm shadow-blue-900/10" 
                        : "bg-[#FAF7EF] text-[#8B7E66] border-[#CFC5AD]"
                    }`}>
                      06
                    </span>
                    <div>
                      <span className={`text-xs block ${currentStep === 6 ? 'text-blue-950 font-bold' : 'text-[#8B7E66]'}`}>
                        기술 검토 결과
                      </span>
                      {result && (
                        <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded inline-block mt-0.5 border border-blue-100">
                          분석서 완료
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </div>

            </div>

            {/* REALTIME DYNAMIC SUMMARY STATS - PARCHMENT STYLE */}
            <div className="hidden lg:flex flex-col gap-4 mt-auto p-4 bg-[#FAF7EF] rounded-xl border border-[#CFC5AD]">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-bold text-[#8B7E66] uppercase tracking-wider">입력 데이터 실시간 요약</h3>
                {answers.some(a => a !== "") && (
                  <button 
                    onClick={handleReset} 
                    className="text-[10px] text-rose-700 hover:text-rose-800 flex items-center gap-1 font-bold transition cursor-pointer"
                  >
                    <RotateCcw size={10} /> 전체초기화
                  </button>
                )}
              </div>
              
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between border-b border-[#E8E2D2] pb-2">
                  <span className="text-[#8B7E66]">1. 핵심 규격</span>
                  <span className="font-semibold text-[#3A3835] max-w-[150px] truncate" title={answers[0]}>
                    {answers[0] ? truncate(answers[0], 18) : "미선택"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-[#E8E2D2] pb-2">
                  <span className="text-[#8B7E66]">2. 기계 종류</span>
                  <span className="font-semibold text-[#3A3835] max-w-[150px] truncate" title={answers[1]}>
                    {answers[1] ? truncate(answers[1], 18) : "미입력"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-[#E8E2D2] pb-2">
                  <span className="text-[#8B7E66]">3. 핵심 과제</span>
                  <span className="font-semibold text-[#3A3835] max-w-[150px] truncate" title={answers[2]}>
                    {answers[2] ? truncate(answers[2], 18) : "미입력"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-[#E8E2D2] pb-2">
                  <span className="text-[#8B7E66]">4. 선호 형태</span>
                  <span className="font-semibold text-[#3A3835] max-w-[150px] truncate" title={answers[3]}>
                    {answers[3] ? truncate(answers[3], 18) : "미선택"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8B7E66]">5. 원문 제공</span>
                  <span className="font-semibold text-[#3A3835] max-w-[150px] truncate" title={answers[4]}>
                    {answers[4] ? truncate(answers[4], 18) : "대기"}
                  </span>
                </div>
              </div>

              {uploadedFileName && (
                <div className="bg-[#EBF5EE] border border-[#C6E2CD] p-2.5 rounded-lg text-[11px] text-[#2E5E3B] flex items-center gap-1.5 font-medium">
                  <CheckCircle2 size={13} className="text-[#2E5E3B] shrink-0" />
                  <span className="truncate">문서: {uploadedFileName}</span>
                </div>
              )}
            </div>
          </aside>

          {/* WORKSPACE & CONTENT AREA - BLUEPRINT BACKGROUND */}
          <section id="content-container" className="flex-1 p-6 sm:p-8 md:p-10 lg:p-12 overflow-y-auto flex flex-col bg-drafting-grid">
            
            {/* STEP 1 to 5: QUESTION VIEWS CONTAINER */}
            {currentStep <= 5 && (
              <div id="question-flow-section" className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
                
                {/* Drafting layout board */}
                <div className="bg-[#FCFAF4] border border-[#CFC5AD] rounded-2xl p-6 sm:p-8 shadow-md flex-1 flex flex-col tech-frame">
                  
                  {/* Question Header Status */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#E8E2D2]">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#B07A43] bg-amber-100/50 border border-amber-200/50 px-2.5 py-1 rounded-full">
                        <Layers size={12} />
                        검토 단계 {currentStep} / 5
                      </span>
                      <span className="text-xs text-[#CFC5AD] font-semibold">•</span>
                      <span className="text-xs font-medium text-[#8B7E66]">기계 안전 표준 Q&A 도우미</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#8B7E66]">ISO DIRECTIVE</span>
                  </div>

                  {/* Primary Question Title */}
                  <div className="mb-6">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-[#3A3835] tracking-tight leading-relaxed">
                      {QUESTIONS[currentStep - 1].title}
                    </h3>
                    <p className="text-xs text-[#8B7E66] mt-1.5 font-medium">
                      아래 선택지 중에서 현재 상태에 일치하는 항목을 선택하거나, 하단의 주관식 입력 폼을 활용해 주십시오.
                    </p>
                  </div>

                  {/* Option Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                    {QUESTIONS[currentStep - 1].options.map((option, idx) => {
                      const isSelected = selectedOptionIndex === idx;
                      const charCode = String.fromCharCode(65 + idx); // A, B, C, D...

                      return (
                        <div
                          key={idx}
                          id={`option-card-${currentStep}-${idx}`}
                          onClick={() => handleOptionClick(idx)}
                          className={`group relative p-4 border rounded-xl cursor-pointer transition-all flex items-start gap-3.5 hover:shadow-sm ${
                            isSelected 
                              ? "border-[#B07A43] bg-[#FAF7EF] ring-1 ring-[#B07A43]" 
                              : "border-[#CFC5AD] hover:border-[#B07A43]/50 bg-[#FCFAF4]"
                          }`}
                        >
                          {/* Selector indicator */}
                          <div className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold transition-all ${
                            isSelected 
                              ? "border-[#B07A43] bg-[#B07A43] text-white" 
                              : "border-[#CFC5AD] bg-[#FAF7EF] text-[#8B7E66] group-hover:border-[#B07A43]/40"
                          }`}>
                            {isSelected ? <Check size={12} strokeWidth={3} /> : charCode}
                          </div>
                          
                          <div className="flex-1">
                            <span className={`text-sm leading-relaxed block ${
                              isSelected ? "text-[#3A3835] font-bold" : "text-[#4A4640] font-medium group-hover:text-[#3A3835]"
                            }`}>
                              {option}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Custom Input / Additional feedback block */}
                  <div className="bg-[#FAF7EF] p-5 rounded-2xl border border-[#CFC5AD] mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold text-[#B07A43] bg-amber-100/60 border border-amber-200/40 px-2 py-0.5 rounded">주관식 보완</span>
                      <label className="text-xs font-bold text-[#6E685E] uppercase tracking-wide">
                        지침 요구사항 추가 또는 변경 입력
                      </label>
                    </div>
                    <input
                      type="text"
                      value={customInputValue}
                      onChange={handleCustomInputChange}
                      placeholder={QUESTIONS[currentStep - 1].placeholder}
                      className="w-full px-4 py-3 bg-white border border-[#CFC5AD] rounded-xl text-sm text-[#3A3835] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#B07A43] focus:border-transparent transition-all shadow-inner"
                    />
                  </div>

                  {/* Step 5 Special Fields: Document details */}
                  {currentStep === 5 && selectedOptionIndex !== null && (
                    <div className="mb-6 border-t border-[#E8E2D2] pt-6 animate-fadeIn">
                      
                      {/* Option 5-1: Paste text */}
                      {selectedOptionIndex === 0 && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-sm font-bold text-[#3A3835] flex items-center gap-2">
                              <FileText size={16} className="text-[#B07A43]" />
                              표준 문서 원문 및 조항 텍스트 붙여넣기
                            </label>
                            <span className="text-xs text-[#8B7E66] font-semibold">(저작권 준수를 위해 15단어 이상 반복 인용은 자동 요약됩니다)</span>
                          </div>
                          <textarea
                            value={documentText}
                            onChange={(e) => setDocumentText(e.target.value)}
                            placeholder="검토하고 싶으신 ISO, IEC, 혹은 CE 관련 표준 규격 문서의 세부 원문을 여기에 자유롭게 붙여넣어 주세요. 수집된 텍스트 원문을 분석하여 구체적이고 정량적인 실무 기술 검토 의견을 수립합니다."
                            className="w-full h-56 px-4 py-3 bg-white border border-[#CFC5AD] rounded-xl text-sm text-[#3A3835] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#B07A43] focus:border-transparent transition-all shadow-inner font-mono leading-relaxed"
                          />
                        </div>
                      )}

                      {/* Option 5-2: File Upload (drag and drop) */}
                      {selectedOptionIndex === 1 && (
                        <div className="space-y-3">
                          <label className="text-sm font-bold text-[#3A3835] flex items-center gap-2">
                            <Upload size={16} className="text-[#B07A43]" />
                            보안 텍스트 파일 업로드 (.txt 텍스트 파일 형식)
                          </label>
                          
                          <div
                            onDragEnter={handleDrag}
                            onDragOver={handleDrag}
                            onDragLeave={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                              dragActive 
                                ? "border-[#B07A43] bg-[#FAF7EF]/80" 
                                : "border-[#CFC5AD] hover:border-[#B07A43] bg-[#FAF7EF] hover:bg-[#FAF7EF]/60"
                            }`}
                          >
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept=".txt,.md,.json,.html"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                            <div className="p-3 bg-white rounded-xl shadow-sm text-slate-500 border border-[#E8E2D2]">
                              <Upload size={24} className="text-[#B07A43]" />
                            </div>
                            <div>
                              <span className="text-sm font-bold text-[#3A3835] block">
                                {uploadedFileName ? `업로드 완료: ${uploadedFileName}` : "드래그 앤 드롭 또는 파일 클릭 선택"}
                              </span>
                              <span className="text-xs text-[#8B7E66] mt-1 block">
                                검증이 필요한 표준 안전 조치 규격 텍스트 파일을 업로드할 수 있습니다.
                              </span>
                            </div>
                          </div>

                          {uploadedFileName && (
                            <div className="bg-[#FCFAF4] p-4 rounded-xl border border-[#CFC5AD]">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-[#8B7E66] uppercase tracking-wide">업로드된 파일 내용 미리보기</span>
                                <span className="text-xs font-mono font-bold text-[#4A6B53] bg-[#EBF5EE] px-2 py-0.5 rounded border border-[#C6E2CD]">
                                  {documentText.length} 글자 감지됨
                                </span>
                              </div>
                              <pre className="text-xs bg-white p-3.5 rounded-lg border border-[#E8E2D2] max-h-36 overflow-y-auto text-[#4A4640] font-mono leading-relaxed whitespace-pre-wrap">
                                {documentText || "파일 텍스트 내용을 해석하는 중..."}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Option 5-3: Plain Concept explanation warning */}
                      {selectedOptionIndex === 2 && (
                        <div className="p-4 bg-amber-50/50 border border-amber-200 text-amber-950 rounded-xl text-xs sm:text-sm flex gap-3 leading-relaxed">
                          <AlertCircle size={20} className="shrink-0 text-amber-700" />
                          <div>
                            <span className="font-bold block mb-1">근거 데이터 누락 안내 (중요 원칙 준수)</span>
                            사용자가 검토 대상 문서를 직접 공유하지 않았으므로, <strong>수치적 정량 기준 및 특정 조항 번호는 안내되지 않습니다.</strong> 본 기계 안전 표준 검토 시스템은 환각(Hallucination) 방지를 위해 수치를 임의로 창작하지 않으며, 이 단계에서는 보편적인 설계 규칙과 핵심 개념 위주로 기술 리포트를 수립합니다.
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Error Message */}
                  {errorMessage && (
                    <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-950 rounded-xl text-sm flex gap-3 leading-relaxed">
                      <ShieldAlert size={20} className="shrink-0 text-rose-700" />
                      <div>
                        <span className="font-bold block">검토 처리 실패</span>
                        <p className="mt-1 text-xs sm:text-sm">{errorMessage}</p>
                      </div>
                    </div>
                  )}

                  {/* NAVIGATION FOOTER */}
                  <div className="mt-auto pt-6 border-t border-[#E8E2D2] flex flex-col sm:flex-row gap-3 sm:gap-0 justify-between items-center">
                    <button
                      onClick={handlePrev}
                      disabled={currentStep === 1 || isLoading}
                      className={`w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#CFC5AD] text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        currentStep === 1 || isLoading
                          ? "text-slate-400 border-[#E8E2D2] bg-slate-100/20 cursor-not-allowed"
                          : "text-[#3A3835] bg-white hover:bg-[#FAF7EF] active:scale-95 cursor-pointer"
                      }`}
                    >
                      <ArrowLeft size={14} /> 이전 단계로 이동
                    </button>

                    <div className="text-xs font-bold text-[#8B7E66] bg-[#FAF7EF] border border-[#E8E2D2] px-3 py-1 rounded-full">
                      기계 안전 가이드 {currentStep} / 5 단계
                    </div>

                    <button
                      onClick={handleNext}
                      disabled={isLoading}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#2D2B28] hover:bg-[#3D3B38] border border-[#131211] text-white px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95 disabled:bg-slate-300 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 size={15} className="animate-spin text-white" /> 검토 분석서 작성 중...
                        </>
                      ) : currentStep === 5 ? (
                        <>
                          종합 검토 결과서 발행 <FileCheck size={15} />
                        </>
                      ) : (
                        <>
                          다음 단계 진행 <ArrowRight size={14} />
                        </>
                      )}
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* STEP 6: TECHNICAL REVIEW RESULT DOCUMENT SHEET */}
            {currentStep === 6 && (
              <div id="result-view-section" className="flex-1 flex flex-col max-w-4xl mx-auto w-full animate-fadeIn">
                
                {/* Report Upper Card & Header */}
                <div className="bg-[#FCFAF4] border border-[#CFC5AD] rounded-2xl shadow-md p-6 sm:p-8 flex-1 flex flex-col overflow-hidden mb-6 tech-frame">
                  
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#E8E2D2] pb-5 mb-6 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-50 text-[#2D68C4] rounded-xl border border-blue-100">
                        <FileCheck size={24} />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[#2E5E8A] bg-[#EBF5FF] border border-[#B8D7FA] px-2 py-0.5 rounded-full inline-block">
                          AI 기계 안전 기술 검토 보고서
                        </span>
                        <h2 className="text-xl sm:text-2xl font-bold text-[#3A3835] tracking-tight mt-1">
                          기계 안전 표준 기술 검토 결과서
                        </h2>
                      </div>
                    </div>
                    
                    {/* Copy & Reset Actions */}
                    <div className="flex gap-2 w-full md:w-auto">
                      <button
                        onClick={handleCopyToClipboard}
                        className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-[#FCFAF4] hover:bg-[#FAF7EF] text-slate-700 border border-[#CFC5AD] px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
                      >
                        {copied ? (
                          <>
                            <Check size={14} className="text-[#4A6B53]" /> 복사 완료
                          </>
                        ) : (
                          <>
                            <Clipboard size={14} /> 결과 복사
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleReset}
                        className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-[#B07A43] hover:bg-[#976533] border border-[#8C5D2C] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                      >
                        <RotateCcw size={14} /> 새로 검토하기
                      </button>
                    </div>
                  </div>

                  {/* METADATA BLOCK FOR OFFICIAL REPORT LOOK */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-[#FAF7EF] border border-[#CFC5AD] p-4 rounded-xl mb-6 text-xs leading-relaxed">
                    <div>
                      <span className="text-[#8B7E66] block font-medium">검토 지정 규격</span>
                      <strong className="text-[#3A3835] font-bold block truncate" title={answers[0]}>
                        {answers[0] ? answers[0].split('(')[0].trim() : "미정"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#8B7E66] block font-medium">검사 대상 설비</span>
                      <strong className="text-[#3A3835] font-bold block truncate" title={answers[1]}>
                        {answers[1] ? answers[1].split('(')[0].trim() : "미정"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#8B7E66] block font-medium">우선 고려 과제</span>
                      <strong className="text-[#3A3835] font-bold block truncate" title={answers[2]}>
                        {answers[2] ? answers[2].split('(')[0].trim() : "미정"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#8B7E66] block font-medium">문서 근거 수준</span>
                      <strong className="text-[#3A3835] font-bold block">
                        {documentText ? "사용자 제공 원문 기반" : "개념 설명 위주 (비검증)"}
                      </strong>
                    </div>
                  </div>

                  {/* REPORT SHEET BODY WITH ENHANCED MARKDOWN TYPOGRAPHY */}
                  <div className="flex-1 overflow-y-auto max-h-[550px] border border-[#E8E2D2] p-5 sm:p-6 rounded-xl bg-[#FCFAF4] scrollbar-thin">
                    {result ? (
                      <div className="prose prose-slate max-w-none prose-sm leading-relaxed text-[#3A3835]">
                        <ReactMarkdown 
                          components={{
                            h1: ({node, ...props}) => <h1 className="text-xl sm:text-2xl font-extrabold text-[#201F1D] border-b-2 border-[#E8E2D2] pb-3 mb-4 mt-6 first:mt-0 tracking-tight" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-base sm:text-lg font-bold text-[#2D2B28] border-l-4 border-[#B07A43] pl-3 mb-3.5 mt-6 tracking-tight" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-sm sm:text-base font-bold text-[#3A3835] mb-2.5 mt-5" {...props} />,
                            p: ({node, ...props}) => <p className="text-xs sm:text-sm text-[#4A4640] leading-relaxed mb-4 font-normal" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-1.5 text-xs sm:text-sm text-[#4A4640] font-medium" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 space-y-1.5 text-xs sm:text-sm text-[#4A4640] font-medium" {...props} />,
                            li: ({node, ...props}) => <li className="pl-1" {...props} />,
                            blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-amber-600 bg-amber-50/60 px-4 py-3.5 rounded-r-xl my-4 text-[#3A3835] text-xs sm:text-sm leading-relaxed" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-bold text-[#201F1D]" {...props} />,
                            code: ({node, ...props}) => <code className="bg-[#EBE6DD] text-rose-700 px-1.5 py-0.5 rounded text-xs font-mono border border-[#CFC5AD]" {...props} />,
                          }}
                        >
                          {result}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="text-center py-24 text-slate-400 flex flex-col items-center justify-center gap-3">
                        <Loader2 size={36} className="animate-spin text-[#B07A43]" />
                        <span className="text-sm font-semibold text-[#8B7E66]">공식 기계 안전 검토 기술 요약 리포트를 가공하고 있습니다...</span>
                      </div>
                    )}
                  </div>

                  {/* Sub Action Summary */}
                  <div className="mt-5 pt-4 border-t border-[#E8E2D2] flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
                    <div className="text-slate-500 flex items-center gap-2">
                      <Info size={14} className="text-[#B07A43] shrink-0" />
                      <span>본 리포트는 기계 안전 표준 및 지침 구조에 의거하여 발행되었습니다.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={handleReset}
                        className="text-xs text-rose-700 font-bold hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                      >
                        전체 데이터 초기화 및 홈으로 이동
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )}

          </section>
        </div>
      )}

      {/* FOOTER - TECHNICAL DISCLAIMER */}
      <footer id="footer-disclaimer" className="bg-[#FFFDF4] border-t-2 border-[#E8D29F] px-6 py-4 text-[11px] sm:text-xs text-[#6E5020] leading-relaxed shrink-0 flex items-start gap-3 relative z-10">
        <AlertCircle size={16} className="text-[#8A601E] shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold text-[#8A601E]">[면책 고지 및 검토 대원칙]</strong> 본 기계 안전 표준 검토 결과는 인공지능이 제공된 문서를 해석하여 작성한 보조 참고 자료입니다. 실제 설계 조작, 법적 기준, 해외 규정 합격 혹은 인증 제출 문서로 사용하기 전에 <strong>반드시 공인 인증기관 및 사내 안전 책임 전문가의 기술적 유효성 검토</strong>를 거쳐야 합니다. 특히 정량적 안전 치수, 안전 제어 성능 등급(PL) 기준과 조항 해석은 공인 원문 표준 문헌의 가장 최신 개정판 내용과 직접 수동 대조하여 철저히 재확인하시기 바랍니다. 기계 안전 Q&A 도우미는 <strong>사용자가 직접 텍스트나 파일로 제공하지 않은 수치적 정량 데이터(거리, 힘, PLr 등급)나 조항을 결코 임의로 지어내지 않습니다.</strong>
        </div>
      </footer>
    </div>
  );
}
