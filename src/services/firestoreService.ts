import {
  db,
  auth,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail
} from '../lib/firebase';
import { User } from 'firebase/auth';
import {
  NoticeItem,
  ExamItem,
  CutoffRecord,
  ResultItem,
  CandidatePortalLink,
  MockTestItem,
  AnswerKeyItem,
  StudyMaterialItem,
  FullRRBDatabase,
  UserProfile,
  SiteSettings
} from '../types';
import {
  DEFAULT_EXAMS,
  DEFAULT_NOTICES,
  DEFAULT_CUTOFFS,
  DEFAULT_RESULTS,
  DEFAULT_CANDIDATE_PORTAL_LINKS,
  OFFICIAL_RRB_ZONES,
  INITIAL_EMPTY_DATABASE
} from '../data/defaultData';

// Firestore Collection Names
export const COLLECTIONS = {
  NOTICES: 'notices',
  EXAMS: 'exams',
  MOCK_TESTS: 'mockTests',
  ANSWER_KEYS: 'answerKeys',
  RESULTS: 'results',
  CUTOFFS: 'cutoffs',
  STUDY_MATERIALS: 'studyMaterials',
  PORTAL_LINKS: 'portalLinks',
  USERS: 'users',
  ADMINS: 'admins',
  SETTINGS: 'portalSettings',
} as const;

// Master Authorized Admin Emails
const KNOWN_ADMIN_EMAILS = new Set([
  'maansinghyadav095@gmail.com',
  'ymaan841@gmail.com',
  'admin@rrb-smart-portal.gov.in'
]);

export interface FirestoreServiceStatus {
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
  lastSyncedAt: string | null;
}

class FirestoreDatabaseService {
  private statusListeners: Array<(status: FirestoreServiceStatus) => void> = [];
  private currentStatus: FirestoreServiceStatus = {
    isLoading: true,
    isConnected: true,
    error: null,
    lastSyncedAt: null,
  };

  private cachedDatabase: FullRRBDatabase = {
    ...INITIAL_EMPTY_DATABASE,
    exams: DEFAULT_EXAMS,
    notices: DEFAULT_NOTICES,
    cutoffs: DEFAULT_CUTOFFS,
    results: DEFAULT_RESULTS,
    portalLinks: DEFAULT_CANDIDATE_PORTAL_LINKS,
  };

  private dbListeners: Array<(db: FullRRBDatabase) => void> = [];
  private unsubscribeListeners: Array<() => void> = [];
  private hasInitializedRealtime = false;

  constructor() {
    // Check connection and initialize realtime listeners on startup
    if (typeof window !== 'undefined') {
      this.initRealtimeSubscriptions();
    }
  }

  public getStatus(): FirestoreServiceStatus {
    return { ...this.currentStatus };
  }

  public subscribeStatus(listener: (status: FirestoreServiceStatus) => void): () => void {
    this.statusListeners.push(listener);
    listener(this.currentStatus);
    return () => {
      this.statusListeners = this.statusListeners.filter((l) => l !== listener);
    };
  }

  private updateStatus(partial: Partial<FirestoreServiceStatus>) {
    this.currentStatus = { ...this.currentStatus, ...partial };
    this.statusListeners.forEach((l) => {
      try { l(this.currentStatus); } catch (e) { console.error('Status listener error:', e); }
    });
  }

  /**
   * Subscribe to the unified full portal database in real-time.
   * Emits whenever ANY collection in Firestore changes.
   */
  public subscribe(listener: (db: FullRRBDatabase) => void): () => void {
    this.dbListeners.push(listener);
    // Send immediate cached copy
    listener(this.cachedDatabase);
    return () => {
      this.dbListeners = this.dbListeners.filter((l) => l !== listener);
    };
  }

  private notifyDbListeners() {
    this.cachedDatabase.metadata.lastUpdated = new Date().toISOString();
    this.updateStatus({ lastSyncedAt: new Date().toISOString(), isLoading: false, error: null });
    this.dbListeners.forEach((l) => {
      try { l(this.cachedDatabase); } catch (e) { console.error('Db listener error:', e); }
    });
  }

  /**
   * Initializes real-time Firestore onSnapshot listeners for all shared collections
   */
  public initRealtimeSubscriptions(): void {
    if (this.hasInitializedRealtime) return;
    this.hasInitializedRealtime = true;

    try {
      // 1. Real-time NOTICES listener (sorted by createdAt / publishDate descending)
      const noticesQuery = query(collection(db, COLLECTIONS.NOTICES));
      const unsubNotices = onSnapshot(
        noticesQuery,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: NoticeItem[] = [];
            snapshot.forEach((docSnap) => {
              const d = docSnap.data();
              list.push({
                id: docSnap.id,
                cenNumber: d.cenNumber || undefined,
                zoneCode: d.zoneCode || 'ALL',
                title: d.title || 'Official Railway Notice',
                category: d.category || 'General Advisory',
                publishDate: d.publishDate || new Date().toISOString().split('T')[0],
                isImportant: Boolean(d.isImportant),
                isNew: Boolean(d.isNew),
                pdfUrl: d.pdfUrl || undefined,
                contentSummary: d.contentSummary || undefined,
              });
            });
            // Sort by publishDate desc
            list.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
            this.cachedDatabase.notices = list;
            this.notifyDbListeners();
          } else {
            // Auto seed if empty
            this.checkAndSeedInitialData();
          }
        },
        (error) => {
          this.handleFirestoreError('notices', error);
        }
      );
      this.unsubscribeListeners.push(unsubNotices);

      // 2. Real-time EXAMS listener
      const examsQuery = query(collection(db, COLLECTIONS.EXAMS));
      const unsubExams = onSnapshot(
        examsQuery,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: ExamItem[] = [];
            snapshot.forEach((docSnap) => {
              const d = docSnap.data();
              list.push({
                id: docSnap.id,
                cenNumber: d.cenNumber || '',
                title: d.title || '',
                shortCode: d.shortCode || '',
                department: d.department || '',
                status: d.status || 'Exam Scheduled',
                totalVacancies: Number(d.totalVacancies) || 0,
                applicationStart: d.applicationStart,
                applicationEnd: d.applicationEnd,
                examDates: d.examDates,
                eligibility: d.eligibility,
                ageLimit: d.ageLimit,
                payScale: d.payScale,
                selectionStages: d.selectionStages || ['CBT-1', 'CBT-2'],
                officialPdfUrl: d.officialPdfUrl,
                admitCardUrl: d.admitCardUrl,
                cityIntimationUrl: d.cityIntimationUrl,
                zoneVacancies: d.zoneVacancies,
                description: d.description,
                updatedAt: d.updatedAt || new Date().toISOString(),
              });
            });
            this.cachedDatabase.exams = list;
            this.notifyDbListeners();
          }
        },
        (error) => {
          this.handleFirestoreError('exams', error);
        }
      );
      this.unsubscribeListeners.push(unsubExams);

      // 3. Real-time CUTOFFS listener
      const cutoffsQuery = query(collection(db, COLLECTIONS.CUTOFFS));
      const unsubCutoffs = onSnapshot(
        cutoffsQuery,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: CutoffRecord[] = [];
            snapshot.forEach((docSnap) => {
              const d = docSnap.data();
              list.push({
                id: docSnap.id,
                cenNumber: d.cenNumber || '',
                examTitle: d.examTitle || '',
                zoneCode: d.zoneCode || '',
                zoneName: d.zoneName || '',
                postName: d.postName || '',
                stage: d.stage || 'CBT-1',
                year: d.year || 2024,
                cutoffs: d.cutoffs || {},
                rawMarksCutoffs: d.rawMarksCutoffs,
                catNo: d.catNo,
                tableRows: d.tableRows,
                rawTableRows: d.rawTableRows,
                hindiZoneName: d.hindiZoneName,
                hindiExamTitle: d.hindiExamTitle,
                chairmanSign: d.chairmanSign,
                dateStr: d.dateStr,
                customColumns: d.customColumns,
                abbreviations: d.abbreviations,
                normalizedScore: d.normalizedScore !== false,
                totalCandidatesCalled: d.totalCandidatesCalled,
                pdfReference: d.pdfReference,
                updatedAt: d.updatedAt || new Date().toISOString(),
              });
            });
            this.cachedDatabase.cutoffs = list;
            this.notifyDbListeners();
          }
        },
        (error) => {
          this.handleFirestoreError('cutoffs', error);
        }
      );
      this.unsubscribeListeners.push(unsubCutoffs);

      // 4. Real-time RESULTS listener
      const resultsQuery = query(collection(db, COLLECTIONS.RESULTS));
      const unsubResults = onSnapshot(
        resultsQuery,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: ResultItem[] = [];
            snapshot.forEach((docSnap) => {
              const d = docSnap.data();
              list.push({
                id: docSnap.id,
                cenNumber: d.cenNumber || '',
                examTitle: d.examTitle || '',
                zoneCode: d.zoneCode || '',
                zoneName: d.zoneName || '',
                stage: d.stage || '',
                publishDate: d.publishDate || '',
                type: d.type || 'Merit List PDF',
                fileUrl: d.fileUrl,
                totalSelectedCandidates: d.totalSelectedCandidates,
                rollNumbersSample: d.rollNumbersSample || [],
                instructions: d.instructions,
                isNextStageEligible: d.isNextStageEligible,
                nextStageTitle: d.nextStageTitle,
              });
            });
            this.cachedDatabase.results = list;
            this.notifyDbListeners();
          }
        },
        (error) => {
          this.handleFirestoreError('results', error);
        }
      );
      this.unsubscribeListeners.push(unsubResults);

      // 5. Real-time PORTAL LINKS listener
      const linksQuery = query(collection(db, COLLECTIONS.PORTAL_LINKS));
      const unsubLinks = onSnapshot(
        linksQuery,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: CandidatePortalLink[] = [];
            snapshot.forEach((docSnap) => {
              const d = docSnap.data();
              list.push({
                id: docSnap.id,
                title: d.title || '',
                examName: d.examName,
                cenNumber: d.cenNumber,
                type: d.type || 'official_portal',
                url: d.url || '',
                badgeText: d.badgeText,
                publishDate: d.publishDate,
                isActive: d.isActive !== false,
                notes: d.notes,
              });
            });
            this.cachedDatabase.portalLinks = list;
            this.notifyDbListeners();
          }
        },
        (error) => {
          this.handleFirestoreError('portalLinks', error);
        }
      );
      this.unsubscribeListeners.push(unsubLinks);

      // 6. Real-time MOCK TESTS listener
      const mockTestsQuery = query(collection(db, COLLECTIONS.MOCK_TESTS));
      const unsubMock = onSnapshot(
        mockTestsQuery,
        (snapshot) => {
          const list: MockTestItem[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() } as MockTestItem);
          });
          this.cachedDatabase.mockTests = list;
          this.notifyDbListeners();
        },
        (error) => {
          this.handleFirestoreError('mockTests', error);
        }
      );
      this.unsubscribeListeners.push(unsubMock);

      // 7. Real-time ANSWER KEYS listener
      const answerKeysQuery = query(collection(db, COLLECTIONS.ANSWER_KEYS));
      const unsubKeys = onSnapshot(
        answerKeysQuery,
        (snapshot) => {
          const list: AnswerKeyItem[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() } as AnswerKeyItem);
          });
          this.cachedDatabase.answerKeys = list;
          this.notifyDbListeners();
        },
        (error) => {
          this.handleFirestoreError('answerKeys', error);
        }
      );
      this.unsubscribeListeners.push(unsubKeys);

      // 8. Real-time STUDY MATERIALS listener
      const studyQuery = query(collection(db, COLLECTIONS.STUDY_MATERIALS));
      const unsubStudy = onSnapshot(
        studyQuery,
        (snapshot) => {
          const list: StudyMaterialItem[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() } as StudyMaterialItem);
          });
          this.cachedDatabase.studyMaterials = list;
          this.notifyDbListeners();
        },
        (error) => {
          this.handleFirestoreError('studyMaterials', error);
        }
      );
      this.unsubscribeListeners.push(unsubStudy);

      // 9. Real-time PORTAL SETTINGS listener
      const settingsDocRef = doc(db, COLLECTIONS.SETTINGS, 'general');
      const unsubSettings = onSnapshot(
        settingsDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data?.settings) {
              this.cachedDatabase.settings = data.settings as SiteSettings;
              this.notifyDbListeners();
            }
          }
        },
        (error) => {
          this.handleFirestoreError('portalSettings', error);
        }
      );
      this.unsubscribeListeners.push(unsubSettings);

    } catch (err: any) {
      console.error('Failed to bind Firestore real-time listeners:', err);
      this.updateStatus({ isLoading: false, error: this.formatErrorMessage(err) });
    }
  }

  private handleFirestoreError(collectionName: string, error: any) {
    console.warn(`Firestore onSnapshot warning on [${collectionName}]:`, error);
    const msg = this.formatErrorMessage(error);
    this.updateStatus({ error: msg, isConnected: !error.message?.includes('offline') });
  }

  private formatErrorMessage(error: any): string {
    if (!error) return 'Unknown database error';
    const code = error.code || '';
    const msg = error.message || '';

    if (code === 'permission-denied' || msg.includes('permission-denied')) {
      return 'Permission denied: Administrator privileges required to perform this action.';
    }
    if (code === 'unavailable' || msg.includes('offline') || msg.includes('network')) {
      return 'Cloud Firestore is currently offline or unreachable. Please check your network.';
    }
    return msg || 'Database operation error occurred.';
  }

  /**
   * Re-initializes and refreshes all onSnapshot subscriptions and fetch state
   */
  public refreshAllListeners(): void {
    this.unsubscribeListeners.forEach((unsub) => {
      try { unsub(); } catch {}
    });
    this.unsubscribeListeners = [];
    this.hasInitializedRealtime = false;
    this.updateStatus({ isLoading: true, error: null });
    this.initRealtimeSubscriptions();
    this.fetchFullDatabase().catch(() => {});
  }

  /**
   * Check if Firestore has zero records, and if so, seeds authentic initial railway data
   */
  public async checkAndSeedInitialData(): Promise<void> {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.NOTICES));
      if (!snap.empty) {
        return; // Already populated
      }

      console.info('🌱 Seeding official railway database into Firestore rrb-smart-portal...');
      await this.saveFullDatabaseToFirestore({
        metadata: {
          version: '4.1.0-FIRESTORE',
          lastUpdated: new Date().toISOString(),
          uploadedBy: 'Official Railway System',
          source: 'Railway Recruitment Board Firestore Cloud Database',
          notes: 'Direct cloud sync active',
        },
        zones: OFFICIAL_RRB_ZONES,
        exams: DEFAULT_EXAMS,
        cutoffs: DEFAULT_CUTOFFS,
        notices: DEFAULT_NOTICES,
        results: DEFAULT_RESULTS,
        portalLinks: DEFAULT_CANDIDATE_PORTAL_LINKS,
      });
      console.info('✅ Initial Firestore seeding completed successfully.');
    } catch (err) {
      console.warn('Initial seed note (may have existing data or offline mode):', err);
    }
  }

  /* -------------------------------------------------------------
   * NOTICES CRUD
   * -----------------------------------------------------------*/

  public async createNotice(notice: Omit<NoticeItem, 'id'> & { id?: string }): Promise<string> {
    const docId = notice.id || `notice-${Date.now()}`;
    const noticeRef = doc(db, COLLECTIONS.NOTICES, docId);
    await setDoc(noticeRef, {
      ...notice,
      id: docId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docId;
  }

  public async updateNotice(id: string, updates: Partial<NoticeItem>): Promise<void> {
    const noticeRef = doc(db, COLLECTIONS.NOTICES, id);
    await updateDoc(noticeRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }

  public async deleteNotice(id: string): Promise<void> {
    const noticeRef = doc(db, COLLECTIONS.NOTICES, id);
    await deleteDoc(noticeRef);
  }

  /* -------------------------------------------------------------
   * EXAMS CRUD
   * -----------------------------------------------------------*/

  public async createExam(exam: ExamItem): Promise<string> {
    const docId = exam.id || `exam-${Date.now()}`;
    const examRef = doc(db, COLLECTIONS.EXAMS, docId);
    await setDoc(examRef, {
      ...exam,
      id: docId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docId;
  }

  public async updateExam(id: string, updates: Partial<ExamItem>): Promise<void> {
    const examRef = doc(db, COLLECTIONS.EXAMS, id);
    await updateDoc(examRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }

  public async deleteExam(id: string): Promise<void> {
    const examRef = doc(db, COLLECTIONS.EXAMS, id);
    await deleteDoc(examRef);
  }

  /* -------------------------------------------------------------
   * CUTOFFS CRUD
   * -----------------------------------------------------------*/

  public async createCutoff(cutoff: CutoffRecord): Promise<string> {
    const docId = cutoff.id || `cutoff-${Date.now()}`;
    const ref = doc(db, COLLECTIONS.CUTOFFS, docId);
    await setDoc(ref, {
      ...cutoff,
      id: docId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docId;
  }

  public async updateCutoff(id: string, updates: Partial<CutoffRecord>): Promise<void> {
    const ref = doc(db, COLLECTIONS.CUTOFFS, id);
    await updateDoc(ref, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }

  public async deleteCutoff(id: string): Promise<void> {
    const ref = doc(db, COLLECTIONS.CUTOFFS, id);
    await deleteDoc(ref);
  }

  /* -------------------------------------------------------------
   * RESULTS CRUD
   * -----------------------------------------------------------*/

  public async createResult(result: ResultItem): Promise<string> {
    const docId = result.id || `result-${Date.now()}`;
    const ref = doc(db, COLLECTIONS.RESULTS, docId);
    await setDoc(ref, {
      ...result,
      id: docId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docId;
  }

  public async updateResult(id: string, updates: Partial<ResultItem>): Promise<void> {
    const ref = doc(db, COLLECTIONS.RESULTS, id);
    await updateDoc(ref, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }

  public async deleteResult(id: string): Promise<void> {
    const ref = doc(db, COLLECTIONS.RESULTS, id);
    await deleteDoc(ref);
  }

  /* -------------------------------------------------------------
   * CANDIDATE PORTAL LINKS CRUD
   * -----------------------------------------------------------*/

  public async createPortalLink(link: CandidatePortalLink): Promise<string> {
    const docId = link.id || `link-${Date.now()}`;
    const ref = doc(db, COLLECTIONS.PORTAL_LINKS, docId);
    await setDoc(ref, {
      ...link,
      id: docId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docId;
  }

  public async updatePortalLink(id: string, updates: Partial<CandidatePortalLink>): Promise<void> {
    const ref = doc(db, COLLECTIONS.PORTAL_LINKS, id);
    await updateDoc(ref, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }

  public async deletePortalLink(id: string): Promise<void> {
    const ref = doc(db, COLLECTIONS.PORTAL_LINKS, id);
    await deleteDoc(ref);
  }

  /* -------------------------------------------------------------
   * MOCK TESTS, ANSWER KEYS, STUDY MATERIALS CRUD
   * -----------------------------------------------------------*/

  public async createMockTest(test: MockTestItem): Promise<string> {
    const docId = test.id || `mock-${Date.now()}`;
    const ref = doc(db, COLLECTIONS.MOCK_TESTS, docId);
    await setDoc(ref, { ...test, id: docId, createdAt: serverTimestamp() });
    return docId;
  }

  public async getMockTests(): Promise<MockTestItem[]> {
    const snap = await getDocs(collection(db, COLLECTIONS.MOCK_TESTS));
    const list: MockTestItem[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() } as MockTestItem));
    return list;
  }

  public async deleteMockTest(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTIONS.MOCK_TESTS, id));
  }

  public async createAnswerKey(key: AnswerKeyItem): Promise<string> {
    const docId = key.id || `key-${Date.now()}`;
    const ref = doc(db, COLLECTIONS.ANSWER_KEYS, docId);
    await setDoc(ref, { ...key, id: docId, createdAt: serverTimestamp() });
    return docId;
  }

  public async getAnswerKeys(): Promise<AnswerKeyItem[]> {
    const snap = await getDocs(collection(db, COLLECTIONS.ANSWER_KEYS));
    const list: AnswerKeyItem[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() } as AnswerKeyItem));
    return list;
  }

  public async deleteAnswerKey(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTIONS.ANSWER_KEYS, id));
  }

  public async createStudyMaterial(item: StudyMaterialItem): Promise<string> {
    const docId = item.id || `study-${Date.now()}`;
    const ref = doc(db, COLLECTIONS.STUDY_MATERIALS, docId);
    await setDoc(ref, { ...item, id: docId, createdAt: serverTimestamp() });
    return docId;
  }

  public async getStudyMaterials(): Promise<StudyMaterialItem[]> {
    const snap = await getDocs(collection(db, COLLECTIONS.STUDY_MATERIALS));
    const list: StudyMaterialItem[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() } as StudyMaterialItem));
    return list;
  }

  public async deleteStudyMaterial(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTIONS.STUDY_MATERIALS, id));
  }

  /* -------------------------------------------------------------
   * FULL DATABASE PERSISTENCE TO FIRESTORE
   * -----------------------------------------------------------*/

  public async saveFullDatabaseToFirestore(fullDb: FullRRBDatabase): Promise<{ success: boolean; error?: string }> {
    try {
      this.updateStatus({ isLoading: true });

      // Save exams
      for (const exam of fullDb.exams || []) {
        const id = exam.id || `exam-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        await setDoc(doc(db, COLLECTIONS.EXAMS, id), { ...exam, id, updatedAt: serverTimestamp() }, { merge: true });
      }

      // Save notices
      for (const notice of fullDb.notices || []) {
        const id = notice.id || `notice-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        await setDoc(doc(db, COLLECTIONS.NOTICES, id), { ...notice, id, updatedAt: serverTimestamp() }, { merge: true });
      }

      // Save cutoffs
      for (const cutoff of fullDb.cutoffs || []) {
        const id = cutoff.id || `cutoff-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        await setDoc(doc(db, COLLECTIONS.CUTOFFS, id), { ...cutoff, id, updatedAt: serverTimestamp() }, { merge: true });
      }

      // Save results
      for (const result of fullDb.results || []) {
        const id = result.id || `result-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        await setDoc(doc(db, COLLECTIONS.RESULTS, id), { ...result, id, updatedAt: serverTimestamp() }, { merge: true });
      }

      // Save portal links
      for (const link of fullDb.portalLinks || []) {
        const id = link.id || `link-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        await setDoc(doc(db, COLLECTIONS.PORTAL_LINKS, id), { ...link, id, updatedAt: serverTimestamp() }, { merge: true });
      }

      // Save mock tests
      for (const test of fullDb.mockTests || []) {
        const id = test.id || `mock-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        await setDoc(doc(db, COLLECTIONS.MOCK_TESTS, id), { ...test, id, updatedAt: serverTimestamp() }, { merge: true });
      }

      // Save answer keys
      for (const key of fullDb.answerKeys || []) {
        const id = key.id || `key-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        await setDoc(doc(db, COLLECTIONS.ANSWER_KEYS, id), { ...key, id, updatedAt: serverTimestamp() }, { merge: true });
      }

      // Save study materials
      for (const mat of fullDb.studyMaterials || []) {
        const id = mat.id || `mat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        await setDoc(doc(db, COLLECTIONS.STUDY_MATERIALS, id), { ...mat, id, updatedAt: serverTimestamp() }, { merge: true });
      }

      // Save site metadata
      await setDoc(doc(db, COLLECTIONS.SETTINGS, 'general'), {
        metadata: {
          version: `v4-firestore-${Date.now()}`,
          lastUpdated: new Date().toISOString(),
          uploadedBy: 'Portal Admin',
        },
        settings: fullDb.settings || null,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      this.cachedDatabase = { ...fullDb };
      this.notifyDbListeners();
      this.updateStatus({ isLoading: false, lastSyncedAt: new Date().toISOString(), error: null });

      return { success: true };
    } catch (err: any) {
      console.error('Failed to sync full database to Firestore:', err);
      const msg = this.formatErrorMessage(err);
      this.updateStatus({ isLoading: false, error: msg });
      return { success: false, error: msg };
    }
  }

  /**
   * Update portal settings (Live Switch, Maintenance Message, etc.) in Firestore
   */
  public async updatePortalSettings(settings: Partial<SiteSettings>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.SETTINGS, 'general');
    await setDoc(docRef, {
      settings,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    this.cachedDatabase.settings = { ...this.cachedDatabase.settings, ...settings } as SiteSettings;
    this.notifyDbListeners();
  }

  /**
   * Synchronize single read of current Firestore database
   */
  public async fetchFullDatabase(): Promise<FullRRBDatabase> {
    try {
      this.updateStatus({ isLoading: true });

      // Fetch exams
      const examsSnap = await getDocs(collection(db, COLLECTIONS.EXAMS));
      const exams: ExamItem[] = [];
      examsSnap.forEach((d) => exams.push({ id: d.id, ...d.data() } as ExamItem));

      // Fetch notices
      const noticesSnap = await getDocs(collection(db, COLLECTIONS.NOTICES));
      const notices: NoticeItem[] = [];
      noticesSnap.forEach((d) => notices.push({ id: d.id, ...d.data() } as NoticeItem));
      notices.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());

      // Fetch cutoffs
      const cutoffsSnap = await getDocs(collection(db, COLLECTIONS.CUTOFFS));
      const cutoffs: CutoffRecord[] = [];
      cutoffsSnap.forEach((d) => cutoffs.push({ id: d.id, ...d.data() } as CutoffRecord));

      // Fetch results
      const resultsSnap = await getDocs(collection(db, COLLECTIONS.RESULTS));
      const results: ResultItem[] = [];
      resultsSnap.forEach((d) => results.push({ id: d.id, ...d.data() } as ResultItem));

      // Fetch portal links
      const linksSnap = await getDocs(collection(db, COLLECTIONS.PORTAL_LINKS));
      const portalLinks: CandidatePortalLink[] = [];
      linksSnap.forEach((d) => portalLinks.push({ id: d.id, ...d.data() } as CandidatePortalLink));

      // Fetch mock tests
      const mockSnap = await getDocs(collection(db, COLLECTIONS.MOCK_TESTS));
      const mockTests: MockTestItem[] = [];
      mockSnap.forEach((d) => mockTests.push({ id: d.id, ...d.data() } as MockTestItem));

      // Fetch answer keys
      const keysSnap = await getDocs(collection(db, COLLECTIONS.ANSWER_KEYS));
      const answerKeys: AnswerKeyItem[] = [];
      keysSnap.forEach((d) => answerKeys.push({ id: d.id, ...d.data() } as AnswerKeyItem));

      // Fetch study materials
      const studySnap = await getDocs(collection(db, COLLECTIONS.STUDY_MATERIALS));
      const studyMaterials: StudyMaterialItem[] = [];
      studySnap.forEach((d) => studyMaterials.push({ id: d.id, ...d.data() } as StudyMaterialItem));

      // Fetch settings
      let portalSettings: SiteSettings | undefined;
      try {
        const settingsSnap = await getDoc(doc(db, COLLECTIONS.SETTINGS, 'general'));
        if (settingsSnap.exists()) {
          portalSettings = settingsSnap.data()?.settings as SiteSettings;
        }
      } catch {}

      const assembled: FullRRBDatabase = {
        metadata: {
          version: `v4-firestore-${Date.now()}`,
          lastUpdated: new Date().toISOString(),
          uploadedBy: 'Firestore Cloud',
          source: 'rrb-smart-portal Firestore',
        },
        settings: portalSettings,
        zones: OFFICIAL_RRB_ZONES,
        exams: exams.length > 0 ? exams : DEFAULT_EXAMS,
        cutoffs: cutoffs.length > 0 ? cutoffs : DEFAULT_CUTOFFS,
        notices: notices.length > 0 ? notices : DEFAULT_NOTICES,
        results: results.length > 0 ? results : DEFAULT_RESULTS,
        portalLinks: portalLinks.length > 0 ? portalLinks : DEFAULT_CANDIDATE_PORTAL_LINKS,
        mockTests,
        answerKeys,
        studyMaterials,
      };

      this.cachedDatabase = assembled;
      this.notifyDbListeners();
      this.updateStatus({ isLoading: false, isConnected: true, error: null, lastSyncedAt: new Date().toISOString() });
      return assembled;
    } catch (err: any) {
      console.warn('Could not fetch all collections from Firestore, returning cached state:', err);
      this.updateStatus({ isLoading: false, error: this.formatErrorMessage(err) });
      return this.cachedDatabase;
    }
  }

  /* -------------------------------------------------------------
   * AUTHENTICATION & ADMIN AUTHORIZATION LAYER (Tasks 11 & 12)
   * -----------------------------------------------------------*/

  /**
   * Verify if a user is an authorized admin.
   * Checks token claims, Firestore admins collection, or known master emails.
   */
  public async isUserAdmin(user: User | null): Promise<boolean> {
    if (!user) return false;

    // 1. Check known authorized master emails
    if (user.email && KNOWN_ADMIN_EMAILS.has(user.email.toLowerCase())) {
      // Ensure admin document exists in Firestore
      try {
        const adminDocRef = doc(db, COLLECTIONS.ADMINS, user.uid);
        await setDoc(adminDocRef, {
          uid: user.uid,
          email: user.email,
          role: 'admin',
          grantedAt: serverTimestamp(),
        }, { merge: true });
      } catch {}
      return true;
    }

    // 2. Check token custom claims
    try {
      const idTokenResult = await user.getIdTokenResult();
      if (idTokenResult.claims.admin === true || idTokenResult.claims.role === 'admin') {
        return true;
      }
    } catch {}

    // 3. Check Firestore admins collection
    try {
      const adminDoc = await getDoc(doc(db, COLLECTIONS.ADMINS, user.uid));
      if (adminDoc.exists() && adminDoc.data()?.role === 'admin') {
        return true;
      }
      if (user.email) {
        const adminEmailDoc = await getDoc(doc(db, COLLECTIONS.ADMINS, user.email.toLowerCase()));
        if (adminEmailDoc.exists() && adminEmailDoc.data()?.role === 'admin') {
          return true;
        }
      }
    } catch {}

    return false;
  }

  /**
   * Register or update user profile document in Firestore `users` collection
   */
  public async syncUserProfile(user: User, role: 'student' | 'admin' = 'student'): Promise<void> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'Candidate',
        photoURL: user.photoURL || null,
        role,
        lastActiveAt: serverTimestamp(),
      }, { merge: true });
    } catch (e) {
      console.warn('Failed to sync user profile in Firestore:', e);
    }
  }
}

// Export singleton instance
export const firestoreService = new FirestoreDatabaseService();
