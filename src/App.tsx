/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Code, 
  Trophy, 
  ChevronRight, 
  Sparkles, 
  GraduationCap, 
  ArrowLeft,
  Loader2,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  MessageSquarePlus,
  Image as ImageIcon,
  Send,
  X,
  Award,
  Lightbulb,
  Heart,
  Phone,
  Mail,
  MapPin,
  User,
  Settings,
  ShieldCheck,
  Key,
  AlertTriangle,
  FileCode,
  Upload
} from 'lucide-react';
import JSZip from 'jszip';
import { Grade, Topic, TheoryContent, PracticeExercise, Challenge, AIResponse, ProblemAnalysis, GradingResult, ProblemFeedback } from './types';
import { getTopicsByGrade } from './constants';
import { 
  generateTheoryContent, 
  generatePracticeExercise, 
  evaluateStudentWork, 
  generateChallenge,
  analyzeProblem,
  evaluateProblemSolution,
  gradeChallenge,
  updateApiKey
} from './services/geminiService';

type Tab = 'theory' | 'practice' | 'challenge';

export default function App() {
  const [grade, setGrade] = useState<Grade | null>(null);
  const [isAnalyzingProblem, setIsAnalyzingProblem] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('theory');
  const [practiceLevel, setPracticeLevel] = useState<'Dễ' | 'Vừa' | 'Khó'>('Vừa');
  
  const [theoryContent, setTheoryContent] = useState<TheoryContent | null>(null);
  const [practiceExercise, setPracticeExercise] = useState<PracticeExercise | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [problemAnalysis, setProblemAnalysis] = useState<ProblemAnalysis | null>(null);
  const [gradingResult, setGradingResult] = useState<GradingResult | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [studentInput, setStudentInput] = useState('');
  const [projectFile, setProjectFile] = useState<File | null>(null);
  const [projectJson, setProjectJson] = useState<string | null>(null);
  const [challengeInput, setChallengeInput] = useState('');
  const [challengeProjectFile, setChallengeProjectFile] = useState<File | null>(null);
  const [challengeProjectJson, setChallengeProjectJson] = useState<string | null>(null);
  const [challengeImage, setChallengeImage] = useState<string | null>(null);
  const [problemText, setProblemText] = useState('');
  const [problemImage, setProblemImage] = useState<string | null>(null);
  const [problemProjectFile, setProblemProjectFile] = useState<File | null>(null);
  const [problemProjectJson, setProblemProjectJson] = useState<string | null>(null);
  const [problemFeedback, setProblemFeedback] = useState<ProblemFeedback | null>(null);
  const [aiFeedback, setAiFeedback] = useState<AIResponse | null>(null);
  const [quizResults, setQuizResults] = useState<Record<number, number>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [savedApiKey, setSavedApiKey] = useState<string | null>(null);
  const [settingsMessage, setSettingsMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setSavedApiKey(storedKey);
      updateApiKey(storedKey);
    }
  }, []);

  const handleSaveApiKey = () => {
    if (!apiKeyInput.trim()) {
      setSettingsMessage({ type: 'error', text: 'Vui lòng nhập API Key' });
      return;
    }
    
    // Simple validation: Gemini API keys usually start with AIza
    if (!apiKeyInput.startsWith('AIza')) {
      setSettingsMessage({ type: 'error', text: 'API Key chưa hợp lệ, vui lòng kiểm tra lại' });
      return;
    }

    localStorage.setItem('gemini_api_key', apiKeyInput);
    setSavedApiKey(apiKeyInput);
    updateApiKey(apiKeyInput);
    setSettingsMessage({ type: 'success', text: 'Đã lưu thành công' });
    setApiKeyInput('');
  };

  // Load content when topic, tab or practice level changes
  useEffect(() => {
    if (selectedTopic) {
      loadTabContent(activeTab);
    }
  }, [selectedTopic, activeTab, practiceLevel]);

  const loadTabContent = async (tab: Tab) => {
    if (!selectedTopic) return;
    setLoading(true);
    setAiFeedback(null);
    setGradingResult(null);
    setStudentInput('');
    setProjectFile(null);
    setProjectJson(null);
    setChallengeInput('');
    setChallengeProjectFile(null);
    setChallengeProjectJson(null);
    setChallengeImage(null);
    
    try {
      if (tab === 'theory') {
        const content = await generateTheoryContent(selectedTopic.title, selectedTopic.grade);
        setTheoryContent(content);
        setQuizResults({});
        setShowQuizResults(false);
      } else if (tab === 'practice') {
        const exercise = await generatePracticeExercise(selectedTopic.title, selectedTopic.grade, practiceLevel);
        setPracticeExercise(exercise);
      } else if (tab === 'challenge') {
        const chall = await generateChallenge(selectedTopic.title, selectedTopic.grade);
        setChallenge(chall);
      }
    } catch (error) {
      console.error("Error loading content:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async () => {
    if (!studentInput.trim() && !projectJson && !practiceExercise) return;
    setLoading(true);
    try {
      const feedback = await evaluateStudentWork(practiceExercise?.task || '', studentInput, projectJson || undefined);
      setAiFeedback(feedback);
    } catch (error) {
      console.error("Error evaluating:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeChallenge = async () => {
    if (!challengeInput.trim() && !challengeProjectJson && !challenge) return;
    setLoading(true);
    try {
      const result = await gradeChallenge(challenge!, challengeInput, challengeImage || undefined, challengeProjectJson || undefined);
      setGradingResult(result);
    } catch (error) {
      console.error("Error grading challenge:", error);
    } finally {
      setLoading(false);
    }
  };

  const parseSb3 = async (file: File): Promise<string | null> => {
    try {
      const zip = new JSZip();
      const contents = await zip.loadAsync(file);
      const projectJsonFile = contents.file('project.json');
      if (projectJsonFile) {
        const jsonText = await projectJsonFile.async('text');
        const parsed = JSON.parse(jsonText);
        const simplified = {
          targets: parsed.targets.map((t: any) => ({
            name: t.name,
            variables: t.variables,
            blocks: Object.keys(t.blocks).length
          }))
        };
        return JSON.stringify(simplified);
      }
    } catch (error) {
      console.error("Error parsing .sb3 file:", error);
    }
    return null;
  };

  const handleSb3Upload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'practice' | 'challenge' | 'problem') => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.sb3')) {
      if (type === 'practice') setProjectFile(file);
      else if (type === 'challenge') setChallengeProjectFile(file);
      else setProblemProjectFile(file);
      
      setLoading(true);
      const json = await parseSb3(file);
      if (type === 'practice') setProjectJson(json);
      else if (type === 'challenge') setChallengeProjectJson(json);
      else setProblemProjectJson(json);
      setLoading(false);
    }
  };

  const handleAnalyzeProblem = async () => {
    if (!problemText.trim() && !problemImage) return;
    setLoading(true);
    setProblemProjectFile(null);
    setProblemProjectJson(null);
    setProblemFeedback(null);
    try {
      const analysis = await analyzeProblem(problemText, problemImage || undefined);
      setProblemAnalysis(analysis);
    } catch (error) {
      console.error("Error analyzing problem:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluateProblemSolution = async () => {
    if (!problemProjectJson || !problemAnalysis) return;
    setLoading(true);
    try {
      const context = `Đề bài: ${problemText}. Hướng dẫn AI đã đưa ra: ${JSON.stringify(problemAnalysis)}`;
      const feedback = await evaluateProblemSolution(context, problemProjectJson);
      setProblemFeedback(feedback);
    } catch (error) {
      console.error("Error evaluating problem solution:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'problem' | 'challenge') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'problem') setProblemImage(reader.result as string);
        else setChallengeImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleQuizAnswer = (quizIdx: number, optionIdx: number) => {
    setQuizResults(prev => ({ ...prev, [quizIdx]: optionIdx }));
  };

  const renderHeader = () => (
    <header className="bg-white border-b border-zinc-200 py-6 px-4 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500 p-2 rounded-xl shadow-lg shadow-orange-200">
            <Sparkles className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Scratch Master</h1>
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Ôn tập & Luyện tập Tiểu học</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          {(grade || isAnalyzingProblem || isSettingsOpen) && (
            <button 
              onClick={() => { 
                setGrade(null); 
                setSelectedTopic(null); 
                setIsAnalyzingProblem(false);
                setIsSettingsOpen(false);
                setProblemAnalysis(null);
                setProblemText('');
                setProblemImage(null);
                setSettingsMessage(null);
              }}
              className="flex items-center gap-2 text-sm font-semibold text-zinc-600 hover:text-orange-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại trang chủ
            </button>
          )}
          
          <button 
            onClick={() => {
              setIsSettingsOpen(true);
              setIsAnalyzingProblem(false);
              setGrade(null);
              setSelectedTopic(null);
            }}
            className={`p-2 rounded-xl transition-all ${isSettingsOpen ? 'bg-zinc-100 text-orange-600' : 'text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600'}`}
            title="Cài đặt"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </div>
    </header>
  );

  const renderSettings = () => (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-zinc-900 mb-4 flex items-center justify-center gap-3">
          <Settings className="text-orange-500" /> Cài đặt ứng dụng
        </h2>
        <p className="text-zinc-600">Quản lý kết nối AI và các tùy chỉnh khác.</p>
      </div>

      <div className="space-y-8">
        <section className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
          <h3 className="text-xl font-bold text-zinc-900 mb-6 flex items-center gap-2">
            <Key className="text-blue-500" /> Kết nối AI (Gemini)
          </h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-3">
                {savedApiKey ? 'API Key hiện tại' : 'Nhập API Key của bạn'}
              </label>
              
              {savedApiKey ? (
                <div className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-200 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="text-green-500 w-5 h-5" />
                    <span className="text-zinc-500 font-mono text-sm">••••••••••••••••</span>
                  </div>
                  <button 
                    onClick={() => setSavedApiKey(null)}
                    className="text-sm font-bold text-orange-600 hover:text-orange-700"
                  >
                    Thay đổi API Key
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="Nhập API Key của bạn (bắt đầu bằng AIza...)"
                    className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none text-zinc-700 font-mono"
                  />
                  <button
                    onClick={handleSaveApiKey}
                    className="w-full py-4 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-700 transition-all shadow-lg shadow-orange-200 flex items-center justify-center gap-2"
                  >
                    Lưu API Key
                  </button>
                </div>
              )}
            </div>

            {settingsMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 ${
                  settingsMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}
              >
                {settingsMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                {settingsMessage.text}
              </motion.div>
            )}

            <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
              <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2 text-sm">
                <Lightbulb className="w-4 h-4" /> Hướng dẫn ngắn gọn
              </h4>
              <p className="text-blue-800 text-xs leading-relaxed">
                API Key là một mã định danh duy nhất do Google cung cấp để ứng dụng có thể kết nối với dịch vụ trí tuệ nhân tạo (AI). 
                Việc cung cấp mã này giúp bạn sử dụng các tính năng thông minh của Scratch Master một cách ổn định.
              </p>
            </div>

            <div className="p-6 bg-orange-50 rounded-2xl border border-orange-100">
              <h4 className="font-bold text-orange-900 mb-2 flex items-center gap-2 text-sm">
                <ShieldCheck className="w-4 h-4" /> Lưu ý an toàn
              </h4>
              <ul className="text-orange-800 text-xs space-y-2 list-disc ml-4">
                <li>Không chia sẻ API Key cho người khác để tránh bị lạm dụng.</li>
                <li>Chỉ sử dụng cho mục đích học tập và nghiên cứu cá nhân.</li>
                <li>API Key của bạn được lưu an toàn trên trình duyệt này và không hiển thị công khai.</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );

  const renderGradeSelection = () => (
    <div className="max-w-4xl mx-auto py-16 px-4">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-zinc-900 mb-4">Chào mừng em đến với thế giới Scratch!</h2>
        <p className="text-zinc-600 max-w-lg mx-auto">Hãy chọn lớp học của em hoặc gửi đề bài để AI hướng dẫn cách làm nhé.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {[4, 5].map((g) => (
          <motion.button
            key={g}
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setGrade(g as Grade)}
            className="group relative bg-white p-8 rounded-3xl border-2 border-zinc-100 hover:border-orange-400 shadow-xl shadow-zinc-200/50 transition-all text-left"
          >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors ${g === 4 ? 'bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' : 'bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white'}`}>
              <GraduationCap className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-zinc-900 mb-2">Lớp {g}</h3>
            <p className="text-zinc-500 mb-6">Ôn tập kiến thức và thực hành các dự án Scratch dành cho học sinh lớp {g}.</p>
            <div className="flex items-center text-orange-600 font-bold">
              Bắt đầu ngay <ChevronRight className="w-5 h-5 ml-1" />
            </div>
          </motion.button>
        ))}
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsAnalyzingProblem(true)}
        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 p-8 rounded-3xl text-white shadow-xl shadow-orange-200 flex items-center justify-between group"
      >
        <div className="flex items-center gap-6">
          <div className="bg-white/20 p-4 rounded-2xl">
            <MessageSquarePlus className="w-10 h-10" />
          </div>
          <div className="text-left">
            <h3 className="text-2xl font-bold mb-1">Gửi đề bài để AI hướng dẫn</h3>
            <p className="text-orange-100">Em gặp bài khó? Đừng lo, AI sẽ hướng dẫn em từng bước!</p>
          </div>
        </div>
        <div className="bg-white text-orange-600 p-3 rounded-full group-hover:translate-x-2 transition-transform">
          <ChevronRight className="w-6 h-6" />
        </div>
      </motion.button>
    </div>
  );

  const renderProblemAnalysis = () => (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <button 
        onClick={() => {
          setIsAnalyzingProblem(false);
          setProblemAnalysis(null);
          setProblemText('');
          setProblemImage(null);
          setProblemProjectFile(null);
          setProblemProjectJson(null);
          setProblemFeedback(null);
        }}
        className="mb-8 flex items-center gap-2 text-zinc-500 hover:text-orange-600 font-bold transition-colors"
      >
        <ArrowLeft className="w-5 h-5" /> Quay lại trang chủ
      </button>

      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-zinc-900 mb-4">Hướng dẫn giải bài Scratch</h2>
        <p className="text-zinc-600">Nhập đề bài hoặc tải ảnh lên để AI phân tích và gợi ý cách làm cho em.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
            <label className="block text-sm font-bold text-zinc-700 mb-3">Nhập đề bài Scratch của em</label>
            <textarea
              value={problemText}
              onChange={(e) => setProblemText(e.target.value)}
              placeholder="Ví dụ: Lập trình cho nhân vật mèo di chuyển theo hình vuông..."
              className="w-full h-48 p-6 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none text-zinc-700 mb-6"
            />

            <div className="flex flex-col gap-4">
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'problem')}
                  className="hidden"
                  id="problem-image-upload"
                />
                <label
                  htmlFor="problem-image-upload"
                  className="flex items-center justify-center gap-2 w-full py-4 bg-zinc-100 text-zinc-600 rounded-2xl font-bold hover:bg-zinc-200 cursor-pointer transition-all"
                >
                  <ImageIcon className="w-5 h-5" />
                  {problemImage ? 'Đã chọn ảnh' : 'Tải ảnh chụp đề bài'}
                </label>
                {problemImage && (
                  <button 
                    onClick={() => setProblemImage(null)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {problemImage && (
                <div className="relative rounded-2xl overflow-hidden border border-zinc-200">
                  <img src={problemImage} alt="Problem" className="w-full h-32 object-cover" />
                </div>
              )}

              <button
                onClick={handleAnalyzeProblem}
                disabled={(!problemText.trim() && !problemImage) || loading}
                className="w-full py-4 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-700 disabled:opacity-50 transition-all shadow-lg shadow-orange-200 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                Phân tích đề bài
              </button>
            </div>
          </div>

          {problemAnalysis && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6 mt-8"
              >
                <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                  <Code className="text-orange-500" /> Nộp bài làm để AI nhận xét
                </h3>
                <p className="text-zinc-500 text-sm">Sau khi xem hướng dẫn, em hãy thử làm và gửi file .sb3 để AI xem giúp nhé!</p>
                
                <div className="relative h-40">
                  <input
                    type="file"
                    accept=".sb3"
                    onChange={(e) => handleSb3Upload(e, 'problem')}
                    className="hidden"
                    id="problem-sb3-upload"
                  />
                  <label
                    htmlFor="problem-sb3-upload"
                    className={`flex flex-col items-center justify-center gap-3 w-full h-full border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                      problemProjectFile 
                        ? 'bg-orange-50 border-orange-300 text-orange-700' 
                        : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100 hover:border-zinc-300'
                    }`}
                  >
                    {problemProjectFile ? (
                      <>
                        <FileCode className="w-10 h-10" />
                        <div className="text-center">
                          <p className="font-bold text-sm truncate max-w-[200px]">{problemProjectFile.name}</p>
                          <p className="text-xs opacity-70">Nhấp để thay đổi file</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <Upload className="w-10 h-10 opacity-40" />
                        <div className="text-center">
                          <p className="font-bold text-sm">Chọn file Scratch (.sb3)</p>
                          <p className="text-xs opacity-70">Tải lên bài làm của em</p>
                        </div>
                      </>
                    )}
                  </label>
                  {problemProjectFile && (
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        setProblemProjectFile(null);
                        setProblemProjectJson(null);
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  onClick={handleEvaluateProblemSolution}
                  disabled={!problemProjectJson || loading}
                  className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  Kiểm tra bài làm
                </button>

                {problemFeedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 pt-4"
                  >
                    <div className="p-6 bg-green-50 rounded-2xl border border-green-100">
                      <h4 className="font-bold text-green-900 mb-2 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Nhận xét:
                      </h4>
                      <p className="text-green-800 text-sm leading-relaxed">{problemFeedback.comment}</p>
                    </div>
                    <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                      <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" /> Gợi ý cải thiện:
                      </h4>
                      <p className="text-blue-800 text-sm leading-relaxed">{problemFeedback.suggestions}</p>
                    </div>
                    <div className="p-6 bg-pink-50 rounded-2xl border border-pink-100">
                      <h4 className="font-bold text-pink-900 mb-2 flex items-center gap-2">
                        <Heart className="w-4 h-4" /> Lời động viên:
                      </h4>
                      <p className="text-pink-800 text-sm font-medium italic">"{problemFeedback.encouragement}"</p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>

          <div className="space-y-6">
          {problemAnalysis ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
                <h3 className="text-xl font-bold text-zinc-900 mb-4 flex items-center gap-2">
                  <HelpCircle className="text-orange-500" /> Đề bài yêu cầu gì?
                </h3>
                <p className="text-zinc-600 leading-relaxed">{problemAnalysis.requirements}</p>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
                <h3 className="text-xl font-bold text-zinc-900 mb-4 flex items-center gap-2">
                  <ChevronRight className="text-blue-500" /> Các bước em nên thực hiện
                </h3>
                <ul className="space-y-3">
                  {problemAnalysis.steps.map((step, i) => (
                    <li key={i} className="flex gap-3 text-zinc-700 text-sm">
                      <span className="font-bold text-blue-500">{i + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
                <h3 className="text-xl font-bold text-zinc-900 mb-4 flex items-center gap-2">
                  <Code className="text-purple-500" /> Những nhóm lệnh cần sử dụng
                </h3>
                <div className="flex flex-wrap gap-2">
                  {problemAnalysis.commandGroups.map((group, i) => (
                    <span key={i} className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-xl text-xs font-bold border border-purple-100">
                      {group}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-orange-50 p-8 rounded-3xl border border-orange-100 shadow-sm">
                <h3 className="text-xl font-bold text-orange-900 mb-4 flex items-center gap-2">
                  <Sparkles className="text-orange-500" /> Câu hỏi gợi mở để em tự làm
                </h3>
                <ul className="space-y-3">
                  {problemAnalysis.guidingQuestions.map((q, i) => (
                    <li key={i} className="flex gap-3 text-orange-800 text-sm italic">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                      {q}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-zinc-100 rounded-3xl border-2 border-dashed border-zinc-200 text-zinc-400">
              <MessageSquarePlus className="w-16 h-16 mb-4 opacity-20" />
              <p className="font-medium">Kết quả phân tích sẽ hiển thị ở đây</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderTopicSelection = () => (
    <div className="max-w-5xl mx-auto py-12 px-4">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-zinc-900">Chủ đề học tập - Lớp {grade}</h2>
        <span className="bg-zinc-100 text-zinc-600 px-4 py-1 rounded-full text-sm font-bold">
          {getTopicsByGrade(grade!).length} Chủ đề
        </span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {getTopicsByGrade(grade!).map((topic) => (
          <motion.button
            key={topic.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedTopic(topic)}
            className="bg-white p-6 rounded-2xl border border-zinc-200 hover:shadow-lg transition-all text-left flex flex-col h-full"
          >
            <h3 className="text-lg font-bold text-zinc-900 mb-2">{topic.title}</h3>
            <p className="text-sm text-zinc-500 flex-grow">{topic.description}</p>
            <div className="mt-4 pt-4 border-t border-zinc-50 flex items-center justify-between text-orange-600 font-semibold text-sm">
              Xem chi tiết <ChevronRight className="w-4 h-4" />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    if (!selectedTopic) return null;

    return (
      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => setSelectedTopic(null)}
            className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-zinc-600" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-zinc-900">{selectedTopic.title}</h2>
            <p className="text-zinc-500 text-sm">Lớp {grade} • {selectedTopic.description}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-zinc-100 rounded-2xl mb-8">
          {[
            { id: 'theory', label: 'Ôn tập lý thuyết', icon: BookOpen },
            { id: 'practice', label: 'Luyện tập thực hành', icon: Code },
            { id: 'challenge', label: 'Thử thách sáng tạo', icon: Trophy },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-white text-orange-600 shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px] relative">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm rounded-3xl z-20">
              <Loader2 className="w-10 h-10 text-orange-600 animate-spin mb-4" />
              <p className="text-zinc-600 font-medium">AI đang chuẩn bị nội dung cho em...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'theory' && theoryContent && (
                  <div className="space-y-8">
                    <section className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
                      <h3 className="text-xl font-bold text-zinc-900 mb-6 flex items-center gap-2">
                        <BookOpen className="text-blue-500" /> Tóm tắt kiến thức
                      </h3>
                      <ul className="space-y-4">
                        {theoryContent.summary.map((item, i) => (
                          <li key={i} className="flex gap-3 text-zinc-700 leading-relaxed">
                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                      
                      <div className="mt-8 p-6 bg-blue-50 rounded-2xl border border-blue-100">
                        <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                          <Sparkles className="w-4 h-4" /> Ví dụ minh họa
                        </h4>
                        <p className="text-blue-800 text-sm italic leading-relaxed">{theoryContent.example}</p>
                      </div>
                    </section>

                    <section className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
                      <h3 className="text-xl font-bold text-zinc-900 mb-6 flex items-center gap-2">
                        <CheckCircle2 className="text-green-500" /> Kiểm tra nhanh
                      </h3>
                      <div className="space-y-8">
                        {theoryContent.quizzes.map((quiz, qIdx) => (
                          <div key={qIdx} className="space-y-4">
                            <p className="font-bold text-zinc-800">{qIdx + 1}. {quiz.question}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {quiz.options.map((option, oIdx) => (
                                <button
                                  key={oIdx}
                                  onClick={() => handleQuizAnswer(qIdx, oIdx)}
                                  className={`p-4 rounded-xl text-left text-sm transition-all border-2 ${
                                    quizResults[qIdx] === oIdx
                                      ? 'border-orange-500 bg-orange-50 text-orange-900'
                                      : 'border-zinc-100 bg-zinc-50 hover:border-zinc-200 text-zinc-700'
                                  }`}
                                >
                                  {option}
                                </button>
                              ))}
                            </div>
                            {showQuizResults && (
                              <div className={`p-4 rounded-xl text-sm ${quizResults[qIdx] === quiz.correctAnswer ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                                <p className="font-bold mb-1">
                                  {quizResults[qIdx] === quiz.correctAnswer ? 'Chính xác!' : 'Chưa đúng rồi.'}
                                </p>
                                <p>{quiz.explanation}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      {!showQuizResults && (
                        <button
                          onClick={() => setShowQuizResults(true)}
                          className="mt-8 w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all"
                        >
                          Kiểm tra kết quả
                        </button>
                      )}
                    </section>
                  </div>
                )}

                {activeTab === 'practice' && practiceExercise && (
                  <div className="space-y-8">
                    {/* Level Selection */}
                    <div className="flex gap-4 p-1 bg-zinc-100 rounded-2xl w-fit mx-auto">
                      {(['Dễ', 'Vừa', 'Khó'] as const).map((lvl) => (
                        <button
                          key={lvl}
                          onClick={() => setPracticeLevel(lvl)}
                          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                            practiceLevel === lvl 
                              ? 'bg-white text-orange-600 shadow-sm' 
                              : 'text-zinc-500 hover:text-zinc-700'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>

                    <section className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                          <Code className="text-orange-500" /> {practiceExercise.title}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          practiceExercise.level === 'Dễ' ? 'bg-green-100 text-green-700' :
                          practiceExercise.level === 'Vừa' ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          Mức độ: {practiceExercise.level}
                        </span>
                      </div>
                      
                      <div className="space-y-6">
                        <div>
                          <h4 className="font-bold text-zinc-800 mb-2">Yêu cầu nhiệm vụ:</h4>
                          <p className="text-zinc-600 leading-relaxed">{practiceExercise.task}</p>
                        </div>

                        <div>
                          <h4 className="font-bold text-zinc-800 mb-2">Mục tiêu cần đạt:</h4>
                          <p className="text-zinc-600 leading-relaxed">{practiceExercise.goal}</p>
                        </div>

                        <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                          <h4 className="font-bold text-zinc-800 mb-3 flex items-center gap-2">
                            <HelpCircle className="w-4 h-4 text-zinc-400" /> Gợi ý nhóm lệnh:
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {practiceExercise.hints.map((hint, i) => (
                              <span key={i} className="bg-white border border-zinc-200 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 shadow-sm">
                                {hint}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="p-6 bg-orange-50 rounded-2xl border border-orange-100">
                          <h4 className="font-bold text-orange-900 mb-2">Câu hỏi định hướng:</h4>
                          <p className="text-orange-800 text-sm italic">{practiceExercise.guidingQuestion}</p>
                        </div>
                      </div>
                    </section>

                    <section className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
                      <h3 className="text-xl font-bold text-zinc-900 mb-4">Nộp bài làm của em</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-4">
                          <label className="block text-sm font-bold text-zinc-700">Mô tả cách làm hoặc ý tưởng</label>
                          <textarea
                            value={studentInput}
                            onChange={(e) => setStudentInput(e.target.value)}
                            placeholder="Ví dụ: Đầu tiên em chọn lệnh Sự kiện 'Khi bấm vào lá cờ xanh', sau đó..."
                            className="w-full h-40 p-6 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none text-zinc-700"
                          />
                        </div>

                        <div className="space-y-4">
                          <label className="block text-sm font-bold text-zinc-700">Tải lên file dự án (.sb3)</label>
                          <div className="relative h-40">
                            <input
                              type="file"
                              accept=".sb3"
                              onChange={(e) => handleSb3Upload(e, 'practice')}
                              className="hidden"
                              id="sb3-upload"
                            />
                            <label
                              htmlFor="sb3-upload"
                              className={`flex flex-col items-center justify-center gap-3 w-full h-full border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                                projectFile 
                                  ? 'bg-orange-50 border-orange-300 text-orange-700' 
                                  : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100 hover:border-zinc-300'
                              }`}
                            >
                              {projectFile ? (
                                <>
                                  <FileCode className="w-10 h-10" />
                                  <div className="text-center">
                                    <p className="font-bold text-sm truncate max-w-[200px]">{projectFile.name}</p>
                                    <p className="text-xs opacity-70">Nhấp để thay đổi file</p>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <Upload className="w-10 h-10 opacity-40" />
                                  <div className="text-center">
                                    <p className="font-bold text-sm">Chọn file Scratch (.sb3)</p>
                                    <p className="text-xs opacity-70">Kéo thả hoặc nhấp để tải lên</p>
                                  </div>
                                </>
                              )}
                            </label>
                            {projectFile && (
                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  setProjectFile(null);
                                  setProjectJson(null);
                                }}
                                className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <button
                          onClick={handleEvaluate}
                          disabled={(!studentInput.trim() && !projectFile) || loading}
                          className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-700 disabled:opacity-50 transition-all shadow-lg shadow-orange-200"
                        >
                          Kiểm tra bài làm
                        </button>
                        <button
                          onClick={() => loadTabContent('practice')}
                          className="px-6 py-4 bg-zinc-100 text-zinc-600 rounded-2xl font-bold hover:bg-zinc-200 transition-all flex items-center gap-2"
                        >
                          <RefreshCw className="w-5 h-5" /> Bài khác
                        </button>
                      </div>

                      {aiFeedback && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-8 space-y-4"
                        >
                          <div className="p-6 bg-green-50 rounded-2xl border border-green-100">
                            <h4 className="font-bold text-green-900 mb-2 flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4" /> Nhận xét bài làm:
                            </h4>
                            <p className="text-green-800 text-sm">{aiFeedback.comment}</p>
                          </div>
                          <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                            <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                              <Award className="w-4 h-4" /> Điểm đúng:
                            </h4>
                            <p className="text-blue-800 text-sm">{aiFeedback.correctPoints}</p>
                          </div>
                          <div className="p-6 bg-orange-50 rounded-2xl border border-orange-100">
                            <h4 className="font-bold text-orange-900 mb-2 flex items-center gap-2">
                              <Lightbulb className="w-4 h-4" /> Gợi ý chỉnh sửa:
                            </h4>
                            <p className="text-orange-800 text-sm">{aiFeedback.suggestion}</p>
                          </div>
                          <div className="p-6 bg-purple-50 rounded-2xl border border-purple-100">
                            <h4 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
                              <HelpCircle className="w-4 h-4" /> Câu hỏi giúp em suy nghĩ thêm:
                            </h4>
                            <p className="text-purple-800 text-sm italic">{aiFeedback.thoughtQuestion}</p>
                          </div>
                          <div className="p-6 bg-pink-50 rounded-2xl border border-pink-100">
                            <h4 className="font-bold text-pink-900 mb-2 flex items-center gap-2">
                              <Heart className="w-4 h-4" /> Lời động viên:
                            </h4>
                            <p className="text-pink-800 text-sm font-medium italic">"{aiFeedback.encouragement}"</p>
                          </div>
                        </motion.div>
                      )}
                    </section>
                  </div>
                )}

                {activeTab === 'challenge' && challenge && (
                  <div className="space-y-8">
                    <section className="bg-zinc-900 text-white p-10 rounded-[2.5rem] relative overflow-hidden shadow-2xl">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/20 blur-[100px] -mr-32 -mt-32" />
                      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 blur-[100px] -ml-32 -mb-32" />
                      
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                          <div className="inline-flex items-center gap-2 bg-orange-500 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
                            <Trophy className="w-3 h-3" /> Thử thách sáng tạo
                          </div>
                          <button 
                            onClick={() => loadTabContent('challenge')}
                            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-bold"
                          >
                            <RefreshCw className="w-4 h-4" /> Đổi thử thách khác
                          </button>
                        </div>
                        
                        <h3 className="text-3xl font-bold mb-4">{challenge.title}</h3>
                        <p className="text-zinc-400 text-lg leading-relaxed mb-10 max-w-2xl">
                          {challenge.description}
                        </p>
                        
                        <div className="space-y-4">
                          <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Tiêu chí đánh giá (Tổng 10 điểm)</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {challenge.criteria.map((criterion, i) => (
                              <div key={i} className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl">
                                <div className="text-orange-400 font-bold text-lg mb-1">{criterion.maxPoints}đ</div>
                                <p className="text-xs font-medium text-zinc-300">{criterion.label}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
                      <h3 className="text-xl font-bold text-zinc-900 mb-4">Gửi bài làm của em</h3>
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <label className="block text-sm font-bold text-zinc-700">Mô tả cách em xây dựng chương trình</label>
                            <textarea
                              value={challengeInput}
                              onChange={(e) => setChallengeInput(e.target.value)}
                              placeholder="Hãy kể cho AI nghe em đã lập trình dự án này như thế nào nhé..."
                              className="w-full h-48 p-6 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none text-zinc-700"
                            />
                          </div>

                          <div className="space-y-4">
                            <label className="block text-sm font-bold text-zinc-700">Tải lên file dự án (.sb3)</label>
                            <div className="relative h-48">
                              <input
                                type="file"
                                accept=".sb3"
                                onChange={(e) => handleSb3Upload(e, 'challenge')}
                                className="hidden"
                                id="challenge-sb3-upload"
                              />
                              <label
                                htmlFor="challenge-sb3-upload"
                                className={`flex flex-col items-center justify-center gap-3 w-full h-full border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                                  challengeProjectFile 
                                    ? 'bg-orange-50 border-orange-300 text-orange-700' 
                                    : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100 hover:border-zinc-300'
                                }`}
                              >
                                {challengeProjectFile ? (
                                  <>
                                    <FileCode className="w-10 h-10" />
                                    <div className="text-center">
                                      <p className="font-bold text-sm truncate max-w-[200px]">{challengeProjectFile.name}</p>
                                      <p className="text-xs opacity-70">Nhấp để thay đổi file</p>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <Upload className="w-10 h-10 opacity-40" />
                                    <div className="text-center">
                                      <p className="font-bold text-sm">Chọn file Scratch (.sb3)</p>
                                      <p className="text-xs opacity-70">Kéo thả hoặc nhấp để tải lên</p>
                                    </div>
                                  </>
                                )}
                              </label>
                              {challengeProjectFile && (
                                <button 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setChallengeProjectFile(null);
                                    setChallengeProjectJson(null);
                                  }}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, 'challenge')}
                              className="hidden"
                              id="challenge-image-upload"
                            />
                            <label
                              htmlFor="challenge-image-upload"
                              className="flex items-center justify-center gap-2 w-full py-4 bg-zinc-100 text-zinc-600 rounded-2xl font-bold hover:bg-zinc-200 cursor-pointer transition-all"
                            >
                              <ImageIcon className="w-5 h-5" />
                              {challengeImage ? 'Đã chọn ảnh chụp màn hình' : 'Tải ảnh chụp màn hình dự án'}
                            </label>
                            {challengeImage && (
                              <button 
                                onClick={() => setChallengeImage(null)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          <button
                            onClick={handleGradeChallenge}
                            disabled={(!challengeInput.trim() && !challengeProjectFile) || loading}
                            className="py-4 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-700 disabled:opacity-50 transition-all shadow-lg shadow-orange-200 flex items-center justify-center gap-2"
                          >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Award className="w-5 h-5" />}
                            Gửi bài để AI chấm
                          </button>
                        </div>

                        {challengeImage && (
                          <div className="relative rounded-2xl overflow-hidden border border-zinc-200 max-w-md">
                            <img src={challengeImage} alt="Challenge Submission" className="w-full h-auto" />
                          </div>
                        )}
                      </div>
                    </section>

                    {gradingResult && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                      >
                        <section className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
                          <h3 className="text-2xl font-bold text-zinc-900 mb-6 flex items-center gap-2">
                            <Award className="text-orange-500" /> Kết quả chấm bài
                          </h3>
                          
                          <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100 mb-8">
                            <h4 className="font-bold text-zinc-800 mb-2">Nhận xét chung:</h4>
                            <p className="text-zinc-600 text-sm leading-relaxed">{gradingResult.generalComment}</p>
                          </div>

                          <div className="overflow-x-auto mb-8">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="border-b border-zinc-200">
                                  <th className="py-4 px-4 text-sm font-bold text-zinc-500 uppercase tracking-wider">Tiêu chí</th>
                                  <th className="py-4 px-4 text-sm font-bold text-zinc-500 uppercase tracking-wider">Điểm</th>
                                  <th className="py-4 px-4 text-sm font-bold text-zinc-500 uppercase tracking-wider">Lý do</th>
                                </tr>
                              </thead>
                              <tbody>
                                {gradingResult.scores.map((score, i) => (
                                  <tr key={i} className="border-b border-zinc-50 last:border-0">
                                    <td className="py-4 px-4 text-sm font-bold text-zinc-800">{score.criterion}</td>
                                    <td className="py-4 px-4">
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                                        {score.score} / {score.maxScore}
                                      </span>
                                    </td>
                                    <td className="py-4 px-4 text-sm text-zinc-600">{score.reason}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-8 bg-zinc-900 rounded-[2rem] text-white">
                            <div>
                              <p className="text-zinc-400 text-sm font-bold uppercase tracking-widest mb-1">Tổng điểm</p>
                              <div className="text-5xl font-black text-orange-500">{gradingResult.totalScore}<span className="text-2xl text-zinc-600">/10</span></div>
                            </div>
                            <div className="flex-1 text-center sm:text-right">
                              <p className="text-zinc-300 italic font-medium leading-relaxed">"{gradingResult.encouragement}"</p>
                            </div>
                          </div>
                        </section>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-blue-50 p-8 rounded-3xl border border-blue-100">
                            <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                              <Lightbulb className="w-5 h-5" /> Gợi ý cải thiện:
                            </h4>
                            <p className="text-blue-800 text-sm leading-relaxed">{gradingResult.suggestions}</p>
                          </div>
                          <div className="bg-pink-50 p-8 rounded-3xl border border-pink-100">
                            <h4 className="font-bold text-pink-900 mb-4 flex items-center gap-2">
                              <Heart className="w-5 h-5" /> Lời khen từ AI:
                            </h4>
                            <p className="text-pink-800 text-sm leading-relaxed">{gradingResult.encouragement}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans selection:bg-orange-100 selection:text-orange-900">
      {renderHeader()}
      
      <main>
        {isSettingsOpen ? (
          renderSettings()
        ) : isAnalyzingProblem ? (
          renderProblemAnalysis()
        ) : !grade ? (
          renderGradeSelection()
        ) : !selectedTopic ? (
          renderTopicSelection()
        ) : (
          renderContent()
        )}
      </main>

      <footer className="py-16 px-4 border-t border-zinc-200 mt-20 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                <Sparkles className="text-orange-500 w-5 h-5" />
                Scratch Master AI
              </h4>
              <p className="text-zinc-500 text-sm leading-relaxed max-w-sm">
                Trợ lý học tập thông minh giúp học sinh Tiểu học Việt Nam tiếp cận lập trình Scratch một cách dễ dàng và thú vị hơn.
              </p>
            </div>
            
            <div className="space-y-6">
              <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Thông tin liên hệ</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="bg-zinc-100 p-2 rounded-lg text-zinc-600">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400 font-bold uppercase">Giáo viên phụ trách</p>
                    <p className="text-sm font-bold text-zinc-800">Vũ Đức Thiện</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-zinc-100 p-2 rounded-lg text-zinc-600">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400 font-bold uppercase">Số điện thoại</p>
                    <p className="text-sm font-bold text-zinc-800">0352945168</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-zinc-100 p-2 rounded-lg text-zinc-600">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400 font-bold uppercase">Email</p>
                    <p className="text-sm font-bold text-zinc-800">vdthien030295@tuyenquang.edu.vn</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-zinc-100 text-center">
            <p className="text-zinc-400 text-xs font-medium">
              &copy; 2026 Scratch Master AI Assistant. Được thiết kế cho học sinh Tiểu học Việt Nam.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
