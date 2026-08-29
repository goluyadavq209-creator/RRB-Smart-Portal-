import React, { useState } from 'react';
import { FullRRBDatabase, TabView, ExamItem } from '../types';
import { RailwayTrainHeroBanner } from './RailwayTrainHeroBanner';
import { QuickAccessGrid } from './QuickAccessGrid';
import { ExamExplorerCard } from './ExamExplorerCard';
import { LatestUpdatesCard } from './LatestUpdatesCard';
import { CutOffExplorerCard } from './CutOffExplorerCard';
import { CandidateDirectLinksHub } from './CandidateDirectLinksHub';
import { CutOffTablePreview } from './CutOffTablePreview';
import { RRBZonesWidget } from './RRBZonesWidget';
import { TrustBadgesStrip } from './TrustBadgesStrip';
import { ExamDetailModal } from './ExamDetailModal';
import { RRBAIAssistantModal } from './RRBAIAssistantModal';
import { StudyMaterialModal } from './StudyMaterialModal';

interface HomeDashboardProps {
  database: FullRRBDatabase;
  setCurrentTab: (tab: TabView) => void;
  selectedZoneFilter: string;
  setSelectedZoneFilter: (zone: string) => void;
  onOpenGlobalSearch?: () => void;
  isAIModalOpen?: boolean;
  onCloseAIModal?: () => void;
  onOpenAIModal?: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  database,
  setCurrentTab,
  selectedZoneFilter,
  setSelectedZoneFilter,
  onOpenGlobalSearch,
  isAIModalOpen = false,
  onCloseAIModal,
  onOpenAIModal,
}) => {
  const [selectedExamForModal, setSelectedExamForModal] = useState<ExamItem | null>(null);
  const [studyMaterialModalOpen, setStudyMaterialModalOpen] = useState(false);
  const [activeAIPrompt, setActiveAIPrompt] = useState<string | undefined>(undefined);
  const [localAIModalOpen, setLocalAIModalOpen] = useState(false);

  const [cutoffFilters, setCutoffFilters] = useState<{
    examId?: string;
    year?: string;
    zoneCode?: string;
    category?: string;
    stage?: string;
  }>({});

  const handleApplyCutoffFilters = (filters: {
    examId?: string;
    year?: string;
    zoneCode?: string;
    category?: string;
    stage?: string;
  }) => {
    setCutoffFilters(filters);
    if (filters.zoneCode) {
      setSelectedZoneFilter(filters.zoneCode);
    }
  };

  const handleOpenAIPrompt = (prompt: string) => {
    setActiveAIPrompt(prompt);
    if (onOpenAIModal) {
      onOpenAIModal();
    } else {
      setLocalAIModalOpen(true);
    }
  };

  const isModalVisible = isAIModalOpen || localAIModalOpen;
  const handleCloseAI = () => {
    if (onCloseAIModal) onCloseAIModal();
    setLocalAIModalOpen(false);
    setActiveAIPrompt(undefined);
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-10">
      {/* 1. Indian Railways Locomotive Train Hero Banner with Ask RRB AI Widget */}
      <RailwayTrainHeroBanner
        onSearchSubmit={(query) => {
          if (onOpenGlobalSearch) onOpenGlobalSearch();
          else setCurrentTab('exams');
        }}
        onSelectTrendingExam={(code) => {
          const match = database.exams.find((e) => e.title.includes(code) || e.shortCode.includes(code));
          if (match) setSelectedExamForModal(match);
          else setCurrentTab('exams');
        }}
        onOpenAIWithPrompt={handleOpenAIPrompt}
      />

      {/* 2. Quick Access Row (6 Cards: Latest Exams, Notifications, Cut Off, Results, Answer Key, Study Material) */}
      <QuickAccessGrid
        database={database}
        setCurrentTab={setCurrentTab}
        onOpenStudyMaterial={() => setStudyMaterialModalOpen(true)}
      />

      {/* 3. Candidate Direct Portals Hub (Admit Card, Score Card, Answer Key, Exam City Slip) */}
      <CandidateDirectLinksHub database={database} setCurrentTab={setCurrentTab} />

      {/* 4. Main 2-Column Grid (Left: Exam Explorer & Latest Updates, Right: Cut Off Finder & RRB Zones) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Spans 7 cols on lg) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Exam Explorer Card */}
          <ExamExplorerCard
            database={database}
            setCurrentTab={setCurrentTab}
            onSelectExam={(exam) => setSelectedExamForModal(exam)}
          />

          {/* Latest Updates Card */}
          <LatestUpdatesCard
            database={database}
            setCurrentTab={setCurrentTab}
            onOpenNoticeDetail={() => setCurrentTab('notices')}
          />

          {/* Cut-Off Table Preview */}
          <CutOffTablePreview
            database={database}
            appliedFilters={cutoffFilters}
            setCurrentTab={setCurrentTab}
          />
        </div>

        {/* Right Column (Spans 5 cols on lg) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Cut Off Finder Card */}
          <CutOffExplorerCard
            database={database}
            setCurrentTab={setCurrentTab}
            onApplyCutoffFilters={handleApplyCutoffFilters}
          />

          {/* RRB Zones Widget & Official Directory */}
          <RRBZonesWidget
            database={database}
            selectedZoneFilter={selectedZoneFilter}
            setSelectedZoneFilter={setSelectedZoneFilter}
            setCurrentTab={setCurrentTab}
          />
        </div>
      </div>

      {/* 5. Bottom Trust Badges Strip (100% Trusted, AI Powered, Fast Updates, All in One Place) */}
      <TrustBadgesStrip />

      {/* Modal Dialog when an exam is clicked from Home Screen */}
      {selectedExamForModal && (
        <ExamDetailModal
          exam={selectedExamForModal}
          onClose={() => setSelectedExamForModal(null)}
          onViewCutoffs={() => {
            setSelectedExamForModal(null);
            setCurrentTab('cutoffs');
          }}
          onViewNotices={() => {
            setSelectedExamForModal(null);
            setCurrentTab('notices');
          }}
        />
      )}

      {/* RRB AI Assistant Interactive Modal */}
      {isModalVisible && (
        <RRBAIAssistantModal
          isOpen={isModalVisible}
          onClose={handleCloseAI}
          initialPrompt={activeAIPrompt}
        />
      )}

      {/* Study Material Modal */}
      {studyMaterialModalOpen && (
        <StudyMaterialModal
          isOpen={studyMaterialModalOpen}
          onClose={() => setStudyMaterialModalOpen(false)}
        />
      )}
    </div>
  );
};
