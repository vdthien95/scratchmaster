import { GoogleGenAI, Type } from "@google/genai";
import { TheoryContent, PracticeExercise, AIResponse, Challenge, Grade, ProblemAnalysis, GradingResult, ProblemFeedback } from "../types";

let genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
const model = "gemini-3-flash-preview";

export const updateApiKey = (key: string) => {
  genAI = new GoogleGenAI({ apiKey: key });
};

export const generateTheoryContent = async (topicTitle: string, grade: Grade): Promise<TheoryContent> => {
  const grade4Constraint = grade === 4 ? "Lưu ý: KHÔNG sử dụng kiến thức về vòng lặp (loop) và cảm biến (sensing)." : "";
  const response = await genAI.models.generateContent({
    model,
    contents: `Bạn là trợ lý học tập Scratch cho học sinh lớp ${grade}. Hãy soạn nội dung ôn tập cho chủ đề: "${topicTitle}".
    Yêu cầu:
    1. Tóm tắt lý thuyết ngắn gọn, dễ hiểu (dạng gạch đầu dòng).
    2. Một ví dụ tình huống thực tế gần gũi.
    3. 3 câu hỏi trắc nghiệm (mỗi câu 4 phương án, chỉ 1 đáp án đúng).
    ${grade4Constraint}
    Ngôn ngữ: Tiếng Việt, phù hợp lứa tuổi 9-11.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.ARRAY, items: { type: Type.STRING } },
          example: { type: Type.STRING },
          quizzes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.INTEGER, description: "Index of correct option (0-3)" },
                explanation: { type: Type.STRING }
              },
              required: ["question", "options", "correctAnswer", "explanation"]
            }
          }
        },
        required: ["summary", "example", "quizzes"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const generatePracticeExercise = async (topicTitle: string, grade: Grade, level: string): Promise<PracticeExercise> => {
  let levelInstruction = "";
  const grade4Constraint = grade === 4 ? "Lưu ý: KHÔNG sử dụng kiến thức về vòng lặp (loop) và cảm biến (sensing)." : "";
  
  if (level === "Dễ") {
    levelInstruction = "Yêu cầu rõ ràng, tập trung vào một kỹ năng chính của chủ đề. Gợi ý nhóm lệnh nên sử dụng cụ thể.";
  } else if (level === "Vừa") {
    const skillsExample = grade === 4 ? "kết hợp 2 kỹ năng trong chủ đề (ví dụ: thay đổi nhân vật + đổi phông nền, hoặc đổi trang phục + âm thanh)" : "sự kiện + lặp, chuyển động + điều kiện";
    levelInstruction = `Kết hợp 2 kỹ năng (ví dụ: ${skillsExample}). Cần có câu hỏi định hướng suy nghĩ.`;
  } else {
    levelInstruction = "Yêu cầu xây dựng tình huống gần với dự án nhỏ. Học sinh tự phân tích nhiều bước. Chỉ gợi ý định hướng, không nêu chi tiết cách làm.";
  }

  const response = await genAI.models.generateContent({
    model,
    contents: `Tạo một bài tập thực hành Scratch mức độ "${level}" cho học sinh lớp ${grade} về chủ đề "${topicTitle}".
    Yêu cầu quan trọng: Nội dung nhiệm vụ (task) phải hoàn toàn đúng và phù hợp với kiến thức của chủ đề "${topicTitle}". Không đưa vào các kiến thức ngoài phạm vi chủ đề này trừ khi là các lệnh bổ trợ cơ bản.
    Nguyên tắc mức độ: ${levelInstruction}
    ${grade4Constraint}
    Yêu cầu phản hồi JSON gồm:
    1. title: Tên bài tập.
    2. task: Yêu cầu nhiệm vụ (phải bám sát chủ đề "${topicTitle}").
    3. goal: Mục tiêu cần đạt.
    4. hints: Gợi ý nhóm lệnh (Dễ: cụ thể; Vừa: nhóm lệnh; Khó: định hướng).
    5. guidingQuestion: Câu hỏi định hướng.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          task: { type: Type.STRING },
          goal: { type: Type.STRING },
          hints: { type: Type.ARRAY, items: { type: Type.STRING } },
          guidingQuestion: { type: Type.STRING }
        },
        required: ["title", "task", "goal", "hints", "guidingQuestion"]
      }
    }
  });

  const data = JSON.parse(response.text || "{}");
  return { ...data, level, id: Math.random().toString(36).substr(2, 9) };
};

export const evaluateStudentWork = async (task: string, studentDescription: string, projectData?: string): Promise<AIResponse> => {
  const response = await genAI.models.generateContent({
    model,
    contents: `Nhiệm vụ: "${task}"
    Học sinh mô tả cách làm: "${studentDescription || "Không có mô tả văn bản"}"
    ${projectData ? `Dữ liệu cấu trúc dự án Scratch (project.json): "${projectData}"` : "Không có file dự án đính kèm"}
    Hãy đóng vai giáo viên Tin học tiểu học, nhận xét bài làm của học sinh.
    Lưu ý quan trọng: Học sinh có thể chỉ gửi mô tả văn bản HOẶC chỉ gửi file dự án. Hãy nhận xét dựa trên bất kỳ thông tin nào có sẵn. Nếu có cả hai, hãy kết hợp để nhận xét.
    Yêu cầu:
    1. Nhận xét bài làm (đúng/sai/thiếu).
    2. Điểm đúng (những gì học sinh đã làm tốt).
    3. Gợi ý chỉnh sửa (nếu cần).
    4. Câu hỏi giúp em suy nghĩ thêm.
    5. Lời động viên.
    Lưu ý: KHÔNG cung cấp toàn bộ chuỗi lệnh hoàn chỉnh.
    Ngôn ngữ: Nhẹ nhàng, khích lệ, dễ hiểu.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          comment: { type: Type.STRING },
          correctPoints: { type: Type.STRING },
          suggestion: { type: Type.STRING },
          thoughtQuestion: { type: Type.STRING },
          encouragement: { type: Type.STRING }
        },
        required: ["comment", "correctPoints", "suggestion", "thoughtQuestion", "encouragement"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const generateChallenge = async (topicTitle: string, grade: Grade): Promise<Challenge> => {
  const grade4Constraint = grade === 4 ? "Lưu ý: KHÔNG sử dụng kiến thức về vòng lặp (loop) và cảm biến (sensing)." : "";
  const response = await genAI.models.generateContent({
    model,
    contents: `Tạo một thử thách sáng tạo (dự án mini) Scratch cho học sinh lớp ${grade} sau khi học xong chủ đề "${topicTitle}".
    Yêu cầu: Dự án có thể hoàn thành trong 1 tiết học (35-40 phút).
    ${grade4Constraint}
    Bao gồm: Tên thử thách, Mô tả nhiệm vụ.
    Tiêu chí đánh giá bắt buộc (tổng 10 điểm):
    1. Đúng yêu cầu đề bài (4 điểm)
    2. Sử dụng đúng nhóm lệnh cần thiết (3 điểm)
    3. Logic hoạt động chính xác (2 điểm)
    4. Có yếu tố sáng tạo (1 điểm)`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          criteria: { 
            type: Type.ARRAY, 
            items: { 
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                maxPoints: { type: Type.NUMBER }
              },
              required: ["label", "maxPoints"]
            } 
          }
        },
        required: ["title", "description", "criteria"]
      }
    }
  });

  const data = JSON.parse(response.text || "{}");
  return { ...data, id: Math.random().toString(36).substr(2, 9) };
};

export const gradeChallenge = async (challenge: Challenge, studentDescription: string, imageData?: string, projectData?: string): Promise<GradingResult> => {
  const parts: any[] = [
    { text: `Bạn là giáo viên Tin học tiểu học. Hãy chấm điểm bài làm thử thách Scratch của học sinh.
    Thử thách: "${challenge.title}"
    Mô tả thử thách: "${challenge.description}"
    Tiêu chí chấm điểm: ${JSON.stringify(challenge.criteria)}
    
    Bài làm của học sinh (mô tả): "${studentDescription || "Không có mô tả văn bản"}"
    ${projectData ? `Dữ liệu cấu trúc dự án Scratch (project.json): "${projectData}"` : "Không có file dự án đính kèm"}
    
    Lưu ý quan trọng: Học sinh có thể chỉ gửi mô tả văn bản HOẶC chỉ gửi file dự án. Hãy chấm điểm dựa trên bất kỳ thông tin nào có sẵn. Nếu có cả hai, hãy kết hợp để chấm điểm chính xác nhất.
    
    Yêu cầu:
    1. Phân tích nội dung mô tả, hình ảnh (nếu có) hoặc dữ liệu dự án.
    2. Chấm điểm theo từng tiêu chí.
    3. Giải thích vì sao đạt hoặc chưa đạt cho mỗi tiêu chí.
    4. Đưa gợi ý cải thiện cụ thể.
    5. Động viên tích cực.
    
    Phản hồi theo định dạng JSON.` }
  ];

  if (imageData) {
    parts.push({
      inlineData: {
        data: imageData.split(',')[1],
        mimeType: "image/png"
      }
    });
  }

  const response = await genAI.models.generateContent({
    model,
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          scores: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                criterion: { type: Type.STRING },
                score: { type: Type.NUMBER },
                maxScore: { type: Type.NUMBER },
                reason: { type: Type.STRING }
              },
              required: ["criterion", "score", "maxScore", "reason"]
            }
          },
          totalScore: { type: Type.NUMBER },
          generalComment: { type: Type.STRING },
          suggestions: { type: Type.STRING },
          encouragement: { type: Type.STRING }
        },
        required: ["scores", "totalScore", "generalComment", "suggestions", "encouragement"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const analyzeProblem = async (text: string, imageData?: string): Promise<ProblemAnalysis> => {
  const parts: any[] = [
    { text: `Bạn là trợ lý Scratch. Hãy phân tích đề bài sau và hướng dẫn học sinh tiểu học cách làm (không giải hộ hoàn toàn).
    Đề bài văn bản: "${text}"
    Yêu cầu phản hồi theo định dạng JSON với 4 phần:
    1. requirements: Đề bài yêu cầu gì? (Xác định yêu cầu chính)
    2. steps: Các bước em nên thực hiện (Chia nhỏ nhiệm vụ)
    3. commandGroups: Những nhóm lệnh cần sử dụng (sự kiện, chuyển động, hiển thị, lặp, điều kiện, biến...)
    4. guidingQuestions: Câu hỏi gợi mở để em tự làm (Giúp học sinh tự suy nghĩ)` }
  ];

  if (imageData) {
    parts.push({
      inlineData: {
        data: imageData.split(',')[1],
        mimeType: "image/png"
      }
    });
  }

  const response = await genAI.models.generateContent({
    model,
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          requirements: { type: Type.STRING },
          steps: { type: Type.ARRAY, items: { type: Type.STRING } },
          commandGroups: { type: Type.ARRAY, items: { type: Type.STRING } },
          guidingQuestions: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["requirements", "steps", "commandGroups", "guidingQuestions"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const evaluateProblemSolution = async (problemContext: string, projectData: string): Promise<ProblemFeedback> => {
  const response = await genAI.models.generateContent({
    model,
    contents: `Đề bài/Bối cảnh: "${problemContext}"
    Dữ liệu cấu trúc dự án Scratch (project.json): "${projectData}"
    Hãy đóng vai giáo viên Tin học tiểu học, nhận xét bài làm của học sinh dựa trên đề bài đã cho.
    Yêu cầu phản hồi theo định dạng JSON với 3 phần:
    1. comment: Nhận xét (Học sinh đã làm đúng yêu cầu chưa? Những gì làm tốt?)
    2. suggestions: Gợi ý cải thiện (Nếu chưa đúng hoặc có thể làm tốt hơn thì cần sửa gì?)
    3. encouragement: Lời động viên (Khích lệ học sinh tiếp tục cố gắng)
    Ngôn ngữ: Nhẹ nhàng, khích lệ, phù hợp lứa tuổi tiểu học.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          comment: { type: Type.STRING },
          suggestions: { type: Type.STRING },
          encouragement: { type: Type.STRING }
        },
        required: ["comment", "suggestions", "encouragement"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};
