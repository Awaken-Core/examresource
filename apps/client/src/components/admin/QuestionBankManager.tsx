import React, { useState, useEffect, useMemo } from "react";
import {
  adminApi,
  type AdminQuestion,
  type AdminSubject,
  type AdminChapter,
  type AdminTestSeries,
} from "./api";
import { useAdminToast } from "./AdminToast";

interface QuestionBankManagerProps {
  currentUserRole?: string;
}

export function QuestionBankManager({
  currentUserRole,
}: QuestionBankManagerProps) {
  const { showToast } = useAdminToast();
  const isAdmin = currentUserRole === "admin";

  // Questions and query states
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedDifficulty, setSelectedDifficulty] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedSubjectId, setSelectedSubjectId] = useState("ALL");
  const [selectedChapterId, setSelectedChapterId] = useState("ALL");
  const [selectedAvailability, setSelectedAvailability] = useState<
    "ALL" | "true" | "false"
  >("ALL");

  // Supporting hierarchy data
  const [subjects, setSubjects] = useState<AdminSubject[]>([]);
  const [seriesList, setSeriesList] = useState<AdminTestSeries[]>([]);
  const [mappingSubjects, setMappingSubjects] = useState<AdminSubject[]>([]);
  const [allChapters, setAllChapters] = useState<AdminChapter[]>([]);
  const [availableChapters, setAvailableChapters] = useState<AdminChapter[]>(
    [],
  );

  // Bulk Import Target Assignment
  const [bulkTargetSubjectId, setBulkTargetSubjectId] = useState("");
  const [bulkTargetSubjectName, setBulkTargetSubjectName] = useState("");
  const [bulkTargetChapterId, setBulkTargetChapterId] = useState("");
  const [bulkTargetChapterName, setBulkTargetChapterName] = useState("");

  // Single Question Custom input toggle flags
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [isCustomTopic, setIsCustomTopic] = useState(false);

  // Pagination
  const [limit] = useState(25);
  const [offset, setOffset] = useState(0);

  // Question CRUD Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<AdminQuestion | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);

  // Mapping Drawer / Modal
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
  const [activeQuestionForMapping, setActiveQuestionForMapping] =
    useState<AdminQuestion | null>(null);
  const [mappingSeriesId, setMappingSeriesId] = useState("");
  const [mappingSubjectId, setMappingSubjectId] = useState("");
  const [mappingChapterId, setMappingChapterId] = useState("");
  const [isSavingMapping, setIsSavingMapping] = useState(false);

  // Bulk Import Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState("");
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importPreviewCount, setImportPreviewCount] = useState(0);
  const [isImporting, setIsImporting] = useState(false);

  // AI Question Generator state
  const [isAiGenModalOpen, setIsAiGenModalOpen] = useState(false);
  const [aiExamName, setAiExamName] = useState("SSC CGL");
  const [aiSubject, setAiSubject] = useState("");
  const [aiTopic, setAiTopic] = useState("");
  const [aiDifficulty, setAiDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium",
  );
  const [aiCount, setAiCount] = useState(5);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [generatedAiQuestions, setGeneratedAiQuestions] = useState<any[]>([]);

  // 1-Click AI Translate & Explain state
  const [isTranslatingAi, setIsTranslatingAi] = useState(false);

  // AI Raw Text Parsing state in Bulk Import
  const [isParsingRawAi, setIsParsingRawAi] = useState(false);

  // Bulk Import Format tab state
  const [importFormat, setImportFormat] = useState<
    "csv" | "aiken" | "json" | "ai_raw"
  >("csv");

  // Form Fields for single question
  const [formContent, setFormContent] = useState("");
  const [formContentHi, setFormContentHi] = useState("");
  const [formType, setFormType] = useState<
    "single_choice" | "multiple_choice" | "numerical"
  >("single_choice");
  const [formNumericalAnswer, setFormNumericalAnswer] = useState("");
  const [formDifficulty, setFormDifficulty] = useState<
    "easy" | "medium" | "hard"
  >("medium");
  const [formStatus, setFormStatus] = useState<
    "draft" | "published" | "archived"
  >("published");
  const [formSubjectName, setFormSubjectName] = useState("");
  const [formSubjectId, setFormSubjectId] = useState("");
  const [formChapterId, setFormChapterId] = useState("");
  const [formTopic, setFormTopic] = useState("");
  const [formMarks, setFormMarks] = useState(1);
  const [formNegativeMarks, setFormNegativeMarks] = useState(0.25);
  const [formExplanation, setFormExplanation] = useState("");
  const [formExplanationHi, setFormExplanationHi] = useState("");
  const [formTags, setFormTags] = useState("");
  const [formIsAvailable, setFormIsAvailable] = useState(true);

  // Options state
  const [formOptions, setFormOptions] = useState<
    Array<{
      content: string;
      contentHi?: string;
      isCorrect: boolean;
      imageUrl?: string | null;
    }>
  >([
    { content: "", isCorrect: true },
    { content: "", isCorrect: false },
    { content: "", isCorrect: false },
    { content: "", isCorrect: false },
  ]);

  // Load initial subjects & series & all chapters for dropdowns
  useEffect(() => {
    async function loadMetadata() {
      try {
        const [subs, series, chaps] = await Promise.all([
          adminApi.getSubjects(),
          adminApi.getTestSeries(),
          adminApi.getAllChapters(),
        ]);
        setSubjects(subs || []);
        setSeriesList(series || []);
        setAllChapters(chaps || []);
        if (subs && subs.length > 0) {
          const firstSub = subs[0];
          const firstSubId = firstSub.id || firstSub._id || "";
          setBulkTargetSubjectId(firstSubId);
          setBulkTargetSubjectName(firstSub.name || "");
        }
      } catch (err: any) {
        showToast(err.message || "Failed to load reference subjects", "error");
      }
    }
    loadMetadata();
  }, []);

  // Filtered chapters for bulk import
  const bulkAvailableChapters = useMemo(() => {
    if (!bulkTargetSubjectId) return allChapters;
    return allChapters.filter((c) => c.subjectId === bulkTargetSubjectId);
  }, [allChapters, bulkTargetSubjectId]);

  // Filtered chapters for single question form
  const formAvailableChapters = useMemo(() => {
    if (!formSubjectId) return allChapters;
    return allChapters.filter((c) => c.subjectId === formSubjectId);
  }, [allChapters, formSubjectId]);

  // Filtered chapters for main filter bar
  const filterChapters = useMemo(() => {
    if (selectedSubjectId === "ALL") return allChapters;
    return allChapters.filter((c) => c.subjectId === selectedSubjectId);
  }, [allChapters, selectedSubjectId]);

  // Load only hierarchy entries assigned to the selected mapping series.
  useEffect(() => {
    async function loadMappingHierarchy() {
      if (!mappingSeriesId) {
        setMappingSubjects([]);
        setAvailableChapters([]);
        return;
      }

      try {
        const assignments = await adminApi.getSeriesSubjects(mappingSeriesId);
        const assignedSubjects = (assignments || [])
          .map((assignment) =>
            subjects.find(
              (subject) => (subject.id || subject._id) === assignment.subjectId,
            ),
          )
          .filter((subject): subject is AdminSubject => Boolean(subject));
        setMappingSubjects(assignedSubjects);

        const nextSubjectId = assignedSubjects.some(
          (subject) => (subject.id || subject._id) === mappingSubjectId,
        )
          ? mappingSubjectId
          : assignedSubjects[0]?.id || assignedSubjects[0]?._id || "";
        if (nextSubjectId !== mappingSubjectId)
          setMappingSubjectId(nextSubjectId);

        if (nextSubjectId) {
          const chapters = await adminApi.getSeriesChapters(
            mappingSeriesId,
            nextSubjectId,
          );
          setAvailableChapters(chapters || []);
        } else {
          setAvailableChapters([]);
        }
      } catch {
        setMappingSubjects([]);
        setAvailableChapters([]);
      }
    }
    loadMappingHierarchy();
  }, [mappingSeriesId, mappingSubjectId, subjects]);

  useEffect(() => {
    if (!availableChapters.length) return;
    const currentChapterExists = availableChapters.some(
      (chapter) => (chapter.id || chapter._id) === mappingChapterId,
    );
    if (!currentChapterExists) {
      const matchingChapter = availableChapters.find(
        (chapter) =>
          chapter.name.trim().toLowerCase() ===
          activeQuestionForMapping?.topic?.trim().toLowerCase(),
      );
      setMappingChapterId(matchingChapter?.id || matchingChapter?._id || "");
    }
  }, [availableChapters, mappingChapterId, activeQuestionForMapping]);

  // Fetch Questions
  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.searchQuestions({
        search: search.trim() || undefined,
        type: selectedType,
        difficulty: selectedDifficulty,
        status: selectedStatus,
        subjectId: selectedSubjectId !== "ALL" ? selectedSubjectId : undefined,
        chapterId: selectedChapterId !== "ALL" ? selectedChapterId : undefined,
        isAvailableForNewTests:
          selectedAvailability !== "ALL" ? selectedAvailability : undefined,
        limit,
        offset,
      });
      setQuestions(res.questions || []);
      setTotalCount(res.total || 0);
    } catch (err: any) {
      showToast(
        err.message || "Failed to load questions from Question Bank",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const autoMapCreatedQuestions = async (createdQuestions: AdminQuestion[]) => {
    const mappings = createdQuestions.flatMap((question) => {
      const chapter = allChapters.find(
        (item) =>
          (item.id || item._id) === question.chapterId &&
          item.subjectId === question.subjectId,
      );
      const questionId = question.id || question._id;
      const chapterId = chapter?.id || chapter?._id;
      if (!chapter?.testSeriesId || !chapterId || !questionId) return [];
      return [
        {
          questionId,
          testSeriesId: chapter.testSeriesId,
          subjectId: chapter.subjectId,
          chapterId,
        },
      ];
    });
    const results = await Promise.allSettled(
      mappings.map((mapping) => adminApi.createQuestionMapping(mapping)),
    );
    return {
      mapped: results.filter((result) => result.status === "fulfilled").length,
      failed: results.filter((result) => result.status === "rejected").length,
    };
  };

  useEffect(() => {
    fetchQuestions();
  }, [
    offset,
    selectedType,
    selectedDifficulty,
    selectedStatus,
    selectedAvailability,
    selectedSubjectId,
    selectedChapterId,
  ]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
    fetchQuestions();
  };

  // Open Create Modal
  const openCreateModal = () => {
    setEditingQuestion(null);
    setIsCustomSubject(false);
    setIsCustomTopic(false);

    const filterChapter =
      selectedChapterId !== "ALL"
        ? allChapters.find(
            (chapter) => (chapter.id || chapter._id) === selectedChapterId,
          )
        : undefined;
    const initialSub =
      subjects.find(
        (subject) => (subject.id || subject._id) === selectedSubjectId,
      ) ||
      subjects.find(
        (subject) => (subject.id || subject._id) === filterChapter?.subjectId,
      ) ||
      subjects[0];
    const initialSubId = initialSub?.id || initialSub?._id || "";
    const initialSubName = initialSub?.name || "Quantitative Aptitude";
    const initialChap =
      filterChapter?.subjectId === initialSubId ? filterChapter : undefined;

    setFormContent("");
    setFormContentHi("");
    setFormType("single_choice");
    setFormNumericalAnswer("");
    setFormDifficulty("medium");
    setFormStatus("published");
    setFormSubjectName(initialSubName);
    setFormSubjectId(initialSubId);
    setFormChapterId(initialChap?.id || initialChap?._id || "");
    setFormTopic(initialChap?.name || "");
    setFormMarks(1);
    setFormNegativeMarks(0.25);
    setFormExplanation("");
    setFormExplanationHi("");
    setFormTags("");
    setFormIsAvailable(true);
    setFormOptions([
      { content: "", isCorrect: true },
      { content: "", isCorrect: false },
      { content: "", isCorrect: false },
      { content: "", isCorrect: false },
    ]);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (q: AdminQuestion) => {
    setEditingQuestion(q);
    setFormContent(q.content);
    setFormContentHi(q.translations?.hi || "");
    setFormType(q.type || "single_choice");
    setFormNumericalAnswer(q.numericalAnswer || "");
    setFormDifficulty(q.difficulty || "medium");
    setFormStatus(q.status || "published");

    // Resolve subject dropdown or custom
    const matchedSub = subjects.find(
      (s) =>
        (s.id || s._id) === q.subjectId ||
        s.name.toLowerCase() === (q.subject || "").toLowerCase(),
    );
    if (matchedSub) {
      setFormSubjectId(matchedSub.id || matchedSub._id || "");
      setFormSubjectName(matchedSub.name);
      setIsCustomSubject(false);
    } else {
      setFormSubjectId("");
      setFormSubjectName(q.subject || "");
      setIsCustomSubject(Boolean(q.subject));
    }

    // Resolve chapter dropdown or custom
    const matchedChap = allChapters.find(
      (c) =>
        (c.id || c._id) === q.chapterId ||
        c.name.toLowerCase() === (q.topic || "").toLowerCase(),
    );
    if (matchedChap) {
      setFormChapterId(matchedChap.id || matchedChap._id || "");
      setFormTopic(matchedChap.name);
      setIsCustomTopic(false);
    } else {
      setFormChapterId("");
      setFormTopic(q.topic || "");
      setIsCustomTopic(Boolean(q.topic));
    }

    setFormMarks(q.marks || 1);
    setFormNegativeMarks(q.negativeMarks || 0);
    setFormExplanation(q.explanation || "");
    setFormExplanationHi(q.explanationTranslations?.hi || "");
    setFormTags(q.tags ? q.tags.join(", ") : "");
    setFormIsAvailable(q.isAvailableForNewTests !== false);

    if (q.options && q.options.length > 0) {
      setFormOptions(
        q.options.map((opt) => ({
          content: opt.content,
          contentHi: opt.translations?.hi || "",
          isCorrect: opt.isCorrect,
          imageUrl: opt.imageUrl,
        })),
      );
    } else {
      setFormOptions([
        { content: "", isCorrect: true },
        { content: "", isCorrect: false },
      ]);
    }
    setIsModalOpen(true);
  };

  // Option handlers
  const handleOptionChange = (idx: number, val: string) => {
    setFormOptions((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], content: val };
      return copy;
    });
  };

  const handleOptionHiChange = (idx: number, val: string) => {
    setFormOptions((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], contentHi: val };
      return copy;
    });
  };

  const handleSetCorrect = (idx: number) => {
    if (formType === "single_choice") {
      setFormOptions((prev) =>
        prev.map((opt, i) => ({ ...opt, isCorrect: i === idx })),
      );
    } else if (formType === "multiple_choice") {
      setFormOptions((prev) => {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], isCorrect: !copy[idx].isCorrect };
        return copy;
      });
    }
  };

  const addOptionRow = () => {
    if (formOptions.length >= 8) return;
    setFormOptions((prev) => [...prev, { content: "", isCorrect: false }]);
  };

  const removeOptionRow = (idx: number) => {
    if (formOptions.length <= 2) return;
    setFormOptions((prev) => prev.filter((_, i) => i !== idx));
  };

  // Save Single Question
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formContent.trim()) {
      showToast("Question text is required", "error");
      return;
    }

    if (formType === "numerical") {
      if (!formNumericalAnswer.trim()) {
        showToast(
          "Numerical answer is required for numerical questions",
          "error",
        );
        return;
      }
    } else {
      const emptyOpt = formOptions.some((o) => !o.content.trim());
      if (emptyOpt) {
        showToast("All option contents must be filled", "error");
        return;
      }
      const correctCount = formOptions.filter((o) => o.isCorrect).length;
      if (correctCount === 0) {
        showToast("At least one option must be marked as correct", "error");
        return;
      }
      if (formType === "single_choice" && correctCount !== 1) {
        showToast(
          "Single-choice questions must have exactly one correct option",
          "error",
        );
        return;
      }
    }

    setIsSaving(true);
    try {
      const tagsArray = formTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const translations: Record<string, string> = {};
      if (formContentHi.trim()) translations.hi = formContentHi.trim();

      const explanationTranslations: Record<string, string> = {};
      if (formExplanationHi.trim())
        explanationTranslations.hi = formExplanationHi.trim();

      const optionsPayload =
        formType === "numerical"
          ? []
          : formOptions.map((o, pos) => {
              const optTrans: Record<string, string> = {};
              if (o.contentHi?.trim()) optTrans.hi = o.contentHi.trim();
              return {
                content: o.content.trim(),
                isCorrect: o.isCorrect,
                position: pos,
                imageUrl: o.imageUrl || null,
                translations:
                  Object.keys(optTrans).length > 0 ? optTrans : undefined,
              };
            });

      const payload: any = {
        content: formContent.trim(),
        translations:
          Object.keys(translations).length > 0 ? translations : undefined,
        type: formType,
        numericalAnswer:
          formType === "numerical" ? formNumericalAnswer.trim() : null,
        difficulty: formDifficulty,
        status: formStatus,
        isAvailableForNewTests: formIsAvailable,
        subject: formSubjectName.trim() || "General Studies",
        subjectId: formSubjectId || null,
        chapterId: formChapterId || null,
        topic: formTopic.trim() || null,
        marks: Number(formMarks) || 1,
        negativeMarks: Number(formNegativeMarks) || 0,
        explanation: formExplanation.trim() || null,
        explanationTranslations:
          Object.keys(explanationTranslations).length > 0
            ? explanationTranslations
            : undefined,
        tags: tagsArray,
        options: optionsPayload,
      };

      if (editingQuestion) {
        const qId = editingQuestion.id || editingQuestion._id!;
        await adminApi.updateQuestion(qId, payload);
        showToast("Question updated successfully", "success");
      } else {
        const [createdQuestion] = await adminApi.createQuestion({
          questions: [payload],
        });
        const mapping = await autoMapCreatedQuestions(
          createdQuestion ? [createdQuestion] : [],
        );
        if (mapping.failed) {
          showToast(
            `Question was created, but automatic mapping failed for ${mapping.failed} question.`,
            "error",
          );
        } else if (mapping.mapped) {
          showToast(
            "Question created and mapped to its test-series chapter",
            "success",
          );
        } else {
          showToast(
            "Question created in Question Bank. No series chapter was selected, so it was not mapped.",
            "success",
          );
        }
      }

      setIsModalOpen(false);
      fetchQuestions();
    } catch (err: any) {
      showToast(err.message || "Failed to save question", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Availability (Retire question from future tests)
  const toggleAvailability = async (q: AdminQuestion) => {
    const qId = q.id || q._id!;
    const nextVal = !q.isAvailableForNewTests;
    try {
      await adminApi.updateQuestion(qId, { isAvailableForNewTests: nextVal });
      showToast(
        nextVal
          ? "Question activated for new tests"
          : "Question retired from future tests (historical tests preserved)",
        "success",
      );
      setQuestions((prev) =>
        prev.map((item) =>
          (item.id || item._id) === qId
            ? { ...item, isAvailableForNewTests: nextVal }
            : item,
        ),
      );
    } catch (err: any) {
      showToast(err.message || "Failed to update availability", "error");
    }
  };

  // Delete Question (Admin only)
  const handleDeleteQuestion = async (q: AdminQuestion) => {
    if (!isAdmin) {
      showToast("Only administrators can delete questions", "error");
      return;
    }
    const qId = q.id || q._id!;
    const conf = window.confirm(
      "Are you sure you want to permanently delete this question from the Question Bank?",
    );
    if (!conf) return;

    try {
      await adminApi.deleteQuestion(qId);
      showToast("Question deleted", "success");
      fetchQuestions();
    } catch (err: any) {
      showToast(err.message || "Failed to delete question", "error");
    }
  };

  // Open Mapping Modal
  const openMappingModal = (q: AdminQuestion) => {
    setActiveQuestionForMapping(q);
    const questionChapter = allChapters.find(
      (chapter) => (chapter.id || chapter._id) === q.chapterId,
    );
    const selectedSeriesId =
      questionChapter?.testSeriesId ||
      seriesList[0]?.id ||
      seriesList[0]?._id ||
      "";
    setMappingSeriesId(selectedSeriesId);
    setMappingSubjectId(q.subjectId || "");
    setMappingChapterId(questionChapter?.id || questionChapter?._id || "");
    setIsMappingModalOpen(true);
  };

  const handleSaveMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuestionForMapping || !mappingSeriesId || !mappingSubjectId) {
      showToast("Series and Subject are required for mapping", "error");
      return;
    }

    setIsSavingMapping(true);
    try {
      const qId = activeQuestionForMapping.id || activeQuestionForMapping._id!;
      await adminApi.createQuestionMapping({
        questionId: qId,
        testSeriesId: mappingSeriesId,
        subjectId: mappingSubjectId,
        chapterId: mappingChapterId || null,
        order: 0,
      });
      showToast(
        "Question mapped to Test Series hierarchy successfully!",
        "success",
      );
      setIsMappingModalOpen(false);
      fetchQuestions();
    } catch (err: any) {
      showToast(err.message || "Failed to map question", "error");
    } finally {
      setIsSavingMapping(false);
    }
  };

  // Multi-Format Templates for Bulk Import
  const CSV_SAMPLE = `Question,Option 1,Option 2,Option 3,Option 4,Correct,Subject,Topic,Difficulty,Explanation
"What is the simple interest on Rs. 1000 at 10% per annum for 2 years?","Rs. 150","Rs. 200","Rs. 250","Rs. 300",2,"Quantitative Aptitude","Simple & Compound Interest","easy","SI = (P*R*T)/100 = (1000*10*2)/100 = Rs. 200"
"Find the next number in sequence: 2, 6, 12, 20, 30, ?","36","40","42","48",3,"Reasoning Ability","Number Series","medium","Differences increase by 2: +4, +6, +8, +10, +12. 30 + 12 = 42"`;

  const AIKEN_SAMPLE = `What is the simple interest on Rs. 1000 at 10% per annum for 2 years?
A. Rs. 150
B. Rs. 200
C. Rs. 250
D. Rs. 300
ANSWER: B
EXPLANATION: SI = (P*R*T)/100 = (1000*10*2)/100 = Rs. 200
SUBJECT: Quantitative Aptitude
TOPIC: Simple & Compound Interest
DIFFICULTY: easy

Find the next number in sequence: 2, 6, 12, 20, 30, ?
A. 36
B. 40
C. 42
D. 48
ANSWER: C
EXPLANATION: Differences increase by 2: +4, +6, +8, +10, +12. 30 + 12 = 42.
SUBJECT: Reasoning Ability
TOPIC: Number Series
DIFFICULTY: medium`;

  const JSON_SAMPLE = `[
  {
    "content": "What is the simple interest on Rs. 1000 at 10% per annum for 2 years?",
    "translations": {
      "hi": "1000 रुपये पर 10% की दर से 2 वर्ष का साधारण ब्याज क्या है?"
    },
    "type": "single_choice",
    "subject": "Quantitative Aptitude",
    "topic": "Simple & Compound Interest",
    "difficulty": "easy",
    "explanation": "SI = (P * R * T) / 100 = (1000 * 10 * 2) / 100 = Rs. 200",
    "explanationTranslations": {
      "hi": "साधारण ब्याज = (मूलधन * दर * समय) / 100 = 200 रुपये"
    },
    "options": [
      { "content": "Rs. 150", "isCorrect": false, "position": 0, "translations": { "hi": "150 रुपये" } },
      { "content": "Rs. 200", "isCorrect": true, "position": 1, "translations": { "hi": "200 रुपये" } },
      { "content": "Rs. 250", "isCorrect": false, "position": 2, "translations": { "hi": "250 रुपये" } },
      { "content": "Rs. 300", "isCorrect": false, "position": 3, "translations": { "hi": "300 रुपये" } }
    ]
  }
]`;

  const AI_RAW_SAMPLE = `Q1. A train running at the speed of 60 km/hr crosses a pole in 9 seconds. What is the length of the train?
Options:
(A) 120 metres
(B) 150 metres
(C) 180 metres
(D) 324 metres
Correct Answer: B
Explanation: Speed = 60 * (5/18) = 50/3 m/sec. Length = Speed * Time = (50/3) * 9 = 150 metres.

Q2. If 'ROSE' is coded as '6821' and 'CHAIR' is coded as '73456', how will 'SEARCH' be coded?
Options:
(A) 214673
(B) 214763
(C) 216473
(D) 214573
Correct Answer: A
Explanation: Direct letter to digit substitution from ROSE and CHAIR. S=2, E=1, A=4, R=6, C=7, H=3.`;

  const [parsedQuestionsCache, setParsedQuestionsCache] = useState<any[]>([]);

  // Parse questions from CSV, Aiken format, or JSON
  const parseUniversalQuestions = (rawText: string): any[] => {
    const trimmed = rawText.trim();
    if (!trimmed) throw new Error("Input text is empty.");
    const defaultSubject =
      bulkTargetSubjectName || subjects[0]?.name || "Quantitative Aptitude";
    const defaultSubjectId =
      bulkTargetSubjectId || subjects[0]?.id || subjects[0]?._id || null;
    const defaultChapterName = bulkTargetChapterName || null;
    const defaultChapterId = bulkTargetChapterId || null;

    // 1. JSON Array
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      const obj = JSON.parse(trimmed);
      const arr = Array.isArray(obj) ? obj : [obj];
      return arr.map((q) => ({
        content: q.content,
        translations:
          q.translations || (q.contentHi ? { hi: q.contentHi } : {}),
        type: q.type || "single_choice",
        numericalAnswer: q.numericalAnswer || null,
        subject: q.subject || defaultSubject,
        subjectId: q.subjectId || defaultSubjectId,
        topic: q.topic || defaultChapterName,
        chapterId: q.chapterId || defaultChapterId,
        difficulty: ["easy", "medium", "hard"].includes(
          q.difficulty?.toLowerCase(),
        )
          ? q.difficulty.toLowerCase()
          : "medium",
        status: q.status || "published",
        marks: q.marks || 1,
        negativeMarks: q.negativeMarks ?? 0.25,
        explanation: q.explanation || null,
        explanationTranslations:
          q.explanationTranslations ||
          (q.explanationHi ? { hi: q.explanationHi } : {}),
        options: Array.isArray(q.options)
          ? q.options.map((opt: any, idx: number) => ({
              content: opt.content,
              position: idx,
              isCorrect: Boolean(opt.isCorrect),
              translations:
                opt.translations ||
                (opt.contentHi ? { hi: opt.contentHi } : {}),
            }))
          : [],
      }));
    }

    // 2. Aiken Format (Educational Standard)
    const hasAikenAnswer = /\b(ANSWER|ANS):\s*([A-Za-z0-9])/i.test(trimmed);
    if (hasAikenAnswer) {
      const blocks = trimmed
        .split(/\n\s*\n/)
        .filter((b) => b.trim().length > 0);
      const parsedList: any[] = [];

      for (let bIdx = 0; bIdx < blocks.length; bIdx++) {
        const block = blocks[bIdx];
        const lines = block
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);
        const contentLines: string[] = [];
        const options: Array<{ letter: string; content: string }> = [];
        let answerLetter = "";
        let explanation = "";
        let subject = defaultSubject;
        let topic = "";
        let difficulty = "medium";

        for (const line of lines) {
          const ansMatch = line.match(/^(?:ANSWER|ANS):\s*([A-Za-z0-9])/i);
          const expMatch = line.match(/^(?:EXPLANATION|EXP|SOLUTION):\s*(.*)/i);
          const subMatch = line.match(/^SUBJECT:\s*(.*)/i);
          const topMatch = line.match(/^(?:TOPIC|CHAPTER):\s*(.*)/i);
          const diffMatch = line.match(/^DIFFICULTY:\s*(easy|medium|hard)/i);
          const optMatch = line.match(/^([A-Da-d])[.\)]\s+(.*)/);

          if (ansMatch) {
            answerLetter = ansMatch[1].toUpperCase();
          } else if (expMatch) {
            explanation = expMatch[1].trim();
          } else if (subMatch) {
            subject = subMatch[1].trim();
          } else if (topMatch) {
            topic = topMatch[1].trim();
          } else if (diffMatch) {
            difficulty = diffMatch[1].toLowerCase();
          } else if (optMatch) {
            options.push({
              letter: optMatch[1].toUpperCase(),
              content: optMatch[2].trim(),
            });
          } else if (options.length === 0) {
            contentLines.push(line.replace(/^(?:Q\d+[.:]?|\d+[.:]?)\s*/, ""));
          }
        }

        if (options.length < 2) {
          throw new Error(
            `Question block ${bIdx + 1} does not have at least 2 options (A., B., ...).`,
          );
        }
        if (!answerLetter) {
          throw new Error(`Question block ${bIdx + 1} is missing "ANSWER: X".`);
        }

        const qContent = contentLines.join(" ").trim();
        if (!qContent) {
          throw new Error(
            `Question block ${bIdx + 1} is missing question text.`,
          );
        }

        let correctIdx = -1;
        if (["A", "B", "C", "D"].includes(answerLetter)) {
          correctIdx = answerLetter.charCodeAt(0) - 65;
        } else {
          const num = parseInt(answerLetter, 10);
          if (!isNaN(num)) correctIdx = num - 1;
        }

        parsedList.push({
          content: qContent,
          subject: subject || defaultSubject,
          subjectId: defaultSubjectId,
          topic: topic || defaultChapterName,
          chapterId: defaultChapterId,
          difficulty,
          type: "single_choice",
          status: "published",
          marks: 1,
          negativeMarks: 0.25,
          explanation: explanation || null,
          options: options.map((opt, idx) => ({
            content: opt.content,
            position: idx,
            isCorrect: idx === correctIdx || opt.letter === answerLetter,
          })),
        });
      }

      return parsedList;
    }

    // 3. CSV Format (with quote-escaping support)
    const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      throw new Error(
        "CSV input must contain a header row and at least 1 question row.",
      );
    }

    const parseCsvLine = (line: string): string[] => {
      const res: string[] = [];
      let cur = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          if (inQuotes && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (c === "," && !inQuotes) {
          res.push(cur.trim());
          cur = "";
        } else {
          cur += c;
        }
      }
      res.push(cur.trim());
      return res;
    };

    const header = parseCsvLine(lines[0]).map((h) =>
      h.toLowerCase().replace(/[\s_-]+/g, ""),
    );
    const dataLines = lines.slice(1);

    return dataLines.map((line, rIdx) => {
      const parts = parseCsvLine(line);
      if (parts.length < 6) {
        throw new Error(
          `Row ${rIdx + 2} has only ${parts.length} columns (expected at least 6: Question, Opt1, Opt2, Opt3, Opt4, Correct).`,
        );
      }

      const qCol =
        header.indexOf("question") >= 0
          ? header.indexOf("question")
          : header.indexOf("content") >= 0
            ? header.indexOf("content")
            : 0;
      const opt1Col =
        header.indexOf("option1") >= 0
          ? header.indexOf("option1")
          : header.indexOf("opt1") >= 0
            ? header.indexOf("opt1")
            : 1;
      const opt2Col =
        header.indexOf("option2") >= 0
          ? header.indexOf("option2")
          : header.indexOf("opt2") >= 0
            ? header.indexOf("opt2")
            : 2;
      const opt3Col =
        header.indexOf("option3") >= 0
          ? header.indexOf("option3")
          : header.indexOf("opt3") >= 0
            ? header.indexOf("opt3")
            : 3;
      const opt4Col =
        header.indexOf("option4") >= 0
          ? header.indexOf("option4")
          : header.indexOf("opt4") >= 0
            ? header.indexOf("opt4")
            : 4;
      const corCol =
        header.indexOf("correct") >= 0
          ? header.indexOf("correct")
          : header.indexOf("correctoption") >= 0
            ? header.indexOf("correctoption")
            : 5;
      const subCol =
        header.indexOf("subject") >= 0 ? header.indexOf("subject") : 6;
      const topCol =
        header.indexOf("topic") >= 0
          ? header.indexOf("topic")
          : header.indexOf("chapter") >= 0
            ? header.indexOf("chapter")
            : 7;
      const diffCol =
        header.indexOf("difficulty") >= 0
          ? header.indexOf("difficulty")
          : header.indexOf("diff") >= 0
            ? header.indexOf("diff")
            : 8;
      const expCol =
        header.indexOf("explanation") >= 0 ? header.indexOf("explanation") : 9;

      const content = parts[qCol] || "";
      const opt1 = parts[opt1Col] || "";
      const opt2 = parts[opt2Col] || "";
      const opt3 = parts[opt3Col] || "";
      const opt4 = parts[opt4Col] || "";
      const corRaw = (parts[corCol] || "").toUpperCase();
      const subject = parts[subCol] || defaultSubject;
      const topic = parts[topCol] || null;
      const diff = (parts[diffCol] || "medium").toLowerCase();
      const explanation = parts[expCol] || null;

      let correctIdx = 0;
      if (["A", "B", "C", "D"].includes(corRaw)) {
        correctIdx = corRaw.charCodeAt(0) - 65;
      } else {
        const parsedNum = parseInt(corRaw, 10);
        if (!isNaN(parsedNum)) correctIdx = parsedNum - 1;
      }

      return {
        content,
        subject: subject || defaultSubject,
        subjectId: defaultSubjectId,
        topic: topic || defaultChapterName,
        chapterId: defaultChapterId,
        difficulty: ["easy", "medium", "hard"].includes(diff) ? diff : "medium",
        type: "single_choice",
        status: "published",
        marks: 1,
        negativeMarks: 0.25,
        explanation: explanation || null,
        options: [
          { content: opt1, isCorrect: correctIdx === 0, position: 0 },
          { content: opt2, isCorrect: correctIdx === 1, position: 1 },
          { content: opt3, isCorrect: correctIdx === 2, position: 2 },
          { content: opt4, isCorrect: correctIdx === 3, position: 3 },
        ].filter((o) => o.content.trim().length > 0),
      };
    });
  };

  const handleParseImport = () => {
    setImportErrors([]);
    setImportPreviewCount(0);
    setParsedQuestionsCache([]);

    if (!importJsonText.trim()) {
      setImportErrors([
        "Import text is empty. Paste questions or load an example template.",
      ]);
      return;
    }

    try {
      const parsed = parseUniversalQuestions(importJsonText);

      // Validate questions
      const errors: string[] = [];
      parsed.forEach((q, idx) => {
        if (!q.content || typeof q.content !== "string" || !q.content.trim()) {
          errors.push(`Row/Question ${idx + 1}: Missing question content.`);
        }
        if (q.type !== "numerical") {
          if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
            errors.push(
              `Row/Question ${idx + 1}: Requires at least 2 options.`,
            );
          } else {
            const corrects = q.options.filter((o: any) => o.isCorrect).length;
            if (corrects === 0) {
              errors.push(
                `Row/Question ${idx + 1}: Must have at least one correct option.`,
              );
            }
          }
        }
      });

      if (errors.length > 0) {
        setImportErrors(errors);
      } else {
        setParsedQuestionsCache(parsed);
        setImportPreviewCount(parsed.length);
      }
    } catch (err: any) {
      setImportErrors([
        err.message ||
          "Failed to parse format. Please check syntax or use sample template.",
      ]);
    }
  };

  const handleExecuteImport = async () => {
    setIsImporting(true);
    try {
      let questionsToImport = parsedQuestionsCache;
      if (!questionsToImport || questionsToImport.length === 0) {
        questionsToImport = parseUniversalQuestions(importJsonText);
      }

      // Pre-fill target subject & chapter if configured
      const finalQuestions = questionsToImport.map((q) => {
        let subName =
          q.subject ||
          bulkTargetSubjectName ||
          subjects[0]?.name ||
          "Quantitative Aptitude";
        let subId =
          q.subjectId ||
          bulkTargetSubjectId ||
          subjects[0]?.id ||
          subjects[0]?._id ||
          null;
        let topName = q.topic || bulkTargetChapterName || null;
        let chapId = q.chapterId || bulkTargetChapterId || null;

        if (bulkTargetSubjectId) {
          subId = bulkTargetSubjectId;
          if (bulkTargetSubjectName) subName = bulkTargetSubjectName;
        }
        if (bulkTargetChapterId) {
          chapId = bulkTargetChapterId;
          if (bulkTargetChapterName) topName = bulkTargetChapterName;
        }

        return {
          ...q,
          subject: subName,
          subjectId: subId || undefined,
          chapterId: chapId || undefined,
          topic: topName || undefined,
        };
      });

      const createdQuestions = await adminApi.createQuestion({
        questions: finalQuestions,
      });
      const mapping = await autoMapCreatedQuestions(createdQuestions);
      showToast(
        `Imported ${createdQuestions.length} questions${mapping.mapped ? `; mapped ${mapping.mapped} to test-series chapters` : ""}${mapping.failed ? `; ${mapping.failed} mappings failed` : ""}.`,
        mapping.failed ? "error" : "success",
      );
      setIsImportModalOpen(false);
      setImportJsonText("");
      setImportPreviewCount(0);
      setParsedQuestionsCache([]);
      setImportErrors([]);
      fetchQuestions();
    } catch (err: any) {
      showToast(err.message || "Failed to import questions", "error");
    } finally {
      setIsImporting(false);
    }
  };

  const loadExampleTemplate = (fmt: "csv" | "aiken" | "json" | "ai_raw") => {
    setImportFormat(fmt);
    setImportErrors([]);
    setImportPreviewCount(0);
    if (fmt === "csv") setImportJsonText(CSV_SAMPLE);
    else if (fmt === "aiken") setImportJsonText(AIKEN_SAMPLE);
    else if (fmt === "json") setImportJsonText(JSON_SAMPLE);
    else if (fmt === "ai_raw") setImportJsonText(AI_RAW_SAMPLE);
  };

  const downloadSampleTemplate = (fmt: "csv" | "aiken" | "json") => {
    let content = "";
    let filename = "";
    let mimeType = "text/plain";

    if (fmt === "csv") {
      content = CSV_SAMPLE;
      filename = "questions_template.csv";
      mimeType = "text/csv;charset=utf-8;";
    } else if (fmt === "aiken") {
      content = AIKEN_SAMPLE;
      filename = "questions_template_aiken.txt";
      mimeType = "text/plain;charset=utf-8;";
    } else if (fmt === "json") {
      content = JSON_SAMPLE;
      filename = "questions_template.json";
      mimeType = "application/json;charset=utf-8;";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setImportJsonText(text);
        if (file.name.endsWith(".json")) setImportFormat("json");
        else if (file.name.endsWith(".csv") || file.name.endsWith(".tsv"))
          setImportFormat("csv");
        else if (file.name.endsWith(".txt")) setImportFormat("aiken");
        setImportPreviewCount(0);
        setImportErrors([]);
        showToast(
          `Loaded ${file.name} successfully. Click "Validate & Preview".`,
          "info",
        );
      }
    };
    reader.readAsText(file);
  };

  // AI Generation Handlers
  const openAiGenModal = () => {
    setAiSubject(subjects[0]?.name || "General Studies");
    setAiTopic("");
    setAiPrompt("");
    setGeneratedAiQuestions([]);
    setIsAiGenModalOpen(true);
  };

  const handleAiGenerateQuestions = async () => {
    if (!aiSubject.trim()) {
      showToast("Please specify or select a subject", "error");
      return;
    }
    setIsGeneratingAi(true);
    try {
      const res = await adminApi.generateAiQuestions({
        examName: aiExamName,
        subject: aiSubject.trim(),
        topic: aiTopic.trim() || undefined,
        difficulty: aiDifficulty,
        count: aiCount,
        additionalPrompt: aiPrompt.trim() || undefined,
      });
      if (res?.questions && res.questions.length > 0) {
        setGeneratedAiQuestions(res.questions);
        showToast(
          `Generated ${res.questions.length} questions successfully!`,
          "success",
        );
      } else {
        showToast("No questions were returned. Please try again.", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to generate questions with AI", "error");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleImportAiGeneratedQuestions = async () => {
    if (generatedAiQuestions.length === 0) return;
    setIsGeneratingAi(true);
    try {
      const createdQuestions = await adminApi.createQuestion({
        questions: generatedAiQuestions,
      });
      const mapping = await autoMapCreatedQuestions(createdQuestions);
      showToast(
        `Saved ${createdQuestions.length} AI questions${mapping.mapped ? `; mapped ${mapping.mapped} to test-series chapters` : ""}${mapping.failed ? `; ${mapping.failed} mappings failed` : ""}.`,
        mapping.failed ? "error" : "success",
      );
      setIsAiGenModalOpen(false);
      setGeneratedAiQuestions([]);
      fetchQuestions();
    } catch (err: any) {
      showToast(err.message || "Failed to import AI questions", "error");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // 1-Click AI Translate & Explain in Question Modal
  const handleAiTranslateExplain = async () => {
    if (!formContent.trim()) {
      showToast("Please enter English Question text first", "error");
      return;
    }
    setIsTranslatingAi(true);
    try {
      const res = await adminApi.translateAndExplainQuestion({
        content: formContent.trim(),
        options: formOptions.map((o) => ({
          content: o.content.trim(),
          isCorrect: o.isCorrect,
        })),
        explanation: formExplanation.trim() || undefined,
        subject: formSubjectName.trim() || undefined,
        topic: formTopic.trim() || undefined,
      });

      if (res?.contentHi) setFormContentHi(res.contentHi);
      if (res?.optionsHi && Array.isArray(res.optionsHi)) {
        setFormOptions((prev) =>
          prev.map((opt, idx) => ({
            ...opt,
            contentHi: res.optionsHi[idx] || opt.contentHi || "",
          })),
        );
      }
      if (res?.explanation) setFormExplanation(res.explanation);
      if (res?.explanationHi) setFormExplanationHi(res.explanationHi);

      showToast(
        "Question translated & bilingual explanation generated!",
        "success",
      );
    } catch (err: any) {
      showToast(err.message || "Failed to translate question", "error");
    } finally {
      setIsTranslatingAi(false);
    }
  };

  // AI Raw Paper Parsing in Bulk Import Modal
  const handleAiParseRawText = async () => {
    if (!importJsonText.trim()) {
      showToast("Please paste question paper text or notes first", "error");
      return;
    }
    setIsParsingRawAi(true);
    try {
      const res = await adminApi.parseRawQuestionsAi({
        rawText: importJsonText,
        subject: formSubjectName || undefined,
      });

      if (res?.questions && res.questions.length > 0) {
        setImportJsonText(JSON.stringify(res.questions, null, 2));
        setImportPreviewCount(res.questions.length);
        setImportErrors([]);
        showToast(
          `AI successfully parsed ${res.questions.length} questions! Review and click Import.`,
          "success",
        );
      } else {
        showToast(
          "Could not extract structured questions. Please verify format.",
          "error",
        );
      }
    } catch (err: any) {
      showToast(err.message || "AI parsing failed", "error");
    } finally {
      setIsParsingRawAi(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2.5">
            <span>Central Question Bank</span>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60">
              {totalCount} Questions
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Author reusable questions, configure single/multiple choice or
            numerical answers, and map questions to test series & chapters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openAiGenModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer"
          >
            <svg
              className="w-4 h-4 text-indigo-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <span>✨ Generate with AI</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setImportJsonText("");
              setImportErrors([]);
              setImportPreviewCount(0);
              setIsImportModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-semibold text-xs rounded-xl transition cursor-pointer"
          >
            <svg
              className="w-4 h-4 text-slate-500 dark:text-zinc-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            <span>Bulk Import (CSV/JSON)</span>
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>Author Question</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xs space-y-3">
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-col sm:flex-row gap-2.5"
        >
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by question text, tags, or topic..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-zinc-100 placeholder-slate-400"
            />
            <svg
              className="w-4 h-4 absolute left-3 top-2.5 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold text-xs rounded-xl hover:opacity-90 transition cursor-pointer shrink-0"
          >
            Search Bank
          </button>
        </form>

        {/* Filter Selects */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1 border-t border-slate-100 dark:border-zinc-800 text-xs">
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 mb-1">
              TYPE
            </label>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setOffset(0);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-800 dark:text-zinc-200 focus:outline-hidden"
            >
              <option value="ALL">All Types</option>
              <option value="single_choice">Single Choice MCQ</option>
              <option value="multiple_choice">Multiple Choice MCQ</option>
              <option value="numerical">Numerical Answer</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 mb-1">
              DIFFICULTY
            </label>
            <select
              value={selectedDifficulty}
              onChange={(e) => {
                setSelectedDifficulty(e.target.value);
                setOffset(0);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-800 dark:text-zinc-200 focus:outline-hidden"
            >
              <option value="ALL">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 mb-1">
              STATUS
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setOffset(0);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-800 dark:text-zinc-200 focus:outline-hidden"
            >
              <option value="ALL">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 mb-1">
              SUBJECT
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => {
                setSelectedSubjectId(e.target.value);
                setSelectedChapterId("ALL");
                setOffset(0);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-800 dark:text-zinc-200 focus:outline-hidden"
            >
              <option value="ALL">All Subjects</option>
              {subjects.map((sub) => (
                <option key={sub.id || sub._id} value={sub.id || sub._id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 mb-1">
              CHAPTER / TOPIC
            </label>
            <select
              value={selectedChapterId}
              onChange={(e) => {
                setSelectedChapterId(e.target.value);
                setOffset(0);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-800 dark:text-zinc-200 focus:outline-hidden"
            >
              <option value="ALL">All Chapters</option>
              {filterChapters.map((chap) => (
                <option key={chap.id || chap._id} value={chap.id || chap._id}>
                  {chap.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 mb-1">
              TEST AVAILABILITY
            </label>
            <select
              value={selectedAvailability}
              onChange={(e: any) => {
                setSelectedAvailability(e.target.value);
                setOffset(0);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-800 dark:text-zinc-200 focus:outline-hidden"
            >
              <option value="ALL">All Availability</option>
              <option value="true">Active for New Tests</option>
              <option value="false">Retired (Preserved in Historical)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-500 dark:text-zinc-400 flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading central question bank...</span>
          </div>
        ) : questions.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500 dark:text-zinc-400 space-y-2">
            <p className="font-semibold text-slate-700 dark:text-zinc-300">
              No questions found
            </p>
            <p>
              Try adjusting your search criteria or author new questions using
              the button above.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-zinc-800">
            {questions.map((q, qIndex) => {
              const qId = q.id || q._id!;
              return (
                <div
                  key={qId}
                  className="p-4 sm:p-5 hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1.5">
                      {/* Meta badges */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="font-mono text-slate-400 dark:text-zinc-500 font-bold">
                          #{offset + qIndex + 1}
                        </span>
                        <span className="px-2 py-0.5 rounded-md font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                          {q.subject}
                        </span>
                        {q.topic && (
                          <span className="px-2 py-0.5 rounded-md text-slate-600 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700">
                            {q.topic}
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-md font-semibold ${
                            q.difficulty === "easy"
                              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                              : q.difficulty === "medium"
                                ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
                                : "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {q.difficulty}
                        </span>
                        <span className="px-2 py-0.5 rounded-md font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                          {q.type === "single_choice"
                            ? "Single Choice"
                            : q.type === "multiple_choice"
                              ? "Multiple Choice"
                              : "Numerical"}
                        </span>
                        <span className="text-slate-400 dark:text-zinc-500 font-medium">
                          +{q.marks} / -{q.negativeMarks} marks
                        </span>

                        {!q.isAvailableForNewTests && (
                          <span className="px-2 py-0.5 rounded-md font-semibold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                            Retired from new tests
                          </span>
                        )}
                      </div>

                      {/* Question Content */}
                      <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100 whitespace-pre-wrap">
                        {q.content}
                      </p>
                      {q.translations?.hi && (
                        <p className="text-xs text-slate-500 dark:text-zinc-400 italic">
                          <span className="font-semibold text-slate-600 dark:text-zinc-300">
                            HI:
                          </span>{" "}
                          {q.translations.hi}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => openMappingModal(q)}
                        title="Map to Test Series & Chapter"
                        className="p-1.5 text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg transition cursor-pointer"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                          />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditModal(q)}
                        title="Edit question"
                        className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleAvailability(q)}
                        title={
                          q.isAvailableForNewTests
                            ? "Retire question"
                            : "Reactivate question"
                        }
                        className={`p-1.5 rounded-lg transition cursor-pointer ${
                          q.isAvailableForNewTests
                            ? "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/60"
                            : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60"
                        }`}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                          />
                        </svg>
                      </button>

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(q)}
                          title="Delete permanently"
                          className="p-1.5 text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition cursor-pointer"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Options or Numerical answer display */}
                  {q.type === "numerical" ? (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-800 text-xs">
                      <span className="font-semibold text-slate-600 dark:text-zinc-300">
                        Exact Answer:{" "}
                      </span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {q.numericalAnswer}
                      </span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {q.options?.map((opt, optIdx) => (
                        <div
                          key={opt.id || opt._id || optIdx}
                          className={`p-2.5 rounded-xl border flex items-start gap-2 ${
                            opt.isCorrect
                              ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-medium"
                              : "bg-slate-50/50 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300"
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold ${
                              opt.isCorrect
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300"
                            }`}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div>{opt.content}</div>
                            {opt.translations?.hi && (
                              <div className="text-[11px] opacity-75 italic mt-0.5">
                                HI: {opt.translations.hi}
                              </div>
                            )}
                          </div>
                          {opt.isCorrect && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 shrink-0">
                              ✓ Correct
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Explanation if present */}
                  {q.explanation && (
                    <div className="p-3 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-xs text-slate-700 dark:text-zinc-300 space-y-1">
                      <div className="font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>Explanation</span>
                      </div>
                      <p className="whitespace-pre-wrap">{q.explanation}</p>
                      {q.explanationTranslations?.hi && (
                        <p className="italic text-slate-500 dark:text-zinc-400">
                          HI: {q.explanationTranslations.hi}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Bar */}
        {totalCount > limit && (
          <div className="p-4 bg-slate-50 dark:bg-zinc-900/80 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-zinc-400">
              Showing {offset + 1} - {Math.min(offset + limit, totalCount)} of{" "}
              {totalCount} questions
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={offset === 0}
                onClick={() => setOffset((prev) => Math.max(0, prev - limit))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={offset + limit >= totalCount}
                onClick={() => setOffset((prev) => prev + limit)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* AUTHOR / EDIT QUESTION MODAL */}
      {/* ===================================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-3xl max-h-[90vh] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl flex flex-col overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                {editingQuestion ? "Edit Question" : "Author New Question"}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSaveQuestion}
              className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs"
            >
              {/* Question Text English & Hindi */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-slate-700 dark:text-zinc-300">
                    Question Text (English){" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAiTranslateExplain}
                    disabled={isTranslatingAi}
                    title="Auto-generates Hindi translation for question, options, and in-depth bilingual explanations"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg text-[11px] font-semibold cursor-pointer disabled:opacity-50 transition"
                  >
                    {isTranslatingAi ? (
                      <>
                        <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>Translating with AI...</span>
                      </>
                    ) : (
                      <>
                        <span>✨ AI Translate &amp; Explain</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  rows={3}
                  required
                  placeholder="Enter the primary question text here..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-zinc-100"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-700 dark:text-zinc-300">
                  Question Text (Hindi Translation)
                </label>
                <textarea
                  rows={2}
                  placeholder="हिंदी में प्रश्न अनुवाद (वैकल्पिक)..."
                  value={formContentHi}
                  onChange={(e) => setFormContentHi(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-zinc-100"
                />
              </div>

              {/* Type, Difficulty, Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700 dark:text-zinc-300">
                    Question Type
                  </label>
                  <select
                    value={formType}
                    onChange={(e: any) => setFormType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100"
                  >
                    <option value="single_choice">Single Correct MCQ</option>
                    <option value="multiple_choice">
                      Multiple Correct MCQ
                    </option>
                    <option value="numerical">Numerical Answer</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700 dark:text-zinc-300">
                    Difficulty
                  </label>
                  <select
                    value={formDifficulty}
                    onChange={(e: any) => setFormDifficulty(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700 dark:text-zinc-300">
                    Publication Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e: any) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Subject, Topic, Marks */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {/* Subject Selector */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block font-semibold text-slate-700 dark:text-zinc-300">
                      Subject
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomSubject(!isCustomSubject);
                        if (!isCustomSubject) {
                          setFormSubjectId("");
                        } else {
                          const first = subjects[0];
                          setFormSubjectId(first?.id || first?._id || "");
                          setFormSubjectName(first?.name || "");
                        }
                      }}
                      className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      {isCustomSubject ? "Select from list" : "+ Custom"}
                    </button>
                  </div>
                  {isCustomSubject ? (
                    <input
                      type="text"
                      required
                      placeholder="Enter subject name..."
                      value={formSubjectName}
                      onChange={(e) => setFormSubjectName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100 text-xs"
                    />
                  ) : (
                    <select
                      value={formSubjectId}
                      onChange={(e) => {
                        setFormSubjectId(e.target.value);
                        const found = subjects.find(
                          (s) => (s.id || s._id) === e.target.value,
                        );
                        setFormSubjectName(found?.name || "");
                        setFormChapterId("");
                        setFormTopic("");
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100 text-xs font-medium"
                    >
                      {subjects.map((s) => (
                        <option key={s.id || s._id} value={s.id || s._id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Chapter / Topic Selector */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block font-semibold text-slate-700 dark:text-zinc-300">
                      Chapter / Topic
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomTopic(!isCustomTopic);
                        if (!isCustomTopic) {
                          setFormChapterId("");
                        }
                      }}
                      className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      {isCustomTopic ? "Select Chapter" : "+ Custom"}
                    </button>
                  </div>
                  {isCustomTopic || formAvailableChapters.length === 0 ? (
                    <input
                      type="text"
                      placeholder="e.g. Percentage, Time & Work"
                      value={formTopic}
                      onChange={(e) => setFormTopic(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100 text-xs"
                    />
                  ) : (
                    <select
                      value={formChapterId}
                      onChange={(e) => {
                        setFormChapterId(e.target.value);
                        const found = formAvailableChapters.find(
                          (c) => (c.id || c._id) === e.target.value,
                        );
                        setFormTopic(found?.name || "");
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100 text-xs font-medium"
                    >
                      <option value="">-- Select Chapter (Optional) --</option>
                      {formAvailableChapters.map((c) => (
                        <option key={c.id || c._id} value={c.id || c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                  {!editingQuestion && (
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                      Selecting a test-series chapter automatically maps this
                      new question to that series.
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700 dark:text-zinc-300">
                    Marks
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0.25"
                    value={formMarks}
                    onChange={(e) => setFormMarks(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700 dark:text-zinc-300">
                    Negative Marks
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={formNegativeMarks}
                    onChange={(e) =>
                      setFormNegativeMarks(parseFloat(e.target.value))
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* Numerical Answer vs Options */}
              {formType === "numerical" ? (
                <div className="p-4 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 rounded-2xl space-y-2">
                  <label className="block font-semibold text-slate-800 dark:text-zinc-200">
                    Exact Numerical Answer{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 42, 3.14, -15"
                    value={formNumericalAnswer}
                    onChange={(e) => setFormNumericalAnswer(e.target.value)}
                    className="w-full sm:w-1/2 px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl font-mono text-slate-900 dark:text-zinc-100"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Numerical evaluation requires exact matching. No tolerance
                    range is allowed.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <label className="block font-semibold text-slate-800 dark:text-zinc-200">
                      Options & Correct Answer(s){" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={addOptionRow}
                      disabled={formOptions.length >= 8}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-semibold text-xs cursor-pointer disabled:opacity-40"
                    >
                      + Add Option
                    </button>
                  </div>

                  <div className="space-y-2">
                    {formOptions.map((opt, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 ${
                          opt.isCorrect
                            ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800"
                            : "bg-slate-50 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-700"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleSetCorrect(idx)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 cursor-pointer transition ${
                            opt.isCorrect
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-600 text-slate-500 hover:border-emerald-500"
                          }`}
                        >
                          {String.fromCharCode(65 + idx)}
                        </button>

                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            required
                            placeholder={`Option ${String.fromCharCode(65 + idx)} (English)`}
                            value={opt.content}
                            onChange={(e) =>
                              handleOptionChange(idx, e.target.value)
                            }
                            className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-zinc-100"
                          />
                          <input
                            type="text"
                            placeholder="हिंदी अनुवाद (वैकल्पिक)"
                            value={opt.contentHi || ""}
                            onChange={(e) =>
                              handleOptionHiChange(idx, e.target.value)
                            }
                            className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-zinc-100"
                          />
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                            <input
                              type={
                                formType === "single_choice"
                                  ? "radio"
                                  : "checkbox"
                              }
                              name="correctOptionRadio"
                              checked={opt.isCorrect}
                              onChange={() => handleSetCorrect(idx)}
                            />
                            <span
                              className={
                                opt.isCorrect
                                  ? "font-bold text-emerald-600 dark:text-emerald-400"
                                  : ""
                              }
                            >
                              Correct
                            </span>
                          </label>

                          {formOptions.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeOptionRow(idx)}
                              className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Explanations */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-zinc-800">
                <label className="block font-semibold text-slate-700 dark:text-zinc-300">
                  Explanation & Solution Notes (English)
                </label>
                <textarea
                  rows={2}
                  placeholder="Provide step-by-step reasoning or formula notes..."
                  value={formExplanation}
                  onChange={(e) => setFormExplanation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-700 dark:text-zinc-300">
                  Explanation (Hindi Translation)
                </label>
                <textarea
                  rows={2}
                  placeholder="हिंदी में व्याख्या (वैकल्पिक)..."
                  value={formExplanationHi}
                  onChange={(e) => setFormExplanationHi(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100"
                />
              </div>

              {/* Tags & Availability */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700 dark:text-zinc-300">
                    Tags (Comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. RRB NTPC, SSC CGL 2024, Geometry"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100"
                  />
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="isAvailableCb"
                    checked={formIsAvailable}
                    onChange={(e) => setFormIsAvailable(e.target.checked)}
                    className="w-4 h-4 rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="isAvailableCb"
                    className="font-semibold text-slate-700 dark:text-zinc-300"
                  >
                    Active for new test selection pools
                  </label>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-zinc-800/80 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl text-slate-700 dark:text-zinc-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSaving
                    ? "Saving..."
                    : editingQuestion
                      ? "Update Question"
                      : "Save to Question Bank"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* QUESTION MAPPING MODAL */}
      {/* ===================================================================== */}
      {isMappingModalOpen && activeQuestionForMapping && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                Map Question to Test Series
              </h3>
              <button
                type="button"
                onClick={() => setIsMappingModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-300">
              Mapping associates this reusable question with a specific Test
              Series, Subject, and Chapter without duplicating the underlying
              Question record.
            </p>

            <form onSubmit={handleSaveMapping} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-zinc-300">
                  Target Test Series
                </label>
                <select
                  required
                  value={mappingSeriesId}
                  onChange={(e) => {
                    setMappingSeriesId(e.target.value);
                    setMappingSubjectId("");
                    setMappingChapterId("");
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100"
                >
                  {seriesList.map((s) => (
                    <option key={s.id || s._id} value={s.id || s._id}>
                      {s.title} ({s.targetExam})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-zinc-300">
                  Assigned Subject
                </label>
                <select
                  required
                  value={mappingSubjectId}
                  onChange={(e) => {
                    setMappingSubjectId(e.target.value);
                    setMappingChapterId("");
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100"
                >
                  {mappingSubjects.map((sub) => (
                    <option key={sub.id || sub._id} value={sub.id || sub._id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-zinc-300">
                  Exam-Specific Chapter (Optional)
                </label>
                <select
                  value={mappingChapterId}
                  onChange={(e) => setMappingChapterId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100"
                >
                  <option value="">No Chapter (Subject-Level Mapping)</option>
                  {availableChapters.map((ch) => (
                    <option key={ch.id || ch._id} value={ch.id || ch._id}>
                      {ch.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMappingModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl text-slate-700 dark:text-zinc-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingMapping}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSavingMapping ? "Mapping..." : "Confirm Mapping"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* UNIVERSAL BULK IMPORT MODAL */}
      {/* ===================================================================== */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-5 space-y-4 max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  📥
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                    <span>Universal Bulk Question Import</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60">
                      Multi-Format
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Upload or paste questions using CSV/Excel, Aiken (.txt),
                    JSON, or AI-powered unstructured text parsing.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Target Hierarchy Assignment for this Batch */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 shrink-0">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-800 dark:text-zinc-200 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span>🏷️ Target Subject</span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-normal">
                      (Auto-fill batch)
                    </span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Pre-fills all questions
                  </span>
                </label>
                <select
                  value={bulkTargetSubjectId}
                  onChange={(e) => {
                    setBulkTargetSubjectId(e.target.value);
                    const found = subjects.find(
                      (s) => (s.id || s._id) === e.target.value,
                    );
                    setBulkTargetSubjectName(found?.name || "");
                    setBulkTargetChapterId("");
                    setBulkTargetChapterName("");
                  }}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  {subjects.map((sub) => (
                    <option key={sub.id || sub._id} value={sub.id || sub._id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-800 dark:text-zinc-200 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span>📂 Target Chapter / Topic</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      (Optional)
                    </span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {bulkAvailableChapters.length} chapters available
                  </span>
                </label>
                <select
                  value={bulkTargetChapterId}
                  onChange={(e) => {
                    setBulkTargetChapterId(e.target.value);
                    const found = bulkAvailableChapters.find(
                      (c) => (c.id || c._id) === e.target.value,
                    );
                    setBulkTargetChapterName(found?.name || "");
                  }}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">
                    -- Auto-detect from file or No Chapter --
                  </option>
                  {bulkAvailableChapters.map((chap) => (
                    <option
                      key={chap.id || chap._id}
                      value={chap.id || chap._id}
                    >
                      {chap.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Format Selection Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-zinc-800 pb-2 shrink-0">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setImportFormat("csv")}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                    importFormat === "csv"
                      ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs"
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                  }`}
                >
                  <span>📊 CSV / Excel</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImportFormat("aiken")}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                    importFormat === "aiken"
                      ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs"
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                  }`}
                >
                  <span>📝 Aiken (.txt)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImportFormat("json")}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                    importFormat === "json"
                      ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs"
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                  }`}
                >
                  <span>📦 JSON (Full)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImportFormat("ai_raw")}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                    importFormat === "ai_raw"
                      ? "bg-white dark:bg-zinc-900 text-purple-600 dark:text-purple-400 shadow-xs"
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                  }`}
                >
                  <span>🤖 AI Raw Parser</span>
                </button>
              </div>

              {/* Actions: Load Template, Download Sample, Upload File */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => loadExampleTemplate(importFormat)}
                  title="Insert a pre-filled valid working example into the editor"
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1"
                >
                  <span>📋 Load Example</span>
                </button>

                {importFormat !== "ai_raw" && (
                  <button
                    type="button"
                    onClick={() => downloadSampleTemplate(importFormat as any)}
                    title="Download ready-to-fill sample template file"
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1"
                  >
                    <span>📥 Download Sample</span>
                  </button>
                )}

                <label
                  title="Upload a .csv, .txt, or .json file directly"
                  className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1 border border-blue-200 dark:border-blue-900/60"
                >
                  <span>📂 Choose File</span>
                  <input
                    type="file"
                    accept=".csv,.tsv,.txt,.json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Format Instructions Card */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-800 text-[11px] text-slate-600 dark:text-zinc-400 space-y-1 shrink-0">
              {importFormat === "csv" && (
                <div>
                  <div className="font-semibold text-slate-800 dark:text-zinc-200 mb-0.5">
                    CSV / Excel Format (Standard 10 Columns):
                  </div>
                  <code className="block p-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 font-mono text-[10px] text-slate-800 dark:text-zinc-200 overflow-x-auto whitespace-nowrap">
                    Question, Option 1, Option 2, Option 3, Option 4, Correct
                    (1-4 or A-D), Subject, Topic, Difficulty (easy/medium/hard),
                    Explanation
                  </code>
                </div>
              )}

              {importFormat === "aiken" && (
                <div>
                  <div className="font-semibold text-slate-800 dark:text-zinc-200 mb-0.5">
                    Aiken Format (Moodle / LMS Standard):
                  </div>
                  <p>
                    Question text on line 1, followed by options{" "}
                    <code className="px-1 py-0.5 bg-white dark:bg-zinc-900 rounded font-mono">
                      A. ...
                    </code>
                    ,{" "}
                    <code className="px-1 py-0.5 bg-white dark:bg-zinc-900 rounded font-mono">
                      B. ...
                    </code>
                    , and{" "}
                    <code className="px-1 py-0.5 bg-white dark:bg-zinc-900 rounded font-mono">
                      ANSWER: B
                    </code>
                    . Optional tags:{" "}
                    <code className="px-1 py-0.5 bg-white dark:bg-zinc-900 rounded font-mono">
                      SUBJECT:
                    </code>
                    ,{" "}
                    <code className="px-1 py-0.5 bg-white dark:bg-zinc-900 rounded font-mono">
                      TOPIC:
                    </code>
                    ,{" "}
                    <code className="px-1 py-0.5 bg-white dark:bg-zinc-900 rounded font-mono">
                      DIFFICULTY:
                    </code>
                    ,{" "}
                    <code className="px-1 py-0.5 bg-white dark:bg-zinc-900 rounded font-mono">
                      EXPLANATION:
                    </code>
                    . Separate questions with a blank line.
                  </p>
                </div>
              )}

              {importFormat === "json" && (
                <div>
                  <div className="font-semibold text-slate-800 dark:text-zinc-200 mb-0.5">
                    JSON Array Format:
                  </div>
                  <p>
                    Full schema support with bilingual translations (
                    <code className="px-1 py-0.5 bg-white dark:bg-zinc-900 rounded font-mono">
                      translations.hi
                    </code>
                    ), detailed option structures, numerical answer keys, and
                    explanations.
                  </p>
                </div>
              )}

              {importFormat === "ai_raw" && (
                <div>
                  <div className="font-semibold text-slate-800 dark:text-zinc-200 mb-0.5">
                    AI Multimodal Raw Text Parser:
                  </div>
                  <p>
                    Paste raw, unformatted text copied from PDFs, question
                    papers, or word documents. Click{" "}
                    <strong>"✨ Parse with AI"</strong> below to automatically
                    extract questions, bilingual options, answer keys, and
                    solutions into structured JSON.
                  </p>
                </div>
              )}
            </div>

            {/* Input Text Area */}
            <div className="flex-1 min-h-[160px] flex flex-col">
              <textarea
                rows={10}
                placeholder={
                  importFormat === "csv"
                    ? 'Paste CSV content with header row, or click "Load Example"...'
                    : importFormat === "aiken"
                      ? 'Paste Aiken format questions, or click "Load Example"...'
                      : importFormat === "json"
                        ? 'Paste JSON array of questions, or click "Load Example"...'
                        : 'Paste raw question paper text or OCR notes, then click "✨ Parse with AI"...'
                }
                value={importJsonText}
                onChange={(e) => {
                  setImportJsonText(e.target.value);
                  setImportPreviewCount(0);
                  setImportErrors([]);
                }}
                className="w-full flex-1 p-3 bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 rounded-xl font-mono text-xs text-slate-900 dark:text-zinc-100 focus:outline-hidden resize-none"
              />
            </div>

            {/* Validation Feedback */}
            {importErrors.length > 0 && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 space-y-1 max-h-32 overflow-y-auto shrink-0">
                <span className="font-bold">Validation Issues Detected:</span>
                <ul className="list-disc pl-4 space-y-0.5">
                  {importErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {importPreviewCount > 0 && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center justify-between shrink-0">
                <span>
                  ✓ Validated {importPreviewCount} questions ready to insert
                  into Question Bank!
                </span>
                <span className="text-[10px] bg-emerald-200/60 dark:bg-emerald-900 px-2 py-0.5 rounded font-mono">
                  All constraints passed
                </span>
              </div>
            )}

            {/* Footer Toolbar */}
            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div>
                {importFormat === "ai_raw" ? (
                  <button
                    type="button"
                    disabled={isParsingRawAi || !importJsonText.trim()}
                    onClick={handleAiParseRawText}
                    title="Paste raw paper text and AI will structure it into bilingual MCQs"
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-semibold text-xs disabled:opacity-40 cursor-pointer flex items-center gap-1.5 transition shadow-xs"
                  >
                    {isParsingRawAi ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Parsing with Gemini AI...</span>
                      </>
                    ) : (
                      <>
                        <span>✨ Parse with AI</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Format:{" "}
                    <span className="font-semibold text-slate-700 dark:text-zinc-300 uppercase">
                      {importFormat}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl text-slate-700 dark:text-zinc-300 font-semibold text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleParseImport}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-white rounded-xl font-semibold text-xs cursor-pointer transition shadow-2xs"
                >
                  Validate & Preview
                </button>
                <button
                  type="button"
                  disabled={importPreviewCount === 0 || isImporting}
                  onClick={handleExecuteImport}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs shadow-xs disabled:opacity-40 cursor-pointer transition"
                >
                  {isImporting
                    ? "Importing..."
                    : `Import ${importPreviewCount > 0 ? importPreviewCount : ""} Questions`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* AI QUESTION GENERATOR MODAL */}
      {/* ===================================================================== */}
      {isAiGenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-4xl max-h-[92vh] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-gradient-to-r from-indigo-50/60 via-white to-violet-50/60 dark:from-indigo-950/20 dark:via-zinc-900 dark:to-violet-950/20 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xs">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                    <span>AI Question Generator</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      Gemini Multimodal
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Generate exam-standard MCQs with bilingual English &amp;
                    Devanagari Hindi, distractors, and step-by-step solutions.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAiGenModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
              {/* Configuration Inputs */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-800 space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                      Target Exam
                    </label>
                    <input
                      type="text"
                      value={aiExamName}
                      onChange={(e) => setAiExamName(e.target.value)}
                      placeholder="e.g. SSC CGL, RRB NTPC, UPSC Prelims"
                      className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={aiSubject}
                      onChange={(e) => setAiSubject(e.target.value)}
                      placeholder="e.g. Indian Polity, Quantitative Aptitude"
                      className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                      Chapter / Topic (Optional)
                    </label>
                    <input
                      type="text"
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      placeholder="e.g. Fundamental Rights, Time & Work"
                      className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                      Difficulty Level
                    </label>
                    <div className="flex rounded-lg border border-slate-300 dark:border-zinc-700 p-0.5 bg-white dark:bg-zinc-900">
                      {(["easy", "medium", "hard"] as const).map((diff) => (
                        <button
                          key={diff}
                          type="button"
                          onClick={() => setAiDifficulty(diff)}
                          className={`flex-1 py-1 rounded-md text-[11px] font-semibold capitalize transition ${
                            aiDifficulty === diff
                              ? "bg-indigo-600 text-white shadow-2xs"
                              : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100"
                          }`}
                        >
                          {diff}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                      Number of Questions
                    </label>
                    <div className="flex rounded-lg border border-slate-300 dark:border-zinc-700 p-0.5 bg-white dark:bg-zinc-900">
                      {[3, 5, 10].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setAiCount(num)}
                          className={`flex-1 py-1 rounded-md text-[11px] font-semibold transition ${
                            aiCount === num
                              ? "bg-indigo-600 text-white shadow-2xs"
                              : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100"
                          }`}
                        >
                          {num} Qs
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex sm:self-end">
                    <button
                      type="button"
                      disabled={isGeneratingAi}
                      onClick={handleAiGenerateQuestions}
                      className="w-full py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold text-xs rounded-lg shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition"
                    >
                      {isGeneratingAi ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Generating Questions...</span>
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4 text-indigo-200"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                          </svg>
                          <span>Generate Questions</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Custom Prompt or Syllabus Focus (Optional)
                  </label>
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g. Focus on landmark Supreme Court cases and 2024 constitutional amendments..."
                    className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Generated Questions Preview Cards */}
              {generatedAiQuestions.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2 text-sm">
                      <span>Generated Questions Preview</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        {generatedAiQuestions.length} Ready
                      </span>
                    </h4>
                    <span className="text-slate-400 text-[11px]">
                      Bilingual (English + Hindi) with solutions
                    </span>
                  </div>

                  <div className="space-y-3">
                    {generatedAiQuestions.map((q, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                                {idx + 1}
                              </span>
                              <span className="font-bold text-slate-900 dark:text-zinc-100 text-xs">
                                {q.content}
                              </span>
                            </div>
                            {q.translations?.hi && (
                              <p className="text-[11px] text-slate-600 dark:text-zinc-400 italic pl-7">
                                {q.translations.hi}
                              </p>
                            )}
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 uppercase shrink-0">
                            {q.difficulty}
                          </span>
                        </div>

                        {/* Options */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-7">
                          {q.options?.map((opt: any, optIdx: number) => (
                            <div
                              key={optIdx}
                              className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
                                opt.isCorrect
                                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-semibold"
                                  : "bg-slate-50 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300"
                              }`}
                            >
                              <span
                                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold ${
                                  opt.isCorrect
                                    ? "bg-emerald-600 text-white"
                                    : "bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300"
                                }`}
                              >
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div>{opt.content}</div>
                                {opt.translations?.hi && (
                                  <div className="text-[10px] opacity-80 italic mt-0.5">
                                    {opt.translations.hi}
                                  </div>
                                )}
                              </div>
                              {opt.isCorrect && (
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                  ✓ Answer
                                </span>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Explanation */}
                        {q.explanation && (
                          <div className="ml-7 p-3 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-[11px] text-slate-700 dark:text-zinc-300 space-y-1">
                            <span className="font-bold text-indigo-700 dark:text-indigo-400 block">
                              Detailed Solution:
                            </span>
                            <p>{q.explanation}</p>
                            {q.explanationTranslations?.hi && (
                              <p className="italic text-slate-600 dark:text-zinc-400">
                                {q.explanationTranslations.hi}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-zinc-800/80 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
              <span className="text-slate-500 dark:text-zinc-400 text-xs">
                {generatedAiQuestions.length > 0
                  ? `${generatedAiQuestions.length} questions ready to insert`
                  : "Configure parameters and click Generate"}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAiGenModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl text-slate-700 dark:text-zinc-300 font-semibold text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-700 transition"
                >
                  Close
                </button>

                <button
                  type="button"
                  disabled={generatedAiQuestions.length === 0 || isGeneratingAi}
                  onClick={handleImportAiGeneratedQuestions}
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-semibold text-xs shadow-xs disabled:opacity-40 cursor-pointer flex items-center gap-1.5 transition"
                >
                  <svg
                    className="w-4 h-4 text-emerald-100"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>
                    Import All{" "}
                    {generatedAiQuestions.length > 0
                      ? generatedAiQuestions.length
                      : ""}{" "}
                    into Question Bank
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
