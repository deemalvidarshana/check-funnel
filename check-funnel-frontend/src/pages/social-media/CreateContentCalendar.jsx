import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bot,
  CalendarDays,
  Check,
  ChevronDown,
  Clock,
  Cloud,
  Lightbulb,
  Loader2,
  Maximize2,
  Minimize2,
  Send,
  ShoppingBag,
  Sparkles,
  Table2,
  Target,
  User,
  WandSparkles,
  X,
} from 'lucide-react';
import { getClients } from '../../services/clientService';
import api from '../../services/api';
import { generateCalendarAI, generateReelScriptAI } from '../../api/ai';
import { saveCalendar, getCalendars, deleteCalendar, deletePost, updatePost, getCalendarSettings, saveCalendarSettings } from '../../api/calendar';
import CalendarTable from './components/CalendarTable';
import HistoryFilters from './components/HistoryFilters';
import DeleteConfirmationModal from '../../components/common/DeleteConfirmationModal';

/* ──────────── SVG Icons for Social Platforms ──────────── */
const FacebookIcon = ({ active }) => (
  <svg viewBox="0 0 24 24" className={`w-5 h-5 transition-colors ${active ? 'fill-[#003870]' : 'fill-slate-400'}`}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramIcon = ({ active }) => (
  <svg viewBox="0 0 24 24" className={`w-5 h-5 transition-colors ${active ? 'fill-[#003870]' : 'fill-slate-400'}`}>
    <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.88 0 1.441 1.441 0 012.88 0z"/>
  </svg>
);

const TikTokIcon = ({ active }) => (
  <svg viewBox="0 0 24 24" className={`w-5 h-5 transition-colors ${active ? 'fill-[#003870]' : 'fill-slate-400'}`}>
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
);

const PLATFORM_OPTIONS = [
  { id: 'facebook', label: 'Facebook', Icon: FacebookIcon },
  { id: 'instagram', label: 'Instagram', Icon: InstagramIcon },
  { id: 'tiktok', label: 'TikTok', Icon: TikTokIcon }
];

const CONTENT_FRAMEWORK_OPTIONS = [
  {
    id: 'aida',
    name: 'AIDA',
    label: 'AIDA (Attention, Interest, Desire, Action)',
    goal: 'Move cold audiences from attention to purchase intent.',
    flow: 'Attention -> Interest -> Desire -> Action',
    prompt: 'Best for product reveals, offers, launches, and hero posts. Open with a sharp attention trigger, build interest with proof/details, create desire with a clear benefit, and close with one purchase or enquiry action.'
  },
  {
    id: 'pas',
    name: 'PAS',
    label: 'PAS (Problem, Agitate, Solution)',
    goal: 'Connect emotionally and solve a customer pain point.',
    flow: 'Problem -> Agitate -> Solution',
    prompt: 'Best for pain-aware audiences. Name the real frustration, make the consequence feel familiar without overdrama, then position the brand, product, service, or tip as the practical fix.'
  },
  {
    id: 'star',
    name: 'STAR',
    label: 'STAR (Situation, Task, Action, Result)',
    goal: 'Tell a transformation, customer, or brand story.',
    flow: 'Situation -> Task -> Action -> Result',
    prompt: 'Best for case studies, founder/process stories, customer wins, and proof posts. Set the context, define the challenge, show the action taken, and close with a believable result or learning.'
  },
  {
    id: 'hook-teach-reward',
    name: 'Hook, Teach, Reward',
    label: 'Hook, Teach, Reward',
    goal: 'Educate, inspire, and encourage saves or follows.',
    flow: 'Hook -> Teach -> Reward',
    prompt: 'Best for educational reels, carousels, tips, and authority content. Start with a practical hook, teach one useful idea clearly, then reward the audience with a save-worthy takeaway, bonus, or follow CTA.'
  },
  {
    id: 'myth-truth-how',
    name: 'Myth, Truth, How',
    label: 'Myth, Truth, How',
    goal: 'Break misconceptions and educate the audience.',
    flow: 'Myth -> Truth -> How',
    prompt: 'Best for objection handling and thought leadership. State a common misconception, replace it with the truth, then show how the audience can apply it or how the brand proves it.'
  },
  {
    id: 'before-after-bridge',
    name: 'Before, After, Bridge',
    label: 'Before, After, Bridge',
    goal: 'Create visual transformation or upgrade content.',
    flow: 'Before -> After -> Bridge',
    prompt: 'Best for transformations, makeovers, upgrades, and before/after comparisons. Show the starting state, reveal the improved state, then explain the bridge: product, method, tip, or service.'
  },
  {
    id: 'challenge-lesson-invite',
    name: 'Challenge, Lesson, Invite',
    label: 'Challenge, Lesson, Invite',
    goal: 'Build engagement, community, and user participation.',
    flow: 'Challenge -> Lesson -> Invite',
    prompt: 'Best for engagement, UGC, comments, and community prompts. Present a simple challenge, share the lesson or example, then invite the audience to try, tag, comment, or participate.'
  }
];

const formatDateInput = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateInput = (dateStr) => new Date(`${dateStr}T00:00:00`);

const addDaysToDate = (dateStr, days) => {
  if (!dateStr) return '';
  const date = parseDateInput(dateStr);
  date.setDate(date.getDate() + Number(days || 0));
  return formatDateInput(date);
};

const getDateSpanDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 1;
  const start = parseDateInput(startDate);
  const end = parseDateInput(endDate);
  const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
};

const getPlatformContentCount = (formData, platformId) => Number(formData.platformContentCounts?.[platformId] || 0);

const getTotalPlatformContentCount = (formData) => formData.platforms.reduce((sum, platformId) => {
  const count = getPlatformContentCount(formData, platformId);
  return sum + (Number.isFinite(count) ? count : 0);
}, 0);

const getMissingPlatformCountLabels = (formData) => formData.platforms
  .filter(platformId => getPlatformContentCount(formData, platformId) <= 0)
  .map(platformId => PLATFORM_OPTIONS.find(platform => platform.id === platformId)?.label || platformId);

const getSelectedFrameworkIds = (formData) => {
  if (Array.isArray(formData.contentFrameworks) && formData.contentFrameworks.length > 0) return formData.contentFrameworks;
  return formData.contentFramework ? [formData.contentFramework] : [];
};

const getDefaultCalendarFormData = () => ({
  clientId: '',
  businessName: '',
  businessWebsite: '',
  businessLocation: '',
  niche: '',
  platforms: [],
  targetAudience: '',
  contentGoal: [],
  contentFramework: '',
  contentFrameworks: [],
  contentPillars: '',
  brandVoice: '',
  postsPerWeek: 7,
  durationDays: 30,
  startDate: formatDateInput(new Date()),
  endDate: addDaysToDate(formatDateInput(new Date()), 30),
  language: 'English',
  preferredFormats: [],
  productsOrServices: '',
  mainOffer: '',
  competitorCsvUploaded: false,
  includeCaptions: true,
  includeHashtags: true,
  includeVideoIdeas: true,
  includeTrackingTemplate: true,
  dataSource: 'apify',
  analysisStartDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
  analysisEndDate: new Date().toISOString().split('T')[0],
  platformContentCounts: {},
  platformPostCounts: {},
  competitors: [],
  prompt: ''
});

const CreateContentCalendar = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isGenerated, setIsGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSettingsSaving, setIsSettingsSaving] = useState(false);
  const [settingsSaveStatus, setSettingsSaveStatus] = useState('idle');
  const [currentStep, setCurrentStep] = useState(1);
  const [isFrameworkPickerOpen, setIsFrameworkPickerOpen] = useState(false);
  const [isTimeRangeDropdownOpen, setIsTimeRangeDropdownOpen] = useState(false);
  const [activeCompetitorDropdown, setActiveCompetitorDropdown] = useState(null);
  const [clientPerformanceData, setClientPerformanceData] = useState({ own: {}, competitors: {} });
  const [isPerformanceLoading, setIsPerformanceLoading] = useState(false);
  const [isPromptMaximized, setIsPromptMaximized] = useState(false);
  const [generatedData, setGeneratedData] = useState([]);
  const [toast, setToast] = useState(null);
  const [aiEditModal, setAiEditModal] = useState({ isOpen: false, rowIndex: null, instruction: '', isProcessing: false });
  const [isSaving, setIsSaving] = useState(false);
  const [savedCalendars, setSavedCalendars] = useState([]);
  const [selectedHistoryFilter, setSelectedHistoryFilter] = useState({ client: '', date: '' });
  const [refinementOffset, setRefinementOffset] = useState(0);
  const [selectedRowCenter, setSelectedRowCenter] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [calendarToDelete, setCalendarToDelete] = useState(null);
  const [isDeleteRowModalOpen, setIsDeleteRowModalOpen] = useState(false);
  const [rowToDeleteIndex, setRowToDeleteIndex] = useState(null);
  const [referenceModal, setReferenceModal] = useState({
    isOpen: false,
    row: null,
    rowIndex: null,
    userPrompt: '',
    refineInstruction: '',
    showRefinePanel: false,
  });
  const [generatingScriptIndex, setGeneratingScriptIndex] = useState(null);
  const [reelScriptSaveStatus, setReelScriptSaveStatus] = useState('idle');
  const resultsSectionRef = useRef(null);
  const aiPanelRef = useRef(null);
  const reelScriptSaveTimerRef = useRef(null);

  const fetchSavedCalendars = async (clientId) => {
    try {
      const data = await getCalendars(clientId);
      setSavedCalendars(data);
    } catch (err) {
      console.error("Failed to fetch saved calendars", err);
    }
  };

  const fetchAllCalendars = async () => {
    try {
      const data = await getCalendars();
      setSavedCalendars(data);
    } catch (err) {
      console.error("Failed to fetch all calendars", err);
    }
  };

  useEffect(() => {
    return () => {
      if (reelScriptSaveTimerRef.current) {
        clearTimeout(reelScriptSaveTimerRef.current);
      }
    };
  }, []);

  const [formData, setFormData] = useState(() => getDefaultCalendarFormData());

  const saveClientCalendarSettings = async (dataToSave = formData, options = {}) => {
    if (!dataToSave?.clientId) return null;

    setIsSettingsSaving(true);
    setSettingsSaveStatus('saving');

    try {
      const savedSettings = await saveCalendarSettings(dataToSave.clientId, {
        configData: dataToSave,
        prompt: dataToSave.prompt || '',
      });

      setSettingsSaveStatus('saved');

      if (!options.silent) {
        setToast({ message: "Client calendar setup saved.", type: "success" });
      }

      return savedSettings;
    } catch (err) {
      console.error("Failed to save client calendar setup", err);
      setSettingsSaveStatus('error');
      if (!options.silent) {
        setToast({ message: "Failed to save client calendar setup.", type: "error" });
      }
      return null;
    } finally {
      setIsSettingsSaving(false);
    }
  };

  useEffect(() => {
    if (currentStep !== 4 || !formData.clientId || !formData.prompt.trim()) return;

    const saveTimer = setTimeout(() => {
      saveClientCalendarSettings(formData, { silent: true });
    }, 700);

    return () => clearTimeout(saveTimer);
  }, [currentStep, formData.clientId, formData.prompt]);

  const hardcodedData = [
    { date: '12-Mar', type: 'Static', pillar: 'Motor Insurance', visual: 'Smart drivers plan ahead', caption: 'Secure your journey with Comprehensive Motor Insurance.', status: 'Draft' },
    { date: '14-Mar', type: 'Carousel', pillar: 'Life Insurance', visual: 'Protect your family\'s future', caption: '5 reasons why life insurance is your best investment.', status: 'Approved' },
    { date: '16-Mar', type: 'Video', pillar: 'Health Insurance', visual: 'Health is Wealth', caption: 'Stay covered for any medical emergencies. Learn more.', status: 'Review' },
    { date: '19-Mar', type: 'Static', pillar: 'Travel Insurance', visual: 'Travel with peace of mind', caption: 'Lost luggage? Cancelled flight? We got you.', status: 'Draft' },
    { date: '22-Mar', type: 'Reel', pillar: 'Motor Insurance', visual: 'Quick claims process', caption: 'See how fast you can claim with our app.', status: 'Approved' },
    { date: '25-Mar', type: 'Static', pillar: 'Home Insurance', visual: 'Your home, fully protected', caption: 'Comprehensive cover for fire, theft, and natural disasters.', status: 'Review' },
  ];

  useEffect(() => {
    fetchAllCalendars();
  }, []);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const data = await getClients();
        setClients(data);
      } catch (error) {
        console.error('Error fetching clients:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchClients();
  }, []);

  const filteredCompetitorData = React.useMemo(() => {
    const filterByDate = (post) => {
      if (!formData.analysisStartDate && !formData.analysisEndDate) return true;
      const postDate = new Date(post.createdAt);
      if (formData.analysisStartDate && postDate < new Date(formData.analysisStartDate)) return false;
      if (formData.analysisEndDate) {
        const endDate = new Date(formData.analysisEndDate);
        endDate.setHours(23, 59, 59, 999);
        if (postDate > endDate) return false;
      }
      return true;
    };

    const data = {};
    if (clientPerformanceData?.competitors) {
      Object.keys(clientPerformanceData.competitors).forEach(p => {
        let filtered = clientPerformanceData.competitors[p].filter(filterByDate);
        filtered.sort((a, b) => (b.likes + b.commentsCount) - (a.likes + a.commentsCount));
        data[p] = filtered;
      });
    }
    return data;
  }, [clientPerformanceData, formData.analysisStartDate, formData.analysisEndDate]);

  const historyDates = React.useMemo(() => {
    const dates = new Set();
    savedCalendars.forEach(c => {
      if (c.month && c.year) dates.add(`${c.month} ${c.year}`);
    });
    return Array.from(dates);
  }, [savedCalendars]);

  const historyClients = React.useMemo(() => {
    const clientNames = new Set();
    savedCalendars.forEach(c => {
      if (c.name) {
        // Extract client name from calendar name (format: "ClientName - Month Year")
        const clientName = c.name.split(' - ')[0];
        if (clientName) clientNames.add(clientName);
      }
    });
    return Array.from(clientNames);
  }, [savedCalendars]);

  const findSelectedHistoryCalendar = () => {
    if (!selectedHistoryFilter.date) return null;

    const [month, year] = selectedHistoryFilter.date.split(' ');
    return savedCalendars.find(c => {
      const isMonthYearMatch = c.month === month && c.year.toString() === year;
      if (!isMonthYearMatch) return false;
      if (!selectedHistoryFilter.client) return true;
      const calendarClientName = c.name ? c.name.split(' - ')[0] : '';
      return calendarClientName === selectedHistoryFilter.client;
    }) || null;
  };

  useEffect(() => {
    if (selectedHistoryFilter.date) {
      const [month, year] = selectedHistoryFilter.date.split(' ');
      const calendar = savedCalendars.find(c => {
        const isMonthYearMatch = c.month === month && c.year.toString() === year;
        if (!isMonthYearMatch) return false;

        if (!selectedHistoryFilter.client) return true;

        // Match by client name extracted from calendar name
        const calendarClientName = c.name ? c.name.split(' - ')[0] : '';
        return calendarClientName === selectedHistoryFilter.client;
      });
      
      if (calendar && calendar.posts) {
        setGeneratedData(calendar.posts);
        setIsGenerated(true);
      }
    }
  }, [selectedHistoryFilter, savedCalendars]);

  const togglePlatform = (platform) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform],
      platformContentCounts: prev.platforms.includes(platform)
        ? Object.fromEntries(Object.entries(prev.platformContentCounts || {}).filter(([key]) => key !== platform))
        : {
            ...(prev.platformContentCounts || {}),
            [platform]: prev.platformContentCounts?.[platform] || '',
          }
    }));
  };

  const toggleArrayItem = (field, item) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item]
    }));
  };

  const toggleBoolean = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const setContentFrameworks = (frameworkIds) => {
    setFormData(prev => ({
      ...prev,
      contentFrameworks: frameworkIds,
      contentFramework: frameworkIds[0] || '',
    }));
  };

  const toggleContentFramework = (frameworkId) => {
    setFormData(prev => {
      const currentFrameworks = getSelectedFrameworkIds(prev);
      const nextFrameworks = currentFrameworks.includes(frameworkId)
        ? currentFrameworks.filter(id => id !== frameworkId)
        : [...currentFrameworks, frameworkId];

      return {
        ...prev,
        contentFrameworks: nextFrameworks,
        contentFramework: nextFrameworks[0] || '',
      };
    });
  };

  const handleScheduleDateChange = (field, value) => {
    setFormData(prev => {
      if (field === 'startDate') {
        const currentEndDate = prev.endDate && parseDateInput(prev.endDate) >= parseDateInput(value)
          ? prev.endDate
          : addDaysToDate(value, prev.durationDays || 30);

        return {
          ...prev,
          startDate: value,
          endDate: currentEndDate,
          durationDays: getDateSpanDays(value, currentEndDate),
        };
      }

      return {
        ...prev,
        endDate: value,
        durationDays: getDateSpanDays(prev.startDate, value),
      };
    });
  };

  const handlePlatformContentCountChange = (platform, value) => {
    const normalizedValue = value === '' ? '' : Math.max(0, Number(value));

    setFormData(prev => ({
      ...prev,
      platformContentCounts: {
        ...(prev.platformContentCounts || {}),
        [platform]: normalizedValue,
      }
    }));
  };

  const nextStep = async () => {
    if (currentStep === 2) {
      const missingPlatformCounts = getMissingPlatformCountLabels(formData);

      if (missingPlatformCounts.length > 0) {
        setToast({
          message: `Add post counts for ${missingPlatformCounts.join(', ')}.`,
          type: "error",
        });
        return;
      }
    }

    if (currentStep === 3) {
      // ── Build Performance Strategy Summary ──
      const performanceStrategy = formData.platforms.map(p => {
        const count = formData.platformPostCounts?.[p] !== undefined ? formData.platformPostCounts[p] : Math.min(5, filteredCompetitorData[p]?.length || 0);
        return `${p.charAt(0).toUpperCase() + p.slice(1)} Top Engagement (${count} Posts)`;
      }).join(', ');
      
      // ── Build Historical Insights from Competitor Data ──
      let historicalInsights = "";
      const hasCompetitorData = formData.platforms.some(p => filteredCompetitorData[p]?.length > 0);
      if (hasCompetitorData) {
        historicalInsights += "\n--- COMPETITOR TOP ENGAGEMENT ---\n";
        formData.platforms.forEach(p => {
          const selectedCount = formData.platformPostCounts?.[p] !== undefined ? formData.platformPostCounts[p] : 5;
          const topComp = (filteredCompetitorData[p] || []).slice(0, selectedCount);
          if (topComp.length > 0) {
            historicalInsights += `\n[${p.toUpperCase()}]:\n`;
            topComp.forEach((post, i) => {
              const brandName = post.trackedAccount?.displayName || post.trackedAccount?.username || 'Competitor';
              const caption = post.caption || post.rawData?.caption || post.rawData?.Description || post.rawData?.text || post.rawExtensionData?.caption || post.rawExtensionData?.text || "No caption";
              const safeCaption = caption.replace(/\n/g, ' ');
              historicalInsights += `${i+1}. Brand: ${brandName} | Caption: "${safeCaption}" | Engagement: ${post.likes} Likes, ${post.commentsCount} Comments\n`;
            });
          }
        });
      }

      // ── Build Date Range and Planned Platform Counts ──
      const calendarStartDate = formData.startDate || new Date().toISOString().split('T')[0];
      const calendarEndDate = formData.endDate || addDaysToDate(calendarStartDate, formData.durationDays || 30);
      const platformContentTargets = formData.platforms
        .map(p => {
          const option = PLATFORM_OPTIONS.find(platform => platform.id === p);
          const count = Number(formData.platformContentCounts?.[p] || 0);
          return count > 0 ? `${option?.label || p}: ${count} posts` : null;
        })
        .filter(Boolean);
      const totalPostsToGenerate = getTotalPlatformContentCount(formData);

      // ── Build Platform Links Instruction ──
      const targetPlatformLabels = formData.platforms
        .map(p => PLATFORM_OPTIONS.find(platform => platform.id === p)?.label || p)
        .join(', ');
      const plannedPlatformCountText = platformContentTargets.length > 0
        ? platformContentTargets.join(', ')
        : 'No per-platform counts provided; distribute evenly across selected platforms.';

      // ── Build Inclusions Instruction ──
      const selectedFrameworks = CONTENT_FRAMEWORK_OPTIONS.filter(option => getSelectedFrameworkIds(formData).includes(option.id));
      const frameworkInstruction = selectedFrameworks.length > 0
        ? `Use these selected frameworks as creative structures. Rotate them naturally by post goal, platform, and format. Do not repeat framework names in the final output unless it reads naturally:
${selectedFrameworks.map(framework => `- ${framework.label}
  Goal: ${framework.goal}
  Flow: ${framework.flow}
  Use: ${framework.prompt}`).join('\n')}`
        : `No fixed framework was selected. Choose the best-fit framework for each post based on the goal, platform, format, offer, and competitor patterns.`;
      const contentPillarsInstruction = formData.contentPillars?.trim()
        ? `Use these client-provided content pillars as the primary pillar set. Keep the pillar names recognizable in the "pillar" field. Balance the calendar across them and only add a missing pillar if the strategy clearly needs it:
${formData.contentPillars.trim()}`
        : `Use this balanced pillar system:
- Educational/How-To (30%): Establish authority, provide value, solve problems
- Behind-the-Scenes/Personal (20%): Build connection and trust, humanize the brand
- Entertainment/Trending (20%): Reach new audiences, increase shares, ride trends
- Social Proof/Results (15%): Build credibility with testimonials, case studies, wins
- Promotional/CTA (15%): Drive conversions with offers, launches, lead magnets`;
      const captionInstruction = formData.includeCaptions
        ? 'Write a complete ready-to-post caption: first line hook, useful body, one clear CTA, and hashtags only when enabled.'
        : 'The caption field is still required by the app. Write a concise caption direction with a hook and CTA, not a long caption.';
      const hashtagInstruction = formData.includeHashtags
        ? 'Include 5-10 relevant hashtags at the end of the caption. Mix niche and discovery tags.'
        : 'Do not include hashtags.';
      const videoInstruction = formData.includeVideoIdeas
        ? 'For Reel/Video posts, include a short scene or shot plan in visualCopy along with on-screen text.'
        : 'Keep visualCopy concise; do not add long video scripts.';
      const trackingInstruction = formData.includeTrackingTemplate
        ? 'Keep every row easy to track using only the fixed fields: date, platforms, contentType, pillar, visualCopy, caption, status. Do not add tracking columns.'
        : 'Do not add tracking fields.';

      const generatedPrompt = `You are an expert Social Media Content Strategist and content calendar planner. Build a practical, platform-native calendar for "${formData.businessName}".

CRITICAL OUTPUT CONTRACT
Return ONLY one valid JSON object in this exact shape:
{
  "posts": [
    {
      "date": "YYYY-MM-DD",
      "contentType": "Static|Reel|Carousel|Story|Video",
      "pillar": "Short pillar name",
      "visualCopy": "Creative/on-screen text plus asset direction",
      "caption": "Hook + body + one CTA, with hashtags only if enabled",
      "platforms": "Facebook|Instagram|TikTok",
      "status": "Draft"
    }
  ]
}

Schema rules:
- posts must contain exactly ${totalPostsToGenerate} objects.
- Each post object must contain exactly these 7 keys: date, contentType, pillar, visualCopy, caption, platforms, status.
- Do not add extra keys such as time, hook, cta, topic, angle, assetNotes, week, notes, or links.
- Do not return a bare array. Do not include markdown, explanations, comments, or code fences.

SETUP INPUTS FROM THE USER FLOW
[Brand]
- Business Name: ${formData.businessName} ${formData.businessWebsite ? `(${formData.businessWebsite})` : ''}
- Industry/Niche: ${formData.niche || '(Not specified; infer carefully from brand, products, and competitor data.)'}
- Location: ${formData.businessLocation || '(Not specified)'}
- Target Audience: ${formData.targetAudience || '(General audience; infer carefully from niche and competitor data.)'}
- Brand Voice: ${formData.brandVoice || 'Professional yet approachable'}
- Language: ${formData.language || 'English'}

[Campaign]
- Primary Goals: ${formData.contentGoal.join(', ') || 'Engagement and Brand Awareness'}
- Target Platforms: ${targetPlatformLabels || formData.platforms.join(', ')}
- Calendar Date Range: ${calendarStartDate} to ${calendarEndDate}
- Planned Platform Counts: ${plannedPlatformCountText}
- Preferred Formats: ${formData.preferredFormats.length > 0 ? formData.preferredFormats.join(', ') : 'Use a natural mix of Static, Reel, Carousel, Story, and Video'}

[Offer Context]
- Products/Services: ${formData.productsOrServices || '(Not specified; keep ideas aligned with the niche.)'}
- Current Offer/Promotion: ${formData.mainOffer || '(No active offer; use soft CTAs and brand-building CTAs.)'}

[Competitor Intelligence]
${historicalInsights || "(No competitor post examples available. Use strong industry best practices without inventing unverifiable claims.)"}
- Market Reference: ${performanceStrategy}
- Analysis Period: ${formData.analysisStartDate || 'N/A'} to ${formData.analysisEndDate || 'N/A'}

CONTENT STRATEGY
[Creative Frameworks]
${frameworkInstruction}

[Content Pillars]
${contentPillarsInstruction}

[Execution Guidance]
- Use the framework(s) to shape the post narrative. Do not duplicate the same hook, CTA, or angle across multiple posts.
- Every caption must begin with a strong hook. Prefer one of these hook families when relevant: problem-solution, numbered list, myth-busting, POV/relatable, transformation, hot take.
- Every caption must end with exactly one CTA matched to the pillar and goal: educational = save/share, entertainment = comment/tag, social proof = DM/link, promotional = offer/link, engagement = comment/tag.
- Map the content-calendar concepts from the planning brief into the fixed schema: topic/angle/asset notes go inside visualCopy; hook/body/CTA/hashtags go inside caption.
- ${captionInstruction}
- ${hashtagInstruction}
- ${videoInstruction}
- ${trackingInstruction}

CALENDAR PLANNING RULES
1. Deeply use the provided brand, audience, goals, platform counts, preferred formats, products/offers, content pillars, framework selection, and competitor insights.
2. Respect the planned platform counts exactly. The platforms field should identify the platform for that row.
3. Spread posts across the selected date range; avoid clustering everything on the same date.
4. Use platform-native content types and ideas. Reels/videos need motion or scene direction in visualCopy. Carousels need a slide/sequence concept in visualCopy. Static posts need a strong visual headline.
5. visualCopy must be short and creative, not a duplicate of caption.
6. caption must be ready to use, specific to the brand context, and free of placeholders like "[insert]", "[brand]", or "[link]".
7. Do not invent testimonials, results, discounts, prices, guarantees, or claims that were not provided.
8. Keep status exactly "Draft" for every post.`;

      
      const updatedFormData = { ...formData, prompt: generatedPrompt };
      setSettingsSaveStatus('dirty');
      setFormData(updatedFormData);
    }

    setCurrentStep(prev => Math.min(prev + 1, 4));
  };
  
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleCompetitorChange = (index, field, value) => {
    const updatedCompetitors = [...formData.competitors];
    updatedCompetitors[index][field] = value;
    setFormData(prev => ({ ...prev, competitors: updatedCompetitors }));
  };

  const addCompetitor = () => {
    setFormData(prev => ({
      ...prev,
      competitors: [...prev.competitors, { name: `Competitor ${prev.competitors.length + 1}`, percentage: 0 }]
    }));
  };

  const removeCompetitor = (index) => {
    setFormData(prev => ({
      ...prev,
      competitors: prev.competitors.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    // Prevent accidental submission before step 4 (Review & Generate)
    if (currentStep < 4) {
      console.log('Submission blocked: Not on final step.');
      return;
    }

    if (!formData.prompt.trim()) {
      setToast({ message: "Please ensure the prompt is generated before submitting.", type: "error" });
      return;
    }

    setIsGenerating(true);
    try {
      await saveClientCalendarSettings(formData, { silent: true });
      const data = await generateCalendarAI(formData.prompt);
      if (Array.isArray(data)) {
        setGeneratedData(data);
        setIsGenerated(true); // Switch to results view
        setToast({ message: "Content Calendar generated successfully!", type: "success" });
        // Auto-save to database
        handleSaveToDatabase(data);
      } else if (data.raw) {
        // If it's raw text (failed to parse), we might want to handle it or show an error
        setToast({ message: "AI returned raw text instead of a structured calendar. Please refine your prompt.", type: "error" });
      }
    } catch (err) {
      console.error("AI Generation failed", err);
      setToast({ message: err.response?.data?.message || "Failed to generate content calendar.", type: "error" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAiEditSubmit = async () => {
    if (!aiEditModal.instruction.trim()) return;
    
    setAiEditModal(prev => ({ ...prev, isProcessing: true }));
    try {
      const currentRow = generatedData[aiEditModal.rowIndex];
      const editPrompt = `
        ### ROLE
        You are an Expert Social Media Strategist and Copywriter specialized in high-conversion content.
        
        ### PRIORITY
        Deeply consider and prioritize the USER INSTRUCTION above all else for the content refinement process.
        
        ### USER INSTRUCTION
        "${aiEditModal.instruction}"
        
        ### TASK
        Your task is to REFINE the specific social media post below based on the USER INSTRUCTION while maintaining strategic brand alignment.
        
        ### ORIGINAL CONTENT TO REFINE
        - Date: ${currentRow.date}
        - Content Type: ${currentRow.contentType}
        - Pillar: ${currentRow.pillar}
        - Visual Copy: ${currentRow.visualCopy}
        - Caption: ${currentRow.caption}
        
        ### SYSTEM FIXED CONSTRAINTS (MANDATORY)
        1. Maintain the original "Date" exactly.
        2. Ensure the "Caption" is engaging, uses appropriate emojis, and follows the user's refinement instruction perfectly.
        3. The "Visual Copy" should be descriptive and strategically aligned with the content type.
        4. Status should remain "DRAFT" or as specified in original.
        
        ### SYSTEM FIXED OUTPUT FORMAT (MANDATORY)
        You MUST return ONLY a valid JSON object. Do not include any conversational text.
        Structure:
        {
          "contentType": "...",
          "pillar": "...",
          "visualCopy": "...",
          "caption": "...",
          "status": "..."
        }
      `;
      
      const result = await generateCalendarAI(editPrompt);
      let updatedRow = result;
      
      // If the result is an array (AI sometimes does that), take the first item
      if (Array.isArray(result)) {
        updatedRow = result[0];
      } else if (result.raw) {
        // Attempt to parse manually if needed, but generateCalendarAI already tries that
        throw new Error("Could not parse AI response as JSON");
      }
      
      const newData = [...generatedData];
      newData[aiEditModal.rowIndex] = { ...currentRow, ...updatedRow, date: currentRow.date }; // Ensure date is preserved
      setGeneratedData(newData);

      if (currentRow.id) {
        const fieldsToPersist = Object.fromEntries(
          Object.entries({
            contentType: updatedRow.contentType,
            pillar: updatedRow.pillar,
            visualCopy: updatedRow.visualCopy,
            caption: updatedRow.caption,
            status: updatedRow.status,
          }).filter(([, value]) => value !== undefined)
        );
        const savedPost = await updatePost(currentRow.id, fieldsToPersist);

        if (savedPost) {
          const savedData = [...newData];
          savedData[aiEditModal.rowIndex] = { ...newData[aiEditModal.rowIndex], ...savedPost };
          setGeneratedData(savedData);
        }
      }

      setToast({ message: "Post updated with AI successfully!", type: "success" });
      setAiEditModal(prev => ({ ...prev, instruction: '' }));
    } catch (err) {
      console.error("AI Row Edit failed", err);
      setToast({ message: "Failed to refine post with AI.", type: "error" });
    } finally {
      setAiEditModal(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const getPostUpdatePayload = (post) => Object.fromEntries(
    Object.entries({
      date: post.date,
      time: post.time,
      contentType: post.contentType || post.type,
      pillar: post.pillar,
      visualCopy: post.visualCopy || post.visual,
      caption: post.caption,
      status: post.status,
      platforms: post.platforms,
      fbLink: post.fbLink || post.facebookLink,
      igLink: post.igLink || post.instagramLink,
      ttLink: post.ttLink || post.tiktokLink,
      reelScript: post.reelScript,
    }).filter(([, value]) => value !== undefined)
  );

  const handleSaveToDatabase = async (postsToSave = null) => {
    const dataToUse = postsToSave || generatedData;
    const selectedCalendar = findSelectedHistoryCalendar();
    const activeClient = selectedClient
      || clients.find((client) => Number(client.id) === Number(selectedCalendar?.clientId))
      || clients.find((client) => client.name === selectedHistoryFilter.client)
      || (selectedCalendar
        ? { id: selectedCalendar.clientId, name: selectedCalendar.name?.split(' - ')[0] || 'Selected Client' }
        : null);

    if (!dataToUse || dataToUse.length === 0) {
      setToast({ message: "No calendar rows available to save.", type: "error" });
      return;
    }

    if (!activeClient?.id) {
      setToast({ message: "Please select a client before saving the calendar.", type: "error" });
      return;
    }

    setIsSaving(true);
    try {
      await saveClientCalendarSettings(formData, { silent: true });
      const existingPosts = dataToUse.filter((post) => post.id);
      if (existingPosts.length > 0) {
        const savedPosts = await Promise.all(
          existingPosts.map((post) => updatePost(post.id, getPostUpdatePayload(post)))
        );
        setGeneratedData(
          dataToUse.map((post) => savedPosts.find((savedPost) => savedPost?.id === post.id) || post)
        );
        if (activeClient?.id) {
          await fetchSavedCalendars(activeClient.id);
        } else {
          await fetchAllCalendars();
        }
        setToast({ message: "Content Calendar saved successfully!", type: "success" });
        return;
      }

      const startDate = formData.startDate ? new Date(formData.startDate) : new Date();
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      
      const calendarData = {
        clientId: activeClient.id,
        name: `${activeClient.name} - ${monthNames[startDate.getMonth()]} ${startDate.getFullYear()}`,
        month: monthNames[startDate.getMonth()],
        year: startDate.getFullYear(),
        competitors: formData.competitors.map(c => ({ id: c.id, name: c.name })),
        promptUsed: formData.prompt,
        posts: dataToUse
      };

      const savedCalendar = await saveCalendar(calendarData);
      if (savedCalendar?.posts?.length) {
        setGeneratedData(savedCalendar.posts);
        setIsGenerated(true);
      }
      if (activeClient?.id) {
        fetchSavedCalendars(activeClient.id);
      } else {
        fetchAllCalendars();
      }
      setToast({ message: postsToSave ? "Calendar generated and auto-saved!" : "Content Calendar saved successfully!", type: "success" });
    } catch (err) {
      console.error("Failed to save calendar", err);
      setToast({ message: "Failed to save calendar to database.", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportCalendar = () => {
    if (!generatedData.length) {
      setToast({ message: "No calendar rows available to export.", type: "error" });
      return;
    }

    const columns = [
      { label: "Date", width: 90, value: (row) => row.date },
      { label: "Content Type", width: 120, value: (row) => row.contentType || row.type },
      { label: "Pillar", width: 180, value: (row) => row.pillar },
      { label: "Visual Copy", width: 300, value: (row) => row.visualCopy || row.visual },
      { label: "Caption", width: 420, value: (row) => row.caption },
      {
        label: "Platforms",
        width: 140,
        value: (row) => Array.isArray(row.platforms) ? row.platforms.join(", ") : row.platforms,
      },
      { label: "Status", width: 100, value: (row) => row.status },
      { label: "Reel Script", width: 620, value: (row) => row.reelScript },
    ];

    const escapeHtml = (value) => String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

    const formatCell = (value) => escapeHtml(value).replace(/\r?\n/g, "<br>");

    const tableHeader = columns
      .map((column) => `<th style="width:${column.width}px">${escapeHtml(column.label)}</th>`)
      .join("");

    const tableRows = generatedData.map((row) => `
      <tr>
        ${columns.map((column) => `<td>${formatCell(column.value(row))}</td>`).join("")}
      </tr>
    `).join("");

    const workbookHtml = `<!doctype html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    table {
      border-collapse: collapse;
      font-family: Arial, sans-serif;
      font-size: 11pt;
      table-layout: fixed;
      width: 100%;
    }
    th {
      background: #003870;
      color: #ffffff;
      font-weight: 700;
      text-align: left;
      border: 1px solid #b7c4d6;
      padding: 8px;
      white-space: normal;
      mso-style-parent: style0;
    }
    td {
      border: 1px solid #d9e2ef;
      padding: 8px;
      vertical-align: top;
      white-space: normal;
      word-wrap: break-word;
      mso-data-placement: same-cell;
    }
    tr {
      height: auto;
    }
  </style>
</head>
<body>
  <table>
    <thead>
      <tr>${tableHeader}</tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>
</body>
</html>`;

    const blob = new Blob([workbookHtml], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeClientName = (selectedClient?.name || selectedHistoryFilter.client || "content-calendar")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase();
    const safeDate = (selectedHistoryFilter.date || formData.startDate || "export")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase();

    link.href = url;
    link.download = `${safeClientName || "content-calendar"}-${safeDate || "export"}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setToast({ message: "Calendar exported successfully.", type: "success" });
  };

  const handleDeleteCalendar = () => {
    if (!selectedHistoryFilter.date) return;
    
    const [month, year] = selectedHistoryFilter.date.split(' ');
    const calendar = savedCalendars.find(c => {
      const isMonthYearMatch = c.month === month && c.year.toString() === year;
      if (!isMonthYearMatch) return false;
      if (!selectedHistoryFilter.client) return true;
      const calendarClientName = c.name ? c.name.split(' - ')[0] : '';
      return calendarClientName === selectedHistoryFilter.client;
    });

    if (!calendar) return;

    setCalendarToDelete(calendar);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteCalendar = async () => {
    if (!calendarToDelete) return;

    try {
      await deleteCalendar(calendarToDelete.id);
      setToast({ message: "Calendar deleted successfully!", type: "success" });
      
      // Reset view
      setIsGenerated(false);
      setGeneratedData([]);
      setSelectedHistoryFilter({ client: '', date: '' });
      
      // Refresh calendar list
      if (selectedClient) {
        fetchSavedCalendars(selectedClient.id);
      } else {
        fetchAllCalendars();
      }
    } catch (err) {
      console.error("Failed to delete calendar", err);
      setToast({ message: "Failed to delete calendar.", type: "error" });
    } finally {
      setIsDeleteModalOpen(false);
      setCalendarToDelete(null);
    }
  };

  const handleDeleteRow = (index) => {
    setRowToDeleteIndex(index);
    setIsDeleteRowModalOpen(true);
  };

  const confirmDeleteRow = async () => {
    if (rowToDeleteIndex === null) return;

    const row = generatedData[rowToDeleteIndex];
    
    try {
      if (row.id) {
        await deletePost(row.id);
      }
      
      const newData = [...generatedData];
      newData.splice(rowToDeleteIndex, 1);
      setGeneratedData(newData);
    } finally {
      setIsDeleteRowModalOpen(false);
      setRowToDeleteIndex(null);
    }
  };

  const handleUpdateRow = async (index, updatedFields) => {
    const row = generatedData[index];
    
    // Optimistic Update
    const newData = [...generatedData];
    newData[index] = { ...row, ...updatedFields };
    setGeneratedData(newData);

    try {
      if (row.id) {
        // Filter only valid database columns to avoid TypeORM errors
        const validFields = {};
        const dbColumns = ['pillar', 'visualCopy', 'caption', 'status', 'date', 'time', 'contentType', 'reelScript'];
        
        Object.keys(updatedFields).forEach(key => {
          if (dbColumns.includes(key)) {
            validFields[key] = updatedFields[key];
          }
        });

        if (Object.keys(validFields).length > 0) {
          await updatePost(row.id, validFields);
        }
      }
    } catch (err) {
      console.error("Failed to update post", err);
      setToast({ message: "Failed to auto-update post. Please check your connection.", type: "error" });
    }
  };

  const buildReelScriptPrompt = (row, userPrompt = '') => {
    const selectedFrameworks = CONTENT_FRAMEWORK_OPTIONS.filter(option => getSelectedFrameworkIds(formData).includes(option.id));
    const frameworkContext = selectedFrameworks.length > 0
      ? selectedFrameworks.map(framework => `- ${framework.label}
  Goal: ${framework.goal}
  Flow: ${framework.flow}
  Usage guidance: ${framework.prompt}`).join('\n')
      : `No fixed framework was selected. Choose the best-fit structure for this reel from the row objective, pillar, caption, and brand context.`;

    const pillarContext = formData.contentPillars?.trim()
      ? formData.contentPillars.trim()
      : `Use a balanced mix of Educational/How-To, Behind-the-Scenes, Entertainment/Trending, Social Proof/Results, and Promotional/CTA pillars.`;

    return `You are a senior short-form video strategist, reel scriptwriter, and social media creative director.

Create ONE production-ready reel script for the calendar row below.

CRITICAL OUTPUT CONTRACT
Return ONLY one valid JSON object in this exact shape:
{
  "script": "..."
}
Do not include markdown fences, explanations, comments, or extra JSON keys.

BRAND AND CAMPAIGN CONTEXT
- Business Name: ${formData.businessName || selectedClient?.name || 'Client'}
- Website: ${formData.businessWebsite || '(Not provided)'}
- Industry/Niche: ${formData.niche || '(Infer carefully from row and brand context)'}
- Location: ${formData.businessLocation || '(Not provided)'}
- Target Audience: ${formData.targetAudience || '(General audience; infer carefully)'}
- Brand Voice: ${formData.brandVoice || 'Professional yet approachable'}
- Language: ${formData.language || 'English'}
- Campaign Goals: ${formData.contentGoal.join(', ') || 'Engagement and Brand Awareness'}
- Products/Services: ${formData.productsOrServices || '(Not specified; keep aligned with the niche)'}
- Current Offer/Promotion: ${formData.mainOffer || '(No active offer; use a soft CTA)'}
- Target Platform(s): ${row.platforms || formData.platforms.join(', ') || 'Instagram/Facebook/TikTok'}

CREATIVE FRAMEWORKS TO CONSIDER
${frameworkContext}

CONTENT PILLARS TO CONSIDER
${pillarContext}

USER DIRECTION FOR THIS REEL SCRIPT
${userPrompt?.trim()
  ? userPrompt.trim()
  : 'No extra user direction was provided. Use the structured brand, framework, pillar, row visual copy, and caption context below.'}

PRIORITY ORDER
1. Follow the USER DIRECTION first and strongly. If the user asks for a tone, angle, hook style, length, audience, or emphasis, obey that request.
2. Still use the brand, framework, content pillar, row visual copy, row caption, platform, and campaign context below.
3. Do not satisfy the user direction by returning only a title, short summary, or caption. The output must always be a complete reel script.

CALENDAR ROW TO EXPAND INTO A REEL SCRIPT
- Date: ${row.date || '(Not specified)'}
- Content Type: ${row.contentType || row.type || 'Reel'}
- Pillar: ${row.pillar || '(Not specified)'}
- Visual Copy / Direction: ${row.visualCopy || row.visual || '(Not specified)'}
- Caption: ${row.caption || '(Not specified)'}
- Status: ${row.status || 'Draft'}

SCRIPT QUALITY REQUIREMENTS
1. The script must deeply reflect the row pillar, visual direction, and caption. Do not drift into a generic topic.
2. Use the selected creative framework(s) as narrative architecture, but do not name the framework in the script.
3. Keep the script practical for a 30-40 second reel with clear scene-by-scene timing.
4. Include: duration, tone, hook, scene timings, visual/action directions, on-screen text and/or voiceover, transition notes where useful, and end frame/CTA.
5. Make the hook strong in the first 0-3 seconds.
6. Keep claims conservative. Do not invent prices, guarantees, awards, testimonials, or performance results.
7. Match the brand voice and target audience.
8. Write in a clean, production-ready format that a videographer, editor, or social media executive can use immediately.
9. The script must be specific to this row, not a reusable template.
10. If the row or brand lacks details, make careful assumptions without creating unverifiable claims.
11. The script string must be at least 120 words.
12. The script string must include at least 5 timed beats, including Hook and End Frame.
13. The script string must include multiple "Visual:" lines and multiple "Text on screen" or "Voiceover" lines.
14. Never return only a title, one-liner, caption, summary, or concept. Return the full production script.

FORMAT THE SCRIPT TEXT LIKE THIS:
Reel Script: "[Specific Title]"

Duration: 30-40 seconds
Tone: ...

Hook: 0-3 sec
Visual: ...
Text on screen / Voiceover:
"..."

[Scene Name]: 4-8 sec
Visual: ...
Text on screen:
...

[Continue with clear timed beats]

End Frame: 33-37 sec
Visual: ...
Text on screen:
...
CTA:
...`;
  };

  const handleGenerateReelScript = async (index, userPrompt = '') => {
    const row = generatedData[index];
    if (!row) return;

    const rowType = String(row.contentType || row.type || '').toLowerCase();
    if (rowType !== 'reel') {
      setToast({ message: "Reel scripts can only be generated for Reel rows.", type: "error" });
      return;
    }

    setGeneratingScriptIndex(index);
    try {
      const response = await generateReelScriptAI({ prompt: buildReelScriptPrompt(row, userPrompt) });
      const script = response?.script || response?.raw;

      validateReelScript(script);

      const updatedRow = { ...row, reelScript: script };
      let savedRow = updatedRow;

      if (row.id) {
        savedRow = await updatePost(row.id, { reelScript: script }) || updatedRow;
      }

      setGeneratedData((previousRows) =>
        previousRows.map((item, rowIndex) => (rowIndex === index ? { ...updatedRow, ...savedRow } : item))
      );
      setReferenceModal({ isOpen: true, row: { ...updatedRow, ...savedRow }, rowIndex: index, userPrompt: '', refineInstruction: '', showRefinePanel: false });
      setReelScriptSaveStatus('saved');
      setToast({ message: "Reel script generated successfully.", type: "success" });
    } catch (err) {
      console.error("Failed to generate reel script", err);
      setToast({ message: err.response?.data?.message || err.message || "Failed to generate reel script.", type: "error" });
    } finally {
      setGeneratingScriptIndex(null);
    }
  };

  const validateReelScript = (script) => {
    const normalizedScript = String(script || '').trim();
    const wordCount = normalizedScript ? normalizedScript.split(/\s+/).length : 0;
    const hasTimedSections = /\b\d+\s*-\s*\d+\s*sec\b/i.test(normalizedScript);
    const visualCount = (normalizedScript.match(/Visual:/gi) || []).length;
    const textCueCount = (normalizedScript.match(/Text on screen|Voiceover/gi) || []).length;

    if (!normalizedScript) {
      throw new Error("AI did not return a reel script.");
    }

    if (wordCount < 120 || !hasTimedSections || visualCount < 3 || textCueCount < 3) {
      throw new Error("AI returned an incomplete reel script. Please generate again or add a more specific instruction.");
    }
  };

  const persistReelScript = async (row, options = {}) => {
    if (reelScriptSaveTimerRef.current) {
      clearTimeout(reelScriptSaveTimerRef.current);
      reelScriptSaveTimerRef.current = null;
    }

    if (!row?.id) {
      if (!options.silent) {
        setToast({ message: "Save the calendar before saving this reel script.", type: "error" });
      }
      return null;
    }

    setReelScriptSaveStatus('saving');
    try {
      const savedRow = await updatePost(row.id, { reelScript: row.reelScript || '' });
      const nextRow = { ...row, ...(savedRow || {}) };

      setGeneratedData((previousRows) =>
        previousRows.map((item) => (item.id === row.id ? { ...item, ...nextRow } : item))
      );
      setReferenceModal((previous) => (
        previous.row?.id === row.id ? { ...previous, row: { ...previous.row, ...nextRow } } : previous
      ));
      setReelScriptSaveStatus('saved');

      if (!options.silent) {
        setToast({ message: "Reel script saved successfully.", type: "success" });
      }

      return nextRow;
    } catch (err) {
      console.error("Failed to save reel script", err);
      setReelScriptSaveStatus('error');
      if (!options.silent) {
        setToast({ message: "Failed to save reel script.", type: "error" });
      }
      return null;
    }
  };

  const scheduleReelScriptAutoSave = (row) => {
    if (reelScriptSaveTimerRef.current) {
      clearTimeout(reelScriptSaveTimerRef.current);
    }

    if (!row?.id) return;

    setReelScriptSaveStatus('dirty');
    reelScriptSaveTimerRef.current = setTimeout(() => {
      persistReelScript(row, { silent: true });
    }, 800);
  };

  const handleReelScriptChange = (value) => {
    const index = referenceModal.rowIndex;
    const currentRow = referenceModal.row;
    if (index === null || !currentRow) return;

    const updatedRow = { ...currentRow, reelScript: value };
    setReferenceModal((previous) => ({ ...previous, row: updatedRow }));
    setGeneratedData((previousRows) =>
      previousRows.map((item, rowIndex) => (rowIndex === index ? { ...item, reelScript: value } : item))
    );
    scheduleReelScriptAutoSave(updatedRow);
  };

  const handleRefineReelScript = async () => {
    const index = referenceModal.rowIndex;
    const row = referenceModal.row;
    const instruction = referenceModal.refineInstruction?.trim();

    if (index === null || !row?.reelScript || !instruction) return;

    const refinePrompt = `${buildReelScriptPrompt(row, instruction)}

REFINE MODE
You are not creating from scratch. Rewrite and improve the existing reel script below according to the USER DIRECTION.
Keep the same row strategy, content pillar, brand voice, and factual boundaries.
Preserve useful timing structure if it works, but improve hooks, clarity, pacing, scene specificity, and CTA where the instruction requires it.
Return ONLY the JSON object with the updated "script" string.

EXISTING REEL SCRIPT TO REFINE
${row.reelScript}`;

    setGeneratingScriptIndex(index);
    try {
      const response = await generateReelScriptAI({ prompt: refinePrompt });
      const script = response?.script || response?.raw;

      validateReelScript(script);

      const updatedRow = { ...row, reelScript: script };
      let savedRow = updatedRow;

      if (row.id) {
        savedRow = await updatePost(row.id, { reelScript: script }) || updatedRow;
      }

      setGeneratedData((previousRows) =>
        previousRows.map((item, rowIndex) => (rowIndex === index ? { ...updatedRow, ...savedRow } : item))
      );
      setReferenceModal((previous) => ({
        ...previous,
        row: { ...updatedRow, ...savedRow },
        refineInstruction: '',
        showRefinePanel: false,
      }));
      setReelScriptSaveStatus('saved');
      setToast({ message: "Reel script refined successfully.", type: "success" });
    } catch (err) {
      console.error("Failed to refine reel script", err);
      setToast({ message: err.response?.data?.message || err.message || "Failed to refine reel script.", type: "error" });
    } finally {
      setGeneratingScriptIndex(null);
    }
  };

  useEffect(() => {
    if (!aiEditModal.isOpen || selectedRowCenter === null) return;

    const panelHeight = aiPanelRef.current?.offsetHeight || 560;
    setRefinementOffset(Math.max(0, selectedRowCenter - panelHeight / 2));
  }, [aiEditModal.isOpen, aiEditModal.rowIndex, selectedRowCenter]);

  const handleAiEdit = (index, e) => {
    const row = e.currentTarget.closest('tr');
    const sectionRect = resultsSectionRef.current?.getBoundingClientRect();

    if (row && sectionRect) {
      const rowRect = row.getBoundingClientRect();
      const rowCenter = rowRect.top - sectionRect.top + rowRect.height / 2;
      const panelHeight = aiPanelRef.current?.offsetHeight || 560;

      setSelectedRowCenter(rowCenter);
      setRefinementOffset(Math.max(0, rowCenter - panelHeight / 2));
    }

    setAiEditModal({ ...aiEditModal, isOpen: true, rowIndex: index });
  };

  const selectClient = async (client) => {
    setSelectedClient(client);
    setIsDropdownOpen(false);
    setCurrentStep(1);
    setSettingsSaveStatus('idle');

    const defaultClientFormData = {
      ...getDefaultCalendarFormData(),
      clientId: client.id,
      businessName: client.name,
    };

    try {
      const settings = await getCalendarSettings(client.id);
      const savedConfig = settings?.configData;

      if (savedConfig) {
        setFormData({
          ...defaultClientFormData,
          ...savedConfig,
          clientId: client.id,
          businessName: savedConfig.businessName || client.name,
          prompt: settings.prompt ?? savedConfig.prompt ?? '',
        });
      } else {
        setFormData(defaultClientFormData);
      }
    } catch (err) {
      console.error("Failed to load client calendar setup", err);
      setFormData(defaultClientFormData);
      setToast({ message: "Could not load saved setup for this client.", type: "error" });
    }
    
    // Fetch saved calendars history
    fetchSavedCalendars(client.id);
    
    // Fetch performance data for the selected client
    setIsPerformanceLoading(true);
    try {
      const response = await api.get(`/apify/${client.id}/posts`);
      const posts = response.data;
      const organizedData = { own: {}, competitors: {} };
      
      posts.forEach(post => {
        const type = post.accountType === 'own' ? 'own' : 'competitors';
        const platform = (post.platform || '').toLowerCase();
        if (platform) {
          if (!organizedData[type][platform]) organizedData[type][platform] = [];
          organizedData[type][platform].push(post);
        }
      });
      
      // We no longer slice the array here. 
      // All posts are kept so the date filter can search the entire history.

      
      setClientPerformanceData(organizedData);
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setIsPerformanceLoading(false);
    }
  };

  const totalPercentage = formData.competitors.reduce((sum, c) => sum + c.percentage, 0);
  const selectedFrameworkIds = getSelectedFrameworkIds(formData);
  const selectedFrameworkNames = CONTENT_FRAMEWORK_OPTIONS
    .filter(framework => selectedFrameworkIds.includes(framework.id))
    .map(framework => framework.name);
  const frameworkSummary = selectedFrameworkNames.length === 0
    ? 'Auto select best framework'
    : selectedFrameworkNames.length <= 2
      ? selectedFrameworkNames.join(', ')
      : `${selectedFrameworkNames.slice(0, 2).join(', ')} +${selectedFrameworkNames.length - 2}`;

  const getStatusColor = (status) => {
    switch(status) {
      case 'Approved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Review': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full flex flex-col pb-24">
      {/* ──── Header ──── */}
      <div className="mb-8 shrink-0 pl-1">
        <h1 className="text-[42px] tracking-[-0.02em] leading-tight text-[#101828]">
          <span className="font-bold">AI Content</span>
          <span className="font-normal ml-2">Generator</span>
        </h1>
        <p className="text-[#475467] text-lg font-normal mt-1">Define your parameters and let AI build your strategy.</p>
      </div>

      <div className="flex flex-col gap-6 flex-1 min-h-0">
        
        {/* ═══════════ TOP SECTION: FORM (SINGLE BOX) ═══════════ */}
        <div className="w-full shrink-0">
          <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-8 relative overflow-hidden">

            
            <form onSubmit={handleSubmit} className="flex flex-col min-h-[350px]">
              
              <div className="flex-1">
                {/* ─── STEP 1: Basics & Platforms ─── */}
                {currentStep === 1 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column */}
                    <div className="space-y-5">
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2">
                        <User className="h-5 w-5 text-[#003870]" strokeWidth={2.4} />
                        Client Basics
                      </h3>
                      
                      {/* Client Dropdown */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                          className="w-full flex items-center justify-between bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl px-4 py-3 transition-all text-left group"
                        >
                          {selectedClient ? (
                            <div className="flex items-center gap-3">
                              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#003870] to-[#0066cc] flex items-center justify-center text-white text-[11px] font-bold shadow-sm shadow-[#003870]/20">
                                {selectedClient.name?.charAt(0)}
                              </div>
                              <span className="font-semibold text-slate-700 text-sm">{selectedClient.name}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-medium text-sm">Choose a client...</span>
                          )}
                          <ChevronDown className="h-4.5 w-4.5 text-slate-400 transition-colors group-hover:text-[#003870]" strokeWidth={2.4} />
                        </button>

                        {isDropdownOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                            <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-white rounded-xl border border-slate-100 shadow-xl max-h-[200px] overflow-auto">
                              {isLoading ? (
                                <div className="p-3 text-center text-slate-400 text-sm">Loading...</div>
                              ) : clients.length === 0 ? (
                                <div className="p-3 text-center text-slate-400 text-sm">No clients found</div>
                              ) : (
                                clients.map(client => (
                                  <button
                                    key={client.id}
                                    type="button"
                                    onClick={() => selectClient(client)}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors"
                                  >
                                    <span className={`font-semibold text-sm ${formData.clientId === client.id ? 'text-[#003870]' : 'text-slate-600'}`}>
                                      {client.name}
                                    </span>
                                  </button>
                                ))
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider ml-1">Business Website</label>
                        <input type="text" placeholder="e.g. www.absolutebasics.com" value={formData.businessWebsite} onChange={e => handleInputChange('businessWebsite', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#003870]/20 focus:border-[#003870] text-slate-700 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider ml-1">Business Location</label>
                        <input type="text" placeholder="e.g. Colombo, Sri Lanka" value={formData.businessLocation} onChange={e => handleInputChange('businessLocation', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#003870]/20 focus:border-[#003870] text-slate-700 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider ml-1">Niche</label>
                        <input type="text" placeholder="e.g. Women fashion store" value={formData.niche} onChange={e => handleInputChange('niche', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#003870]/20 focus:border-[#003870] text-slate-700 text-sm" />
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-5">
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2">
                        <Target className="h-5 w-5 text-[#003870]" strokeWidth={2.4} />
                        Audience & Platforms
                      </h3>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider ml-1">Target Audience</label>
                        <textarea placeholder="e.g. Women aged 18-35 in Sri Lanka who are interested in sustainable fashion..." value={formData.targetAudience} onChange={e => handleInputChange('targetAudience', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#003870]/20 focus:border-[#003870] text-slate-700 text-sm min-h-[80px] resize-none" />
                      </div>
                      
                      <div className="pt-2">
                        <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-[0.1em] mb-4">Select Platforms</p>
                        <div className="flex flex-wrap gap-5">
                          {PLATFORM_OPTIONS.map(platform => {
                            const isActive = formData.platforms.includes(platform.id);
                            return (
                              <label key={platform.id} className="flex items-center gap-2.5 cursor-pointer group">
                                <div className="relative flex items-center">
                                  <input type="checkbox" className="sr-only" checked={isActive} onChange={() => togglePlatform(platform.id)} />
                                  <div className={`h-5 w-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center ${isActive ? 'bg-[#003870] border-[#003870] shadow-sm shadow-[#003870]/20' : 'bg-white border-slate-200 group-hover:border-[#003870]/30'}`}>
                                    {isActive && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <platform.Icon active={isActive} />
                                  <span className={`text-sm font-bold transition-colors ${isActive ? 'text-[#003870]' : 'text-slate-500 group-hover:text-slate-700'}`}>{platform.label}</span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── STEP 2: Content Strategy ─── */}
                {currentStep === 2 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-5">
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2">
                        <Lightbulb className="h-5 w-5 text-[#003870]" strokeWidth={2.4} />
                        Content Strategy
                      </h3>
                      <div>
                        <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-[0.1em] mb-3">Content Goals</p>
                        <div className="flex flex-wrap gap-2">
                          {['Grow followers', 'Increase sales', 'Build brand awareness', 'Engagement'].map(goal => (
                            <button type="button" key={goal} onClick={() => toggleArrayItem('contentGoal', goal)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${formData.contentGoal.includes(goal) ? 'bg-[#003870] text-white border-[#003870]' : 'bg-white text-slate-600 border-slate-200 hover:border-[#003870]/50'}`}>
                              {goal}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider ml-1">Framework</label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setIsFrameworkPickerOpen(prev => !prev)}
                            className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-bold text-slate-700 outline-none transition-all hover:border-[#003870]/30 focus:border-[#003870] focus:ring-2 focus:ring-[#003870]/20"
                          >
                            <span className="min-w-0 truncate">{frameworkSummary}</span>
                            <span className="flex shrink-0 items-center gap-2">
                              {selectedFrameworkIds.length > 0 && (
                                <span className="rounded-full bg-[#003870]/10 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#003870]">
                                  {selectedFrameworkIds.length}
                                </span>
                              )}
                              <ChevronDown className={`h-4.5 w-4.5 text-slate-500 transition-transform ${isFrameworkPickerOpen ? 'rotate-180' : ''}`} strokeWidth={2.4} />
                            </span>
                          </button>

                          {isFrameworkPickerOpen && (
                            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/12">
                              <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2">
                                <span className="text-xs font-extrabold text-slate-600">
                                  {selectedFrameworkIds.length > 0 ? `${selectedFrameworkIds.length} selected` : 'Auto select when empty'}
                                </span>
                                <div className="flex gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setContentFrameworks(CONTENT_FRAMEWORK_OPTIONS.map(framework => framework.id))}
                                    className="rounded-lg px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#003870] transition-colors hover:bg-[#003870]/10"
                                  >
                                    All
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setContentFrameworks([])}
                                    className="rounded-lg px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 transition-colors hover:bg-slate-100"
                                  >
                                    Clear
                                  </button>
                                </div>
                              </div>
                              <div className="grid max-h-[220px] grid-cols-1 gap-2 overflow-y-auto p-3 sm:grid-cols-2">
                                {CONTENT_FRAMEWORK_OPTIONS.map(framework => {
                                  const isSelected = selectedFrameworkIds.includes(framework.id);

                                  return (
                                    <button
                                      type="button"
                                      key={framework.id}
                                      onClick={() => toggleContentFramework(framework.id)}
                                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-bold transition-all ${
                                        isSelected
                                          ? 'border-[#003870] bg-[#003870] text-white shadow-sm shadow-[#003870]/15'
                                          : 'border-slate-200 bg-white text-slate-600 hover:border-[#003870]/40 hover:bg-slate-50'
                                      }`}
                                    >
                                      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                        isSelected ? 'border-white bg-white/20' : 'border-slate-300 bg-slate-50'
                                      }`}>
                                        {isSelected && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                                      </span>
                                      <span className="truncate">{framework.name}</span>
                                    </button>
                                  );
                                })}
                              </div>
                              <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-3 py-2">
                                <button
                                  type="button"
                                  onClick={() => setIsFrameworkPickerOpen(false)}
                                  className="rounded-lg bg-[#003870] px-4 py-2 text-xs font-extrabold text-white shadow-sm shadow-[#003870]/20 transition-colors hover:bg-[#003870]/90"
                                >
                                  Done
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider ml-1">Content Pillars</label>
                        <textarea
                          placeholder="e.g. Educational tips, Product benefits, Social proof, Behind the scenes, Offers"
                          value={formData.contentPillars || ''}
                          onChange={e => handleInputChange('contentPillars', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#003870]/20 focus:border-[#003870] text-slate-700 text-sm min-h-[92px] resize-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider ml-1">Brand Voice</label>
                        <input type="text" placeholder="e.g. Casual, friendly" value={formData.brandVoice} onChange={e => handleInputChange('brandVoice', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#003870]/20 focus:border-[#003870] text-slate-700 text-sm" />
                      </div>
                    </div>
                    
                    <div className="space-y-5">
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2">
                        <CalendarDays className="h-5 w-5 text-[#003870]" strokeWidth={2.4} />
                        Schedule & Formats
                      </h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider ml-1">Start Date</label>
                            <input type="date" value={formData.startDate} onChange={e => handleScheduleDateChange('startDate', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#003870]/20 focus:border-[#003870] text-slate-700 text-sm" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider ml-1">End Date</label>
                            <input type="date" value={formData.endDate || ''} min={formData.startDate || undefined} onChange={e => handleScheduleDateChange('endDate', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#003870]/20 focus:border-[#003870] text-slate-700 text-sm" />
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-[0.1em] mb-3">Platform Post Counts</p>
                        {formData.platforms.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {formData.platforms.map(platformId => {
                              const platform = PLATFORM_OPTIONS.find(item => item.id === platformId);
                              if (!platform) return null;
                              const PlatformIcon = platform.Icon;

                              return (
                                <div key={platform.id} className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-3">
                                  <div className="mb-2 flex items-center gap-2">
                                    <PlatformIcon active={true} />
                                    <span className="text-xs font-extrabold text-slate-700">{platform.label}</span>
                                  </div>
                                  <input
                                    type="number"
                                    min="0"
                                    placeholder="Count"
                                    value={formData.platformContentCounts?.[platform.id] ?? ''}
                                    onChange={(e) => handlePlatformContentCountChange(platform.id, e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none transition-all focus:border-[#003870] focus:ring-2 focus:ring-[#003870]/20"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
                            Select platforms in the first step
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider ml-1">Language</label>
                        <input type="text" placeholder="e.g. English / Sinhala" value={formData.language} onChange={e => handleInputChange('language', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#003870]/20 focus:border-[#003870] text-slate-700 text-sm" />
                      </div>

                      <div>
                        <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-[0.1em] mb-3">Preferred Formats</p>
                        <div className="flex flex-wrap gap-2">
                          {['Reels', 'Carousels', 'Static Posts', 'Stories'].map(format => (
                            <button type="button" key={format} onClick={() => toggleArrayItem('preferredFormats', format)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${formData.preferredFormats.includes(format) ? 'bg-[#003870] text-white border-[#003870]' : 'bg-white text-slate-600 border-slate-200 hover:border-[#003870]/50'}`}>
                              {format}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── STEP 3: Products, Offers & Competitors ─── */}
                {currentStep === 3 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-5">
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2">
                        <ShoppingBag className="h-5 w-5 text-[#003870]" strokeWidth={2.4} />
                        Products & Offers
                      </h3>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider ml-1">Products or Services</label>
                        <textarea placeholder="List your products or services..." value={formData.productsOrServices} onChange={e => handleInputChange('productsOrServices', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#003870]/20 focus:border-[#003870] text-slate-700 text-sm min-h-[80px] resize-none" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider ml-1">Main Offer / Discount</label>
                        <input type="text" placeholder="e.g. 20% off for new arrivals" value={formData.mainOffer} onChange={e => handleInputChange('mainOffer', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#003870]/20 focus:border-[#003870] text-slate-700 text-sm" />
                      </div>
                      
                      <div>
                        <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-[0.1em] mb-3 mt-2">Inclusions</p>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { id: 'includeCaptions', label: 'Include Captions' },
                            { id: 'includeHashtags', label: 'Include Hashtags' },
                            { id: 'includeVideoIdeas', label: 'Include Video Ideas' },
                            { id: 'includeTrackingTemplate', label: 'Tracking Template' }
                          ].map(toggle => (
                            <label key={toggle.id} className="flex items-center gap-2.5 cursor-pointer">
                              <div className={`w-8 h-4.5 flex items-center bg-slate-200 rounded-full p-0.5 cursor-pointer transition-colors ${formData[toggle.id] ? 'bg-[#003870]' : ''}`} onClick={() => toggleBoolean(toggle.id)}>
                                <div className={`bg-white w-3.5 h-3.5 rounded-full shadow-sm transform transition-transform ${formData[toggle.id] ? 'translate-x-3.5' : ''}`}></div>
                              </div>
                              <span className="text-xs font-bold text-slate-600">{toggle.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="mb-6 space-y-4">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-[#003870]" strokeWidth={2.4} />
                          Engagement Strategy (Competitor Data)
                        </h3>
                        
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider ml-1">Analysis Period</label>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 flex-1 shadow-sm hover:border-[#003870]/30 transition-colors">
                              <span className="text-[10px] font-extrabold text-slate-400 uppercase">From</span>
                              <input 
                                type="date" 
                                value={formData.analysisStartDate} 
                                onChange={e => handleInputChange('analysisStartDate', e.target.value)} 
                                className="bg-transparent text-[13px] font-bold text-[#003870] outline-none w-full cursor-pointer"
                              />
                            </div>
                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 flex-1 shadow-sm hover:border-[#003870]/30 transition-colors">
                              <span className="text-[10px] font-extrabold text-slate-400 uppercase">To</span>
                              <input 
                                type="date" 
                                value={formData.analysisEndDate} 
                                onChange={e => handleInputChange('analysisEndDate', e.target.value)} 
                                className="bg-transparent text-[13px] font-bold text-[#003870] outline-none w-full cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5 mb-3">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider ml-1">Reference Priority</label>
                      </div>

                      <div className="max-h-[250px] overflow-y-auto pr-1 no-scrollbar space-y-3">
                        {/* Automated Platform Sources */}
                        {formData.platforms.length > 0 ? (
                          formData.platforms.map((platform) => {
                            const availablePosts = filteredCompetitorData[platform]?.length || 0;
                            const currentCount = formData.platformPostCounts?.[platform] !== undefined ? formData.platformPostCounts[platform] : Math.min(5, availablePosts);
                            
                            return (
                            <div key={platform} className="bg-white p-3 px-4 rounded-2xl border border-slate-200/60 shadow-sm transition-all hover:border-[#003870]/30 group">
                              <div className="flex items-center gap-4">
                                <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:border-[#003870]/20 transition-colors shrink-0">
                                  {platform === 'instagram' && <InstagramIcon active={true} />}
                                  {platform === 'facebook' && <FacebookIcon active={true} />}
                                  {platform === 'tiktok' && <TikTokIcon active={true} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] font-bold text-slate-800 truncate">{platform.charAt(0).toUpperCase() + platform.slice(1)} Top Engagement</p>
                                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Based on Competitor Data ({availablePosts} Posts Found)</p>
                                </div>
                                <div className="flex items-center gap-4 w-48 shrink-0">
                                  <input 
                                    type="range" 
                                    min="0" 
                                    max={availablePosts} 
                                    value={currentCount}
                                    onChange={(e) => {
                                      setFormData(prev => ({
                                        ...prev,
                                        platformPostCounts: {
                                          ...prev.platformPostCounts,
                                          [platform]: parseInt(e.target.value)
                                        }
                                      }));
                                    }}
                                    className="flex-1 accent-[#003870] h-1.5 bg-slate-100 rounded-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" 
                                    disabled={availablePosts === 0}
                                  />
                                  <span className="font-extrabold text-[#003870] text-[11px] w-12 text-right">{currentCount} Posts</span>
                                </div>
                              </div>
                            </div>
                          )})
                        ) : (
                          <div className="p-6 border border-dashed border-slate-100 rounded-2xl text-center">
                            <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">No Platforms Selected</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── STEP 4: Review & Generate ─── */}
                {currentStep === 4 && (
                  <div className={`animate-in fade-in duration-300 transition-all ${
                    isPromptMaximized 
                      ? 'fixed inset-0 z-[100] bg-white p-4 sm:p-6 lg:p-10 flex flex-col'
                      : 'relative'
                  }`}>
                    {isPromptMaximized && (
                      <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm -z-10" onClick={() => setIsPromptMaximized(false)} />
                    )}
                    <div className="flex flex-col gap-3 mb-3 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="text-sm font-bold text-slate-800 flex min-w-0 items-center gap-2">
                        <Bot className="h-5 w-5 text-[#003870]" strokeWidth={2.4} />
                        AI Prompt Focus
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                          {formData.prompt.trim() ? formData.prompt.trim().split(/\s+/).length : 0} Words
                        </span>
                        <span className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider ${
                          settingsSaveStatus === 'error'
                            ? 'border-red-100 bg-red-50 text-red-600'
                            : settingsSaveStatus === 'dirty'
                              ? 'border-amber-100 bg-amber-50 text-amber-600'
                              : 'border-blue-100 bg-blue-50 text-[#003870]'
                        }`}>
                          {isSettingsSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
                          ) : settingsSaveStatus === 'error' ? (
                            <AlertTriangle className="h-4 w-4" strokeWidth={2.5} />
                          ) : settingsSaveStatus === 'dirty' ? (
                            <Clock className="h-4 w-4" strokeWidth={2.5} />
                          ) : (
                            <Cloud className="h-4 w-4" strokeWidth={2.5} />
                          )}
                          {isSettingsSaving ? 'Auto Saving' : settingsSaveStatus === 'error' ? 'Auto Save Failed' : settingsSaveStatus === 'dirty' ? 'Saving Soon' : 'Auto Saved'}
                        </span>
                        <button 
                          type="button"
                          onClick={() => setIsPromptMaximized(!isPromptMaximized)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-[#003870] transition-colors flex items-center justify-center"
                          title={isPromptMaximized ? "Minimize" : "Maximize"}
                        >
                          {isPromptMaximized ? (
                            <Minimize2 className="h-5 w-5" strokeWidth={2.3} />
                          ) : (
                            <Maximize2 className="h-5 w-5" strokeWidth={2.3} />
                          )}
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">We've compiled your configuration into the prompt below. You can edit it before generating.</p>
                    <textarea
                      required
                      value={formData.prompt}
                      onChange={(e) => {
                        setSettingsSaveStatus('dirty');
                        setFormData({ ...formData, prompt: e.target.value });
                      }}
                      className={`w-full min-w-0 bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 sm:px-5 outline-none focus:ring-2 focus:ring-[#003870]/20 focus:border-[#003870] text-slate-700 text-sm resize-none transition-all leading-relaxed ${
                        isPromptMaximized ? 'flex-1 sm:text-base' : 'min-h-[160px]'
                      }`}
                    />
                    {isPromptMaximized && (
                      <div className="mt-4 flex justify-end sm:mt-6">
                        <button
                          type="button"
                          onClick={() => setIsPromptMaximized(false)}
                          className="px-6 py-2.5 rounded-xl bg-[#003870] text-white font-bold text-sm hover:bg-[#002d5a] transition-all shadow-lg"
                        >
                          Done Editing
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ─── Footer: Navigation Buttons ─── */}
              <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between">
                <div>
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm transition-all"
                    >
                      <ArrowLeft className="h-5 w-5" strokeWidth={2.4} />
                      Back
                    </button>
                  )}
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Step Indicators */}
                  <div className="flex gap-1.5 hidden md:flex">
                    {[1, 2, 3, 4].map(step => (
                      <div key={step} className={`h-1.5 rounded-full transition-all duration-300 ${currentStep === step ? 'w-6 bg-[#003870]' : currentStep > step ? 'w-1.5 bg-[#003870]/40' : 'w-1.5 bg-slate-200'}`} />
                    ))}
                  </div>

                  {currentStep < 4 ? (
                    <button
                      key="next-button"
                      type="button"
                      onClick={nextStep}
                      className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-[#003870] to-[#0055a5] shadow-lg shadow-[#003870]/20 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                    >
                      Next
                      <ArrowRight className="h-5 w-5" strokeWidth={2.4} />
                    </button>
                  ) : (
                    <button
                      key="submit-button"
                      type="submit"
                      disabled={!formData.clientId || formData.platforms.length === 0 || !formData.prompt || isGenerating}
                      className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-[#003870] to-[#0055a5] shadow-lg shadow-[#003870]/20 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isGenerating ? (
                        <><Loader2 className="h-4.5 w-4.5 animate-spin" strokeWidth={2.5} /> Generating...</>
                      ) : (
                        <><Sparkles className="h-4.5 w-4.5" strokeWidth={2.5} /> Generate Calendar</>
                      )}
                    </button>
                  )}
                </div>
              </div>

            </form>
          </div>
        </div>

        {/* ═══════════ BOTTOM SECTION: RESULTS TABLE ═══════════ */}
        <div ref={resultsSectionRef} className="flex-1 flex gap-6 min-h-0">
          <div className="min-w-0 flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col transition-all duration-300">
            <HistoryFilters 
              isGenerated={isGenerated}
              selectedFilter={selectedHistoryFilter}
              onFilterChange={setSelectedHistoryFilter}
              clients={historyClients}
              dates={historyDates}
              isSaving={isSaving}
              onSave={() => handleSaveToDatabase()}
              onDelete={handleDeleteCalendar}
              onExport={handleExportCalendar}
            />

            <div className="flex-1 overflow-auto relative p-1">
              <div className="flex gap-8 items-start min-w-fit">
                <div className="flex-1 min-w-[1000px]">
                  {isGenerated ? (
                    <CalendarTable 
                      data={generatedData} 
                      onAiEdit={handleAiEdit}
                      onDeleteRow={handleDeleteRow}
                      onUpdateRow={handleUpdateRow}
                      onOpenReference={(row, rowIndex) => {
                        setReferenceModal({ isOpen: true, row, rowIndex, userPrompt: '', refineInstruction: '', showRefinePanel: false });
                        setReelScriptSaveStatus(row?.reelScript ? 'saved' : 'idle');
                      }}
                      onGenerateScript={handleGenerateReelScript}
                      getStatusColor={getStatusColor}
                      editingIndex={aiEditModal.rowIndex}
                      generatingScriptIndex={generatingScriptIndex}
                    />
                  ) : (
                    /* Empty State */
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/30">
                      <div className="w-24 h-24 mb-6 rounded-full bg-gradient-to-tr from-[#003870]/10 to-[#0066cc]/10 flex items-center justify-center">
                        <Table2 className="h-12 w-12 text-[#003870]/40" strokeWidth={1.8} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-700 mb-2">No Content Generated Yet</h3>
                      <p className="text-slate-500 max-w-sm mx-auto text-sm">
                        Fill out the configuration form on the left and click "Generate Calendar" to see AI-driven content suggestions here.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {aiEditModal.isOpen && (
            <div
              ref={aiPanelRef}
              style={{ transform: `translateY(${refinementOffset}px)` }}
              className="flex h-fit max-h-full w-[380px] shrink-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl transition-all animate-in slide-in-from-right-8 duration-300"
            >
              <div className="px-6 py-5 bg-[#003870] flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <WandSparkles className="h-5 w-5 text-white" strokeWidth={2.4} />
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Refine Post</h3>
                </div>
                <button 
                  onClick={() => setAiEditModal({ ...aiEditModal, isOpen: false, rowIndex: null })}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X className="h-4.5 w-4.5" strokeWidth={2.5} />
                </button>
              </div>

              <div className="p-6 flex flex-col gap-4 overflow-y-auto">
                {aiEditModal.rowIndex !== null && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 mb-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Editing Row {aiEditModal.rowIndex + 1}</p>
                    <p className="text-xs text-slate-600 font-bold truncate">"{generatedData[aiEditModal.rowIndex]?.visualCopy || generatedData[aiEditModal.rowIndex]?.visual}"</p>
                  </div>
                )}

                <div className="relative group">
                  <p className="text-xs font-bold text-slate-500 mb-2 pl-1">Instruction for AI</p>
                  <div className="relative flex flex-col">
                    <textarea
                      value={aiEditModal.instruction}
                      onChange={(e) => setAiEditModal({ ...aiEditModal, instruction: e.target.value })}
                      placeholder="e.g., 'Make it punchier', 'Add more emojis', 'Change the tone'..."
                      className="w-full h-40 px-5 py-4 rounded-2xl border-2 border-slate-100 focus:border-[#003870] outline-none transition-all text-sm text-slate-700 font-medium resize-none shadow-inner"
                      disabled={aiEditModal.isProcessing}
                    ></textarea>
                    
                    <button
                      onClick={handleAiEditSubmit}
                      disabled={aiEditModal.isProcessing || !aiEditModal.instruction.trim()}
                      className="absolute bottom-3 right-3 w-12 h-12 rounded-xl bg-[#003870] text-white shadow-lg shadow-[#003870]/30 hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:scale-100 transition-all flex items-center justify-center"
                    >
                      {aiEditModal.isProcessing ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <Send className="h-5 w-5" strokeWidth={2.4} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-3 mt-2">
                  <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest">AI Tips</p>
                  <div className="grid grid-cols-2 gap-2">
                    {['Make longer', 'Add hashtags', 'Change tone', 'Fix grammar'].map(tip => (
                      <button 
                        key={tip}
                        onClick={() => setAiEditModal(prev => ({ ...prev, instruction: tip }))}
                        className="px-3 py-2 rounded-xl border border-slate-100 text-[11px] font-bold text-slate-500 hover:bg-slate-50 hover:text-[#003870] hover:border-[#003870]/20 transition-all text-left truncate"
                      >
                        {tip}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-auto px-6 py-4 bg-slate-50 border-t border-slate-100">
                 <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                   Type your changes above. AI will rewrite the post content while keeping the date and pillar intact.
                 </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {referenceModal.isOpen && (
        <div className="fixed inset-0 z-[100] bg-white p-4 sm:p-6 lg:p-10 flex flex-col">
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm -z-10" onClick={() => setReferenceModal({ isOpen: false, row: null, rowIndex: null, userPrompt: '', refineInstruction: '', showRefinePanel: false })} />
          <div className="flex flex-col gap-3 mb-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex min-w-0 items-center gap-2">
              <span className="material-symbols-outlined text-[#003870] text-[20px]">movie</span>
              Reference
            </h3>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                {(referenceModal.row?.reelScript || '').trim() ? referenceModal.row.reelScript.trim().split(/\s+/).length : 0} Words
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-100 bg-amber-50 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-amber-600">
                  <Clock className="h-4 w-4" strokeWidth={2.5} />
                  Reference
                </span>
              {referenceModal.row?.reelScript && (
                <>
                  <span className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider ${
                    reelScriptSaveStatus === 'error'
                      ? 'border-red-100 bg-red-50 text-red-600'
                      : reelScriptSaveStatus === 'dirty'
                        ? 'border-amber-100 bg-amber-50 text-amber-600'
                        : 'border-blue-100 bg-blue-50 text-[#003870]'
                  }`}>
                    {reelScriptSaveStatus === 'saving' ? (
                      <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
                    ) : reelScriptSaveStatus === 'error' ? (
                      <AlertTriangle className="h-4 w-4" strokeWidth={2.5} />
                    ) : reelScriptSaveStatus === 'dirty' ? (
                      <Clock className="h-4 w-4" strokeWidth={2.5} />
                    ) : (
                      <Cloud className="h-4 w-4" strokeWidth={2.5} />
                    )}
                    {reelScriptSaveStatus === 'saving' ? 'Saving' : reelScriptSaveStatus === 'error' ? 'Save Failed' : reelScriptSaveStatus === 'dirty' ? 'Saving Soon' : 'Saved'}
                  </span>
                  <button
                    type="button"
                    onClick={() => persistReelScript(referenceModal.row)}
                    disabled={reelScriptSaveStatus === 'saving'}
                    className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#003870] shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
                    title="Save reel script"
                  >
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setReferenceModal((previous) => ({ ...previous, showRefinePanel: !previous.showRefinePanel }))}
                    className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${
                      referenceModal.showRefinePanel
                        ? 'bg-[#003870] text-white'
                        : 'hover:bg-slate-100 text-slate-400 hover:text-[#003870]'
                    }`}
                    title="Refine Script"
                  >
                    <WandSparkles className="h-5 w-5" strokeWidth={2.3} />
                  </button>
                </>
              )}
                <button
                  type="button"
                  onClick={() => setReferenceModal({ isOpen: false, row: null, rowIndex: null, userPrompt: '', refineInstruction: '', showRefinePanel: false })}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-[#003870] transition-colors flex items-center justify-center"
                  title="Close"
                >
                <Minimize2 className="h-5 w-5" strokeWidth={2.3} />
                </button>
              </div>
            </div>
          <p className="text-xs text-slate-500 mb-4">
            {referenceModal.row?.reelScript
              ? 'Generated reel script reference for this row.'
              : 'Add an optional direction before generating the reel script for this row.'}
          </p>

          {referenceModal.row?.reelScript ? (
            <div className={`grid min-h-0 flex-1 gap-5 ${
              referenceModal.showRefinePanel ? 'lg:grid-cols-[minmax(0,1fr)_380px]' : 'grid-cols-1'
            }`}>
              <textarea
                value={referenceModal.row.reelScript}
                onChange={(event) => handleReelScriptChange(event.target.value)}
                className="w-full min-w-0 bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 sm:px-5 outline-none focus:ring-2 focus:ring-[#003870]/20 focus:border-[#003870] text-slate-700 resize-none transition-all leading-relaxed flex-1 text-sm sm:text-base"
              />
              {referenceModal.showRefinePanel && (
              <div className="flex min-h-[520px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl animate-in slide-in-from-right-6 duration-300">
                <div className="flex shrink-0 items-center justify-between bg-[#003870] px-6 py-5">
                  <div className="flex items-center gap-2">
                    <WandSparkles className="h-5 w-5 text-white" strokeWidth={2.4} />
                    <h3 className="text-sm font-black uppercase tracking-wider text-white">Refine Script</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReferenceModal((previous) => ({ ...previous, refineInstruction: '' }))}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
                    title="Clear instruction"
                  >
                    <X className="h-4.5 w-4.5" strokeWidth={2.5} />
                  </button>
                </div>

                <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Editing Reel Script
                    </p>
                    <p className="truncate text-xs font-bold text-slate-600">
                      "{referenceModal.row?.visualCopy || referenceModal.row?.visual || referenceModal.row?.caption || 'Generated script'}"
                    </p>
                  </div>

                  <div className="relative">
                    <p className="mb-2 pl-1 text-xs font-bold text-slate-500">Instruction for AI</p>
                    <textarea
                      value={referenceModal.refineInstruction}
                      onChange={(event) => setReferenceModal((previous) => ({ ...previous, refineInstruction: event.target.value }))}
                      placeholder="e.g., 'Make it punchier', 'Add stronger hook', 'Make it more emotional'..."
                      disabled={generatingScriptIndex === referenceModal.rowIndex}
                      className="h-40 w-full resize-none rounded-2xl border-2 border-slate-100 px-5 py-4 text-sm font-medium text-slate-700 shadow-inner outline-none transition-all focus:border-[#003870]"
                    />
                    <button
                      type="button"
                      onClick={handleRefineReelScript}
                      disabled={generatingScriptIndex === referenceModal.rowIndex || !referenceModal.refineInstruction.trim()}
                      className="absolute bottom-3 right-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#003870] text-white shadow-lg shadow-[#003870]/30 transition-all hover:scale-105 disabled:scale-100 disabled:opacity-50"
                      title="Refine Script"
                    >
                      {generatingScriptIndex === referenceModal.rowIndex ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      ) : (
                        <Send className="h-5 w-5" strokeWidth={2.4} />
                      )}
                    </button>
                  </div>

                  <div className="mt-2 flex flex-col gap-3">
                    <p className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">AI Tips</p>
                    <div className="grid grid-cols-2 gap-2">
                      {['Make punchier', 'Add stronger hook', 'More emotional', 'Tighter timing'].map((tip) => (
                        <button
                          key={tip}
                          type="button"
                          onClick={() => setReferenceModal((previous) => ({ ...previous, refineInstruction: tip }))}
                          className="truncate rounded-xl border border-slate-100 px-3 py-2 text-left text-[11px] font-bold text-slate-500 transition-all hover:border-[#003870]/20 hover:bg-slate-50 hover:text-[#003870]"
                        >
                          {tip}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-auto border-t border-slate-100 bg-slate-50 px-6 py-4">
                  <p className="text-[10px] font-medium leading-relaxed text-slate-400">
                    Type your changes above. AI will rewrite the reel script while keeping the row pillar, caption, and brand context intact.
                  </p>
                </div>
              </div>
              )}
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-4">
              <textarea
                value={referenceModal.userPrompt}
                onChange={(event) => setReferenceModal((previous) => ({ ...previous, userPrompt: event.target.value }))}
                placeholder="Optional: Tell AI what to focus on. e.g. Make it emotional, use a founder POV, add humor, focus on safety benefits..."
                className="min-h-[180px] w-full min-w-0 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-relaxed text-slate-700 outline-none transition-all focus:border-[#003870] focus:ring-2 focus:ring-[#003870]/20 sm:px-5 sm:text-base"
              />
              <div className="flex-1 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-4 text-sm font-medium leading-7 text-slate-500">
                This direction will be combined with the row pillar, visual copy, caption, brand voice, selected frameworks, and content pillars before sending to AI.
              </div>
            </div>
          )}

            <div className="mt-4 flex justify-end sm:mt-6">
              {!referenceModal.row?.reelScript && (
                <button
                  type="button"
                  onClick={() => handleGenerateReelScript(referenceModal.rowIndex, referenceModal.userPrompt)}
                  disabled={generatingScriptIndex === referenceModal.rowIndex}
                  className="mr-3 rounded-xl bg-white px-6 py-2.5 text-sm font-bold text-[#003870] shadow-sm transition-all hover:bg-slate-50 disabled:opacity-60"
                >
                  {generatingScriptIndex === referenceModal.rowIndex ? 'Generating...' : 'Generate Script'}
                </button>
              )}
              <button
                type="button"
                onClick={() => setReferenceModal({ isOpen: false, row: null, rowIndex: null, userPrompt: '', refineInstruction: '', showRefinePanel: false })}
              className="px-6 py-2.5 rounded-xl bg-[#003870] text-white font-bold text-sm hover:bg-[#002d5a] transition-all shadow-lg"
              >
                Done Editing
              </button>
            </div>
        </div>
      )}

      {toast && (
        <div className={`fixed top-10 right-10 z-[1000] flex items-center gap-3 px-5 py-4 rounded-2xl bg-white border-l-4 ${toast.type === "success" ? "border-[#003870]" : "border-[#93000a]"} shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] animate-in slide-in-from-top-4 duration-300`}>
           <div className={toast.type === "success" ? "text-[#003870]" : "text-[#93000a]"}>
             {toast.type === "success" ? (
               <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
               </svg>
             ) : (
               <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
               </svg>
             )}
           </div>
           <p className="text-base font-bold text-[#191c1d] tracking-tight">{toast.message}</p>
           <button onClick={() => setToast(null)} className="ml-4 text-slate-400 hover:text-slate-600">
              <X className="h-4.5 w-4.5" strokeWidth={2.5} />
           </button>
        </div>
      )}

      <DeleteConfirmationModal 
        open={isDeleteRowModalOpen}
        onClose={() => setIsDeleteRowModalOpen(false)}
        onConfirm={confirmDeleteRow}
        title="Delete Post?"
        message="Are you sure you want to delete this post? This will remove it from the calendar permanently."
      />

      <DeleteConfirmationModal 
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteCalendar}
        title="Delete Content Calendar?"
        message={`Are you sure you want to permanently delete the calendar "${calendarToDelete?.name}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default CreateContentCalendar;

