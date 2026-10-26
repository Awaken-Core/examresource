import React, { useState, useEffect } from "react";
import {
  adminApi,
  type AdminTestSeries,
  type AdminSubject,
  type AdminChapter,
  type AdminIndividualTest,
  type AdminTestSection,
  type AdminQuestion,
} from "./api";
import { useAdminToast } from "./AdminToast";

interface TestBuilderManagerProps {
  currentUserRole?: string;
  initialSeriesId?: string;
}

export function TestBuilderManager({
  currentUserRole,
  initialSeriesId,
}: TestBuilderManagerProps) {
  const { showToast } = useAdminToast();
  const isAdmin = currentUserRole === "admin";

  // Series & supporting data
  const [seriesList, setSeriesList] = useState<AdminTestSeries[]>([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>(
    initialSeriesId || "",
  );
  const [tests, setTests] = useState<AdminIndividualTest[]>([]);
  const [isLoadingTests, setIsLoadingTests] = useState(false);

  // Hierarchy for filters & forms
  const [subjects, setSubjects] = useState<AdminSubject[]>([]);
  const [chapters, setChapters] = useState<AdminChapter[]>([]);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const [chapterLoadError, setChapterLoadError] = useState("");
  const [chapterReloadKey, setChapterReloadKey] = useState(0);

  // Filter state
  const [filterMode, setFilterMode] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  // Wizard Modal state
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [editingTest, setEditingTest] = useState<AdminIndividualTest | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);

  // Question Picker state for manual selection
  const [isQuestionPickerOpen, setIsQuestionPickerOpen] = useState(false);
  const [pickerTargetSectionIndex, setPickerTargetSectionIndex] = useState<
    number | null
  >(null);
  const [bankQuestions, setBankQuestions] = useState<AdminQuestion[]>([]);

  const [pickerSelectedIds, setPickerSelectedIds] = useState<string[]>([]);
  const [isLoadingBankQuestions, setIsLoadingBankQuestions] = useState(false);

  // Form Fields - Step 1: Type & Hierarchy
  const [formTestMode, setFormTestMode] = useState<
    "subject" | "chapter" | "full"
  >("subject");
  const [formSubjectId, setFormSubjectId] = useState<string>("");
  const [formChapterId, setFormChapterId] = useState<string>("");

  // Form Fields - Step 2: Details & Access
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formInstructions, setFormInstructions] = useState("");
  const [formAccess, setFormAccess] = useState<"free" | "premium">("free");
  const [formLanguages, setFormLanguages] = useState<string[]>([
    "Hindi",
    "English",
  ]);
  const [formAvailableFrom, setFormAvailableFrom] = useState("");
  const [formAvailableTo, setFormAvailableTo] = useState("");

  // Form Fields - Step 3: Question Selection & Timing / Marks (For Subject & Chapter tests)
  const [formSelectionMode, setFormSelectionMode] = useState<
    "manual" | "automatic"
  >("manual");
  const [formOrderMode, setFormOrderMode] = useState<"fixed" | "randomized">(
    "fixed",
  );
  const [formSetMode, setFormSetMode] = useState<
    "fixed" | "random_per_attempt"
  >("fixed");
  const [formTotalQuestionsCount, setFormTotalQuestionsCount] =
    useState<number>(25);
  const [formDurationMinutes, setFormDurationMinutes] = useState<number>(30);
  const [formPositiveMarks, setFormPositiveMarks] = useState<number>(1);
  const [formNegativeMarkingEnabled, setFormNegativeMarkingEnabled] =
    useState<boolean>(true);
  const [formNegativeMarks, setFormNegativeMarks] = useState<number>(0.25);
  const [formSelectedQuestionIds, setFormSelectedQuestionIds] = useState<
    string[]
  >([]);

  // Form Fields - Step 4: Full Test Sections (For Full test)
  const [formSections, setFormSections] = useState<AdminTestSection[]>([
    {
      name: "General Intelligence & Reasoning",
      order: 0,
      durationMinutes: null,
      positiveMarks: 1,
      negativeMarkingEnabled: true,
      negativeMarks: 0.25,
      selectionMode: "manual",
      questionOrderMode: "fixed",
      questionSetMode: "fixed",
      requiredQuestionCount: 30,
      questions: [],
    },
    {
      name: "General Awareness",
      order: 1,
      durationMinutes: null,
      positiveMarks: 1,
      negativeMarkingEnabled: true,
      negativeMarks: 0.25,
      selectionMode: "manual",
      questionOrderMode: "fixed",
      questionSetMode: "fixed",
      requiredQuestionCount: 40,
      questions: [],
    },
    {
      name: "Mathematics",
      order: 2,
      durationMinutes: null,
      positiveMarks: 1,
      negativeMarkingEnabled: true,
      negativeMarks: 0.25,
      selectionMode: "manual",
      questionOrderMode: "fixed",
      questionSetMode: "fixed",
      requiredQuestionCount: 30,
      questions: [],
    },
  ]);

  // Load initial Test Series list
  useEffect(() => {
    async function loadSeries() {
      try {
        const list = await adminApi.getTestSeries();
        setSeriesList(list || []);
        if (!selectedSeriesId && list && list.length > 0) {
          setSelectedSeriesId(list[0].id || list[0]._id!);
        }
      } catch (err: any) {
        showToast(err.message || "Failed to load test series", "error");
      }
    }
    loadSeries();
  }, []);

  // When selected series changes, load subjects & tests
  const fetchTestsForSeries = async (sId: string) => {
    if (!sId) return;
    setIsLoadingTests(true);
    try {
      const [testData, assignments, allSubjects] = await Promise.all([
        adminApi.getManageableTests(sId, {
          testMode: filterMode !== "ALL" ? filterMode : undefined,
          status: filterStatus !== "ALL" ? filterStatus : undefined,
        }),
        adminApi.getSeriesSubjects(sId),
        adminApi.getSubjects(),
      ]);
      setTests(testData || []);
      const assignedSubjectIds = new Set(
        (assignments || []).map((assignment) => assignment.subjectId),
      );
      setSubjects(
        (allSubjects || []).filter((subject) =>
          assignedSubjectIds.has(subject.id || subject._id || ""),
        ),
      );
    } catch (err: any) {
      showToast(err.message || "Failed to load tests for series", "error");
    } finally {
      setIsLoadingTests(false);
    }
  };

  useEffect(() => {
    if (selectedSeriesId) {
      fetchTestsForSeries(selectedSeriesId);
    }
  }, [selectedSeriesId, filterMode, filterStatus]);

  // Load chapters when formSubjectId changes in wizard
  useEffect(() => {
    let isCurrent = true;

    async function loadChapters() {
      setChapters([]);
      setChapterLoadError("");
      if (selectedSeriesId && formSubjectId) {
        setIsLoadingChapters(true);
        try {
          const chs = await adminApi.getSeriesChapters(
            selectedSeriesId,
            formSubjectId,
          );
          if (isCurrent) setChapters(chs || []);
        } catch (err: any) {
          if (isCurrent) {
            setChapterLoadError(
              err?.message || "Could not load chapters. Please retry.",
            );
          }
        } finally {
          if (isCurrent) setIsLoadingChapters(false);
        }
      } else {
        setIsLoadingChapters(false);
      }
    }
    loadChapters();

    return () => {
      isCurrent = false;
    };
  }, [selectedSeriesId, formSubjectId, chapterReloadKey]);

  // Open Wizard for New Test
  const openCreateWizard = () => {
    setEditingTest(null);
    setWizardStep(1);
    setFormTestMode("subject");
    setFormSubjectId(subjects[0]?.id || subjects[0]?._id || "");
    setFormChapterId("");
    setFormTitle("");
    setFormDescription("");
    setFormInstructions("");
    setFormAccess("free");
    setFormLanguages(["Hindi", "English"]);
    setFormAvailableFrom("");
    setFormAvailableTo("");
    setFormSelectionMode("manual");
    setFormOrderMode("fixed");
    setFormSetMode("fixed");
    setFormTotalQuestionsCount(25);
    setFormDurationMinutes(30);
    setFormPositiveMarks(1);
    setFormNegativeMarkingEnabled(true);
    setFormNegativeMarks(0.25);
    setFormSelectedQuestionIds([]);
    setFormSections([
      {
        name: "General Awareness",
        order: 0,
        positiveMarks: 1,
        negativeMarkingEnabled: true,
        negativeMarks: 0.25,
        selectionMode: "manual",
        questionOrderMode: "fixed",
        questionSetMode: "fixed",
        requiredQuestionCount: 30,
        questions: [],
      },
      {
        name: "Mathematics",
        order: 1,
        positiveMarks: 1,
        negativeMarkingEnabled: true,
        negativeMarks: 0.25,
        selectionMode: "manual",
        questionOrderMode: "fixed",
        questionSetMode: "fixed",
        requiredQuestionCount: 30,
        questions: [],
      },
    ]);
    setIsWizardOpen(true);
  };

  // Open Wizard for Existing Test (Draft or Versioning)
  const openEditWizard = async (t: AdminIndividualTest) => {
    setEditingTest(t);
    setWizardStep(1);
    setFormTestMode(t.testMode);
    setFormSubjectId(t.subjectId || "");
    setFormChapterId(t.chapterId || "");
    setFormTitle(t.title);
    setFormDescription(t.description || "");
    setFormInstructions(t.instructions || "");
    setFormAccess(t.access || "free");
    setFormLanguages(
      t.languages && t.languages.length > 0
        ? t.languages
        : ["Hindi", "English"],
    );
    setFormAvailableFrom(t.availableFrom ? t.availableFrom.slice(0, 16) : "");
    setFormAvailableTo(t.availableTo ? t.availableTo.slice(0, 16) : "");
    setFormSelectionMode(t.questionSelectionMode || "manual");
    setFormOrderMode(t.questionOrderMode || "fixed");
    setFormSetMode(t.questionSetMode || "fixed");
    setFormTotalQuestionsCount(t.totalQuestionsCount || 25);
    setFormDurationMinutes(t.durationMinutes || 30);
    setFormPositiveMarks(t.positiveMarks || 1);
    setFormNegativeMarkingEnabled(t.negativeMarkingEnabled ?? true);
    setFormNegativeMarks(t.negativeMarks || 0);
    setFormSelectedQuestionIds(
      t.questions ? t.questions.map((q) => q.questionId) : [],
    );

    if (t.sections && t.sections.length > 0) {
      setFormSections(t.sections);
    } else {
      setFormSections([]);
    }
    setIsWizardOpen(true);
  };

  // Create New Version from Published Test
  const handleCreateNewVersion = async (t: AdminIndividualTest) => {
    const tId = t.id || t._id!;
    try {
      const cloned = await adminApi.createTestVersion(tId);
      showToast(
        `Created draft Version ${cloned.version} for "${cloned.title}"!`,
        "success",
      );
      fetchTestsForSeries(selectedSeriesId);
      openEditWizard(cloned);
    } catch (err: any) {
      showToast(err.message || "Failed to create new version", "error");
    }
  };

  // Update Status (Publish / Archive) - Admin Only
  const handleStatusChange = async (
    t: AdminIndividualTest,
    newStatus: "published" | "archived",
  ) => {
    if (!isAdmin) {
      showToast("Only administrators can publish or archive tests", "error");
      return;
    }
    const tId = t.id || t._id!;
    try {
      await adminApi.updateIndividualTestStatus(tId, newStatus);
      showToast(
        `Test ${newStatus === "published" ? "published" : "archived"} successfully!`,
        "success",
      );
      fetchTestsForSeries(selectedSeriesId);
    } catch (err: any) {
      const message = err.message || `Failed to update status to ${newStatus}`;
      if (
        newStatus === "published" &&
        message.includes(
          "not mapped to the eligible TestSeries/Subject/Chapter scope",
        )
      ) {
        showToast(
          "This draft has a question outside its mapped scope. Review and reselect its questions in Step 3.",
          "error",
        );
        await openEditWizard(t);
        setWizardStep(3);
        return;
      }
      showToast(message, "error");
    }
  };

  // Delete Test (Lineage deletion - Admin Only)
  const handleDeleteTest = async (t: AdminIndividualTest) => {
    if (!isAdmin) {
      showToast("Only administrators can delete tests", "error");
      return;
    }
    const conf = window.confirm(
      `WARNING: Permanently deleting test "${t.title}" will delete the entire version lineage and all candidate attempts. This action CANNOT be undone. Proceed?`,
    );
    if (!conf) return;

    const tId = t.id || t._id!;
    try {
      await adminApi.deleteIndividualTest(tId);
      showToast("Test lineage permanently deleted", "success");
      fetchTestsForSeries(selectedSeriesId);
    } catch (err: any) {
      showToast(err.message || "Failed to delete test", "error");
    }
  };

  // Question Picker Handler
  const openQuestionPicker = async (sectionIndex: number | null = null) => {
    setPickerTargetSectionIndex(sectionIndex);
    setIsLoadingBankQuestions(true);
    setIsQuestionPickerOpen(true);
    try {
      const section = sectionIndex === null ? null : formSections[sectionIndex];
      const qRes = await adminApi.searchQuestions({
        testSeriesId: selectedSeriesId,
        subjectId: section
          ? section.subjectId || undefined
          : formSubjectId || undefined,
        chapterId: section
          ? section.chapterId || undefined
          : formChapterId || undefined,
        status: "published",
        isAvailableForNewTests: "true",
        limit: 100,
      });
      setBankQuestions(qRes.questions || []);
      const eligibleQuestionIds = new Set(
        (qRes.questions || []).map((question) => question.id || question._id),
      );

      if (sectionIndex !== null) {
        const sec = formSections[sectionIndex];
        setPickerSelectedIds(
          (sec.questions || [])
            .map((q) => q.questionId)
            .filter((id) => eligibleQuestionIds.has(id)),
        );
      } else {
        setPickerSelectedIds(
          formSelectedQuestionIds.filter((id) => eligibleQuestionIds.has(id)),
        );
      }
    } catch (err: any) {
      showToast(err.message || "Failed to load question bank", "error");
    } finally {
      setIsLoadingBankQuestions(false);
    }
  };

  const handleTogglePickerSelection = (qId: string) => {
    setPickerSelectedIds((prev) =>
      prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId],
    );
  };

  const handleApplyPickedQuestions = () => {
    if (pickerTargetSectionIndex !== null) {
      setFormSections((prev) => {
        const copy = [...prev];
        const sec = { ...copy[pickerTargetSectionIndex] };
        sec.questions = pickerSelectedIds.map((id, pos) => ({
          questionId: id,
          position: pos,
          marks: sec.positiveMarks,
          negativeMarks: sec.negativeMarks,
        }));
        copy[pickerTargetSectionIndex] = sec;
        return copy;
      });
    } else {
      setFormSelectedQuestionIds([...pickerSelectedIds]);
      setFormTotalQuestionsCount(pickerSelectedIds.length);
    }
    setIsQuestionPickerOpen(false);
  };

  // Section builders for Full Test
  const addSection = () => {
    setFormSections((prev) => [
      ...prev,
      {
        name: `Section ${prev.length + 1}`,
        order: prev.length,
        positiveMarks: 1,
        negativeMarkingEnabled: true,
        negativeMarks: 0.25,
        selectionMode: "manual",
        questionOrderMode: "fixed",
        questionSetMode: "fixed",
        requiredQuestionCount: 20,
        questions: [],
      },
    ]);
  };

  const removeSection = (idx: number) => {
    if (formSections.length <= 1) return;
    setFormSections((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateSectionField = (idx: number, field: string, val: any) => {
    setFormSections((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  // Save Test (Draft or Submit)
  const handleSaveTest = async (autoPublish = false) => {
    if (!formTitle.trim()) {
      showToast("Test title is required", "error");
      setWizardStep(2);
      return;
    }

    if (formTestMode === "chapter" && !formChapterId) {
      showToast(
        "Chapter selection is required for chapter-wise tests",
        "error",
      );
      setWizardStep(1);
      return;
    }

    if (formTestMode === "full" && formSections.length === 0) {
      showToast(
        "Full tests must contain at least one configured section",
        "error",
      );
      setWizardStep(4);
      return;
    }

    const supportedLanguages =
      formLanguages.length > 0 ? formLanguages : ["Hindi", "English"];

    setIsSaving(true);
    try {
      const payload: any = {
        testSeriesId: selectedSeriesId,
        title: formTitle.trim(),
        description: formDescription.trim() || null,
        instructions: formInstructions.trim() || null,
        testMode: formTestMode,
        subjectId: formTestMode !== "full" ? formSubjectId || null : null,
        chapterId: formTestMode === "chapter" ? formChapterId || null : null,
        access: formAccess,
        languages: supportedLanguages,
        durationMinutes: Number(formDurationMinutes) || null,
        maxAttempts: null,
        positiveMarks: Number(formPositiveMarks) || 1,
        negativeMarkingEnabled: formNegativeMarkingEnabled,
        negativeMarks: formNegativeMarkingEnabled
          ? Number(formNegativeMarks) || 0
          : 0,
        questionSelectionMode: formSelectionMode,
        questionOrderMode: formOrderMode,
        questionSetMode: formSetMode,
        totalQuestionsCount:
          formTestMode === "full"
            ? formSections.reduce(
                (acc, s) =>
                  acc + (s.questions?.length || s.requiredQuestionCount || 0),
                0,
              )
            : Number(formTotalQuestionsCount) || formSelectedQuestionIds.length,
        availableFrom: formAvailableFrom
          ? new Date(formAvailableFrom).toISOString()
          : null,
        availableTo: formAvailableTo
          ? new Date(formAvailableTo).toISOString()
          : null,
        questions:
          formTestMode !== "full"
            ? formSelectedQuestionIds.map((id) => ({
                questionId: id,
                marks: Number(formPositiveMarks),
                negativeMarks: formNegativeMarkingEnabled
                  ? Number(formNegativeMarks)
                  : 0,
              }))
            : [],
        sections:
          formTestMode === "full"
            ? formSections.map((sec, idx) => ({
                name: sec.name,
                order: idx,
                subjectId: sec.subjectId || null,
                chapterId: sec.chapterId || null,
                durationMinutes: sec.durationMinutes || null,
                positiveMarks: Number(sec.positiveMarks) || 1,
                negativeMarkingEnabled: sec.negativeMarkingEnabled ?? true,
                negativeMarks: sec.negativeMarkingEnabled
                  ? Number(sec.negativeMarks) || 0
                  : 0,
                selectionMode: sec.selectionMode || "manual",
                questionOrderMode: sec.questionOrderMode || "fixed",
                questionSetMode: sec.questionSetMode || "fixed",
                requiredQuestionCount: sec.requiredQuestionCount || 20,
                questions: (sec.questions || []).map((q) => ({
                  questionId: q.questionId,
                  marks: Number(sec.positiveMarks),
                  negativeMarks: sec.negativeMarkingEnabled
                    ? Number(sec.negativeMarks)
                    : 0,
                })),
              }))
            : [],
      };

      let savedTest: AdminIndividualTest;
      if (editingTest) {
        const tId = editingTest.id || editingTest._id!;
        savedTest = await adminApi.updateIndividualTest(tId, payload);
        showToast("Test draft updated successfully", "success");
      } else {
        savedTest = await adminApi.createIndividualTest(payload);
        showToast("New test created as draft", "success");
      }

      if (autoPublish && isAdmin) {
        const savedId = savedTest.id || savedTest._id!;
        await adminApi.updateIndividualTestStatus(savedId, "published");
        showToast("Test published successfully!", "success");
      }

      setIsWizardOpen(false);
      fetchTestsForSeries(selectedSeriesId);
    } catch (err: any) {
      showToast(err.message || "Failed to save test configuration", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Series Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2.5">
            <span>Test Builder & Exam Configurator</span>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60">
              Stage 4 APIs
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Build Subject-wise, Chapter-wise, and multi-section Full Mock Tests
            with granular timing, negative marking, randomized pools, and
            immutable versioning.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-56">
            <select
              value={selectedSeriesId}
              onChange={(e) => {
                setSelectedSeriesId(e.target.value);
                setFormSubjectId("");
                setFormChapterId("");
              }}
              className="w-full px-3 py-1.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-zinc-200 focus:outline-hidden"
            >
              {seriesList.map((s) => (
                <option key={s.id || s._id} value={s.id || s._id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={openCreateWizard}
            disabled={
              !selectedSeriesId || isLoadingTests || subjects.length === 0
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer shrink-0"
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
            <span>Create Test</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2.5 p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Filter:
        </span>
        <select
          value={filterMode}
          onChange={(e) => setFilterMode(e.target.value)}
          className="px-2.5 py-1 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-700 dark:text-zinc-300"
        >
          <option value="ALL">All Test Types</option>
          <option value="subject">Subject-wise Tests</option>
          <option value="chapter">Chapter-wise Tests</option>
          <option value="full">Full Mock Tests</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-2.5 py-1 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-700 dark:text-zinc-300"
        >
          <option value="ALL">All Statuses</option>
          <option value="draft">Drafts</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Tests Table */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xs overflow-hidden">
        {isLoadingTests ? (
          <div className="py-16 text-center text-xs text-slate-500 dark:text-zinc-400 flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading configured tests...</span>
          </div>
        ) : tests.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500 dark:text-zinc-400 space-y-2">
            <p className="font-semibold text-slate-700 dark:text-zinc-300">
              No tests configured for this series yet
            </p>
            <p>
              Click "Create Test" to build a Subject, Chapter, or Full Mock
              Test.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-zinc-800/60 border-b border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 font-semibold">
                <tr>
                  <th className="py-3 px-4">Test Title & Scope</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4">Questions & Duration</th>
                  <th className="py-3 px-4">Marking</th>
                  <th className="py-3 px-4">Version</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-slate-800 dark:text-zinc-200">
                {tests.map((t) => {
                  const tId = t.id || t._id!;
                  const isPublished = t.status === "published";
                  return (
                    <tr
                      key={tId}
                      className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-zinc-100 text-sm">
                          {t.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-2 mt-0.5">
                          <span className="uppercase font-semibold tracking-wider text-blue-600 dark:text-blue-400">
                            {t.access}
                          </span>
                          <span>•</span>
                          <span>{t.languages?.join(", ")}</span>
                          {t.sections && t.sections.length > 0 && (
                            <>
                              <span>•</span>
                              <span>{t.sections.length} Sections</span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md font-semibold text-[10px] uppercase ${
                            t.testMode === "full"
                              ? "bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900/60"
                              : t.testMode === "chapter"
                                ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60"
                                : "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60"
                          }`}
                        >
                          {t.testMode} Test
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium">
                          {t.totalQuestionsCount || t.questionsCount || 0}{" "}
                          Questions
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                          {t.durationMinutes
                            ? `${t.durationMinutes} mins`
                            : "Untimed"}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div>+{t.positiveMarks} Marks</div>
                        <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                          {t.negativeMarkingEnabled
                            ? `-${t.negativeMarks} Neg`
                            : "No Negative"}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                          v{t.version || 1}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            t.status === "published"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                              : t.status === "draft"
                                ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                                : "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-400"
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* If published, editing must clone a new version */}
                          {isPublished ? (
                            <button
                              type="button"
                              onClick={() => handleCreateNewVersion(t)}
                              title="Create new draft version (Published tests are immutable)"
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-300 rounded-lg font-semibold transition cursor-pointer"
                            >
                              New Version
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openEditWizard(t)}
                              title="Edit test draft"
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 rounded-lg font-semibold transition cursor-pointer"
                            >
                              Edit Draft
                            </button>
                          )}

                          {/* Admin status toggles */}
                          {isAdmin && !isPublished && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(t, "published")}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs transition cursor-pointer"
                            >
                              Publish
                            </button>
                          )}

                          {isAdmin && isPublished && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(t, "archived")}
                              className="px-2 py-1 text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 transition cursor-pointer"
                            >
                              Archive
                            </button>
                          )}

                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDeleteTest(t)}
                              title="Delete entire test lineage"
                              className="p-1.5 text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition cursor-pointer"
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* GUIDED MULTI-STEP TEST BUILDER WIZARD */}
      {/* ===================================================================== */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-4xl max-h-[92vh] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl flex flex-col overflow-hidden">
            {/* Wizard Header & Steps Stepper */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  <span>
                    {editingTest
                      ? `Edit Test (v${editingTest.version || 1})`
                      : "New Test Wizard"}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    Step {wizardStep} of 6
                  </span>
                </h2>
                <button
                  type="button"
                  onClick={() => setIsWizardOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Step indicator bar */}
              <div className="grid grid-cols-6 gap-2 text-center text-[10px] font-bold">
                {[
                  "1. Type & Scope",
                  "2. Test Details",
                  "3. Questions Pool",
                  "4. Full Sections",
                  "5. Marks & Timers",
                  "6. Review & Save",
                ].map((st, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setWizardStep(i + 1)}
                    className={`py-1.5 px-1 rounded-lg border transition ${
                      wizardStep === i + 1
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : wizardStep > i + 1
                          ? "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700"
                          : "text-slate-400 dark:text-zinc-600 border-transparent"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Wizard Step Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-xs space-y-4">
              {/* STEP 1: TEST TYPE & SCOPE */}
              {wizardStep === 1 && (
                <div className="space-y-4 max-w-xl mx-auto">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                    Select Test Type & Hierarchy Scope
                  </h3>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      {
                        mode: "subject",
                        title: "Subject-wise Test",
                        desc: "Focus on one subject across chapters.",
                      },
                      {
                        mode: "chapter",
                        title: "Chapter-wise Test",
                        desc: "Deep dive into a specific exam chapter.",
                      },
                      {
                        mode: "full",
                        title: "Full Mock Test",
                        desc: "Comprehensive exam with multiple sections.",
                      },
                    ].map((item) => (
                      <div
                        key={item.mode}
                        onClick={() => setFormTestMode(item.mode as any)}
                        className={`p-3 rounded-xl border cursor-pointer transition space-y-1 ${
                          formTestMode === item.mode
                            ? "bg-blue-50/60 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/20"
                            : "bg-slate-50 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-700 hover:border-slate-300"
                        }`}
                      >
                        <div className="font-bold text-slate-900 dark:text-zinc-100">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                          {item.desc}
                        </div>
                      </div>
                    ))}
                  </div>

                  {formTestMode !== "full" && (
                    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-zinc-800">
                      <div className="space-y-1">
                        <label className="block font-semibold text-slate-700 dark:text-zinc-300">
                          Target Subject{" "}
                          <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={formSubjectId}
                          onChange={(e) => {
                            setFormSubjectId(e.target.value);
                            setFormChapterId("");
                          }}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100"
                        >
                          {subjects.map((sub) => (
                            <option
                              key={sub.id || sub._id}
                              value={sub.id || sub._id}
                            >
                              {sub.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {formTestMode === "chapter" && (
                        <div className="space-y-1">
                          <label className="block font-semibold text-slate-700 dark:text-zinc-300">
                            Exam-Specific Chapter{" "}
                            <span className="text-rose-500">*</span>
                          </label>
                          <select
                            value={formChapterId}
                            onChange={(e) => setFormChapterId(e.target.value)}
                            disabled={
                              isLoadingChapters ||
                              !formSubjectId ||
                              chapters.length === 0
                            }
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100"
                          >
                            <option value="">
                              {isLoadingChapters
                                ? "Loading chapters..."
                                : chapterLoadError
                                  ? "Could not load chapters"
                                  : chapters.length
                                    ? "Select Chapter..."
                                    : "No chapters available"}
                            </option>
                            {chapters.map((ch) => (
                              <option
                                key={ch.id || ch._id}
                                value={ch.id || ch._id}
                              >
                                {ch.name}
                              </option>
                            ))}
                          </select>
                          {chapterLoadError ? (
                            <div
                              className="flex items-center justify-between gap-3 text-xs text-rose-500"
                              role="alert"
                            >
                              <span>{chapterLoadError}</span>
                              <button
                                type="button"
                                className="font-semibold underline"
                                onClick={() =>
                                  setChapterReloadKey((key) => key + 1)
                                }
                              >
                                Retry
                              </button>
                            </div>
                          ) : !isLoadingChapters &&
                            !chapterLoadError &&
                            !chapters.length &&
                            formSubjectId ? (
                            <p className="text-xs text-amber-600 dark:text-amber-400">
                              This subject has no chapters in the selected test
                              series. Add a chapter to this series first.
                            </p>
                          ) : null}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: TEST DETAILS & ACCESS */}
              {wizardStep === 2 && (
                <div className="space-y-4 max-w-xl mx-auto">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                    Test Details, Access & Scheduling
                  </h3>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700 dark:text-zinc-300">
                      Test Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. RRB NTPC Stage 1: Full Mock Test 01"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700 dark:text-zinc-300">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Brief overview of the test syllabus or target..."
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block font-semibold text-slate-700 dark:text-zinc-300">
                        Access Tier
                      </label>
                      <select
                        value={formAccess}
                        onChange={(e: any) => setFormAccess(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100"
                      >
                        <option value="free">Free Test</option>
                        <option value="premium">Premium Test</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block font-semibold text-slate-700 dark:text-zinc-300">
                        Supported Languages
                      </label>
                      <input
                        type="text"
                        value={formLanguages.join(", ")}
                        onChange={(e) =>
                          setFormLanguages(
                            e.target.value
                              .split(",")
                              .map((l) => l.trim())
                              .filter(Boolean),
                          )
                        }
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-zinc-800">
                    <div className="space-y-1">
                      <label className="block font-semibold text-slate-700 dark:text-zinc-300">
                        Available From (Optional)
                      </label>
                      <input
                        type="datetime-local"
                        value={formAvailableFrom}
                        onChange={(e) => setFormAvailableFrom(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block font-semibold text-slate-700 dark:text-zinc-300">
                        Available To (Optional)
                      </label>
                      <input
                        type="datetime-local"
                        value={formAvailableTo}
                        onChange={(e) => setFormAvailableTo(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: QUESTION SELECTION & ORDER BEHAVIOR */}
              {wizardStep === 3 && (
                <div className="space-y-4 max-w-xl mx-auto">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                    Question Selection & Shuffling Behavior
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block font-semibold text-slate-700 dark:text-zinc-300">
                        Selection Mode
                      </label>
                      <select
                        value={formSelectionMode}
                        onChange={(e: any) =>
                          setFormSelectionMode(e.target.value)
                        }
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100"
                      >
                        <option value="manual">
                          Manual Selection (Admin picks questions)
                        </option>
                        <option value="automatic">
                          Automatic Selection (From eligible pool)
                        </option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block font-semibold text-slate-700 dark:text-zinc-300">
                        Question Set Mode
                      </label>
                      <select
                        value={formSetMode}
                        onChange={(e: any) => setFormSetMode(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100"
                      >
                        <option value="fixed">
                          Fixed Question Set (Same for every attempt)
                        </option>
                        <option value="random_per_attempt">
                          Random Subset Per Attempt
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700 dark:text-zinc-300">
                      Display Order Mode
                    </label>
                    <select
                      value={formOrderMode}
                      onChange={(e: any) => setFormOrderMode(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100"
                    >
                      <option value="fixed">
                        Fixed Order (Configured Sequence)
                      </option>
                      <option value="randomized">
                        Randomized Question Order
                      </option>
                    </select>
                  </div>

                  {formTestMode !== "full" && (
                    <div className="p-4 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-zinc-100">
                            {formSelectedQuestionIds.length} Questions Selected
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                            Required count: {formTotalQuestionsCount} questions
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setFormSelectionMode("automatic");
                            }}
                            className="px-3 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-xs cursor-pointer flex items-center gap-1.5 transition"
                            title="Use automatic selection from this test's eligible mapped question pool"
                          >
                            <span>🎲 AI Smart Pick</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openQuestionPicker(null)}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-xs cursor-pointer"
                          >
                            Pick Questions from Bank
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block font-semibold text-slate-700 dark:text-zinc-300">
                          Total Question Count Target
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="500"
                          value={formTotalQuestionsCount}
                          onChange={(e) =>
                            setFormTotalQuestionsCount(
                              parseInt(e.target.value, 10),
                            )
                          }
                          className="w-32 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-zinc-100 font-semibold"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4: FULL TEST SECTIONS BUILDER */}
              {wizardStep === 4 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                        Configure Full Test Sections
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                        Each section can have independent marking schemes,
                        question counts, and optional section timers.
                      </p>
                    </div>

                    {formTestMode === "full" && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={addSection}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs shadow-xs cursor-pointer"
                        >
                          + Add Section
                        </button>
                      </div>
                    )}
                  </div>

                  {formTestMode !== "full" ? (
                    <div className="p-6 text-center bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-800 rounded-2xl text-slate-500">
                      Sections are only applicable to{" "}
                      <strong>Full Mock Tests</strong>. Your current selection
                      is a <strong>{formTestMode}-wise test</strong>.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {formSections.map((sec, sIdx) => (
                        <div
                          key={sIdx}
                          className="p-4 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 rounded-2xl space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 flex items-center justify-center font-bold text-[10px]">
                                {sIdx + 1}
                              </span>
                              <input
                                type="text"
                                value={sec.name}
                                onChange={(e) =>
                                  updateSectionField(
                                    sIdx,
                                    "name",
                                    e.target.value,
                                  )
                                }
                                className="font-bold text-sm bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg px-2.5 py-1 text-slate-900 dark:text-zinc-100"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => openQuestionPicker(sIdx)}
                                className="px-2.5 py-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg text-blue-600 dark:text-blue-400 font-semibold cursor-pointer"
                              >
                                Pick Questions ({sec.questions?.length || 0})
                              </button>
                              {formSections.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeSection(sIdx)}
                                  className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 dark:border-zinc-700 text-[11px]">
                            <div>
                              <label className="block text-slate-500 mb-0.5">
                                Required Questions
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={sec.requiredQuestionCount || 20}
                                onChange={(e) =>
                                  updateSectionField(
                                    sIdx,
                                    "requiredQuestionCount",
                                    parseInt(e.target.value, 10),
                                  )
                                }
                                className="w-full px-2 py-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-md"
                              />
                            </div>

                            <div>
                              <label className="block text-slate-500 mb-0.5">
                                Section Timer (Mins, opt)
                              </label>
                              <input
                                type="number"
                                placeholder="Untimed"
                                value={sec.durationMinutes || ""}
                                onChange={(e) =>
                                  updateSectionField(
                                    sIdx,
                                    "durationMinutes",
                                    e.target.value
                                      ? parseInt(e.target.value, 10)
                                      : null,
                                  )
                                }
                                className="w-full px-2 py-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-md"
                              />
                            </div>

                            <div>
                              <label className="block text-slate-500 mb-0.5">
                                Positive Marks
                              </label>
                              <input
                                type="number"
                                step="0.25"
                                value={sec.positiveMarks}
                                onChange={(e) =>
                                  updateSectionField(
                                    sIdx,
                                    "positiveMarks",
                                    parseFloat(e.target.value),
                                  )
                                }
                                className="w-full px-2 py-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-md"
                              />
                            </div>

                            <div>
                              <label className="block text-slate-500 mb-0.5">
                                Negative Marks
                              </label>
                              <input
                                type="number"
                                step="0.25"
                                value={sec.negativeMarks}
                                onChange={(e) =>
                                  updateSectionField(
                                    sIdx,
                                    "negativeMarks",
                                    parseFloat(e.target.value),
                                  )
                                }
                                className="w-full px-2 py-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-md"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 5: OVERALL DURATION & MARKING */}
              {wizardStep === 5 && (
                <div className="space-y-4 max-w-xl mx-auto">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                    Overall Timing & Marking Configuration
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block font-semibold text-slate-700 dark:text-zinc-300">
                        Overall Test Duration (Minutes)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="1440"
                        value={formDurationMinutes}
                        onChange={(e) =>
                          setFormDurationMinutes(parseInt(e.target.value, 10))
                        }
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block font-semibold text-slate-700 dark:text-zinc-300">
                        Attempts
                      </label>
                      <p className="flex h-[42px] items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                        Unlimited
                      </p>
                    </div>
                  </div>

                  {formTestMode !== "full" && (
                    <div className="p-4 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 rounded-2xl space-y-3">
                      <div className="space-y-1">
                        <label className="block font-semibold text-slate-700 dark:text-zinc-300">
                          Positive Marks Per Correct Question
                        </label>
                        <input
                          type="number"
                          step="0.25"
                          min="0.25"
                          value={formPositiveMarks}
                          onChange={(e) =>
                            setFormPositiveMarks(parseFloat(e.target.value))
                          }
                          className="w-full sm:w-1/2 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-zinc-100"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="checkbox"
                          id="negMarkCb"
                          checked={formNegativeMarkingEnabled}
                          onChange={(e) =>
                            setFormNegativeMarkingEnabled(e.target.checked)
                          }
                          className="w-4 h-4 rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label
                          htmlFor="negMarkCb"
                          className="font-semibold text-slate-700 dark:text-zinc-300"
                        >
                          Enable Negative Marking Penalty
                        </label>
                      </div>

                      {formNegativeMarkingEnabled && (
                        <div className="space-y-1 pl-6">
                          <label className="block text-slate-600 dark:text-zinc-400">
                            Negative Marks Penalty (e.g. 0.25, 0.33)
                          </label>
                          <input
                            type="number"
                            step="0.05"
                            min="0"
                            value={formNegativeMarks}
                            onChange={(e) =>
                              setFormNegativeMarks(parseFloat(e.target.value))
                            }
                            className="w-full sm:w-1/2 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-zinc-100"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 6: SUMMARY & REVIEW */}
              {wizardStep === 6 && (
                <div className="space-y-4 max-w-xl mx-auto">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                    Configuration Review
                  </h3>

                  <div className="p-4 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 rounded-2xl space-y-2.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-zinc-700">
                      <span className="text-slate-500">Test Title:</span>
                      <span className="font-bold text-slate-900 dark:text-zinc-100">
                        {formTitle}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-zinc-700">
                      <span className="text-slate-500">Test Mode:</span>
                      <span className="font-bold uppercase text-blue-600">
                        {formTestMode} Test
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-zinc-700">
                      <span className="text-slate-500">Access Tier:</span>
                      <span className="font-bold uppercase text-emerald-600">
                        {formAccess}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-zinc-700">
                      <span className="text-slate-500">Duration:</span>
                      <span className="font-bold">
                        {formDurationMinutes} Minutes
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-zinc-700">
                      <span className="text-slate-500">Languages:</span>
                      <span>{formLanguages.join(", ")}</span>
                    </div>

                    {formTestMode === "full" ? (
                      <div className="py-1">
                        <span className="text-slate-500 block mb-1">
                          Sections ({formSections.length}):
                        </span>
                        <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                          {formSections.map((s, idx) => (
                            <li key={idx}>
                              <strong>{s.name}</strong>:{" "}
                              {s.questions?.length || s.requiredQuestionCount}{" "}
                              questions (+{s.positiveMarks} / -{s.negativeMarks}
                              )
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="flex justify-between py-1 border-b border-slate-200 dark:border-zinc-700">
                        <span className="text-slate-500">Questions:</span>
                        <span className="font-bold">
                          {formSelectedQuestionIds.length} questions (
                          {formSelectionMode})
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Wizard Navigation Footer */}
            <div className="p-4 bg-slate-50 dark:bg-zinc-800/80 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs">
              <button
                type="button"
                disabled={wizardStep === 1}
                onClick={() => setWizardStep((prev) => Math.max(1, prev - 1))}
                className="px-4 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl font-semibold disabled:opacity-40 cursor-pointer"
              >
                Previous Step
              </button>

              <div className="flex items-center gap-2">
                {wizardStep < 6 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setWizardStep((prev) => Math.min(6, prev + 1))
                    }
                    className="px-5 py-2 bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-semibold shadow-xs cursor-pointer"
                  >
                    Next Step →
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => handleSaveTest(false)}
                      className="px-4 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl font-semibold text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 cursor-pointer"
                    >
                      {isSaving ? "Saving..." : "Save Draft"}
                    </button>

                    {isAdmin && (
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleSaveTest(true)}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-xs cursor-pointer"
                      >
                        {isSaving ? "Saving..." : "Publish Test"}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* QUESTION PICKER MODAL */}
      {/* ===================================================================== */}
      {isQuestionPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-3xl max-h-[85vh] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                  Select Questions from Bank
                </h3>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                  {pickerSelectedIds.length} questions currently selected
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsQuestionPickerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 text-xs">
              {isLoadingBankQuestions ? (
                <div className="py-12 text-center text-slate-500">
                  Loading eligible questions...
                </div>
              ) : bankQuestions.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  No questions found in this scope.
                </div>
              ) : (
                bankQuestions.map((q) => {
                  const qId = q.id || q._id!;
                  const isChecked = pickerSelectedIds.includes(qId);
                  return (
                    <div
                      key={qId}
                      onClick={() => handleTogglePickerSelection(qId)}
                      className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                        isChecked
                          ? "bg-blue-50/70 dark:bg-blue-950/30 border-blue-400 dark:border-blue-800"
                          : "bg-slate-50 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-1 w-4 h-4 rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-slate-700 dark:text-zinc-300">
                            {q.subject}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-slate-400">
                            {q.difficulty}
                          </span>
                        </div>
                        <p className="text-slate-900 dark:text-zinc-100 font-medium">
                          {q.content}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-zinc-800 border-t border-slate-200 dark:border-zinc-800 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsQuestionPickerOpen(false)}
                className="px-4 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyPickedQuestions}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-xs cursor-pointer"
              >
                Apply Selection ({pickerSelectedIds.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
