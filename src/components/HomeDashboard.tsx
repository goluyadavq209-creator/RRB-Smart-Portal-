import React, { useState } from 'react';
import { FullRRBDatabase, TabView, ExamItem } from '../types';
import { RailwayTrainHeroBanner } from './RailwayTrainHeroBanner';
import { QuickAccessGrid } from './QuickAccessGrid';
import { LatestUpdatesCard } from './LatestUpdatesCard';
import { CandidateDirectLinksHub } from './CandidateDirectLinksHub';
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
  selectedZoneFilter: _selectedZoneFilter,
  setSelectedZoneFilter: _setSelectedZoneFilter,
  onOpenGlobalSearch,
}) => {
  const [activeExamFilter, setActiveExamFilter] = useState<string>('ALL');
  const [selectedExamForModal, setSelectedExamForModal] = useState<ExamItem | null>(null);
  const [studyMaterialModalOpen, setStudyMaterialModalOpen] = useState(false);

  const handleSelectTrendingExam = (examCode: string) => {
    // If already active, toggle off to ALL; otherwise activate this single exam filter
    if (activeExamFilter === examCode) {
      setActiveExamFilter('ALL');
    } else {
      setActiveExamFilter(examCode);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-10">
      {/* 1. Indian Railways Locomotive Train Hero Banner */}
      <RailwayTrainHeroBanner
        activeExamFilter={activeExamFilter}
        onSearchSubmit={(_query) => {
          if (onOpenGlobalSearch) onOpenGlobalSearch();
          else setCurrentTab('exams');
        }}
        onSelectTrendingExam={handleSelectTrendingExam}
        onNavigateTab={(tab) => setCurrentTab(tab)}
      />

      {/* 2. Quick Access Row (6 Cards: Latest Exams, Notifications, Cut Off, Results, Answer Key, Study Material) */}
      <QuickAccessGrid
        database={database}
        setCurrentTab={setCurrentTab}
        onOpenStudyMaterial={() => setStudyMaterialModalOpen(true)}
      />

      {/* 3. Candidate Direct Portals Hub (Filtered by active exam if selected) */}
      <CandidateDirectLinksHub 
        database={database} 
        setCurrentTab={setCurrentTab}
        activeExamFilter={activeExamFilter}
        onClearFilter={() => setActiveExamFilter('ALL')}
      />

      {/* 4. Latest Updates & Notices (Full Width, Filtered by active exam if selected) */}
      <div className="space-y-6">
        <LatestUpdatesCard
          database={database}
          setCurrentTab={setCurrentTab}
          onOpenNoticeDetail={() => setCurrentTab('notices')}
          activeExamFilter={activeExamFilter}
          onClearFilter={() => setActiveExamFilter('ALL')}
        />
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

