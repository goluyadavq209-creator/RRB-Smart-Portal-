import React, { useState } from 'react';
import { FullRRBDatabase, TabView, ExamItem } from '../types';
import { RailwayTrainHeroBanner } from './RailwayTrainHeroBanner';
import { QuickAccessGrid } from './QuickAccessGrid';
import { LatestUpdatesCard } from './LatestUpdatesCard';
import { CandidateDirectLinksHub } from './CandidateDirectLinksHub';
import { RRBZonesWidget } from './RRBZonesWidget';
import { TrustBadgesStrip } from './TrustBadgesStrip';
import { ExamDetailModal } from './ExamDetailModal';
import { StudyMaterialModal } from './StudyMaterialModal';

interface HomeDashboardProps {
  database: FullRRBDatabase;
  setCurrentTab: (tab: TabView) => void;
  selectedZoneFilter: string;
  setSelectedZoneFilter: (zone: string) => void;
  onOpenGlobalSearch?: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  database,
  setCurrentTab,
  selectedZoneFilter,
  setSelectedZoneFilter,
  onOpenGlobalSearch,
}) => {
  const [selectedExamForModal, setSelectedExamForModal] = useState<ExamItem | null>(null);
  const [studyMaterialModalOpen, setStudyMaterialModalOpen] = useState(false);

  return (
    <div className="space-y-6 sm:space-y-8 pb-10">
      {/* 1. Indian Railways Locomotive Train Hero Banner */}
      <RailwayTrainHeroBanner
        onSearchSubmit={(_query) => {
          if (onOpenGlobalSearch) onOpenGlobalSearch();
          else setCurrentTab('exams');
        }}
        onSelectTrendingExam={(code) => {
          const match = database.exams.find((e) => e.title.includes(code) || e.shortCode.includes(code));
          if (match) setSelectedExamForModal(match);
          else setCurrentTab('exams');
        }}
        onNavigateTab={(tab) => setCurrentTab(tab)}
      />

      {/* 2. Quick Access Row (6 Cards: Latest Exams, Notifications, Cut Off, Results, Answer Key, Study Material) */}
      <QuickAccessGrid
        database={database}
        setCurrentTab={setCurrentTab}
        onOpenStudyMaterial={() => setStudyMaterialModalOpen(true)}
      />

      {/* 3. Candidate Direct Portals Hub (Admit Card, Score Card, Answer Key, Exam City Slip) */}
      <CandidateDirectLinksHub database={database} setCurrentTab={setCurrentTab} />

      {/* 4. Main 2-Column Grid (Left: Latest Updates & Notifications, Right: RRB Zones Official Directory) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Spans 7 cols on lg) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Latest Updates Card */}
          <LatestUpdatesCard
            database={database}
            setCurrentTab={setCurrentTab}
            onOpenNoticeDetail={() => setCurrentTab('notices')}
          />
        </div>

        {/* Right Column (Spans 5 cols on lg) */}
        <div className="lg:col-span-5 space-y-6">
          {/* RRB Zones Widget & Official Directory */}
          <RRBZonesWidget
            database={database}
            selectedZoneFilter={selectedZoneFilter}
            setSelectedZoneFilter={setSelectedZoneFilter}
            setCurrentTab={setCurrentTab}
          />
        </div>
      </div>

      {/* 5. Bottom Trust Badges Strip (100% Trusted, Fast Updates, All in One Place) */}
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

