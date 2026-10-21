import React, { useState, useEffect } from 'react';
import {
  adminApi,
  type AdminQuestion,
  type AdminSubject,
  type AdminChapter,
  type AdminTestSeries,
} from './api';
import { useAdminToast } from './AdminToast';

interface QuestionBankManagerProps {
  currentUserRole?: string;
}

export function QuestionBankManager({ currentUserRole }: QuestionBankManagerProps) {
  const { showToast } = useAdminToast();
  const isAdmin = currentUserRole === 'admin';

  // Questions and query states
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedSubjectId, setSelectedSubjectId] = useState('ALL');
  const [selectedChapterId, setSelectedChapterId] = useState('ALL');
  const [selectedAvailability, setSelectedAvailability] = useState<'ALL' | 'true' | 'false'>('ALL');

  // Supporting hierarchy data
  const [subjects, setSubjects] = useState<AdminSubject[]>([]);
  const [seriesList, setSeriesList] = useState<AdminTestSeries[]>([]);
  const [availableChapters, setAvailableChapters] = useState<AdminChapter[]>([]);

  // Pagination
  const [limit] = useState(25);
  const [offset, setOffset] = useState(0);

  // Question CRUD Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<AdminQuestion | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Mapping Drawer / Modal
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
  const [activeQuestionForMapping, setActiveQuestionForMapping] = useState<AdminQuestion | null>(null);
  const [mappingSeriesId, setMappingSeriesId] = useState('');
  const [mappingSubjectId, setMappingSubjectId] = useState('');
  const [mappingChapterId, setMappingChapterId] = useState('');
  const [isSavingMapping, setIsSavingMapping] = useState(false);

  // Bulk Import Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importPreviewCount, setImportPreviewCount] = useState(0);
  const [isImporting, setIsImporting] = useState(false);

  // Form Fields for single question
  const [formContent, setFormContent] = useState('');
  const [formContentHi, setFormContentHi] = useState('');
  const [formType, setFormType] = useState<'single_choice' | 'multiple_choice' | 'numerical'>('single_choice');
  const [formNumericalAnswer, setFormNumericalAnswer] = useState('');
  const [formDifficulty, setFormDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [formStatus, setFormStatus] = useState<'draft' | 'published' | 'archived'>('published');
  const [formSubjectName, setFormSubjectName] = useState('');
  const [formSubjectId, setFormSubjectId] = useState('');
  const [formChapterId, setFormChapterId] = useState('');
  const [formTopic, setFormTopic] = useState('');
  const [formMarks, setFormMarks] = useState(1);
  const [formNegativeMarks, setFormNegativeMarks] = useState(0.25);
  const [formExplanation, setFormExplanation] = useState('');
  const [formExplanationHi, setFormExplanationHi] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formIsAvailable, setFormIsAvailable] = useState(true);

  // Options state
  const [formOptions, setFormOptions] = useState<
    Array<{ content: string; contentHi?: string; isCorrect: boolean; imageUrl?: string | null }>
  >([
    { content: '', isCorrect: true },
    { content: '', isCorrect: false },
    { content: '', isCorrect: false },
    { content: '', isCorrect: false },
  ]);

  // Load initial subjects & series for dropdowns
  useEffect(() => {
    async function loadMetadata() {
      try {
        const [subs, series] = await Promise.all([
          adminApi.getSubjects(),
          adminApi.getTestSeries(),
        ]);
        setSubjects(subs || []);
        setSeriesList(series || []);
      } catch (err: any) {
        showToast(err.message || 'Failed to load reference subjects', 'error');
      }
    }
    loadMetadata();
  }, []);

  // Fetch chapters when mapping series & subject are chosen
  useEffect(() => {
    async function loadChapters() {
      if (mappingSeriesId && mappingSubjectId) {
        try {
          const chs = await adminApi.getSeriesChapters(mappingSeriesId, mappingSubjectId);
          setAvailableChapters(chs || []);
        } catch {
          setAvailableChapters([]);
        }
      } else {
        setAvailableChapters([]);
      }
    }
    loadChapters();
  }, [mappingSeriesId, mappingSubjectId]);

  // Fetch Questions
  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.searchQuestions({
        search: search.trim() || undefined,
        type: selectedType,
        difficulty: selectedDifficulty,
        status: selectedStatus,
        subjectId: selectedSubjectId !== 'ALL' ? selectedSubjectId : undefined,
        chapterId: selectedChapterId !== 'ALL' ? selectedChapterId : undefined,
        isAvailableForNewTests: selectedAvailability !== 'ALL' ? selectedAvailability : undefined,
        limit,
        offset,
      });
      setQuestions(res.questions || []);
      setTotalCount(res.total || 0);
    } catch (err: any) {
      showToast(err.message || 'Failed to load questions from Question Bank', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [offset, selectedType, selectedDifficulty, selectedStatus, selectedAvailability]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
    fetchQuestions();
  };

  // Open Create Modal
  const openCreateModal = () => {
    setEditingQuestion(null);
    setFormContent('');
    setFormContentHi('');
    setFormType('single_choice');
    setFormNumericalAnswer('');
    setFormDifficulty('medium');
    setFormStatus('published');
    setFormSubjectName(subjects[0]?.name || 'General Studies');
    setFormSubjectId(subjects[0]?.id || subjects[0]?._id || '');
    setFormChapterId('');
    setFormTopic('');
    setFormMarks(1);
    setFormNegativeMarks(0.25);
    setFormExplanation('');
    setFormExplanationHi('');
    setFormTags('');
    setFormIsAvailable(true);
    setFormOptions([
      { content: '', isCorrect: true },
      { content: '', isCorrect: false },
      { content: '', isCorrect: false },
      { content: '', isCorrect: false },
    ]);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (q: AdminQuestion) => {
    setEditingQuestion(q);
    setFormContent(q.content);
    setFormContentHi(q.translations?.hi || '');
    setFormType(q.type || 'single_choice');
    setFormNumericalAnswer(q.numericalAnswer || '');
    setFormDifficulty(q.difficulty || 'medium');
    setFormStatus(q.status || 'published');
    setFormSubjectName(q.subject || '');
    setFormSubjectId(q.subjectId || '');
    setFormChapterId(q.chapterId || '');
    setFormTopic(q.topic || '');
    setFormMarks(q.marks || 1);
    setFormNegativeMarks(q.negativeMarks || 0);
    setFormExplanation(q.explanation || '');
    setFormExplanationHi(q.explanationTranslations?.hi || '');
    setFormTags(q.tags ? q.tags.join(', ') : '');
    setFormIsAvailable(q.isAvailableForNewTests !== false);

    if (q.options && q.options.length > 0) {
      setFormOptions(
        q.options.map((opt) => ({
          content: opt.content,
          contentHi: opt.translations?.hi || '',
          isCorrect: opt.isCorrect,
          imageUrl: opt.imageUrl,
        }))
      );
    } else {
      setFormOptions([
        { content: '', isCorrect: true },
        { content: '', isCorrect: false },
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
    if (formType === 'single_choice') {
      setFormOptions((prev) =>
        prev.map((opt, i) => ({ ...opt, isCorrect: i === idx }))
      );
    } else if (formType === 'multiple_choice') {
      setFormOptions((prev) => {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], isCorrect: !copy[idx].isCorrect };
        return copy;
      });
    }
  };

  const addOptionRow = () => {
    if (formOptions.length >= 8) return;
    setFormOptions((prev) => [...prev, { content: '', isCorrect: false }]);
  };

  const removeOptionRow = (idx: number) => {
    if (formOptions.length <= 2) return;
    setFormOptions((prev) => prev.filter((_, i) => i !== idx));
  };

  // Save Single Question
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formContent.trim()) {
      showToast('Question text is required', 'error');
      return;
    }

    if (formType === 'numerical') {
      if (!formNumericalAnswer.trim()) {
        showToast('Numerical answer is required for numerical questions', 'error');
        return;
      }
    } else {
      const emptyOpt = formOptions.some((o) => !o.content.trim());
      if (emptyOpt) {
        showToast('All option contents must be filled', 'error');
        return;
      }
      const correctCount = formOptions.filter((o) => o.isCorrect).length;
      if (correctCount === 0) {
        showToast('At least one option must be marked as correct', 'error');
        return;
      }
      if (formType === 'single_choice' && correctCount !== 1) {
        showToast('Single-choice questions must have exactly one correct option', 'error');
        return;
      }
    }

    setIsSaving(true);
    try {
      const tagsArray = formTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const translations: Record<string, string> = {};
      if (formContentHi.trim()) translations.hi = formContentHi.trim();

      const explanationTranslations: Record<string, string> = {};
      if (formExplanationHi.trim()) explanationTranslations.hi = formExplanationHi.trim();

      const optionsPayload =
        formType === 'numerical'
          ? []
          : formOptions.map((o, pos) => {
              const optTrans: Record<string, string> = {};
              if (o.contentHi?.trim()) optTrans.hi = o.contentHi.trim();
              return {
                content: o.content.trim(),
                isCorrect: o.isCorrect,
                position: pos,
                imageUrl: o.imageUrl || null,
                translations: Object.keys(optTrans).length > 0 ? optTrans : undefined,
              };
            });

      const payload: any = {
        content: formContent.trim(),
        translations: Object.keys(translations).length > 0 ? translations : undefined,
        type: formType,
        numericalAnswer: formType === 'numerical' ? formNumericalAnswer.trim() : null,
        difficulty: formDifficulty,
        status: formStatus,
        isAvailableForNewTests: formIsAvailable,
        subject: formSubjectName.trim() || 'General Studies',
        subjectId: formSubjectId || null,
        chapterId: formChapterId || null,
        topic: formTopic.trim() || null,
        marks: Number(formMarks) || 1,
        negativeMarks: Number(formNegativeMarks) || 0,
        explanation: formExplanation.trim() || null,
        explanationTranslations:
          Object.keys(explanationTranslations).length > 0 ? explanationTranslations : undefined,
        tags: tagsArray,
        options: optionsPayload,
      };

      if (editingQuestion) {
        const qId = editingQuestion.id || editingQuestion._id!;
        await adminApi.updateQuestion(qId, payload);
        showToast('Question updated successfully', 'success');
      } else {
        await adminApi.createQuestion({ questions: [payload] });
        showToast('Question created in Question Bank', 'success');
      }

      setIsModalOpen(false);
      fetchQuestions();
    } catch (err: any) {
      showToast(err.message || 'Failed to save question', 'error');
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
          ? 'Question activated for new tests'
          : 'Question retired from future tests (historical tests preserved)',
        'success'
      );
      setQuestions((prev) =>
        prev.map((item) => ((item.id || item._id) === qId ? { ...item, isAvailableForNewTests: nextVal } : item))
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to update availability', 'error');
    }
  };

  // Delete Question (Admin only)
  const handleDeleteQuestion = async (q: AdminQuestion) => {
    if (!isAdmin) {
      showToast('Only administrators can delete questions', 'error');
      return;
    }
    const qId = q.id || q._id!;
    const conf = window.confirm(
      'Are you sure you want to permanently delete this question from the Question Bank?'
    );
    if (!conf) return;

    try {
      await adminApi.deleteQuestion(qId);
      showToast('Question deleted', 'success');
      fetchQuestions();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete question', 'error');
    }
  };

  // Open Mapping Modal
  const openMappingModal = (q: AdminQuestion) => {
    setActiveQuestionForMapping(q);
    setMappingSeriesId(seriesList[0]?.id || seriesList[0]?._id || '');
    setMappingSubjectId(q.subjectId || subjects[0]?.id || subjects[0]?._id || '');
    setMappingChapterId(q.chapterId || '');
    setIsMappingModalOpen(true);
  };

  const handleSaveMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuestionForMapping || !mappingSeriesId || !mappingSubjectId) {
      showToast('Series and Subject are required for mapping', 'error');
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
      showToast('Question mapped to Test Series hierarchy successfully!', 'success');
      setIsMappingModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to map question', 'error');
    } finally {
      setIsSavingMapping(false);
    }
  };

  // Bulk Import Workflow
  const handleParseImport = () => {
    setImportErrors([]);
    setImportPreviewCount(0);
    if (!importJsonText.trim()) {
      setImportErrors(['Import text is empty. Paste a JSON array or CSV questions.']);
      return;
    }

    try {
      let parsed: any[];
      if (importJsonText.trim().startsWith('[') || importJsonText.trim().startsWith('{')) {
        const obj = JSON.parse(importJsonText);
        parsed = Array.isArray(obj) ? obj : [obj];
      } else {
        // Simple CSV parser for questions: "Question", "Option 1", "Option 2", "Option 3", "Option 4", "Correct (1-4)", "Subject", "Difficulty"
        const lines = importJsonText.split('\n').filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          throw new Error('CSV must contain a header row and at least one question row.');
        }
        const dataLines = lines.slice(1);
        parsed = dataLines.map((line, idx) => {
          const parts = line.split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
          if (parts.length < 6) {
            throw new Error(`Row ${idx + 2} has insufficient columns (expected at least 6).`);
          }
          const [content, opt1, opt2, opt3, opt4, correctIndexStr, subject, diff] = parts;
          const correctIdx = parseInt(correctIndexStr, 10);
          return {
            content,
            subject: subject || 'General Studies',
            difficulty: (diff && ['easy', 'medium', 'hard'].includes(diff.toLowerCase()) ? diff.toLowerCase() : 'medium'),
            type: 'single_choice',
            status: 'published',
            options: [
              { content: opt1, isCorrect: correctIdx === 1 },
              { content: opt2, isCorrect: correctIdx === 2 },
              { content: opt3, isCorrect: correctIdx === 3 },
              { content: opt4, isCorrect: correctIdx === 4 },
            ],
          };
        });
      }

      // Validate rows
      const errors: string[] = [];
      parsed.forEach((q, idx) => {
        if (!q.content || typeof q.content !== 'string') {
          errors.push(`Row ${idx + 1}: Missing question content.`);
        }
        if (q.type !== 'numerical') {
          if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
            errors.push(`Row ${idx + 1}: Requires at least 2 options.`);
          } else {
            const corrects = q.options.filter((o: any) => o.isCorrect).length;
            if (corrects === 0) {
              errors.push(`Row ${idx + 1}: Must have at least one correct option.`);
            }
          }
        }
      });

      if (errors.length > 0) {
        setImportErrors(errors);
      } else {
        setImportPreviewCount(parsed.length);
      }
    } catch (err: any) {
      setImportErrors([err.message || 'Failed to parse JSON/CSV format']);
    }
  };

  const handleExecuteImport = async () => {
    setIsImporting(true);
    try {
      let parsed: any[];
      if (importJsonText.trim().startsWith('[') || importJsonText.trim().startsWith('{')) {
        const obj = JSON.parse(importJsonText);
        parsed = Array.isArray(obj) ? obj : [obj];
      } else {
        const lines = importJsonText.split('\n').filter((l) => l.trim().length > 0);
        const dataLines = lines.slice(1);
        parsed = dataLines.map((line) => {
          const parts = line.split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
          const [content, opt1, opt2, opt3, opt4, correctIndexStr, subject, diff] = parts;
          const correctIdx = parseInt(correctIndexStr, 10);
          return {
            content,
            subject: subject || 'General Studies',
            difficulty: diff && ['easy', 'medium', 'hard'].includes(diff.toLowerCase()) ? diff.toLowerCase() : 'medium',
            type: 'single_choice',
            status: 'published',
            options: [
              { content: opt1, isCorrect: correctIdx === 1, position: 0 },
              { content: opt2, isCorrect: correctIdx === 2, position: 1 },
              { content: opt3, isCorrect: correctIdx === 3, position: 2 },
              { content: opt4, isCorrect: correctIdx === 4, position: 3 },
            ],
          };
        });
      }

      await adminApi.createQuestion({ questions: parsed });
      showToast(`Successfully imported ${parsed.length} questions into Question Bank!`, 'success');
      setIsImportModalOpen(false);
      setImportJsonText('');
      setImportPreviewCount(0);
      setImportErrors([]);
      fetchQuestions();
    } catch (err: any) {
      showToast(err.message || 'Failed to import questions', 'error');
    } finally {
      setIsImporting(false);
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
            Author reusable questions, configure single/multiple choice or numerical answers, and map questions to test series & chapters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setImportJsonText('');
              setImportErrors([]);
              setImportPreviewCount(0);
              setIsImportModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-semibold text-xs rounded-xl transition cursor-pointer"
          >
            <svg className="w-4 h-4 text-slate-500 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>Bulk Import (CSV/JSON)</span>
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Author Question</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 border-t border-slate-100 dark:border-zinc-800 text-xs">
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 mb-1">TYPE</label>
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
            <label className="block text-[10px] font-semibold text-slate-400 mb-1">DIFFICULTY</label>
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
            <label className="block text-[10px] font-semibold text-slate-400 mb-1">STATUS</label>
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
            <label className="block text-[10px] font-semibold text-slate-400 mb-1">SUBJECT</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => {
                setSelectedSubjectId(e.target.value);
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
            <label className="block text-[10px] font-semibold text-slate-400 mb-1">TEST AVAILABILITY</label>
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
            <p className="font-semibold text-slate-700 dark:text-zinc-300">No questions found</p>
            <p>Try adjusting your search criteria or author new questions using the button above.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-zinc-800">
            {questions.map((q, qIndex) => {
              const qId = q.id || q._id!;
              return (
                <div key={qId} className="p-4 sm:p-5 hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition space-y-3">
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
                            q.difficulty === 'easy'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                              : q.difficulty === 'medium'
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {q.difficulty}
                        </span>
                        <span className="px-2 py-0.5 rounded-md font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                          {q.type === 'single_choice'
                            ? 'Single Choice'
                            : q.type === 'multiple_choice'
                            ? 'Multiple Choice'
                            : 'Numerical'}
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
                          <span className="font-semibold text-slate-600 dark:text-zinc-300">HI:</span> {q.translations.hi}
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
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditModal(q)}
                        title="Edit question"
                        className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleAvailability(q)}
                        title={q.isAvailableForNewTests ? 'Retire question' : 'Reactivate question'}
                        className={`p-1.5 rounded-lg transition cursor-pointer ${
                          q.isAvailableForNewTests
                            ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/60'
                            : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      </button>

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(q)}
                          title="Delete permanently"
                          className="p-1.5 text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Options or Numerical answer display */}
                  {q.type === 'numerical' ? (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-800 text-xs">
                      <span className="font-semibold text-slate-600 dark:text-zinc-300">Exact Answer: </span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{q.numericalAnswer}</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {q.options?.map((opt, optIdx) => (
                        <div
                          key={opt.id || opt._id || optIdx}
                          className={`p-2.5 rounded-xl border flex items-start gap-2 ${
                            opt.isCorrect
                              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-medium'
                              : 'bg-slate-50/50 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300'
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold ${
                              opt.isCorrect
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300'
                            }`}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div>{opt.content}</div>
                            {opt.translations?.hi && (
                              <div className="text-[11px] opacity-75 italic mt-0.5">HI: {opt.translations.hi}</div>
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
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Explanation</span>
                      </div>
                      <p className="whitespace-pre-wrap">{q.explanation}</p>
                      {q.explanationTranslations?.hi && (
                        <p className="italic text-slate-500 dark:text-zinc-400">HI: {q.explanationTranslations.hi}</p>
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
              Showing {offset + 1} - {Math.min(offset + limit, totalCount)} of {totalCount} questions
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
                {editingQuestion ? 'Edit Question' : 'Author New Question'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
              {/* Question Text English & Hindi */}
              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-700 dark:text-zinc-300">
                  Question Text (English) <span className="text-rose-500">*</span>
                </label>
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
                  <label className="block font-semibold text-slate-700 dark:text-zinc-300">Question Type</label>
                  <select
                    value={formType}
                    onChange={(e: any) => setFormType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100"
                  >
                    <option value="single_choice">Single Correct MCQ</option>
                    <option value="multiple_choice">Multiple Correct MCQ</option>
                    <option value="numerical">Numerical Answer</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700 dark:text-zinc-300">Difficulty</label>
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
                  <label className="block font-semibold text-slate-700 dark:text-zinc-300">Publication Status</label>
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
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700 dark:text-zinc-300">Subject Name</label>
                  <input
                    type="text"
                    required
                    value={formSubjectName}
                    onChange={(e) => setFormSubjectName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700 dark:text-zinc-300">Topic / Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Percentage, Optics"
                    value={formTopic}
                    onChange={(e) => setFormTopic(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700 dark:text-zinc-300">Marks</label>
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
                  <label className="block font-semibold text-slate-700 dark:text-zinc-300">Negative Marks</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={formNegativeMarks}
                    onChange={(e) => setFormNegativeMarks(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* Numerical Answer vs Options */}
              {formType === 'numerical' ? (
                <div className="p-4 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 rounded-2xl space-y-2">
                  <label className="block font-semibold text-slate-800 dark:text-zinc-200">
                    Exact Numerical Answer <span className="text-rose-500">*</span>
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
                    Numerical evaluation requires exact matching. No tolerance range is allowed.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <label className="block font-semibold text-slate-800 dark:text-zinc-200">
                      Options & Correct Answer(s) <span className="text-rose-500">*</span>
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
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                            : 'bg-slate-50 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-700'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleSetCorrect(idx)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 cursor-pointer transition ${
                            opt.isCorrect
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-600 text-slate-500 hover:border-emerald-500'
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
                            onChange={(e) => handleOptionChange(idx, e.target.value)}
                            className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-zinc-100"
                          />
                          <input
                            type="text"
                            placeholder="हिंदी अनुवाद (वैकल्पिक)"
                            value={opt.contentHi || ''}
                            onChange={(e) => handleOptionHiChange(idx, e.target.value)}
                            className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-zinc-100"
                          />
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                            <input
                              type={formType === 'single_choice' ? 'radio' : 'checkbox'}
                              name="correctOptionRadio"
                              checked={opt.isCorrect}
                              onChange={() => handleSetCorrect(idx)}
                            />
                            <span className={opt.isCorrect ? 'font-bold text-emerald-600 dark:text-emerald-400' : ''}>
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
                  <label htmlFor="isAvailableCb" className="font-semibold text-slate-700 dark:text-zinc-300">
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
                  {isSaving ? 'Saving...' : editingQuestion ? 'Update Question' : 'Save to Question Bank'}
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
              Mapping associates this reusable question with a specific Test Series, Subject, and Chapter without duplicating the underlying Question record.
            </p>

            <form onSubmit={handleSaveMapping} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-zinc-300">Target Test Series</label>
                <select
                  required
                  value={mappingSeriesId}
                  onChange={(e) => setMappingSeriesId(e.target.value)}
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
                <label className="block font-semibold text-slate-700 dark:text-zinc-300">Assigned Subject</label>
                <select
                  required
                  value={mappingSubjectId}
                  onChange={(e) => setMappingSubjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100"
                >
                  {subjects.map((sub) => (
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
                  {isSavingMapping ? 'Mapping...' : 'Confirm Mapping'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* BULK IMPORT MODAL */}
      {/* ===================================================================== */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl p-5 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                Bulk Question Import (CSV / JSON)
              </h3>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 dark:text-zinc-400 space-y-1">
              <p>Paste JSON array or CSV text with questions. Format for CSV:</p>
              <code className="block p-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-[11px] font-mono text-slate-800 dark:text-zinc-200">
                Question,Option 1,Option 2,Option 3,Option 4,Correct (1-4),Subject,Difficulty
              </code>
            </div>

            <textarea
              rows={8}
              placeholder="Paste JSON array or CSV questions..."
              value={importJsonText}
              onChange={(e) => {
                setImportJsonText(e.target.value);
                setImportPreviewCount(0);
                setImportErrors([]);
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl font-mono text-xs text-slate-900 dark:text-zinc-100"
            />

            {importErrors.length > 0 && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 space-y-1 max-h-32 overflow-y-auto">
                <span className="font-bold">Validation Errors Detected:</span>
                <ul className="list-disc pl-4 space-y-0.5">
                  {importErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {importPreviewCount > 0 && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
                ✓ Validated {importPreviewCount} questions ready to insert.
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl text-slate-700 dark:text-zinc-300 font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleParseImport}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold text-xs cursor-pointer"
              >
                Validate & Preview
              </button>
              <button
                type="button"
                disabled={importPreviewCount === 0 || isImporting}
                onClick={handleExecuteImport}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs shadow-xs disabled:opacity-40 cursor-pointer"
              >
                {isImporting ? 'Importing...' : `Import ${importPreviewCount > 0 ? importPreviewCount : ''} Questions`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
